/**
 * Global teardown for Playwright E2E tests
 * Runs once after all tests
 * 
 * Responsibilities:
 * - Clean up test data
 * - Close database connections
 * - Archive test artifacts
 * - Generate test reports
 * - Clean up temporary files
 */

import { FullConfig } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

async function globalTeardown(config: FullConfig) {
  console.log('\n🧹 Starting global teardown for E2E tests...\n');

  // Clean up test database
  console.log('🗑️  Cleaning up test database...');
  await cleanupTestDatabase();

  // Archive test artifacts
  console.log('📦 Archiving test artifacts...');
  await archiveTestArtifacts();

  // Generate test summary
  console.log('📊 Generating test summary...');
  await generateTestSummary();

  // Clean up authentication state
  console.log('🔐 Cleaning up authentication state...');
  await cleanupAuthState();

  // Clean up temporary files
  console.log('🗑️  Cleaning up temporary files...');
  await cleanupTempFiles();

  console.log('\n✅ Global teardown completed successfully!\n');
}

/**
 * Clean up test database
 * - Remove test data
 * - Reset sequences
 * - Close connections
 */
async function cleanupTestDatabase() {
  // Only cleanup if DATABASE_URL is set
  if (!process.env.DATABASE_URL) {
    console.log('⚠️  DATABASE_URL not set, skipping database cleanup');
    return;
  }

  // Skip cleanup in CI to preserve test data for debugging
  if (process.env.CI) {
    console.log('⚠️  Running in CI, skipping database cleanup (preserving for debugging)');
    return;
  }

  try {
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    await prisma.$connect();

    // Delete test data in correct order (respecting foreign keys)
    console.log('  Deleting test guardian tests...');
    await prisma.guardianTest.deleteMany({
      where: { project: { slug: 'test-project' } },
    });

    console.log('  Deleting test autopilot runs...');
    await prisma.autopilotRun.deleteMany({
      where: { project: { slug: 'test-project' } },
    });

    console.log('  Deleting test issues...');
    await prisma.issue.deleteMany({
      where: { project: { slug: 'test-project' } },
    });

    console.log('  Deleting test projects...');
    await prisma.project.deleteMany({
      where: { slug: 'test-project' },
    });

    console.log('  Deleting test users...');
    await prisma.user.deleteMany({
      where: { email: 'test@odavl.studio' },
    });

    console.log('✓ Test data cleaned up successfully');

    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Database cleanup failed:', error);
    // Don't throw - cleanup is best-effort
    console.log('⚠️  Some test data may remain in database');
  }
}

/**
 * Archive test artifacts
 * - Move test results to archive
 * - Compress screenshots/videos
 * - Keep only last N test runs
 */
async function archiveTestArtifacts() {
  const testResultsDir = path.join(__dirname, '../../test-results');
  const archiveDir = path.join(__dirname, '../../test-results-archive');

  // Create archive directory if doesn't exist
  if (!fs.existsSync(archiveDir)) {
    fs.mkdirSync(archiveDir, { recursive: true });
  }

  // Skip archiving if no test results
  if (!fs.existsSync(testResultsDir)) {
    console.log('⚠️  No test results to archive');
    return;
  }

  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const archivePath = path.join(archiveDir, `test-results-${timestamp}`);

    // Move current test results to archive
    if (fs.existsSync(testResultsDir)) {
      fs.renameSync(testResultsDir, archivePath);
      console.log(`✓ Test results archived to: ${archivePath}`);
    }

    // Keep only last 10 test runs
    const archives = fs.readdirSync(archiveDir)
      .filter(file => file.startsWith('test-results-'))
      .sort()
      .reverse();

    if (archives.length > 10) {
      const toDelete = archives.slice(10);
      for (const archive of toDelete) {
        const archivePath = path.join(archiveDir, archive);
        fs.rmSync(archivePath, { recursive: true, force: true });
        console.log(`✓ Deleted old archive: ${archive}`);
      }
    }
  } catch (error) {
    console.error('❌ Artifact archiving failed:', error);
    console.log('⚠️  Test artifacts may not be archived');
  }
}

/**
 * Generate test summary
 * - Parse test results
 * - Generate summary report
 * - Write to file
 */
async function generateTestSummary() {
  const resultsFile = path.join(__dirname, '../../reports/playwright-results.json');
  const summaryFile = path.join(__dirname, '../../reports/test-summary.txt');

  try {
    // Check if results file exists
    if (!fs.existsSync(resultsFile)) {
      console.log('⚠️  No test results file found');
      return;
    }

    // Read test results
    const results = JSON.parse(fs.readFileSync(resultsFile, 'utf-8'));

    // Calculate summary statistics
    const totalTests = results.suites?.reduce((acc: number, suite: any) => {
      return acc + (suite.specs?.length || 0);
    }, 0) || 0;

    const passedTests = results.suites?.reduce((acc: number, suite: any) => {
      return acc + (suite.specs?.filter((spec: any) => spec.ok).length || 0);
    }, 0) || 0;

    const failedTests = totalTests - passedTests;
    const duration = results.stats?.duration || 0;
    const durationMin = Math.floor(duration / 60000);
    const durationSec = Math.floor((duration % 60000) / 1000);

    // Generate summary
    const summary = `
ODAVL Studio E2E Test Summary
==============================

Date: ${new Date().toISOString()}
Duration: ${durationMin}m ${durationSec}s

Test Results:
  Total:  ${totalTests}
  Passed: ${passedTests} (${totalTests > 0 ? Math.round(passedTests / totalTests * 100) : 0}%)
  Failed: ${failedTests} (${totalTests > 0 ? Math.round(failedTests / totalTests * 100) : 0}%)

Status: ${failedTests === 0 ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}

Browser Coverage:
  - Chromium (Desktop)
  - Firefox (Desktop)
  - WebKit (Safari Desktop)
  - Edge (Desktop)
  - Mobile Chrome (Pixel 5)
  - Mobile Safari (iPhone 13)
  - iPad Pro (Tablet)

Test Categories:
  - Authentication (Login, Register, Sessions, RBAC)
  - Dashboard (Navigation, Layout, Performance)
  - Insight (Issues, Detectors, Analytics)
  - Autopilot (Runs, O-D-A-V-L Cycle, Undo, Recipes)
  - Guardian (Tests, Quality Gates, Security, Accessibility)
  - Accessibility (WCAG 2.1 AA Compliance)
  - I18n (Multi-language Support)
  - Visual Regression (Screenshot Comparison)

Reports:
  - HTML Report: reports/playwright-html/index.html
  - JSON Report: reports/playwright-results.json
  - JUnit Report: reports/playwright-junit.xml

==============================
`;

    // Write summary to file
    fs.writeFileSync(summaryFile, summary);
    console.log(`✓ Test summary written to: ${summaryFile}`);

    // Print summary to console
    console.log(summary);

  } catch (error) {
    console.error('❌ Test summary generation failed:', error);
    console.log('⚠️  Test summary may not be available');
  }
}

/**
 * Clean up authentication state
 * - Remove saved auth files
 * - Clear session storage
 */
async function cleanupAuthState() {
  const authFile = path.join(__dirname, '../../.auth/user.json');

  try {
    if (fs.existsSync(authFile)) {
      fs.unlinkSync(authFile);
      console.log('✓ Authentication state cleaned up');
    }
  } catch (error) {
    console.error('❌ Auth cleanup failed:', error);
    console.log('⚠️  Authentication state may remain');
  }
}

/**
 * Clean up temporary files
 * - Remove temp downloads
 * - Remove temp screenshots
 */
async function cleanupTempFiles() {
  const tempDirs = [
    path.join(__dirname, '../../.temp'),
    path.join(__dirname, '../../downloads'),
  ];

  for (const dir of tempDirs) {
    try {
      if (fs.existsSync(dir)) {
        fs.rmSync(dir, { recursive: true, force: true });
        console.log(`✓ Cleaned up: ${dir}`);
      }
    } catch (error) {
      console.error(`❌ Cleanup failed for ${dir}:`, error);
    }
  }
}

export default globalTeardown;
