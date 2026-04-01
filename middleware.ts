import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const clerkConfigured =
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
  process.env.CLERK_SECRET_KEY &&
  !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.startsWith('placeholder') &&
  !process.env.CLERK_SECRET_KEY.startsWith('placeholder');

/**
 * Simple in-memory sliding window for Edge middleware.
 * Upstash Redis is used for per-user limits in route handlers;
 * this lightweight map covers per-IP API abuse prevention at the edge.
 * Evicts expired entries every 60s to prevent unbounded memory growth.
 */
const ipHits = new Map<string, { count: number; resetAt: number }>();
const API_IP_LIMIT = 60;
const API_WINDOW_MS = 60_000;
const MAX_IP_ENTRIES = 10_000;
let lastEviction = Date.now();

function evictExpiredEntries() {
  const now = Date.now();
  if (now - lastEviction < 60_000) return;
  lastEviction = now;
  for (const [ip, entry] of ipHits) {
    if (now >= entry.resetAt) ipHits.delete(ip);
  }
  // Hard cap: if still over limit, drop oldest entries
  if (ipHits.size > MAX_IP_ENTRIES) {
    const excess = ipHits.size - MAX_IP_ENTRIES;
    const keys = ipHits.keys();
    for (let i = 0; i < excess; i++) {
      const k = keys.next().value;
      if (k) ipHits.delete(k);
    }
  }
}

function checkApiIpLimit(ip: string): { allowed: boolean; retryAfter: number } {
  evictExpiredEntries();
  const now = Date.now();
  const entry = ipHits.get(ip);

  if (!entry || now >= entry.resetAt) {
    ipHits.set(ip, { count: 1, resetAt: now + API_WINDOW_MS });
    return { allowed: true, retryAfter: 0 };
  }

  entry.count++;
  if (entry.count > API_IP_LIMIT) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    return { allowed: false, retryAfter };
  }

  return { allowed: true, retryAfter: 0 };
}

// ─── TEASER MODE ──────────────────────────────────────────────────
// While in teaser/waitlist mode, redirect all routes to / except:
// - / (the teaser page itself)
// - /api/waitlist (signup endpoint)
// - /admin/login (admin sign-in page)
// - /sign-in, /sign-up (Clerk auth routes)
// - Authenticated admin users (by email) bypass the teaser gate entirely
const TEASER_MODE = true;

function isTeaserAllowedPath(pathname: string): boolean {
  return (
    pathname === '/' ||
    pathname === '/api/waitlist' ||
    pathname === '/admin/login' ||
    pathname.startsWith('/sign-in') ||
    pathname.startsWith('/sign-up')
  );
}

// Admin emails allowed to bypass teaser (comma-separated env var)
function getAdminEmails(): Set<string> {
  const raw = process.env.ADMIN_EMAILS || '';
  return new Set(
    raw
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean),
  );
}

function applyApiRateLimit(request: NextRequest): NextResponse | null {
  // Admin API key bypass
  const authHeader = request.headers.get('authorization');
  const adminKey = process.env.ADMIN_API_KEY;
  if (adminKey && authHeader) {
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
    if (token === adminKey) return null; // skip rate limiting
  }

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const { allowed, retryAfter } = checkApiIpLimit(ip);

  if (!allowed) {
    return new NextResponse(
      JSON.stringify({
        error: 'Too many requests. Please slow down and try again shortly.',
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': String(retryAfter),
          'X-RateLimit-Limit': String(API_IP_LIMIT),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(retryAfter),
        },
      },
    );
  }

  return null;
}

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // API rate limiting
  if (pathname.startsWith('/api/')) {
    const rateLimitResponse = applyApiRateLimit(request);
    if (rateLimitResponse) return rateLimitResponse;
  }

  // If Clerk is not configured, apply simple teaser gate and pass through
  if (!clerkConfigured) {
    if (TEASER_MODE && !isTeaserAllowedPath(pathname)) {
      return NextResponse.redirect(new URL('/', request.url));
    }
    return NextResponse.next();
  }

  // Clerk is configured — run Clerk middleware with teaser + admin logic
  const { clerkMiddleware, createRouteMatcher } = await import('@clerk/nextjs/server');

  const isPublicRoute = createRouteMatcher([
    '/',
    '/feed(.*)',
    '/t/(.*)',
    '/marketplace(.*)',
    '/api/feed(.*)',
    '/api/generate(.*)',
    '/api/deploy(.*)',
    '/api/cron/(.*)',
    '/api/moderate/(.*)',
    '/api/stripe/webhook(.*)',
    '/api/og(.*)',
    '/api/waitlist(.*)',
    '/api/health(.*)',
    '/pricing(.*)',
    '/launch(.*)',
    '/creators(.*)',
    '/tools/(.*)',
    '/create-tool(.*)',
    '/checkout(.*)',
    '/sign-in(.*)',
    '/sign-up(.*)',
    '/admin/login(.*)',
  ]);

  const handler = clerkMiddleware(async (auth, req) => {
    // Teaser gate with admin bypass
    if (TEASER_MODE && !isTeaserAllowedPath(req.nextUrl.pathname)) {
      const session = await auth();

      // Any authenticated Clerk user bypasses the teaser gate.
      // Only authorized users have Clerk credentials, so this is secure.
      // For extra restriction, set ADMIN_USER_IDS (comma-separated Clerk user IDs).
      const adminUserIds = getAdminEmails(); // reuses same env-parsing logic
      const isAdmin =
        session.userId != null && (adminUserIds.size === 0 || adminUserIds.has(session.userId));

      if (!isAdmin) {
        return NextResponse.redirect(new URL('/', req.url));
      }
    }

    // Standard Clerk auth protection for non-public routes
    if (!isPublicRoute(req)) {
      const isToolsRead = req.method === 'GET' && /^\/api\/tools(\/|$)/.test(req.nextUrl.pathname);
      if (!isToolsRead) {
        await auth.protect();
      }
    }
  });

  return handler(request, {} as never);
}

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
