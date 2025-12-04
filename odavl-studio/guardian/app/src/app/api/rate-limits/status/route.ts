/**
 * Rate Limit Status API
 * Endpoint for checking current rate limit status
 */

import { NextRequest, NextResponse } from 'next/server';
import { getRateLimitStatus } from '@/middleware/rate-limit';
import logger from '@/lib/logger';
import { captureError } from '@/lib/sentry';

/**
 * GET /api/rate-limits/status
 * Get current rate limit status
 */
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const type = searchParams.get('type') as 'organization' | 'apikey';
        const identifier = searchParams.get('identifier');

        if (!type || !identifier) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Missing required parameters',
                    message: 'type and identifier are required',
                },
                { status: 400 }
            );
        }

        if (!['organization', 'apikey'].includes(type)) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Invalid type',
                    message: 'type must be "organization" or "apikey"',
                },
                { status: 400 }
            );
        }

        const status = await getRateLimitStatus(type, identifier);

        if (!status) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Status not found',
                    message: `Could not retrieve rate limit status for ${type}: ${identifier}`,
                },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            rateLimit: {
                allowed: status.allowed,
                remaining: status.remaining,
                reset: status.reset,
                resetDate: new Date(status.reset * 1000).toISOString(),
                total: status.total,
                ...(type === 'organization' && 'tier' in status && { tier: status.tier }),
                ...(type === 'apikey' && 'organizationId' in status && {
                    organizationId: status.organizationId
                }),
            },
        });
    } catch (error) {
        logger.error('Failed to get rate limit status', { error });
        captureError(error as Error, { tags: { type: 'rate-limit-status' } });
        return NextResponse.json(
            {
                success: false,
                error: 'Internal server error',
                message: 'Failed to retrieve rate limit status',
            },
            { status: 500 }
        );
    }
}
