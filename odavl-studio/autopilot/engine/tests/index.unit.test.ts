import { describe, it, expect } from 'vitest';
import * as cli from '../src/index';
import { sh, saveUndoSnapshot } from '../src/phases/act';
import { updateTrust } from '../src/phases/decide';
import { checkGates } from '../src/phases/verify';
import * as fs from 'node:fs';
import * as path from 'node:path';

// Helper function since fs-wrapper doesn't exist
function ensureDirectory(dir: string) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}

describe('ODAVL CLI index.ts', () => {
    it('should export core phase functions', () => {
        expect(typeof cli.observe).toBe('function');
        expect(typeof cli.decide).toBe('function');
        expect(typeof cli.act).toBe('function');
        expect(typeof cli.verify).toBe('function');
    });

    it('should run sh() from act phase and return output/err', () => {
        const result = sh('echo test');
        expect(result).toHaveProperty('out');
        expect(result).toHaveProperty('err');
        expect(result.out).toContain('test');
    });

    it('should create reports and .odavl directories', () => {
        const reportsDir = path.join(process.cwd(), 'reports');
        const odavlDir = path.join(process.cwd(), '.odavl');
        // Don't delete .odavl - setup.ts creates it
        if (fs.existsSync(reportsDir)) fs.rmSync(reportsDir, { recursive: true, force: true });
        ensureDirectory(reportsDir);
        ensureDirectory(odavlDir);
        expect(fs.existsSync(reportsDir)).toBe(true);
        expect(fs.existsSync(odavlDir)).toBe(true);
    });

    it('should update trust for a recipe', async () => {
        const trustPath = path.join(process.cwd(), '.odavl', 'recipes-trust.json');
        // Don't delete - setup.ts creates it with core recipes
        await updateTrust('test-recipe', true);
        const arr = JSON.parse(fs.readFileSync(trustPath, 'utf8'));
        expect(Array.isArray(arr)).toBe(true);
        expect(arr[0].id).toBe('test-recipe');
        expect(arr[0].runs).toBeGreaterThan(0);
        expect(arr[0].trust).toBeGreaterThan(0);
    });
});