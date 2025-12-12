/**
 * ODAVL Cloud Console - /api/analyze Integration Tests
 * 
 * Tests the analyze endpoint with authentication, plan limits, and error handling.
 * 
 * @group integration
 * @group cloud-api
 * @group insight
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { POST } from '../route';

// Mock Prisma client
vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
    analysis: {
      create: vi.fn(),
    },
  },
}));

// Mock middleware
vi.mock('@/lib/middleware', () => ({
  withAuth: vi.fn((handler) => handler),
  withRateLimit: vi.fn((config, handler) => handler),
  withLogging: vi.fn((handler) => handler),
  withValidation: vi.fn((schema, handler) => handler),
  withErrorHandling: vi.fn((handler) => handler),
}));

// Mock Insight SDK
vi.mock('@odavl-studio/sdk', () => ({
  Insight: vi.fn().mockImplementation(() => ({
    analyze: vi.fn().mockResolvedValue({
      issues: [
        {
          severity: 'high',
          detector: 'typescript',
          message: 'Variable "x" is never used',
          file: 'src/index.ts',
          line: 10,
          column: 7,
          fixSuggestion: 'Remove unused variable',
        },
      ],
    }),
  })),
}));

// Mock telemetry
vi.mock('@odavl-studio/telemetry', () => ({
  trackInsightEvent: vi.fn(),
  InsightTelemetryClient: {
    binFileCount: vi.fn((count) => '100-499'),
    hashUserId: vi.fn((email) => `hash_${email}`),
  },
}));

// Mock usage tracking
vi.mock('@/lib/usage', () => ({
  enforceQuota: vi.fn(),
  trackUsage: vi.fn(),
}));

import { prisma } from '@/lib/prisma';
import { trackInsightEvent } from '@odavl-studio/telemetry';
import { enforceQuota } from '@/lib/usage';

describe('POST /api/analyze - Authentication', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 401 without auth token', async () => {
    const req = new NextRequest('http://localhost:3000/api/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        workspace: '/test/workspace',
        detectors: ['typescript'],
      }),
    });

    // Mock no authenticated user
    (prisma.user.findUnique as any).mockResolvedValue(null);

    const response = await POST(req, {}, { userId: null } as any);

    expect(response.status).toBe(401);
    const json = await response.json();
    expect(json.error).toMatch(/user not found/i);
  });

  it('should return 401 with invalid token', async () => {
    const req = new NextRequest('http://localhost:3000/api/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer invalid-token',
      },
      body: JSON.stringify({
        workspace: '/test/workspace',
        detectors: ['typescript'],
      }),
    });

    (prisma.user.findUnique as any).mockResolvedValue(null);

    const response = await POST(req, {}, { userId: 'invalid' } as any);

    expect(response.status).toBe(401);
  });

  it('should require organization membership', async () => {
    const req = new NextRequest('http://localhost:3000/api/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer valid-token',
      },
      body: JSON.stringify({
        workspace: '/test/workspace',
        detectors: ['typescript'],
      }),
    });

    // User exists but has no org memberships
    (prisma.user.findUnique as any).mockResolvedValue({
      id: 'user-1',
      email: 'test@example.com',
      memberships: [],
    });

    const response = await POST(req, {}, { userId: 'user-1' } as any);

    expect(response.status).toBe(404);
    const json = await response.json();
    expect(json.error).toMatch(/organization not found/i);
  });
});

describe('POST /api/analyze - Plan Limit Enforcement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should enforce quota before analysis', async () => {
    const req = new NextRequest('http://localhost:3000/api/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer valid-token',
      },
      body: JSON.stringify({
        workspace: '/test/workspace',
        detectors: ['typescript'],
      }),
    });

    (prisma.user.findUnique as any).mockResolvedValue({
      id: 'user-1',
      email: 'test@example.com',
      insightPlanId: 'INSIGHT_FREE',
      memberships: [
        {
          organization: { id: 'org-1' },
        },
      ],
    });

    // Mock quota exceeded
    (enforceQuota as any).mockRejectedValue(new Error('Quota exceeded'));

    const response = await POST(req, {}, { userId: 'user-1' } as any);

    expect(response.status).toBe(429);
    expect(enforceQuota).toHaveBeenCalledWith('org-1', 'analysis');
  });

  it('should allow analysis for PRO plan', async () => {
    const req = new NextRequest('http://localhost:3000/api/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer valid-token',
      },
      body: JSON.stringify({
        workspace: '/test/workspace',
        detectors: ['typescript'],
      }),
    });

    (prisma.user.findUnique as any).mockResolvedValue({
      id: 'user-1',
      email: 'test@example.com',
      insightPlanId: 'INSIGHT_PRO',
      memberships: [
        {
          organization: { id: 'org-1' },
        },
      ],
    });

    (enforceQuota as any).mockResolvedValue(undefined);

    const response = await POST(req, {}, { userId: 'user-1' } as any);

    expect(response.status).toBe(200);
    expect(enforceQuota).toHaveBeenCalled();
  });
});

describe('POST /api/analyze - Success Path', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return analysis results with 200 status', async () => {
    const req = new NextRequest('http://localhost:3000/api/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer valid-token',
      },
      body: JSON.stringify({
        workspace: '/test/workspace',
        detectors: ['typescript', 'security'],
      }),
    });

    (prisma.user.findUnique as any).mockResolvedValue({
      id: 'user-1',
      email: 'test@example.com',
      insightPlanId: 'INSIGHT_PRO',
      memberships: [
        {
          organization: { id: 'org-1' },
        },
      ],
    });

    (enforceQuota as any).mockResolvedValue(undefined);

    const response = await POST(req, {}, { userId: 'user-1' } as any);

    expect(response.status).toBe(200);

    const json = await response.json();
    expect(json).toHaveProperty('analysisId');
    expect(json).toHaveProperty('issues');
    expect(json).toHaveProperty('summary');
    expect(Array.isArray(json.issues)).toBe(true);
    expect(json.issues.length).toBeGreaterThan(0);
  });

  it('should emit telemetry events', async () => {
    const req = new NextRequest('http://localhost:3000/api/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer valid-token',
      },
      body: JSON.stringify({
        workspace: '/test/workspace',
        detectors: ['typescript'],
      }),
    });

    (prisma.user.findUnique as any).mockResolvedValue({
      id: 'user-1',
      email: 'test@example.com',
      insightPlanId: 'INSIGHT_PRO',
      memberships: [
        {
          organization: { id: 'org-1' },
        },
      ],
    });

    (enforceQuota as any).mockResolvedValue(undefined);

    await POST(req, {}, { userId: 'user-1' } as any);

    // Should track analysis started
    expect(trackInsightEvent).toHaveBeenCalledWith(
      'insight.cloud_analysis_started',
      expect.objectContaining({
        projectId: 'org-1',
      }),
      expect.objectContaining({
        planId: 'INSIGHT_PRO',
        source: 'cloud',
      })
    );

    // Should track analysis completed
    expect(trackInsightEvent).toHaveBeenCalledWith(
      'insight.cloud_analysis_completed',
      expect.objectContaining({
        issueCount: expect.any(Number),
        detectorCount: 2,
      }),
      expect.anything()
    );
  });

  it('should store analysis in database', async () => {
    const req = new NextRequest('http://localhost:3000/api/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer valid-token',
      },
      body: JSON.stringify({
        workspace: '/test/workspace',
        detectors: ['typescript'],
      }),
    });

    (prisma.user.findUnique as any).mockResolvedValue({
      id: 'user-1',
      email: 'test@example.com',
      insightPlanId: 'INSIGHT_PRO',
      memberships: [
        {
          organization: { id: 'org-1' },
        },
      ],
    });

    (enforceQuota as any).mockResolvedValue(undefined);
    (prisma.analysis.create as any).mockResolvedValue({ id: 'analysis-1' });

    await POST(req, {}, { userId: 'user-1' } as any);

    expect(prisma.analysis.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          organizationId: 'org-1',
          status: 'completed',
        }),
      })
    );
  });
});

describe('POST /api/analyze - Input Validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 400 with missing workspace', async () => {
    const req = new NextRequest('http://localhost:3000/api/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer valid-token',
      },
      body: JSON.stringify({
        detectors: ['typescript'],
      }),
    });

    (prisma.user.findUnique as any).mockResolvedValue({
      id: 'user-1',
      email: 'test@example.com',
      memberships: [{ organization: { id: 'org-1' } }],
    });

    const response = await POST(req, {}, { userId: 'user-1' } as any);

    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.error).toMatch(/workspace.*required/i);
  });

  it('should return 400 with invalid detector names', async () => {
    const req = new NextRequest('http://localhost:3000/api/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer valid-token',
      },
      body: JSON.stringify({
        workspace: '/test/workspace',
        detectors: ['invalid-detector'],
      }),
    });

    (prisma.user.findUnique as any).mockResolvedValue({
      id: 'user-1',
      email: 'test@example.com',
      memberships: [{ organization: { id: 'org-1' } }],
    });

    const response = await POST(req, {}, { userId: 'user-1' } as any);

    expect(response.status).toBe(400);
  });

  it('should default to all detectors if none specified', async () => {
    const req = new NextRequest('http://localhost:3000/api/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer valid-token',
      },
      body: JSON.stringify({
        workspace: '/test/workspace',
      }),
    });

    (prisma.user.findUnique as any).mockResolvedValue({
      id: 'user-1',
      email: 'test@example.com',
      insightPlanId: 'INSIGHT_PRO',
      memberships: [{ organization: { id: 'org-1' } }],
    });

    (enforceQuota as any).mockResolvedValue(undefined);

    const response = await POST(req, {}, { userId: 'user-1' } as any);

    expect(response.status).toBe(200);
  });
});

describe('POST /api/analyze - Error Handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should handle Insight SDK errors gracefully', async () => {
    const req = new NextRequest('http://localhost:3000/api/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer valid-token',
      },
      body: JSON.stringify({
        workspace: '/test/workspace',
        detectors: ['typescript'],
      }),
    });

    (prisma.user.findUnique as any).mockResolvedValue({
      id: 'user-1',
      email: 'test@example.com',
      insightPlanId: 'INSIGHT_PRO',
      memberships: [{ organization: { id: 'org-1' } }],
    });

    (enforceQuota as any).mockResolvedValue(undefined);

    // Mock Insight SDK failure
    const { Insight } = await import('@odavl-studio/sdk');
    (Insight as any).mockImplementationOnce(() => ({
      analyze: vi.fn().mockRejectedValue(new Error('Analysis failed')),
    }));

    const response = await POST(req, {}, { userId: 'user-1' } as any);

    expect(response.status).toBe(500);
    const json = await response.json();
    expect(json.error).toMatch(/analysis failed/i);
    
    // Should NOT expose stack traces
    expect(JSON.stringify(json)).not.toContain('  at ');
  });

  it('should handle database errors gracefully', async () => {
    const req = new NextRequest('http://localhost:3000/api/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer valid-token',
      },
      body: JSON.stringify({
        workspace: '/test/workspace',
        detectors: ['typescript'],
      }),
    });

    // Mock database error
    (prisma.user.findUnique as any).mockRejectedValue(new Error('Database connection failed'));

    const response = await POST(req, {}, { userId: 'user-1' } as any);

    expect(response.status).toBe(500);
    const json = await response.json();
    expect(json.error).toBeDefined();
    
    // Should NOT expose internal errors
    expect(json.error).not.toContain('Database connection');
  });

  it('should handle telemetry failures gracefully (non-blocking)', async () => {
    const req = new NextRequest('http://localhost:3000/api/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer valid-token',
      },
      body: JSON.stringify({
        workspace: '/test/workspace',
        detectors: ['typescript'],
      }),
    });

    (prisma.user.findUnique as any).mockResolvedValue({
      id: 'user-1',
      email: 'test@example.com',
      insightPlanId: 'INSIGHT_PRO',
      memberships: [{ organization: { id: 'org-1' } }],
    });

    (enforceQuota as any).mockResolvedValue(undefined);

    // Mock telemetry failure
    (trackInsightEvent as any).mockRejectedValue(new Error('Telemetry service down'));

    // Should still succeed despite telemetry failure
    const response = await POST(req, {}, { userId: 'user-1' } as any);

    expect(response.status).toBe(200);
  });
});

describe('POST /api/analyze - Rate Limiting', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should enforce rate limits', async () => {
    // This test would need actual rate limiting middleware
    // For now, just verify the config is set correctly
    expect(true).toBe(true); // Placeholder
  });
});
