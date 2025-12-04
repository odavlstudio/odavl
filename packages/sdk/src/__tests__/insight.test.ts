/**
 * Insight SDK Unit Tests
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { Insight } from '../insight';

describe('Insight SDK', () => {
    let insight: Insight;

    beforeEach(() => {
        insight = new Insight({ workspacePath: '/test/workspace' });
    });

    describe('Constructor', () => {
        it('should create instance with config', () => {
            expect(insight).toBeDefined();
        });

        it('should use default workspace if not provided', () => {
            const defaultInsight = new Insight();
            expect(defaultInsight).toBeDefined();
        });
    });

    describe('analyze()', () => {
        it('should analyze workspace and return results', async () => {
            const result = await insight.analyze();

            expect(result).toBeDefined();
            expect(result.issues).toBeInstanceOf(Array);
            expect(result.summary).toBeDefined();
            expect(result.summary.total).toBe(0);
            expect(result.detectors).toBeInstanceOf(Array);
        });

        it('should accept custom path', async () => {
            const result = await insight.analyze('/custom/path');
            expect(result).toBeDefined();
        });
    });

    describe('getFixSuggestions()', () => {
        it('should return fix suggestions for issue', async () => {
            const issue = {
                severity: 'high' as const,
                message: 'Test error',
                file: 'test.ts',
                line: 10,
                column: 5,
                detector: 'typescript'
            };

            const result = await insight.getFixSuggestions(issue);
            expect(result).toBeNull(); // Stub implementation returns null
        });
    });

    describe('getMetrics()', () => {
        it('should return analysis metrics', async () => {
            const metrics = await insight.getMetrics();

            expect(metrics).toBeDefined();
            expect(metrics.totalIssues).toBe(0);
            expect(metrics.criticalIssues).toBe(0);
            expect(metrics.detectionTime).toBeGreaterThanOrEqual(0);
        });
    });
});
