import axios from 'axios';
import { prisma } from '@/lib/prisma';
import { emitMonitorUpdate } from '@/lib/socket';
import type { MonitorCheck, MonitorStatus } from '@/types';

export interface HealthCheckResult {
    status: MonitorStatus;
    responseTime: number;
    statusCode?: number;
    error?: string;
    headers?: Record<string, string>;
}

export class HealthChecker {
    async check(monitorId: string): Promise<void> {
        const monitor = await prisma.monitor.findUnique({
            where: { id: monitorId },
            include: { project: true }
        });

        if (!monitor) {
            console.error(`[HealthChecker] Monitor ${monitorId} not found`);
            return;
        }

        if (!monitor.enabled) {
            console.log(`[HealthChecker] Monitor ${monitorId} is disabled, skipping`);
            return;
        }

        const result = await this.performCheck(monitor.endpoint, monitor.type);

        await this.saveCheck(monitorId, monitor.projectId, result);

        // Check if alert needed
        await this.checkThresholds(monitor, result);
    }

    private async performCheck(
        endpoint: string,
        type: string
    ): Promise<HealthCheckResult> {
        const startTime = Date.now();

        try {
            const response = await axios.get(endpoint, {
                timeout: 10000,
                validateStatus: () => true // Don't throw on non-2xx
            });

            const responseTime = Date.now() - startTime;
            const isHealthy = response.status >= 200 && response.status < 300;

            return {
                status: isHealthy ? 'up' : response.status >= 500 ? 'down' : 'degraded',
                responseTime,
                statusCode: response.status,
                headers: response.headers as Record<string, string>
            };
        } catch (error) {
            const responseTime = Date.now() - startTime;

            return {
                status: 'down',
                responseTime,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }

    private async saveCheck(
        monitorId: string,
        projectId: string,
        result: HealthCheckResult
    ): Promise<void> {
        const check = await prisma.monitorCheck.create({
            data: {
                monitorId,
                status: result.status,
                responseTime: result.responseTime,
                statusCode: result.statusCode,
                error: result.error,
                headers: result.headers as never
            }
        });

        emitMonitorUpdate(projectId, check);
        console.log(`[HealthChecker] Monitor ${monitorId}: ${result.status} (${result.responseTime}ms)`);
    }

    private async checkThresholds(
        monitor: {
            id: string;
            name: string;
            responseTimeThreshold: number | null;
            uptimeThreshold: number | null;
        },
        result: HealthCheckResult
    ): Promise<void> {
        const alerts: string[] = [];

        // Check response time threshold
        if (
            monitor.responseTimeThreshold &&
            result.responseTime > monitor.responseTimeThreshold
        ) {
            alerts.push(
                `Response time ${result.responseTime}ms exceeds threshold ${monitor.responseTimeThreshold}ms`
            );
        }

        // Check if down
        if (result.status === 'down') {
            alerts.push(`Monitor is down: ${result.error || 'Unknown error'}`);
        }

        // Create alerts if needed
        for (const message of alerts) {
            await prisma.alert.create({
                data: {
                    type: 'monitor_down',
                    severity: result.status === 'down' ? 'critical' : 'warning',
                    message: `${monitor.name}: ${message}`,
                    metadata: {
                        monitorId: monitor.id,
                        result
                    } as never
                }
            });

            console.log(`[HealthChecker] Alert created: ${message}`);
        }
    }

    async calculateUptime(monitorId: string, hours = 24): Promise<number> {
        const since = new Date(Date.now() - hours * 60 * 60 * 1000);

        const checks = await prisma.monitorCheck.findMany({
            where: {
                monitorId,
                checkedAt: { gte: since }
            }
        });

        if (checks.length === 0) return 100;

        const upChecks = checks.filter((c: typeof checks[0]) => c.status === 'up').length;
        return (upChecks / checks.length) * 100;
    }
}
