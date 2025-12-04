import cron from 'node-cron';
import Database from 'better-sqlite3';
import { TestOrchestrator } from '@odavl-studio/guardian-core';
import type { TestResult } from '@odavl-studio/guardian-core';
import { logger } from './logger.js';
import { TrendAnalyzer } from './trend-analyzer.js';
import { AlertManager, type AlertConfig } from './alert-manager.js';

interface ScheduledTest {
  id: string;
  name: string;
  url: string;
  schedule: string; // cron pattern
  enabled: boolean;
  lastRun?: Date;
  nextRun?: Date;
  detectors?: string[];
}

interface TestExecution {
  testId: string;
  startedAt: Date;
  completedAt?: Date;
  status: 'running' | 'completed' | 'failed';
  result?: TestResult;
  error?: string;
}

export class GuardianScheduler {
  private db: Database.Database;
  private orchestrator: TestOrchestrator;
  private trendAnalyzer: TrendAnalyzer;
  private alertManager: AlertManager;
  private scheduledJobs: Map<string, cron.ScheduledTask> = new Map();
  private dbPath: string;

  constructor(dbPath: string = './guardian-data.db', alertConfig?: AlertConfig) {
    this.dbPath = dbPath;
    this.db = new Database(dbPath);
    this.orchestrator = new TestOrchestrator();
    this.trendAnalyzer = new TrendAnalyzer(dbPath);
    this.alertManager = new AlertManager(dbPath, alertConfig);
    this.initDatabase();
  }

  private initDatabase(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS scheduled_tests (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        url TEXT NOT NULL,
        schedule TEXT NOT NULL,
        enabled INTEGER DEFAULT 1,
        last_run TEXT,
        next_run TEXT,
        detectors TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    this.db.exec(`
      CREATE TABLE IF NOT EXISTS test_executions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        test_id TEXT NOT NULL,
        started_at TEXT NOT NULL,
        completed_at TEXT,
        status TEXT NOT NULL,
        result TEXT,
        error TEXT,
        FOREIGN KEY (test_id) REFERENCES scheduled_tests(id)
      )
    `);

    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_test_executions_test_id 
      ON test_executions(test_id)
    `);

    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_test_executions_started_at 
      ON test_executions(started_at DESC)
    `);
  }

  /**
   * Create a new scheduled test
   */
  createTest(test: Omit<ScheduledTest, 'id' | 'lastRun' | 'nextRun'>): string {
    const id = `test-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    
    if (!cron.validate(test.schedule)) {
      throw new Error(`Invalid cron pattern: ${test.schedule}`);
    }

    const stmt = this.db.prepare(`
      INSERT INTO scheduled_tests (id, name, url, schedule, enabled, detectors)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      test.name,
      test.url,
      test.schedule,
      test.enabled ? 1 : 0,
      test.detectors ? JSON.stringify(test.detectors) : null
    );

    if (test.enabled) {
      this.scheduleTest(id);
    }

    logger.info(`Created scheduled test: ${id} (${test.name})`);
    return id;
  }

  /**
   * Get a scheduled test by ID
   */
  getTest(id: string): ScheduledTest | null {
    const stmt = this.db.prepare('SELECT * FROM scheduled_tests WHERE id = ?');
    const row = stmt.get(id) as any;

    if (!row) return null;

    return {
      id: row.id,
      name: row.name,
      url: row.url,
      schedule: row.schedule,
      enabled: row.enabled === 1,
      lastRun: row.last_run ? new Date(row.last_run) : undefined,
      nextRun: row.next_run ? new Date(row.next_run) : undefined,
      detectors: row.detectors ? JSON.parse(row.detectors) : undefined
    };
  }

  /**
   * List all scheduled tests
   */
  listTests(): ScheduledTest[] {
    const stmt = this.db.prepare('SELECT * FROM scheduled_tests ORDER BY created_at DESC');
    const rows = stmt.all() as any[];

    return rows.map(row => ({
      id: row.id,
      name: row.name,
      url: row.url,
      schedule: row.schedule,
      enabled: row.enabled === 1,
      lastRun: row.last_run ? new Date(row.last_run) : undefined,
      nextRun: row.next_run ? new Date(row.next_run) : undefined,
      detectors: row.detectors ? JSON.parse(row.detectors) : undefined
    }));
  }

  /**
   * Update a scheduled test
   */
  updateTest(id: string, updates: Partial<ScheduledTest>): void {
    const test = this.getTest(id);
    if (!test) throw new Error(`Test not found: ${id}`);

    const fields: string[] = [];
    const values: any[] = [];

    if (updates.name !== undefined) {
      fields.push('name = ?');
      values.push(updates.name);
    }
    if (updates.url !== undefined) {
      fields.push('url = ?');
      values.push(updates.url);
    }
    if (updates.schedule !== undefined) {
      if (!cron.validate(updates.schedule)) {
        throw new Error(`Invalid cron pattern: ${updates.schedule}`);
      }
      fields.push('schedule = ?');
      values.push(updates.schedule);
    }
    if (updates.enabled !== undefined) {
      fields.push('enabled = ?');
      values.push(updates.enabled ? 1 : 0);
    }
    if (updates.detectors !== undefined) {
      fields.push('detectors = ?');
      values.push(JSON.stringify(updates.detectors));
    }

    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    const stmt = this.db.prepare(`
      UPDATE scheduled_tests 
      SET ${fields.join(', ')} 
      WHERE id = ?
    `);
    stmt.run(...values);

    // Reschedule if schedule or enabled changed
    if (updates.schedule !== undefined || updates.enabled !== undefined) {
      this.unscheduleTest(id);
      const updatedTest = this.getTest(id);
      if (updatedTest?.enabled) {
        this.scheduleTest(id);
      }
    }

    logger.info(`Updated scheduled test: ${id}`);
  }

  /**
   * Delete a scheduled test
   */
  deleteTest(id: string): void {
    this.unscheduleTest(id);
    const stmt = this.db.prepare('DELETE FROM scheduled_tests WHERE id = ?');
    stmt.run(id);
    logger.info(`Deleted scheduled test: ${id}`);
  }

  /**
   * Schedule a test using cron
   */
  private scheduleTest(id: string): void {
    const test = this.getTest(id);
    if (!test || !test.enabled) return;

    const job = cron.schedule(test.schedule, async () => {
      await this.executeTest(id);
    });

    this.scheduledJobs.set(id, job);
    logger.info(`Scheduled test: ${id} with pattern: ${test.schedule}`);
  }

  /**
   * Unschedule a test
   */
  private unscheduleTest(id: string): void {
    const job = this.scheduledJobs.get(id);
    if (job) {
      job.stop();
      this.scheduledJobs.delete(id);
      logger.info(`Unscheduled test: ${id}`);
    }
  }

  /**
   * Execute a test immediately
   */
  async executeTest(testId: string): Promise<TestResult> {
    const test = this.getTest(testId);
    if (!test) throw new Error(`Test not found: ${testId}`);

    const startedAt = new Date();
    const execution: TestExecution = {
      testId,
      startedAt,
      status: 'running'
    };

    // Record execution start
    const insertStmt = this.db.prepare(`
      INSERT INTO test_executions (test_id, started_at, status)
      VALUES (?, ?, ?)
    `);
    const result = insertStmt.run(testId, startedAt.toISOString(), 'running');
    const executionId = result.lastInsertRowid;

    logger.info(`Executing test: ${testId} (${test.name}) on ${test.url}`);

    try {
      const testResult = await this.orchestrator.runTests({
        url: test.url
      });

      const completedAt = new Date();
      execution.completedAt = completedAt;
      execution.status = 'completed';
      execution.result = testResult;

      // Update execution record
      const updateStmt = this.db.prepare(`
        UPDATE test_executions 
        SET completed_at = ?, status = ?, result = ?
        WHERE id = ?
      `);
      updateStmt.run(
        completedAt.toISOString(),
        'completed',
        JSON.stringify(testResult),
        executionId
      );

      // Update test last_run
      const testUpdateStmt = this.db.prepare(`
        UPDATE scheduled_tests 
        SET last_run = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `);
      testUpdateStmt.run(completedAt.toISOString(), testId);

      // Process result for trend analysis
      this.trendAnalyzer.processResult(testId, testResult);

      // Evaluate alert rules
      await this.alertManager.evaluateRules(testId, testResult);

      logger.info(`Test completed: ${testId}`);
      
      
      return testResult;
    } catch (error: any) {
      const completedAt = new Date();
      execution.completedAt = completedAt;
      execution.status = 'failed';
      execution.error = error.message;

      const updateStmt = this.db.prepare(`
        UPDATE test_executions 
        SET completed_at = ?, status = ?, error = ?
        WHERE id = ?
      `);
      updateStmt.run(
        completedAt.toISOString(),
        'failed',
        error.message,
        executionId
      );

      logger.error(`Test failed: ${testId} - ${error.message}`);
      throw error;
    }
  }

  /**
   * Get execution history for a test
   */
  getExecutions(testId: string, limit: number = 50): TestExecution[] {
    const stmt = this.db.prepare(`
      SELECT * FROM test_executions 
      WHERE test_id = ? 
      ORDER BY started_at DESC 
      LIMIT ?
    `);
    const rows = stmt.all(testId, limit) as any[];

    return rows.map(row => ({
      testId: row.test_id,
      startedAt: new Date(row.started_at),
      completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
      status: row.status,
      result: row.result ? JSON.parse(row.result) : undefined,
      error: row.error
    }));
  }

  /**
   * Get statistics for a test
   */
  getTestStats(testId: string): {
    totalExecutions: number;
    successRate: number;
    avgDuration: number;
    lastExecution?: Date;
  } {
    const stmt = this.db.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as successful,
        AVG(CASE 
          WHEN completed_at IS NOT NULL 
          THEN (julianday(completed_at) - julianday(started_at)) * 86400000 
          ELSE NULL 
        END) as avg_duration,
        MAX(started_at) as last_execution
      FROM test_executions
      WHERE test_id = ?
    `);
    const row = stmt.get(testId) as any;

    return {
      totalExecutions: row.total || 0,
      successRate: row.total > 0 ? (row.successful / row.total) * 100 : 0,
      avgDuration: row.avg_duration || 0,
      lastExecution: row.last_execution ? new Date(row.last_execution) : undefined
    };
  }

  /**
   * Get trend analysis for a test
   */
  getTrendAnalysis(testId: string, days: number = 30): any {
    return {
      trend: this.trendAnalyzer.getTrend(testId, days),
      topIssues: this.trendAnalyzer.getTopIssues(testId, days),
      performance: this.trendAnalyzer.getPerformanceTrend(testId, days),
      summary: this.trendAnalyzer.getSummary(testId, days)
    };
  }

  /**
   * Get alert manager
   */
  getAlertManager(): AlertManager {
    return this.alertManager;
  }

  /**
   * Start all enabled scheduled tests
   */
  start(): void {
    const tests = this.listTests().filter(t => t.enabled);
    
    for (const test of tests) {
      this.scheduleTest(test.id);
    }

    logger.info(`Started ${tests.length} scheduled tests`);
  }

  /**
   * Stop all scheduled tests
   */
  stop(): void {
    for (const [id, job] of this.scheduledJobs) {
      job.stop();
    }
    this.scheduledJobs.clear();
    logger.info('Stopped all scheduled tests');
  }

  /**
   * Close database connection
   */
  close(): void {
    this.stop();
    this.trendAnalyzer.close();
    this.alertManager.close();
    this.db.close();
    logger.info('Scheduler closed');
  }
}

export type { ScheduledTest, TestExecution };
