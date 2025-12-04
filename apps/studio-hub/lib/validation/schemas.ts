import { z } from 'zod';

// User validation schemas
export const userEmailSchema = z.string().email('Invalid email format');

export const userNameSchema = z
  .string()
  .min(2, 'Name must be at least 2 characters')
  .max(50, 'Name must be less than 50 characters');

// Organization validation schemas
export const orgNameSchema = z
  .string()
  .min(3, 'Organization name must be at least 3 characters')
  .max(100, 'Organization name must be less than 100 characters');

export const orgSlugSchema = z
  .string()
  .min(3, 'Slug must be at least 3 characters')
  .max(50, 'Slug must be less than 50 characters')
  .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens');

// Project validation schemas
export const projectNameSchema = z
  .string()
  .min(3, 'Project name must be at least 3 characters')
  .max(100, 'Project name must be less than 100 characters');

export const projectSlugSchema = z
  .string()
  .min(3, 'Slug must be at least 3 characters')
  .max(50, 'Slug must be less than 50 characters')
  .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens');

// Insight validation schemas
export const insightRunSchema = z.object({
  projectId: z.string().cuid('Invalid project ID'),
  detectors: z.array(z.string()).min(1, 'At least one detector required'),
  config: z.record(z.any()).optional(),
});

export const insightIssueSchema = z.object({
  runId: z.string().cuid('Invalid run ID'),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  message: z.string().min(1, 'Message is required'),
  file: z.string().min(1, 'File path is required'),
  line: z.number().int().positive('Line number must be positive'),
  detector: z.string().min(1, 'Detector name is required'),
});

// Autopilot validation schemas
export const autopilotRunSchema = z.object({
  projectId: z.string().cuid('Invalid project ID'),
  maxFiles: z.number().int().min(1).max(100).default(10),
  maxLoc: z.number().int().min(1).max(1000).default(40),
  dryRun: z.boolean().default(false),
});

// Guardian validation schemas
export const guardianTestSchema = z.object({
  projectId: z.string().cuid('Invalid project ID'),
  url: z.string().url('Invalid URL'),
  testTypes: z.array(z.enum(['accessibility', 'performance', 'security', 'quality'])),
  threshold: z.number().min(0).max(100).default(80),
});

// API Key validation schemas
export const apiKeyCreateSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  scopes: z.array(z.string()).min(1, 'At least one scope required'),
  expiresAt: z.string().datetime().optional(),
});

// Billing validation schemas
export const subscriptionSchema = z.object({
  plan: z.enum(['FREE', 'PRO', 'ENTERPRISE']),
  billingInterval: z.enum(['monthly', 'yearly']).optional(),
});

// Webhook validation schemas
export const webhookSchema = z.object({
  url: z.string().url('Invalid webhook URL'),
  events: z.array(z.string()).min(1, 'At least one event required'),
  secret: z.string().min(16, 'Secret must be at least 16 characters'),
});

// Input sanitization helpers
export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .substring(0, 1000); // Limit length
}

export function sanitizeHtml(html: string): string {
  // Basic HTML sanitization - in production use DOMPurify or similar
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+="[^"]*"/gi, '')
    .replace(/on\w+='[^']*'/gi, '');
}

// Validate and sanitize function
export function validateAndSanitize<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: string } {
  try {
    const validated = schema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0];
      return {
        success: false,
        error: firstError?.message || 'Validation failed',
      };
    }
    return { success: false, error: 'Unknown validation error' };
  }
}
