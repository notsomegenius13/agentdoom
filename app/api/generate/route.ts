import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { runPipeline } from '@/lib/forge/pipeline';
import { filterPrompt } from '@/lib/shield/prompt-filter';
import { validatePromptInput, validateRequestBody } from '@/lib/shield/input-validator';
import {
  checkIpRateLimit,
  checkRateLimit,
  rateLimitHeaders,
  rateLimitResponse,
  logRateLimitHit,
  isAdminRequest,
} from '@/lib/shield/rate-limiter';
import { getDb } from '@/lib/db';

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  // Body size check
  const contentLength = req.headers.get('content-length');
  const bodyCheck = validateRequestBody(contentLength ? parseInt(contentLength, 10) : null);
  if (!bodyCheck.valid) {
    return new Response(JSON.stringify({ error: bodyCheck.error }), {
      status: 413,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Admin bypass — skip all rate limits
  if (isAdminRequest(req.headers.get('authorization'))) {
    // fall through to generation with no rate checks
  } else {
    // IP rate limiting (applies to all non-admin requests)
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const ipCheck = await checkIpRateLimit(ip, 'generate');
    if (!ipCheck.allowed) {
      await logRateLimitHit(ip, 'generate', 'ip');
      return rateLimitResponse('Rate limit exceeded. Please try again later.', ipCheck);
    }
  }

  const { prompt: rawPrompt, isPro } = await req.json();
  const session = await getServerSession(authOptions);
  const userId = (session?.user as Record<string, unknown> | undefined)?.id as string | undefined;

  // Skip user-tier limits for admin requests
  if (!isAdminRequest(req.headers.get('authorization'))) {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';

    if (userId) {
      // Authenticated user: free (10/hr) or pro (100/hr)
      const tier = isPro ? 'pro' : 'free';
      const userCheck = await checkRateLimit(userId, tier);
      if (!userCheck.allowed) {
        await logRateLimitHit(userId, 'generate', tier);
        const msg = isPro
          ? 'Generation limit reached (100/hour). Please try again later.'
          : 'Generation limit reached (10/hour). Upgrade to Pro for higher limits.';
        return rateLimitResponse(msg, userCheck);
      }
    } else {
      // Anonymous: 3 generations/hour per IP
      const anonCheck = await checkRateLimit(ip, 'anonymous');
      if (!anonCheck.allowed) {
        await logRateLimitHit(ip, 'generate', 'anonymous');
        return rateLimitResponse(
          'Free generation limit reached (3/hour). Sign in for higher limits.',
          anonCheck,
        );
      }
    }
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

  // Prompt filter (keyword blocklist + injection detection)
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

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: Record<string, unknown>) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      try {
        const result = await runPipeline({
          prompt,
          fastMode: true, // skip Playwright in API context for speed
          retryOnFailure: true,
          onProgress: (event) => {
            const stageMap: Record<string, string> = {
              classify: 'classifying',
              generate: 'generating',
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
            // Send preview HTML when assembly completes
            if (event.stage === 'assemble' && event.data?.html) {
              data.preview = event.data.html;
            }
            send(data);
          },
        });

        // Send preview HTML
        send({ preview: result.html, line: 'Preview ready' });

        // Send validation summary
        if (result.validation.overallVerdict === 'fail') {
          send({
            stage: 'validating',
            line: `Warning: validation failed at ${result.validation.retryContext?.failedStage || 'unknown'} stage`,
            validationWarning: true,
          });
        }

        // Send moderation result
        if (result.moderation.verdict !== 'pass') {
          send({
            stage: 'moderating',
            line: `Content moderation: ${result.moderation.verdict} (risk: ${result.moderation.riskScore}/100)`,
            moderation: result.moderation.verdict,
            moderationFlags: result.moderation.flags
              .filter((f) => f.category !== 'clean')
              .map((f) => f.category),
          });
        }

        // Final result
        send({
          stage: 'done',
          url: result.url,
          timing: result.timing,
          validation: result.validation.overallVerdict,
          moderation: result.moderation.verdict,
        });

        // Log generation to analytics
        try {
          const sql = getDb();
          await sql`
            INSERT INTO generations (user_id, prompt, category, complexity_score, primitives_selected, model_used, model_latency_ms, validation_passed, tool_id)
            VALUES (
              ${userId ?? null}::uuid,
              ${prompt},
              ${result.classification.category},
              ${result.classification.complexity},
              ${result.config.primitives.map((p: { type: string }) => p.type)},
              ${'sonnet'},
              ${result.timing.totalMs},
              ${result.validation.overallVerdict !== 'fail'},
              ${null}
            )
          `;
        } catch (logErr) {
          console.error('Failed to log generation:', logErr);
        }

        // Log moderation result to audit trail
        try {
          const sql = getDb();
          await sql`
            INSERT INTO moderation_logs (verdict, risk_score, flags, model_used, duration_ms)
            VALUES (
              ${result.moderation.verdict},
              ${result.moderation.riskScore},
              ${JSON.stringify(result.moderation.flags)},
              ${result.moderation.model},
              ${result.moderation.durationMs}
            )
          `;
        } catch (logErr) {
          console.error('Failed to log moderation result:', logErr);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        console.error('Generation error:', err);
        send({ stage: 'error', line: `Error: ${message}` });

        // Log failed generation
        try {
          const sql = getDb();
          await sql`
            INSERT INTO generations (user_id, prompt, model_used, validation_passed, error_message)
            VALUES (${userId ?? null}::uuid, ${prompt}, ${'sonnet'}, ${false}, ${message})
          `;
        } catch (logErr) {
          console.error('Failed to log generation error:', logErr);
        }
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
