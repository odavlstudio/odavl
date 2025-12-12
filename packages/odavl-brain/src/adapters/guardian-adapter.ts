/**
 * ODAVL Brain - Guardian Adapter
 * Runs ODAVL Guardian verification and returns test results
 */

import { Logger } from '../utils/logger.js';
import type { GuardianReport, GuardianTestResult } from '../types.js';
import { execSync } from 'child_process';
import * as fs from 'fs/promises';
import * as path from 'path';

const logger = new Logger('GuardianAdapter');

/**
 * Run ODAVL Guardian verification
 */
export async function runGuardian(projectRoot: string): Promise<GuardianReport> {
  const startTime = Date.now();
  logger.section('ODAVL GUARDIAN - Verification Starting');
  logger.info(`Project: ${projectRoot}`);

  const tests: GuardianTestResult[] = [];
  const recommendations: string[] = [];

  // Change to project directory
  const originalCwd = process.cwd();
  process.chdir(projectRoot);

  try {
    // Test 1: Build Check
    logger.info('Running build test...');
    const buildTest = await runTest('Build', 'pnpm build');
    tests.push(buildTest);

    // Test 2: TypeScript Check
    logger.info('Running typecheck...');
    const typecheckTest = await runTest('TypeScript', 'pnpm typecheck');
    tests.push(typecheckTest);

    // Test 3: Lint Check
    logger.info('Running lint check...');
    const lintTest = await runTest('Lint', 'pnpm lint');
    tests.push(lintTest);

    // Test 4: Unit Tests
    logger.info('Running unit tests...');
    const unitTest = await runTest('Unit Tests', 'pnpm test');
    tests.push(unitTest);

    // Test 5: Prisma Validation (if exists)
    const prismaSchemaPath = path.join(projectRoot, 'prisma/schema.prisma');
    try {
      await fs.access(prismaSchemaPath);
      logger.info('Running Prisma validation...');
      const prismaTest = await runTest('Prisma', 'pnpm prisma validate');
      tests.push(prismaTest);
    } catch {
      logger.debug('Prisma schema not found, skipping');
    }

    // Test 6: Migration Check (if Prisma exists)
    try {
      await fs.access(prismaSchemaPath);
      logger.info('Checking migrations...');
      const migrationTest = await runTest(
        'Migrations',
        'pnpm prisma migrate status'
      );
      tests.push(migrationTest);
    } catch {
      logger.debug('Prisma migrations not found, skipping');
    }

    // Test 7: Extension Tests (if exists)
    const extensionPath = path.join(projectRoot, 'odavl-studio');
    try {
      await fs.access(extensionPath);
      logger.info('Running extension tests...');
      const extensionTest = await runTest('Extensions', 'pnpm extensions:test');
      tests.push(extensionTest);
    } catch {
      logger.debug('Extensions not found, skipping');
    }

    // Test 8: Cloud Console Check (if exists)
    const consolePath = path.join(projectRoot, 'apps/cloud-console');
    try {
      await fs.access(consolePath);
      logger.info('Checking cloud console...');
      const consoleTest = await runTest(
        'Cloud Console',
        'cd apps/cloud-console && pnpm typecheck'
      );
      tests.push(consoleTest);
    } catch {
      logger.debug('Cloud console not found, skipping');
    }

  } catch (error) {
    logger.error('Guardian execution failed', error as Error);
  } finally {
    // Restore original directory
    process.chdir(originalCwd);
  }

  // Calculate statistics
  const totalTests = tests.length;
  const passedTests = tests.filter(t => t.status === 'passed').length;
  const failedTests = tests.filter(t => t.status === 'failed').length;
  const skippedTests = tests.filter(t => t.status === 'skipped').length;

  // Determine launch readiness
  const launchReady = failedTests === 0 && passedTests > 0;

  // Generate recommendations
  if (!launchReady) {
    recommendations.push('Fix all failing tests before deployment');
    
    const failedTestNames = tests
      .filter(t => t.status === 'failed')
      .map(t => t.name);
    
    if (failedTestNames.length > 0) {
      recommendations.push(`Failed tests: ${failedTestNames.join(', ')}`);
    }
  }

  if (passedTests / totalTests < 0.8) {
    recommendations.push('Consider adding more test coverage');
  }

  const duration = Date.now() - startTime;

  const report: GuardianReport = {
    timestamp: new Date().toISOString(),
    projectRoot,
    tests,
    totalTests,
    passedTests,
    failedTests,
    skippedTests,
    launchReady,
    duration,
    recommendations,
  };

  logger.section('ODAVL GUARDIAN - Verification Complete');
  logger.info(`Total tests: ${totalTests}`);
  logger.success(`Passed: ${passedTests}`);
  
  if (failedTests > 0) {
    logger.error(`Failed: ${failedTests}`);
  }
  
  if (skippedTests > 0) {
    logger.warn(`Skipped: ${skippedTests}`);
  }
  
  logger.info(`Launch ready: ${launchReady ? '✅ YES' : '❌ NO'}`);
  logger.info(`Duration: ${duration}ms`);

  return report;
}

/**
 * Run a single test and return result
 */
async function runTest(
  name: string,
  command: string
): Promise<GuardianTestResult> {
  const startTime = Date.now();
  
  try {
    execSync(command, {
      encoding: 'utf-8',
      stdio: 'pipe',
      timeout: 300000, // 5 min timeout
    });
    
    const duration = Date.now() - startTime;
    
    return {
      name,
      status: 'passed',
      duration,
    };
  } catch (error: any) {
    const duration = Date.now() - startTime;
    
    return {
      name,
      status: 'failed',
      message: error.stderr || error.message,
      duration,
    };
  }
}
