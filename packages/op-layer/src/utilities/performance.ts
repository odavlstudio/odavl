/**
 * Performance Profiling Utilities
 * Phase 3B Task 4: Hot path optimization with dev-mode profiling
 * 
 * Usage:
 * ```typescript
 * import { perfProfile, perfMark, perfMeasure } from '@odavl/op-layer/perf';
 * 
 * // Wrap expensive operations
 * const result = await perfProfile('detector-analysis', async () => {
 *   return await runDetectors();
 * });
 * 
 * // Manual marks
 * perfMark('detector-start');
 * await runDetector();
 * perfMark('detector-end');
 * perfMeasure('detector-duration', 'detector-start', 'detector-end');
 * ```
 * 
 * @note Only logs in development mode (NODE_ENV !== 'production')
 */

/**
 * Performance mark - creates a timestamp marker
 */
export function perfMark(name: string): void {
  if (process.env.NODE_ENV === 'production') return;

  if (typeof performance !== 'undefined' && performance.mark) {
    performance.mark(name);
  }
}

/**
 * Performance measure - calculates duration between two marks
 */
export function perfMeasure(name: string, startMark: string, endMark: string): number {
  if (process.env.NODE_ENV === 'production') return 0;

  try {
    if (typeof performance !== 'undefined' && performance.measure) {
      const measure = performance.measure(name, startMark, endMark);
      const duration = measure.duration;
      console.log(`[PERF] ${name}: ${duration.toFixed(2)}ms`);
      return duration;
    }
  } catch (error) {
    // Marks might not exist - fallback to console
    console.warn(`[PERF] Failed to measure ${name}:`, error);
  }

  return 0;
}

/**
 * Performance profile - wraps an async function with timing
 * @returns Function result and duration in milliseconds
 */
export async function perfProfile<T>(
  name: string,
  fn: () => Promise<T>
): Promise<{ result: T; duration: number }> {
  if (process.env.NODE_ENV === 'production') {
    // Production: No profiling overhead
    const result = await fn();
    return { result, duration: 0 };
  }

  // Development: Profile execution
  const startMark = `${name}-start`;
  const endMark = `${name}-end`;

  perfMark(startMark);
  const startMs = Date.now();

  try {
    const result = await fn();
    const duration = Date.now() - startMs;

    perfMark(endMark);
    console.log(`[PERF] ${name}: ${duration}ms`);

    return { result, duration };
  } catch (error) {
    const duration = Date.now() - startMs;
    console.error(`[PERF] ${name} FAILED after ${duration}ms:`, error);
    throw error;
  }
}

/**
 * Performance profile (sync) - wraps a synchronous function with timing
 */
export function perfProfileSync<T>(
  name: string,
  fn: () => T
): { result: T; duration: number } {
  if (process.env.NODE_ENV === 'production') {
    // Production: No profiling overhead
    const result = fn();
    return { result, duration: 0 };
  }

  // Development: Profile execution
  const startMs = Date.now();

  try {
    const result = fn();
    const duration = Date.now() - startMs;

    console.log(`[PERF] ${name}: ${duration}ms`);
    return { result, duration };
  } catch (error) {
    const duration = Date.now() - startMs;
    console.error(`[PERF] ${name} FAILED after ${duration}ms:`, error);
    throw error;
  }
}

/**
 * Get all performance entries
 */
export function getPerfEntries(name?: string): any[] {
  if (process.env.NODE_ENV === 'production') return [];

  try {
    if (typeof performance !== 'undefined' && performance.getEntriesByName) {
      return name
        ? performance.getEntriesByName(name)
        : performance.getEntries();
    }
  } catch {
    // Performance API not available
  }

  return [];
}

/**
 * Clear performance marks and measures
 */
export function clearPerfMarks(name?: string): void {
  if (process.env.NODE_ENV === 'production') return;

  try {
    if (typeof performance !== 'undefined') {
      if (name) {
        performance.clearMarks(name);
        performance.clearMeasures(name);
      } else {
        performance.clearMarks();
        performance.clearMeasures();
      }
    }
  } catch {
    // Performance API not available
  }
}

/**
 * Performance statistics aggregator
 */
export class PerfStats {
  private measurements = new Map<
    string,
    { count: number; total: number; min: number; max: number }
  >();

  /**
   * Record a measurement
   */
  record(name: string, duration: number): void {
    const existing = this.measurements.get(name);

    if (existing) {
      existing.count++;
      existing.total += duration;
      existing.min = Math.min(existing.min, duration);
      existing.max = Math.max(existing.max, duration);
    } else {
      this.measurements.set(name, {
        count: 1,
        total: duration,
        min: duration,
        max: duration,
      });
    }
  }

  /**
   * Get statistics for a measurement
   */
  get(name: string): {
    count: number;
    avg: number;
    min: number;
    max: number;
    total: number;
  } | null {
    const stats = this.measurements.get(name);
    if (!stats) return null;

    return {
      count: stats.count,
      avg: stats.total / stats.count,
      min: stats.min,
      max: stats.max,
      total: stats.total,
    };
  }

  /**
   * Get all statistics
   */
  getAll(): Map<
    string,
    { count: number; avg: number; min: number; max: number; total: number }
  > {
    const result = new Map<
      string,
      { count: number; avg: number; min: number; max: number; total: number }
    >();

    for (const [name, stats] of this.measurements.entries()) {
      result.set(name, {
        count: stats.count,
        avg: stats.total / stats.count,
        min: stats.min,
        max: stats.max,
        total: stats.total,
      });
    }

    return result;
  }

  /**
   * Clear all statistics
   */
  clear(): void {
    this.measurements.clear();
  }

  /**
   * Print statistics to console
   */
  print(): void {
    if (process.env.NODE_ENV === 'production') return;

    console.log('\n[PERF STATS] ============================================');

    for (const [name, stats] of this.getAll().entries()) {
      console.log(
        `[PERF] ${name}:`,
        `count=${stats.count}`,
        `avg=${stats.avg.toFixed(2)}ms`,
        `min=${stats.min.toFixed(2)}ms`,
        `max=${stats.max.toFixed(2)}ms`,
        `total=${stats.total.toFixed(2)}ms`
      );
    }

    console.log('[PERF STATS] ============================================\n');
  }
}

/**
 * Global performance statistics instance
 */
export const globalPerfStats = new PerfStats();
