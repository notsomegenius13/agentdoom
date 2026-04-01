/**
 * AgentDoom Tool Hosting Worker
 *
 * Serves generated tool bundles from KV storage.
 * URL format: /t/[slug]
 *
 * Each tool is a self-contained React bundle stored as HTML in KV.
 */

export interface Env {
  TOOL_BUNDLES: KVNamespace;
  ENVIRONMENT: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    // Health check
    if (path === '/health') {
      return new Response(JSON.stringify({ status: 'ok', env: env.ENVIRONMENT }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Tool route: /t/[slug]
    const toolMatch = path.match(/^\/t\/([a-z0-9-]+)\/?$/);
    if (!toolMatch) {
      return new Response('Not Found', { status: 404 });
    }

    const slug = toolMatch[1];

    // Fetch the tool bundle from KV
    const bundle = await env.TOOL_BUNDLES.get(slug, 'text');
    if (!bundle) {
      return new Response('Tool not found', { status: 404 });
    }

    return new Response(bundle, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=3600',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
      },
    });
  },
};
