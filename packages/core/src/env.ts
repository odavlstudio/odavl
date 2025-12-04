/**
 * Environment Configuration & Validation
 */

import { z } from 'zod';

/**
 * Environment validation schemas
 */

// Database configuration
const DatabaseSchema = z.object({
  DATABASE_URL: z.string().url('Invalid PostgreSQL connection string'),
  DATABASE_POOL_MIN: z.coerce.number().min(1).default(2),
  DATABASE_POOL_MAX: z.coerce.number().min(1).default(10),
});

// Authentication configuration
const AuthSchema = z.object({
  NEXTAUTH_URL: z.string().url('Invalid NextAuth URL'),
  NEXTAUTH_SECRET: z.string().min(32, 'NextAuth secret must be at least 32 characters'),
  GITHUB_ID: z.string().optional(),
  GITHUB_SECRET: z.string().optional(),
  GOOGLE_ID: z.string().optional(),
  GOOGLE_SECRET: z.string().optional(),
});

// Storage configuration
const StorageSchema = z.object({
  STORAGE_PROVIDER: z.enum(['s3', 'azure', 'local']).default('local'),
  AWS_REGION: z.string().optional(),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  S3_BUCKET: z.string().optional(),
  AZURE_STORAGE_ACCOUNT: z.string().optional(),
  AZURE_STORAGE_KEY: z.string().optional(),
  AZURE_CONTAINER: z.string().optional(),
});

// Email configuration
const EmailSchema = z.object({
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  SMTP_FROM: z.string().email().optional(),
});

// Monitoring configuration
const MonitoringSchema = z.object({
  SENTRY_DSN: z.string().url().optional(),
  SENTRY_ENVIRONMENT: z.enum(['development', 'staging', 'production']).default('development'),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
});

// API configuration
const ApiSchema = z.object({
  API_URL: z.string().url().default('http://localhost:3000/api/v1'),
  API_RATE_LIMIT: z.coerce.number().min(1).default(1000),
  API_TIMEOUT: z.coerce.number().min(1000).default(30000),
});

// Backup configuration
const BackupSchema = z.object({
  BACKUP_ENABLED: z.coerce.boolean().default(false),
  BACKUP_SCHEDULE: z.string().default('0 2 * * *'), // Daily at 2 AM
  BACKUP_RETENTION_DAYS: z.coerce.number().min(1).default(7),
  BACKUP_RETENTION_WEEKS: z.coerce.number().min(1).default(4),
  BACKUP_RETENTION_MONTHS: z.coerce.number().min(1).default(3),
});

/**
 * Complete environment schema
 */
export const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'staging', 'production']).default('development'),
  PORT: z.coerce.number().min(1).max(65535).default(3000),
})
  .merge(DatabaseSchema)
  .merge(AuthSchema)
  .merge(StorageSchema)
  .merge(EmailSchema)
  .merge(MonitoringSchema)
  .merge(ApiSchema)
  .merge(BackupSchema);

export type Env = z.infer<typeof EnvSchema>;

/**
 * Validate environment variables
 */
export function validateEnv(env: NodeJS.ProcessEnv = process.env): {
  success: boolean;
  data?: Env;
  errors?: string[];
} {
  try {
    const data = EnvSchema.parse(env);
    return { success: true, data };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map(
        (err) => `${err.path.join('.')}: ${err.message}`
      );
      return { success: false, errors };
    }
    return { success: false, errors: ['Unknown validation error'] };
  }
}

/**
 * Get validated environment
 */
export function getEnv(): Env {
  const result = validateEnv();
  if (!result.success) {
    console.error('Environment validation failed:');
    result.errors?.forEach((error) => console.error(`  - ${error}`));
    throw new Error('Invalid environment configuration');
  }
  return result.data!;
}

/**
 * Check if environment is production
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

/**
 * Check if environment is staging
 */
export function isStaging(): boolean {
  return process.env.NODE_ENV === 'staging';
}

/**
 * Check if environment is development
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development';
}

/**
 * Get required environment variable
 */
export function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

/**
 * Get optional environment variable
 */
export function getEnvVar(key: string, defaultValue?: string): string | undefined {
  return process.env[key] || defaultValue;
}

/**
 * Environment configuration report
 */
export function getEnvReport(): {
  environment: string;
  database: { configured: boolean; poolSize: string };
  auth: { providers: string[] };
  storage: { provider: string };
  email: { configured: boolean };
  monitoring: { enabled: boolean };
  backup: { enabled: boolean; schedule?: string };
} {
  const env = getEnv();

  return {
    environment: env.NODE_ENV,
    database: {
      configured: !!env.DATABASE_URL,
      poolSize: `${env.DATABASE_POOL_MIN}-${env.DATABASE_POOL_MAX}`,
    },
    auth: {
      providers: [
        env.GITHUB_ID ? 'github' : null,
        env.GOOGLE_ID ? 'google' : null,
      ].filter(Boolean) as string[],
    },
    storage: {
      provider: env.STORAGE_PROVIDER,
    },
    email: {
      configured: !!env.SMTP_HOST,
    },
    monitoring: {
      enabled: !!env.SENTRY_DSN,
    },
    backup: {
      enabled: env.BACKUP_ENABLED,
      schedule: env.BACKUP_ENABLED ? env.BACKUP_SCHEDULE : undefined,
    },
  };
}
