import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { decide, updateTrust } from '../src/phases/decide';

describe('decide() branch/logic coverage', () => {
    const recipesDir = path.join(process.cwd(), '.odavl', 'recipes');
    const trustFile = path.join(process.cwd(), '.odavl', 'recipes-trust.json');


    beforeEach(() => {
        fs.mkdirSync(recipesDir, { recursive: true });
        // Skip files created by setup.ts (5 core recipes)
        const setupRecipes = ['typescript-fixer.json', 'import-cleaner.json', 'security-hardening.json', 'remove-unused.json', 'esm-hygiene.json'];
        for (const f of fs.readdirSync(recipesDir)) {
            if (!setupRecipes.includes(f)) {
                try { fs.unlinkSync(path.join(recipesDir, f)); } catch { }
            }
        }
        // Don't delete trust file - setup.ts creates it
    });

    afterEach(() => {
        // Clean up recipes after each test (skip setup recipes)
        const setupRecipes = ['typescript-fixer.json', 'import-cleaner.json', 'security-hardening.json', 'remove-unused.json', 'esm-hygiene.json'];
        for (const f of fs.readdirSync(recipesDir)) {
            if (!setupRecipes.includes(f)) {
                try { fs.unlinkSync(path.join(recipesDir, f)); } catch { }
            }
        }
    });

    it('returns "noop" if no recipes match (5 core recipes exist but no metrics)', async () => {
        // 0 issues = no recipes match conditions
        const result = await decide({ eslint: 0, typescript: 0, totalIssues: 0, timestamp: new Date().toISOString(), runId: 'test-1', targetDir: process.cwd(), security: 0, performance: 0, imports: 0, packages: 0, runtime: 0, build: 0, circular: 0, network: 0, complexity: 0, isolation: 0 });
        expect(result).toBe('noop');
    });

    it('returns the only matching recipe if one matches', async () => {
        // 10 imports = import-cleaner should match (condition >= 5)
        const result = await decide({ imports: 10, totalIssues: 10, timestamp: new Date().toISOString(), runId: 'test-2', targetDir: process.cwd(), typescript: 0, eslint: 0, security: 0, performance: 0, packages: 0, runtime: 0, build: 0, circular: 0, network: 0, complexity: 0, isolation: 0 });
        expect(result).toBe('import-cleaner');
    });

    it('returns highest trust recipe when multiple match', async () => {
        // Both typescript-fixer (0.85) and security-hardening (0.95) could match
        // but security-hardening has higher trust
        const result = await decide({ typescript: 5, security: 5, totalIssues: 10, timestamp: new Date().toISOString(), runId: 'test-3', targetDir: process.cwd(), eslint: 0, performance: 0, imports: 0, packages: 0, runtime: 0, build: 0, circular: 0, network: 0, complexity: 0, isolation: 0 });
        expect(result).toBe('security-hardening'); // Higher trust wins
    });

    it('handles malformed recipe files gracefully', async () => {
        fs.writeFileSync(path.join(recipesDir, 'bad.json'), '{not valid json');
        // Should still return one of the 5 core recipes if conditions match
        const result = await decide({ typescript: 5, totalIssues: 5, timestamp: new Date().toISOString(), runId: 'test-4', targetDir: process.cwd(), eslint: 0, security: 0, performance: 0, imports: 0, packages: 0, runtime: 0, build: 0, circular: 0, network: 0, complexity: 0, isolation: 0 });
        expect(result).toBe('typescript-fixer'); // Should skip bad.json
    });

    it('updateTrust creates and updates trust file', async () => {
        await updateTrust('r1', true);
        expect(fs.existsSync(trustFile)).toBe(true);
        const arr = JSON.parse(fs.readFileSync(trustFile, 'utf8'));
        expect(arr[0].id).toBe('r1');
        expect(arr[0].runs).toBe(1);
        expect(arr[0].success).toBe(1);
        expect(arr[0].trust).toBeGreaterThanOrEqual(0.1);
        await updateTrust('r1', false);
        const arr2 = JSON.parse(fs.readFileSync(trustFile, 'utf8'));
        expect(arr2[0].runs).toBe(2);
        expect(arr2[0].success).toBe(1);
        expect(arr2[0].trust).toBeGreaterThanOrEqual(0.1);
    });
});
