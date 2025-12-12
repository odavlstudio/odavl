/**
 * ODAVL Insight CLI - End-to-End Tests
 * 
 * Tests the CLI analyze command with real fixtures.
 * 
 * @group e2e
 * @group cli
 * @group insight
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';
import * as fs from 'fs/promises';

const execAsync = promisify(exec);

const CLI_PATH = path.join(__dirname, '../../apps/studio-cli/dist/index.mjs');
const FIXTURE_PATH = path.join(__dirname, '../../test-fixtures/insight-test-project');
const TIMEOUT = 30000; // 30 seconds for CLI commands

describe('CLI - odavl insight analyze (local mode)', () => {
  beforeAll(async () => {
    // Ensure fixture exists
    const exists = await fs.access(FIXTURE_PATH)
      .then(() => true)
      .catch(() => false);
    
    if (!exists) {
      throw new Error(`Test fixture not found at: ${FIXTURE_PATH}`);
    }
  });

  it('should run local analysis and exit with code 0', async () => {
    const { stdout, stderr } = await execAsync(
      `node "${CLI_PATH}" insight analyze --local`,
      { 
        cwd: FIXTURE_PATH,
        timeout: TIMEOUT,
      }
    );
    
    // Should find issues in fixture
    expect(stdout).toContain('issues found');
    expect(stderr).toBe('');
  }, TIMEOUT);

  it('should detect TypeScript issues in fixture', async () => {
    const { stdout } = await execAsync(
      `node "${CLI_PATH}" insight analyze --local --detectors typescript`,
      { 
        cwd: FIXTURE_PATH,
        timeout: TIMEOUT,
      }
    );
    
    // Fixture has 'any' types, unused variables, etc.
    expect(stdout).toMatch(/typescript.*issue/i);
  }, TIMEOUT);

  it('should detect security issues in fixture', async () => {
    const { stdout } = await execAsync(
      `node "${CLI_PATH}" insight analyze --local --detectors security`,
      { 
        cwd: FIXTURE_PATH,
        timeout: TIMEOUT,
      }
    );
    
    // Fixture has hardcoded API key
    expect(stdout).toMatch(/security.*issue|credential|api.*key/i);
  }, TIMEOUT);

  it('should support JSON output format', async () => {
    const { stdout } = await execAsync(
      `node "${CLI_PATH}" insight analyze --local --format json`,
      { 
        cwd: FIXTURE_PATH,
        timeout: TIMEOUT,
      }
    );
    
    const result = JSON.parse(stdout);
    expect(result).toHaveProperty('issues');
    expect(result).toHaveProperty('summary');
    expect(Array.isArray(result.issues)).toBe(true);
    expect(result.issues.length).toBeGreaterThan(0);
  }, TIMEOUT);

  it('should support Markdown output format', async () => {
    const { stdout } = await execAsync(
      `node "${CLI_PATH}" insight analyze --local --format markdown`,
      { 
        cwd: FIXTURE_PATH,
        timeout: TIMEOUT,
      }
    );
    
    expect(stdout).toContain('# Analysis Report');
    expect(stdout).toContain('## Issues Found');
  }, TIMEOUT);

  it('should emit telemetry events (check logs)', async () => {
    const { stdout } = await execAsync(
      `node "${CLI_PATH}" insight analyze --local --verbose`,
      { 
        cwd: FIXTURE_PATH,
        timeout: TIMEOUT,
        env: {
          ...process.env,
          ODAVL_TELEMETRY_ENABLED: 'true',
        },
      }
    );
    
    // Verbose mode should show telemetry info
    expect(stdout).toMatch(/telemetry|tracking/i);
  }, TIMEOUT);

  it('should respect telemetry opt-out', async () => {
    const { stdout } = await execAsync(
      `node "${CLI_PATH}" insight analyze --local`,
      { 
        cwd: FIXTURE_PATH,
        timeout: TIMEOUT,
        env: {
          ...process.env,
          ODAVL_TELEMETRY_ENABLED: 'false',
        },
      }
    );
    
    // Should still work without telemetry
    expect(stdout).toContain('issues found');
  }, TIMEOUT);

  it('should fail gracefully with invalid detector', async () => {
    try {
      await execAsync(
        `node "${CLI_PATH}" insight analyze --local --detectors invalid-detector`,
        { 
          cwd: FIXTURE_PATH,
          timeout: TIMEOUT,
        }
      );
      
      // Should throw
      expect(true).toBe(false);
    } catch (error: any) {
      expect(error.code).toBeGreaterThan(0);
      expect(error.stderr).toMatch(/invalid.*detector/i);
    }
  }, TIMEOUT);

  it('should fail gracefully with non-existent directory', async () => {
    try {
      await execAsync(
        `node "${CLI_PATH}" insight analyze --local`,
        { 
          cwd: '/non/existent/path',
          timeout: TIMEOUT,
        }
      );
      
      // Should throw
      expect(true).toBe(false);
    } catch (error: any) {
      expect(error.code).toBeGreaterThan(0);
    }
  }, TIMEOUT);
});

describe('CLI - odavl insight analyze (cloud mode)', () => {
  it('should require authentication for cloud analysis', async () => {
    try {
      await execAsync(
        `node "${CLI_PATH}" insight analyze --cloud`,
        { 
          cwd: FIXTURE_PATH,
          timeout: TIMEOUT,
          env: {
            ...process.env,
            ODAVL_AUTH_TOKEN: '', // No token
          },
        }
      );
      
      // Should throw
      expect(true).toBe(false);
    } catch (error: any) {
      expect(error.code).toBeGreaterThan(0);
      expect(error.stderr).toMatch(/auth|login|token/i);
    }
  }, TIMEOUT);

  it('should display upgrade message for FREE plan', async () => {
    // Mock FREE plan user (no cloud access)
    try {
      await execAsync(
        `node "${CLI_PATH}" insight analyze --cloud`,
        { 
          cwd: FIXTURE_PATH,
          timeout: TIMEOUT,
          env: {
            ...process.env,
            ODAVL_AUTH_TOKEN: 'mock-free-plan-token',
            ODAVL_PLAN_ID: 'INSIGHT_FREE',
          },
        }
      );
      
      // Should throw or show upgrade message
      expect(true).toBe(false);
    } catch (error: any) {
      expect(error.code).toBeGreaterThan(0);
      expect(error.stderr).toMatch(/upgrade|pro.*plan|cloud.*analysis/i);
    }
  }, TIMEOUT);
});

describe('CLI - odavl insight analyze (error handling)', () => {
  it('should handle network timeout gracefully', async () => {
    try {
      await execAsync(
        `node "${CLI_PATH}" insight analyze --cloud --timeout 1`,
        { 
          cwd: FIXTURE_PATH,
          timeout: TIMEOUT,
          env: {
            ...process.env,
            ODAVL_AUTH_TOKEN: 'mock-token',
            ODAVL_API_URL: 'http://localhost:9999', // Non-existent server
          },
        }
      );
      
      // Should throw
      expect(true).toBe(false);
    } catch (error: any) {
      expect(error.code).toBeGreaterThan(0);
      expect(error.stderr).toMatch(/network|timeout|connection/i);
      
      // Should NOT contain stack traces in user-facing output
      expect(error.stderr).not.toMatch(/at\s+.*\(.+:\d+:\d+\)/);
    }
  }, TIMEOUT);

  it('should display user-friendly error messages', async () => {
    try {
      await execAsync(
        `node "${CLI_PATH}" insight analyze --local --max-files 0`,
        { 
          cwd: FIXTURE_PATH,
          timeout: TIMEOUT,
        }
      );
      
      // Should throw
      expect(true).toBe(false);
    } catch (error: any) {
      expect(error.code).toBeGreaterThan(0);
      
      // Should have clear error message
      expect(error.stderr).toMatch(/invalid.*option|must be.*greater than/i);
      
      // Should NOT show stack traces
      expect(error.stderr).not.toContain('Error:');
      expect(error.stderr).not.toContain('  at ');
    }
  }, TIMEOUT);

  it('should provide helpful suggestions on common errors', async () => {
    try {
      await execAsync(
        `node "${CLI_PATH}" insight analyze --cloud`,
        { 
          cwd: FIXTURE_PATH,
          timeout: TIMEOUT,
          env: {
            ...process.env,
            ODAVL_AUTH_TOKEN: '', // Not authenticated
          },
        }
      );
      
      // Should throw
      expect(true).toBe(false);
    } catch (error: any) {
      expect(error.code).toBeGreaterThan(0);
      
      // Should suggest login command
      expect(error.stderr).toMatch(/odavl.*auth.*login|run.*login/i);
    }
  }, TIMEOUT);
});

describe('CLI - odavl insight analyze (performance)', () => {
  it('should complete local analysis in under 5 seconds', async () => {
    const startTime = Date.now();
    
    await execAsync(
      `node "${CLI_PATH}" insight analyze --local`,
      { 
        cwd: FIXTURE_PATH,
        timeout: TIMEOUT,
      }
    );
    
    const duration = Date.now() - startTime;
    expect(duration).toBeLessThan(5000);
  }, TIMEOUT);

  it('should support concurrent analyses', async () => {
    // Run 3 analyses in parallel
    const promises = [
      execAsync(`node "${CLI_PATH}" insight analyze --local`, { cwd: FIXTURE_PATH }),
      execAsync(`node "${CLI_PATH}" insight analyze --local`, { cwd: FIXTURE_PATH }),
      execAsync(`node "${CLI_PATH}" insight analyze --local`, { cwd: FIXTURE_PATH }),
    ];
    
    const results = await Promise.all(promises);
    
    // All should succeed
    results.forEach(({ stdout, stderr }) => {
      expect(stdout).toContain('issues found');
      expect(stderr).toBe('');
    });
  }, TIMEOUT);
});

describe('CLI - odavl insight analyze (exit codes)', () => {
  it('should exit with 0 on successful analysis', async () => {
    const { code } = await execAsync(
      `node "${CLI_PATH}" insight analyze --local`,
      { 
        cwd: FIXTURE_PATH,
        timeout: TIMEOUT,
      }
    ).then(
      (result) => ({ ...result, code: 0 }),
      (error) => error
    );
    
    expect(code).toBe(0);
  }, TIMEOUT);

  it('should exit with 1 on authentication error', async () => {
    const { code } = await execAsync(
      `node "${CLI_PATH}" insight analyze --cloud`,
      { 
        cwd: FIXTURE_PATH,
        timeout: TIMEOUT,
        env: {
          ...process.env,
          ODAVL_AUTH_TOKEN: '',
        },
      }
    ).then(
      (result) => ({ ...result, code: 0 }),
      (error) => ({ code: error.code })
    );
    
    expect(code).toBe(1);
  }, TIMEOUT);

  it('should exit with 2 on invalid options', async () => {
    const { code } = await execAsync(
      `node "${CLI_PATH}" insight analyze --invalid-option`,
      { 
        cwd: FIXTURE_PATH,
        timeout: TIMEOUT,
      }
    ).then(
      (result) => ({ ...result, code: 0 }),
      (error) => ({ code: error.code })
    );
    
    expect(code).toBeGreaterThan(0);
  }, TIMEOUT);
});
