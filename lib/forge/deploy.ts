/**
 * Forge: Deploy
 * Uploads assembled HTML bundles for tool serving at /t/[slug].
 */

import { randomUUID } from 'crypto';
import { getDb } from '@/lib/db';
import type { ToolConfig } from './generate';

export interface DeployResult {
  slug: string;
  url: string;
  kvKey: string;
  sizeBytes: number;
  deployedAt: string;
  toolId?: string;
}

export interface DeployPersistenceOptions {
  title: string;
  description: string;
  prompt: string;
  category: string;
  config: ToolConfig;
  modelUsed?: string;
  creatorId?: string | null;
}

export interface DeployOptions {
  /** The assembled HTML bundle to deploy */
  html: string;
  /** Optional slug override (auto-generated if omitted) */
  slug?: string;
  /** CF account ID — reads from CLOUDFLARE_ACCOUNT_ID env */
  accountId?: string;
  /** CF API token — reads from CLOUDFLARE_API_TOKEN env */
  apiToken?: string;
  /** KV namespace ID — reads from CLOUDFLARE_KV_NAMESPACE_ID env */
  kvNamespaceId?: string;
  /** Base URL for generated tool links */
  baseUrl?: string;
  /** Persist deployed output to DB tools/tool_configs */
  persist?: DeployPersistenceOptions;
}

/**
 * Generate a short, URL-safe slug for a tool.
 * Format: t-{timestamp36}-{random4}
 */
export function generateSlug(): string {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 6);
  return `t-${ts}-${rand}`;
}

/**
 * Deploy an assembled HTML bundle to Cloudflare KV.
 *
 * In production, writes to Cloudflare KV via REST API.
 * In development, returns a local preview result.
 */
export async function deploy(opts: DeployOptions): Promise<DeployResult> {
  const slug = opts.slug || generateSlug();
  const accountId = opts.accountId || process.env.CLOUDFLARE_ACCOUNT_ID;
  const apiToken = opts.apiToken || process.env.CLOUDFLARE_API_TOKEN;
  const kvNamespaceId = opts.kvNamespaceId || process.env.CLOUDFLARE_KV_NAMESPACE_ID;
  const baseUrl = opts.baseUrl || process.env.AGENTDOOM_BASE_URL || 'https://agentdoom.ai';

  const result: DeployResult = {
    slug,
    url: `${baseUrl}/t/${slug}`,
    kvKey: slug,
    sizeBytes: new TextEncoder().encode(opts.html).length,
    deployedAt: new Date().toISOString(),
  };

  // Dev mode — no CF credentials, return local result
  if (!accountId || !apiToken || !kvNamespaceId) {
    await maybePersistToDb(opts, result);
    return result;
  }

  // Production — write to Cloudflare KV via REST API
  const kvUrl = `https://api.cloudflare.com/client/v4/accounts/${accountId}/storage/kv/namespaces/${kvNamespaceId}/values/${slug}`;

  const response = await fetch(kvUrl, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${apiToken}`,
      'Content-Type': 'text/html',
    },
    body: opts.html,
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Cloudflare KV deploy failed (${response.status}): ${body}`);
  }

  await maybePersistToDb(opts, result);
  return result;
}

async function maybePersistToDb(opts: DeployOptions, result: DeployResult): Promise<void> {
  if (!opts.persist) {
    return;
  }

  const sql = getDb();
  const toolId = randomUUID();
  const primitivesUsed = opts.persist.config.primitives.map((p) => p.type);

  await sql`
    INSERT INTO tools (
      id, slug, title, description, prompt, creator_id, category,
      status, is_paid, price_cents, deploy_url, preview_html, generation_time_ms
    )
    VALUES (
      ${toolId}::uuid, ${result.slug}, ${opts.persist.title}, ${opts.persist.description},
      ${opts.persist.prompt}, ${opts.persist.creatorId ?? null}::uuid, ${opts.persist.category},
      'active', false, 0, ${result.url}, ${opts.html}, null
    )
    ON CONFLICT (slug) DO UPDATE SET
      title = EXCLUDED.title,
      description = EXCLUDED.description,
      prompt = EXCLUDED.prompt,
      creator_id = EXCLUDED.creator_id,
      category = EXCLUDED.category,
      deploy_url = EXCLUDED.deploy_url,
      preview_html = EXCLUDED.preview_html,
      updated_at = now()
  `;

  const toolRows = (await sql`
    SELECT id FROM tools WHERE slug = ${result.slug} LIMIT 1
  `) as Array<{ id: string }>;
  const persistedToolId = toolRows[0]?.id;
  if (!persistedToolId) {
    throw new Error(`Failed to persist tool for slug ${result.slug}`);
  }

  result.toolId = persistedToolId;

  await sql`
    UPDATE tool_configs SET is_current = false WHERE tool_id = ${persistedToolId}::uuid
  `;

  await sql`
    INSERT INTO tool_configs (tool_id, config, primitives_used, model_used, is_current)
    VALUES (
      ${persistedToolId}::uuid,
      ${JSON.stringify(opts.persist.config)}::jsonb,
      ${primitivesUsed},
      ${opts.persist.modelUsed ?? 'forge'},
      true
    )
  `;
}
