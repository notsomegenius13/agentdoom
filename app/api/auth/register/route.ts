import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getDb } from '@/lib/db';

function slugifyUsername(email: string): string {
  return email
    .split('@')[0]
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .slice(0, 20);
}

export async function POST(req: NextRequest) {
  try {
    const { email, password } = (await req.json()) as { email?: string; password?: string };

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 },
      );
    }

    const emailLower = email.toLowerCase().trim();
    const sql = getDb();

    const existing = (await sql`
      SELECT id FROM users WHERE email = ${emailLower} LIMIT 1
    `) as Record<string, unknown>[];

    if (existing.length > 0) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 },
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    // Generate a unique username from email
    const baseUsername = slugifyUsername(emailLower) || 'user';
    let username = baseUsername;
    let suffix = 1;
    while (true) {
      const taken = (await sql`
        SELECT id FROM users WHERE username = ${username} LIMIT 1
      `) as Record<string, unknown>[];
      if (taken.length === 0) break;
      username = `${baseUsername}${suffix++}`;
    }

    await sql`
      INSERT INTO users (email, password_hash, username, display_name)
      VALUES (${emailLower}, ${passwordHash}, ${username}, ${username})
    `;

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[register] error:', error);
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 });
  }
}
