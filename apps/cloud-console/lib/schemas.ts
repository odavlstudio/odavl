/**
 * ODAVL Cloud Console - API Request/Response Schemas
 * Batch 2: Core Cloud API Infrastructure
 * 
 * Zod schemas for validation
 */

import { z } from 'zod';

// ============================================================================
// Common Schemas
// ============================================================================

export const ErrorResponseSchema = z.object({
  error: z.string(),
  message: z.string(),
  requestId: z.string().optional(),
  details: z.record(z.unknown()).optional(),
});

export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;

// ============================================================================
// /api/analyze Schemas (Insight Integration)
// ============================================================================

export const AnalyzeRequestSchema = z.object({
  workspace: z.string().min(1, 'Workspace path required'),
  detectors: z.array(z.string()).optional().default([
    'typescript',
    'eslint',
    'security',
    'performance',
    'complexity',
  ]),
  language: z.enum(['typescript', 'javascript', 'python', 'java', 'go', 'rust']).optional().default('typescript'),
  includePatterns: z.array(z.string()).optional(),
  excludePatterns: z.array(z.string()).optional(),
});

export type AnalyzeRequest = z.infer<typeof AnalyzeRequestSchema>;

export const DetectedIssueSchema = z.object({
  id: z.string(),
  severity: z.enum(['critical', 'high', 'medium', 'low', 'info']),
  detector: z.string(),
  message: z.string(),
  file: z.string(),
  line: z.number().int().positive(),
  column: z.number().int().positive().optional(),
  code: z.string().optional(),
  suggestion: z.string().optional(),
  documentation: z.string().url().optional(),
});

export type DetectedIssue = z.infer<typeof DetectedIssueSchema>;

export const AnalyzeResponseSchema = z.object({
  requestId: z.string(),
  workspace: z.string(),
  status: z.enum(['success', 'partial', 'failed']),
  timestamp: z.string().datetime(),
  summary: z.object({
    totalIssues: z.number().int().nonnegative(),
    critical: z.number().int().nonnegative(),
    high: z.number().int().nonnegative(),
    medium: z.number().int().nonnegative(),
    low: z.number().int().nonnegative(),
    info: z.number().int().nonnegative(),
  }),
  issues: z.array(DetectedIssueSchema),
  detectors: z.record(z.object({
    status: z.enum(['success', 'failed', 'skipped']),
    duration: z.number().nonnegative(),
    issuesFound: z.number().int().nonnegative(),
    error: z.string().optional(),
  })),
  metadata: z.object({
    filesAnalyzed: z.number().int().nonnegative(),
    linesAnalyzed: z.number().int().nonnegative(),
    duration: z.number().nonnegative(),
  }),
});

export type AnalyzeResponse = z.infer<typeof AnalyzeResponseSchema>;

// ============================================================================
// /api/fix Schemas (Autopilot Integration)
// ============================================================================

export const FixRequestSchema = z.object({
  workspace: z.string().min(1, 'Workspace path required'),
  issueIds: z.array(z.string()).min(1, 'At least one issue ID required').optional(),
  maxFiles: z.number().int().positive().max(10).optional().default(5),
  maxLoc: z.number().int().positive().max(100).optional().default(40),
  dryRun: z.boolean().optional().default(false),
  recipes: z.array(z.string()).optional(),
});

export type FixRequest = z.infer<typeof FixRequestSchema>;

export const FixResultSchema = z.object({
  issueId: z.string(),
  status: z.enum(['fixed', 'partial', 'failed', 'skipped']),
  file: z.string(),
  changes: z.object({
    linesAdded: z.number().int().nonnegative(),
    linesRemoved: z.number().int().nonnegative(),
    linesModified: z.number().int().nonnegative(),
  }),
  recipe: z.string(),
  message: z.string(),
  error: z.string().optional(),
});

export type FixResult = z.infer<typeof FixResultSchema>;

export const FixResponseSchema = z.object({
  requestId: z.string(),
  workspace: z.string(),
  status: z.enum(['success', 'partial', 'failed']),
  timestamp: z.string().datetime(),
  summary: z.object({
    totalIssues: z.number().int().nonnegative(),
    fixed: z.number().int().nonnegative(),
    partial: z.number().int().nonnegative(),
    failed: z.number().int().nonnegative(),
    skipped: z.number().int().nonnegative(),
  }),
  results: z.array(FixResultSchema),
  undoSnapshot: z.string().optional(), // Path to .odavl/undo/<timestamp>.json
  attestation: z.string().optional(), // SHA-256 hash for verification
  metadata: z.object({
    filesModified: z.number().int().nonnegative(),
    duration: z.number().nonnegative(),
    riskScore: z.number().nonnegative().max(100),
  }),
});

export type FixResponse = z.infer<typeof FixResponseSchema>;

// ============================================================================
// /api/audit Schemas (Guardian Integration)
// ============================================================================

export const AuditRequestSchema = z.object({
  url: z.string().url('Valid URL required'),
  suites: z.array(z.enum(['accessibility', 'performance', 'security', 'seo', 'best-practices'])).optional().default([
    'accessibility',
    'performance',
    'security',
  ]),
  environment: z.enum(['staging', 'production', 'development']).optional().default('production'),
  device: z.enum(['desktop', 'mobile', 'tablet']).optional().default('desktop'),
  includeScreenshot: z.boolean().optional().default(false),
});

export type AuditRequest = z.infer<typeof AuditRequestSchema>;

export const AuditIssueSchema = z.object({
  id: z.string(),
  severity: z.enum(['critical', 'high', 'medium', 'low', 'info']),
  suite: z.string(),
  message: z.string(),
  element: z.string().optional(),
  recommendation: z.string(),
  documentation: z.string().url().optional(),
});

export type AuditIssue = z.infer<typeof AuditIssueSchema>;

export const AuditResponseSchema = z.object({
  requestId: z.string(),
  url: z.string().url(),
  status: z.enum(['success', 'partial', 'failed']),
  timestamp: z.string().datetime(),
  summary: z.object({
    totalIssues: z.number().int().nonnegative(),
    critical: z.number().int().nonnegative(),
    high: z.number().int().nonnegative(),
    medium: z.number().int().nonnegative(),
    low: z.number().int().nonnegative(),
    info: z.number().int().nonnegative(),
  }),
  scores: z.record(z.number().nonnegative().max(100)), // Per-suite scores (0-100)
  issues: z.array(AuditIssueSchema),
  lighthouse: z.object({
    performance: z.number().nonnegative().max(100),
    accessibility: z.number().nonnegative().max(100),
    bestPractices: z.number().nonnegative().max(100),
    seo: z.number().nonnegative().max(100),
  }).optional(),
  screenshot: z.string().optional(), // Base64 image data
  metadata: z.object({
    duration: z.number().nonnegative(),
    device: z.string(),
    environment: z.string(),
  }),
});

export type AuditResponse = z.infer<typeof AuditResponseSchema>;

// ============================================================================
// Usage Tracking (for future billing integration)
// ============================================================================

export const UsageEventSchema = z.object({
  userId: z.string(),
  organizationId: z.string().optional(),
  endpoint: z.string(),
  timestamp: z.string().datetime(),
  duration: z.number().nonnegative(),
  resourcesUsed: z.object({
    filesAnalyzed: z.number().int().nonnegative().optional(),
    linesAnalyzed: z.number().int().nonnegative().optional(),
    filesModified: z.number().int().nonnegative().optional(),
    testsRun: z.number().int().nonnegative().optional(),
  }),
});

export type UsageEvent = z.infer<typeof UsageEventSchema>;
