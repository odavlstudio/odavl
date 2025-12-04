/**
 * Concurrency Limiter
 * 
 * Limits number of concurrent operations to prevent memory spikes.
 * Ensures stable memory usage during parallel processing.
 * 
 * Expected Improvement: More stable memory usage, prevents OOM
 */

export interface ConcurrencyLimiterOptions {
  maxConcurrent?: number; // Max concurrent operations (default: 4)
  queueSize?: number; // Max queue size (default: Infinity)
}

export class ConcurrencyLimiter {
  private maxConcurrent: number;
  private queueSize: number;
  private running = 0;
  private queue: Array<{
    fn: () => Promise<any>;
    resolve: (value: any) => void;
    reject: (error: any) => void;
  }> = [];

  constructor(options: ConcurrencyLimiterOptions = {}) {
    this.maxConcurrent = options.maxConcurrent || 4;
    this.queueSize = options.queueSize || Infinity;
  }

  /**
   * Run function with concurrency limit
   * 
   * @param fn Function to execute
   * @returns Promise with function result
   */
  async run<T>(fn: () => Promise<T>): Promise<T> {
    // Check queue size
    if (this.queue.length >= this.queueSize) {
      throw new Error(`Queue size exceeded (max: ${this.queueSize})`);
    }

    // If under limit, run immediately
    if (this.running < this.maxConcurrent) {
      return this.execute(fn);
    }

    // Otherwise, queue it
    return new Promise<T>((resolve, reject) => {
      this.queue.push({ fn, resolve, reject });
    });
  }

  /**
   * Execute function and manage queue
   */
  private async execute<T>(fn: () => Promise<T>): Promise<T> {
    this.running++;

    try {
      const result = await fn();
      return result;
    } finally {
      this.running--;
      this.processQueue();
    }
  }

  /**
   * Process next item in queue
   */
  private processQueue(): void {
    if (this.queue.length === 0 || this.running >= this.maxConcurrent) {
      return;
    }

    const next = this.queue.shift();
    if (!next) return;

    this.execute(next.fn)
      .then(next.resolve)
      .catch(next.reject);
  }

  /**
   * Run multiple functions with concurrency limit
   * 
   * @param fns Array of functions to execute
   * @returns Array of results
   */
  async runAll<T>(fns: Array<() => Promise<T>>): Promise<T[]> {
    return Promise.all(fns.map((fn) => this.run(fn)));
  }

  /**
   * Run functions with concurrency limit and progress callback
   * 
   * @param fns Array of functions
   * @param onProgress Progress callback
   * @returns Array of results
   */
  async runAllWithProgress<T>(
    fns: Array<() => Promise<T>>,
    onProgress: (completed: number, total: number) => void
  ): Promise<T[]> {
    let completed = 0;
    const total = fns.length;

    const wrappedFns = fns.map((fn) => async () => {
      const result = await fn();
      completed++;
      onProgress(completed, total);
      return result;
    });

    return this.runAll(wrappedFns);
  }

  /**
   * Get current statistics
   */
  getStats(): {
    running: number;
    queued: number;
    maxConcurrent: number;
    available: number;
  } {
    return {
      running: this.running,
      queued: this.queue.length,
      maxConcurrent: this.maxConcurrent,
      available: this.maxConcurrent - this.running,
    };
  }

  /**
   * Wait for all running operations to complete
   */
  async waitForAll(): Promise<void> {
    while (this.running > 0 || this.queue.length > 0) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  /**
   * Clear queue
   */
  clearQueue(): void {
    // Reject all queued items
    this.queue.forEach(({ reject }) => {
      reject(new Error('Queue cleared'));
    });
    this.queue = [];
  }

  /**
   * Update max concurrent limit
   */
  setMaxConcurrent(max: number): void {
    this.maxConcurrent = max;
    // Process queue in case we increased limit
    while (this.running < this.maxConcurrent && this.queue.length > 0) {
      this.processQueue();
    }
  }
}

/**
 * Example usage:
 * 
 * const limiter = new ConcurrencyLimiter({ maxConcurrent: 4 });
 * 
 * // Limit concurrent file analyses
 * const files = await glob('** /*.ts'); // 1,247 files
 * 
 * const results = await limiter.runAll(
 *   files.map((file) => () => analyzeFile(file))
 * );
 * 
 * // With progress tracking
 * const results = await limiter.runAllWithProgress(
 *   files.map((file) => () => analyzeFile(file)),
 *   (completed, total) => {
 *     console.log(`Progress: ${completed}/${total} (${((completed/total)*100).toFixed(1)}%)`);
 *   }
 * );
 * 
 * // Memory usage:
 * // Without limiter: 1,247 files × 1MB = 1,247MB (OOM crash!)
 * // With limiter (4): 4 files × 1MB = 4MB peak (stable!)
 * 
 * // Real-world example:
 * const detectors = [
 *   new TypeScriptDetector(),
 *   new ESLintDetector(),
 *   new SecurityDetector(),
 *   // ... 12 total detectors
 * ];
 * 
 * const limiter = new ConcurrencyLimiter({ maxConcurrent: 4 });
 * 
 * const results = await limiter.runAll(
 *   detectors.map((detector) => () => detector.analyze(workspace))
 * );
 * 
 * // Runs 4 detectors at a time, preventing memory spikes
 */
