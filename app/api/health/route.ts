import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

/**
 * GET /api/health — Lightweight health check endpoint
 * Returns 200 if the app is running and can reach the database.
 * Returns 503 if the database is unreachable.
 */
export async function GET() {
  const checks: Record<string, 'ok' | 'fail'> = {
    app: 'ok',
    database: 'fail',
  };

  try {
    const sql = getDb();
    await sql`SELECT 1`;
    checks.database = 'ok';
  } catch {
    // database unreachable
  }

  const healthy = Object.values(checks).every((v) => v === 'ok');

  return NextResponse.json(
    { status: healthy ? 'healthy' : 'degraded', checks, timestamp: new Date().toISOString() },
    { status: healthy ? 200 : 503 },
  );
}
