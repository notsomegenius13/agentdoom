import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

function getAdminEmails(): Set<string> {
  const raw = process.env.ADMIN_EMAILS || '';
  return new Set(
    raw
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean),
  );
}

async function requireAdmin(req: NextRequest): Promise<NextResponse | null> {
  const session = await getServerSession(authOptions);
  const adminEmails = getAdminEmails();
  if (!session?.user?.email || !adminEmails.has(session.user.email.toLowerCase())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return null;
}

/**
 * GET /api/admin/waitlist — List all waitlist entries with grant status.
 */
export async function GET(req: NextRequest) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  try {
    const sql = getDb();
    // Ensure column exists (safe to run repeatedly)
    await sql`ALTER TABLE waitlist ADD COLUMN IF NOT EXISTS granted_at TIMESTAMPTZ`;

    const rows = await sql`
      SELECT id, email, granted_at, created_at
      FROM waitlist
      ORDER BY created_at DESC
    `;

    return NextResponse.json({
      total: rows.length,
      granted: rows.filter((r: Record<string, unknown>) => r.granted_at).length,
      entries: rows.map((r: Record<string, unknown>) => ({
        id: r.id,
        email: r.email,
        grantedAt: r.granted_at ?? null,
        createdAt: r.created_at,
      })),
    });
  } catch (error) {
    console.error('[admin/waitlist] GET error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

/**
 * POST /api/admin/waitlist — Grant or revoke access for an email.
 *
 * Body: { email: string, action: 'grant' | 'revoke' }
 */
export async function POST(req: NextRequest) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  try {
    const { email, action } = await req.json();
    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'email is required' }, { status: 400 });
    }
    if (action !== 'grant' && action !== 'revoke') {
      return NextResponse.json({ error: 'action must be grant or revoke' }, { status: 400 });
    }

    const normalized = email.toLowerCase().trim();
    const sql = getDb();

    if (action === 'grant') {
      const result = await sql`
        UPDATE waitlist
        SET granted_at = now()
        WHERE email = ${normalized}
        RETURNING id, email, granted_at
      `;
      if (result.length === 0) {
        return NextResponse.json({ error: 'Email not found in waitlist' }, { status: 404 });
      }
      return NextResponse.json({ ok: true, entry: result[0] });
    } else {
      await sql`
        UPDATE waitlist
        SET granted_at = NULL
        WHERE email = ${normalized}
      `;
      return NextResponse.json({ ok: true, email: normalized, action: 'revoked' });
    }
  } catch (error) {
    console.error('[admin/waitlist] POST error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
