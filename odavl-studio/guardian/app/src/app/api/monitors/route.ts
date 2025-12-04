import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { monitorQueue } from '@/lib/queue';
import { cacheProject, invalidateProject, CACHE_TTL } from '@/lib/cache';
import { z } from 'zod';

// Validation schema
const CreateMonitorSchema = z.object({
    projectId: z.string().cuid(),
    name: z.string().min(1),
    type: z.enum(['health', 'uptime', 'performance']),
    endpoint: z.string().url(),
    interval: z.number().min(1).max(1440), // 1 minute to 24 hours
    responseTimeThreshold: z.number().optional(),
    uptimeThreshold: z.number().min(0).max(100).optional()
});

// GET /api/monitors - List monitors (with caching)
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    // Use cache for project-specific queries
    if (projectId) {
        const monitors = await cacheProject(
            projectId,
            'monitors',
            CACHE_TTL.MEDIUM, // 5 minutes
            async () => {
                return prisma.monitor.findMany({
                    where: { projectId },
                    select: {
                        id: true,
                        name: true,
                        type: true,
                        endpoint: true,
                        interval: true,
                        enabled: true,
                        status: true,
                        lastCheckedAt: true,
                        uptime: true,
                        lastResponseTime: true,
                        project: {
                            select: { id: true, name: true }
                        }
                    },
                    orderBy: { createdAt: 'desc' }
                });
            }
        );
        return NextResponse.json({ monitors, count: monitors.length });
    }

    // Non-cached for all monitors (admin view)
    const monitors = await prisma.monitor.findMany({
        select: {
            id: true,
            name: true,
            type: true,
            endpoint: true,
            interval: true,
            enabled: true,
            status: true,
            lastCheckedAt: true,
            uptime: true,
            lastResponseTime: true,
            project: {
                select: { id: true, name: true }
            }
        },
        orderBy: { createdAt: 'desc' },
        take: 100 // Limit to prevent large queries
    });

    return NextResponse.json({ monitors, count: monitors.length });
}

// POST /api/monitors - Create a monitor
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const data = CreateMonitorSchema.parse(body);

        const monitor = await prisma.monitor.create({
            data: {
                projectId: data.projectId,
                name: data.name,
                type: data.type,
                endpoint: data.endpoint,
                interval: data.interval,
                responseTimeThreshold: data.responseTimeThreshold,
                uptimeThreshold: data.uptimeThreshold,
                enabled: true
            }
        });

        // Invalidate project cache
        await invalidateProject(data.projectId);

        // Schedule recurring checks using Bull's repeat option
        await monitorQueue.add(
            'check-monitor',
            { monitorId: monitor.id },
            {
                repeat: {
                    every: data.interval * 60 * 1000 // Convert minutes to ms
                }
            }
        );

        return NextResponse.json({ monitor }, { status: 201 });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Validation failed', details: error.errors },
                { status: 400 }
            );
        }

        console.error('[API] Failed to create monitor:', error);
        return NextResponse.json(
            { error: 'Failed to create monitor' },
            { status: 500 }
        );
    }
}
