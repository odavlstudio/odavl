/**
 * Python Imports Detector Tests
 * Tests for isort integration and import organization
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { PythonImportsDetector } from '../../../src/detector/python/python-imports-detector.js';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('PythonImportsDetector', () => {
    const testFixturesDir = path.join(__dirname, '../../../../../../test-fixtures/python');
    let detector: PythonImportsDetector;

    beforeAll(() => {
        detector = new PythonImportsDetector(testFixturesDir);
    });

    describe('Basic Functionality', () => {
        it('should create detector instance', () => {
            expect(detector).toBeDefined();
            expect(detector).toBeInstanceOf(PythonImportsDetector);
        });

        it('should detect import issues', async () => {
            const issues = await detector.detect();
            expect(issues).toBeDefined();
            expect(Array.isArray(issues)).toBe(true);
            expect(issues.length).toBeGreaterThan(0);
        });
    });

    describe('Import Organization', () => {
        it('should detect unsorted imports', async () => {
            const issues = await detector.detect();
            // isort reports import order issues
            expect(issues.length).toBeGreaterThan(0);
            // Check that issues are related to imports
            const importIssues = issues.filter(i => 
                i.category === 'import-order' || i.category === 'imports'
            );
            expect(importIssues.length).toBeGreaterThan(0);
        });

        it('should detect incorrect import sections', async () => {
            const issues = await detector.detect();
            // isort organizes imports into: stdlib, third-party, local
            expect(issues.length).toBeGreaterThan(0);
        });
    });

    describe('Unused Imports', () => {
        it('should detect unused imports', async () => {
            const issues = await detector.detect();
            const unusedImports = issues.filter(i =>
                i.message.toLowerCase().includes('unused')
            );
            // test_imports.py imports random but never uses it
            expect(unusedImports.length).toBeGreaterThan(0);
        });
    });

    describe('Severity Levels', () => {
        it('should assign appropriate severity', async () => {
            const issues = await detector.detect();
            issues.forEach(issue => {
                expect(['error', 'warning', 'info']).toContain(issue.severity);
            });
        });

        it('should have appropriate severity', async () => {
            const issues = await detector.detect();
            const warnings = issues.filter(i => i.severity === 'warning');
            const info = issues.filter(i => i.severity === 'info');
            // Import issues can be warnings or info
            expect(warnings.length + info.length).toBeGreaterThan(0);
        });
    });

    describe('File Coverage', () => {
        it('should analyze test_imports.py', async () => {
            const issues = await detector.detect();
            const importsFileIssues = issues.filter(i => i.file.includes('test_imports.py'));
            expect(importsFileIssues.length).toBeGreaterThan(0);
        });

        it('should report correct file paths', async () => {
            const issues = await detector.detect();
            issues.forEach(issue => {
                expect(issue.file.endsWith('.py')).toBe(true);
                expect(issue.file).not.toContain('\\');
            });
        });
    });

    describe('Recommendations', () => {
        it('should provide import organization recommendations', async () => {
            const issues = await detector.detect();
            const issuesWithRecommendations = issues.filter(i => i.recommendation);
            expect(issuesWithRecommendations.length).toBeGreaterThan(0);
        });

        it('should suggest isort for fixing', async () => {
            const issues = await detector.detect();
            if (issues.length > 0) {
                const recommendations = issues.map(i => i.recommendation).filter(Boolean);
                const mentionsIsort = recommendations.some(r => 
                    r?.toLowerCase().includes('isort') || r?.toLowerCase().includes('organize')
                );
                expect(mentionsIsort).toBe(true);
            }
        });
    });

    describe('Error Handling', () => {
        it('should handle missing isort', async () => {
            const issues = await detector.detect();
            expect(issues).toBeDefined();
            expect(Array.isArray(issues)).toBe(true);
        });

        it('should not throw on execution', async () => {
            await expect(detector.detect()).resolves.not.toThrow();
        });
    });

    describe('Performance', () => {
        it('should complete in reasonable time', async () => {
            const startTime = Date.now();
            await detector.detect();
            const duration = Date.now() - startTime;
            
            // Python detectors call external tools (isort), need more time
            expect(duration).toBeLessThan(15000);
        }, 20000);
    });

    describe('Integration', () => {
        it('should categorize as imports', async () => {
            const issues = await detector.detect();
            issues.forEach(issue => {
                if (issue.category !== 'setup' && issue.category !== 'detector') {
                    // isort and other tools use various import-related categories
                    expect(['imports', 'import-order', 'unused-import']).toContain(issue.category);
                }
            });
        });

        it('should provide line numbers', async () => {
            const issues = await detector.detect();
            issues.forEach(issue => {
                expect(issue.line).toBeGreaterThan(0);
            });
        });
    });
});
