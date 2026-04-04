import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

/**
 * GET /api/profile/:username — Fetch a creator's public profile
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ username: string }> },
) {
  try {
    const { username } = await params;
    const sql = getDb();

    const rows = (await sql`
      SELECT
        id, username, display_name, avatar_url, bio,
        is_verified, is_pro, tools_created, created_at
      FROM users
      WHERE username = ${username}
    `) as Record<string, unknown>[];

    const row = rows[0];
    if (!row) {
      return NextResponse.json({ error: 'Creator not found' }, { status: 404 });
    }

    return NextResponse.json({
      id: row.id,
      username: row.username,
      displayName: row.display_name,
      avatarUrl: row.avatar_url,
      bio: row.bio,
      isVerified: row.is_verified,
      isPro: row.is_pro,
      toolsCreated: row.tools_created,
      followersCount: 0,
      stripeChargesEnabled: false,
      createdAt: row.created_at ? String(row.created_at) : null,
    });
  } catch (error) {
    console.error('[profile] GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}
