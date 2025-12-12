/**
 * Benchmark Runner
 * 
 * Measures performance of ODAVL Insight analysis.
 * Compares single-threaded vs multi-threaded execution.
 * 
 * @since Phase 1 Week 19 (December 2025)
 */

import { performance } from 'node:perf_hooks';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as os from 'node:os';
import { createWorkerPool } from '../../packages/core/src/performance/worker-pool';
import { createStreamAnalyzer } from '../../packages/core/src/performance/stream-analyzer';

export interface BenchmarkOptions {
  iterations?: number; // Number of runs (default: 3)
  warmup?: boolean; // Warmup run (default: true)
  reportPath?: string; // Output file (default: reports/benchmark-results.json)
  verbose?: boolean; // Detailed logging (default: false)
}

export interface BenchmarkResult {
  name: string;
  duration: number; // ms
  throughput: number; // LOC/s
  memory: number; // MB
  cpu: number; // %
  timestamp: string;
  environment: EnvironmentInfo;
}

export interface EnvironmentInfo {
  os: string;
  cpus: number;
  memory: number; // GB
  nodeVersion: string;
}

export interface BenchmarkSuite {
  name: string;
  description: string;
  results: BenchmarkResult[];
  summary: BenchmarkSummary;
}

export interface BenchmarkSummary {
  totalDuration: number;
  avgDuration: number;
  minDuration: number;
  maxDuration: number;
  stdDev: number;
  improvement: number; // % vs baseline
}

/**
 * Benchmark runner
 */
export class BenchmarkRunner {
  private options: Required<BenchmarkOptions>;
  private results: BenchmarkResult[] = [];

  constructor(options: BenchmarkOptions = {}) {
    this.options = {
      iterations: options.iterations || 3,
      warmup: options.warmup !== false,
      reportPath: options.reportPath || 'reports/benchmark-results.json',
      verbose: options.verbose || false,
    };
  }

  /**
   * Run benchmark suite
   */
  async run(testCases: TestCase[]): Promise<BenchmarkSuite> {
    this.log('Starting benchmark suite...');
    this.log(`Environment: ${os.cpus().length} CPUs, ${Math.round(os.totalmem() / 1024 / 1024 / 1024)}GB RAM`);

    // Warmup
    if (this.options.warmup) {
      this.log('Running warmup...');
      await this.runTestCase(testCases[0], 'warmup');
    }

    // Run all test cases
    for (const testCase of testCases) {
      this.log(`\nRunning: ${testCase.name}`);

      for (let i = 0; i < this.options.iterations; i++) {
        this.log(`  Iteration ${i + 1}/${this.options.iterations}`);
        const result = await this.runTestCase(testCase, testCase.name);
        this.results.push(result);
      }
    }

    // Generate summary
    const summary = this.generateSummary();

    // Save report
    const suite: BenchmarkSuite = {
      name: 'ODAVL Insight Performance',
      description: 'Performance benchmarks for analysis engine',
      results: this.results,
      summary,
    };

    await this.saveReport(suite);

    this.log('\nBenchmark complete!');
    this.log(`Results saved to: ${this.options.reportPath}`);

    return suite;
  }

  /**
   * Run single test case
   */
  private async runTestCase(testCase: TestCase, name: string): Promise<BenchmarkResult> {
    // Measure memory before
    if (global.gc) global.gc();
    const startMemory = process.memoryUsage().heapUsed;
    const startCpu = process.cpuUsage();

    // Execute test
    const startTime = performance.now();
    await testCase.fn();
    const endTime = performance.now();

    // Measure memory after
    const endMemory = process.memoryUsage().heapUsed;
    const endCpu = process.cpuUsage(startCpu);

    const duration = endTime - startTime;
    const memoryMB = (endMemory - startMemory) / 1024 / 1024;
    const cpuSeconds = (endCpu.user + endCpu.system) / 1000000;
    const cpuPercent = (cpuSeconds / (duration / 1000)) * 100;

    const result: BenchmarkResult = {
      name,
      duration,
      throughput: testCase.loc / (duration / 1000), // LOC/s
      memory: memoryMB,
      cpu: cpuPercent,
      timestamp: new Date().toISOString(),
      environment: this.getEnvironmentInfo(),
    };

    this.log(`    Duration: ${duration.toFixed(2)}ms`);
    this.log(`    Throughput: ${result.throughput.toFixed(0)} LOC/s`);
    this.log(`    Memory: ${memoryMB.toFixed(2)}MB`);

    return result;
  }

  /**
   * Generate summary statistics
   */
  private generateSummary(): BenchmarkSummary {
    const durations = this.results.map(r => r.duration);
    const avg = durations.reduce((a, b) => a + b, 0) / durations.length;
    const min = Math.min(...durations);
    const max = Math.max(...durations);

    // Standard deviation
    const variance = durations.reduce((sum, d) => sum + Math.pow(d - avg, 2), 0) / durations.length;
    const stdDev = Math.sqrt(variance);

    // Improvement (if baseline exists)
    const baseline = this.results.find(r => r.name === 'single-threaded');
    const optimized = this.results.find(r => r.name === 'multi-threaded');
    const improvement = baseline && optimized
      ? ((baseline.duration - optimized.duration) / baseline.duration) * 100
      : 0;

    return {
      totalDuration: durations.reduce((a, b) => a + b, 0),
      avgDuration: avg,
      minDuration: min,
      maxDuration: max,
      stdDev,
      improvement,
    };
  }

  /**
   * Save report to file
   */
  private async saveReport(suite: BenchmarkSuite): Promise<void> {
    const reportDir = path.dirname(this.options.reportPath);
    await fs.mkdir(reportDir, { recursive: true });
    await fs.writeFile(this.options.reportPath, JSON.stringify(suite, null, 2), 'utf-8');
  }

  /**
   * Get environment info
   */
  private getEnvironmentInfo(): EnvironmentInfo {
    return {
      os: `${os.type()} ${os.release()}`,
      cpus: os.cpus().length,
      memory: Math.round(os.totalmem() / 1024 / 1024 / 1024),
      nodeVersion: process.version,
    };
  }

  /**
   * Log message
   */
  private log(message: string): void {
    if (this.options.verbose) {
      console.log(message);
    }
  }
}

/**
 * Test case definition
 */
export interface TestCase {
  name: string;
  fn: () => Promise<void>;
  loc: number; // Lines of code being analyzed
}

/**
 * Helper: Create test fixtures
 */
export async function createTestFixtures(fixtureDir: string): Promise<void> {
  await fs.mkdir(fixtureDir, { recursive: true });

  // Small project (10k LOC)
  const smallDir = path.join(fixtureDir, 'small');
  await fs.mkdir(smallDir, { recursive: true });
  await createFiles(smallDir, 100, 100); // 100 files × 100 lines

  // Medium project (50k LOC)
  const mediumDir = path.join(fixtureDir, 'medium');
  await fs.mkdir(mediumDir, { recursive: true });
  await createFiles(mediumDir, 250, 200); // 250 files × 200 lines

  // Large project (100k LOC)
  const largeDir = path.join(fixtureDir, 'large');
  await fs.mkdir(largeDir, { recursive: true });
  await createFiles(largeDir, 500, 200); // 500 files × 200 lines
}

/**
 * Helper: Create dummy files
 */
async function createFiles(dir: string, count: number, linesPerFile: number): Promise<void> {
  for (let i = 0; i < count; i++) {
    const fileName = `file${i}.ts`;
    const filePath = path.join(dir, fileName);

    const lines = Array.from({ length: linesPerFile }, (_, j) => {
      return `export function func${i}_${j}() { return ${i + j}; }`;
    });

    await fs.writeFile(filePath, lines.join('\n'), 'utf-8');
  }
}

/**
 * Run benchmark (CLI)
 */
async function main() {
  console.log('ODAVL Insight Performance Benchmark\n');

  // Create fixtures
  const fixtureDir = path.join(process.cwd(), 'fixtures', 'benchmark');
  console.log('Creating test fixtures...');
  await createTestFixtures(fixtureDir);

  // Define test cases
  const testCases: TestCase[] = [
    {
      name: 'single-threaded',
      loc: 10000,
      fn: async () => {
        // Simulate single-threaded analysis
        const analyzer = createStreamAnalyzer();
        const files = await getFiles(path.join(fixtureDir, 'small'));
        for (const file of files) {
          await analyzer.analyzeFile(file);
        }
      },
    },
    {
      name: 'multi-threaded',
      loc: 10000,
      fn: async () => {
        // Multi-threaded analysis
        const pool = await createWorkerPool();
        const files = await getFiles(path.join(fixtureDir, 'small'));
        const tasks = files.map(file => ({
          id: file,
          type: 'analyze-file',
          data: { filePath: file, detectors: ['console-log'] },
        }));
        await pool.process(tasks);
        await pool.shutdown();
      },
    },
  ];

  // Run benchmarks
  const runner = new BenchmarkRunner({
    iterations: 5,
    warmup: true,
    verbose: true,
  });

  const suite = await runner.run(testCases);

  // Print summary
  console.log('\n=== Summary ===');
  console.log(`Average duration: ${suite.summary.avgDuration.toFixed(2)}ms`);
  console.log(`Min duration: ${suite.summary.minDuration.toFixed(2)}ms`);
  console.log(`Max duration: ${suite.summary.maxDuration.toFixed(2)}ms`);
  console.log(`Std deviation: ${suite.summary.stdDev.toFixed(2)}ms`);
  console.log(`Improvement: ${suite.summary.improvement.toFixed(1)}%`);
}

/**
 * Helper: Get all files in directory
 */
async function getFiles(dir: string): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...await getFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith('.ts')) {
      files.push(fullPath);
    }
  }

  return files;
}

// Run if executed directly
if (require.main === module) {
  main().catch(console.error);
}

export default BenchmarkRunner;
