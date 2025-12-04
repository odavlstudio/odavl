/**
 * Environment Variables Validation with Zod
 *
 * This file validates all environment variables at startup to prevent runtime errors.
 * If any required variable is missing or invalid, the app will fail fast with a clear error message.
 *
 * @security All sensitive variables (secrets, keys) must be validated here.
 * @usage Import { env } from '@/lib/env' instead of using process.env directly.
 */

import { z } from "zod";

/**
 * Server-side environment variables schema
 * These are only available on the server (API routes, server components)
 */
const serverEnvSchema = z.object({
  // Database
  DATABASE_URL: z.string().url().describe("PostgreSQL connection string"),

  // Authentication (NextAuth)
  NEXTAUTH_SECRET: z
    .string()
    .min(32, "NEXTAUTH_SECRET must be at least 32 characters")
    .describe("JWT signing secret"),
  NEXTAUTH_URL: z.string().url().describe("Base URL for OAuth callbacks"),

  // OAuth Providers
  GITHUB_ID: z.string().min(1).describe("GitHub OAuth App Client ID"),
  GITHUB_SECRET: z.string().min(1).describe("GitHub OAuth App Client Secret"),
  GOOGLE_ID: z.string().min(1).describe("Google OAuth Client ID"),
  GOOGLE_SECRET: z.string().min(1).describe("Google OAuth Client Secret"),

  // Security
  ENCRYPTION_KEY: z
    .string()
    .length(32, "ENCRYPTION_KEY must be exactly 32 characters")
    .optional()
    .describe("AES-256 encryption key"),
  CSRF_SECRET: z
    .string()
    .min(32, "CSRF_SECRET must be at least 32 characters")
    .describe("CSRF token signing secret"),

  // Monitoring & Observability (all optional)
  SENTRY_DSN: z.string().optional().transform(val => val === "" ? undefined : val).pipe(z.string().url().optional()).describe("Sentry error tracking DSN"),
  SENTRY_AUTH_TOKEN: z.string().optional().describe("Sentry release upload token"),
  DATADOG_API_KEY: z.string().optional().describe("DataDog monitoring API key"),

  // Email Service (optional, for newsletter/contact forms)
  RESEND_API_KEY: z.string().optional().describe("Resend email service API key"),
  SMTP_HOST: z.string().optional().describe("SMTP server hostname"),
  SMTP_PORT: z.coerce.number().optional().describe("SMTP server port"),
  SMTP_USER: z.string().optional().describe("SMTP authentication username"),
  SMTP_PASSWORD: z.string().optional().describe("SMTP authentication password"),

  // Redis (Rate Limiting - optional in development)
  UPSTASH_REDIS_REST_URL: z.string().url().optional().or(z.literal("http://localhost:6379")).describe("Upstash Redis REST URL"),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional().or(z.literal("dev-token")).describe("Upstash Redis REST token"),

  // Contentful CMS (optional)
  CONTENTFUL_SPACE_ID: z.string().optional().describe("Contentful space ID"),
  CONTENTFUL_ACCESS_TOKEN: z.string().optional().describe("Contentful delivery API token"),
  CONTENTFUL_PREVIEW_ACCESS_TOKEN: z
    .string()
    .optional()
    .describe("Contentful preview API token"),

  // Stripe (optional, for payments)
  STRIPE_SECRET_KEY: z.string().optional().describe("Stripe secret key"),
  STRIPE_WEBHOOK_SECRET: z.string().optional().describe("Stripe webhook signing secret"),

  // Node environment
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

/**
 * Client-side environment variables schema
 * These are exposed to the browser (NEXT_PUBLIC_ prefix required)
 */
const clientEnvSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url().describe("Public app URL"),
  NEXT_PUBLIC_BASE_URL: z.string().url().describe("Base URL for SEO/metadata"),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z
    .string()
    .optional()
    .or(z.literal(""))
    .describe("Stripe publishable key"),
  NEXT_PUBLIC_SENTRY_DSN: z.string().optional().transform(val => val === "" ? undefined : val).pipe(z.string().url().optional()).describe("Sentry DSN (client-side)"),
  NEXT_PUBLIC_GA_MEASUREMENT_ID: z
    .string()
    .optional()
    .or(z.literal(""))
    .describe("Google Analytics measurement ID"),
});

/**
 * Combined schema for all environment variables
 */
const envSchema = serverEnvSchema.merge(clientEnvSchema);

/**
 * Type-safe environment variables
 * Use this instead of process.env throughout the application
 */
export type Env = z.infer<typeof envSchema>;

/**
 * Parse and validate environment variables
 * Throws detailed error if validation fails
 */
function validateEnv(): Env {
  // In development, use lenient validation
  const isDevelopment = process.env.NODE_ENV === 'development';

  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    console.error("❌ Invalid environment variables:");
    console.error(JSON.stringify(parsed.error.format(), null, 2));

    // In development, continue with warnings instead of throwing
    if (isDevelopment) {
      console.warn('⚠️  Continuing in development mode with partial environment');
      console.warn('⚠️  Some features may not work without proper credentials');
      return process.env as unknown as Env;
    }

    throw new Error(
      "Invalid environment variables. Check the logs above for details."
    );
  }

  return parsed.data;
}

/**
 * Validated environment variables
 * Import this instead of using process.env
 *
 * @example
 * import { env } from '@/lib/env';
 * const dbUrl = env.DATABASE_URL; // Type-safe & validated
 */
export const env = validateEnv();

/**
 * Check if a server-side variable exists
 * Useful for optional feature flags
 */
export function hasServerEnv(key: keyof z.infer<typeof serverEnvSchema>): boolean {
  return !!env[key];
}

/**
 * Check if a client-side variable exists
 * Useful for optional feature flags
 */
export function hasClientEnv(key: keyof z.infer<typeof clientEnvSchema>): boolean {
  return !!env[key];
}
