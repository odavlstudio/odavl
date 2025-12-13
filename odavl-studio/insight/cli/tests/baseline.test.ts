/**
 * ODAVL Insight - Baseline System Tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import type { InsightIssue } from '../src/types.js';
import {
  createBaseline,
  loadBaseline,
  listBaselines,
  deleteBaseline,
  baselineExists,
} from '../src/baseline/storage.js';
import {
  validateBaseline,
  BaselineValidationError,
  BaselineNotFoundError,
} from '../src/baseline/baseline.js';
import {
  generateFingerprint,
  generateContentFingerprint,
  generateLocationFingerprint,
  generateMessageFingerprint,
  normalizeFilePath,
} from '../src/baseline/fingerprint.js';
import {
  compareWithBaseline,
  countBySeverity,
} from '../src/baseline/matcher.js';

describe('Baseline System', () => {
  let testDir: string;

  beforeEach(async () => {
    // Create temporary test directory
    testDir = join(tmpdir(), `odavl-baseline-test-${Date.now()}`);
    await fs.mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    // Cleanup test directory
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  const createTestIssue = (overrides: Partial<InsightIssue> = {}): InsightIssue => ({
    file: 'src/test.ts',
    line: 42,
    column: 10,
    severity: 'high',
    message: 'Test issue',
    detector: 'typescript',
    ruleId: 'TS001',
    ...overrides,
  });

  describe('Baseline Storage', () => {
    it('should create baseline with metadata', async () => {
      const issues = [createTestIssue()];

      const baseline = await createBaseline(testDir, 'test', issues, {
        detectors: ['typescript'],
      });

      expect(baseline.version).toBe('1.0.0');
      expect(baseline.metadata.totalIssues).toBe(1);
      expect(baseline.metadata.totalFiles).toBe(1);
      expect(baseline.metadata.createdAt).toBeTruthy();
      expect(baseline.metadata.createdBy).toBeTruthy();
      expect(baseline.config.detectors).toEqual(['typescript']);
      expect(baseline.issues).toHaveLength(1);
      expect(baseline.issues[0].fingerprint).toBeTruthy();
    });

    it('should save baseline to disk', async () => {
      const issues = [createTestIssue()];

      await createBaseline(testDir, 'test', issues, {
        detectors: ['typescript'],
      });

      const path = join(testDir, '.odavl/baselines/test.json');
      const exists = await fs.access(path).then(() => true).catch(() => false);

      expect(exists).toBe(true);
    });

    it('should load baseline from disk', async () => {
      const issues = [createTestIssue()];

      await createBaseline(testDir, 'test', issues, {
        detectors: ['typescript'],
      });

      const loaded = await loadBaseline(testDir, 'test');

      expect(loaded.metadata.totalIssues).toBe(1);
      expect(loaded.issues).toHaveLength(1);
    });

    it('should throw BaselineNotFoundError for missing baseline', async () => {
      await expect(loadBaseline(testDir, 'nonexistent')).rejects.toThrow(
        BaselineNotFoundError
      );
    });

    it('should validate baseline schema', async () => {
      const issues = [createTestIssue()];

      const baseline = await createBaseline(testDir, 'test', issues, {
        detectors: ['typescript'],
      });

      expect(validateBaseline(baseline)).toBe(true);
    });

    it('should reject invalid baseline schema', () => {
      const invalid = {
        version: '1.0.0',
        metadata: {
          // Missing required fields
          createdAt: '2025-01-01T00:00:00Z',
        },
        config: { detectors: [] },
        issues: [],
      };

      expect(validateBaseline(invalid)).toBe(false);
    });

    it('should list all baselines', async () => {
      const issues = [createTestIssue()];

      await createBaseline(testDir, 'main', issues, {
        detectors: ['typescript'],
      });
      await createBaseline(testDir, 'develop', issues, {
        detectors: ['typescript'],
      });

      const baselines = await listBaselines(testDir);

      expect(baselines).toHaveLength(2);
      expect(baselines.map((b) => b.name)).toContain('main');
      expect(baselines.map((b) => b.name)).toContain('develop');
    });

    it('should delete baseline', async () => {
      const issues = [createTestIssue()];

      await createBaseline(testDir, 'test', issues, {
        detectors: ['typescript'],
      });

      const existsBefore = await baselineExists(testDir, 'test');
      expect(existsBefore).toBe(true);

      await deleteBaseline(testDir, 'test');

      const existsAfter = await baselineExists(testDir, 'test');
      expect(existsAfter).toBe(false);
    });

    it('should create baseline with auto-created flag', async () => {
      const issues = [createTestIssue()];

      const baseline = await createBaseline(testDir, 'test', issues, {
        detectors: ['typescript'],
        autoCreated: true,
      });

      expect(baseline.metadata.autoCreated).toBe(true);
    });
  });

  describe('Fingerprinting', () => {
    it('should normalize file paths', () => {
      expect(normalizeFilePath('/path/to/file.ts')).toBe('path/to/file.ts');
      expect(normalizeFilePath('./path/to/file.ts')).toBe('path/to/file.ts');
      expect(normalizeFilePath('path\\to\\file.ts')).toBe('path/to/file.ts');
    });

    it('should generate content-based fingerprint', () => {
      const issue = createTestIssue();
      const fingerprint = generateContentFingerprint(issue, 'code snippet');

      expect(fingerprint).toMatch(/^sha256:/);
      expect(fingerprint.length).toBeGreaterThan(10);
    });

    it('should generate location-based fingerprint', () => {
      const issue = createTestIssue();
      const fingerprint = generateLocationFingerprint(issue);

      expect(fingerprint).toMatch(/^loc:/);
      expect(fingerprint.length).toBeGreaterThan(5);
    });

    it('should generate message-based fingerprint', () => {
      const issue = createTestIssue();
      const fingerprint = generateMessageFingerprint(issue);

      expect(fingerprint).toMatch(/^msg:/);
      expect(fingerprint.length).toBeGreaterThan(5);
    });

    it('should generate same fingerprint for identical issues', () => {
      const issue1 = createTestIssue();
      const issue2 = createTestIssue();

      const fp1 = generateFingerprint(issue1);
      const fp2 = generateFingerprint(issue2);

      expect(fp1).toBe(fp2);
    });

    it('should generate different fingerprints for different issues', () => {
      const issue1 = createTestIssue({ line: 42 });
      const issue2 = createTestIssue({ line: 43 });

      const fp1 = generateFingerprint(issue1);
      const fp2 = generateFingerprint(issue2);

      expect(fp1).not.toBe(fp2);
    });

    it('should use location fingerprint when ruleId available', () => {
      const issue = createTestIssue({ ruleId: 'TS001' });
      const fingerprint = generateFingerprint(issue);

      expect(fingerprint).toMatch(/^loc:/);
    });

    it('should use message fingerprint when no ruleId', () => {
      const issue = createTestIssue({ ruleId: undefined });
      const fingerprint = generateFingerprint(issue);

      expect(fingerprint).toMatch(/^msg:/);
    });
  });

  describe('Issue Matching', () => {
    it('should detect new issues', async () => {
      const baselineIssues = [createTestIssue({ line: 42 })];
      const currentIssues = [
        createTestIssue({ line: 42 }),
        createTestIssue({ line: 50, message: 'New issue' }),
      ];

      const baseline = await createBaseline(testDir, 'test', baselineIssues, {
        detectors: ['typescript'],
      });

      const comparison = compareWithBaseline(
        currentIssues,
        baseline,
        'test'
      );

      expect(comparison.summary.new).toBe(1);
      expect(comparison.summary.unchanged).toBe(1);
      expect(comparison.summary.resolved).toBe(0);
      expect(comparison.newIssues).toHaveLength(1);
      expect(comparison.newIssues[0].line).toBe(50);
    });

    it('should detect resolved issues', async () => {
      const baselineIssues = [
        createTestIssue({ line: 42 }),
        createTestIssue({ line: 50 }),
      ];
      const currentIssues = [createTestIssue({ line: 42 })];

      const baseline = await createBaseline(testDir, 'test', baselineIssues, {
        detectors: ['typescript'],
      });

      const comparison = compareWithBaseline(
        currentIssues,
        baseline,
        'test'
      );

      expect(comparison.summary.resolved).toBe(1);
      expect(comparison.summary.unchanged).toBe(1);
      expect(comparison.summary.new).toBe(0);
      expect(comparison.resolvedIssues).toHaveLength(1);
      expect(comparison.resolvedIssues[0].line).toBe(50);
    });

    it('should match issues with fuzzy line tolerance', async () => {
      const baselineIssues = [createTestIssue({ line: 42 })];
      const currentIssues = [createTestIssue({ line: 44 })]; // ±2 lines

      const baseline = await createBaseline(testDir, 'test', baselineIssues, {
        detectors: ['typescript'],
      });

      const comparison = compareWithBaseline(
        currentIssues,
        baseline,
        'test'
      );

      // Should match due to fuzzy tolerance (±3 lines)
      expect(comparison.summary.unchanged).toBe(1);
      expect(comparison.summary.new).toBe(0);
    });

    it('should not match issues beyond fuzzy tolerance', async () => {
      const baselineIssues = [createTestIssue({ line: 42 })];
      const currentIssues = [createTestIssue({ line: 50 })]; // +8 lines (beyond ±3)

      const baseline = await createBaseline(testDir, 'test', baselineIssues, {
        detectors: ['typescript'],
      });

      const comparison = compareWithBaseline(
        currentIssues,
        baseline,
        'test'
      );

      // Should not match (too far apart)
      expect(comparison.summary.new).toBe(1);
      expect(comparison.summary.unchanged).toBe(0);
    });

    it('should count issues by severity', () => {
      const issues = [
        createTestIssue({ severity: 'critical' }),
        createTestIssue({ severity: 'high' }),
        createTestIssue({ severity: 'high' }),
        createTestIssue({ severity: 'medium' }),
        createTestIssue({ severity: 'low' }),
        createTestIssue({ severity: 'info' }),
      ];

      const counts = countBySeverity(issues);

      expect(counts.critical).toBe(1);
      expect(counts.high).toBe(2);
      expect(counts.medium).toBe(1);
      expect(counts.low).toBe(1);
      expect(counts.info).toBe(1);
    });

    it('should match issues across different files', async () => {
      const baselineIssues = [
        createTestIssue({ file: 'src/a.ts', line: 10 }),
        createTestIssue({ file: 'src/b.ts', line: 20 }),
      ];
      const currentIssues = [
        createTestIssue({ file: 'src/a.ts', line: 10 }),
        createTestIssue({ file: 'src/b.ts', line: 20 }),
        createTestIssue({ file: 'src/c.ts', line: 30, message: 'New file issue' }),
      ];

      const baseline = await createBaseline(testDir, 'test', baselineIssues, {
        detectors: ['typescript'],
      });

      const comparison = compareWithBaseline(
        currentIssues,
        baseline,
        'test'
      );

      expect(comparison.summary.new).toBe(1);
      expect(comparison.summary.unchanged).toBe(2);
    });
  });

  describe('Comparison Results', () => {
    it('should include baseline metadata', async () => {
      const issues = [createTestIssue()];

      const baseline = await createBaseline(testDir, 'test', issues, {
        detectors: ['typescript'],
      });

      const comparison = compareWithBaseline(issues, baseline, 'test');

      expect(comparison.baseline.name).toBe('test');
      expect(comparison.baseline.timestamp).toBeTruthy();
      expect(comparison.baseline.totalIssues).toBe(1);
    });

    it('should include current metadata', async () => {
      const issues = [createTestIssue()];

      const baseline = await createBaseline(testDir, 'test', issues, {
        detectors: ['typescript'],
      });

      const comparison = compareWithBaseline(issues, baseline, 'test');

      expect(comparison.current.timestamp).toBeTruthy();
      expect(comparison.current.totalIssues).toBe(1);
    });

    it('should provide summary counts', async () => {
      const baselineIssues = [createTestIssue({ line: 42 })];
      const currentIssues = [
        createTestIssue({ line: 42 }),
        createTestIssue({ line: 50, message: 'New' }),
      ];

      const baseline = await createBaseline(testDir, 'test', baselineIssues, {
        detectors: ['typescript'],
      });

      const comparison = compareWithBaseline(
        currentIssues,
        baseline,
        'test'
      );

      expect(comparison.summary.new).toBe(1);
      expect(comparison.summary.resolved).toBe(0);
      expect(comparison.summary.unchanged).toBe(1);
      expect(comparison.summary.total).toBe(2);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty baseline', async () => {
      const baseline = await createBaseline(testDir, 'empty', [], {
        detectors: ['typescript'],
      });

      const currentIssues = [createTestIssue()];

      const comparison = compareWithBaseline(
        currentIssues,
        baseline,
        'empty'
      );

      expect(comparison.summary.new).toBe(1);
      expect(comparison.summary.unchanged).toBe(0);
      expect(comparison.summary.resolved).toBe(0);
    });

    it('should handle empty current issues', async () => {
      const baselineIssues = [createTestIssue()];

      const baseline = await createBaseline(testDir, 'test', baselineIssues, {
        detectors: ['typescript'],
      });

      const comparison = compareWithBaseline([], baseline, 'test');

      expect(comparison.summary.new).toBe(0);
      expect(comparison.summary.unchanged).toBe(0);
      expect(comparison.summary.resolved).toBe(1);
    });

    it('should handle issues without ruleId', async () => {
      const issue = createTestIssue({ ruleId: undefined });

      const baseline = await createBaseline(testDir, 'test', [issue], {
        detectors: ['typescript'],
      });

      const comparison = compareWithBaseline([issue], baseline, 'test');

      expect(comparison.summary.unchanged).toBe(1);
    });

    it('should handle large number of issues', async () => {
      const baselineIssues = Array.from({ length: 1000 }, (_, i) =>
        createTestIssue({ line: i + 1, message: `Issue ${i}` })
      );
      const currentIssues = baselineIssues.slice(); // Same issues

      const baseline = await createBaseline(testDir, 'large', baselineIssues, {
        detectors: ['typescript'],
      });

      const comparison = compareWithBaseline(
        currentIssues,
        baseline,
        'large'
      );

      expect(comparison.summary.unchanged).toBe(1000);
      expect(comparison.summary.new).toBe(0);
      expect(comparison.summary.resolved).toBe(0);
    });
  });
});
