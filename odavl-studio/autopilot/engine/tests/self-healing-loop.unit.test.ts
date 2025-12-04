
import { writeGoldenSnapshot, appendEvidenceChain } from '../src/selfHealingLoop';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// In-memory fs/path/crypto mocks
function createFsMock() {
    let files: Record<string, string> = {};
    return {
        access: vi.fn().mockResolvedValue(undefined),
        mkdir: vi.fn().mockResolvedValue(undefined),
        readFile: vi.fn((p: string) => Promise.resolve(files[p])),
        writeFile: vi.fn((p: string, data: string) => { files[p] = data; return Promise.resolve(); }),
        appendFile: vi.fn((p: string, data: string) => { files[p] = (files[p] || '') + data; return Promise.resolve(); }),
        _set: (p: string, data: string) => { files[p] = data; },
        _get: (p: string) => files[p],
        _reset: () => { files = {}; }
    };
}
function createPathMock() {
    return {
        join: (...args: string[]) => args.join('/'),
    };
}
function createCryptoMock() {
    return {
        createHash: () => ({
            update: function () { return this; },
            digest: () => 'fakehash',
        }),
        randomBytes: () => ({ toString: () => 'fakesig' }),
    };
}

describe('self-healing-loop utilities', () => {
    let fs: any, path: any, crypto: any;
    beforeEach(() => {
        fs = createFsMock();
        path = createPathMock();
        crypto = createCryptoMock();
        fs._reset();
    });

    it('writeGoldenSnapshot does nothing if gatesPassed is false', async () => {
        await writeGoldenSnapshot({ gatesPassed: false }, { fs, path, crypto, root: '', now: () => 'now' });
        // Should not write any file
        expect(fs._get('/.odavl/golden/latest.json')).toBeUndefined();
    });

    it('writeGoldenSnapshot writes snapshot if gatesPassed', async () => {
        // Simulate files
        fs._set('/package.json', '{"name":"odavl"}');
        fs._set('/tsconfig.json', '{"compilerOptions":{}}');
        await writeGoldenSnapshot({ gatesPassed: true }, { fs, path, crypto, root: '', now: () => 'now' });
        const out = fs._get('/.odavl/golden/latest.json');
        expect(out).toContain('package.json');
        expect(out).toContain('fakehash');
    });

    it('appendEvidenceChain appends log with correct fields', async () => {
        const report = { decision: 'remove-unused', deltas: { a: 1 }, gatesPassed: true };
        await appendEvidenceChain(report, { fs, path, crypto, root: '', now: () => 'now', nowNum: () => 123 });
        const log = fs._get('/.odavl/evidence-chain.log');
        expect(log).toContain('ODAVL-123');
        expect(log).toContain('fakehash');
        expect(log).toContain('fakesig');
        expect(log).toContain('remove-unused');
    });
});

