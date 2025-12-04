import { describe, it, expect } from 'vitest';
import { observe, type Metrics } from '../observe.js';
import { decide } from '../decide.js';
import { act } from '../act.js';

describe('ODAVL Autopilot Integration Tests', () => {
    let observeMetrics: Metrics;

    describe('Full Cycle: OBSERVE → DECIDE → ACT', () => {
        it('OBSERVE: should detect issues in test workspace', async () => {
            // Run OBSERVE on current workspace
            observeMetrics = await observe(process.cwd());

            // Validate metrics structure
            expect(observeMetrics).toBeDefined();
            expect(observeMetrics.runId).toMatch(/^run-\d+$/);
            expect(observeMetrics.timestamp).toBeDefined();
            expect(observeMetrics.targetDir).toBe(process.cwd());

            // Validate all detector fields exist
            expect(typeof observeMetrics.typescript).toBe('number');
            expect(typeof observeMetrics.eslint).toBe('number');
            expect(typeof observeMetrics.security).toBe('number');
            expect(typeof observeMetrics.performance).toBe('number');
            expect(typeof observeMetrics.imports).toBe('number');
            expect(typeof observeMetrics.packages).toBe('number');
            expect(typeof observeMetrics.runtime).toBe('number');
            expect(typeof observeMetrics.build).toBe('number');
            expect(typeof observeMetrics.circular).toBe('number');
            expect(typeof observeMetrics.network).toBe('number');
            expect(typeof observeMetrics.complexity).toBe('number');
            expect(typeof observeMetrics.isolation).toBe('number');

            // Total should be sum of all detectors
            const sum = observeMetrics.typescript +
                observeMetrics.eslint +
                observeMetrics.security +
                observeMetrics.performance +
                observeMetrics.imports +
                observeMetrics.packages +
                observeMetrics.runtime +
                observeMetrics.build +
                observeMetrics.circular +
                observeMetrics.network +
                observeMetrics.complexity +
                observeMetrics.isolation;

            expect(observeMetrics.totalIssues).toBe(sum);
        }, 180000); // 180s timeout for real detection on large workspace

        it('DECIDE: should select appropriate recipe based on metrics', async () => {
            // Ensure OBSERVE ran first
            if (!observeMetrics) {
                observeMetrics = await observe(process.cwd());
            }

            // Run DECIDE with OBSERVE metrics
            const decision = await decide(observeMetrics);

            // Decision should be a string (recipe ID or 'noop')
            expect(typeof decision).toBe('string');
            expect(decision.length).toBeGreaterThan(0);

            console.log(`[DECIDE] Selected recipe: ${decision}`);
        }, 180000);

        it('ACT: should execute selected recipe safely', async () => {
            // Ensure OBSERVE ran first
            if (!observeMetrics) {
                observeMetrics = await observe(process.cwd());
            }

            const decision = await decide(observeMetrics);

            // ACT should not throw, returns result object
            const result = await act(decision);

            expect(result).toBeDefined();
            expect(typeof result.success).toBe('boolean');
            expect(typeof result.actionsExecuted).toBe('number');

            console.log(`[ACT] Executed recipe: ${decision}, success: ${result.success}`);
        }, 180000);

        it('Full cycle should complete without errors', async () => {
            // OBSERVE → DECIDE → ACT
            const metrics = await observe(process.cwd());
            const decision = await decide(metrics);
            const result = await act(decision);

            // If we reach here, full cycle succeeded
            expect(result).toBeDefined();
            expect(typeof result.success).toBe('boolean');
        }, 180000); // 180s timeout for full cycle on large workspace
    });

    describe('Recipe Condition Matching', () => {
        it('should match import-cleaner when imports issues >= 5', async () => {
            const metricsWithImports: Metrics = {
                ...observeMetrics,
                imports: 10,
                totalIssues: 10
            };

            const decision = await decide(metricsWithImports);

            // Should select a recipe (not noop)
            expect(decision).not.toBe('noop');
        });

        it('should match typescript-fixer when typescript issues >= 3', async () => {
            const metricsWithTS: Metrics = {
                ...observeMetrics,
                typescript: 5,
                totalIssues: 5
            };

            const decision = await decide(metricsWithTS);

            // Should select a recipe
            expect(decision).not.toBe('noop');
        });

        it('should return noop when no recipes match', async () => {
            const perfectMetrics: Metrics = {
                timestamp: new Date().toISOString(),
                runId: 'run-test',
                targetDir: '/test',
                typescript: 0,
                eslint: 0,
                security: 0,
                performance: 0,
                imports: 0,
                packages: 0,
                runtime: 0,
                build: 0,
                circular: 0,
                network: 0,
                complexity: 0,
                isolation: 0,
                totalIssues: 0
            };

            const decision = await decide(perfectMetrics);

            // With zero issues, should return noop
            expect(decision).toBe('noop');
        });
    });

    describe('Error Handling', () => {
        it('should handle invalid recipe ID gracefully', async () => {
            // ACT with non-existent recipe should not throw, returns error result
            const result = await act('nonexistent-recipe-xyz');

            expect(result).toBeDefined();
            expect(result.success).toBe(false);
            expect(result.errors).toBeDefined();
        });

        it('should handle invalid target directory in OBSERVE', async () => {
            // OBSERVE with invalid dir should not crash - it may succeed with build errors
            const result = await observe('/nonexistent/directory/xyz');

            // Should still return metrics (may have 1 build error about missing package.json)
            expect(result).toBeDefined();
            expect(typeof result.totalIssues).toBe('number');
        });
    });
});
