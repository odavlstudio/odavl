/**
 * Database Mocks for ODAVL Testing
 * Mock Prisma client and database operations
 */

import { vi } from 'vitest';

// ========================================
// Prisma Client Mock
// ========================================

/**
 * Mock Prisma Client
 * Includes all major models used in ODAVL
 */
export const mockPrisma = {
  // User model
  user: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
    upsert: vi.fn(),
  },

  // Project model
  project: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
    upsert: vi.fn(),
  },

  // InsightRun model
  insightRun: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
  },

  // ErrorSignature model
  errorSignature: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
    upsert: vi.fn(),
  },

  // GuardianTest model
  guardianTest: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
  },

  // Session model (for auth)
  session: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    deleteMany: vi.fn(),
  },

  // Transaction support
  $transaction: vi.fn(),
  
  // Connection management
  $connect: vi.fn(),
  $disconnect: vi.fn(),
};

// ========================================
// Mock Data Factories
// ========================================

/**
 * Create mock user
 */
export function createMockUser(overrides: any = {}) {
  return {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
    emailVerified: new Date(),
    image: 'https://example.com/avatar.jpg',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

/**
 * Create mock project
 */
export function createMockProject(overrides: any = {}) {
  return {
    id: 'project-123',
    name: 'Test Project',
    slug: 'test-project',
    description: 'A test project',
    userId: 'user-123',
    repositoryUrl: 'https://github.com/user/test-project',
    isPublic: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

/**
 * Create mock insight run
 */
export function createMockInsightRun(overrides: any = {}) {
  return {
    id: 'run-123',
    projectId: 'project-123',
    detector: 'typescript',
    issuesFound: 12,
    issuesFixed: 8,
    status: 'completed',
    duration: 5000,
    timestamp: new Date(),
    metadata: {},
    ...overrides,
  };
}

/**
 * Create mock error signature
 */
export function createMockErrorSignature(overrides: any = {}) {
  return {
    id: 'error-123',
    projectId: 'project-123',
    hash: 'abc123def456',
    message: 'TypeError: Cannot read property "x" of undefined',
    stackTrace: 'at func (file.ts:10:5)',
    occurrences: 5,
    firstSeen: new Date(),
    lastSeen: new Date(),
    severity: 'high',
    ...overrides,
  };
}

/**
 * Create mock guardian test
 */
export function createMockGuardianTest(overrides: any = {}) {
  return {
    id: 'test-123',
    projectId: 'project-123',
    testType: 'accessibility',
    url: 'http://localhost:3000',
    passed: true,
    score: 0.95,
    issues: [],
    timestamp: new Date(),
    duration: 3000,
    ...overrides,
  };
}

// ========================================
// Setup Helpers
// ========================================

/**
 * Reset all database mocks
 */
export function resetDbMocks(): void {
  Object.values(mockPrisma).forEach((model) => {
    if (typeof model === 'object') {
      Object.values(model).forEach((method) => {
        if (typeof method === 'function' && 'mockReset' in method) {
          (method as any).mockReset();
        }
      });
    } else if (typeof model === 'function' && 'mockReset' in model) {
      (model as any).mockReset();
    }
  });
}

/**
 * Setup successful user creation
 */
export function mockUserCreate(user?: any): void {
  const mockUser = createMockUser(user);
  mockPrisma.user.create.mockResolvedValue(mockUser);
}

/**
 * Setup successful user find
 */
export function mockUserFind(user?: any): void {
  const mockUser = createMockUser(user);
  mockPrisma.user.findUnique.mockResolvedValue(mockUser);
  mockPrisma.user.findFirst.mockResolvedValue(mockUser);
}

/**
 * Setup user not found
 */
export function mockUserNotFound(): void {
  mockPrisma.user.findUnique.mockResolvedValue(null);
  mockPrisma.user.findFirst.mockResolvedValue(null);
}

/**
 * Setup successful project operations
 */
export function mockProjectOperations(project?: any): void {
  const mockProject = createMockProject(project);
  mockPrisma.project.create.mockResolvedValue(mockProject);
  mockPrisma.project.findUnique.mockResolvedValue(mockProject);
  mockPrisma.project.findMany.mockResolvedValue([mockProject]);
  mockPrisma.project.update.mockResolvedValue(mockProject);
}

/**
 * Setup database error
 */
export function mockDatabaseError(message = 'Database connection failed'): void {
  const error = new Error(message);
  mockPrisma.user.findUnique.mockRejectedValue(error);
  mockPrisma.user.create.mockRejectedValue(error);
  mockPrisma.project.findUnique.mockRejectedValue(error);
  mockPrisma.project.create.mockRejectedValue(error);
}

/**
 * Setup transaction mock
 */
export function mockTransaction(results: any[]): void {
  mockPrisma.$transaction.mockResolvedValue(results);
}

// ========================================
// Example Usage in Tests
// ========================================

/**
 * Example test setup:
 * 
 * import { mockPrisma, createMockUser, resetDbMocks } from './db-mocks';
 * 
 * describe('User Service', () => {
 *   beforeEach(() => {
 *     resetDbMocks();
 *   });
 * 
 *   it('should create a user', async () => {
 *     const mockUser = createMockUser();
 *     mockPrisma.user.create.mockResolvedValue(mockUser);
 *     
 *     const result = await userService.create({
 *       email: 'test@example.com',
 *       name: 'Test User'
 *     });
 *     
 *     expect(result).toEqual(mockUser);
 *     expect(mockPrisma.user.create).toHaveBeenCalledTimes(1);
 *   });
 * });
 */
