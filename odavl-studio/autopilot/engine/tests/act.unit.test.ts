
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as actModule from '../src/phases/act';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as cpw from '../src/phases/cp-wrapper';
import * as logPhaseModule from '../src/phases/logPhase';

describe('phases/act', () => {
    const undoDir = path.join(process.cwd(), '.odavl', 'undo');

    beforeEach(() => {
        if (!fs.existsSync(undoDir)) {
            fs.mkdirSync(undoDir, { recursive: true });
        }
        // Clean up any existing undo files (skip latest.json - it's written by setup.ts)
        const files = fs.readdirSync(undoDir);
        for (const f of files) {
            if (f !== 'latest.json') { // Skip symlink/auto-generated file
                try {
                    fs.unlinkSync(path.join(undoDir, f));
                } catch { }
            }
        }
        vi.restoreAllMocks();
    });

    afterEach(() => {
        // Clean up test files (skip latest.json)
        const files = fs.readdirSync(undoDir);
        for (const f of files) {
            if (f !== 'latest.json') {
                try {
                    fs.unlinkSync(path.join(undoDir, f));
                } catch { }
            }
        }
        vi.restoreAllMocks();
    });

    it('saveUndoSnapshot() creates a snapshot file', async () => {
        const testFile = path.join(process.cwd(), 'testfile.txt');
        fs.writeFileSync(testFile, 'test');
        await actModule.saveUndoSnapshot([testFile]);
        const files = fs.readdirSync(undoDir);
        expect(files.some(f => f.endsWith('.json'))).toBe(true);
        fs.unlinkSync(testFile);
    });

    it('act() logs noop for noop decision', async () => {
        const spy = vi.spyOn(logPhaseModule, 'logPhase');
        await actModule.act('noop');
        expect(spy).toHaveBeenCalledWith('ACT', 'noop (nothing to fix)', 'info');
    });

    it('act() logs error for unknown/invalid decision', async () => {
        const spy = vi.spyOn(logPhaseModule, 'logPhase');
        await actModule.act('unknown');
        // Unknown recipes log "Recipe not found" error, not noop
        expect(spy).toHaveBeenCalledWith('ACT', 'Recipe not found: unknown', 'error');
    });

    it('act() creates undo snapshot and runs eslint for remove-unused', async () => {
        const before = fs.readdirSync(undoDir).filter(f => f.startsWith('undo-')).length;
        const spyLog = vi.spyOn(logPhaseModule, 'logPhase');
        await actModule.act('remove-unused');
        const after = fs.readdirSync(undoDir).filter(f => f.startsWith('undo-')).length;
        expect(after).toBeGreaterThan(before); // Undo snapshot created
        expect(spyLog).toHaveBeenCalledWith('ACT', expect.stringContaining('Remove Unused Code'), 'info');
        expect(spyLog).toHaveBeenCalledWith('ACT', expect.stringContaining('Remove unused code'), 'info');
    });

    it('act() creates undo snapshot and runs eslint for esm-hygiene', async () => {
        const before = fs.readdirSync(undoDir).filter(f => f.startsWith('undo-')).length;
        const spyLog = vi.spyOn(logPhaseModule, 'logPhase');
        await actModule.act('esm-hygiene');
        const after = fs.readdirSync(undoDir).filter(f => f.startsWith('undo-')).length;
        expect(after).toBeGreaterThan(before); // Undo snapshot created
        expect(spyLog).toHaveBeenCalledWith('ACT', expect.stringContaining('ESM Hygiene'), 'info');
        expect(spyLog).toHaveBeenCalledWith('ACT', expect.stringContaining('Fix ESM issues'), 'info');
    });

    it('act() handles unknown recipe gracefully', async () => {
        const spyLog = vi.spyOn(logPhaseModule, 'logPhase');
        const result = await actModule.act('nonexistent-recipe');
        expect(result.success).toBe(false);
        expect(result.errors).toContain('Recipe not found: nonexistent-recipe');
        expect(spyLog).toHaveBeenCalledWith('ACT', 'Recipe not found: nonexistent-recipe', 'error');
        expect(spyLog).toHaveBeenCalledWith('ACT', 'Failed to load recipe: nonexistent-recipe', 'error');
    });

    it('sh() returns out and err on error', () => {
        const fakeError = { stdout: Buffer.from('out'), stderr: Buffer.from('err') };
        const spy = vi.spyOn(cpw, 'execSync').mockImplementation(() => { throw fakeError; });
        const result = (actModule as any).sh('badcmd');
        expect(result.out).toBe('out');
        expect(result.err).toBe('err');
        spy.mockRestore();
    });

    it('sh() returns out and empty err on success', () => {
        const spy = vi.spyOn(cpw, 'execSync').mockReturnValue(Buffer.from('good'));
        const result = (actModule as any).sh('goodcmd');
        expect(result.out).toBe('good');
        expect(result.err).toBe('');
        spy.mockRestore();
    });
});
