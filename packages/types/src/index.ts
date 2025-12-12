/**
 * Shared TypeScript types for ODAVL Studio
 * @package @odavl/types
 */

// ============================================================================
// Billing & Subscription Types
// ============================================================================

export type SubscriptionTier = 'free' | 'pro' | 'team' | 'enterprise';

export type UsageType = 
  | 'detector_runs'
  | 'projects'
  | 'team_members'
  | 'api_calls'
  | 'storage_mb';

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

/**
 * Detector names used across ODAVL products
 * Shared type to avoid cross-product imports
 */
export type DetectorName = string;

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
    limit: number;
    total: number;
    totalPages: number;
  };
}
