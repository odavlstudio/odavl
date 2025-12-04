/**
 * Slow Query Statistics API
 */

import { NextResponse } from 'next/server';
import { getSlowQueryStats } from '@/lib/slow-query-logger';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';

/**
 * GET /api/performance/slow-queries - Get slow query statistics
 */
export async function GET() {
    try {
        const stats = getSlowQueryStats();

        return NextResponse.json({
            success: true,
            stats,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        logger.error('Failed to get slow query stats', { error });
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to get slow query statistics',
                message: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}
