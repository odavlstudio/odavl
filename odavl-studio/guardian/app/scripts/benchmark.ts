/**
 * API Performance Benchmark Script
 * 
 * Measures response times for critical API endpoints
 * Compares before/after optimization results
 * 
 * Usage:
 *   pnpm benchmark              # Run all benchmarks
 *   pnpm benchmark --endpoint monitors  # Test specific endpoint
 */

import axios from 'axios';
import { performance } from 'perf_hooks';

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:3003';
const ITERATIONS = 100;
const WARMUP_ITERATIONS = 10;

interface BenchmarkResult {
    endpoint: string;
    method: string;
    iterations: number;
    avgResponseTime: number;
    minResponseTime: number;
    maxResponseTime: number;
    p50: number;
    p95: number;
    p99: number;
    throughput: number; // requests/sec
    successRate: number;
}

/**
 * Calculate percentile from sorted array
 */
function percentile(arr: number[], p: number): number {
    const index = Math.ceil((arr.length * p) / 100) - 1;
    return arr[index];
}

/**
 * Benchmark a single endpoint
 */
async function benchmarkEndpoint(
    name: string,
    method: string,
    url: string,
    data?: unknown
): Promise<BenchmarkResult> {
    console.log(`\n📊 Benchmarking: ${method} ${name}`);
    console.log(`   URL: ${url}`);
    console.log(`   Iterations: ${ITERATIONS} (+ ${WARMUP_ITERATIONS} warmup)`);

    const responseTimes: number[] = [];
    let successCount = 0;

    // Warmup phase
    console.log('   🔥 Warming up...');
    for (let i = 0; i < WARMUP_ITERATIONS; i++) {
        try {
            await axios({ method, url, data });
        } catch (error) {
            // Ignore warmup errors
        }
    }

    // Actual benchmark
    console.log('   ⏱️  Running benchmark...');
    const startTime = performance.now();

    for (let i = 0; i < ITERATIONS; i++) {
        const reqStart = performance.now();
        try {
            const response = await axios({ method, url, data });
            const reqEnd = performance.now();

            if (response.status === 200) {
                responseTimes.push(reqEnd - reqStart);
                successCount++;
            }
        } catch (error) {
            console.error(`   ❌ Request ${i + 1} failed:`, (error as Error).message);
        }

        // Progress indicator
        if ((i + 1) % 10 === 0) {
            process.stdout.write(`\r   Progress: ${i + 1}/${ITERATIONS}`);
        }
    }

    const endTime = performance.now();
    const totalTime = (endTime - startTime) / 1000; // seconds

    // Sort for percentile calculations
    responseTimes.sort((a, b) => a - b);

    const result: BenchmarkResult = {
        endpoint: name,
        method,
        iterations: ITERATIONS,
        avgResponseTime: responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length,
        minResponseTime: responseTimes[0],
        maxResponseTime: responseTimes[responseTimes.length - 1],
        p50: percentile(responseTimes, 50),
        p95: percentile(responseTimes, 95),
        p99: percentile(responseTimes, 99),
        throughput: successCount / totalTime,
        successRate: (successCount / ITERATIONS) * 100
    };

    console.log('\n   ✅ Complete\n');
    return result;
}

/**
 * Print benchmark results
 */
function printResults(results: BenchmarkResult[]) {
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║            GUARDIAN API PERFORMANCE BENCHMARK              ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    for (const result of results) {
        console.log(`📍 ${result.method} ${result.endpoint}`);
        console.log(`   Average:    ${result.avgResponseTime.toFixed(2)}ms`);
        console.log(`   Min:        ${result.minResponseTime.toFixed(2)}ms`);
        console.log(`   Max:        ${result.maxResponseTime.toFixed(2)}ms`);
        console.log(`   P50:        ${result.p50.toFixed(2)}ms`);
        console.log(`   P95:        ${result.p95.toFixed(2)}ms`);
        console.log(`   P99:        ${result.p99.toFixed(2)}ms`);
        console.log(`   Throughput: ${result.throughput.toFixed(2)} req/s`);
        console.log(`   Success:    ${result.successRate.toFixed(1)}%`);
        console.log('');
    }

    // Summary
    const avgOfAvgs = results.reduce((sum, r) => sum + r.avgResponseTime, 0) / results.length;
    const totalThroughput = results.reduce((sum, r) => sum + r.throughput, 0);

    console.log('═══════════════════════════════════════════════════════════');
    console.log(`📈 Overall Average Response Time: ${avgOfAvgs.toFixed(2)}ms`);
    console.log(`🚀 Total Throughput: ${totalThroughput.toFixed(2)} req/s`);
    console.log('═══════════════════════════════════════════════════════════\n');
}

/**
 * Compare with baseline results
 */
function compareWithBaseline(results: BenchmarkResult[]) {
    // Baseline (before optimization)
    const baseline = {
        monitors: { avg: 180, p95: 250 },
        'test-runs': { avg: 220, p95: 350 },
        'analytics/timeseries': { avg: 900, p95: 1200 }
    };

    console.log('📊 COMPARISON WITH BASELINE (Before Optimization)\n');

    for (const result of results) {
        const endpointName = result.endpoint.split(' ')[0];
        const base = baseline[endpointName as keyof typeof baseline];

        if (base) {
            const avgImprovement = ((base.avg - result.avgResponseTime) / base.avg) * 100;
            const p95Improvement = ((base.p95 - result.p95) / base.p95) * 100;

            console.log(`📍 ${result.endpoint}`);
            console.log(`   Average:  ${base.avg}ms → ${result.avgResponseTime.toFixed(2)}ms (${avgImprovement > 0 ? '✅' : '❌'} ${Math.abs(avgImprovement).toFixed(1)}% ${avgImprovement > 0 ? 'faster' : 'slower'})`);
            console.log(`   P95:      ${base.p95}ms → ${result.p95.toFixed(2)}ms (${p95Improvement > 0 ? '✅' : '❌'} ${Math.abs(p95Improvement).toFixed(1)}% ${p95Improvement > 0 ? 'faster' : 'slower'})`);
            console.log('');
        }
    }
}

/**
 * Main benchmark runner
 */
async function main() {
    console.log('\n🚀 Starting Guardian API Performance Benchmark\n');
    console.log(`   Base URL: ${BASE_URL}`);
    console.log(`   Iterations: ${ITERATIONS} per endpoint`);
    console.log(`   Warmup: ${WARMUP_ITERATIONS} requests\n`);

    const results: BenchmarkResult[] = [];

    try {
        // Test project ID (use a real one from your DB or mock)
        const projectId = process.env.TEST_PROJECT_ID || 'test-project-1';

        // Benchmark critical endpoints
        results.push(
            await benchmarkEndpoint(
                'monitors',
                'GET',
                `${BASE_URL}/api/monitors?projectId=${projectId}`
            )
        );

        results.push(
            await benchmarkEndpoint(
                'test-runs',
                'GET',
                `${BASE_URL}/api/test-runs?projectId=${projectId}&limit=50`
            )
        );

        results.push(
            await benchmarkEndpoint(
                'analytics/timeseries',
                'GET',
                `${BASE_URL}/api/analytics/timeseries?metric=tests&days=30`
            )
        );

        // Print results
        printResults(results);
        compareWithBaseline(results);

        // Performance targets
        console.log('🎯 PERFORMANCE TARGETS\n');
        console.log('   ✅ Average < 100ms: ' + (results.every(r => r.avgResponseTime < 100) ? 'PASS' : 'FAIL'));
        console.log('   ✅ P95 < 200ms:     ' + (results.every(r => r.p95 < 200) ? 'PASS' : 'FAIL'));
        console.log('   ✅ P99 < 500ms:     ' + (results.every(r => r.p99 < 500) ? 'PASS' : 'FAIL'));
        console.log('   ✅ Success > 95%:   ' + (results.every(r => r.successRate > 95) ? 'PASS' : 'FAIL'));
        console.log('');

    } catch (error) {
        console.error('\n❌ Benchmark failed:', error);
        process.exit(1);
    }
}

// Run if executed directly
if (require.main === module) {
    main().catch(console.error);
}

export { benchmarkEndpoint };
export type { BenchmarkResult };
