/**
 * Storage Statistics API
 * Get storage usage statistics for organization
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { cloudStorage } from '@odavl-studio/core/services/cloud-storage';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/v1/storage/stats
 * Get storage usage statistics
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user and org
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, orgId: true, organization: { select: { plan: true } } },
    });

    if (!user?.orgId) {
      return NextResponse.json({ error: 'User not associated with organization' }, { status: 404 });
    }

    // Calculate storage usage for org
    const totalBytes = await cloudStorage.getStorageUsage(user.orgId);

    // Get usage by product
    const insightBytes = await cloudStorage
      .listFiles({ prefix: `${user.orgId}/insight/` })
      .then((r) => r.files.reduce((sum, f) => sum + f.size, 0));

    const autopilotBytes = await cloudStorage
      .listFiles({ prefix: `${user.orgId}/autopilot/` })
      .then((r) => r.files.reduce((sum, f) => sum + f.size, 0));

    const guardianBytes = await cloudStorage
      .listFiles({ prefix: `${user.orgId}/guardian/` })
      .then((r) => r.files.reduce((sum, f) => sum + f.size, 0));

    // Get storage limits based on plan
    const PLAN_LIMITS = {
      FREE: 100 * 1024 * 1024, // 100 MB
      PRO: 10 * 1024 * 1024 * 1024, // 10 GB
      ENTERPRISE: -1, // Unlimited
    };

    const plan = user.organization?.plan || 'FREE';
    const storageLimit = PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS] || PLAN_LIMITS.FREE;
    const percentUsed = storageLimit === -1 ? 0 : Math.round((totalBytes / storageLimit) * 100);

    return NextResponse.json({
      total: {
        bytes: totalBytes,
        formatted: formatBytes(totalBytes),
      },
      byProduct: {
        insight: {
          bytes: insightBytes,
          formatted: formatBytes(insightBytes),
        },
        autopilot: {
          bytes: autopilotBytes,
          formatted: formatBytes(autopilotBytes),
        },
        guardian: {
          bytes: guardianBytes,
          formatted: formatBytes(guardianBytes),
        },
      },
      limit: {
        bytes: storageLimit,
        formatted: storageLimit === -1 ? 'Unlimited' : formatBytes(storageLimit),
      },
      percentUsed,
      withinLimit: storageLimit === -1 || totalBytes <= storageLimit,
    });
  } catch (error) {
    console.error('[Storage API] Error getting stats:', error);
    return NextResponse.json(
      { error: 'Failed to get storage stats', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}
