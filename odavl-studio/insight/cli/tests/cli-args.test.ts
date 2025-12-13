/**
 * Tests for CLI argument parsing
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { InsightCli } from '../src/cli.js';
import type { AnalysisEngine, AnalysisResult } from '../src/types.js';

describe('CLI argument parsing', () => {
  let mockEngine: AnalysisEngine;
  let cli: InsightCli;
  let mockExit: ReturnType<typeof vi.spyOn>;
  let consoleLog: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // Mock engine
    mockEngine = {
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
          analyzedFiles: 0,
          duration: 100,
          detectors: [],
        },
      } satisfies AnalysisResult),
    };

    cli = new InsightCli(mockEngine);

    // Mock process.exit
    mockExit = vi.spyOn(process, 'exit').mockImplementation((() => {}) as any);

    // Mock console.log
    consoleLog = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  it('should use default options when none provided', async () => {
    const program = cli.createProgram();

    await program.parseAsync(['node', 'cli', 'analyze', '.']);

    expect(mockEngine.analyze).toHaveBeenCalledWith('.', {
      detectors: undefined,
      changedOnly: false,
      ci: false,
    });
  });

  it('should parse format option', async () => {
    const program = cli.createProgram();

    await program.parseAsync(['node', 'cli', 'analyze', '.', '--format', 'json']);

    expect(consoleLog).toHaveBeenCalled();
    const output = consoleLog.mock.calls[0][0];
    expect(() => JSON.parse(output)).not.toThrow();
  });

  it('should parse fail-level option', async () => {
    const program = cli.createProgram();

    await program.parseAsync([
      'node',
      'cli',
      'analyze',
      '.',
      '--fail-level',
      'medium',
    ]);

    expect(mockEngine.analyze).toHaveBeenCalled();
    // Exit code logic tested separately
  });

  it('should parse detectors option', async () => {
    const program = cli.createProgram();

    await program.parseAsync([
      'node',
      'cli',
      'analyze',
      '.',
      '--detectors',
      'typescript,security',
    ]);

    expect(mockEngine.analyze).toHaveBeenCalledWith('.', {
      detectors: ['typescript', 'security'],
      changedOnly: false,
      ci: false,
    });
  });

  it('should parse changed-only flag', async () => {
    const program = cli.createProgram();

    await program.parseAsync(['node', 'cli', 'analyze', '.', '--changed-only']);

    expect(mockEngine.analyze).toHaveBeenCalledWith('.', {
      detectors: undefined,
      changedOnly: true,
      ci: false,
    });
  });

  it('should parse ci flag', async () => {
    const program = cli.createProgram();

    await program.parseAsync(['node', 'cli', 'analyze', '.', '--ci']);

    expect(mockEngine.analyze).toHaveBeenCalledWith('.', {
      detectors: undefined,
      changedOnly: false,
      ci: true,
    });
  });

  it('should use current directory when path not provided', async () => {
    const program = cli.createProgram();
    const cwd = process.cwd();

    await program.parseAsync(['node', 'cli', 'analyze']);

    expect(mockEngine.analyze).toHaveBeenCalledWith(cwd, {
      detectors: undefined,
      changedOnly: false,
      ci: false,
    });
  });

  it('should combine multiple options', async () => {
    const program = cli.createProgram();

    await program.parseAsync([
      'node',
      'cli',
      'analyze',
      './src',
      '--format',
      'sarif',
      '--detectors',
      'typescript,security,performance',
      '--changed-only',
      '--ci',
      '--fail-level',
      'low',
    ]);

    expect(mockEngine.analyze).toHaveBeenCalledWith('./src', {
      detectors: ['typescript', 'security', 'performance'],
      changedOnly: true,
      ci: true,
    });
  });

  it('should reject invalid format', async () => {
    const program = cli.createProgram();
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    // Invalid format should throw during validation
    await expect(
      program.parseAsync([
        'node',
        'cli',
        'analyze',
        '.',
        '--format',
        'invalid',
      ])
    ).rejects.toThrow('Invalid format');

    consoleError.mockRestore();
  });

  it('should reject invalid fail-level', async () => {
    const program = cli.createProgram();
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    // Invalid fail-level should throw during validation
    await expect(
      program.parseAsync([
        'node',
        'cli',
        'analyze',
        '.',
        '--fail-level',
        'invalid',
      ])
    ).rejects.toThrow('Invalid fail-level');

    consoleError.mockRestore();
  });
});
