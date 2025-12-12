/**
 * ODAVL Guardian App - Logger Utility (Stub)
 * Simplified console-based logging (winston removed)
 */

export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug',
}

export class Logger {
  private context: string;

  constructor(context: string) {
    this.context = context;
  }

  error(message: string, meta?: any): void {
    console.error(`[${this.context}] ERROR:`, message, meta || '');
  }

  warn(message: string, meta?: any): void {
    console.warn(`[${this.context}] WARN:`, message, meta || '');
  }

  info(message: string, meta?: any): void {
    console.info(`[${this.context}] INFO:`, message, meta || '');
  }

  debug(message: string, meta?: any): void {
    console.debug(`[${this.context}] DEBUG:`, message, meta || '');
  }
}
