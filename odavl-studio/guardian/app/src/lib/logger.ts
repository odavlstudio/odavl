import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';

// Custom format for structured logging
const structuredFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
);

// Human-readable format for console
const consoleFormat = winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp({ format: 'HH:mm:ss' }),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
        let msg = `${timestamp} [${level}]: ${message}`;
        if (Object.keys(meta).length > 0) {
            msg += `\n${JSON.stringify(meta, null, 2)}`;
        }
        return msg;
    })
);

// Log directory
const logDir = path.join(process.cwd(), 'logs');

// Create the logger
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: structuredFormat,
    defaultMeta: {
        service: 'guardian',
        environment: process.env.NODE_ENV || 'development',
    },
    transports: [
        // Console transport (development)
        new winston.transports.Console({
            format: consoleFormat,
            level: process.env.NODE_ENV === 'production' ? 'warn' : 'debug',
        }),

        // Daily rotating file for all logs
        new DailyRotateFile({
            filename: path.join(logDir, 'application-%DATE%.log'),
            datePattern: 'YYYY-MM-DD',
            zippedArchive: true,
            maxSize: '20m',
            maxFiles: '14d',
            level: 'info',
        }),

        // Daily rotating file for errors only
        new DailyRotateFile({
            filename: path.join(logDir, 'error-%DATE%.log'),
            datePattern: 'YYYY-MM-DD',
            zippedArchive: true,
            maxSize: '20m',
            maxFiles: '30d',
            level: 'error',
        }),

        // Daily rotating file for debug logs (development only)
        ...(process.env.NODE_ENV !== 'production'
            ? [
                new DailyRotateFile({
                    filename: path.join(logDir, 'debug-%DATE%.log'),
                    datePattern: 'YYYY-MM-DD',
                    zippedArchive: true,
                    maxSize: '10m',
                    maxFiles: '7d',
                    level: 'debug',
                }),
            ]
            : []),
    ],
    exceptionHandlers: [
        new DailyRotateFile({
            filename: path.join(logDir, 'exceptions-%DATE%.log'),
            datePattern: 'YYYY-MM-DD',
            zippedArchive: true,
            maxSize: '20m',
            maxFiles: '30d',
        }),
    ],
    rejectionHandlers: [
        new DailyRotateFile({
            filename: path.join(logDir, 'rejections-%DATE%.log'),
            datePattern: 'YYYY-MM-DD',
            zippedArchive: true,
            maxSize: '20m',
            maxFiles: '30d',
        }),
    ],
});

// Helper functions for structured logging
export const logWithContext = (
    level: string,
    message: string,
    context?: Record<string, any>
) => {
    logger.log(level, message, context);
};

export const logRequest = (req: {
    method: string;
    url: string;
    headers?: Record<string, any>;
    body?: any;
}) => {
    logger.info('HTTP Request', {
        method: req.method,
        url: req.url,
        headers: req.headers,
        body: req.body,
        timestamp: new Date().toISOString(),
    });
};

export const logResponse = (res: {
    statusCode: number;
    duration: number;
    url: string;
}) => {
    logger.info('HTTP Response', {
        statusCode: res.statusCode,
        duration: `${res.duration}ms`,
        url: res.url,
        timestamp: new Date().toISOString(),
    });
};

export const logError = (
    error: Error,
    context?: Record<string, any>
) => {
    logger.error('Error occurred', {
        message: error.message,
        stack: error.stack,
        name: error.name,
        ...context,
    });
};

export const logTestRun = (testRun: {
    id: string;
    type: string;
    status: string;
    duration?: number;
}) => {
    logger.info('Test Run', {
        testRunId: testRun.id,
        testType: testRun.type,
        status: testRun.status,
        duration: testRun.duration ? `${testRun.duration}ms` : undefined,
        timestamp: new Date().toISOString(),
    });
};

export const logMonitor = (monitor: {
    id: string;
    url: string;
    status: string;
    responseTime?: number;
    statusCode?: number;
}) => {
    logger.info('Monitor Check', {
        monitorId: monitor.id,
        url: monitor.url,
        status: monitor.status,
        responseTime: monitor.responseTime ? `${monitor.responseTime}ms` : undefined,
        statusCode: monitor.statusCode,
        timestamp: new Date().toISOString(),
    });
};

export const logDatabase = (query: {
    operation: string;
    table: string;
    duration: number;
    error?: Error;
}) => {
    if (query.error) {
        logger.error('Database Query Error', {
            operation: query.operation,
            table: query.table,
            duration: `${query.duration}ms`,
            error: query.error.message,
            stack: query.error.stack,
        });
    } else {
        logger.debug('Database Query', {
            operation: query.operation,
            table: query.table,
            duration: `${query.duration}ms`,
        });
    }
};

export const logWorker = (worker: {
    name: string;
    jobId: string;
    status: 'started' | 'completed' | 'failed';
    duration?: number;
    error?: Error;
}) => {
    const level = worker.status === 'failed' ? 'error' : 'info';
    logger.log(level, 'Worker Job', {
        workerName: worker.name,
        jobId: worker.jobId,
        status: worker.status,
        duration: worker.duration ? `${worker.duration}ms` : undefined,
        error: worker.error?.message,
        stack: worker.error?.stack,
        timestamp: new Date().toISOString(),
    });
};

// Create child logger with additional context
export const createChildLogger = (context: Record<string, any>) => {
    return logger.child(context);
};

export default logger;
