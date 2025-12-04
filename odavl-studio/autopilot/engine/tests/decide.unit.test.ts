import { describe, it, expect } from 'vitest';
import { decide } from '../src/phases/decide';

describe('phases/decide', () => {
    it('decide() returns a string (noop or recipe)', async () => {
        // Minimal valid Metrics object
        const metrics = {
            eslintWarnings: 0,
            typeErrors: 0,
            eslintErrors: 0,
            totalFiles: 0
        };
        const result = await decide(metrics as any);
        expect(typeof result).toBe('string');
        expect(result.length).toBeGreaterThan(0);
    });

    it('decide() handles metrics with errors', async () => {
        const metrics = {
            eslintWarnings: 5,
            typeErrors: 2,
            eslintErrors: 1,
            totalFiles: 10
        };
        const result = await decide(metrics as any);
        expect(typeof result).toBe('string');
    });
});
