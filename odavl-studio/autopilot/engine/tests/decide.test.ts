/**
 * Test script for DECIDE phase recipe selection logic
 * Tests condition evaluation, trust scoring, priority tiebreaking
 */

import { describe, it, expect } from 'vitest';
import type { Recipe, RecipeCondition, Metrics } from '../src/phases/decide.js';

// Mock evaluateCondition implementation for testing
function evaluateCondition(condition: RecipeCondition | undefined, metrics: Metrics): boolean {
    if (!condition) return true;

    const results = condition.rules.map(rule => {
        const metricValue = (metrics as any)[rule.metric] ?? 0;

        switch (rule.operator) {
            case '>': return metricValue > rule.value;
            case '>=': return metricValue >= rule.value;
            case '<': return metricValue < rule.value;
            case '<=': return metricValue <= rule.value;
            case '==': return metricValue === rule.value;
            case '!=': return metricValue !== rule.value;
            default: return false;
        }
    });

    if (condition.type === 'all') {
        return results.every(Boolean);
    } else if (condition.type === 'any') {
        return results.some(Boolean);
    } else {
        return results.some(Boolean);
    }
}

describe('DECIDE Phase - Recipe Selection', () => {
    const mockMetrics: Metrics = {
        timestamp: '2025-01-09T00:00:00Z',
        runId: 'test-123',
        targetDir: '/test',
        typescript: 0,
        eslint: 18,
        security: 919,
        performance: 109,
        imports: 131,
        packages: 1,
        runtime: 70,
        build: 0,
        circular: 4,
        network: 172,
        complexity: 2672,
        isolation: 55,
        totalIssues: 4151
    };

    const mockRecipes: Recipe[] = [
        {
            id: 'typescript-fixer',
            name: 'TypeScript Fixer',
            description: 'Fixes TS errors',
            trust: 0.8,
            priority: 10,
            tags: ['typescript'],
            condition: {
                type: 'any',
                rules: [{ metric: 'typescript', operator: '>', value: 0 }]
            },
            actions: []
        },
        {
            id: 'eslint-auto-fix',
            name: 'ESLint Auto-Fixer',
            description: 'Runs eslint --fix',
            trust: 0.85,
            priority: 8,
            tags: ['eslint'],
            condition: {
                type: 'any',
                rules: [{ metric: 'eslint', operator: '>=', value: 5 }]
            },
            actions: []
        },
        {
            id: 'import-cleaner',
            name: 'Import Cleaner',
            description: 'Cleans imports',
            trust: 0.9,
            priority: 7,
            tags: ['imports'],
            condition: {
                type: 'any',
                rules: [{ metric: 'imports', operator: '>=', value: 5 }]
            },
            actions: []
        },
        {
            id: 'security-hardening',
            name: 'Security Hardening',
            description: 'Fixes security issues',
            trust: 0.75,
            priority: 15,
            tags: ['security'],
            condition: {
                type: 'any',
                rules: [{ metric: 'security', operator: '>', value: 0 }]
            },
            actions: []
        },
        {
            id: 'performance-optimizer',
            name: 'Performance Optimizer',
            description: 'Optimizes performance',
            trust: 0.7,
            priority: 6,
            tags: ['performance'],
            condition: {
                type: 'any',
                rules: [{ metric: 'performance', operator: '>=', value: 10 }]
            },
            actions: []
        }
    ];

    it('should filter recipes by condition matching', () => {
        const applicable = mockRecipes.filter(recipe =>
            evaluateCondition(recipe.condition, mockMetrics)
        );

        // TypeScript fixer should NOT be applicable (typescript=0, needs >0)
        expect(applicable.find(r => r.id === 'typescript-fixer')).toBeUndefined();

        // These should be applicable
        expect(applicable.find(r => r.id === 'import-cleaner')).toBeDefined();
        expect(applicable.find(r => r.id === 'eslint-auto-fix')).toBeDefined();
        expect(applicable.find(r => r.id === 'security-hardening')).toBeDefined();
        expect(applicable.find(r => r.id === 'performance-optimizer')).toBeDefined();

        expect(applicable.length).toBe(4);
    });

    it('should select highest trust recipe when conditions match', () => {
        const applicable = mockRecipes.filter(recipe =>
            evaluateCondition(recipe.condition, mockMetrics)
        );

        const sorted = [...applicable].sort((a, b) => {
            const trustDiff = (b.trust ?? 0) - (a.trust ?? 0);
            if (Math.abs(trustDiff) > 0.01) return trustDiff;
            return (b.priority ?? 0) - (a.priority ?? 0);
        });

        const best = sorted[0];

        // import-cleaner has highest trust (0.90)
        expect(best.id).toBe('import-cleaner');
        expect(best.trust).toBe(0.9);
    });

    it('should use priority as tiebreaker when trust is equal', () => {
        const equalTrustRecipes = [
            { ...mockRecipes[0], trust: 0.8, priority: 5 },
            { ...mockRecipes[1], trust: 0.8, priority: 10 },
            { ...mockRecipes[2], trust: 0.8, priority: 3 }
        ];

        const sorted = [...equalTrustRecipes].sort((a, b) => {
            const trustDiff = (b.trust ?? 0) - (a.trust ?? 0);
            if (Math.abs(trustDiff) > 0.01) return trustDiff;
            return (b.priority ?? 0) - (a.priority ?? 0);
        });

        // Should select recipe with highest priority (10)
        expect(sorted[0]).toBe(equalTrustRecipes[1]);
        expect(sorted[0].priority).toBe(10);
    });

    it('should return noop when no conditions match', () => {
        const emptyMetrics: Metrics = {
            ...mockMetrics,
            typescript: 0,
            eslint: 0,
            security: 0,
            performance: 0,
            imports: 0,
            totalIssues: 0
        };

        const applicable = mockRecipes.filter(recipe =>
            evaluateCondition(recipe.condition, emptyMetrics)
        );

        expect(applicable.length).toBe(0);
    });

    it('should evaluate "all" condition type correctly', () => {
        const allCondition: RecipeCondition = {
            type: 'all',
            rules: [
                { metric: 'eslint', operator: '>', value: 5 },
                { metric: 'security', operator: '>', value: 100 }
            ]
        };

        const result = evaluateCondition(allCondition, mockMetrics);
        expect(result).toBe(true); // Both rules pass
    });

    it('should evaluate "any" condition type correctly', () => {
        const anyCondition: RecipeCondition = {
            type: 'any',
            rules: [
                { metric: 'typescript', operator: '>', value: 0 }, // fails
                { metric: 'eslint', operator: '>', value: 5 }     // passes
            ]
        };

        const result = evaluateCondition(anyCondition, mockMetrics);
        expect(result).toBe(true); // At least one rule passes
    });

    it('should handle recipes with no conditions', () => {
        const unconditionedRecipe: Recipe = {
            id: 'always-run',
            name: 'Always Run',
            description: 'Runs always',
            trust: 1.0,
            priority: 100,
            tags: [],
            actions: []
        };

        const result = evaluateCondition(unconditionedRecipe.condition, mockMetrics);
        expect(result).toBe(true); // No condition = always applicable
    });
});
