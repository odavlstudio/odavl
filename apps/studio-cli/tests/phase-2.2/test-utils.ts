/**
 * Phase 2.2 Task 8: Verification Test Utilities
 * 
 * Shared utilities for all verification tests
 */

import chalk from 'chalk';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as os from 'node:os';

/**
 * Test result type
 */
export interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  duration?: number;
}

/**
 * Test suite result
 */
export interface SuiteResult {
  suite: string;
  totalTests: number;
  passed: number;
  failed: number;
  results: TestResult[];
  duration: number;
}

/**
 * Create temporary workspace directory
 */
export async function createTempWorkspace(): Promise<string> {
  const tmpDir = path.join(os.tmpdir(), `odavl-test-${Date.now()}-${Math.random().toString(36).substring(7)}`);
  await fs.mkdir(tmpDir, { recursive: true });
  await fs.mkdir(path.join(tmpDir, '.odavl'), { recursive: true });
  return tmpDir;
}

/**
 * Clean up temporary workspace
 */
export async function cleanupTempWorkspace(workspaceDir: string): Promise<void> {
  try {
    await fs.rm(workspaceDir, { recursive: true, force: true });
  } catch (error) {
    // Ignore cleanup errors
  }
}

/**
 * Test assertion helper
 */
export function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

/**
 * Test equality helper
 */
export function assertEquals<T>(actual: T, expected: T, message?: string): void {
  if (actual !== expected) {
    const msg = message || `Expected ${expected}, got ${actual}`;
    throw new Error(`Assertion failed: ${msg}`);
  }
}

/**
 * Test array contains helper
 */
export function assertContains<T>(array: T[], item: T, message?: string): void {
  if (!array.includes(item)) {
    const msg = message || `Expected array to contain ${item}`;
    throw new Error(`Assertion failed: ${msg}`);
  }
}

/**
 * Test throws helper
 */
export async function assertThrows(fn: () => Promise<void> | void, message?: string): Promise<void> {
  try {
    await fn();
    throw new Error(`Assertion failed: Expected function to throw ${message || ''}`);
  } catch (error: any) {
    // Expected
  }
}

/**
 * Run a single test with error handling
 */
export async function runTest(name: string, testFn: () => Promise<void>): Promise<TestResult> {
  const startTime = Date.now();
  
  try {
    await testFn();
    const duration = Date.now() - startTime;
    
    console.log(chalk.green(`  ✓ ${name}`) + chalk.gray(` (${duration}ms)`));
    
    return {
      name,
      passed: true,
      duration,
    };
  } catch (error: any) {
    const duration = Date.now() - startTime;
    
    console.log(chalk.red(`  ✗ ${name}`) + chalk.gray(` (${duration}ms)`));
    console.log(chalk.red(`    ${error.message}`));
    
    return {
      name,
      passed: false,
      error: error.message,
      duration,
    };
  }
}

/**
 * Run a test suite
 */
export async function runSuite(
  suiteName: string,
  tests: Array<{ name: string; fn: () => Promise<void> }>
): Promise<SuiteResult> {
  console.log(chalk.cyan(`\n${suiteName}`));
  console.log(chalk.gray('─'.repeat(60)));
  
  const startTime = Date.now();
  const results: TestResult[] = [];
  
  for (const test of tests) {
    const result = await runTest(test.name, test.fn);
    results.push(result);
  }
  
  const duration = Date.now() - startTime;
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  
  console.log(chalk.gray('─'.repeat(60)));
  
  if (failed === 0) {
    console.log(chalk.green(`✓ All tests passed (${passed}/${results.length})`));
  } else {
    console.log(chalk.red(`✗ ${failed} test(s) failed (${passed}/${results.length} passed)`));
  }
  
  return {
    suite: suiteName,
    totalTests: results.length,
    passed,
    failed,
    results,
    duration,
  };
}

/**
 * Mock HTTP response builder
 */
export class MockResponse {
  constructor(
    public status: number,
    public body: any,
    public headers: Record<string, string> = {}
  ) {}

  async json(): Promise<any> {
    return this.body;
  }

  async text(): Promise<string> {
    return typeof this.body === 'string' ? this.body : JSON.stringify(this.body);
  }

  get ok(): boolean {
    return this.status >= 200 && this.status < 300;
  }
}

/**
 * Create mock fetch function
 */
export function createMockFetch(responses: Array<{ match: RegExp; response: MockResponse }>): typeof fetch {
  return async (url: string | URL, options?: any): Promise<Response> => {
    const urlStr = url.toString();
    
    for (const { match, response } of responses) {
      if (match.test(urlStr)) {
        return response as any;
      }
    }
    
    throw new Error(`No mock response found for URL: ${urlStr}`);
  };
}

/**
 * Wait for condition to be true
 */
export async function waitFor(
  condition: () => Promise<boolean> | boolean,
  timeoutMs: number = 5000,
  intervalMs: number = 100
): Promise<void> {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeoutMs) {
    if (await condition()) {
      return;
    }
    await new Promise(resolve => setTimeout(resolve, intervalMs));
  }
  
  throw new Error(`Timeout waiting for condition (${timeoutMs}ms)`);
}

/**
 * File exists helper
 */
export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Read JSON file helper
 */
export async function readJsonFile<T = any>(filePath: string): Promise<T> {
  const content = await fs.readFile(filePath, 'utf-8');
  return JSON.parse(content);
}

/**
 * Write JSON file helper
 */
export async function writeJsonFile(filePath: string, data: any): Promise<void> {
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

/**
 * Print summary of all suite results
 */
export function printSummary(suiteResults: SuiteResult[]): void {
  console.log(chalk.cyan('\n\n📊 Verification Summary'));
  console.log(chalk.gray('═'.repeat(60)));
  
  const totalTests = suiteResults.reduce((sum, s) => sum + s.totalTests, 0);
  const totalPassed = suiteResults.reduce((sum, s) => sum + s.passed, 0);
  const totalFailed = suiteResults.reduce((sum, s) => sum + s.failed, 0);
  const totalDuration = suiteResults.reduce((sum, s) => sum + s.duration, 0);
  
  for (const suite of suiteResults) {
    const icon = suite.failed === 0 ? chalk.green('✓') : chalk.red('✗');
    const status = suite.failed === 0 
      ? chalk.green(`${suite.passed}/${suite.totalTests}`)
      : chalk.red(`${suite.passed}/${suite.totalTests} (${suite.failed} failed)`);
    
    console.log(`${icon} ${suite.suite}: ${status}`);
  }
  
  console.log(chalk.gray('─'.repeat(60)));
  console.log(chalk.bold(`Total: ${totalPassed}/${totalTests} tests passed`));
  console.log(chalk.gray(`Duration: ${totalDuration}ms`));
  
  if (totalFailed > 0) {
    console.log(chalk.red(`\n✗ ${totalFailed} test(s) failed`));
    process.exit(1);
  } else {
    console.log(chalk.green('\n✓ All tests passed!'));
    process.exit(0);
  }
}
