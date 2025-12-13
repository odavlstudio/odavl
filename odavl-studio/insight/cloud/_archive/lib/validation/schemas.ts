/**
 * Input Validation Schemas
 * Zod schemas for all API endpoints
 */

import { z } from 'zod';

// ============================================
// Authentication Schemas
// ============================================

export const registerSchema = z.object({
  email: z
    .string()
    .email('Invalid email format')
    .toLowerCase()
    .trim(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name is too long')
    .regex(/^[a-zA-Z\s'-]+$/, 'Name must contain only letters, spaces, hyphens, and apostrophes')
    .trim(),
});

export const loginSchema = z.object({
  email: z
    .string()
    .email('Invalid email format')
    .toLowerCase()
    .trim(),
  password: z
    .string()
    .min(1, 'Password is required'),
});

export const emailSchema = z.object({
  email: z
    .string()
    .email('Invalid email format')
    .toLowerCase()
    .trim(),
});

export const resetPasswordSchema = z.object({
  token: z
    .string()
    .min(32, 'Invalid reset token')
    .regex(/^[a-f0-9]+$/, 'Invalid token format'),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
});

export const verifyEmailSchema = z.object({
  token: z
    .string()
    .min(32, 'Invalid verification token')
    .regex(/^[a-f0-9]+$/, 'Invalid token format'),
});

// ============================================
// Project Schemas
// ============================================

export const createProjectSchema = z.object({
  name: z
    .string()
    .min(3, 'Project name must be at least 3 characters')
    .max(50, 'Project name is too long')
    .regex(/^[a-zA-Z0-9-_]+$/, 'Project name can only contain letters, numbers, hyphens, and underscores')
    .trim(),
  description: z
    .string()
    .max(500, 'Description is too long')
    .trim()
    .optional(),
  language: z.enum(['typescript', 'python', 'java'], {
    errorMap: () => ({ message: 'Language must be typescript, python, or java' }),
  }),
  repository: z
    .string()
    .url('Invalid repository URL')
    .optional(),
});

export const updateProjectSchema = z.object({
  name: z
    .string()
    .min(3, 'Project name must be at least 3 characters')
    .max(50, 'Project name is too long')
    .regex(/^[a-zA-Z0-9-_]+$/, 'Project name can only contain letters, numbers, hyphens, and underscores')
    .trim()
    .optional(),
  description: z
    .string()
    .max(500, 'Description is too long')
    .trim()
    .optional(),
  repository: z
    .string()
    .url('Invalid repository URL')
    .optional(),
});

// ============================================
// Analysis Schemas
// ============================================

export const analyzeSchema = z.object({
  projectId: z
    .string()
    .uuid('Invalid project ID'),
  detectors: z
    .array(z.string())
    .optional(),
  files: z
    .array(z.string())
    .optional(),
  language: z
    .enum(['typescript', 'python', 'java'])
    .optional(),
});

export const detectorConfigSchema = z.object({
  enabled: z.boolean().optional(),
  severity: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  autoFix: z.boolean().optional(),
});

// ============================================
// Team Schemas
// ============================================

export const createTeamSchema = z.object({
  name: z
    .string()
    .min(3, 'Team name must be at least 3 characters')
    .max(50, 'Team name is too long')
    .trim(),
  description: z
    .string()
    .max(500, 'Description is too long')
    .trim()
    .optional(),
});

export const inviteTeamMemberSchema = z.object({
  email: z
    .string()
    .email('Invalid email format')
    .toLowerCase()
    .trim(),
  role: z.enum(['owner', 'admin', 'member', 'viewer'], {
    errorMap: () => ({ message: 'Role must be owner, admin, member, or viewer' }),
  }),
});

// ============================================
// Subscription Schemas
// ============================================

export const updateSubscriptionSchema = z.object({
  tier: z.enum(['FREE', 'PRO', 'TEAM', 'ENTERPRISE'], {
    errorMap: () => ({ message: 'Invalid subscription tier' }),
  }),
});

// ============================================
// Query Parameter Schemas
// ============================================

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const sortSchema = z.object({
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

export const searchSchema = z.object({
  query: z.string().min(1).max(100).trim().optional(),
});

// ============================================
// Type Exports
// ============================================

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type EmailInput = z.infer<typeof emailSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type AnalyzeInput = z.infer<typeof analyzeSchema>;
export type CreateTeamInput = z.infer<typeof createTeamSchema>;
export type InviteTeamMemberInput = z.infer<typeof inviteTeamMemberSchema>;
export type UpdateSubscriptionInput = z.infer<typeof updateSubscriptionSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;
export type SortInput = z.infer<typeof sortSchema>;
export type SearchInput = z.infer<typeof searchSchema>;
