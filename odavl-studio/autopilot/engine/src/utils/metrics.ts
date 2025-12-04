/**
 * ODAVL CLI - Metrics Utilities
 * Helper functions for saving, loading, and formatting metrics
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import type { Metrics } from '../phases/observe';
import { logger } from './Logger';

/**
 * Get the .odavl/metrics directory path
 */
function getMetricsDir(targetDir: string): string {
    return path.join(targetDir, '.odavl', 'metrics');
}

/**
 * Ensure .odavl/metrics directory exists
 */
function ensureMetricsDir(targetDir: string): void {
    const metricsDir = getMetricsDir(targetDir);
    if (!fs.existsSync(metricsDir)) {
        fs.mkdirSync(metricsDir, { recursive: true });
    }
}

/**
 * Save metrics to .odavl/metrics/run-<runId>.json
 */
export function saveMetrics(metrics: Metrics): string {
    ensureMetricsDir(metrics.targetDir);

    const metricsDir = getMetricsDir(metrics.targetDir);
    const filename = `${metrics.runId}.json`;
    const filepath = path.join(metricsDir, filename);

    fs.writeFileSync(filepath, JSON.stringify(metrics, null, 2), 'utf8');

    logger.debug(`📊 Metrics saved to: ${filepath}`);
    return filepath;
}

/**
 * Load metrics from .odavl/metrics/run-<runId>.json
 */
export function loadMetrics(targetDir: string, runId: string): Metrics | null {
    const filepath = path.join(getMetricsDir(targetDir), `${runId}.json`);

    if (!fs.existsSync(filepath)) {
        return null;
    }

    const content = fs.readFileSync(filepath, 'utf8');
    return JSON.parse(content) as Metrics;
}

/**
 * Get the latest metrics file
 */
export function getLatestMetrics(targetDir: string): Metrics | null {
    const metricsDir = getMetricsDir(targetDir);

    if (!fs.existsSync(metricsDir)) {
        return null;
    }

    const files = fs.readdirSync(metricsDir)
        .filter(f => f.startsWith('run-') && f.endsWith('.json'))
        .sort((a, b) => a.localeCompare(b))
        .reverse();

    if (files.length === 0) {
        return null;
    }

    const latestFile = files[0];
    const content = fs.readFileSync(path.join(metricsDir, latestFile), 'utf8');
    return JSON.parse(content) as Metrics;
}

/**
 * Get total issues from metrics
 */
export function getTotalIssues(metrics: Metrics): number {
    return metrics.totalIssues;
}

/**
 * Format metrics for console output
 */
export function formatMetrics(metrics: Metrics): string {
    const lines = [
        '═'.repeat(60),
        '📊 ODAVL OBSERVE - Code Quality Metrics',
        '═'.repeat(60),
        '',
        `Run ID:      ${metrics.runId}`,
        `Timestamp:   ${metrics.timestamp}`,
        `Target Dir:  ${metrics.targetDir}`,
        '',
        '─'.repeat(60),
        'Detector Results:',
        '─'.repeat(60)
    ];

    const detectors = [
        { name: 'TypeScript', count: metrics.typescript },
        { name: 'ESLint', count: metrics.eslint },
        { name: 'Security', count: metrics.security },
        { name: 'Performance', count: metrics.performance },
        { name: 'Imports', count: metrics.imports },
        { name: 'Packages', count: metrics.packages },
        { name: 'Runtime', count: metrics.runtime },
        { name: 'Build', count: metrics.build },
        { name: 'Circular Dependencies', count: metrics.circular },
        { name: 'Network', count: metrics.network },
        { name: 'Complexity', count: metrics.complexity },
        { name: 'Component Isolation', count: metrics.isolation }
    ];

    for (const { name, count } of detectors) {
        const icon = getIconForCount(count);
        const paddedName = name.padEnd(25);
        lines.push(`  ${icon} ${paddedName} ${count.toString().padStart(3)} issues`);
    }

    lines.push(
        '─'.repeat(60),
        `Total Issues: ${metrics.totalIssues}`,
        '═'.repeat(60)
    );

    return lines.join('\n');
}

/**
 * Get icon based on issue count
 */
function getIconForCount(count: number): string {
    if (count === 0) return '✅';
    if (count < 5) return '⚠️';
    return '❌';
}

/**
 * Format metrics summary (compact version)
 */
export function formatMetricsSummary(metrics: Metrics): string {
    const critical = metrics.typescript + metrics.security;
    const warnings = metrics.eslint + metrics.performance;
    const info = metrics.totalIssues - critical - warnings;

    return `Total: ${metrics.totalIssues} (Critical: ${critical}, Warnings: ${warnings}, Info: ${info})`;
}

/**
 * Compare two metrics objects
 */
export function compareMetrics(before: Metrics, after: Metrics): {
    improved: boolean;
    change: number;
    changePercent: number;
    breakdown: Record<string, number>;
} {
    const change = after.totalIssues - before.totalIssues;
    const changePercent = before.totalIssues === 0
        ? 0
        : ((change / before.totalIssues) * 100);

    const breakdown: Record<string, number> = {
        typescript: after.typescript - before.typescript,
        eslint: after.eslint - before.eslint,
        security: after.security - before.security,
        performance: after.performance - before.performance,
        imports: after.imports - before.imports,
        packages: after.packages - before.packages,
        runtime: after.runtime - before.runtime,
        build: after.build - before.build,
        circular: after.circular - before.circular,
        network: after.network - before.network,
        complexity: after.complexity - before.complexity,
        isolation: after.isolation - before.isolation
    };

    return {
        improved: change < 0,
        change,
        changePercent,
        breakdown
    };
}
