/**
 * ODAVL Benchmarks — Shared Utilities
 * Common benchmark helpers
 */

import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

export function saveBenchmark(product: string, data: string, workspaceRoot: string = process.cwd()): void {
  const benchDir = join(workspaceRoot, '.odavl', 'bench');
  if (!existsSync(benchDir)) {
    mkdirSync(benchDir, { recursive: true });
  }
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `${product}-${timestamp}.json`;
  const path = join(benchDir, filename);
  
  writeFileSync(path, data);
}

export function formatDuration(ms: number): string {
  if (ms < 1000) {
    return `${ms.toFixed(2)}ms`;
  }
  return `${(ms / 1000).toFixed(2)}s`;
}

export function calculatePercentile(values: number[], percentile: number): number {
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.ceil((percentile / 100) * sorted.length) - 1;
  return sorted[index];
}
