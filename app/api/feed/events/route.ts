import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { recordEvent } from '@/lib/feed';

/**
 * POST /api/feed/events — Record a feed engagement event.
 *
 * Body: { toolId, eventType, sessionId?, referrer? }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { toolId, eventType, sessionId, referrer } = body;

    if (!toolId || !eventType) {
      return NextResponse.json({ error: 'toolId and eventType are required' }, { status: 400 });
    }

    const validEvents = ['view', 'use', 'remix', 'share', 'like', 'unlike', 'purchase', 'deploy'];
    if (!validEvents.includes(eventType)) {
      return NextResponse.json(
        { error: `Invalid eventType. Must be one of: ${validEvents.join(', ')}` },
        { status: 400 },
      );
    }

    const session = await getServerSession(authOptions);
    const userId = (session?.user as Record<string, unknown> | undefined)?.id as string | undefined;

    await recordEvent(toolId, eventType, userId, sessionId, referrer);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[feed/events] Error:', error);
    return NextResponse.json({ error: 'Failed to record event' }, { status: 500 });
  }
}
