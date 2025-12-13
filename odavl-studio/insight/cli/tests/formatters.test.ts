/**
 * Tests for output formatters
 */

import { describe, it, expect } from 'vitest';
import { HumanFormatter, JsonFormatter, SarifFormatter } from '../src/formatters.js';
import type { AnalysisResult } from '../src/types.js';

describe('HumanFormatter', () => {
  const formatter = new HumanFormatter();

  it('should format result with no issues', () => {
    const result: AnalysisResult = {
      issues: [],
      summary: {
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
        info: 0,
        total: 0,
      },
      metadata: {
        analyzedFiles: 5,
        duration: 100,
        detectors: ['typescript'],
      },
    };

    const output = formatter.format(result);

    expect(output).toContain('ODAVL Insight Analysis');
    expect(output).toContain('Files analyzed:    5');
    expect(output).toContain('Duration:          100ms');
    expect(output).toContain('No issues found!');
  });

  it('should format result with issues', () => {
    const result: AnalysisResult = {
      issues: [
        {
          file: '/project/src/test.ts',
          line: 10,
          column: 5,
          severity: 'high',
          message: 'Potential security issue',
          detector: 'security',
          ruleId: 'SEC001',
        },
        {
          file: '/project/src/test.ts',
          line: 20,
          column: 8,
          severity: 'medium',
          message: 'Performance issue',
          detector: 'performance',
        },
      ],
      summary: {
        critical: 0,
        high: 1,
        medium: 1,
        low: 0,
        info: 0,
        total: 2,
      },
      metadata: {
        analyzedFiles: 10,
        duration: 500,
        detectors: ['security', 'performance'],
      },
    };

    const output = formatter.format(result);

    expect(output).toContain('ODAVL Insight Analysis');
    expect(output).toContain('Files analyzed:    10');
    expect(output).toContain('Total issues:      2');
    expect(output).toContain('High:      1');
    expect(output).toContain('Medium:    1');
  });

  it('should group issues by file', () => {
    const result: AnalysisResult = {
      issues: [
        {
          file: '/project/src/a.ts',
          line: 1,
          column: 1,
          severity: 'high',
          message: 'Issue 1',
          detector: 'typescript',
        },
        {
          file: '/project/src/a.ts',
          line: 2,
          column: 1,
          severity: 'medium',
          message: 'Issue 2',
          detector: 'typescript',
        },
        {
          file: '/project/src/b.ts',
          line: 1,
          column: 1,
          severity: 'low',
          message: 'Issue 3',
          detector: 'style',
        },
      ],
      summary: {
        critical: 0,
        high: 1,
        medium: 1,
        low: 1,
        info: 0,
        total: 3,
      },
      metadata: {
        analyzedFiles: 2,
        duration: 200,
        detectors: ['typescript', 'style'],
      },
    };

    const output = formatter.format(result);

    expect(output).toContain('a.ts');
    expect(output).toContain('b.ts');
  });
});

describe('JsonFormatter', () => {
  const formatter = new JsonFormatter();

  it('should output valid JSON', () => {
    const result: AnalysisResult = {
      issues: [
        {
          file: 'test.ts',
          line: 1,
          column: 1,
          severity: 'high',
          message: 'Test issue',
          detector: 'typescript',
        },
      ],
      summary: {
        critical: 0,
        high: 1,
        medium: 0,
        low: 0,
        info: 0,
        total: 1,
      },
      metadata: {
        analyzedFiles: 1,
        duration: 50,
        detectors: ['typescript'],
      },
    };

    const output = formatter.format(result);
    const parsed = JSON.parse(output);

    expect(parsed.issues).toHaveLength(1);
    expect(parsed.summary.total).toBe(1);
    expect(parsed.metadata.analyzedFiles).toBe(1);
  });

  it('should preserve all issue fields', () => {
    const result: AnalysisResult = {
      issues: [
        {
          file: 'test.ts',
          line: 10,
          column: 5,
          severity: 'critical',
          message: 'Critical issue',
          detector: 'security',
          ruleId: 'SEC001',
          suggestedFix: 'Fix this',
        },
      ],
      summary: {
        critical: 1,
        high: 0,
        medium: 0,
        low: 0,
        info: 0,
        total: 1,
      },
      metadata: {
        analyzedFiles: 1,
        duration: 100,
        detectors: ['security'],
      },
    };

    const output = formatter.format(result);
    const parsed = JSON.parse(output);

    expect(parsed.issues[0].file).toBe('test.ts');
    expect(parsed.issues[0].line).toBe(10);
    expect(parsed.issues[0].column).toBe(5);
    expect(parsed.issues[0].severity).toBe('critical');
    expect(parsed.issues[0].ruleId).toBe('SEC001');
    expect(parsed.issues[0].suggestedFix).toBe('Fix this');
  });
});

describe('SarifFormatter', () => {
  const formatter = new SarifFormatter();

  it('should output valid SARIF 2.1.0', () => {
    const result: AnalysisResult = {
      issues: [
        {
          file: '/project/src/test.ts',
          line: 1,
          column: 1,
          severity: 'high',
          message: 'Test issue',
          detector: 'typescript',
          ruleId: 'TS001',
        },
      ],
      summary: {
        critical: 0,
        high: 1,
        medium: 0,
        low: 0,
        info: 0,
        total: 1,
      },
      metadata: {
        analyzedFiles: 1,
        duration: 50,
        detectors: ['typescript'],
      },
    };

    const output = formatter.format(result);
    const parsed = JSON.parse(output);

    expect(parsed.version).toBe('2.1.0');
    expect(parsed.$schema).toContain('sarif-schema-2.1.0.json');
    expect(parsed.runs).toHaveLength(1);
    expect(parsed.runs[0].tool.driver.name).toBe('ODAVL Insight');
  });

  it('should include rules and results', () => {
    const result: AnalysisResult = {
      issues: [
        {
          file: '/project/src/test.ts',
          line: 10,
          column: 5,
          severity: 'high',
          message: 'Security vulnerability',
          detector: 'security',
          ruleId: 'SEC001',
        },
      ],
      summary: {
        critical: 0,
        high: 1,
        medium: 0,
        low: 0,
        info: 0,
        total: 1,
      },
      metadata: {
        analyzedFiles: 1,
        duration: 100,
        detectors: ['security'],
      },
    };

    const output = formatter.format(result);
    const parsed = JSON.parse(output);

    expect(parsed.runs[0].tool.driver.rules).toHaveLength(1);
    expect(parsed.runs[0].tool.driver.rules[0].id).toBe('SEC001');
    expect(parsed.runs[0].results).toHaveLength(1);
    expect(parsed.runs[0].results[0].ruleId).toBe('SEC001');
    expect(parsed.runs[0].results[0].level).toBe('error');
  });

  it('should map severity to SARIF level', () => {
    const testCases = [
      { severity: 'critical', expectedLevel: 'error' },
      { severity: 'high', expectedLevel: 'error' },
      { severity: 'medium', expectedLevel: 'warning' },
      { severity: 'low', expectedLevel: 'note' },
      { severity: 'info', expectedLevel: 'note' },
    ] as const;

    for (const { severity, expectedLevel } of testCases) {
      const result: AnalysisResult = {
        issues: [
          {
            file: 'test.ts',
            line: 1,
            column: 1,
            severity,
            message: 'Test',
            detector: 'test',
          },
        ],
        summary: {
          critical: 0,
          high: 0,
          medium: 0,
          low: 0,
          info: 0,
          total: 1,
        },
        metadata: {
          analyzedFiles: 1,
          duration: 50,
          detectors: ['test'],
        },
      };

      const output = formatter.format(result);
      const parsed = JSON.parse(output);

      expect(parsed.runs[0].results[0].level).toBe(expectedLevel);
    }
  });

  it('should normalize file paths to relative URIs', () => {
    const cwd = process.cwd().replace(/\\/g, '/');
    const result: AnalysisResult = {
      issues: [
        {
          file: `${cwd}/src/test.ts`, // Use actual cwd so path gets relativized
          line: 1,
          column: 1,
          severity: 'high',
          message: 'Test',
          detector: 'test',
        },
      ],
      summary: {
        critical: 0,
        high: 1,
        medium: 0,
        low: 0,
        info: 0,
        total: 1,
      },
      metadata: {
        analyzedFiles: 1,
        duration: 50,
        detectors: ['test'],
      },
    };

    const output = formatter.format(result);
    const parsed = JSON.parse(output);

    const artifactUri =
      parsed.runs[0].results[0].locations[0].physicalLocation.artifactLocation.uri;
    
    // Should use forward slashes and be relative
    expect(artifactUri).not.toContain('\\');
    expect(artifactUri).toBe('src/test.ts');
  });
});
