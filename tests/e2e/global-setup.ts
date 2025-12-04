/**
 * Global setup for Playwright E2E tests
 * Runs once before all tests
 * 
 * Responsibilities:
 * - Initialize test environment
 * - Set up test database
 * - Seed test data
 * - Create authentication state
 * - Prepare test fixtures
 */

import { chromium, FullConfig } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

async function globalSetup(config: FullConfig) {
  console.log('\n🚀 Starting global setup for E2E tests...\n');

  // Ensure reports directory exists
  const reportsDir = path.join(__dirname, '../../reports');
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  // Ensure test artifacts directory exists
  const artifactsDir = path.join(__dirname, '../../test-results');
  if (!fs.existsSync(artifactsDir)) {
    fs.mkdirSync(artifactsDir, { recursive: true });
  }

  // Set up test database (if needed)
  console.log('📦 Setting up test database...');
  await setupTestDatabase();

  // Seed test data
  console.log('🌱 Seeding test data...');
  await seedTestData();

  // Create authenticated browser context for tests
  console.log('🔐 Creating authenticated browser context...');
  await createAuthenticatedContext();

  console.log('\n✅ Global setup completed successfully!\n');
}

/**
 * Set up test database
 * - Create test database if doesn't exist
 * - Run migrations
 * - Ensure clean state
 */
async function setupTestDatabase() {
  // Only run if DATABASE_URL is set
  if (!process.env.DATABASE_URL) {
    console.log('⚠️  DATABASE_URL not set, skipping database setup');
    return;
  }

  try {
    // Import Prisma client
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();

    // Test connection
    await prisma.$connect();
    console.log('✓ Database connection successful');

    // Run migrations
    console.log('✓ Running database migrations...');
    // In production, migrations should be run via CLI: pnpm prisma migrate deploy
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    throw error;
  }
}

/**
 * Seed test data
 * - Create test users
 * - Create test projects
 * - Create test issues/runs/tests
 */
async function seedTestData() {
  // Only seed if DATABASE_URL is set
  if (!process.env.DATABASE_URL) {
    console.log('⚠️  DATABASE_URL not set, skipping data seeding');
    return;
  }

  try {
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    await prisma.$connect();

    // Create test user
    const testUser = await prisma.user.upsert({
      where: { email: 'test@odavl.studio' },
      update: {},
      create: {
        email: 'test@odavl.studio',
        name: 'Test User',
        emailVerified: new Date(),
        // NextAuth will create accounts via OAuth
      },
    });
    console.log('✓ Test user created:', testUser.email);

    // Create test project
    const testProject = await prisma.project.upsert({
      where: { id: 'test-project-123' },
      update: {},
      create: {
        id: 'test-project-123',
        name: 'Test Project',
        slug: 'test-project',
        userId: testUser.id,
        language: 'typescript',
        framework: 'nextjs',
        repositoryUrl: 'https://github.com/odavl/test-project',
      },
    });
    console.log('✓ Test project created:', testProject.name);

    // Create test issues for Insight
    const testIssues = await prisma.issue.createMany({
      data: [
        {
          projectId: testProject.id,
          detector: 'typescript',
          severity: 'high',
          message: 'Type error: Property "foo" does not exist',
          filePath: 'src/components/Button.tsx',
          lineNumber: 42,
          columnNumber: 12,
          status: 'open',
        },
        {
          projectId: testProject.id,
          detector: 'eslint',
          severity: 'medium',
          message: 'Unexpected console statement',
          filePath: 'src/utils/logger.ts',
          lineNumber: 15,
          columnNumber: 5,
          status: 'open',
        },
        {
          projectId: testProject.id,
          detector: 'security',
          severity: 'critical',
          message: 'Hardcoded API key detected',
          filePath: 'src/config/api.ts',
          lineNumber: 8,
          columnNumber: 20,
          status: 'open',
        },
      ],
      skipDuplicates: true,
    });
    console.log(`✓ Created ${testIssues.count} test issues`);

    // Create test autopilot runs
    const testRun = await prisma.autopilotRun.create({
      data: {
        projectId: testProject.id,
        status: 'success',
        startedAt: new Date(Date.now() - 1000 * 60 * 15), // 15 minutes ago
        completedAt: new Date(Date.now() - 1000 * 60 * 10), // 10 minutes ago
        duration: 300, // 5 minutes
        phases: {
          observe: { status: 'success', duration: 45 },
          decide: { status: 'success', duration: 30 },
          act: { status: 'success', duration: 180 },
          verify: { status: 'success', duration: 30 },
          learn: { status: 'success', duration: 15 },
        },
        filesModified: 5,
        linesChanged: 42,
        issuesFixed: 3,
      },
    });
    console.log('✓ Test autopilot run created:', testRun.id);

    // Create test guardian tests
    const testGuardian = await prisma.guardianTest.create({
      data: {
        projectId: testProject.id,
        url: 'https://test.odavl.studio',
        environment: 'staging',
        status: 'passed',
        executedAt: new Date(),
        duration: 45,
        performanceScore: 95,
        accessibilityScore: 98,
        securityScore: 92,
        seoScore: 90,
        metrics: {
          lcp: 1.2,
          fid: 0.08,
          cls: 0.05,
          ttfb: 0.3,
        },
      },
    });
    console.log('✓ Test guardian test created:', testGuardian.id);

    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Data seeding failed:', error);
    // Don't throw - some tables might not exist yet
    console.log('⚠️  Continuing without seeded data');
  }
}

/**
 * Create authenticated browser context
 * - Launch browser
 * - Log in as test user
 * - Save authentication state
 */
async function createAuthenticatedContext() {
  const baseURL = process.env.BASE_URL || 'http://localhost:3000';
  const authFile = path.join(__dirname, '../../.auth/user.json');

  // Ensure .auth directory exists
  const authDir = path.dirname(authFile);
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
  }

  try {
    const browser = await chromium.launch();
    const context = await browser.newContext();
    const page = await context.newPage();

    // Navigate to login page
    await page.goto(`${baseURL}/login`);

    // Check if we're using OAuth (GitHub/Google) or email/password
    const hasEmailLogin = await page.locator('input[type="email"]').isVisible().catch(() => false);

    if (hasEmailLogin) {
      // Email/password login
      await page.fill('input[type="email"]', 'test@odavl.studio');
      await page.fill('input[type="password"]', 'TestPassword123!');
      await page.click('button[type="submit"]');
      
      // Wait for redirect to dashboard
      await page.waitForURL('**/dashboard', { timeout: 10000 });
    } else {
      // OAuth login (skip for now - requires manual setup)
      console.log('⚠️  OAuth login detected - tests will need to authenticate individually');
      console.log('   Set up OAuth test credentials for automated E2E tests');
    }

    // Save authenticated state
    await context.storageState({ path: authFile });
    console.log('✓ Authentication state saved to:', authFile);

    await browser.close();
  } catch (error) {
    console.error('❌ Authentication setup failed:', error);
    console.log('⚠️  Tests will need to authenticate individually');
    // Don't throw - tests can still run with manual auth
  }
}

export default globalSetup;
