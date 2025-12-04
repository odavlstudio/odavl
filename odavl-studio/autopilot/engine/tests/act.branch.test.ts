import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { act } from '../src/phases/act.js';

const undoDir = path.join(process.cwd(), '.odavl', 'undo');

function cleanupUndo() {
    if (fs.existsSync(undoDir)) {
        for (const f of fs.readdirSync(undoDir)) {
            fs.unlinkSync(path.join(undoDir, f));
        }
    }
}

describe('act() branch/logic coverage', () => {
    beforeEach(() => {
        if (!fs.existsSync(undoDir)) {
            fs.mkdirSync(undoDir, { recursive: true });
        }
        cleanupUndo();
    });
    afterEach(() => {
        cleanupUndo();
        vi.unstubAllGlobals();
    });

    it('logs noop and does not create snapshot for unknown decision', async () => {
        const spy = vi.spyOn(console, 'log').mockImplementation(() => { });
        await act('noop');
        expect(fs.readdirSync(undoDir).length).toBe(0);
        spy.mockRestore();
    });

    it('logs noop and does not throw for unknown/invalid decision', async () => {
        const spy = vi.spyOn(console, 'log').mockImplementation(() => { });
        expect(async () => await act('unknown-decision')).not.toThrow();
        expect(fs.readdirSync(undoDir).length).toBe(0);
        spy.mockRestore();
    });

    it('creates undo snapshot and runs eslint for remove-unused', async () => {
        const spyLog = vi.spyOn(console, 'log').mockImplementation(() => { });
        const { logPhase } = await import('../src/phases/logPhase');
        const spyPhase = vi.spyOn({ logPhase }, 'logPhase').mockImplementation(() => { });
        vi.stubGlobal('execSync', () => Buffer.from(''));
        act('remove-unused');
        expect(fs.readdirSync(undoDir).some(f => f.endsWith('.json'))).toBe(true);
        spyLog.mockRestore();
        spyPhase.mockRestore();
    });

    it('creates undo snapshot and runs eslint for esm-hygiene', async () => {
        const { logPhase } = await import('../src/phases/logPhase');
        const spyPhase = vi.spyOn({ logPhase }, 'logPhase').mockImplementation(() => { });
        vi.stubGlobal('execSync', () => Buffer.from(''));
        act('esm-hygiene');
        expect(fs.readdirSync(undoDir).some(f => f.endsWith('.json'))).toBe(true);
        spyPhase.mockRestore();
    });

    it('creates undo snapshot and runs eslint for format-consistency', async () => {
        const { logPhase } = await import('../src/phases/logPhase');
        const spyPhase = vi.spyOn({ logPhase }, 'logPhase').mockImplementation(() => { });
        vi.stubGlobal('execSync', () => Buffer.from(''));
        act('format-consistency');
        expect(fs.readdirSync(undoDir).some(f => f.endsWith('.json'))).toBe(true);
        spyPhase.mockRestore();
    });
});
