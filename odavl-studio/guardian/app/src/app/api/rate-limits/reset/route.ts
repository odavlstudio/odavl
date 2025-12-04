/**
 * Rate Limit Reset API
 * Admin endpoint for resetting rate limits
 */

import { NextRequest, NextResponse } from 'next/server';
import { resetRateLimit } from '@/middleware/rate-limit';
import logger from '@/lib/logger';
import { captureError } from '@/lib/sentry';

/**
 * POST /api/rate-limits/reset
 * Reset rate limit for an identifier
 * Requires admin privileges
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { identifier, type } = body;

        if (!identifier || !type) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Missing required parameters',
                    message: 'identifier and type are required',
                },
                { status: 400 }
            );
        }

        if (!['organization', 'apikey', 'ip'].includes(type)) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Invalid type',
                    message: 'type must be "organization", "apikey", or "ip"',
                },
                { status: 400 }
            );
        }

        // Build Redis key based on type
        let redisKey: string;
        if (type === 'organization') {
            redisKey = `org:${identifier}`;
        } else if (type === 'apikey') {
            redisKey = `apikey:${identifier}`;
        } else {
            redisKey = `ip:${identifier}`;
        }

        const success = await resetRateLimit(redisKey);

        if (!success) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Reset failed',
                    message: 'Failed to reset rate limit',
                },
                { status: 500 }
            );
        }

        logger.info('Rate limit reset successfully', { type, identifier });

        return NextResponse.json({
            success: true,
            message: 'Rate limit reset successfully',
            reset: {
                type,
                identifier,
                timestamp: new Date().toISOString(),
            },
        });
    } catch (error) {
        logger.error('Failed to reset rate limit', { error });
        captureError(error as Error, { tags: { type: 'rate-limit-reset' } });
        return NextResponse.json(
            {
                success: false,
                error: 'Internal server error',
                message: 'Failed to reset rate limit',
            },
            { status: 500 }
        );
    }
}
