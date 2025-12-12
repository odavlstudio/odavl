/**
 * Shared TypeScript Types for ODAVL Products
 * Migrated from @odavl/types
 */

// ============================================================================
// Guardian Types (Phase 3A)
// ============================================================================

export * from './types/guardian.js';

// ============================================================================
// Billing & Subscription Types
// ============================================================================

export type SubscriptionTier = 'free' | 'pro' | 'team' | 'enterprise';

export type UsageType = 
  | 'detector_runs'
  | 'projects'
  | 'team_members'
  | 'api_calls'
  | 'storage_mb'
  | 'analysis'
  | 'project_create'
  | 'storage_write'
  | 'ml_prediction'
  | 'auto_fix';

export interface ProductTier {
  id: SubscriptionTier;
  name: string;
  price: number;
  interval: 'month' | 'year';
  limits: {
    projects: number;
    detectorRuns: number;
    teamMembers: number;
    apiCalls: number;
    storageMB: number;
  };
  features: string[];
  popular?: boolean;
  description?: string;
}

export const PRODUCT_TIERS: Record<SubscriptionTier, ProductTier> = {
  free: {
    id: 'free',
    name: 'Free',
    price: 0,
    interval: 'month',
    limits: {
      projects: 3,
      detectorRuns: 100,
      teamMembers: 1,
      apiCalls: 1000,
      storageMB: 100,
    },
    features: [
      '3 projects',
      '100 detector runs/month',
      '1 team member',
      '1,000 API calls/month',
      '100 MB storage',
      'Community support',
    ],
    description: 'Perfect for individual developers',
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    price: 29,
    interval: 'month',
    limits: {
      projects: 20,
      detectorRuns: 1000,
      teamMembers: 5,
      apiCalls: 10000,
      storageMB: 1000,
    },
    features: [
      '20 projects',
      '1,000 detector runs/month',
      '5 team members',
      '10,000 API calls/month',
      '1 GB storage',
      'Priority support',
      'Advanced analytics',
    ],
    popular: true,
    description: 'For professional developers',
  },
  team: {
    id: 'team',
    name: 'Team',
    price: 99,
    interval: 'month',
    limits: {
      projects: 100,
      detectorRuns: 5000,
      teamMembers: 20,
      apiCalls: 50000,
      storageMB: 5000,
    },
    features: [
      '100 projects',
      '5,000 detector runs/month',
      '20 team members',
      '50,000 API calls/month',
      '5 GB storage',
      'Priority support',
      'Advanced analytics',
      'Custom integrations',
      'SSO',
    ],
    description: 'For growing teams',
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    price: 499,
    interval: 'month',
    limits: {
      projects: -1, // Unlimited
      detectorRuns: -1,
      teamMembers: -1,
      apiCalls: -1,
      storageMB: -1,
    },
    features: [
      'Unlimited projects',
      'Unlimited detector runs',
      'Unlimited team members',
      'Unlimited API calls',
      'Unlimited storage',
      '24/7 dedicated support',
      'Advanced analytics',
      'Custom integrations',
      'SSO',
      'SLA',
      'On-premise deployment',
    ],
    description: 'For large organizations',
  },
};

// ============================================================================
// User & Auth Types
// ============================================================================

export type UserRole = 'user' | 'admin' | 'owner';

export interface User {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
  subscriptionTier: SubscriptionTier;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// Project Types
// ============================================================================

export interface Project {
  id: string;
  name: string;
  description: string | null;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// Analysis Types
// ============================================================================

export type Severity = 'critical' | 'high' | 'medium' | 'low';

export interface Issue {
  id: string;
  type: string;
  message: string;
  severity: Severity;
  file: string;
  line: number;
  column: number;
  code?: string;
  fix?: string;
}

export interface Analysis {
  id: string;
  projectId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  issues: Issue[];
  startedAt: Date;
  completedAt: Date | null;
}

// ============================================================================
// Metrics Types
// ============================================================================

export interface Metrics {
  phase: string;
  duration: number;
  status: 'ok' | 'fail';
  eslintWarnings: number;
  typeErrors: number;
}

export interface CodeMetrics {
  linesOfCode: number;
  complexity: number;
  coverage: number;
  issues: number;
  quality: number;
}

// ============================================================================
// API Types
// ============================================================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

// ============================================================================
// Multi-Tenant Types
// ============================================================================

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  organizationId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  ownerId: string;
  subscriptionTier: SubscriptionTier;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// Error Types
// ============================================================================

export class ODAVLError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = 'ODAVLError';
  }
}

export type ErrorSeverity = 'fatal' | 'error' | 'warning' | 'info';

// Re-export analysis types
export * from './types/analysis.js';

// Re-export pattern memory types
export * from './types/pattern-memory.js';
