import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

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
const TEASER_MODE = process.env.TEASER_MODE !== 'false';

function isTeaserAllowedPath(pathname: string): boolean {
  return (
    pathname === '/' ||
    pathname === '/feed' ||
    pathname.startsWith('/feed/') ||
    pathname === '/marketplace' ||
    pathname.startsWith('/marketplace/') ||
    pathname === '/create-tool' ||
    pathname.startsWith('/create-tool/') ||
    pathname.startsWith('/t/') ||
    pathname.startsWith('/api/og/') ||
    pathname === '/api/waitlist' ||
    pathname === '/admin/login' ||
    pathname.startsWith('/api/auth/') ||
    pathname.startsWith('/sign-in') ||
    pathname.startsWith('/sign-up')
  );
}

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
  const authHeader = request.headers.get('authorization');
  const adminKey = process.env.ADMIN_API_KEY;
  if (adminKey && authHeader) {
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
    if (token === adminKey) return null;
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

// Protected routes requiring authentication
const PROTECTED_PREFIXES = ['/dashboard', '/admin'];
const PROTECTED_EXACT = ['/create-tool'];

function isProtectedRoute(pathname: string): boolean {
  if (PROTECTED_EXACT.includes(pathname)) return true;
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix + '/'),
  );
}

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // API rate limiting
  if (pathname.startsWith('/api/')) {
    const rateLimitResponse = applyApiRateLimit(request);
    if (rateLimitResponse) return rateLimitResponse;
  }

  // Teaser mode: only allowed paths are accessible to unauthenticated users
  if (TEASER_MODE && !pathname.startsWith('/api/') && !isTeaserAllowedPath(pathname)) {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!token?.email) {
      return NextResponse.redirect(new URL('/', request.url));
    }
    // Allow users who have been granted access (via waitlist grant or admin)
    if (token.grantedAccess || token.isAdmin) {
      return NextResponse.next();
    }
    // Fall back to ADMIN_EMAILS env check (for users who signed in before grantedAccess claim existed)
    const adminEmails = getAdminEmails();
    if (adminEmails.size > 0 && adminEmails.has((token.email as string).toLowerCase())) {
      return NextResponse.next();
    }
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Protect specific routes (require any authenticated user)
  if (!TEASER_MODE && isProtectedRoute(pathname)) {
    // Skip /admin/login itself
    if (pathname === '/admin/login') return NextResponse.next();
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!token) {
      const url = new URL('/sign-in', request.url);
      url.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
