/**
 * ODAVL Guardian - Logger Utility
 * Centralized logging with Winston
 */

import winston from 'winston';

export class Logger {
    private logger: winston.Logger;
    private context: string;

    constructor(context: string) {
        this.context = context;

        this.logger = winston.createLogger({
            level: process.env.LOG_LEVEL || 'info',
            format: winston.format.combine(
                winston.format.timestamp({
                    format: 'YYYY-MM-DD HH:mm:ss',
                }),
                winston.format.errors({ stack: true }),
                winston.format.splat(),
                winston.format.json()
            ),
            defaultMeta: { service: 'odavl-guardian', context: this.context },
            transports: [
                new winston.transports.Console({
                    format: winston.format.combine(
                        winston.format.colorize(),
                        winston.format.printf(({ timestamp, level, message, context, ...meta }) => {
                            const metaStr = Object.keys(meta).length
                                ? `\n${JSON.stringify(meta, null, 2)}`
                                : '';
                            return `${timestamp} [${context}] ${level}: ${message}${metaStr}`;
                        })
                    ),
                }),
                new winston.transports.File({
                    filename: 'logs/error.log',
                    level: 'error',
                }),
                new winston.transports.File({
                    filename: 'logs/combined.log',
                }),
            ],
        });
    }

    info(message: string, ...meta: any[]): void {
        this.logger.info(message, ...meta);
    }

    warn(message: string, ...meta: any[]): void {
        this.logger.warn(message, ...meta);
    }

    error(message: string, ...meta: any[]): void {
        this.logger.error(message, ...meta);
    }

    debug(message: string, ...meta: any[]): void {
        this.logger.debug(message, ...meta);
    }

    verbose(message: string, ...meta: any[]): void {
        this.logger.verbose(message, ...meta);
    }
}

// Export singleton instance
export const logger = new Logger('Guardian');
