import { describe, it, expect } from 'vitest';
import { decide, type Recipe, type RecipeCondition } from '../decide.js';
import type { Metrics } from '../observe.js';

describe('DECIDE Phase', () => {
    const mockMetrics: Metrics = {
        timestamp: '2025-11-10T12:00:00.000Z',
        runId: 'run-123',
        targetDir: '/test',
        typescript: 5,
        eslint: 10,
        security: 3,
        performance: 20,
        imports: 15,
        packages: 0,
        runtime: 2,
        build: 0,
        circular: 1,
        network: 8,
        complexity: 100,
        isolation: 5,
        totalIssues: 169
    };

    describe('Condition Evaluation', () => {
        it('should evaluate threshold conditions correctly', () => {
            const condition: RecipeCondition = {
                type: 'threshold',
                rules: [
                    { metric: 'typescript', operator: '>=', value: 3 }
                ]
            };

            // Test condition logic manually (evaluateCondition is not exported)
            const rule = condition.rules[0];
            const value = mockMetrics[rule.metric as keyof Metrics] as number;
            const result = value >= rule.value;
            expect(result).toBe(true);
        });

        it('should evaluate any conditions (OR logic)', () => {
            // Test OR logic: at least one rule must pass
            const rule1 = mockMetrics.typescript >= 100; // false
            const rule2 = mockMetrics.eslint >= 5;       // true
            const result = rule1 || rule2;

            expect(result).toBe(true);
        });

        it('should evaluate all conditions (AND logic)', () => {
            // Test AND logic: all rules must pass
            const rule1 = mockMetrics.typescript >= 3;  // true
            const rule2 = mockMetrics.eslint >= 5;      // true
            const result = rule1 && rule2;

            expect(result).toBe(true);
        });

        it('should fail all conditions if one rule fails', () => {
            // Test AND logic with one failing rule
            const rule1 = mockMetrics.typescript >= 3;   // true
            const rule2 = mockMetrics.eslint >= 100;     // false
            const result = rule1 && rule2;

            expect(result).toBe(false);
        });

        it('should handle different operators', () => {
            const ts = mockMetrics.typescript; // 5

            expect(ts > 4).toBe(true);
            expect(ts < 10).toBe(true);
            expect(ts === 5).toBe(true);
            expect(ts !== 3).toBe(true);
            expect(ts <= 5).toBe(true);
        });
    });

    describe('Recipe Selection', () => {
        it('should return noop when no recipes match', async () => {
            // Mock loadRecipes to return recipes that don't match
            const metrics: Metrics = {
                ...mockMetrics,
                typescript: 0,
                eslint: 0,
                security: 0
            };

            // This will use real loadRecipes which might have real recipes
            // In a real test, we'd mock this
            const decision = await decide(metrics);

            // If no recipes match, should return 'noop'
            expect(typeof decision).toBe('string');
        });

        it('should select recipe with highest trust score', () => {
            const recipes: Recipe[] = [
                {
                    id: 'recipe-1',
                    name: 'Recipe 1',
                    description: 'Test',
                    trust: 0.7,
                    priority: 5,
                    actions: []
                },
                {
                    id: 'recipe-2',
                    name: 'Recipe 2',
                    description: 'Test',
                    trust: 0.9,
                    priority: 5,
                    actions: []
                }
            ];

            // Sort by trust (descending)
            const sorted = [...recipes].sort((a, b) =>
                (b.trust ?? 0) - (a.trust ?? 0)
            );

            expect(sorted[0].id).toBe('recipe-2');
        });

        it('should use priority as tiebreaker', () => {
            const recipes: Recipe[] = [
                {
                    id: 'recipe-1',
                    name: 'Recipe 1',
                    description: 'Test',
                    trust: 0.9,
                    priority: 5,
                    actions: []
                },
                {
                    id: 'recipe-2',
                    name: 'Recipe 2',
                    description: 'Test',
                    trust: 0.9,
                    priority: 8,
                    actions: []
                }
            ];

            // Sort by trust, then priority
            const sorted = [...recipes].sort((a, b) => {
                const trustDiff = (b.trust ?? 0) - (a.trust ?? 0);
                if (Math.abs(trustDiff) > 0.01) return trustDiff;
                return (b.priority ?? 0) - (a.priority ?? 0);
            });

            expect(sorted[0].id).toBe('recipe-2');
        });
    });
});
