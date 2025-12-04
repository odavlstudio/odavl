import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { learn, initializeTrustScores } from '../src/phases/learn';

describe('LEARN Phase', () => {
    const testTrustFile = path.join(process.cwd(), '.odavl', 'recipes-trust.json');
    const testHistoryFile = path.join(process.cwd(), '.odavl', 'history.json');
    let backupTrust: string | null = null;
    let backupHistory: string | null = null;

    beforeEach(() => {
        // Backup existing files
        if (fs.existsSync(testTrustFile)) {
            backupTrust = fs.readFileSync(testTrustFile, 'utf-8');
        }
        if (fs.existsSync(testHistoryFile)) {
            backupHistory = fs.readFileSync(testHistoryFile, 'utf-8');
        }

        // Clear files for clean test state
        const odavlDir = path.dirname(testTrustFile);
        if (fs.existsSync(testTrustFile)) {
            fs.unlinkSync(testTrustFile);
        }
        if (fs.existsSync(testHistoryFile)) {
            fs.unlinkSync(testHistoryFile);
        }

        // Create empty history file
        fs.mkdirSync(odavlDir, { recursive: true });
        fs.writeFileSync(testHistoryFile, '[]', 'utf-8');

        // Initialize fresh trust scores
        initializeTrustScores();
    });

    afterEach(() => {
        // Restore backups
        if (backupTrust) {
            fs.writeFileSync(testTrustFile, backupTrust, 'utf-8');
        }
        if (backupHistory) {
            fs.writeFileSync(testHistoryFile, backupHistory, 'utf-8');
        }
    });

    it('should initialize trust scores for all recipes', () => {
        const data = fs.readFileSync(testTrustFile, 'utf-8');
        const scores = JSON.parse(data);

        const recipeIds = scores.map((s: any) => s.id);
        expect(recipeIds).toContain('import-cleaner');
        expect(recipeIds).toContain('eslint-auto-fix');
        expect(recipeIds).toContain('typescript-fixer');
        expect(recipeIds).toContain('security-hardening');
        expect(recipeIds).toContain('performance-optimizer');

        // All new recipes should start at 0.5 trust
        const newRecipe = scores.find((s: any) => s.id === 'import-cleaner');
        expect(newRecipe.trust).toBe(0.5);
        expect(newRecipe.runs).toBe(0);
        expect(newRecipe.success).toBe(0);
    });

    it('should increase trust on successful run', async () => {
        const result = await learn('import-cleaner', true, {
            eslint: -10,
            typescript: -5,
            total: -15
        });

        expect(result.trustUpdated).toBe(true);
        expect(result.newTrust).toBeGreaterThan(result.oldTrust);
        expect(result.totalRuns).toBe(1);
        expect(result.blacklisted).toBe(false);

        // Verify trust score calculation: success/runs = 1/1 = 1.0
        expect(result.newTrust).toBe(1);
    });

    it('should decrease trust on failed run', async () => {
        // First run - success (trust: 0.5 → 1.0)
        await learn('eslint-auto-fix', true);

        // Second run - failure (trust: 1.0 → 0.5)
        const result = await learn('eslint-auto-fix', false);

        expect(result.trustUpdated).toBe(true);
        expect(result.newTrust).toBeLessThan(result.oldTrust);
        expect(result.totalRuns).toBe(2);

        // Trust calculation: 1 success / 2 runs = 0.5
        expect(result.newTrust).toBe(0.5);
    });

    it('should blacklist recipe after 3 consecutive failures', async () => {
        // First failure
        const result1 = await learn('typescript-fixer', false);
        expect(result1.blacklisted).toBe(false);

        // Second failure
        const result2 = await learn('typescript-fixer', false);
        expect(result2.blacklisted).toBe(false);

        // Third failure - should trigger blacklist
        const result3 = await learn('typescript-fixer', false);
        expect(result3.blacklisted).toBe(true);
        expect(result3.message).toContain('consecutive failures');

        // Verify blacklist flag in file
        const data = fs.readFileSync(testTrustFile, 'utf-8');
        const scores = JSON.parse(data);
        const recipe = scores.find((s: any) => s.id === 'typescript-fixer');
        expect(recipe.blacklisted).toBe(true);
        expect(recipe.consecutiveFailures).toBe(3);
    });

    it('should reset consecutive failures on success', async () => {
        // Two failures
        await learn('security-hardening', false);
        await learn('security-hardening', false);

        // Success - should reset consecutiveFailures
        const result = await learn('security-hardening', true);
        expect(result.blacklisted).toBe(false);

        // Verify consecutive failures reset
        const data = fs.readFileSync(testTrustFile, 'utf-8');
        const scores = JSON.parse(data);
        const recipe = scores.find((s: any) => s.id === 'security-hardening');
        expect(recipe.consecutiveFailures).toBe(0);
    });

    it('should append to history on each run', async () => {
        await learn('performance-optimizer', true, {
            eslint: -5,
            typescript: 0,
            total: -5
        }, 'abc123hash');

        const data = fs.readFileSync(testHistoryFile, 'utf-8');
        const history = JSON.parse(data);

        expect(history.length).toBeGreaterThan(0);
        const lastEntry = history[history.length - 1];
        expect(lastEntry.recipeId).toBe('performance-optimizer');
        expect(lastEntry.success).toBe(true);
        expect(lastEntry.improvement).toEqual({
            eslint: -5,
            typescript: 0,
            total: -5
        });
        expect(lastEntry.attestationHash).toBe('abc123hash');
    });

    it('should clamp trust scores between 0.1 and 1.0', async () => {
        // Run 10 failures to push trust very low
        for (let i = 0; i < 10; i++) {
            await learn('import-cleaner', false);
        }

        const data = fs.readFileSync(testTrustFile, 'utf-8');
        const scores = JSON.parse(data);
        const recipe = scores.find((s: any) => s.id === 'import-cleaner');

        // Trust should be clamped at minimum 0.1
        const minTrust = 0.1;
        const maxTrust = 1;
        expect(recipe.trust).toBeGreaterThanOrEqual(minTrust);
        expect(recipe.trust).toBeLessThanOrEqual(maxTrust);
    });
});
