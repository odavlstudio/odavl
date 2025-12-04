import { TestOrchestrator } from '@odavl-studio/guardian-core';

export interface ScheduledTest {
  id: string;
  url: string;
  schedule: string; // cron expression
  enabled: boolean;
  lastRun?: Date;
  nextRun?: Date;
}

export interface TestResult {
  id: string;
  testId: string;
  url: string;
  timestamp: Date;
  status: 'passed' | 'failed';
  duration: number;
  metrics: {
    totalIssues: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  issues: any[];
}

export class ScheduledTestRunner {
  private orchestrator: typeof TestOrchestrator.prototype;
  private scheduledTests: Map<string, ScheduledTest>;
  private results: Map<string, TestResult[]>;

  constructor() {
    this.orchestrator = new TestOrchestrator();
    this.scheduledTests = new Map();
    this.results = new Map();
  }

  /**
   * Add a scheduled test
   */
  addTest(test: ScheduledTest): void {
    this.scheduledTests.set(test.id, test);
  }

  /**
   * Remove a scheduled test
   */
  removeTest(testId: string): void {
    this.scheduledTests.delete(testId);
  }

  /**
   * Run a test immediately
   */
  async runTest(testId: string): Promise<TestResult> {
    const test = this.scheduledTests.get(testId);
    if (!test) {
      throw new Error(`Test ${testId} not found`);
    }

    console.log(`Running test: ${test.url}`);

    const report = await this.orchestrator.runTests({
      url: test.url,
      browserType: 'chromium',
      headless: true,
      timeout: 30000
    });

    const result: TestResult = {
      id: `${testId}-${Date.now()}`,
      testId,
      url: test.url,
      timestamp: new Date(),
      status: (report.status === 'passed' || report.status === 'failed') ? report.status : 'failed',
      duration: report.duration,
      metrics: report.metrics,
      issues: report.issues
    };

    // Store result
    if (!this.results.has(testId)) {
      this.results.set(testId, []);
    }
    this.results.get(testId)!.push(result);

    // Update last run
    test.lastRun = new Date();
    this.scheduledTests.set(testId, test);

    return result;
  }

  /**
   * Get test results
   */
  getResults(testId: string, limit: number = 10): TestResult[] {
    const results = this.results.get(testId) || [];
    return results.slice(-limit);
  }

  /**
   * Get all scheduled tests
   */
  getTests(): ScheduledTest[] {
    return Array.from(this.scheduledTests.values());
  }

  /**
   * Get test by ID
   */
  getTest(testId: string): ScheduledTest | undefined {
    return this.scheduledTests.get(testId);
  }

  /**
   * Enable/disable test
   */
  toggleTest(testId: string, enabled: boolean): void {
    const test = this.scheduledTests.get(testId);
    if (test) {
      test.enabled = enabled;
      this.scheduledTests.set(testId, test);
    }
  }

  /**
   * Get statistics
   */
  getStats(testId: string): {
    totalRuns: number;
    passedRuns: number;
    failedRuns: number;
    avgDuration: number;
    avgIssues: number;
  } {
    const results = this.results.get(testId) || [];
    
    if (results.length === 0) {
      return {
        totalRuns: 0,
        passedRuns: 0,
        failedRuns: 0,
        avgDuration: 0,
        avgIssues: 0
      };
    }

    const passedRuns = results.filter(r => r.status === 'passed').length;
    const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);
    const totalIssues = results.reduce((sum, r) => sum + r.metrics.totalIssues, 0);

    return {
      totalRuns: results.length,
      passedRuns,
      failedRuns: results.length - passedRuns,
      avgDuration: totalDuration / results.length,
      avgIssues: totalIssues / results.length
    };
  }
}
