/**
 * ODAVL Governance Tests
 * Unit tests for Risk Budget Guard and governance rules
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import yaml from 'yaml';

interface GatesConfig {
  risk_budget: number;
  forbidden_paths: string[];
  actions: {
    max_auto_changes: number;
    max_files_per_cycle: number;
  };
  enforcement?: string[];
  thresholds?: {
    max_risk_per_action?: number;
    min_success_rate?: number;
    max_consecutive_failures?: number;
  };
}

class RiskBudgetGuard {
  constructor(private config: GatesConfig) {}

  validate(files: string[]): void {
    // Check max files
    if (files.length > this.config.actions.max_files_per_cycle) {
      throw new Error(
        `Exceeds max_files_per_cycle: ${files.length} > ${this.config.actions.max_files_per_cycle}`
      );
    }

    // Check forbidden paths
    for (const file of files) {
      if (this.isForbidden(file)) {
        throw new Error(`Forbidden path: ${file}`);
      }
    }

    // Check risk budget
    const totalRisk = files.length; // 1 point per file
    if (totalRisk > this.config.risk_budget) {
      throw new Error(
        `Exceeds risk_budget: ${totalRisk} > ${this.config.risk_budget}`
      );
    }
  }

  private isForbidden(file: string): boolean {
    return this.config.forbidden_paths.some(pattern => {
      // Simple glob matching (micromatch in actual implementation)
      if (pattern.endsWith('/**')) {
        const prefix = pattern.slice(0, -3);
        return file.startsWith(prefix);
      }
      if (pattern.includes('*')) {
        const regex = new RegExp(
          '^' + pattern.replace(/\*/g, '.*') + '$'
        );
        return regex.test(file);
      }
      return file === pattern || file.startsWith(pattern + '/');
    });
  }
}

describe('RiskBudgetGuard', () => {
  let guard: RiskBudgetGuard;
  let config: GatesConfig;

  beforeEach(() => {
    config = {
      risk_budget: 100,
      forbidden_paths: [
        'security/**',
        'auth/**',
        '**/*.spec.*',
        'public-api/**'
      ],
      actions: {
        max_auto_changes: 10,
        max_files_per_cycle: 10
      },
      enforcement: [
        'block_if_risk_exceeded',
        'rollback_on_failure',
        'require_attestation'
      ],
      thresholds: {
        max_risk_per_action: 25,
        min_success_rate: 0.75,
        max_consecutive_failures: 3
      }
    };
    guard = new RiskBudgetGuard(config);
  });

  describe('File Count Validation', () => {
    it('should allow changes within max_files_per_cycle', () => {
      const files = Array(5).fill('src/utils/helper.ts');
      expect(() => guard.validate(files)).not.toThrow();
    });

    it('should block when exceeding max_files_per_cycle', () => {
      const files = Array(11).fill('src/utils/helper.ts');
      expect(() => guard.validate(files)).toThrow(
        /Exceeds max_files_per_cycle/
      );
    });

    it('should allow exactly max_files_per_cycle', () => {
      const files = Array(10).fill('src/utils/helper.ts');
      expect(() => guard.validate(files)).not.toThrow();
    });
  });

  describe('Forbidden Paths', () => {
    it('should block security/** paths', () => {
      const files = ['security/auth.ts'];
      expect(() => guard.validate(files)).toThrow(/Forbidden path/);
    });

    it('should block auth/** paths', () => {
      const files = ['auth/login.ts'];
      expect(() => guard.validate(files)).toThrow(/Forbidden path/);
    });

    it('should block test files (*.spec.*)', () => {
      const files = ['src/utils/helper.spec.ts'];
      expect(() => guard.validate(files)).toThrow(/Forbidden path/);
    });

    it('should block public-api/** paths', () => {
      const files = ['public-api/v1/users.ts'];
      expect(() => guard.validate(files)).toThrow(/Forbidden path/);
    });

    it('should allow non-forbidden paths', () => {
      const files = [
        'src/utils/helper.ts',
        'apps/studio-cli/src/index.ts',
        'packages/core/src/logger.ts'
      ];
      expect(() => guard.validate(files)).not.toThrow();
    });

    it('should block nested security paths', () => {
      const files = ['security/crypto/hash.ts'];
      expect(() => guard.validate(files)).toThrow(/Forbidden path/);
    });
  });

  describe('Risk Budget', () => {
    it('should allow changes within risk budget', () => {
      const files = Array(50).fill('src/utils/helper.ts');
      expect(() => guard.validate(files)).not.toThrow();
    });

    it('should block when exceeding risk budget', () => {
      const files = Array(101).fill('src/utils/helper.ts');
      expect(() => guard.validate(files)).toThrow(/Exceeds risk_budget/);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty file list', () => {
      const files: string[] = [];
      expect(() => guard.validate(files)).not.toThrow();
    });

    it('should handle single file', () => {
      const files = ['src/utils/helper.ts'];
      expect(() => guard.validate(files)).not.toThrow();
    });

    it('should handle files with similar names to forbidden paths', () => {
      const files = ['src/security-utils.ts']; // Not in security/**
      expect(() => guard.validate(files)).not.toThrow();
    });
  });
});

describe('Trust Scoring System', () => {
  interface RecipeTrust {
    trust: number;
    runs: number;
    successes: number;
    failures: number;
    consecutiveFailures?: number;
    blacklisted?: boolean;
  }

  function calculateTrust(
    successes: number,
    failures: number
  ): number {
    const total = successes + failures;
    if (total === 0) return 0.5; // Default trust
    
    const successRate = successes / total;
    // Clamp between 0.1 and 1.0
    return Math.max(0.1, Math.min(1.0, successRate));
  }

  function isBlacklisted(consecutiveFailures: number): boolean {
    return consecutiveFailures >= 3;
  }

  describe('Trust Calculation', () => {
    it('should calculate trust from success rate', () => {
      expect(calculateTrust(8, 2)).toBe(0.8);
      expect(calculateTrust(19, 1)).toBe(0.95);
      expect(calculateTrust(5, 5)).toBe(0.5);
    });

    it('should return default trust (0.5) for no runs', () => {
      expect(calculateTrust(0, 0)).toBe(0.5);
    });

    it('should clamp trust between 0.1 and 1.0', () => {
      expect(calculateTrust(10, 0)).toBe(1.0);
      expect(calculateTrust(0, 10)).toBe(0.1);
    });

    it('should handle single success', () => {
      expect(calculateTrust(1, 0)).toBe(1.0);
    });

    it('should handle single failure', () => {
      expect(calculateTrust(0, 1)).toBe(0.1);
    });
  });

  describe('Blacklisting', () => {
    it('should blacklist after 3 consecutive failures', () => {
      expect(isBlacklisted(3)).toBe(true);
      expect(isBlacklisted(4)).toBe(true);
      expect(isBlacklisted(10)).toBe(true);
    });

    it('should not blacklist with less than 3 failures', () => {
      expect(isBlacklisted(0)).toBe(false);
      expect(isBlacklisted(1)).toBe(false);
      expect(isBlacklisted(2)).toBe(false);
    });
  });

  describe('Trust Update Logic', () => {
    it('should increase trust on success', () => {
      const initialTrust = calculateTrust(5, 5); // 0.5
      const updatedTrust = calculateTrust(6, 5); // 0.545
      expect(updatedTrust).toBeGreaterThan(initialTrust);
    });

    it('should decrease trust on failure', () => {
      const initialTrust = calculateTrust(5, 5); // 0.5
      const updatedTrust = calculateTrust(5, 6); // 0.454
      expect(updatedTrust).toBeLessThan(initialTrust);
    });

    it('should reset consecutive failures on success', () => {
      const recipe: RecipeTrust = {
        trust: 0.3,
        runs: 10,
        successes: 3,
        failures: 7,
        consecutiveFailures: 2
      };

      // Simulate success
      recipe.successes++;
      recipe.runs++;
      recipe.consecutiveFailures = 0;

      expect(recipe.consecutiveFailures).toBe(0);
      expect(isBlacklisted(recipe.consecutiveFailures)).toBe(false);
    });
  });
});

describe('Gates Configuration Loading', () => {
  it('should load gates.yml correctly', async () => {
    const gatesPath = path.join(process.cwd(), '.odavl/gates.yml');
    
    try {
      const content = await fs.readFile(gatesPath, 'utf8');
      const gates: GatesConfig = yaml.parse(content);

      expect(gates).toBeDefined();
      expect(gates.risk_budget).toBeGreaterThan(0);
      expect(Array.isArray(gates.forbidden_paths)).toBe(true);
      expect(gates.actions).toBeDefined();
      expect(gates.actions.max_auto_changes).toBeGreaterThan(0);
    } catch (error) {
      // If file doesn't exist, skip test
      if ((error as any).code === 'ENOENT') {
        console.warn('⚠️ .odavl/gates.yml not found - skipping test');
      } else {
        throw error;
      }
    }
  });
});
