/**
 * Memory Profiling Script
 * 
 * Monitors memory usage and detects leaks
 * Generates heap snapshots for analysis
 * 
 * Usage:
 *   pnpm profile:memory              # Monitor for 60 seconds
 *   pnpm profile:memory --duration 300  # Monitor for 5 minutes
 */

import { performance } from 'perf_hooks';
import * as v8 from 'v8';
import * as fs from 'fs';
import * as path from 'path';

interface MemorySnapshot {
    timestamp: number;
    heapUsed: number;
    heapTotal: number;
    external: number;
    rss: number;
    arrayBuffers: number;
}

interface MemoryAnalysis {
    snapshots: MemorySnapshot[];
    avgHeapUsed: number;
    maxHeapUsed: number;
    heapGrowthRate: number; // MB/minute
    potentialLeak: boolean;
    recommendations: string[];
}

/**
 * Take a memory snapshot
 */
function takeSnapshot(): MemorySnapshot {
    const mem = process.memoryUsage();
    return {
        timestamp: Date.now(),
        heapUsed: mem.heapUsed / 1024 / 1024, // MB
        heapTotal: mem.heapTotal / 1024 / 1024,
        external: mem.external / 1024 / 1024,
        rss: mem.rss / 1024 / 1024,
        arrayBuffers: mem.arrayBuffers / 1024 / 1024
    };
}

/**
 * Generate heap snapshot file
 */
function generateHeapSnapshot(filename: string) {
    const snapshotPath = path.join(process.cwd(), 'reports', filename);

    // Ensure reports directory exists
    if (!fs.existsSync(path.dirname(snapshotPath))) {
        fs.mkdirSync(path.dirname(snapshotPath), { recursive: true });
    }

    const snapshot = v8.writeHeapSnapshot(snapshotPath);
    console.log(`📸 Heap snapshot saved: ${snapshot}`);
    return snapshot;
}

/**
 * Analyze memory snapshots
 */
function analyzeMemory(snapshots: MemorySnapshot[]): MemoryAnalysis {
    const heapUsedValues = snapshots.map(s => s.heapUsed);
    const avgHeapUsed = heapUsedValues.reduce((a, b) => a + b, 0) / heapUsedValues.length;
    const maxHeapUsed = Math.max(...heapUsedValues);

    // Calculate growth rate (MB/minute)
    const firstSnapshot = snapshots[0];
    const lastSnapshot = snapshots[snapshots.length - 1];
    const timeDiffMinutes = (lastSnapshot.timestamp - firstSnapshot.timestamp) / 1000 / 60;
    const heapGrowth = lastSnapshot.heapUsed - firstSnapshot.heapUsed;
    const heapGrowthRate = heapGrowth / timeDiffMinutes;

    // Detect potential memory leaks
    // If heap grows >10MB/minute consistently, likely a leak
    const potentialLeak = heapGrowthRate > 10;

    const recommendations: string[] = [];

    if (potentialLeak) {
        recommendations.push(
            '⚠️  Potential memory leak detected!',
            '   → Heap growing at ' + heapGrowthRate.toFixed(2) + ' MB/minute',
            '   → Check for:',
            '     - Event listeners not being removed',
            '     - Timers/intervals not being cleared',
            '     - Large objects in closures',
            '     - Cache entries not being evicted',
            '   → Use Chrome DevTools to analyze heap snapshot'
        );
    }

    if (maxHeapUsed > 500) {
        recommendations.push(
            '⚠️  High memory usage detected (>500MB)',
            '   → Consider:',
            '     - Implementing pagination for large datasets',
            '     - Using streams for large file processing',
            '     - Reducing cache size limits',
            '     - Increasing server memory allocation'
        );
    }

    if (avgHeapUsed < 100 && heapGrowthRate < 2) {
        recommendations.push(
            '✅ Memory usage looks healthy',
            '   → Average heap: ' + avgHeapUsed.toFixed(2) + ' MB',
            '   → Growth rate: ' + heapGrowthRate.toFixed(2) + ' MB/min'
        );
    }

    return {
        snapshots,
        avgHeapUsed,
        maxHeapUsed,
        heapGrowthRate,
        potentialLeak,
        recommendations
    };
}

/**
 * Print memory analysis
 */
function printAnalysis(analysis: MemoryAnalysis) {
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║              MEMORY PROFILING ANALYSIS                     ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    console.log(`📊 Snapshots Collected: ${analysis.snapshots.length}`);
    console.log(`📈 Average Heap Used: ${analysis.avgHeapUsed.toFixed(2)} MB`);
    console.log(`📈 Max Heap Used: ${analysis.maxHeapUsed.toFixed(2)} MB`);
    console.log(`📊 Heap Growth Rate: ${analysis.heapGrowthRate.toFixed(2)} MB/min`);
    console.log(`${analysis.potentialLeak ? '⚠️  Potential Leak: YES' : '✅ Potential Leak: NO'}\n`);

    // Memory trend graph (ASCII)
    console.log('═══ MEMORY USAGE TREND ═══\n');
    const maxForGraph = Math.max(...analysis.snapshots.map(s => s.heapUsed));
    const scale = 50 / maxForGraph; // Scale to 50 chars

    for (let i = 0; i < Math.min(20, analysis.snapshots.length); i += Math.floor(analysis.snapshots.length / 20) || 1) {
        const snapshot = analysis.snapshots[i];
        const barLength = Math.floor(snapshot.heapUsed * scale);
        const bar = '█'.repeat(barLength);
        console.log(`   ${snapshot.heapUsed.toFixed(1).padStart(6)} MB │${bar}`);
    }
    console.log('');

    // Recommendations
    if (analysis.recommendations.length > 0) {
        console.log('═══ RECOMMENDATIONS ═══\n');
        for (const rec of analysis.recommendations) {
            console.log(rec);
        }
        console.log('');
    }
}

/**
 * Monitor memory usage
 */
async function monitorMemory(durationSeconds: number = 60) {
    console.log(`\n🔍 Starting memory profiling (${durationSeconds}s)...\n`);

    const snapshots: MemorySnapshot[] = [];
    const interval = 3000; // 3 seconds
    const iterations = Math.floor((durationSeconds * 1000) / interval);

    // Take initial heap snapshot
    const startSnapshot = `heap-start-${Date.now()}.heapsnapshot`;
    generateHeapSnapshot(startSnapshot);

    // Force garbage collection if available
    if (global.gc) {
        console.log('🗑️  Running garbage collection...\n');
        global.gc();
    } else {
        console.log('⚠️  Run with --expose-gc flag to enable GC\n');
    }

    // Monitor memory
    for (let i = 0; i < iterations; i++) {
        const snapshot = takeSnapshot();
        snapshots.push(snapshot);

        // Progress indicator
        const progress = ((i + 1) / iterations) * 100;
        process.stdout.write(`\r   Progress: ${progress.toFixed(0)}% | Heap: ${snapshot.heapUsed.toFixed(2)} MB`);

        await new Promise(resolve => setTimeout(resolve, interval));
    }

    console.log('\n');

    // Take final heap snapshot
    const endSnapshot = `heap-end-${Date.now()}.heapsnapshot`;
    generateHeapSnapshot(endSnapshot);

    // Analyze results
    const analysis = analyzeMemory(snapshots);
    printAnalysis(analysis);

    console.log(`\n💡 Compare heap snapshots in Chrome DevTools:`);
    console.log(`   1. Open Chrome DevTools → Memory tab`);
    console.log(`   2. Load heap snapshots: ${startSnapshot} and ${endSnapshot}`);
    console.log(`   3. Compare to identify memory leaks\n`);
}

/**
 * Main function
 */
async function main() {
    const args = process.argv.slice(2);
    const durationArg = args.find(arg => arg.startsWith('--duration='));
    const duration = durationArg ? parseInt(durationArg.split('=')[1], 10) : 60;

    await monitorMemory(duration);

    console.log('✅ Memory profiling complete\n');
}

// Run if executed directly
if (require.main === module) {
    main().catch(console.error);
}

export { monitorMemory, analyzeMemory };
export type { MemoryAnalysis };
