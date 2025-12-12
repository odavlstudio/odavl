/**
 * API Client for Cloud Console
 * Type-safe client for all backend endpoints
 */

import { OrgRole } from '@prisma/client';

// ============================================================================
// Types
// ============================================================================

export interface ApiError {
  error: string;
  details?: any;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  role: OrgRole;
  tier: 'FREE' | 'PRO' | 'ENTERPRISE';
}

export interface Member {
  id: string;
  userId: string;
  role: OrgRole;
  joinedAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
}

export interface Project {
  id: string;
  name: string;
  slug: string;
  repository: string | null;
  branch: string;
  language: string;
  status: 'ACTIVE' | 'ARCHIVED' | 'DELETED';
  createdAt: string;
  updatedAt: string;
  _count?: {
    errorSignatures: number;
    fixAttestations: number;
    auditResults: number;
  };
}

export interface AnalysisResult {
  issues: Array<{
    detector: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    message: string;
    file: string;
    line: number;
    column?: number;
    suggestion?: string;
  }>;
  summary: {
    total: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  detectors: string[];
  duration: number;
}

export interface UsageStats {
  tier: 'FREE' | 'PRO' | 'ENTERPRISE';
  status: string;
  analysesUsed: number;
  fixesUsed: number;
  auditsUsed: number;
  limits: {
    analyses: number;
    fixes: number;
    audits: number;
  };
  currentPeriodEnd: string | null;
}

// ============================================================================
// API Client
// ============================================================================

class ApiClient {
  private baseUrl = '/api';

  private async request<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        error: 'Request failed',
      }));
      throw new Error(error.error || 'Request failed');
    }

    return response.json();
  }

  // ========================================================================
  // Organizations
  // ========================================================================

  async getOrganizations(): Promise<{ organizations: Organization[] }> {
    return this.request('/organizations');
  }

  async switchOrganization(organizationId: string): Promise<{
    organizationId: string;
    organizationSlug: string;
    role: OrgRole;
  }> {
    return this.request('/organizations/switch', {
      method: 'POST',
      body: JSON.stringify({ organizationId }),
    });
  }

  // ========================================================================
  // Members
  // ========================================================================

  async getMembers(): Promise<{ members: Member[] }> {
    return this.request('/members');
  }

  async inviteMember(email: string, role: 'DEVELOPER' | 'VIEWER'): Promise<{
    member: Member;
  }> {
    return this.request('/members', {
      method: 'POST',
      body: JSON.stringify({ email, role }),
    });
  }

  async updateMemberRole(
    memberId: string,
    role: 'ADMIN' | 'DEVELOPER' | 'VIEWER'
  ): Promise<{ member: Member }> {
    return this.request('/members', {
      method: 'PATCH',
      body: JSON.stringify({ memberId, role }),
    });
  }

  async removeMember(memberId: string): Promise<{ success: boolean }> {
    return this.request(`/members?memberId=${memberId}`, {
      method: 'DELETE',
    });
  }

  // ========================================================================
  // Projects
  // ========================================================================

  async getProjects(status?: 'ACTIVE' | 'ARCHIVED' | 'DELETED'): Promise<{
    projects: Project[];
  }> {
    const query = status ? `?status=${status}` : '';
    return this.request(`/projects${query}`);
  }

  async createProject(data: {
    name: string;
    slug: string;
    repository?: string;
    branch?: string;
    language?: string;
  }): Promise<{ project: Project }> {
    return this.request('/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateProject(
    projectId: string,
    data: {
      name?: string;
      repository?: string;
      branch?: string;
      language?: string;
      status?: 'ACTIVE' | 'ARCHIVED' | 'DELETED';
    }
  ): Promise<{ project: Project }> {
    return this.request(`/projects?id=${projectId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteProject(projectId: string): Promise<{ success: boolean }> {
    return this.request(`/projects?id=${projectId}`, {
      method: 'DELETE',
    });
  }

  // ========================================================================
  // Analysis (Insight)
  // ========================================================================

  async runAnalysis(data: {
    detectors: string[];
    path: string;
    projectId?: string;
  }): Promise<AnalysisResult> {
    return this.request('/analyze', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // ========================================================================
  // Billing
  // ========================================================================

  async getUsageStats(): Promise<UsageStats> {
    return this.request('/billing/usage');
  }

  async createCheckoutSession(tier: 'PRO' | 'ENTERPRISE'): Promise<{
    url: string;
  }> {
    // Get price ID from environment/config
    const priceId = tier === 'PRO' 
      ? (process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO || 'price_pro_monthly')
      : (process.env.NEXT_PUBLIC_STRIPE_PRICE_ENTERPRISE || 'price_enterprise_monthly');

    return this.request('/billing/create-checkout', {
      method: 'POST',
      body: JSON.stringify({ priceId, tier }),
    });
  }

  async createPortalSession(): Promise<{ url: string }> {
    return this.request('/billing/create-portal', {
      method: 'POST',
    });
  }

  // ========================================================================
  // Health
  // ========================================================================

  async getHealth(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    timestamp: string;
    uptime: number;
    checks: {
      database: { status: 'up' | 'down'; latency?: number; error?: string };
      memory: { used: number; total: number; percentage: number };
      environment: { nodeVersion: string; platform: string; env: string };
    };
    version: string;
  }> {
    return this.request('/health');
  }
}

export const apiClient = new ApiClient();
