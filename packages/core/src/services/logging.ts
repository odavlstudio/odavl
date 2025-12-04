/**
 * ODAVL Studio - Central Logging Service
 * Phase 3.2: Observability Stack
 * 
 * Production-grade logging with:
 * - Multiple transports (Console, File, HTTP)
 * - Log levels (error, warn, info, debug)
 * - Structured logging with metadata
 * - Request correlation IDs
 * - Performance tracking
 * - Error tracking with stack traces
 */

import winston from 'winston';
import path from 'path';

export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug'
}

export interface LogMetadata {
  userId?: string;
  orgId?: string;
  projectId?: string;
  requestId?: string;
  duration?: number; // milliseconds
  statusCode?: number;
  method?: string;
  path?: string;
  [key: string]: any;
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: Date;
  metadata?: LogMetadata;
  error?: {
    name: string;
    message: string;
    stack?: string;
    code?: string;
  };
}

class CentralLoggingService {
  private logger: winston.Logger;
  private readonly LOG_DIR = path.join(process.cwd(), 'logs');

  constructor() {
    // Create Winston logger with multiple transports
    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
      defaultMeta: {
        service: 'odavl-studio',
        environment: process.env.NODE_ENV || 'development'
      },
      transports: this.createTransports()
    });

    // Log initialization
    this.info('Central logging service initialized', {
      logLevel: process.env.LOG_LEVEL || 'info',
      environment: process.env.NODE_ENV || 'development'
    });
  }

  /**
   * Create Winston transports based on environment
   */
  private createTransports(): winston.transport[] {
    const transports: winston.transport[] = [];

    // Console transport for development
    if (process.env.NODE_ENV !== 'production') {
      transports.push(
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple(),
            winston.format.printf(({ level, message, timestamp, ...meta }) => {
              const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
              return `${timestamp} [${level}]: ${message} ${metaStr}`;
            })
          )
        })
      );
    }

    // File transports for production
    if (process.env.NODE_ENV === 'production') {
      // Error log file
      transports.push(
        new winston.transports.File({
          filename: path.join(this.LOG_DIR, 'error.log'),
          level: 'error',
          maxsize: 10 * 1024 * 1024, // 10MB
          maxFiles: 5,
          tailable: true
        })
      );

      // Combined log file
      transports.push(
        new winston.transports.File({
          filename: path.join(this.LOG_DIR, 'combined.log'),
          maxsize: 10 * 1024 * 1024, // 10MB
          maxFiles: 10,
          tailable: true
        })
      );

      // HTTP transport for log aggregation (e.g., Logtail, Datadog)
      if (process.env.LOG_HTTP_ENDPOINT) {
        transports.push(
          new winston.transports.Http({
            host: process.env.LOG_HTTP_ENDPOINT,
            path: '/logs',
            ssl: true
          })
        );
      }
    }

    return transports;
  }

  /**
   * Log error message
   */
  error(message: string, error?: Error, metadata?: LogMetadata): void {
    const logData: any = {
      message,
      ...metadata
    };

    if (error) {
      logData.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
        code: (error as any).code
      };
    }

    this.logger.error(logData);
  }

  /**
   * Log warning message
   */
  warn(message: string, metadata?: LogMetadata): void {
    this.logger.warn({
      message,
      ...metadata
    });
  }

  /**
   * Log info message
   */
  info(message: string, metadata?: LogMetadata): void {
    this.logger.info({
      message,
      ...metadata
    });
  }

  /**
   * Log debug message
   */
  debug(message: string, metadata?: LogMetadata): void {
    this.logger.debug({
      message,
      ...metadata
    });
  }

  /**
   * Log HTTP request
   */
  logRequest(req: {
    method: string;
    url: string;
    headers: any;
    userId?: string;
    requestId?: string;
  }): void {
    this.info('HTTP Request', {
      method: req.method,
      path: req.url,
      userId: req.userId,
      requestId: req.requestId,
      userAgent: req.headers['user-agent']
    });
  }

  /**
   * Log HTTP response
   */
  logResponse(res: {
    statusCode: number;
    method: string;
    url: string;
    duration: number;
    requestId?: string;
  }): void {
    const level = res.statusCode >= 500 ? LogLevel.ERROR :
                  res.statusCode >= 400 ? LogLevel.WARN :
                  LogLevel.INFO;

    this.logger.log(level, {
      message: 'HTTP Response',
      method: res.method,
      path: res.url,
      statusCode: res.statusCode,
      duration: res.duration,
      requestId: res.requestId
    });
  }

  /**
   * Log database query
   */
  logQuery(query: {
    sql: string;
    duration: number;
    rows?: number;
    error?: Error;
  }): void {
    if (query.error) {
      this.error('Database query failed', query.error, {
        sql: query.sql,
        duration: query.duration
      });
    } else {
      this.debug('Database query', {
        sql: query.sql,
        duration: query.duration,
        rows: query.rows
      });
    }
  }

  /**
   * Log external API call
   */
  logExternalAPI(call: {
    service: string;
    method: string;
    url: string;
    statusCode?: number;
    duration: number;
    error?: Error;
  }): void {
    if (call.error) {
      this.error(`External API call failed: ${call.service}`, call.error, {
        method: call.method,
        url: call.url,
        duration: call.duration
      });
    } else {
      this.info(`External API call: ${call.service}`, {
        method: call.method,
        url: call.url,
        statusCode: call.statusCode,
        duration: call.duration
      });
    }
  }

  /**
   * Log authentication event
   */
  logAuth(event: {
    type: 'login' | 'logout' | 'register' | 'password_reset' | 'token_refresh';
    userId?: string;
    success: boolean;
    provider?: string;
    ip?: string;
    error?: Error;
  }): void {
    if (!event.success) {
      this.warn(`Authentication failed: ${event.type}`, {
        userId: event.userId,
        provider: event.provider,
        ip: event.ip,
        error: event.error?.message
      });
    } else {
      this.info(`Authentication success: ${event.type}`, {
        userId: event.userId,
        provider: event.provider,
        ip: event.ip
      });
    }
  }

  /**
   * Log business event
   */
  logEvent(event: {
    type: string;
    action: string;
    userId?: string;
    orgId?: string;
    projectId?: string;
    metadata?: Record<string, any>;
  }): void {
    this.info(`Event: ${event.type} - ${event.action}`, {
      userId: event.userId,
      orgId: event.orgId,
      projectId: event.projectId,
      ...event.metadata
    });
  }

  /**
   * Create a child logger with default metadata
   */
  child(defaultMetadata: LogMetadata): winston.Logger {
    return this.logger.child(defaultMetadata);
  }

  /**
   * Query logs (for development/debugging)
   */
  async queryLogs(filters: {
    level?: LogLevel;
    startDate?: Date;
    endDate?: Date;
    userId?: string;
    requestId?: string;
    limit?: number;
  }): Promise<LogEntry[]> {
    // TODO: Implement log querying from file or database
    // For now, return empty array
    console.log('🔍 Querying logs with filters:', filters);
    return [];
  }

  /**
   * Get log statistics
   */
  async getStats(period: '1h' | '24h' | '7d' | '30d'): Promise<{
    total: number;
    byLevel: Record<LogLevel, number>;
    byService: Record<string, number>;
    avgResponseTime: number;
    errorRate: number;
  }> {
    // TODO: Implement stats calculation
    console.log(`📊 Calculating log stats for period: ${period}`);
    
    return {
      total: 0,
      byLevel: {
        [LogLevel.ERROR]: 0,
        [LogLevel.WARN]: 0,
        [LogLevel.INFO]: 0,
        [LogLevel.DEBUG]: 0
      },
      byService: {},
      avgResponseTime: 0,
      errorRate: 0
    };
  }
}

// Export singleton instance
export const logger = new CentralLoggingService();

// Export middleware for Next.js
export function loggingMiddleware(req: any, res: any, next: any) {
  const startTime = Date.now();
  const requestId = req.headers['x-request-id'] || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Add request ID to headers
  req.requestId = requestId;
  res.setHeader('X-Request-ID', requestId);

  // Log request
  logger.logRequest({
    method: req.method,
    url: req.url,
    headers: req.headers,
    userId: req.session?.user?.id,
    requestId
  });

  // Override res.end to log response
  const originalEnd = res.end;
  res.end = function(...args: any[]) {
    const duration = Date.now() - startTime;
    
    logger.logResponse({
      statusCode: res.statusCode,
      method: req.method,
      url: req.url,
      duration,
      requestId
    });

    originalEnd.apply(res, args);
  };

  next();
}
