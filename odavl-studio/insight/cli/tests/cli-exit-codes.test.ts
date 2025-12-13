/**
 * Tests for exit code logic
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { InsightCli } from '../src/cli.js';
import type { AnalysisEngine, AnalysisResult } from '../src/types.js';

describe('CLI exit codes', () => {
  let cli: InsightCli;
  let mockExit: ReturnType<typeof vi.spyOn>;
  let consoleLog: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    mockExit = vi.spyOn(process, 'exit').mockImplementation((() => {}) as any);
    consoleLog = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  it('should exit 0 when no issues found', async () => {
    const mockEngine: AnalysisEngine = {
      analyze: vi.fn().mockResolvedValue({
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
      } satisfies AnalysisResult),
    };

    cli = new InsightCli(mockEngine);
    const program = cli.createProgram();

    await program.parseAsync(['node', 'cli', 'analyze', '.']);

    expect(mockExit).toHaveBeenCalledWith(0);
  });

  it('should exit 1 when critical issues found (fail-level: high)', async () => {
    const mockEngine: AnalysisEngine = {
      analyze: vi.fn().mockResolvedValue({
        issues: [
          {
            file: 'test.ts',
            line: 1,
            column: 1,
            severity: 'critical',
            message: 'Critical issue',
            detector: 'security',
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
          analyzedFiles: 5,
          duration: 100,
          detectors: ['security'],
        },
      } satisfies AnalysisResult),
    };

    cli = new InsightCli(mockEngine);
    const program = cli.createProgram();

    await program.parseAsync([
      'node',
      'cli',
      'analyze',
      '.',
      '--fail-level',
      'high',
    ]);

    expect(mockExit).toHaveBeenCalledWith(1);
  });

  it('should exit 1 when high issues found (fail-level: high)', async () => {
    const mockEngine: AnalysisEngine = {
      analyze: vi.fn().mockResolvedValue({
        issues: [
          {
            file: 'test.ts',
            line: 1,
            column: 1,
            severity: 'high',
            message: 'High severity issue',
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
          analyzedFiles: 5,
          duration: 100,
          detectors: ['typescript'],
        },
      } satisfies AnalysisResult),
    };

    cli = new InsightCli(mockEngine);
    const program = cli.createProgram();

    await program.parseAsync([
      'node',
      'cli',
      'analyze',
      '.',
      '--fail-level',
      'high',
    ]);

    expect(mockExit).toHaveBeenCalledWith(1);
  });

  it('should exit 0 when only medium issues found (fail-level: high)', async () => {
    const mockEngine: AnalysisEngine = {
      analyze: vi.fn().mockResolvedValue({
        issues: [
          {
            file: 'test.ts',
            line: 1,
            column: 1,
            severity: 'medium',
            message: 'Medium severity issue',
            detector: 'performance',
          },
        ],
        summary: {
          critical: 0,
          high: 0,
          medium: 1,
          low: 0,
          info: 0,
          total: 1,
        },
        metadata: {
          analyzedFiles: 5,
          duration: 100,
          detectors: ['performance'],
        },
      } satisfies AnalysisResult),
    };

    cli = new InsightCli(mockEngine);
    const program = cli.createProgram();

    await program.parseAsync([
      'node',
      'cli',
      'analyze',
      '.',
      '--fail-level',
      'high',
    ]);

    expect(mockExit).toHaveBeenCalledWith(0);
  });

  it('should exit 1 when medium issues found (fail-level: medium)', async () => {
    const mockEngine: AnalysisEngine = {
      analyze: vi.fn().mockResolvedValue({
        issues: [
          {
            file: 'test.ts',
            line: 1,
            column: 1,
            severity: 'medium',
            message: 'Medium severity issue',
            detector: 'complexity',
          },
        ],
        summary: {
          critical: 0,
          high: 0,
          medium: 1,
          low: 0,
          info: 0,
          total: 1,
        },
        metadata: {
          analyzedFiles: 5,
          duration: 100,
          detectors: ['complexity'],
        },
      } satisfies AnalysisResult),
    };

    cli = new InsightCli(mockEngine);
    const program = cli.createProgram();

    await program.parseAsync([
      'node',
      'cli',
      'analyze',
      '.',
      '--fail-level',
      'medium',
    ]);

    expect(mockExit).toHaveBeenCalledWith(1);
  });

  it('should exit 1 when low issues found (fail-level: low)', async () => {
    const mockEngine: AnalysisEngine = {
      analyze: vi.fn().mockResolvedValue({
        issues: [
          {
            file: 'test.ts',
            line: 1,
            column: 1,
            severity: 'low',
            message: 'Low severity issue',
            detector: 'import',
          },
        ],
        summary: {
          critical: 0,
          high: 0,
          medium: 0,
          low: 1,
          info: 0,
          total: 1,
        },
        metadata: {
          analyzedFiles: 5,
          duration: 100,
          detectors: ['import'],
        },
      } satisfies AnalysisResult),
    };

    cli = new InsightCli(mockEngine);
    const program = cli.createProgram();

    await program.parseAsync(['node', 'cli', 'analyze', '.', '--fail-level', 'low']);

    expect(mockExit).toHaveBeenCalledWith(1);
  });

  it('should exit 0 when only info issues found (fail-level: low)', async () => {
    const mockEngine: AnalysisEngine = {
      analyze: vi.fn().mockResolvedValue({
        issues: [
          {
            file: 'test.ts',
            line: 1,
            column: 1,
            severity: 'info',
            message: 'Info message',
            detector: 'style',
          },
        ],
        summary: {
          critical: 0,
          high: 0,
          medium: 0,
          low: 0,
          info: 1,
          total: 1,
        },
        metadata: {
          analyzedFiles: 5,
          duration: 100,
          detectors: ['style'],
        },
      } satisfies AnalysisResult),
    };

    cli = new InsightCli(mockEngine);
    const program = cli.createProgram();

    await program.parseAsync(['node', 'cli', 'analyze', '.', '--fail-level', 'low']);

    expect(mockExit).toHaveBeenCalledWith(0);
  });

  it('should exit 1 when info issues found (fail-level: info)', async () => {
    const mockEngine: AnalysisEngine = {
      analyze: vi.fn().mockResolvedValue({
        issues: [
          {
            file: 'test.ts',
            line: 1,
            column: 1,
            severity: 'info',
            message: 'Info message',
            detector: 'style',
          },
        ],
        summary: {
          critical: 0,
          high: 0,
          medium: 0,
          low: 0,
          info: 1,
          total: 1,
        },
        metadata: {
          analyzedFiles: 5,
          duration: 100,
          detectors: ['style'],
        },
      } satisfies AnalysisResult),
    };

    cli = new InsightCli(mockEngine);
    const program = cli.createProgram();

    await program.parseAsync(['node', 'cli', 'analyze', '.', '--fail-level', 'info']);

    expect(mockExit).toHaveBeenCalledWith(1);
  });

  it('should exit 2 on engine error', async () => {
    const mockEngine: AnalysisEngine = {
      analyze: vi.fn().mockRejectedValue(new Error('Analysis failed')),
    };

    cli = new InsightCli(mockEngine);
    const program = cli.createProgram();
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    await program.parseAsync(['node', 'cli', 'analyze', '.']);

    expect(mockExit).toHaveBeenCalledWith(2);
    consoleError.mockRestore();
  });

  it('should exit 1 with mixed severity issues (fail-level: critical)', async () => {
    const mockEngine: AnalysisEngine = {
      analyze: vi.fn().mockResolvedValue({
        issues: [],
        summary: {
          critical: 1,
          high: 3,
          medium: 5,
          low: 10,
          info: 2,
          total: 21,
        },
        metadata: {
          analyzedFiles: 10,
          duration: 500,
          detectors: ['typescript', 'security'],
        },
      } satisfies AnalysisResult),
    };

    cli = new InsightCli(mockEngine);
    const program = cli.createProgram();

    await program.parseAsync([
      'node',
      'cli',
      'analyze',
      '.',
      '--fail-level',
      'critical',
    ]);

    expect(mockExit).toHaveBeenCalledWith(1);
  });
});
