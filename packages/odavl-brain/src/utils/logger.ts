/**
 * ODAVL Brain Logger
 * Structured logging with timestamps
 */

export class Logger {
  private context: string;
  private verbose: boolean;

  constructor(context: string, verbose = false) {
    this.context = context;
    this.verbose = verbose;
  }

  private timestamp(): string {
    return new Date().toISOString();
  }

  private format(level: string, message: string): string {
    return `[${this.timestamp()}] [${this.context}] [${level}] ${message}`;
  }

  info(message: string): void {
    console.log(this.format('INFO', message));
  }

  success(message: string): void {
    console.log(this.format('SUCCESS', `✅ ${message}`));
  }

  warn(message: string): void {
    console.warn(this.format('WARN', `⚠️ ${message}`));
  }

  error(message: string, error?: Error): void {
    console.error(this.format('ERROR', `❌ ${message}`));
    if (error && this.verbose) {
      console.error(error.stack);
    }
  }

  debug(message: string): void {
    if (this.verbose) {
      console.log(this.format('DEBUG', message));
    }
  }

  section(title: string): void {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`  ${title}`);
    console.log('='.repeat(60));
  }
}
