/**
 * Progress Indicators Utility
 * Beautiful progress bars and spinners for CLI
 */

export interface ProgressOptions {
  total: number;
  width?: number;
  complete?: string;
  incomplete?: string;
  renderThrottle?: number;
  callback?: (progress: Progress) => void;
}

export class Progress {
  private current: number = 0;
  private readonly total: number;
  private readonly width: number;
  private readonly completeChar: string;
  private readonly incompleteChar: string;
  private readonly renderThrottle: number;
  private lastRender: number = 0;
  private callback?: (progress: Progress) => void;

  constructor(options: ProgressOptions) {
    this.total = options.total;
    this.width = options.width || 40;
    this.completeChar = options.complete || '█';
    this.incompleteChar = options.incomplete || '░';
    this.renderThrottle = options.renderThrottle || 16; // 60fps
    this.callback = options.callback;
  }

  /**
   * Update progress
   */
  tick(amount: number = 1): void {
    this.current = Math.min(this.current + amount, this.total);
    
    const now = Date.now();
    if (now - this.lastRender >= this.renderThrottle || this.isComplete()) {
      this.render();
      this.lastRender = now;
      
      if (this.callback) {
        this.callback(this);
      }
    }
  }

  /**
   * Set absolute progress
   */
  update(current: number): void {
    const diff = current - this.current;
    if (diff > 0) {
      this.tick(diff);
    }
  }

  /**
   * Check if progress is complete
   */
  isComplete(): boolean {
    return this.current >= this.total;
  }

  /**
   * Get percentage (0-100)
   */
  getPercentage(): number {
    return Math.round((this.current / this.total) * 100);
  }

  /**
   * Render progress bar
   */
  private render(): void {
    const percentage = this.getPercentage();
    const filled = Math.round((this.width * this.current) / this.total);
    const empty = this.width - filled;

    const bar = this.completeChar.repeat(filled) + this.incompleteChar.repeat(empty);
    const colors = {
      cyan: '\x1b[36m',
      green: '\x1b[32m',
      yellow: '\x1b[33m',
      reset: '\x1b[0m',
      bold: '\x1b[1m',
    };

    let color = colors.cyan;
    if (percentage === 100) color = colors.green;
    else if (percentage >= 75) color = colors.cyan;
    else if (percentage >= 50) color = colors.yellow;

    process.stdout.write(
      `\r${color}${colors.bold}▕${bar}▏${colors.reset} ${percentage}% (${this.current}/${this.total})`
    );

    if (this.isComplete()) {
      process.stdout.write('\n');
    }
  }

  /**
   * Complete immediately
   */
  complete(): void {
    this.current = this.total;
    this.render();
  }
}

/**
 * Spinner for indeterminate progress
 */
export class Spinner {
  private readonly frames: string[];
  private readonly interval: number;
  private currentFrame: number = 0;
  private timer?: NodeJS.Timeout;
  private readonly message: string;

  constructor(message: string = 'Loading...', frames?: string[]) {
    this.message = message;
    this.frames = frames || ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
    this.interval = 80;
  }

  /**
   * Start spinning
   */
  start(): void {
    this.currentFrame = 0;
    this.render();
    
    this.timer = setInterval(() => {
      this.currentFrame = (this.currentFrame + 1) % this.frames.length;
      this.render();
    }, this.interval);
  }

  /**
   * Update message
   */
  update(message: string): void {
    (this as any).message = message;
    this.render();
  }

  /**
   * Stop with success
   */
  succeed(message?: string): void {
    this.stop('\x1b[32m✓\x1b[0m', message);
  }

  /**
   * Stop with failure
   */
  fail(message?: string): void {
    this.stop('\x1b[31m✗\x1b[0m', message);
  }

  /**
   * Stop with warning
   */
  warn(message?: string): void {
    this.stop('\x1b[33m⚠\x1b[0m', message);
  }

  /**
   * Stop with info
   */
  info(message?: string): void {
    this.stop('\x1b[36mℹ\x1b[0m', message);
  }

  /**
   * Stop spinning
   */
  private stop(symbol: string, message?: string): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = undefined;
    }

    process.stdout.clearLine(0);
    process.stdout.cursorTo(0);
    console.log(`${symbol} ${message || this.message}`);
  }

  /**
   * Render current frame
   */
  private render(): void {
    const frame = this.frames[this.currentFrame];
    process.stdout.clearLine(0);
    process.stdout.cursorTo(0);
    process.stdout.write(`\x1b[36m${frame}\x1b[0m ${this.message}`);
  }
}

/**
 * Multi-progress for tracking multiple tasks
 */
export class MultiProgress {
  private readonly bars: Map<string, Progress> = new Map();
  private readonly spinners: Map<string, Spinner> = new Map();

  /**
   * Add progress bar
   */
  addBar(id: string, options: ProgressOptions): Progress {
    const bar = new Progress(options);
    this.bars.set(id, bar);
    return bar;
  }

  /**
   * Add spinner
   */
  addSpinner(id: string, message: string): Spinner {
    const spinner = new Spinner(message);
    this.spinners.set(id, spinner);
    return spinner;
  }

  /**
   * Get bar by ID
   */
  getBar(id: string): Progress | undefined {
    return this.bars.get(id);
  }

  /**
   * Get spinner by ID
   */
  getSpinner(id: string): Spinner | undefined {
    return this.spinners.get(id);
  }

  /**
   * Complete all
   */
  completeAll(): void {
    for (const bar of this.bars.values()) {
      bar.complete();
    }
    for (const spinner of this.spinners.values()) {
      spinner.succeed();
    }
  }
}

/**
 * Convenient progress helpers
 */
export const ProgressHelpers = {
  /**
   * Show progress for file operations
   */
  showFileProgress(files: string[], operation: (file: string) => Promise<void>): Promise<void> {
    return new Promise(async (resolve, reject) => {
      const bar = new Progress({
        total: files.length,
        width: 40,
        callback: (progress) => {
          if (progress.isComplete()) {
            resolve();
          }
        },
      });

      console.log(`\n📁 Processing ${files.length} files:\n`);

      for (const file of files) {
        try {
          await operation(file);
          bar.tick();
        } catch (error) {
          reject(error);
          break;
        }
      }
    });
  },

  /**
   * Show spinner for async operation
   */
  async withSpinner<T>(message: string, operation: () => Promise<T>): Promise<T> {
    const spinner = new Spinner(message);
    spinner.start();

    try {
      const result = await operation();
      spinner.succeed();
      return result;
    } catch (error) {
      spinner.fail(`${message} failed`);
      throw error;
    }
  },

  /**
   * Show progress for array of tasks
   */
  async showTaskProgress<T>(
    tasks: Array<{ name: string; fn: () => Promise<T> }>
  ): Promise<T[]> {
    const bar = new Progress({
      total: tasks.length,
      width: 40,
    });

    console.log(`\n⚡ Running ${tasks.length} tasks:\n`);

    const results: T[] = [];

    for (const task of tasks) {
      console.log(`\n   ${task.name}...`);
      const result = await task.fn();
      results.push(result);
      bar.tick();
    }

    return results;
  },

  /**
   * Show estimated time remaining
   */
  showETAProgress(
    total: number,
    operation: (index: number) => Promise<void>
  ): Promise<void> {
    return new Promise(async (resolve, reject) => {
      const startTime = Date.now();
      let current = 0;

      const bar = new Progress({
        total,
        width: 40,
        callback: (progress) => {
          const elapsed = Date.now() - startTime;
          const rate = current / (elapsed / 1000);
          const remaining = (total - current) / rate;

          if (!isNaN(remaining) && isFinite(remaining)) {
            const eta = Math.round(remaining);
            process.stdout.write(` ETA: ${eta}s`);
          }

          if (progress.isComplete()) {
            const totalTime = Math.round((Date.now() - startTime) / 1000);
            console.log(`\n✅ Completed in ${totalTime}s\n`);
            resolve();
          }
        },
      });

      console.log(`\n⏱️  Processing ${total} items:\n`);

      for (let i = 0; i < total; i++) {
        try {
          await operation(i);
          current++;
          bar.tick();
        } catch (error) {
          reject(error);
          break;
        }
      }
    });
  },
};

/**
 * Example usage:
 * 
 * // Simple progress bar
 * const bar = new Progress({ total: 100 });
 * for (let i = 0; i < 100; i++) {
 *   await doWork();
 *   bar.tick();
 * }
 * 
 * // Spinner
 * const spinner = new Spinner('Loading...');
 * spinner.start();
 * await doAsyncWork();
 * spinner.succeed('Done!');
 * 
 * // With helper
 * await ProgressHelpers.withSpinner('Analyzing...', async () => {
 *   return await analyze();
 * });
 */
