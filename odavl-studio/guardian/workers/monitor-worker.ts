import { Worker } from 'bullmq';
import { prisma } from '@/lib/prisma';
import { emitMonitorUpdate } from '@/lib/socket';
import { sendNotification, type NotificationChannel, type NotificationPayload } from '@/lib/notifications';
import logger, { logMonitor, logError, logWorker } from '@/lib/logger';
import axios from 'axios';

interface MonitorJobData {
    monitorId: string;
    url: string;
    method: string;
    headers?: Record<string, string>;
    timeout: number;
    expectedStatus: number;
}

interface MonitorResult {
    status: 'up' | 'down';
    statusCode?: number;
    responseTime: number;
    error?: string;
    timestamp: Date;
}

export class MonitorWorker {
    private worker: Worker | null = null;

    async start(): Promise<void> {
        const connection = {
            host: process.env.REDIS_HOST || 'localhost',
            port: parseInt(process.env.REDIS_PORT || '6379'),
            password: process.env.REDIS_PASSWORD
        };

        this.worker = new Worker<MonitorJobData>(
            'monitorQueue',
            async (job) => {
                const startTime = Date.now();

                try {
                    await this.processMonitorJob(job.data);

                    logWorker({
                        name: 'monitor-worker',
                        jobId: job.id || 'unknown',
                        status: 'completed',
                        duration: Date.now() - startTime
                    });
                } catch (error) {
                    logWorker({
                        name: 'monitor-worker',
                        jobId: job.id || 'unknown',
                        status: 'failed',
                        duration: Date.now() - startTime,
                        error: error instanceof Error ? error : new Error(String(error))
                    });
                    throw error;
                }
            },
            {
                connection,
                concurrency: 10, // Check up to 10 monitors concurrently
                limiter: {
                    max: 100, // Max 100 checks per duration
                    duration: 60000 // 1 minute
                }
            }
        );

        this.worker.on('completed', (job) => {
            logger.debug(`Monitor ${job.data.monitorId} checked successfully`);
        });

        this.worker.on('failed', (job, err) => {
            logError(err, {
                monitorId: job?.data.monitorId,
                workerName: 'monitor-worker'
            });
        });

        this.worker.on('error', (err) => {
            logError(err, {
                workerName: 'monitor-worker',
                context: 'worker-error'
            });
        });

        logger.info('Monitor worker started and listening for jobs');
    }

    private async processMonitorJob(data: MonitorJobData): Promise<void> {
        const { monitorId, url, method, headers, timeout, expectedStatus } = data;
        const startTime = Date.now();

        try {
            // Perform HTTP check
            const response = await axios({
                method: method as 'GET' | 'POST' | 'PUT' | 'DELETE',
                url,
                headers,
                timeout,
                validateStatus: () => true // Don't throw on any status
            });

            const responseTime = Date.now() - startTime;
            const isUp = response.status === expectedStatus;

            const result: MonitorResult = {
                status: isUp ? 'up' : 'down',
                statusCode: response.status,
                responseTime,
                timestamp: new Date()
            };

            if (!isUp) {
                result.error = `Expected status ${expectedStatus}, got ${response.status}`;
            }

            // Log the monitor check
            logMonitor({
                id: monitorId,
                url,
                status: result.status,
                responseTime,
                statusCode: response.status
            });

            await this.saveMonitorResult(monitorId, result);
            await this.updateMonitorStatus(monitorId, result);

        } catch (error) {
            const responseTime = Date.now() - startTime;
            const result: MonitorResult = {
                status: 'down',
                responseTime,
                error: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date()
            };

            // Log the error
            logError(
                error instanceof Error ? error : new Error(String(error)),
                {
                    monitorId,
                    url,
                    workerName: 'monitor-worker'
                }
            );

            await this.saveMonitorResult(monitorId, result);
            await this.updateMonitorStatus(monitorId, result);
        }
    }

    private async saveMonitorResult(
        monitorId: string,
        result: MonitorResult
    ): Promise<void> {
        await prisma.monitorCheck.create({
            data: {
                monitorId,
                status: result.status,
                statusCode: result.statusCode,
                responseTime: result.responseTime,
                error: result.error,
                checkedAt: result.timestamp
            }
        });
    }

    private async updateMonitorStatus(
        monitorId: string,
        result: MonitorResult
    ): Promise<void> {
        const monitor = await prisma.monitor.findUnique({
            where: { id: monitorId }
        });

        if (!monitor) {
            throw new Error(`Monitor ${monitorId} not found`);
        }

        // Calculate uptime percentage (last 100 checks)
        const recentChecks = await prisma.monitorCheck.findMany({
            where: { monitorId },
            orderBy: { checkedAt: 'desc' },
            take: 100
        });

        const uptimeCount = recentChecks.filter((check: any) => check.status === 'up').length;
        const uptimePercentage = (uptimeCount / recentChecks.length) * 100;

        // Update monitor
        const updatedMonitor = await prisma.monitor.update({
            where: { id: monitorId },
            data: {
                status: result.status,
                lastCheckedAt: result.timestamp,
                uptime: uptimePercentage,
                lastResponseTime: result.responseTime
            },
            include: { project: true }
        });

        // Check if status changed (for alerts)
        if (monitor.status !== result.status) {
            await this.handleStatusChange(monitorId, monitor.status, result.status);
        }

        emitMonitorUpdate(updatedMonitor.projectId, updatedMonitor);
    }

    private async handleStatusChange(
        monitorId: string,
        oldStatus: string,
        newStatus: string
    ): Promise<void> {
        console.log(`[monitor-worker] Monitor ${monitorId} status changed: ${oldStatus} -> ${newStatus}`);

        // Get monitor and organization details
        const monitor = await prisma.monitor.findUnique({
            where: { id: monitorId },
            include: {
                project: {
                    include: {
                        organization: true,
                    },
                },
            },
        });

        if (!monitor) {
            console.error(`[monitor-worker] Monitor ${monitorId} not found`);
            return;
        }

        // Create alert
        await prisma.alert.create({
            data: {
                monitorId,
                type: newStatus === 'down' ? 'down' : 'up',
                severity: newStatus === 'down' ? 'critical' : 'info',
                message: newStatus === 'down'
                    ? 'Monitor is down'
                    : 'Monitor is back up',
                createdAt: new Date()
            }
        });

        // Send notifications
        await this.sendAlertNotifications(monitor, oldStatus, newStatus);
    }

    private async sendAlertNotifications(
        monitor: any,
        oldStatus: string,
        newStatus: string
    ): Promise<void> {
        try {
            // Build notification channels from organization settings
            const channels: NotificationChannel[] = [];

            // Email notification (if configured)
            if (process.env.SENDGRID_API_KEY || process.env.SMTP_HOST) {
                const notificationEmail = monitor.project.organization.notificationEmail;
                if (notificationEmail) {
                    channels.push({
                        type: 'email',
                        enabled: true,
                        config: {
                            to: notificationEmail,
                            provider: 'sendgrid',
                            apiKey: process.env.SENDGRID_API_KEY,
                            from: 'alerts@odavl.com',
                        },
                    });
                }
            }

            // Slack notification (if webhook configured)
            const slackWebhook = monitor.project.organization.slackWebhook;
            if (slackWebhook) {
                channels.push({
                    type: 'slack',
                    enabled: true,
                    config: {
                        webhookUrl: slackWebhook,
                    },
                });
            }

            // Discord notification (if webhook configured)
            const discordWebhook = monitor.project.organization.discordWebhook;
            if (discordWebhook) {
                channels.push({
                    type: 'discord',
                    enabled: true,
                    config: {
                        webhookUrl: discordWebhook,
                    },
                });
            }

            // Build notification payload
            const payload: NotificationPayload = {
                title: `Monitor ${newStatus === 'down' ? 'Down' : 'Recovered'}: ${monitor.name}`,
                message: `Monitor **${monitor.name}** (${monitor.url}) has changed from **${oldStatus}** to **${newStatus}**.`,
                severity: newStatus === 'down' ? 'critical' : 'info',
                metadata: {
                    'Monitor': monitor.name,
                    'URL': monitor.url,
                    'Project': monitor.project.name,
                    'Old Status': oldStatus,
                    'New Status': newStatus,
                    'Timestamp': new Date().toLocaleString(),
                },
                link: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/monitors/${monitor.id}`,
            };

            // Send notifications to all enabled channels
            if (channels.length > 0) {
                await sendNotification(channels, payload);
                console.log(`[monitor-worker] Sent ${channels.length} notifications for monitor ${monitor.id}`);
            } else {
                console.log(`[monitor-worker] No notification channels configured for monitor ${monitor.id}`);
            }
        } catch (error) {
            console.error('[monitor-worker] Failed to send notifications:', error);
        }
    }

    async stop(): Promise<void> {
        if (this.worker) {
            await this.worker.close();
            console.log('[monitor-worker] Stopped');
        }
    }
}

// Start worker if run directly
if (require.main === module) {
    const worker = new MonitorWorker();

    worker.start().catch((error) => {
        console.error('[monitor-worker] Failed to start:', error);
        process.exit(1);
    });

    // Graceful shutdown
    process.on('SIGTERM', async () => {
        console.log('[monitor-worker] Received SIGTERM, shutting down...');
        await worker.stop();
        process.exit(0);
    });

    process.on('SIGINT', async () => {
        console.log('[monitor-worker] Received SIGINT, shutting down...');
        await worker.stop();
        process.exit(0);
    });
}

export default MonitorWorker;
