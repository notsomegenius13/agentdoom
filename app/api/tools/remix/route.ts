import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { runRemixPipeline } from '@/lib/forge/pipeline';
import { getDb } from '@/lib/db';
import { filterPrompt } from '@/lib/shield/prompt-filter';
import { validatePromptInput, validateRequestBody } from '@/lib/shield/input-validator';
import { checkIpRateLimit, rateLimitHeaders } from '@/lib/shield/rate-limiter';
import type { ToolConfig } from '@/lib/forge/generate';
import { randomUUID } from 'crypto';

export const maxDuration = 30;

/**
 * POST /api/tools/remix — AI-powered remix
 *
 * Body:
 *   sourceToolId: string — the original tool's ID
 *   prompt: string — natural language description of desired changes
 *
 * Returns: SSE stream with stage updates, preview, and final deployed URL.
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  // Body size check
  const contentLength = req.headers.get('content-length');
  const bodyCheck = validateRequestBody(contentLength ? parseInt(contentLength, 10) : null);
  if (!bodyCheck.valid) {
    return new Response(JSON.stringify({ error: bodyCheck.error }), {
      status: 413,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // IP rate limiting
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const rateCheck = await checkIpRateLimit(ip, 'generate');
  if (!rateCheck.allowed) {
    return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
      status: 429,
      headers: { 'Content-Type': 'application/json', ...rateLimitHeaders(rateCheck) },
    });
  }

  const body = await req.json();
  const { sourceToolId, prompt: rawPrompt } = body as {
    sourceToolId: string;
    prompt: string;
  };

  if (!sourceToolId || !rawPrompt) {
    return new Response(JSON.stringify({ error: 'sourceToolId and prompt are required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Input validation & sanitization
  const validation = validatePromptInput(rawPrompt);
  if (!validation.valid) {
    return new Response(JSON.stringify({ error: validation.errors.join('; ') }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  const prompt = validation.sanitized;

  // Prompt filter
  const filterResult = filterPrompt(prompt);
  if (!filterResult.allowed) {
    return new Response(
      JSON.stringify({ error: filterResult.reason, category: filterResult.category }),
      {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }

  // Fetch source tool config from DB
  const sql = getDb();

  // Resolve authenticated user ID if session exists
  let creatorId: string | null = null;
  if (session?.user?.email) {
    const userRows =
      (await sql`SELECT id FROM users WHERE email = ${session.user.email} LIMIT 1`) as Record<
        string,
        unknown
      >[];
    if (userRows[0]) creatorId = userRows[0].id as string;
  }

  const toolRows = (await sql`
    SELECT t.id, t.category, t.title, t.description
    FROM tools t WHERE t.id::text = ${sourceToolId}
  `) as Record<string, unknown>[];

  if (toolRows.length === 0) {
    return new Response(JSON.stringify({ error: 'Source tool not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const sourceTool = toolRows[0];

  const configRows = (await sql`
    SELECT config FROM tool_configs
    WHERE tool_id::text = ${sourceToolId} AND is_current = true
    LIMIT 1
  `) as Record<string, unknown>[];

  if (configRows.length === 0) {
    return new Response(JSON.stringify({ error: 'Source tool config not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const sourceConfig = configRows[0].config as ToolConfig;

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: Record<string, unknown>) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      try {
        const result = await runRemixPipeline({
          sourceConfig,
          modificationPrompt: prompt,
          sourceToolId,
          category: sourceTool.category as string,
          fastMode: true,
          retryOnFailure: true,
          onProgress: (event) => {
            const stageMap: Record<string, string> = {
              classify: 'classifying',
              generate: 'remixing',
              assemble: 'assembling',
              validate: 'validating',
              moderate: 'moderating',
              deploy: 'deploying',
              done: 'done',
              error: 'error',
            };
            const data: Record<string, unknown> = {
              stage: stageMap[event.stage] || event.stage,
              line: event.message,
            };
            if (event.stage === 'assemble' && event.data?.html) {
              data.preview = event.data.html;
            }
            send(data);
          },
        });

        // Send preview HTML
        send({ preview: result.html, line: 'Preview ready' });

        // Persist the remixed tool to DB
        if (result.url) {
          const newToolId = randomUUID();
          const primitivesUsed = result.config.primitives.map((p) => p.type);

          await sql`
            INSERT INTO tools (id, slug, title, description, prompt, category, preview_html, remixed_from, deploy_url, generation_time_ms, creator_id, status)
            VALUES (${newToolId}, ${result.slug}, ${result.config.title}, ${result.config.description},
                    ${`AI remix of "${sourceTool.title}": ${prompt}`},
                    ${sourceTool.category}, ${result.html}, ${sourceToolId}::uuid, ${result.url},
                    ${result.timing.totalMs}, ${creatorId}, 'active')
          `;

          await sql`
            INSERT INTO tool_configs (tool_id, config, primitives_used, model_used, is_current)
            VALUES (${newToolId}::uuid, ${JSON.stringify(result.config)}::jsonb, ${primitivesUsed}, 'remix-sonnet', true)
          `;

          // Increment remix count on source tool
          await sql`
            UPDATE tools SET remixes_count = remixes_count + 1 WHERE id::text = ${sourceToolId}
          `;

          send({
            stage: 'done',
            url: result.url,
            toolId: newToolId,
            sourceToolId,
            timing: result.timing,
            validation: result.validation.overallVerdict,
            moderation: result.moderation.verdict,
          });
        } else {
          // Moderation blocked — no URL
          send({
            stage: 'done',
            url: '',
            blocked: true,
            timing: result.timing,
            moderation: result.moderation.verdict,
          });
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        console.error('Remix error:', err);
        send({ stage: 'error', line: `Error: ${message}` });
      } finally {
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
