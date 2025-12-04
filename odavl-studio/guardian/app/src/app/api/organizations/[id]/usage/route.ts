/**
 * Organization Usage API
 * Provides usage statistics and quota information
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUsageStats, resetUsage } from '@/middleware/usage-tracking';
import logger from '@/lib/logger';
import { captureError } from '@/lib/sentry';

type RouteParams = {
    params: Promise<{
        id: string;
    }>;
};

/**
 * GET /api/organizations/[id]/usage - Get usage statistics
 */
export async function GET(request: NextRequest, props: RouteParams) {
    const params = await props.params;
    try {
        const { id: organizationId } = params;

        const stats = await getUsageStats(organizationId);

        if (!stats) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Organization not found',
                },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            usage: stats,
        });
    } catch (error) {
        logger.error('Failed to fetch usage stats', { error });
        captureError(error as Error, { tags: { context: 'usage-stats' } });
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to fetch usage statistics',
                details: (error as Error).message,
            },
            { status: 500 }
        );
    }
}

/**
 * POST /api/organizations/[id]/usage/reset - Reset usage counters (admin only)
 */
export async function POST(request: NextRequest, props: RouteParams) {
    const params = await props.params;
    try {
        const { id: organizationId } = params;

        const success = await resetUsage(organizationId);

        if (!success) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Failed to reset usage',
                },
                { status: 500 }
            );
        }

        logger.info('Usage reset via API', { organizationId });

        return NextResponse.json({
            success: true,
            message: 'Usage counters reset successfully',
        });
    } catch (error) {
        logger.error('Failed to reset usage', { error });
        captureError(error as Error, { tags: { context: 'usage-reset' } });
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to reset usage counters',
                details: (error as Error).message,
            },
            { status: 500 }
        );
    }
}
