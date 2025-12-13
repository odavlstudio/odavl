/**
 * Authenticated Upload Endpoint Integration Tests
 * Phase 3.0.3: Authentication & Plan Binding
 * 
 * Tests end-to-end upload flow with real JWT authentication
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { POST } from '../../../../app/api/cli/analysis/upload/route';
import { NextRequest } from 'next/server';
import { generateToken } from '../../../../lib/auth/jwt.middleware';
import { prisma } from '../../../../lib/prisma';

// Mock Prisma client
vi.mock('../../../../lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
    insightUsage: {
      upsert: vi.fn(),
      update: vi.fn(),
    },
  },
}));

// Mock environment
const ORIGINAL_ENV = process.env;

describe('Authenticated Upload Endpoint', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...ORIGINAL_ENV, JWT_SECRET: 'test-secret-key-for-jwt-signing' };
  });

  const validPayload = {
    project: {
      name: 'test-project',
      branch: 'main',
      commit: 'abc123',
    },
    analysis: {
      timestamp: new Date().toISOString(),
      issuesCount: 5,
      severityCounts: {
        critical: 1,
        high: 2,
        medium: 1,
        low: 1,
      },
      detectorsRun: ['typescript', 'security'],
    },
    issues: [
      {
        file: 'src/index.ts',
        line: 10,
        column: 5,
        message: 'Unused variable',
        severity: 'medium' as const,
        detector: 'typescript',
        ruleId: 'no-unused-vars',
      },
    ],
    metadata: {
      cliVersion: '2.0.0',
      platform: 'linux',
      nodeVersion: 'v20.0.0',
    },
  };

  describe('Authentication', () => {
    it('should reject upload without Authorization header', async () => {
      const req = new NextRequest('http://localhost:3000/api/cli/analysis/upload', {
        method: 'POST',
        body: JSON.stringify(validPayload),
      });

      const response = await POST(req);

      expect(response.status).toBe(401);

      const body = await response.json();
      expect(body).toMatchObject({
        success: false,
        error: 'UNAUTHORIZED',
      });
    });

    it('should reject upload with invalid JWT token', async () => {
      const req = new NextRequest('http://localhost:3000/api/cli/analysis/upload', {
        method: 'POST',
        headers: {
          authorization: 'Bearer invalid.jwt.token',
        },
        body: JSON.stringify(validPayload),
      });

      const response = await POST(req);

      expect(response.status).toBe(401);
    });

    it('should reject upload with expired JWT token', async () => {
      const expiredToken = generateToken('user-123', 'test@example.com', '-1h');

      const req = new NextRequest('http://localhost:3000/api/cli/analysis/upload', {
        method: 'POST',
        headers: {
          authorization: `Bearer ${expiredToken}`,
        },
        body: JSON.stringify(validPayload),
      });

      const response = await POST(req);

      expect(response.status).toBe(401);
    });

    it('should reject upload for non-existent user', async () => {
      const token = generateToken('user-ghost', 'ghost@example.com');

      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

      const req = new NextRequest('http://localhost:3000/api/cli/analysis/upload', {
        method: 'POST',
        headers: {
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(validPayload),
      });

      const response = await POST(req);

      expect(response.status).toBe(401);
    });
  });

  describe('Plan-Based Quota Enforcement', () => {
    it('should allow FREE user with quota remaining', async () => {
      const token = generateToken('user-free', 'free@example.com');

      const mockUser = {
        id: 'user-free',
        email: 'free@example.com',
        plan: 'FREE' as const,
        name: 'Free User',
      };

      const mockUsage = {
        id: 'usage-1',
        userId: 'user-free',
        period: '2025-12',
        uploadsUsed: 5, // 5/10 used
        lastUploadAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);
      vi.mocked(prisma.insightUsage.upsert).mockResolvedValue(mockUsage);
      vi.mocked(prisma.insightUsage.update).mockResolvedValue({
        ...mockUsage,
        uploadsUsed: 6,
      });

      const req = new NextRequest('http://localhost:3000/api/cli/analysis/upload', {
        method: 'POST',
        headers: {
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(validPayload),
      });

      const response = await POST(req);

      expect(response.status).toBe(201);

      const body = await response.json();
      expect(body).toMatchObject({
        success: true,
        quotaUsed: 6,
        quotaRemaining: 4, // 10 - 6 = 4
      });
    });

    it('should block FREE user at quota limit', async () => {
      const token = generateToken('user-free-limit', 'free-limit@example.com');

      const mockUser = {
        id: 'user-free-limit',
        email: 'free-limit@example.com',
        plan: 'FREE' as const,
        name: 'Free User At Limit',
      };

      const mockUsage = {
        id: 'usage-2',
        userId: 'user-free-limit',
        period: '2025-12',
        uploadsUsed: 10, // 10/10 used (at limit)
        lastUploadAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);
      vi.mocked(prisma.insightUsage.upsert).mockResolvedValue(mockUsage);

      const req = new NextRequest('http://localhost:3000/api/cli/analysis/upload', {
        method: 'POST',
        headers: {
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(validPayload),
      });

      const response = await POST(req);

      expect(response.status).toBe(429); // 429 Too Many Requests

      const body = await response.json();
      expect(body).toMatchObject({
        success: false,
        error: 'QUOTA_EXCEEDED',
        details: {
          currentUsage: 10,
          planLimit: 10,
          currentPlan: 'FREE',
        },
      });

      // Verify usage was NOT incremented
      expect(prisma.insightUsage.update).not.toHaveBeenCalled();
    });

    it('should allow PRO user with higher quota', async () => {
      const token = generateToken('user-pro', 'pro@example.com');

      const mockUser = {
        id: 'user-pro',
        email: 'pro@example.com',
        plan: 'PRO' as const,
        name: 'Pro User',
      };

      const mockUsage = {
        id: 'usage-3',
        userId: 'user-pro',
        period: '2025-12',
        uploadsUsed: 50, // 50/100 used
        lastUploadAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);
      vi.mocked(prisma.insightUsage.upsert).mockResolvedValue(mockUsage);
      vi.mocked(prisma.insightUsage.update).mockResolvedValue({
        ...mockUsage,
        uploadsUsed: 51,
      });

      const req = new NextRequest('http://localhost:3000/api/cli/analysis/upload', {
        method: 'POST',
        headers: {
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(validPayload),
      });

      const response = await POST(req);

      expect(response.status).toBe(201);

      const body = await response.json();
      expect(body).toMatchObject({
        success: true,
        quotaUsed: 51,
        quotaRemaining: 49, // 100 - 51 = 49
      });
    });

    it('should allow ENTERPRISE user with unlimited quota', async () => {
      const token = generateToken('user-enterprise', 'enterprise@example.com');

      const mockUser = {
        id: 'user-enterprise',
        email: 'enterprise@example.com',
        plan: 'ENTERPRISE' as const,
        name: 'Enterprise User',
      };

      const mockUsage = {
        id: 'usage-4',
        userId: 'user-enterprise',
        period: '2025-12',
        uploadsUsed: 500, // No limit for ENTERPRISE
        lastUploadAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);
      vi.mocked(prisma.insightUsage.upsert).mockResolvedValue(mockUsage);
      vi.mocked(prisma.insightUsage.update).mockResolvedValue({
        ...mockUsage,
        uploadsUsed: 501,
      });

      const req = new NextRequest('http://localhost:3000/api/cli/analysis/upload', {
        method: 'POST',
        headers: {
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(validPayload),
      });

      const response = await POST(req);

      expect(response.status).toBe(201);

      const body = await response.json();
      expect(body).toMatchObject({
        success: true,
        quotaUsed: 501,
        quotaRemaining: -1, // -1 = unlimited
      });
    });
  });

  describe('Usage Tracking', () => {
    it('should increment usage counter after successful upload', async () => {
      const token = generateToken('user-track', 'track@example.com');

      const mockUser = {
        id: 'user-track',
        email: 'track@example.com',
        plan: 'FREE' as const,
        name: 'Track User',
      };

      const mockUsage = {
        id: 'usage-5',
        userId: 'user-track',
        period: '2025-12',
        uploadsUsed: 3,
        lastUploadAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);
      vi.mocked(prisma.insightUsage.upsert).mockResolvedValue(mockUsage);
      vi.mocked(prisma.insightUsage.update).mockResolvedValue({
        ...mockUsage,
        uploadsUsed: 4,
      });

      const req = new NextRequest('http://localhost:3000/api/cli/analysis/upload', {
        method: 'POST',
        headers: {
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(validPayload),
      });

      await POST(req);

      // Verify usage was incremented
      expect(prisma.insightUsage.update).toHaveBeenCalledWith({
        where: {
          userId_period: {
            userId: 'user-track',
            period: '2025-12',
          },
        },
        data: {
          uploadsUsed: {
            increment: 1,
          },
          lastUploadAt: expect.any(Date),
        },
      });
    });

    it('should not increment usage if quota exceeded', async () => {
      const token = generateToken('user-no-increment', 'no-increment@example.com');

      const mockUser = {
        id: 'user-no-increment',
        email: 'no-increment@example.com',
        plan: 'FREE' as const,
        name: 'No Increment User',
      };

      const mockUsage = {
        id: 'usage-6',
        userId: 'user-no-increment',
        period: '2025-12',
        uploadsUsed: 10, // At limit
        lastUploadAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);
      vi.mocked(prisma.insightUsage.upsert).mockResolvedValue(mockUsage);

      const req = new NextRequest('http://localhost:3000/api/cli/analysis/upload', {
        method: 'POST',
        headers: {
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(validPayload),
      });

      await POST(req);

      // Verify usage was NOT incremented
      expect(prisma.insightUsage.update).not.toHaveBeenCalled();
    });
  });

  describe('Payload Validation', () => {
    it('should reject upload with missing project name', async () => {
      const token = generateToken('user-validation', 'validation@example.com');

      const mockUser = {
        id: 'user-validation',
        email: 'validation@example.com',
        plan: 'FREE' as const,
        name: 'Validation User',
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);

      const invalidPayload = {
        ...validPayload,
        project: {
          name: '', // Invalid: empty string
        },
      };

      const req = new NextRequest('http://localhost:3000/api/cli/analysis/upload', {
        method: 'POST',
        headers: {
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(invalidPayload),
      });

      const response = await POST(req);

      expect(response.status).toBe(400);

      const body = await response.json();
      expect(body).toMatchObject({
        success: false,
        error: 'VALIDATION_ERROR',
      });
    });

    it('should accept upload with valid payload', async () => {
      const token = generateToken('user-valid', 'valid@example.com');

      const mockUser = {
        id: 'user-valid',
        email: 'valid@example.com',
        plan: 'PRO' as const,
        name: 'Valid User',
      };

      const mockUsage = {
        id: 'usage-7',
        userId: 'user-valid',
        period: '2025-12',
        uploadsUsed: 10,
        lastUploadAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);
      vi.mocked(prisma.insightUsage.upsert).mockResolvedValue(mockUsage);
      vi.mocked(prisma.insightUsage.update).mockResolvedValue({
        ...mockUsage,
        uploadsUsed: 11,
      });

      const req = new NextRequest('http://localhost:3000/api/cli/analysis/upload', {
        method: 'POST',
        headers: {
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(validPayload),
      });

      const response = await POST(req);

      expect(response.status).toBe(201);

      const body = await response.json();
      expect(body).toHaveProperty('uploadId');
      expect(body).toHaveProperty('dashboardUrl');
    });
  });

  describe('Plan Upgrade Scenarios', () => {
    it('should reflect plan upgrade immediately', async () => {
      const userId = 'user-upgrade';
      const token = generateToken(userId, 'upgrade@example.com');

      // Initial upload as FREE user (9/10 used)
      const freeUser = {
        id: userId,
        email: 'upgrade@example.com',
        plan: 'FREE' as const,
        name: 'Upgrade User',
      };

      const mockUsage = {
        id: 'usage-8',
        userId,
        period: '2025-12',
        uploadsUsed: 9,
        lastUploadAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValue(freeUser);
      vi.mocked(prisma.insightUsage.upsert).mockResolvedValue(mockUsage);
      vi.mocked(prisma.insightUsage.update).mockResolvedValue({
        ...mockUsage,
        uploadsUsed: 10,
      });

      const req1 = new NextRequest('http://localhost:3000/api/cli/analysis/upload', {
        method: 'POST',
        headers: { authorization: `Bearer ${token}` },
        body: JSON.stringify(validPayload),
      });

      const response1 = await POST(req1);
      expect(response1.status).toBe(201);

      const body1 = await response1.json();
      expect(body1.quotaRemaining).toBe(0); // 10/10 used

      // User upgrades to PRO (now 10/100 used)
      vi.clearAllMocks();
      const proUser = { ...freeUser, plan: 'PRO' as const };
      vi.mocked(prisma.user.findUnique).mockResolvedValue(proUser);
      vi.mocked(prisma.insightUsage.upsert).mockResolvedValue({
        ...mockUsage,
        uploadsUsed: 10,
      });
      vi.mocked(prisma.insightUsage.update).mockResolvedValue({
        ...mockUsage,
        uploadsUsed: 11,
      });

      const req2 = new NextRequest('http://localhost:3000/api/cli/analysis/upload', {
        method: 'POST',
        headers: { authorization: `Bearer ${token}` },
        body: JSON.stringify(validPayload),
      });

      const response2 = await POST(req2);
      expect(response2.status).toBe(201);

      const body2 = await response2.json();
      expect(body2.quotaRemaining).toBe(89); // 100 - 11 = 89
    });
  });
});
