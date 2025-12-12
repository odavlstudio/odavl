import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { USAGE_LIMITS } from '@/lib/stripe';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        memberships: {
          include: {
            organization: {
              include: {
                subscriptions: true,
              },
            },
          },
        },
      },
    });

    if (!user || user.memberships.length === 0) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    const organization = user.memberships[0].organization;
    const subscription = organization.subscriptions[0];
    const tier = organization.tier as keyof typeof USAGE_LIMITS;
    const limits = USAGE_LIMITS[tier];

    return NextResponse.json({
      tier,
      status: subscription?.status || 'ACTIVE',
      analysesUsed: subscription?.usedAnalyses || 0,
      fixesUsed: subscription?.usedFixes || 0,
      auditsUsed: subscription?.usedAudits || 0,
      analysesLimit: limits.analyses,
      fixesLimit: limits.fixes,
      auditsLimit: limits.audits,
      currentPeriodEnd: subscription?.currentPeriodEnd?.toISOString(),
    });
  } catch (error) {
    console.error('Usage error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch usage' },
      { status: 500 }
    );
  }
}
