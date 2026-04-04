import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { Resend } from 'resend';

const BASE_COUNT = 847;

function getDb() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error('DATABASE_URL not set');
  return neon(databaseUrl);
}

function getResend() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  return new Resend(apiKey);
}

async function sendConfirmationEmail(email: string, position: number) {
  const resend = getResend();
  if (!resend) {
    console.log(`[WAITLIST_EMAIL_SKIP] No RESEND_API_KEY — skipping confirmation for ${email}`);
    return;
  }

  try {
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'AgentDoom <onboarding@resend.dev>',
      to: email,
      subject: "You're on the AgentDoom waitlist",
      html: `
        <div style="font-family: monospace; background: #050505; color: #e0e0e0; padding: 48px 24px; text-align: center;">
          <div style="max-width: 480px; margin: 0 auto;">
            <div style="width: 48px; height: 48px; border: 1px solid rgba(255,255,255,0.08); margin: 0 auto 32px; display: flex; align-items: center; justify-content: center;">
              <div style="width: 12px; height: 12px; background: rgba(255,255,255,0.2);"></div>
            </div>
            <h1 style="font-size: 28px; font-weight: 300; letter-spacing: 0.15em; text-transform: uppercase; color: rgba(255,255,255,0.9); margin: 0 0 24px;">
              AgentDoom
            </h1>
            <p style="font-size: 14px; color: rgba(255,255,255,0.5); letter-spacing: 0.1em; margin: 0 0 32px;">
              You're in. Position #${position}.
            </p>
            <div style="border-top: 1px solid rgba(255,255,255,0.08); padding-top: 24px; margin-top: 24px;">
              <p style="font-size: 12px; color: rgba(255,255,255,0.25); letter-spacing: 0.2em; text-transform: uppercase;">
                Something is being built.
              </p>
              <p style="font-size: 11px; color: rgba(255,255,255,0.15); margin-top: 8px;">
                April 6, 2026 &mdash; agentdoom.ai
              </p>
            </div>
          </div>
        </div>
      `,
    });
    console.log(`[WAITLIST_EMAIL_SENT] ${email}`);
  } catch (err) {
    console.error(`[WAITLIST_EMAIL_ERROR] ${email}:`, err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    const normalized = email.toLowerCase().trim();
    const sql = getDb();

    const existing = await sql`SELECT id FROM waitlist WHERE email = ${normalized}`;
    if (existing.length > 0) {
      const [{ count: totalCount }] = await sql`SELECT COUNT(*)::int AS count FROM waitlist`;
      return NextResponse.json({
        message: 'Already on the waitlist',
        email: normalized,
        count: BASE_COUNT + totalCount,
      });
    }

    await sql`INSERT INTO waitlist (email) VALUES (${normalized})`;
    const [{ count: totalCount }] = await sql`SELECT COUNT(*)::int AS count FROM waitlist`;
    const position = BASE_COUNT + totalCount;

    console.log(
      `[WAITLIST_SIGNUP] ${normalized} | position=${totalCount} | ts=${new Date().toISOString()}`
    );

    // Fire-and-forget confirmation email
    sendConfirmationEmail(normalized, position).catch(() => {});

    return NextResponse.json({
      message: 'Welcome to the waitlist',
      email: normalized,
      position,
      count: position,
    });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const sql = getDb();
    const [{ count: totalCount }] = await sql`SELECT COUNT(*)::int AS count FROM waitlist`;
    return NextResponse.json({ count: BASE_COUNT + totalCount });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
