/**
 * ODAVL Insight - Database Detector Tests
 * Comprehensive test suite for database issue detection
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { DatabaseDetector, analyzeDatabase, DatabaseConfig } from './database-detector';

describe('DatabaseDetector', () => {
  let testWorkspace: string;
  let detector: DatabaseDetector;

  beforeEach(async () => {
    testWorkspace = path.join(process.cwd(), 'test-workspace-db');
    await fs.mkdir(testWorkspace, { recursive: true });
    detector = new DatabaseDetector();
  });

  afterEach(async () => {
    try {
      await fs.rm(testWorkspace, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('Configuration', () => {
    it('should use default configuration', () => {
      const detector = new DatabaseDetector();
      expect(detector).toBeDefined();
    });

    it('should accept custom configuration', () => {
      const config: DatabaseConfig = {
        slowQueryThreshold: 50,
        criticalQueryThreshold: 200,
        maxConnectionPoolSize: 20,
        prismaSchemaPath: 'custom/schema.prisma',
      };
      const detector = new DatabaseDetector(config);
      expect(detector).toBeDefined();
    });

    it('should respect exclude patterns', () => {
      const config: DatabaseConfig = {
        excludePatterns: ['**/test/**', '**/mocks/**'],
      };
      const detector = new DatabaseDetector(config);
      expect(detector).toBeDefined();
    });
  });

  describe('Basic Analysis', () => {
    it('should complete analysis without errors', async () => {
      await createMockPrismaSchema(testWorkspace);
      await createMockSourceFile(testWorkspace);

      const result = await detector.analyze(testWorkspace);

      expect(result).toBeDefined();
      expect(result.issues).toBeInstanceOf(Array);
      expect(result.metrics).toBeDefined();
      expect(result.timestamp).toBeDefined();
    }, 30000);

    it('should return database metrics', async () => {
      await createMockPrismaSchema(testWorkspace);
      
      const result = await detector.analyze(testWorkspace);
      const { metrics } = result;

      expect(metrics.slowQueries).toBeGreaterThanOrEqual(0);
      expect(metrics.nPlusOneQueries).toBeGreaterThanOrEqual(0);
      expect(metrics.missingIndexes).toBeGreaterThanOrEqual(0);
      expect(metrics.connectionLeaks).toBeGreaterThanOrEqual(0);
      expect(metrics.databaseScore).toBeGreaterThanOrEqual(0);
      expect(metrics.databaseScore).toBeLessThanOrEqual(100);
    }, 30000);

    it('should detect database type from schema', async () => {
      await createMockPrismaSchema(testWorkspace, 'postgresql');
      
      const result = await detector.analyze(testWorkspace);
      
      expect(result.databaseType).toBe('postgresql');
    }, 30000);
  });

  describe('Schema Drift Detection', () => {
    it('should detect deprecated models', async () => {
      const schema = `
        datasource db {
          provider = "postgresql"
          url      = env("DATABASE_URL")
        }

        model User {
          id    Int    @id @default(autoincrement())
          name  String
          @@ignore
        }
      `;
      await createMockPrismaSchema(testWorkspace, 'postgresql', schema);

      const result = await detector.analyze(testWorkspace);
      const schemaDriftIssues = result.issues.filter(i => i.type === 'schema-drift');

      expect(schemaDriftIssues.length).toBeGreaterThan(0);
      expect(schemaDriftIssues[0].message).toContain('deprecated');
    }, 30000);

    it('should detect missing foreign key indexes', async () => {
      const schema = `
        datasource db {
          provider = "postgresql"
          url      = env("DATABASE_URL")
        }

        model Post {
          id       Int  @id @default(autoincrement())
          authorId Int
          author   User @relation(fields: [authorId], references: [id])
        }

        model User {
          id    Int    @id @default(autoincrement())
          posts Post[]
        }
      `;
      await createMockPrismaSchema(testWorkspace, 'postgresql', schema);

      const result = await detector.analyze(testWorkspace);
      const missingIndexIssues = result.issues.filter(i => i.type === 'missing-index');

      expect(missingIndexIssues.length).toBeGreaterThan(0);
      expect(missingIndexIssues[0].message).toContain('authorId');
    }, 30000);

    it('should handle missing Prisma schema gracefully', async () => {
      const result = await detector.analyze(testWorkspace);
      
      // Should not throw, just skip schema checks
      expect(result).toBeDefined();
      expect(result.issues.filter(i => i.type === 'schema-drift').length).toBe(0);
    }, 30000);
  });

  describe('Slow Query Detection', () => {
    it('should detect unpaginated findMany queries', async () => {
      const sourceCode = `
        export async function getUsers() {
          const users = await prisma.user.findMany();
          return users;
        }
      `;
      await createMockSourceFile(testWorkspace, 'users.ts', sourceCode);

      const result = await detector.analyze(testWorkspace);
      const slowQueryIssues = result.issues.filter(i => i.type === 'slow-query');

      expect(slowQueryIssues.length).toBeGreaterThan(0);
      expect(slowQueryIssues[0].message).toContain('Unpaginated');
    }, 30000);

    it('should detect queries without select clause', async () => {
      const sourceCode = `
        export async function getUserById(id: number) {
          return await prisma.user.findFirst({ where: { id } });
        }
      `;
      await createMockSourceFile(testWorkspace, 'users.ts', sourceCode);

      const result = await detector.analyze(testWorkspace);
      const inefficientIssues = result.issues.filter(i => i.type === 'inefficient-query');

      expect(inefficientIssues.length).toBeGreaterThan(0);
      expect(inefficientIssues[0].message).toContain('all fields');
    }, 30000);

    it('should not flag paginated queries', async () => {
      const sourceCode = `
        export async function getUsers(page: number) {
          return await prisma.user.findMany({
            take: 20,
            skip: page * 20,
          });
        }
      `;
      await createMockSourceFile(testWorkspace, 'users.ts', sourceCode);

      const result = await detector.analyze(testWorkspace);
      const slowQueryIssues = result.issues.filter(i => 
        i.type === 'slow-query' && i.message.includes('Unpaginated')
      );

      expect(slowQueryIssues.length).toBe(0);
    }, 30000);
  });

  describe('N+1 Query Detection', () => {
    it('should detect queries in forEach loops', async () => {
      const sourceCode = `
        export async function getUsersWithPosts(userIds: number[]) {
          userIds.forEach(async (id) => {
            const user = await prisma.user.findUnique({ where: { id } });
            console.log(user);
          });
        }
      `;
      await createMockSourceFile(testWorkspace, 'users.ts', sourceCode);

      const result = await detector.analyze(testWorkspace);
      const nPlusOneIssues = result.issues.filter(i => i.type === 'n-plus-one');

      expect(nPlusOneIssues.length).toBeGreaterThan(0);
      expect(nPlusOneIssues[0].severity).toBe('critical');
      expect(nPlusOneIssues[0].message).toContain('N+1');
    }, 30000);

    it('should detect queries in map loops', async () => {
      const sourceCode = `
        export async function enrichUsers(users: User[]) {
          return users.map(async (user) => {
            const posts = await prisma.post.findMany({ where: { authorId: user.id } });
            return { ...user, posts };
          });
        }
      `;
      await createMockSourceFile(testWorkspace, 'users.ts', sourceCode);

      const result = await detector.analyze(testWorkspace);
      const nPlusOneIssues = result.issues.filter(i => i.type === 'n-plus-one');

      expect(nPlusOneIssues.length).toBeGreaterThan(0);
      expect(nPlusOneIssues[0].suggestion).toContain('batch');
    }, 30000);

    it('should detect queries in for loops', async () => {
      const sourceCode = `
        export async function processUsers(userIds: number[]) {
          for (const id of userIds) {
            const user = await prisma.user.findUnique({ where: { id } });
            await processUser(user);
          }
        }
      `;
      await createMockSourceFile(testWorkspace, 'users.ts', sourceCode);

      const result = await detector.analyze(testWorkspace);
      const nPlusOneIssues = result.issues.filter(i => i.type === 'n-plus-one');

      expect(nPlusOneIssues.length).toBeGreaterThan(0);
      expect(nPlusOneIssues[0].message).toContain('for loop');
    }, 30000);

    it('should not flag batched queries', async () => {
      const sourceCode = `
        export async function getUsersWithPosts(userIds: number[]) {
          const users = await prisma.user.findMany({
            where: { id: { in: userIds } },
            include: { posts: true },
          });
          return users;
        }
      `;
      await createMockSourceFile(testWorkspace, 'users.ts', sourceCode);

      const result = await detector.analyze(testWorkspace);
      const nPlusOneIssues = result.issues.filter(i => i.type === 'n-plus-one');

      expect(nPlusOneIssues.length).toBe(0);
    }, 30000);
  });

  describe('Missing Index Detection', () => {
    it('should detect where clauses on non-indexed fields', async () => {
      const schema = `
        datasource db {
          provider = "postgresql"
          url      = env("DATABASE_URL")
        }

        model User {
          id    Int    @id @default(autoincrement())
          email String
          name  String
        }
      `;
      await createMockPrismaSchema(testWorkspace, 'postgresql', schema);

      const sourceCode = `
        export async function findUserByEmail(email: string) {
          return await prisma.user.findFirst({ where: { email } });
        }
      `;
      await createMockSourceFile(testWorkspace, 'users.ts', sourceCode);

      const result = await detector.analyze(testWorkspace);
      const missingIndexIssues = result.issues.filter(i => 
        i.type === 'missing-index' && i.details?.missingColumn === 'email'
      );

      expect(missingIndexIssues.length).toBeGreaterThan(0);
      expect(missingIndexIssues[0].suggestion).toContain('@@index');
    }, 30000);

    it('should not flag indexed fields', async () => {
      const schema = `
        datasource db {
          provider = "postgresql"
          url      = env("DATABASE_URL")
        }

        model User {
          id    Int    @id @default(autoincrement())
          email String

          @@index([email])
        }
      `;
      await createMockPrismaSchema(testWorkspace, 'postgresql', schema);

      const sourceCode = `
        export async function findUserByEmail(email: string) {
          return await prisma.user.findFirst({ where: { email } });
        }
      `;
      await createMockSourceFile(testWorkspace, 'users.ts', sourceCode);

      const result = await detector.analyze(testWorkspace);
      const missingIndexIssues = result.issues.filter(i => 
        i.type === 'missing-index' && i.details?.missingColumn === 'email'
      );

      expect(missingIndexIssues.length).toBe(0);
    }, 30000);

    it('should not flag id field (always indexed)', async () => {
      const schema = `
        datasource db {
          provider = "postgresql"
          url      = env("DATABASE_URL")
        }

        model User {
          id   Int    @id @default(autoincrement())
          name String
        }
      `;
      await createMockPrismaSchema(testWorkspace, 'postgresql', schema);

      const sourceCode = `
        export async function findUserById(id: number) {
          return await prisma.user.findUnique({ where: { id } });
        }
      `;
      await createMockSourceFile(testWorkspace, 'users.ts', sourceCode);

      const result = await detector.analyze(testWorkspace);
      const missingIndexIssues = result.issues.filter(i => 
        i.type === 'missing-index' && i.details?.missingColumn === 'id'
      );

      expect(missingIndexIssues.length).toBe(0);
    }, 30000);
  });

  describe('Connection Leak Detection', () => {
    it('should detect PrismaClient without $disconnect', async () => {
      const sourceCode = `
        import { PrismaClient } from '@prisma/client';
        
        export function getClient() {
          const prisma = new PrismaClient();
          return prisma;
        }
      `;
      await createMockSourceFile(testWorkspace, 'client.ts', sourceCode);

      const result = await detector.analyze(testWorkspace);
      const connectionIssues = result.issues.filter(i => i.type === 'connection-leak');

      expect(connectionIssues.length).toBeGreaterThan(0);
      expect(connectionIssues[0].message).toContain('without cleanup');
    }, 30000);

    it('should detect multiple PrismaClient instances', async () => {
      const sourceCode = `
        import { PrismaClient } from '@prisma/client';
        
        export function getClients() {
          const prisma1 = new PrismaClient();
          const prisma2 = new PrismaClient();
          return [prisma1, prisma2];
        }
      `;
      await createMockSourceFile(testWorkspace, 'client.ts', sourceCode);

      const result = await detector.analyze(testWorkspace);
      const connectionIssues = result.issues.filter(i => 
        i.type === 'connection-leak' && i.message.includes('Multiple')
      );

      expect(connectionIssues.length).toBeGreaterThan(0);
      expect(connectionIssues[0].severity).toBe('critical');
    }, 30000);

    it('should detect SQL injection in raw queries', async () => {
      const sourceCode = `
        export async function getUserByName(name: string) {
          return await prisma.$queryRaw\`SELECT * FROM users WHERE name = \${name}\`;
        }
      `;
      await createMockSourceFile(testWorkspace, 'users.ts', sourceCode);

      const result = await detector.analyze(testWorkspace);
      const injectionIssues = result.issues.filter(i => 
        i.type === 'inefficient-query' && i.message.includes('SQL injection')
      );

      expect(injectionIssues.length).toBeGreaterThan(0);
      expect(injectionIssues[0].severity).toBe('critical');
    }, 30000);
  });

  describe('Metrics Calculation', () => {
    it('should calculate database score correctly', async () => {
      const result = await detector.analyze(testWorkspace);
      
      expect(result.metrics.databaseScore).toBeGreaterThanOrEqual(0);
      expect(result.metrics.databaseScore).toBeLessThanOrEqual(100);
    }, 30000);

    it('should decrease score for critical issues', async () => {
      const sourceCode = `
        export async function badCode() {
          userIds.forEach(async (id) => {
            const user = await prisma.user.findUnique({ where: { id } });
          });
        }
      `;
      await createMockSourceFile(testWorkspace, 'users.ts', sourceCode);

      const result = await detector.analyze(testWorkspace);
      
      // Critical N+1 issue should decrease score
      expect(result.metrics.databaseScore).toBeLessThan(100);
    }, 30000);

    it('should track issue counts correctly', async () => {
      const schema = `
        datasource db {
          provider = "postgresql"
          url      = env("DATABASE_URL")
        }

        model User {
          id   Int    @id @default(autoincrement())
          name String
          @@ignore
        }
      `;
      await createMockPrismaSchema(testWorkspace, 'postgresql', schema);

      const sourceCode = `
        export async function getUsers() {
          return await prisma.user.findMany();
        }
      `;
      await createMockSourceFile(testWorkspace, 'users.ts', sourceCode);

      const result = await detector.analyze(testWorkspace);
      
      expect(result.metrics.schemaDrifts).toBeGreaterThan(0);
      expect(result.metrics.slowQueries).toBeGreaterThan(0);
    }, 30000);
  });

  describe('Error Handling', () => {
    it('should handle non-existent workspace gracefully', async () => {
      const nonExistentPath = path.join(process.cwd(), 'non-existent-workspace');
      
      await expect(detector.analyze(nonExistentPath)).resolves.toBeDefined();
    }, 30000);

    it('should handle empty workspace', async () => {
      const result = await detector.analyze(testWorkspace);
      
      expect(result).toBeDefined();
      expect(result.issues).toBeInstanceOf(Array);
    }, 30000);

    it('should handle invalid Prisma schema gracefully', async () => {
      const invalidSchema = 'invalid schema content';
      await fs.mkdir(path.join(testWorkspace, 'prisma'), { recursive: true });
      await fs.writeFile(path.join(testWorkspace, 'prisma', 'schema.prisma'), invalidSchema);

      const result = await detector.analyze(testWorkspace);
      
      // Should not throw, just skip schema analysis
      expect(result).toBeDefined();
    }, 30000);
  });

  describe('analyzeDatabase Helper', () => {
    it('should provide convenience function', async () => {
      await createMockPrismaSchema(testWorkspace);
      
      const result = await analyzeDatabase(testWorkspace);
      
      expect(result).toBeDefined();
      expect(result.issues).toBeInstanceOf(Array);
      expect(result.metrics).toBeDefined();
    }, 30000);

    it('should accept custom config via helper', async () => {
      const config: DatabaseConfig = {
        slowQueryThreshold: 50,
      };
      
      const result = await analyzeDatabase(testWorkspace, config);
      
      expect(result).toBeDefined();
    }, 30000);
  });

  describe('Performance', () => {
    it('should complete analysis in reasonable time', async () => {
      await createMockPrismaSchema(testWorkspace);
      await createMockSourceFile(testWorkspace);

      const startTime = performance.now();
      await detector.analyze(testWorkspace);
      const duration = performance.now() - startTime;

      // Should complete in less than 5 seconds for small workspace
      expect(duration).toBeLessThan(5000);
    }, 30000);
  });

  describe('Database Type Detection', () => {
    it('should detect PostgreSQL', async () => {
      await createMockPrismaSchema(testWorkspace, 'postgresql');
      const result = await detector.analyze(testWorkspace);
      expect(result.databaseType).toBe('postgresql');
    }, 30000);

    it('should detect MySQL', async () => {
      await createMockPrismaSchema(testWorkspace, 'mysql');
      const result = await detector.analyze(testWorkspace);
      expect(result.databaseType).toBe('mysql');
    }, 30000);

    it('should detect SQLite', async () => {
      await createMockPrismaSchema(testWorkspace, 'sqlite');
      const result = await detector.analyze(testWorkspace);
      expect(result.databaseType).toBe('sqlite');
    }, 30000);

    it('should detect MongoDB', async () => {
      await createMockPrismaSchema(testWorkspace, 'mongodb');
      const result = await detector.analyze(testWorkspace);
      expect(result.databaseType).toBe('mongodb');
    }, 30000);

    it('should return unknown for missing schema', async () => {
      const result = await detector.analyze(testWorkspace);
      expect(result.databaseType).toBe('unknown');
    }, 30000);
  });
});

// Helper functions for creating test fixtures

async function createMockPrismaSchema(
  workspace: string, 
  provider: string = 'postgresql',
  customSchema?: string
): Promise<void> {
  const prismaDir = path.join(workspace, 'prisma');
  await fs.mkdir(prismaDir, { recursive: true });

  const schema = customSchema || `
    datasource db {
      provider = "${provider}"
      url      = env("DATABASE_URL")
    }

    generator client {
      provider = "prisma-client-js"
    }

    model User {
      id        Int      @id @default(autoincrement())
      email     String   @unique
      name      String
      posts     Post[]
      createdAt DateTime @default(now())
    }

    model Post {
      id        Int      @id @default(autoincrement())
      title     String
      content   String?
      authorId  Int
      author    User     @relation(fields: [authorId], references: [id])
      createdAt DateTime @default(now())
    }
  `;

  await fs.writeFile(path.join(prismaDir, 'schema.prisma'), schema);
}

async function createMockSourceFile(
  workspace: string,
  filename: string = 'test.ts',
  content?: string
): Promise<void> {
  const srcDir = path.join(workspace, 'src');
  await fs.mkdir(srcDir, { recursive: true });

  const defaultContent = `
    import { PrismaClient } from '@prisma/client';

    const prisma = new PrismaClient();

    export async function getUsers() {
      return await prisma.user.findMany();
    }

    export async function getUserById(id: number) {
      return await prisma.user.findUnique({
        where: { id },
      });
    }
  `;

  await fs.writeFile(path.join(srcDir, filename), content || defaultContent);
}
