import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { toggleLike, recordEvent } from '@/lib/feed';

/**
 * POST /api/feed/like — Toggle like/unlike on a tool.
 *
 * Body: { toolId }
 * Returns: { liked: boolean }
 *
 * Requires auth (userId).
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { toolId } = body;

    if (!toolId) {
      return NextResponse.json({ error: 'toolId is required' }, { status: 400 });
    }

    const session = await getServerSession(authOptions);
    const userId = (session?.user as Record<string, unknown> | undefined)?.id as string | undefined;
    if (!userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const liked = await toggleLike(userId, toolId);

    // Record engagement event
    await recordEvent(toolId, liked ? 'like' : 'unlike', userId);

    return NextResponse.json({ liked });
  } catch (error) {
    console.error('[feed/like] Error:', error);
    return NextResponse.json({ error: 'Failed to toggle like' }, { status: 500 });
  }
}
