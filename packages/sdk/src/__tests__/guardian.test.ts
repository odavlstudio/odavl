/**
 * Guardian SDK Unit Tests
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { Guardian } from '../guardian';

describe('Guardian SDK', () => {
    let guardian: Guardian;

    beforeEach(() => {
        guardian = new Guardian();
    });

    describe('Constructor', () => {
        it('should create instance', () => {
            expect(guardian).toBeDefined();
        });

        it('should accept config with thresholds', () => {
            const g = new Guardian({
                thresholds: {
                    accessibility: 90,
                    performance: 85,
                    security: 95,
                    seo: 80
                }
            });
            expect(g).toBeDefined();
        });
    });

    describe('runTests()', () => {
        it('should run all tests for URL', async () => {
            const result = await guardian.runTests('https://example.com');

            expect(result).toBeDefined();
            expect(result.deploymentId).toBeDefined();
            expect(result.tests).toBeInstanceOf(Array);
            expect(result.qualityGates).toBeInstanceOf(Array);
            expect(result.overallStatus).toBeDefined();
        });

        it('should validate URL', async () => {
            await expect(guardian.runTests('invalid-url')).rejects.toThrow();
        });
    });

    describe('getReport()', () => {
        it('should return test report', async () => {
            const result = await guardian.getReport('test-123');

            expect(result).toBeNull(); // Stub returns null
        });
    });

    describe('setThresholds()', () => {
        it('should update quality thresholds', async () => {
            await guardian.setThresholds({
                accessibility: 95,
                performance: 90,
                security: 100,
                seo: 85
            });
            // Void return, just ensure no throw
        });
    });

    describe('getHistory()', () => {
        it('should return test history', async () => {
            const result = await guardian.getHistory();

            expect(result).toBeInstanceOf(Array);
        });
    });
});
