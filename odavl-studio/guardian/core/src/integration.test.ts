import { describe, it, expect } from 'vitest';
import { TestOrchestrator } from '../src/test-orchestrator';
import { ReportGenerator } from '../src/report-generator';

describe('Guardian Core - Integration', () => {
  describe('TestOrchestrator', () => {
    it('should run full test suite', async () => {
      const orchestrator = new TestOrchestrator();
      
      const report = await orchestrator.runTests({
        url: 'https://example.com',
        browserType: 'chromium',
        headless: true,
        timeout: 10000
      });

      expect(report).toBeDefined();
      expect(report.url).toBe('https://example.com');
      expect(report.status).toMatch(/passed|failed/);
      expect(report.metrics).toBeDefined();
      expect(report.metrics.totalIssues).toBeGreaterThanOrEqual(0);
      expect(Array.isArray(report.issues)).toBe(true);
    }, 15000);

    it('should run quick test', async () => {
      const orchestrator = new TestOrchestrator();
      
      const report = await orchestrator.quickTest('https://example.com');

      expect(report).toBeDefined();
      expect(report.url).toBe('https://example.com');
      expect(typeof report.duration).toBe('number');
    }, 15000);

    it('should run batch tests', async () => {
      const orchestrator = new TestOrchestrator();
      
      const reports = await orchestrator.runBatch([
        'https://example.com'
      ], {
        browserType: 'chromium',
        headless: true,
        timeout: 10000
      });

      expect(Array.isArray(reports)).toBe(true);
      expect(reports.length).toBe(1);
    }, 20000);
  });

  describe('ReportGenerator', () => {
    it('should generate JSON report', async () => {
      const generator = new ReportGenerator();
      const mockReport: any = {
        url: 'https://example.com',
        timestamp: new Date().toISOString(),
        duration: 5000,
        browserType: 'chromium',
        status: 'passed',
        issues: [],
        metrics: {
          totalIssues: 0,
          critical: 0,
          high: 0,
          medium: 0,
          low: 0
        }
      };

      const path = await generator.generate(mockReport, {
        outputDir: '.odavl/guardian/test',
        format: 'json'
      });

      expect(typeof path).toBe('string');
      expect(path).toContain('.json');
    });

    it('should generate HTML report', async () => {
      const generator = new ReportGenerator();
      const mockReport: any = {
        url: 'https://example.com',
        timestamp: new Date().toISOString(),
        duration: 5000,
        browserType: 'chromium',
        status: 'failed',
        issues: [
          {
            type: 'TEST_ISSUE',
            severity: 'high',
            message: 'Test issue',
            fix: ['Fix step 1', 'Fix step 2'],
            details: {}
          }
        ],
        metrics: {
          totalIssues: 1,
          critical: 0,
          high: 1,
          medium: 0,
          low: 0
        }
      };

      const path = await generator.generate(mockReport, {
        outputDir: '.odavl/guardian/test',
        format: 'html'
      });

      expect(typeof path).toBe('string');
    });
  });
});
