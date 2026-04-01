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
 */
const ipHits = new Map<string, { count: number; resetAt: number }>();
const API_IP_LIMIT = 60;
const API_WINDOW_MS = 60_000;

function checkApiIpLimit(ip: string): { allowed: boolean; retryAfter: number } {
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

export default async function middleware(request: NextRequest) {
  // --- API rate limiting (60 req/min per IP) ---
  if (request.nextUrl.pathname.startsWith('/api/')) {
    // Admin bypass
    const authHeader = request.headers.get('authorization');
    const adminKey = process.env.ADMIN_API_KEY;
    if (adminKey && authHeader) {
      const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
      if (token === adminKey) {
        // Admin — skip rate limiting, continue to Clerk
        return clerkConfigured ? await runClerkMiddleware(request) : NextResponse.next();
      }
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
  }

  if (!clerkConfigured) {
    return NextResponse.next();
  }

  return runClerkMiddleware(request);
}

async function runClerkMiddleware(request: NextRequest) {
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
    '/pricing(.*)',
    '/launch(.*)',
    '/creators(.*)',
    '/tools/(.*)',
    '/create-tool(.*)',
    '/checkout(.*)',
    '/sign-in(.*)',
    '/sign-up(.*)',
  ]);

  const handler = clerkMiddleware(async (auth, req) => {
    if (!isPublicRoute(req)) {
      // Allow unauthenticated GET requests to /api/tools (public reads)
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
