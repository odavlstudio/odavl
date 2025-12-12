/**
 * ODAVL OPLayer - Parallel Execution Utility
 * Phase 3B: Runtime Performance Optimization
 * 
 * Enables controlled parallel execution with concurrency limits
 * Used by: Insight detectors, Guardian audits, Autopilot recipes
 */

/**
 * Task function that returns a promise
 */
export type Task<T> = () => Promise<T>;

/**
 * Result of parallel execution
 */
export interface ParallelResult<T> {
  /** Successfully completed results */
  results: T[];
  
  /** Failed tasks with errors */
  errors: Array<{ index: number; error: Error }>;
  
  /** Execution statistics */
  stats: {
    total: number;
    successful: number;
    failed: number;
    tookMs: number;
  };
}

/**
 * Run tasks in parallel with concurrency limit
 * 
 * @param tasks Array of task functions
 * @param concurrency Max number of concurrent tasks (default: Infinity)
 * @returns Results and statistics
 * 
 * @example
 * ```typescript
 * const tasks = [
 *   async () => analyzeFile('a.ts'),
 *   async () => analyzeFile('b.ts'),
 *   async () => analyzeFile('c.ts'),
 * ];
 * 
 * const { results, stats } = await runInParallel(tasks, 2);
 * console.log(`Analyzed ${stats.successful} files in ${stats.tookMs}ms`);
 * ```
 */
export async function runInParallel<T>(
  tasks: Task<T>[],
  concurrency: number = Infinity
): Promise<ParallelResult<T>> {
  const startMs = performance.now();
  const results: T[] = [];
  const errors: Array<{ index: number; error: Error }> = [];
  const executing = new Set<Promise<void>>();

  let taskIndex = 0;

  for (const task of tasks) {
    const currentIndex = taskIndex++;

    // Create promise for this task
    const p = Promise.resolve()
      .then(task)
      .then((result) => {
        results[currentIndex] = result;
      })
      .catch((error) => {
        errors.push({
          index: currentIndex,
          error: error instanceof Error ? error : new Error(String(error)),
        });
      })
      .finally(() => {
        executing.delete(p);
      });

    executing.add(p);

    // Wait if concurrency limit reached
    if (executing.size >= concurrency) {
      await Promise.race(executing);
    }
  }

  // Wait for all remaining tasks
  await Promise.all(executing);

  const tookMs = performance.now() - startMs;

  return {
    results: results.filter((r) => r !== undefined), // Filter out failed tasks
    errors,
    stats: {
      total: tasks.length,
      successful: results.filter((r) => r !== undefined).length,
      failed: errors.length,
      tookMs,
    },
  };
}

/**
 * Run tasks in parallel with fail-fast behavior
 * Stops execution on first error
 * 
 * @param tasks Array of task functions
 * @param concurrency Max number of concurrent tasks
 * @returns Array of results
 * @throws First error encountered
 */
export async function runInParallelFailFast<T>(
  tasks: Task<T>[],
  concurrency: number = Infinity
): Promise<T[]> {
  const results: T[] = [];
  const executing = new Set<Promise<void>>();
  let hasError = false;
  let firstError: Error | null = null;

  let taskIndex = 0;

  for (const task of tasks) {
    if (hasError) break; // Stop scheduling new tasks

    const currentIndex = taskIndex++;

    const p = Promise.resolve()
      .then(task)
      .then((result) => {
        if (!hasError) {
          results[currentIndex] = result;
        }
      })
      .catch((error) => {
        if (!hasError) {
          hasError = true;
          firstError = error instanceof Error ? error : new Error(String(error));
        }
      })
      .finally(() => {
        executing.delete(p);
      });

    executing.add(p);

    if (executing.size >= concurrency) {
      await Promise.race(executing);
    }
  }

  await Promise.all(executing);

  if (firstError) {
    throw firstError;
  }

  return results.filter((r) => r !== undefined);
}

/**
 * Run tasks in batches sequentially
 * Each batch runs in parallel, but batches run one after another
 * 
 * @param tasks Array of task functions
 * @param batchSize Number of tasks per batch
 * @returns Results and statistics
 */
export async function runInBatches<T>(
  tasks: Task<T>[],
  batchSize: number
): Promise<ParallelResult<T>> {
  const startMs = performance.now();
  const allResults: T[] = [];
  const allErrors: Array<{ index: number; error: Error }> = [];

  for (let i = 0; i < tasks.length; i += batchSize) {
    const batch = tasks.slice(i, i + batchSize);
    const { results, errors } = await runInParallel(batch, Infinity);

    // Adjust error indices for global context
    allErrors.push(...errors.map((e) => ({ ...e, index: e.index + i })));
    
    // Add results (maintaining order)
    for (let j = 0; j < batch.length; j++) {
      if (results[j] !== undefined) {
        allResults[i + j] = results[j];
      }
    }
  }

  const tookMs = performance.now() - startMs;

  return {
    results: allResults.filter((r) => r !== undefined),
    errors: allErrors,
    stats: {
      total: tasks.length,
      successful: allResults.filter((r) => r !== undefined).length,
      failed: allErrors.length,
      tookMs,
    },
  };
}

/**
 * Run tasks with retry logic
 * 
 * @param tasks Array of task functions
 * @param options Retry options
 * @returns Results and statistics
 */
export async function runInParallelWithRetry<T>(
  tasks: Task<T>[],
  options: {
    concurrency?: number;
    maxRetries?: number;
    retryDelayMs?: number;
  } = {}
): Promise<ParallelResult<T>> {
  const { concurrency = Infinity, maxRetries = 3, retryDelayMs = 1000 } = options;

  // Wrap each task with retry logic
  const tasksWithRetry = tasks.map((task) => async () => {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await task();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (attempt < maxRetries) {
          // Wait before retry
          await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
        }
      }
    }

    throw lastError;
  });

  return runInParallel(tasksWithRetry, concurrency);
}

/**
 * Map array items in parallel with concurrency control
 * 
 * @param items Array of items to process
 * @param mapper Function to transform each item
 * @param concurrency Max concurrent operations
 * @returns Array of mapped results
 */
export async function mapParallel<T, R>(
  items: T[],
  mapper: (item: T, index: number) => Promise<R>,
  concurrency: number = Infinity
): Promise<R[]> {
  const tasks = items.map((item, index) => () => mapper(item, index));
  const { results } = await runInParallel(tasks, concurrency);
  return results;
}

/**
 * Filter array items in parallel with concurrency control
 * 
 * @param items Array of items to filter
 * @param predicate Async predicate function
 * @param concurrency Max concurrent operations
 * @returns Array of filtered items
 */
export async function filterParallel<T>(
  items: T[],
  predicate: (item: T, index: number) => Promise<boolean>,
  concurrency: number = Infinity
): Promise<T[]> {
  const tasks = items.map((item, index) => () => predicate(item, index));
  const { results } = await runInParallel(tasks, concurrency);

  return items.filter((_, index) => results[index]);
}

/**
 * Get optimal concurrency based on CPU cores
 * 
 * @param maxConcurrency Optional max limit
 * @returns Recommended concurrency level
 */
export function getOptimalConcurrency(maxConcurrency?: number): number {
  // Use CPU cores / 2 as default (avoid overloading system)
  const cpuCount = typeof navigator !== 'undefined' && navigator.hardwareConcurrency
    ? navigator.hardwareConcurrency
    : 4; // Fallback to 4

  const optimal = Math.max(1, Math.floor(cpuCount / 2));

  return maxConcurrency ? Math.min(optimal, maxConcurrency) : optimal;
}
