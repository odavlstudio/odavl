/**
 * Prisma Seed Script for ODAVL Insight Cloud
 * Populates database with demo data for development/testing
 */

import { PrismaClient } from '@prisma/client';
import type { Project, ErrorSignature } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Clean all existing data from database
 */
async function cleanDatabase(): Promise<void> {
  await prisma.errorInstance.deleteMany();
  await prisma.fixRecommendation.deleteMany();
  await prisma.errorSignature.deleteMany();
  await prisma.project.deleteMany();
  await prisma.betaSignup.deleteMany();
  await prisma.guardianTest.deleteMany();
  await prisma.errorLog.deleteMany();
  await prisma.report.deleteMany();
}

/**
 * Seed sample projects
 */
async function seedProjects(): Promise<[Project, Project]> {
  const [project1, project2] = await Promise.all([
    prisma.project.create({ data: { name: 'odavl-studio' } }),
    prisma.project.create({ data: { name: 'example-app' } }),
  ]);

  console.log('✅ Created 2 projects');
  return [project1, project2];
}

/**
 * Seed error signatures
 */
async function seedErrorSignatures(): Promise<ErrorSignature[]> {
  const errorSigs = await Promise.all([
    prisma.errorSignature.create({
      data: {
        signature: 'typescript:2304:cannot-find-name',
        type: 'typescript',
        totalHits: 45,
      },
    }),
    prisma.errorSignature.create({
      data: {
        signature: 'eslint:no-unused-vars',
        type: 'eslint',
        totalHits: 32,
      },
    }),
    prisma.errorSignature.create({
      data: {
        signature: 'import:circular-dependency',
        type: 'import',
        totalHits: 18,
      },
    }),
    prisma.errorSignature.create({
      data: {
        signature: 'security:hardcoded-credentials',
        type: 'security',
        totalHits: 8,
      },
    }),
    prisma.errorSignature.create({
      data: {
        signature: 'performance:sync-fs-read',
        type: 'performance',
        totalHits: 12,
      },
    }),
  ]);

  console.log('✅ Created 5 error signatures');
  return errorSigs;
}

/**
 * Seed error instances
 */
async function seedErrorInstances(
  project1: Project,
  project2: Project,
  errorSigs: ErrorSignature[]
): Promise<void> {
  await Promise.all([
    prisma.errorInstance.create({
      data: {
        signatureId: errorSigs[0].id,
        projectId: project1.id,
        shortMessage: 'Cannot find name "BetaSignup"',
      },
    }),
    prisma.errorInstance.create({
      data: {
        signatureId: errorSigs[1].id,
        projectId: project1.id,
        shortMessage: "'result' is declared but never used",
      },
    }),
    prisma.errorInstance.create({
      data: {
        signatureId: errorSigs[2].id,
        projectId: project1.id,
        shortMessage: 'Circular dependency detected: auth.ts -> user.ts -> auth.ts',
      },
    }),
    prisma.errorInstance.create({
      data: {
        signatureId: errorSigs[3].id,
        projectId: project2.id,
        shortMessage: 'API key hardcoded in source code',
      },
    }),
    prisma.errorInstance.create({
      data: {
        signatureId: errorSigs[4].id,
        projectId: project2.id,
        shortMessage: 'Synchronous fs.readFileSync() in hot path',
      },
    }),
  ]);

  console.log('✅ Created 5 error instances');
}

/**
 * Seed fix recommendations
 */
async function seedFixRecommendations(errorSigs: ErrorSignature[]): Promise<void> {
  await Promise.all([
    prisma.fixRecommendation.create({
      data: {
        signatureId: errorSigs[0].id,
        hint: 'Import the missing type or interface from the correct module',
        confidence: 0.85,
        source: 'ml-model',
        successCount: 42,
        failCount: 3,
      },
    }),
    prisma.fixRecommendation.create({
      data: {
        signatureId: errorSigs[1].id,
        hint: 'Remove unused variable or prefix with underscore (_result) if intentionally unused',
        confidence: 0.92,
        source: 'eslint',
        successCount: 28,
        failCount: 2,
      },
    }),
    prisma.fixRecommendation.create({
      data: {
        signatureId: errorSigs[2].id,
        hint: 'Refactor to break circular dependency: extract shared types to separate file',
        confidence: 0.78,
        source: 'collective-intelligence',
        successCount: 15,
        failCount: 3,
      },
    }),
    prisma.fixRecommendation.create({
      data: {
        signatureId: errorSigs[3].id,
        hint: 'Move credentials to environment variables (process.env.API_KEY)',
        confidence: 0.95,
        source: 'security-scanner',
        successCount: 8,
        failCount: 0,
      },
    }),
    prisma.fixRecommendation.create({
      data: {
        signatureId: errorSigs[4].id,
        hint: 'Replace with async fs.promises.readFile() or cache the result',
        confidence: 0.88,
        source: 'performance-analyzer',
        successCount: 10,
        failCount: 2,
      },
    }),
  ]);

  console.log('✅ Created 5 fix recommendations');
}

/**
 * Seed beta signups
 */
async function seedBetaSignups(): Promise<void> {
  await Promise.all([
    prisma.betaSignup.create({
      data: {
        email: 'john@example.com',
        name: 'John Developer',
        company: 'Tech Startup Inc',
        useCase: 'Need to reduce bugs in production',
      },
    }),
    prisma.betaSignup.create({
      data: {
        email: 'sarah@bigcorp.com',
        name: 'Sarah Lead',
        company: 'BigCorp',
        useCase: 'Automate code reviews for team of 50 developers',
      },
    }),
    prisma.betaSignup.create({
      data: {
        email: 'mike@freelance.io',
        name: 'Mike Freelancer',
      },
    }),
  ]);

  console.log('✅ Created 3 beta signups');
}

/**
 * Seed Guardian test results
 */
async function seedGuardianTests(): Promise<void> {
  await prisma.guardianTest.create({
    data: {
      url: 'https://example.com',
      duration: 4523,
      overallScore: 0.85,
      passed: true,
      accessibilityScore: 0.92,
      accessibilityViolations: 2,
      accessibilityPasses: 48,
      performanceScore: 0.78,
      performanceFcp: 1.2,
      performanceLcp: 2.4,
      seoScore: 0.88,
      seoIssues: 3,
      securityScore: 0.91,
      securityIssues: 1,
    },
  });

  console.log('✅ Created 1 Guardian test result');
}

/**
 * Seed reports
 */
async function seedReports(): Promise<void> {
  await Promise.all([
    prisma.report.create({
      data: {
        project: 'odavl-studio',
        summary: JSON.stringify({
          totalErrors: 45,
          criticalErrors: 8,
          fixedErrors: 12,
        }),
        metrics: JSON.stringify({
          codeQuality: 0.82,
          testCoverage: 0.76,
          buildTime: 32.5,
        }),
      },
    }),
    prisma.report.create({
      data: {
        project: 'example-app',
        summary: JSON.stringify({
          totalErrors: 18,
          criticalErrors: 2,
          fixedErrors: 5,
        }),
        metrics: JSON.stringify({
          codeQuality: 0.91,
          testCoverage: 0.88,
          buildTime: 12.3,
        }),
      },
    }),
  ]);

  console.log('✅ Created 2 reports');
}

/**
 * Main seeding orchestrator
 */
async function main() {
  console.log('🌱 Seeding database...');

  await cleanDatabase();
  const [project1, project2] = await seedProjects();
  const errorSigs = await seedErrorSignatures();
  await seedErrorInstances(project1, project2, errorSigs);
  await seedFixRecommendations(errorSigs);
  await seedBetaSignups();
  await seedGuardianTests();
  await seedReports();

  console.log('\n🎉 Database seeded successfully!');
  console.log('\n📊 Summary:');
  console.log('   - 2 projects');
  console.log('   - 5 error signatures');
  console.log('   - 5 error instances');
  console.log('   - 5 fix recommendations');
  console.log('   - 3 beta signups');
  console.log('   - 1 guardian test');
  console.log('   - 2 reports');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
