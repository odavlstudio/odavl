/**
 * Performance Profiling API
 * CPU profiling and memory snapshots
 */

import { NextRequest, NextResponse } from 'next/server';
import {
    startCPUProfiling,
    stopCPUProfiling,
    takeHeapSnapshot,
    getMemoryUsage,
    isProfilingInProgress,
} from '@/lib/profiler';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';

/**
 * GET /api/performance/profile - Get profiling status and memory usage
 */
export async function GET() {
    try {
        const memory = getMemoryUsage();
        const profilingActive = isProfilingInProgress();

        return NextResponse.json({
            success: true,
            profiling: {
                active: profilingActive,
                type: profilingActive ? 'cpu' : null,
            },
            memory,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        logger.error('Failed to get profiling status', { error });
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to get profiling status',
                message: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}

/**
 * POST /api/performance/profile - Start/stop profiling or take snapshot
 * Body:
 * - action: 'start-cpu' | 'stop-cpu' | 'heap-snapshot'
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { action } = body;

        if (!action) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Missing action parameter',
                    validActions: ['start-cpu', 'stop-cpu', 'heap-snapshot'],
                },
                { status: 400 }
            );
        }

        switch (action) {
            case 'start-cpu': {
                const result = startCPUProfiling();
                return NextResponse.json(result);
            }

            case 'stop-cpu': {
                const result = await stopCPUProfiling();
                return NextResponse.json(result);
            }

            case 'heap-snapshot': {
                const result = await takeHeapSnapshot();
                return NextResponse.json(result);
            }

            default:
                return NextResponse.json(
                    {
                        success: false,
                        error: `Invalid action: ${action}`,
                        validActions: ['start-cpu', 'stop-cpu', 'heap-snapshot'],
                    },
                    { status: 400 }
                );
        }
    } catch (error) {
        logger.error('Failed to execute profiling action', { error });
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to execute profiling action',
                message: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}
