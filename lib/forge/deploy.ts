/**
 * Forge: Deploy
 * Uploads assembled HTML bundles for tool serving at /t/[slug].
 */

export interface DeployResult {
  slug: string;
  url: string;
  kvKey: string;
  sizeBytes: number;
  deployedAt: string;
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

  return result;
}
