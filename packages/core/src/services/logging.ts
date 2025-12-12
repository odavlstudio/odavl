/**
 * Logging Service Stub
 * Original used winston - replaced with console-based logging
 */

export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug',
}

export interface LogMetadata {
  [key: string]: any;
}

export class LoggingService {
  private context: string;

  constructor(context: string = 'App') {
    this.context = context;
  }

  error(message: string, meta?: LogMetadata): void {
    console.error(`[${this.context}] ERROR:`, message, meta || '');
  }

  warn(message: string, meta?: LogMetadata): void {
    console.warn(`[${this.context}] WARN:`, message, meta || '');
  }

  info(message: string, meta?: LogMetadata): void {
    console.info(`[${this.context}] INFO:`, message, meta || '');
  }

  debug(message: string, meta?: LogMetadata): void {
    console.debug(`[${this.context}] DEBUG:`, message, meta || '');
  }

  log(level: LogLevel, message: string, meta?: LogMetadata): void {
    switch (level) {
      case LogLevel.ERROR:
        this.error(message, meta);
        break;
      case LogLevel.WARN:
        this.warn(message, meta);
        break;
      case LogLevel.INFO:
        this.info(message, meta);
        break;
      case LogLevel.DEBUG:
        this.debug(message, meta);
        break;
    }
  }
}

export const loggingService = new LoggingService('ODAVL');
