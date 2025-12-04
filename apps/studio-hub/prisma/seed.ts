// Database Seed Script
// Week 1: Test data for development

import { PrismaClient, Organization, User, Project } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Create or update demo organization
 */
async function createOrganization(): Promise<Organization> {
  const org = await prisma.organization.upsert({
    where: { slug: 'demo-org' },
    update: {},
    create: {
      name: 'Demo Organization',
      slug: 'demo-org',
      plan: 'PRO',
    },
  });

  console.log('✅ Created organization:', org.name);
  return org;
}

/**
 * Create or update demo user
 */
async function createUser(orgId: string): Promise<User> {
  const user = await prisma.user.upsert({
    where: { email: 'demo@odavl.studio' },
    update: {},
    create: {
      email: 'demo@odavl.studio',
      name: 'Demo User',
      role: 'OWNER',
      orgId,
    },
  });

  console.log('✅ Created user:', user.email);
  return user;
}

/**
 * Create demo project
 */
async function createProject(orgId: string): Promise<Project> {
  const project = await prisma.project.create({
    data: {
      name: 'Demo Project',
      slug: 'demo-project',
      description: 'A sample project for testing ODAVL Studio',
      orgId,
    },
  });

  console.log('✅ Created project:', project.name);
  return project;
}

/**
 * Create sample Insight run with test issues
 */
async function createInsightRun(projectId: string): Promise<void> {
  await prisma.insightRun.create({
    data: {
      projectId,
      totalIssues: 42,
      criticalIssues: 3,
      highIssues: 8,
      mediumIssues: 15,
      lowIssues: 16,
      duration: 12450,
      filesScanned: 127,
      issues: {
        create: [
          {
            projectId,
            severity: 'CRITICAL',
            message: 'Hardcoded API key detected in source code',
            detector: 'security',
            filePath: 'src/config.ts',
            line: 12,
            column: 15,
          },
          {
            projectId,
            severity: 'HIGH',
            message: 'Unused variable "oldData" detected',
            detector: 'typescript',
            filePath: 'src/utils/parser.ts',
            line: 45,
            column: 7,
          },
          {
            projectId,
            severity: 'MEDIUM',
            message: 'Circular dependency detected',
            detector: 'circular',
            filePath: 'src/models/user.ts',
            line: 1,
          },
        ],
      },
    },
  });

  console.log('✅ Created Insight run with sample issues');
}

/**
 * Create sample Autopilot run
 */
async function createAutopilotRun(projectId: string): Promise<void> {
  await prisma.autopilotRun.create({
    data: {
      projectId,
      runId: `run-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      status: 'COMPLETED',
      observeDuration: 2341,
      decideDuration: 456,
      actDuration: 3210,
      verifyDuration: 1876,
      learnDuration: 234,
      totalDuration: 8117,
      filesModified: 5,
      linesChanged: 42,
      recipesApplied: ['remove-unused-imports', 'fix-eslint-errors'],
    },
  });

  console.log('✅ Created Autopilot run');
}

/**
 * Create sample Guardian test
 */
async function createGuardianTest(projectId: string): Promise<void> {
  await prisma.guardianTest.create({
    data: {
      projectId,
      testRunId: `test-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      url: 'https://demo.odavl.studio',
      environment: 'production',
      status: 'passed',
      passed: 47, // Number of passed tests
      failed: 3,  // Number of failed tests
      score: 94,
      ttfb: 180,
      lcp: 2200,
      fid: 45,
      cls: 0.08,
    },
  });

  console.log('✅ Created Guardian test');
}

async function main() {
  console.log('🌱 Seeding database...');

  const org = await createOrganization();
  const user = await createUser(org.id);
  const project = await createProject(org.id);

  await createInsightRun(project.id);
  await createAutopilotRun(project.id);
  await createGuardianTest(project.id);

  console.log('🎉 Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
