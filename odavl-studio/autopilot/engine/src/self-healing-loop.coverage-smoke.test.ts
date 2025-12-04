import { writeGoldenSnapshot } from './selfHealingLoop';
import { describe, it, expect } from 'vitest';

describe('self-healing-loop coverage smoke', () => {
    it('should call writeGoldenSnapshot', () => {
        // Minimal call with gatesPassed false (should do nothing)
        expect(() => writeGoldenSnapshot({ gatesPassed: false })).not.toThrow();
    });
});
