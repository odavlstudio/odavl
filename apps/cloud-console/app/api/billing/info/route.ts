/**
 * Billing Info API
 * Returns current billing and usage information
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      memberships: {
        include: { organization: true },
        take: 1,
      },
    },
  });

  if (!user?.memberships[0]) {
    return NextResponse.json({ error: 'No organization' }, { status: 404 });
  }

  const org = user.memberships[0].organization;

  return NextResponse.json({
    tier: org.tier,
    status: org.status,
    testRunsUsed: 0, // TODO: Calculate from usage events
    testRunsQuota: getTierQuota(org.tier),
    stripeCustomerId: org.stripeCustomerId,
  });
}

function getTierQuota(tier: string): number {
  const quotas: Record<string, number> = {
    FREE: 100,
    PRO: 1000,
    ENTERPRISE: -1,
  };
  return quotas[tier] || 100;
}
