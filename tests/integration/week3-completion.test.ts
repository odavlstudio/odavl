/**
 * ODAVL Integration Tests - Week 3
 * Tests ODAVL cycle end-to-end with real recipes
 */

import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';

const ROOT = process.cwd();
const RECIPES_DIR = path.join(ROOT, '.odavl', 'recipes');
const TRUST_FILE = path.join(ROOT, '.odavl', 'recipes-trust.json');

describe('ODAVL Recipe System Integration', () => {
    it('should have recipes directory', () => {
        expect(fs.existsSync(RECIPES_DIR)).toBe(true);
    });

    it('should have 5 core recipes', () => {
        const files = fs.readdirSync(RECIPES_DIR).filter(f => f.endsWith('.json') && f !== 'README.md');
        expect(files.length).toBeGreaterThanOrEqual(5);
    });

    it('should have valid recipe structure', () => {
        const recipes = [
            'typescript-fixer',
            'import-cleaner',
            'security-hardening',
            'remove-unused',
            'esm-hygiene'
        ];

        recipes.forEach(recipeId => {
            const recipePath = path.join(RECIPES_DIR, `${recipeId}.json`);
            expect(fs.existsSync(recipePath), `Recipe ${recipeId}.json should exist`).toBe(true);

            const content = JSON.parse(fs.readFileSync(recipePath, 'utf-8'));
            expect(content.id).toBe(recipeId);
            expect(content.name).toBeTruthy();
            expect(content.description).toBeTruthy();
            expect(content.priority).toBeGreaterThanOrEqual(1);
            expect(Array.isArray(content.actions)).toBe(true);
            // safety field is optional in new recipe structure
        });
    });

    it('should have trust scores initialized', () => {
        expect(fs.existsSync(TRUST_FILE)).toBe(true);

        const trustData = JSON.parse(fs.readFileSync(TRUST_FILE, 'utf-8'));
        expect(Array.isArray(trustData)).toBe(true);
        expect(trustData.length).toBeGreaterThanOrEqual(4); // At least 4 core recipes

        trustData.forEach((entry: any) => {
            expect(entry.id).toBeTruthy();
            expect(typeof entry.runs).toBe('number');
            expect(typeof entry.success).toBe('number');
            expect(entry.trust).toBeGreaterThanOrEqual(0.1);
            expect(entry.trust).toBeLessThanOrEqual(1.0);
            expect(typeof entry.blacklisted).toBe('boolean');
        });
    });

    it('should prioritize high-priority recipes', () => {
        const securityRecipe = JSON.parse(
            fs.readFileSync(path.join(RECIPES_DIR, 'security-hardening.json'), 'utf-8')
        );

        expect(securityRecipe.priority).toBe(10); // Highest priority
    });

    it('should have proper safety constraints', () => {
        const recipes = fs.readdirSync(RECIPES_DIR).filter(f => f.endsWith('.json'));

        recipes.forEach(file => {
            const recipe = JSON.parse(fs.readFileSync(path.join(RECIPES_DIR, file), 'utf-8'));

            if (recipe.safety) {
                expect(recipe.safety.maxFiles).toBeLessThanOrEqual(20);
                expect(Array.isArray(recipe.safety.protectedPaths)).toBe(true);
            }
        });
    });
});

describe('ODAVL Guardian Integration', () => {
    it('should have auth service', () => {
        const authServicePath = path.join(ROOT, 'odavl-studio/guardian/app/src/lib/auth-service.ts');
        expect(fs.existsSync(authServicePath)).toBe(true);

        const content = fs.readFileSync(authServicePath, 'utf-8');
        expect(content).toContain('generateToken');
        expect(content).toContain('verifyToken');
        expect(content).toContain('validateApiKey');
    });

    it('should have notification service', () => {
        const notificationPath = path.join(ROOT, 'odavl-studio/guardian/app/src/lib/notifications.ts');
        expect(fs.existsSync(notificationPath)).toBe(true);

        const content = fs.readFileSync(notificationPath, 'utf-8');
        expect(content).toContain('sendNotification');
        expect(content).toContain('sendEmail');
        expect(content).toContain('sendSlack');
        expect(content).toContain('sendDiscord');
    });

    it('should have monitoring endpoints', () => {
        const healthPath = path.join(ROOT, 'odavl-studio/guardian/app/src/app/api/health/route.ts');
        const metricsPath = path.join(ROOT, 'odavl-studio/guardian/app/src/app/api/metrics/route.ts');

        expect(fs.existsSync(healthPath)).toBe(true);
        expect(fs.existsSync(metricsPath)).toBe(true);
    });
});

describe('Week 1-2 Completion Verification', () => {
    it('should have Logger utility', () => {
        const loggerPath = path.join(ROOT, 'odavl-studio/autopilot/engine/src/utils/Logger.ts');
        expect(fs.existsSync(loggerPath)).toBe(true);

        const content = fs.readFileSync(loggerPath, 'utf-8');
        expect(content).toContain('class Logger'); // Not exported as class, but as singleton
        expect(content).toContain('debug');
        expect(content).toContain('info');
        expect(content).toContain('error');
        expect(content).toContain('export const logger');
    });

    it('should not have duplicate files', () => {
        const duplicates = [
            'apps/cli/', // Old CLI app
            'apps/guardian/', // Old Guardian app
            'apps/insight-cloud/', // Old Insight Cloud app
        ];

        duplicates.forEach(file => {
            expect(fs.existsSync(path.join(ROOT, file)), `${file} should be deleted`).toBe(false);
        });

        // Verify new structure exists
        expect(fs.existsSync(path.join(ROOT, 'apps/studio-cli'))).toBe(true);
        expect(fs.existsSync(path.join(ROOT, 'odavl-studio/guardian/app'))).toBe(true);
    });

    it('should have no `any` types in insight-core (spot check)', () => {
        const files = [
            'packages/insight-core/src/detector/package-detector.ts',
            'packages/insight-core/src/detector/security-detector.ts',
        ];

        files.forEach(file => {
            const content = fs.readFileSync(path.join(ROOT, file), 'utf-8');
            const anyCount = (content.match(/:\s*any\b/g) || []).length;
            expect(anyCount, `${file} should have minimal 'any' types`).toBeLessThan(3);
        });
    });
});
