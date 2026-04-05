import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createConnectOnboardingLink, checkAccountStatus } from '@/lib/stripe/connect';

/**
 * POST /api/stripe/connect
 * Start Stripe Connect Express onboarding for a creator.
 * Body: { email: string, userId: string, stripeAccountId?: string }
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { email, userId, stripeAccountId } = body;

    if (!email || !userId) {
      return NextResponse.json({ error: 'email and userId are required' }, { status: 400 });
    }

    if (userId !== (session.user as { id?: string }).id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const result = await createConnectOnboardingLink({ email, userId, stripeAccountId });

    return NextResponse.json({
      accountId: result.accountId,
      onboardingUrl: result.url,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to create onboarding link';
    console.error('Stripe Connect onboarding error:', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * GET /api/stripe/connect?accountId=acct_xxx
 * Check connected account status. Also handles refresh redirects.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  // Handle refresh redirect — re-create onboarding link
  if (searchParams.get('refresh') === 'true') {
    const accountId = searchParams.get('account');
    if (!accountId) {
      return NextResponse.json({ error: 'account is required for refresh' }, { status: 400 });
    }
    // Caller should POST to re-initiate onboarding with existing accountId
    return NextResponse.json({
      message: 'Onboarding expired. Re-initiate via POST with stripeAccountId.',
      accountId,
    });
  }

  const accountId = searchParams.get('accountId');
  if (!accountId) {
    return NextResponse.json({ error: 'accountId query param is required' }, { status: 400 });
  }

  try {
    const status = await checkAccountStatus(accountId);
    return NextResponse.json(status);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to check account status';
    console.error('Stripe Connect status check error:', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
