/**
 * JWT Authentication Middleware Tests
 * Phase 3.0.3: Authentication & Plan Binding
 * 
 * Tests JWT token validation, user resolution, and plan enforcement
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { 
  authenticateRequest, 
  withAuth, 
  withPlan,
  generateToken,
  type AuthenticatedUser 
} from '../../../lib/auth/jwt.middleware';
import { prisma } from '../../../lib/prisma';

// Mock Prisma client
vi.mock('../../../lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
  },
}));

// Mock environment
const ORIGINAL_ENV = process.env;

describe('JWT Authentication Middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...ORIGINAL_ENV, JWT_SECRET: 'test-secret-key-for-jwt-signing' };
  });

  afterEach(() => {
    process.env = ORIGINAL_ENV;
  });

  describe('authenticateRequest', () => {
    it('should authenticate valid JWT token', async () => {
      const token = generateToken('user-123', 'test@example.com');
      
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        plan: 'FREE' as const,
        name: 'Test User',
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);

      const req = new NextRequest('http://localhost:3000/api/test', {
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      const user = await authenticateRequest(req);

      expect(user).toBeDefined();
      expect(user?.userId).toBe('user-123');
      expect(user?.email).toBe('test@example.com');
      expect(user?.plan).toBe('FREE');
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        select: { id: true, email: true, plan: true, name: true },
      });
    });

    it('should reject request without Authorization header', async () => {
      const req = new NextRequest('http://localhost:3000/api/test');

      const user = await authenticateRequest(req);

      expect(user).toBeNull();
      expect(prisma.user.findUnique).not.toHaveBeenCalled();
    });

    it('should reject malformed Authorization header', async () => {
      const req = new NextRequest('http://localhost:3000/api/test', {
        headers: {
          authorization: 'InvalidFormat token123',
        },
      });

      const user = await authenticateRequest(req);

      expect(user).toBeNull();
    });

    it('should reject invalid JWT token', async () => {
      const req = new NextRequest('http://localhost:3000/api/test', {
        headers: {
          authorization: 'Bearer invalid.jwt.token',
        },
      });

      const user = await authenticateRequest(req);

      expect(user).toBeNull();
    });

    it('should reject expired JWT token', async () => {
      const expiredToken = generateToken('user-123', 'test@example.com', '-1h'); // Expired 1 hour ago

      const req = new NextRequest('http://localhost:3000/api/test', {
        headers: {
          authorization: `Bearer ${expiredToken}`,
        },
      });

      const user = await authenticateRequest(req);

      expect(user).toBeNull();
    });

    it('should reject JWT with missing userId', async () => {
      const jwt = require('jsonwebtoken');
      const invalidToken = jwt.sign(
        { email: 'test@example.com' }, // Missing userId
        'test-secret-key-for-jwt-signing'
      );

      const req = new NextRequest('http://localhost:3000/api/test', {
        headers: {
          authorization: `Bearer ${invalidToken}`,
        },
      });

      const user = await authenticateRequest(req);

      expect(user).toBeNull();
    });

    it('should reject JWT with missing email', async () => {
      const jwt = require('jsonwebtoken');
      const invalidToken = jwt.sign(
        { userId: 'user-123' }, // Missing email
        'test-secret-key-for-jwt-signing'
      );

      const req = new NextRequest('http://localhost:3000/api/test', {
        headers: {
          authorization: `Bearer ${invalidToken}`,
        },
      });

      const user = await authenticateRequest(req);

      expect(user).toBeNull();
    });

    it('should return null if user not found in database', async () => {
      const token = generateToken('user-nonexistent', 'ghost@example.com');

      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

      const req = new NextRequest('http://localhost:3000/api/test', {
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      const user = await authenticateRequest(req);

      expect(user).toBeNull();
      expect(prisma.user.findUnique).toHaveBeenCalled();
    });

    it('should handle database errors gracefully', async () => {
      const token = generateToken('user-123', 'test@example.com');

      vi.mocked(prisma.user.findUnique).mockRejectedValue(new Error('Database connection failed'));

      const req = new NextRequest('http://localhost:3000/api/test', {
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      const user = await authenticateRequest(req);

      expect(user).toBeNull();
    });

    it('should handle users with different plans', async () => {
      const plans = ['FREE', 'PRO', 'TEAM', 'ENTERPRISE'] as const;

      for (const plan of plans) {
        vi.clearAllMocks();

        const token = generateToken('user-123', 'test@example.com');
        
        const mockUser = {
          id: 'user-123',
          email: 'test@example.com',
          plan,
          name: 'Test User',
        };

        vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);

        const req = new NextRequest('http://localhost:3000/api/test', {
          headers: {
            authorization: `Bearer ${token}`,
          },
        });

        const user = await authenticateRequest(req);

        expect(user?.plan).toBe(plan);
      }
    });
  });

  describe('withAuth', () => {
    it('should call handler with authenticated user', async () => {
      const token = generateToken('user-123', 'test@example.com');
      
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        plan: 'PRO' as const,
        name: 'Test User',
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);

      const handler = vi.fn(async (req, user: AuthenticatedUser) => {
        return new Response(JSON.stringify({ success: true, userId: user.userId }));
      });

      const protectedHandler = withAuth(handler);

      const req = new NextRequest('http://localhost:3000/api/test', {
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      await protectedHandler(req);

      expect(handler).toHaveBeenCalledWith(
        req,
        expect.objectContaining({
          userId: 'user-123',
          email: 'test@example.com',
          plan: 'PRO',
        })
      );
    });

    it('should return 401 without valid token', async () => {
      const handler = vi.fn();
      const protectedHandler = withAuth(handler);

      const req = new NextRequest('http://localhost:3000/api/test');

      const response = await protectedHandler(req);

      expect(response.status).toBe(401);
      expect(handler).not.toHaveBeenCalled();

      const body = await response.json();
      expect(body).toMatchObject({
        success: false,
        error: 'UNAUTHORIZED',
      });
    });

    it('should return 401 for expired token', async () => {
      const expiredToken = generateToken('user-123', 'test@example.com', '-1h');

      const handler = vi.fn();
      const protectedHandler = withAuth(handler);

      const req = new NextRequest('http://localhost:3000/api/test', {
        headers: {
          authorization: `Bearer ${expiredToken}`,
        },
      });

      const response = await protectedHandler(req);

      expect(response.status).toBe(401);
      expect(handler).not.toHaveBeenCalled();
    });

    it('should return 401 if user not found in database', async () => {
      const token = generateToken('user-ghost', 'ghost@example.com');

      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

      const handler = vi.fn();
      const protectedHandler = withAuth(handler);

      const req = new NextRequest('http://localhost:3000/api/test', {
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      const response = await protectedHandler(req);

      expect(response.status).toBe(401);
      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('withPlan', () => {
    it('should allow PRO user to access PRO-required route', async () => {
      const token = generateToken('user-pro', 'pro@example.com');
      
      const mockUser = {
        id: 'user-pro',
        email: 'pro@example.com',
        plan: 'PRO' as const,
        name: 'Pro User',
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);

      const handler = vi.fn(async () => {
        return new Response(JSON.stringify({ success: true }));
      });

      const protectedHandler = withPlan('PRO', handler);

      const req = new NextRequest('http://localhost:3000/api/pro-feature', {
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      await protectedHandler(req);

      expect(handler).toHaveBeenCalled();
    });

    it('should allow ENTERPRISE user to access PRO-required route', async () => {
      const token = generateToken('user-enterprise', 'enterprise@example.com');
      
      const mockUser = {
        id: 'user-enterprise',
        email: 'enterprise@example.com',
        plan: 'ENTERPRISE' as const,
        name: 'Enterprise User',
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);

      const handler = vi.fn(async () => {
        return new Response(JSON.stringify({ success: true }));
      });

      const protectedHandler = withPlan('PRO', handler);

      const req = new NextRequest('http://localhost:3000/api/pro-feature', {
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      await protectedHandler(req);

      expect(handler).toHaveBeenCalled();
    });

    it('should block FREE user from PRO-required route', async () => {
      const token = generateToken('user-free', 'free@example.com');
      
      const mockUser = {
        id: 'user-free',
        email: 'free@example.com',
        plan: 'FREE' as const,
        name: 'Free User',
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);

      const handler = vi.fn();
      const protectedHandler = withPlan('PRO', handler);

      const req = new NextRequest('http://localhost:3000/api/pro-feature', {
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      const response = await protectedHandler(req);

      expect(response.status).toBe(403);
      expect(handler).not.toHaveBeenCalled();

      const body = await response.json();
      expect(body).toMatchObject({
        success: false,
        error: 'INSUFFICIENT_PLAN',
      });
    });

    it('should block PRO user from ENTERPRISE-required route', async () => {
      const token = generateToken('user-pro', 'pro@example.com');
      
      const mockUser = {
        id: 'user-pro',
        email: 'pro@example.com',
        plan: 'PRO' as const,
        name: 'Pro User',
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);

      const handler = vi.fn();
      const protectedHandler = withPlan('ENTERPRISE', handler);

      const req = new NextRequest('http://localhost:3000/api/enterprise-feature', {
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      const response = await protectedHandler(req);

      expect(response.status).toBe(403);
      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('generateToken', () => {
    it('should generate valid JWT token', () => {
      const token = generateToken('user-123', 'test@example.com');

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });

    it('should generate token with custom expiration', () => {
      const token = generateToken('user-123', 'test@example.com', '1h');

      expect(token).toBeDefined();

      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(token, 'test-secret-key-for-jwt-signing');

      expect(decoded).toHaveProperty('userId', 'user-123');
      expect(decoded).toHaveProperty('email', 'test@example.com');
    });

    it('should throw error if JWT_SECRET not configured', () => {
      process.env.JWT_SECRET = '';

      expect(() => {
        generateToken('user-123', 'test@example.com');
      }).toThrow('JWT_SECRET not configured');
    });
  });

  describe('Integration scenarios', () => {
    it('should handle full authentication flow', async () => {
      // Step 1: Generate token
      const token = generateToken('user-integration', 'integration@example.com');

      // Step 2: User exists in database with PRO plan
      const mockUser = {
        id: 'user-integration',
        email: 'integration@example.com',
        plan: 'PRO' as const,
        name: 'Integration User',
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);

      // Step 3: Make authenticated request
      const req = new NextRequest('http://localhost:3000/api/test', {
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      const user = await authenticateRequest(req);

      // Step 4: Verify user data
      expect(user).toBeDefined();
      expect(user?.userId).toBe('user-integration');
      expect(user?.plan).toBe('PRO');
    });

    it('should handle plan upgrade scenario', async () => {
      const userId = 'user-upgrade';
      const token = generateToken(userId, 'upgrade@example.com');

      // Initially FREE plan
      const freeUser = {
        id: userId,
        email: 'upgrade@example.com',
        plan: 'FREE' as const,
        name: 'Upgrade User',
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValue(freeUser);

      const req1 = new NextRequest('http://localhost:3000/api/test', {
        headers: { authorization: `Bearer ${token}` },
      });

      const user1 = await authenticateRequest(req1);
      expect(user1?.plan).toBe('FREE');

      // After upgrade to PRO
      vi.clearAllMocks();
      const proUser = { ...freeUser, plan: 'PRO' as const };
      vi.mocked(prisma.user.findUnique).mockResolvedValue(proUser);

      const req2 = new NextRequest('http://localhost:3000/api/test', {
        headers: { authorization: `Bearer ${token}` },
      });

      const user2 = await authenticateRequest(req2);
      expect(user2?.plan).toBe('PRO');
    });
  });
});
