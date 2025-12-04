/**
 * WebSocket Analytics Server
 * Provides real-time analytics updates
 */

import { Server as SocketIOServer } from 'socket.io';
import { prisma } from '@/lib/prisma';
import logger from '@/lib/logger';

let io: SocketIOServer | null = null;

/**
 * Initialize WebSocket server
 */
export function initializeWebSocket(httpServer: any) {
    if (io) {
        return io;
    }

    io = new SocketIOServer(httpServer, {
        cors: {
            origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3003',
            methods: ['GET', 'POST'],
        },
        path: '/api/analytics/socket',
    });

    io.on('connection', (socket) => {
        logger.info('WebSocket client connected', { socketId: socket.id });

        // Subscribe to organization analytics
        socket.on('subscribe:analytics', async ({ organizationId }) => {
            const room = organizationId ? `analytics:${organizationId}` : 'analytics:global';
            socket.join(room);
            logger.info('Client subscribed to analytics', { socketId: socket.id, room });

            // Send initial data
            try {
                const overview = await getAnalyticsOverview(organizationId);
                socket.emit('analytics:update', overview);
            } catch (error) {
                logger.error('Failed to send initial analytics', { error });
            }
        });

        // Unsubscribe
        socket.on('unsubscribe:analytics', ({ organizationId }) => {
            const room = organizationId ? `analytics:${organizationId}` : 'analytics:global';
            socket.leave(room);
            logger.info('Client unsubscribed from analytics', { socketId: socket.id, room });
        });

        socket.on('disconnect', () => {
            logger.info('WebSocket client disconnected', { socketId: socket.id });
        });
    });

    return io;
}

/**
 * Get WebSocket server instance
 */
export function getWebSocketServer(): SocketIOServer | null {
    return io;
}

/**
 * Broadcast analytics update
 */
export async function broadcastAnalyticsUpdate(organizationId?: string) {
    if (!io) {
        return;
    }

    try {
        const overview = await getAnalyticsOverview(organizationId);
        const room = organizationId ? `analytics:${organizationId}` : 'analytics:global';
        io.to(room).emit('analytics:update', overview);
        logger.info('Analytics update broadcasted', { room });
    } catch (error) {
        logger.error('Failed to broadcast analytics update', { error });
    }
}

/**
 * Broadcast new test run
 */
export function broadcastTestRun(testRun: any, organizationId?: string) {
    if (!io) {
        return;
    }

    const room = organizationId ? `analytics:${organizationId}` : 'analytics:global';
    io.to(room).emit('analytics:test-run', testRun);
    logger.info('Test run broadcasted', { room, testRunId: testRun.id });
}

/**
 * Broadcast new monitor check
 */
export function broadcastMonitorCheck(check: any, organizationId?: string) {
    if (!io) {
        return;
    }

    const room = organizationId ? `analytics:${organizationId}` : 'analytics:global';
    io.to(room).emit('analytics:monitor-check', check);
    logger.info('Monitor check broadcasted', { room, checkId: check.id });
}

/**
 * Broadcast new alert
 */
export function broadcastAlert(alert: any, organizationId?: string) {
    if (!io) {
        return;
    }

    const room = organizationId ? `analytics:${organizationId}` : 'analytics:global';
    io.to(room).emit('analytics:alert', alert);
    logger.info('Alert broadcasted', { room, alertId: alert.id });
}

/**
 * Get analytics overview helper
 */
async function getAnalyticsOverview(organizationId?: string) {
    const testWhereClause = organizationId ? { project: { organizationId } } : {};
    const monitorWhereClause = organizationId ? { project: { organizationId }, enabled: true } : { enabled: true };
    const alertWhereClause = organizationId ? { projectId: organizationId } : {};

    const [totalTests, passedTests, activeMonitors, totalAlerts] = await Promise.all([
        prisma.testRun.count({ where: testWhereClause }),
        prisma.testRun.count({ where: { ...testWhereClause, status: 'passed' } }),
        prisma.monitor.count({ where: monitorWhereClause }),
        prisma.alert.count({ where: alertWhereClause }),
    ]);

    const passRate = totalTests > 0 ? (passedTests / totalTests) * 100 : 0;

    return {
        tests: {
            total: totalTests,
            passed: passedTests,
            passRate: Math.round(passRate * 10) / 10,
        },
        monitors: {
            active: activeMonitors,
        },
        alerts: {
            total: totalAlerts,
        },
        timestamp: new Date().toISOString(),
    };
}
