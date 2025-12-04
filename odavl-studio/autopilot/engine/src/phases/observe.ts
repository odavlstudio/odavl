/**
 * ODAVL CLI - OBSERVE Phase
 * Real implementation with 12 ODAVL Insight detectors
 */

// @ts-expect-error - Insight Core built with esbuild (runtime types unavailable)
import {
    TSDetector,
    ESLintDetector,
    SecurityDetector,
    PerformanceDetector,
    ImportDetector,
    PackageDetector,
    RuntimeDetector,
    BuildDetector,
    CircularDependencyDetector,
    NetworkDetector,
    ComplexityDetector,
    ComponentIsolationDetector
} from '@odavl-studio/insight-core/detector';
import { generateRunId } from '../utils/file-naming.js';

export type Metrics = {
    timestamp: string;
    runId: string;
    targetDir: string;
    typescript: number;
    eslint: number;
    security: number;
    performance: number;
    imports: number;
    packages: number;
    runtime: number;
    build: number;
    circular: number;
    network: number;
    complexity: number;
    isolation: number;
    totalIssues: number;
    details?: {
        typescript?: any[];
        eslint?: any[];
        security?: any[];
        performance?: any[];
        imports?: any[];
        packages?: any[];
        runtime?: any[];
        build?: any[];
        circular?: any[];
        network?: any[];
        complexity?: any[];
        isolation?: any[];
    };
};

/**
 * OBSERVE Phase: Run all 12 ODAVL Insight detectors in parallel
 * Optimized: ~30s execution (vs 89s sequential)
 * @param targetDir - Directory to analyze (defaults to process.cwd())
 * @returns Metrics object with all detector results
 */
export async function observe(targetDir: string = process.cwd()): Promise<Metrics> {
    // Type validation: Ensure targetDir is a string (handle edge cases like observe({}))
    if (typeof targetDir !== 'string' || targetDir.trim() === '') {
        targetDir = process.cwd();
    }

    console.log(`🔍 OBSERVE Phase: Analyzing ${targetDir} (parallel mode)...`);
    const startTime = Date.now();

    const timestamp = new Date().toISOString();
    const runId = generateRunId(); // Human-readable: 2024-11-24T14-30-45

    const metrics: Metrics = {
        timestamp,
        runId,
        targetDir,
        typescript: 0,
        eslint: 0,
        security: 0,
        performance: 0,
        imports: 0,
        packages: 0,
        runtime: 0,
        build: 0,
        circular: 0,
        network: 0,
        complexity: 0,
        isolation: 0,
        totalIssues: 0,
        details: {}
    };

    try {
        // Run all detectors in parallel with Promise.allSettled for resilience
        console.log('  → Running 12 detectors in parallel...');

        const detectorPromises = [
            // TypeScript
            (async () => {
                const detector = new TSDetector(targetDir);
                const errors = await detector.detect(targetDir);
                return { name: 'typescript', errors };
            })(),
            // ESLint
            (async () => {
                const detector = new ESLintDetector(targetDir);
                const errors = await detector.detect(targetDir);
                return { name: 'eslint', errors };
            })(),
            // Security
            (async () => {
                const detector = new SecurityDetector(targetDir);
                const errors = await detector.detect(targetDir);
                return { name: 'security', errors };
            })(),
            // Performance
            (async () => {
                const detector = new PerformanceDetector(targetDir);
                const errors = await detector.detect(targetDir);
                return { name: 'performance', errors };
            })(),
            // Import
            (async () => {
                const detector = new ImportDetector(targetDir);
                const errors = await detector.detect(targetDir);
                return { name: 'imports', errors };
            })(),
            // Package
            (async () => {
                const detector = new PackageDetector(targetDir);
                const errors = await detector.detect(targetDir);
                return { name: 'packages', errors };
            })(),
            // Runtime
            (async () => {
                const detector = new RuntimeDetector(targetDir);
                const errors = await detector.detect(targetDir);
                return { name: 'runtime', errors };
            })(),
            // Build
            (async () => {
                const detector = new BuildDetector(targetDir);
                const errors = await detector.detect(targetDir);
                return { name: 'build', errors };
            })(),
            // Circular Dependencies
            (async () => {
                const detector = new CircularDependencyDetector(targetDir);
                const errors = await detector.detect(targetDir);
                return { name: 'circular', errors };
            })(),
            // Network
            (async () => {
                const detector = new NetworkDetector(targetDir);
                const errors = await detector.detect(targetDir);
                return { name: 'network', errors };
            })(),
            // Complexity
            (async () => {
                const detector = new ComplexityDetector();
                const errors = await detector.detect(targetDir);
                return { name: 'complexity', errors };
            })(),
            // Component Isolation
            (async () => {
                const detector = new ComponentIsolationDetector(targetDir);
                const errors = await detector.detect(targetDir);
                return { name: 'isolation', errors };
            })()
        ];

        // Wait for all detectors (continue even if some fail)
        const results = await Promise.allSettled(detectorPromises);

        // Process results
        for (let index = 0; index < results.length; index++) {
            const result = results[index];
            if (result.status === 'fulfilled') {
                const { name, errors } = result.value;
                const errorCount = errors.length;

                // Update metrics
                (metrics as any)[name] = errorCount;
                if (errorCount > 0) {
                    (metrics.details as any)[name] = errors;
                }

                console.log(`    ✓ ${name}: ${errorCount} issues`);
            } else {
                // Detector failed - log but continue
                const detectorNames = [
                    'typescript', 'eslint', 'security', 'performance',
                    'imports', 'packages', 'runtime', 'build',
                    'circular', 'network', 'complexity', 'isolation'
                ];
                console.warn(`    ⚠ ${detectorNames[index]} detector failed:`, result.reason?.message || result.reason);
            }
        }

        // Calculate total issues
        metrics.totalIssues =
            metrics.typescript +
            metrics.eslint +
            metrics.security +
            metrics.performance +
            metrics.imports +
            metrics.packages +
            metrics.runtime +
            metrics.build +
            metrics.circular +
            metrics.network +
            metrics.complexity +
            metrics.isolation;

        const duration = ((Date.now() - startTime) / 1000).toFixed(1);
        console.log(`✅ OBSERVE Complete: ${metrics.totalIssues} total issues found (${duration}s)\n`);

        return metrics;

    } catch (error) {
        console.error('❌ OBSERVE Phase failed:', error);
        throw error;
    }
}
