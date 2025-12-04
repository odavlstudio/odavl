/**
 * Environment Variable Validation
 * Ensures all required environment variables are set before starting the app
 */

import { z } from 'zod';
import logger from './logger';

// Environment schema
const envSchema = z.object({
    // Node environment
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

    // Database
    DATABASE_URL: z.string().url('DATABASE_URL must be a valid PostgreSQL URL'),

    // Redis
    REDIS_URL: z.string().url('REDIS_URL must be a valid Redis URL'),

    // JWT
    JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
    JWT_EXPIRES_IN: z.string().default('7d'),

    // Socket.IO
    NEXT_PUBLIC_SOCKET_URL: z.string().url('NEXT_PUBLIC_SOCKET_URL must be a valid URL'),

    // Sentry (optional in development)
    SENTRY_DSN: z.string().url().optional(),
    SENTRY_ORG: z.string().optional(),
    SENTRY_PROJECT: z.string().optional(),

    // CORS
    ALLOWED_ORIGINS: z.string().default('http://localhost:3003'),

    // Rate limiting
    RATE_LIMIT_MAX_REQUESTS: z.string().default('100'),
    RATE_LIMIT_WINDOW_SECONDS: z.string().default('60'),

    // Encryption (Week 12)
    ENCRYPTION_KEY: z.string().length(64, 'ENCRYPTION_KEY must be 64 hex characters (32 bytes)').regex(/^[0-9a-f]{64}$/i, 'ENCRYPTION_KEY must be valid hex'),

    // Server
    PORT: z.string().default('3003'),
    HOST: z.string().default('0.0.0.0'),

    // Email (optional)
    SMTP_HOST: z.string().optional(),
    SMTP_PORT: z.string().optional(),
    SMTP_USER: z.string().optional(),
    SMTP_PASSWORD: z.string().optional(),
    SMTP_FROM: z.string().email().optional(),

    // OpenTelemetry (optional)
    OTEL_EXPORTER_OTLP_ENDPOINT: z.string().url().optional(),
    OTEL_SERVICE_NAME: z.string().default('guardian'),

    // Feature flags
    ENABLE_METRICS: z.string().default('true'),
    ENABLE_TRACING: z.string().default('false'),
    ENABLE_LOGGING: z.string().default('true'),
});

type Env = z.infer<typeof envSchema>;

let validatedEnv: Env | null = null;

/**
 * Validate environment variables
 */
export function validateEnv(): Env {
    if (validatedEnv) {
        return validatedEnv;
    }

    try {
        validatedEnv = envSchema.parse(process.env);

        logger.info('Environment variables validated successfully', {
            nodeEnv: validatedEnv.NODE_ENV,
            port: validatedEnv.PORT,
            enableMetrics: validatedEnv.ENABLE_METRICS,
            enableTracing: validatedEnv.ENABLE_TRACING,
        });

        return validatedEnv;
    } catch (error) {
        if (error instanceof z.ZodError) {
            logger.error('Environment validation failed', {
                errors: error.errors.map(err => ({
                    path: err.path.join('.'),
                    message: err.message,
                })),
            });

            // Print detailed error
            console.error('❌ Environment Variable Validation Failed:');
            console.error('');
            error.errors.forEach(err => {
                console.error(`  - ${err.path.join('.')}: ${err.message}`);
            });
            console.error('');
            console.error('Please check your .env file or environment variables.');

            process.exit(1);
        }

        throw error;
    }
}

/**
 * Get validated environment variables
 */
export function getEnv(): Env {
    if (!validatedEnv) {
        return validateEnv();
    }
    return validatedEnv;
}

/**
 * Check if running in production
 */
export function isProduction(): boolean {
    return getEnv().NODE_ENV === 'production';
}

/**
 * Check if running in development
 */
export function isDevelopment(): boolean {
    return getEnv().NODE_ENV === 'development';
}

/**
 * Check if running in test
 */
export function isTest(): boolean {
    return getEnv().NODE_ENV === 'test';
}

/**
 * Get feature flag value
 */
export function isFeatureEnabled(feature: 'metrics' | 'tracing' | 'logging'): boolean {
    const env = getEnv();
    switch (feature) {
        case 'metrics':
            return env.ENABLE_METRICS === 'true';
        case 'tracing':
            return env.ENABLE_TRACING === 'true';
        case 'logging':
            return env.ENABLE_LOGGING === 'true';
        default:
            return false;
    }
}

// Validate on module load (fail fast)
if (process.env.NODE_ENV !== 'test') {
    validateEnv();
}
