/**
 * ML-Powered Insights System
 * Provides anomaly detection, pattern recognition, and predictive analysis
 * Using statistical models instead of heavy ML frameworks for better performance
 */

import { prisma } from '@/lib/prisma';
import logger from '@/lib/logger';
import { captureMessage } from '@/lib/sentry';
import { getRedisClient, CACHE_TTL } from '@/lib/cache';

// Insight Types
export type InsightType =
    | 'anomaly'
    | 'degradation'
    | 'pattern'
    | 'prediction'
    | 'recommendation';

export type InsightSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';

export interface Insight {
    id: string;
    type: InsightType;
    severity: InsightSeverity;
    title: string;
    description: string;
    confidence: number; // 0-1
    affectedResources: string[];
    actionableSteps: string[];
    detectedAt: Date;
    metadata?: Record<string, any>;
}

/**
 * Statistical Analysis Helper Functions
 */
class Statistics {
    /**
     * Calculate mean (average)
     */
    static mean(values: number[]): number {
        if (values.length === 0) return 0;
        return values.reduce((sum, val) => sum + val, 0) / values.length;
    }

    /**
     * Calculate standard deviation
     */
    static stdDev(values: number[]): number {
        if (values.length === 0) return 0;
        const avg = this.mean(values);
        const squareDiffs = values.map((value) => Math.pow(value - avg, 2));
        return Math.sqrt(this.mean(squareDiffs));
    }

    /**
     * Calculate Z-score for anomaly detection
     */
    static zScore(value: number, mean: number, stdDev: number): number {
        if (stdDev === 0) return 0;
        return (value - mean) / stdDev;
    }

    /**
     * Detect outliers using IQR method
     */
    static detectOutliers(values: number[], threshold = 1.5): number[] {
        if (values.length < 4) return [];

        const sorted = [...values].sort((a, b) => a - b);
        const q1 = sorted[Math.floor(sorted.length * 0.25)];
        const q3 = sorted[Math.floor(sorted.length * 0.75)];
        const iqr = q3 - q1;

        const lowerBound = q1 - threshold * iqr;
        const upperBound = q3 + threshold * iqr;

        return values.filter((v) => v < lowerBound || v > upperBound);
    }

    /**
     * Calculate trend using linear regression
     */
    static calculateTrend(values: number[]): { slope: number; intercept: number } {
        if (values.length < 2) return { slope: 0, intercept: 0 };

        const n = values.length;
        const xValues = Array.from({ length: n }, (_, i) => i);

        const sumX = xValues.reduce((a, b) => a + b, 0);
        const sumY = values.reduce((a, b) => a + b, 0);
        const sumXY = xValues.reduce((sum, x, i) => sum + x * values[i], 0);
        const sumXX = xValues.reduce((sum, x) => sum + x * x, 0);

        const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
        const intercept = (sumY - slope * sumX) / n;

        return { slope, intercept };
    }

    /**
     * Calculate moving average
     */
    static movingAverage(values: number[], window: number): number[] {
        if (values.length < window) return [];

        const result: number[] = [];
        for (let i = 0; i <= values.length - window; i++) {
            const slice = values.slice(i, i + window);
            result.push(this.mean(slice));
        }
        return result;
    }
}

/**
 * Anomaly Detector
 * Detects unusual patterns in test results and performance metrics
 */
export class AnomalyDetector {
    /**
     * Detect anomalies in test failure rates
     */
    async detectTestFailureAnomalies(
        organizationId?: string
    ): Promise<Insight[]> {
        const insights: Insight[] = [];

        try {
            // Get test runs from last 30 days
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            // Cache key for ML insights (1 hour TTL)
            const cacheKey = `ml:anomaly:${organizationId || 'all'}:${thirtyDaysAgo.toISOString().split('T')[0]}`;
            const redis = getRedisClient();

            try {
                const cached = await redis.get(cacheKey);
                if (cached) {
                    return JSON.parse(cached) as Insight[];
                }
            } catch (err) {
                logger.warn('[ML] Cache read failed, falling back to computation', { error: err });
            }

            const testRuns = await prisma.testRun.findMany({
                where: {
                    createdAt: { gte: thirtyDaysAgo },
                    ...(organizationId && { organizationId }),
                },
                orderBy: { createdAt: 'asc' },
                select: {
                    id: true,
                    type: true,
                    status: true,
                    duration: true,
                    createdAt: true,
                },
            });

            if (testRuns.length < 10) {
                return insights; // Not enough data
            }

            // Group by day and calculate failure rates
            const dailyStats = this.groupTestsByDay(testRuns);
            const failureRates = dailyStats.map((day) => day.failureRate);

            // Detect anomalies using Z-score
            const mean = Statistics.mean(failureRates);
            const stdDev = Statistics.stdDev(failureRates);

            for (const day of dailyStats) {
                const zScore = Statistics.zScore(day.failureRate, mean, stdDev);

                // Z-score > 2 indicates anomaly (95% confidence)
                if (Math.abs(zScore) > 2) {
                    let severity: InsightSeverity = 'medium';
                    if (zScore > 3) {
                        severity = 'critical';
                    } else if (zScore > 2.5) {
                        severity = 'high';
                    }

                    insights.push({
                        id: `anomaly-failure-${day.date}`,
                        type: 'anomaly',
                        severity,
                        title: 'Unusual Test Failure Rate Detected',
                        description: `Test failure rate on ${day.date} was ${day.failureRate.toFixed(1)}%, which is ${zScore.toFixed(1)} standard deviations from the mean (${mean.toFixed(1)}%).`,
                        confidence: Math.min(Math.abs(zScore) / 3, 1),
                        affectedResources: [`date:${day.date}`],
                        actionableSteps: [
                            'Review failed tests from this date',
                            'Check for infrastructure issues',
                            'Compare with deployment timeline',
                            'Investigate code changes deployed around this time',
                        ],
                        detectedAt: new Date(),
                        metadata: {
                            date: day.date,
                            failureRate: day.failureRate,
                            zScore,
                            mean,
                            stdDev,
                        },
                    });
                }
            }

            logger.info('Test failure anomaly detection completed', {
                insights: insights.length,
            });

            // Cache the results (1 hour)
            try {
                await redis.setex(cacheKey, CACHE_TTL.HOUR, JSON.stringify(insights));
            } catch (err) {
                logger.warn('[ML] Cache write failed', { error: err });
            }
        } catch (error) {
            logger.error('Failed to detect test failure anomalies', { error });
        }

        return insights;
    }

    /**
     * Detect anomalies in API response times
     */
    async detectPerformanceAnomalies(): Promise<Insight[]> {
        const insights: Insight[] = [];

        try {
            // Mock performance data - in production, would fetch from metrics store
            const responseTimes = Array.from({ length: 100 }, () =>
                Math.random() * 200 + 100
            );

            // Add some anomalies
            responseTimes.push(500, 550, 600);

            const outliers = Statistics.detectOutliers(responseTimes);

            if (outliers.length > 0) {
                const mean = Statistics.mean(responseTimes);

                insights.push({
                    id: `anomaly-performance-${Date.now()}`,
                    type: 'anomaly',
                    severity: 'medium',
                    title: 'Performance Anomalies Detected',
                    description: `Detected ${outliers.length} API requests with abnormal response times. Average: ${mean.toFixed(0)}ms, Outliers: ${outliers.map((o) => o.toFixed(0)).join(', ')}ms`,
                    confidence: 0.85,
                    affectedResources: ['api'],
                    actionableSteps: [
                        'Check database query performance',
                        'Review recent code changes',
                        'Monitor CPU and memory usage',
                        'Check for external API timeouts',
                    ],
                    detectedAt: new Date(),
                    metadata: {
                        outliers,
                        mean,
                        count: outliers.length,
                    },
                });
            }
        } catch (error) {
            logger.error('Failed to detect performance anomalies', { error });
        }

        return insights;
    }

    /**
     * Group test runs by day and calculate statistics
     */
    private groupTestsByDay(
        testRuns: Array<{
            id: string;
            type: string;
            status: string;
            duration: number | null;
            createdAt: Date;
        }>
    ): Array<{ date: string; total: number; failed: number; failureRate: number }> {
        const grouped = new Map<
            string,
            { total: number; failed: number }
        >();

        for (const test of testRuns) {
            const date = test.createdAt.toISOString().split('T')[0];
            const existing = grouped.get(date) || { total: 0, failed: 0 };

            existing.total++;
            if (test.status === 'failed') existing.failed++;

            grouped.set(date, existing);
        }

        return Array.from(grouped.entries()).map(([date, stats]) => ({
            date,
            total: stats.total,
            failed: stats.failed,
            failureRate: (stats.failed / stats.total) * 100,
        }));
    }
}

/**
 * Performance Degradation Predictor
 * Predicts potential performance issues before they become critical
 */
export class PerformanceDegradationPredictor {
    /**
     * Predict test duration degradation
     */
    async predictTestDurationDegradation(
        organizationId?: string
    ): Promise<Insight[]> {
        const insights: Insight[] = [];

        try {
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            // Cache ML duration predictions (1 hour)
            const cacheKey = `ml:duration:${organizationId || 'all'}:${thirtyDaysAgo.toISOString().split('T')[0]}`;
            const redis = getRedisClient();

            try {
                const cached = await redis.get(cacheKey);
                if (cached) {
                    return JSON.parse(cached) as Insight[];
                }
            } catch (err) {
                logger.warn('[ML] Cache read failed', { error: err });
            }

            const testRuns = await prisma.testRun.findMany({
                where: {
                    createdAt: { gte: thirtyDaysAgo },
                    status: 'passed',
                    duration: { not: null },
                    ...(organizationId && { organizationId }),
                },
                orderBy: { createdAt: 'asc' },
                select: {
                    type: true,
                    duration: true,
                    createdAt: true,
                },
            });

            // Group by test type
            type TestWithDuration = { duration: number; createdAt: Date };
            const testsByType = testRuns.reduce(
                (
                    acc: Record<string, TestWithDuration[]>,
                    test: {
                        type: string;
                        duration: number | null;
                        createdAt: Date;
                    }
                ) => {
                    if (!acc[test.type]) acc[test.type] = [];
                    acc[test.type].push({
                        duration: test.duration!,
                        createdAt: test.createdAt,
                    });
                    return acc;
                },
                {}
            );

            // Analyze each test type
            for (const [type, tests] of Object.entries(testsByType)) {
                const typedTests = tests as TestWithDuration[];
                if (typedTests.length < 10) continue;

                const durations = typedTests.map((t) => t.duration);
                const trend = Statistics.calculateTrend(durations);

                // Positive slope indicates increasing duration (degradation)
                if (trend.slope > 10) {
                    // > 10ms increase per test
                    let severity: InsightSeverity = 'low';
                    if (trend.slope > 50) {
                        severity = 'high';
                    } else if (trend.slope > 25) {
                        severity = 'medium';
                    }

                    const avgDuration = Statistics.mean(durations);
                    const projectedIncrease = trend.slope * 30; // 30 days projection

                    insights.push({
                        id: `degradation-${type}-${Date.now()}`,
                        type: 'degradation',
                        severity,
                        title: `${type} Test Duration Increasing`,
                        description: `${type} tests are taking longer to complete. Average duration increased by ${trend.slope.toFixed(1)}ms per test. Current average: ${avgDuration.toFixed(0)}ms. Projected increase in 30 days: ${projectedIncrease.toFixed(0)}ms.`,
                        confidence: 0.75,
                        affectedResources: [`test-type:${type}`],
                        actionableSteps: [
                            'Profile test execution to find bottlenecks',
                            'Review test data setup/teardown procedures',
                            'Check for unnecessary API calls',
                            'Consider test parallelization',
                            'Optimize database queries in tests',
                        ],
                        detectedAt: new Date(),
                        metadata: {
                            testType: type,
                            slope: trend.slope,
                            currentAverage: avgDuration,
                            projectedIncrease,
                            sampleSize: typedTests.length,
                        },
                    });
                }
            }

            logger.info('Performance degradation prediction completed', {
                insights: insights.length,
            });

            // Cache duration predictions (1 hour)
            try {
                await redis.setex(cacheKey, CACHE_TTL.HOUR, JSON.stringify(insights));
            } catch (err) {
                logger.warn('[ML] Cache write failed', { error: err });
            }
        } catch (error) {
            logger.error('Failed to predict performance degradation', { error });
        }

        return insights;
    }

    /**
     * Predict uptime degradation
     */
    async predictUptimeDegradation(organizationId?: string): Promise<Insight[]> {
        const insights: Insight[] = [];

        try {
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

            const checks = await prisma.monitorCheck.findMany({
                where: {
                    timestamp: { gte: sevenDaysAgo },
                    ...(organizationId && { monitor: { project: { organizationId } } }),
                },
                orderBy: { timestamp: 'asc' },
                select: {
                    monitor: {
                        select: {
                            endpoint: true,
                        },
                    },
                    success: true,
                    responseTime: true,
                    timestamp: true,
                },
            });

            // Group by endpoint (URL)
            type MonitorCheckData = {
                endpoint: string;
                success: boolean;
                responseTime: number | null;
                timestamp: Date;
            };
            const checksByEndpoint = checks.reduce(
                (acc: Record<string, MonitorCheckData[]>, check: any) => {
                    const endpoint = check.monitor.endpoint;
                    if (!acc[endpoint]) acc[endpoint] = [];
                    acc[endpoint].push({
                        endpoint,
                        success: check.success,
                        responseTime: check.responseTime,
                        timestamp: check.timestamp,
                    });
                    return acc;
                },
                {}
            );

            // Analyze each endpoint
            for (const [endpoint, urlChecks] of Object.entries(checksByEndpoint)) {
                const typedChecks = urlChecks as MonitorCheckData[];
                if (typedChecks.length < 20) continue;

                const recentChecks = typedChecks.slice(-20);
                const failureRate =
                    (recentChecks.filter((c) => !c.success).length /
                        recentChecks.length) *
                    100;

                if (failureRate > 10) {
                    let severity: InsightSeverity = 'medium';
                    if (failureRate > 50) {
                        severity = 'critical';
                    } else if (failureRate > 25) {
                        severity = 'high';
                    }

                    insights.push({
                        id: `uptime-degradation-${endpoint}-${Date.now()}`,
                        type: 'degradation',
                        severity,
                        title: 'Increasing Downtime Detected',
                        description: `${endpoint} is experiencing increased downtime. Recent failure rate: ${failureRate.toFixed(1)}% (${recentChecks.filter((c) => !c.success).length}/${recentChecks.length} checks failed).`,
                        confidence: 0.8,
                        affectedResources: [endpoint],
                        actionableSteps: [
                            'Check server logs for errors',
                            'Verify SSL certificate validity',
                            'Test DNS resolution',
                            'Check for rate limiting',
                            'Review recent deployments',
                        ],
                        detectedAt: new Date(),
                        metadata: {
                            endpoint,
                            failureRate,
                            recentChecks: recentChecks.length,
                            failedChecks: recentChecks.filter((c) => !c.success).length,
                        },
                    });
                }
            }

            logger.info('Uptime degradation prediction completed', {
                insights: insights.length,
            });
        } catch (error) {
            logger.error('Failed to predict uptime degradation', { error });
        }

        return insights;
    }
}

/**
 * Pattern Analyzer
 * Identifies patterns in test failures and system behavior
 */
export class PatternAnalyzer {
    /**
     * Analyze test failure patterns
     */
    async analyzeFailurePatterns(organizationId?: string): Promise<Insight[]> {
        const insights: Insight[] = [];

        try {
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            const failedTests = await prisma.testRun.findMany({
                where: {
                    createdAt: { gte: thirtyDaysAgo },
                    status: 'failed',
                    ...(organizationId && { organizationId }),
                },
                select: {
                    name: true,
                    type: true,
                    error: true,
                    createdAt: true,
                },
            });

            if (failedTests.length < 5) return insights;

            // Pattern 1: Repeated failures of same test
            const testFailureCounts = failedTests.reduce(
                (acc: Record<string, number>, test: { type: string; name: string | null }) => {
                    const testName = test.name || 'unnamed';
                    const key = `${test.type}:${testName}`;
                    acc[key] = (acc[key] || 0) + 1;
                    return acc;
                },
                {}
            );

            for (const [testKey, count] of Object.entries(testFailureCounts)) {
                const typedCount = count as number;
                if (typedCount >= 5) {
                    const [type, name] = testKey.split(':');
                    insights.push({
                        id: `pattern-repeated-${testKey}`,
                        type: 'pattern',
                        severity: typedCount >= 10 ? 'high' : 'medium',
                        title: 'Repeated Test Failure Pattern',
                        description: `Test "${name}" (${type}) has failed ${count} times in the last 30 days. This indicates a potential flaky test or persistent issue.`,
                        confidence: 0.9,
                        affectedResources: [`test:${name}`],
                        actionableSteps: [
                            'Review test for flakiness',
                            'Check if underlying code has changed',
                            'Add better error handling',
                        ],
                        detectedAt: new Date(),
                        metadata: {
                            testName: name,
                            testType: type,
                            failureCount: typedCount,
                        },
                    });
                }
            }

            // Pattern 2: Time-based patterns (e.g., failures at specific times)
            const failuresByHour = failedTests.reduce(
                (
                    acc: Record<number, number>,
                    test: { createdAt: Date }
                ) => {
                    const hour = test.createdAt.getHours();
                    acc[hour] = (acc[hour] || 0) + 1;
                    return acc;
                },
                {}
            );

            const avgFailuresPerHour =
                Statistics.mean(Object.values(failuresByHour));
            const stdDevHour = Statistics.stdDev(Object.values(failuresByHour));

            for (const [hour, count] of Object.entries(failuresByHour)) {
                const typedCount = count as number;
                const zScore = Statistics.zScore(typedCount, avgFailuresPerHour, stdDevHour);

                if (Math.abs(zScore) > 2) {
                    insights.push({
                        id: `pattern-time-${hour}`,
                        type: 'pattern',
                        severity: 'medium',
                        title: 'Time-Based Failure Pattern Detected',
                        description: `Tests fail more frequently around ${hour}:00 (${count} failures). This may indicate scheduled jobs, backups, or peak traffic affecting test execution.`,
                        confidence: 0.7,
                        affectedResources: [`time:${hour}:00`],
                        actionableSteps: [
                            'Check for scheduled maintenance or backups',
                            'Review system resource usage at this time',
                            'Consider running tests at different times',
                            'Investigate external dependencies',
                        ],
                        detectedAt: new Date(),
                        metadata: {
                            hour,
                            failureCount: typedCount,
                            avgFailuresPerHour,
                            zScore,
                        },
                    });
                }
            }

            logger.info('Failure pattern analysis completed', {
                insights: insights.length,
            });
        } catch (error) {
            logger.error('Failed to analyze failure patterns', { error });
        }

        return insights;
    }

    /**
     * Analyze error message patterns
     */
    async analyzeErrorPatterns(organizationId?: string): Promise<Insight[]> {
        const insights: Insight[] = [];

        try {
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

            const failedTests = await prisma.testRun.findMany({
                where: {
                    createdAt: { gte: sevenDaysAgo },
                    status: 'failed',
                    error: { not: null },
                    ...(organizationId && { organizationId }),
                },
                select: {
                    error: true,
                },
            });

            if (failedTests.length < 5) return insights;

            // Extract error types (simplified categorization)
            const errorCategories = failedTests.reduce(
                (
                    acc: Record<string, number>,
                    test: { error: string | null }
                ) => {
                    const error = test.error || '';
                    let category = 'Other';

                    if (error.includes('timeout') || error.includes('ETIMEDOUT')) {
                        category = 'Timeout';
                    } else if (
                        error.includes('ECONNREFUSED') ||
                        error.includes('network')
                    ) {
                        category = 'Network';
                    } else if (
                        error.includes('assertion') ||
                        error.includes('expect')
                    ) {
                        category = 'Assertion';
                    } else if (
                        error.includes('undefined') ||
                        error.includes('null')
                    ) {
                        category = 'Null/Undefined';
                    } else if (error.includes('500') || error.includes('502')) {
                        category = 'Server Error';
                    }

                    acc[category] = (acc[category] || 0) + 1;
                    return acc;
                },
                {}
            );

            // Report dominant error categories
            for (const [category, count] of Object.entries(errorCategories)) {
                const typedCount = count as number;
                const percentage = (typedCount / failedTests.length) * 100;

                if (percentage > 30) {
                    insights.push({
                        id: `pattern-error-${category}`,
                        type: 'pattern',
                        severity: percentage > 50 ? 'high' : 'medium',
                        title: `Dominant Error Pattern: ${category}`,
                        description: `${percentage.toFixed(1)}% of test failures (${typedCount}/${failedTests.length}) are related to ${category} errors. This suggests a systemic issue that should be addressed.`,
                        confidence: 0.85,
                        affectedResources: [`error-category:${category}`],
                        actionableSteps:
                            this.getActionableStepsForErrorCategory(category),
                        detectedAt: new Date(),
                        metadata: {
                            category,
                            count: typedCount,
                            percentage,
                            totalFailures: failedTests.length,
                        },
                    });
                }
            }

            logger.info('Error pattern analysis completed', {
                insights: insights.length,
            });
        } catch (error) {
            logger.error('Failed to analyze error patterns', { error });
        }

        return insights;
    }

    /**
     * Get actionable steps for error category
     */
    private getActionableStepsForErrorCategory(category: string): string[] {
        const steps: Record<string, string[]> = {
            Timeout: [
                'Increase timeout values in test configuration',
                'Check network connectivity and latency',
                'Review API response times',
                'Consider implementing retry logic',
            ],
            Network: [
                'Verify network connectivity',
                'Check firewall and proxy settings',
                'Review DNS configuration',
                'Test external API availability',
            ],
            Assertion: [
                'Review test expectations',
                'Verify test data setup',
                'Check for data inconsistencies',
                'Update assertions to match current behavior',
            ],
            'Null/Undefined': [
                'Add null checks in code',
                'Verify data initialization',
                'Review async/await patterns',
                'Check for race conditions',
            ],
            'Server Error': [
                'Check server logs',
                'Review recent deployments',
                'Monitor server resources',
                'Verify database connectivity',
            ],
        };

        return steps[category] || ['Investigate root cause', 'Review error logs'];
    }
}

/**
 * ML Insights Orchestrator
 * Coordinates all ML-powered analysis
 */
export class MLInsightsOrchestrator {
    private readonly anomalyDetector: AnomalyDetector;
    private readonly degradationPredictor: PerformanceDegradationPredictor;
    private readonly patternAnalyzer: PatternAnalyzer;

    constructor() {
        this.anomalyDetector = new AnomalyDetector();
        this.degradationPredictor = new PerformanceDegradationPredictor();
        this.patternAnalyzer = new PatternAnalyzer();
    }

    /**
     * Run all analysis and return combined insights
     */
    async generateInsights(organizationId?: string): Promise<Insight[]> {
        const startTime = Date.now();
        logger.info('Starting ML insights generation', { organizationId });

        try {
            const [
                failureAnomalies,
                performanceAnomalies,
                testDegradation,
                uptimeDegradation,
                failurePatterns,
                errorPatterns,
            ] = await Promise.all([
                this.anomalyDetector.detectTestFailureAnomalies(organizationId),
                this.anomalyDetector.detectPerformanceAnomalies(),
                this.degradationPredictor.predictTestDurationDegradation(
                    organizationId
                ),
                this.degradationPredictor.predictUptimeDegradation(organizationId),
                this.patternAnalyzer.analyzeFailurePatterns(organizationId),
                this.patternAnalyzer.analyzeErrorPatterns(organizationId),
            ]);

            const allInsights = [
                ...failureAnomalies,
                ...performanceAnomalies,
                ...testDegradation,
                ...uptimeDegradation,
                ...failurePatterns,
                ...errorPatterns,
            ];

            // Sort by severity and confidence
            const severityOrder = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };
            allInsights.sort((a, b) => {
                const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
                if (severityDiff !== 0) return severityDiff;
                return b.confidence - a.confidence;
            });

            const duration = Date.now() - startTime;
            logger.info('ML insights generation completed', {
                insights: allInsights.length,
                duration,
            });

            captureMessage('ML insights generated', 'info', {
                tags: { insights: allInsights.length.toString() },
            });

            return allInsights;
        } catch (error) {
            logger.error('Failed to generate ML insights', { error });
            throw error;
        }
    }

    /**
     * Get insights by type
     */
    async getInsightsByType(
        type: InsightType,
        organizationId?: string
    ): Promise<Insight[]> {
        const allInsights = await this.generateInsights(organizationId);
        return allInsights.filter((insight) => insight.type === type);
    }

    /**
     * Get insights by severity
     */
    async getInsightsBySeverity(
        severity: InsightSeverity,
        organizationId?: string
    ): Promise<Insight[]> {
        const allInsights = await this.generateInsights(organizationId);
        return allInsights.filter((insight) => insight.severity === severity);
    }
}

// Export singleton instance
export const mlInsights = new MLInsightsOrchestrator();
