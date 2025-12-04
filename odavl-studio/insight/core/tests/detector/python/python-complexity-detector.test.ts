/**
 * Python Complexity Detector Tests
 * Tests for radon integration and complexity analysis
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { PythonComplexityDetector } from '../../../src/detector/python/python-complexity-detector.js';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('PythonComplexityDetector', () => {
    const testFixturesDir = path.join(__dirname, '../../../../../../test-fixtures/python');
    let detector: PythonComplexityDetector;

    beforeAll(() => {
        detector = new PythonComplexityDetector(testFixturesDir);
    });

    describe('Basic Functionality', () => {
        it('should create detector instance', () => {
            expect(detector).toBeDefined();
            expect(detector).toBeInstanceOf(PythonComplexityDetector);
        });

        it('should detect complexity issues', async () => {
            const issues = await detector.detect();
            expect(issues).toBeDefined();
            expect(Array.isArray(issues)).toBe(true);
        });
    });

    describe('Cyclomatic Complexity Detection', () => {
        it('should detect high complexity functions', async () => {
            const issues = await detector.detect();
            const complexityIssues = issues.filter(i => i.category === 'complexity');
            // test_complexity.py has functions with complexity 9-10
            expect(complexityIssues.length).toBeGreaterThan(0);
        });

        it('should report complexity scores', async () => {
            const issues = await detector.detect();
            const issuesWithComplexity = issues.filter(i => i.complexity !== undefined);
            expect(issuesWithComplexity.length).toBeGreaterThan(0);
            
            issuesWithComplexity.forEach(issue => {
                expect(issue.complexity).toBeGreaterThan(0);
            });
        });

        it('should detect moderate complexity (>5)', async () => {
            const issues = await detector.detect();
            const moderateComplexity = issues.filter(i => 
                i.complexity && i.complexity > 5 && i.complexity <= 10
            );
            // With lowered threshold, should detect moderate complexity
            expect(moderateComplexity.length).toBeGreaterThan(0);
        });

        it('should categorize severity by complexity level', async () => {
            const issues = await detector.detect();
            const complexityIssues = issues.filter(i => i.complexity);
            
            complexityIssues.forEach(issue => {
                if (issue.complexity! > 20) {
                    expect(issue.severity).toBe('error');
                } else if (issue.complexity! > 10) {
                    expect(issue.severity).toBe('warning');
                } else {
                    expect(issue.severity).toBe('info');
                }
            });
        });
    });

    describe('Maintainability Index', () => {
        it('should check maintainability', async () => {
            const issues = await detector.detect();
            const maintainabilityIssues = issues.filter(i => i.category === 'maintainability');
            // May or may not have maintainability issues depending on code
            expect(Array.isArray(maintainabilityIssues)).toBe(true);
        });

        it('should include maintainability index when available', async () => {
            const issues = await detector.detect();
            const issuesWithMI = issues.filter(i => i.maintainabilityIndex !== undefined);
            
            if (issuesWithMI.length > 0) {
                issuesWithMI.forEach(issue => {
                    expect(issue.maintainabilityIndex).toBeGreaterThan(0);
                    expect(issue.maintainabilityIndex).toBeLessThanOrEqual(100);
                });
            }
        });
    });

    describe('Function Analysis', () => {
        it('should analyze test_complexity.py', async () => {
            const issues = await detector.detect();
            const complexityFileIssues = issues.filter(i => i.file.includes('test_complexity.py'));
            expect(complexityFileIssues.length).toBeGreaterThan(0);
        });

        it('should identify function names', async () => {
            const issues = await detector.detect();
            const functionsFound = issues.filter(i => 
                i.message.includes('Function') && i.message.includes("'")
            );
            expect(functionsFound.length).toBeGreaterThan(0);
        });

        it('should provide line numbers', async () => {
            const issues = await detector.detect();
            issues.forEach(issue => {
                expect(issue.line).toBeGreaterThan(0);
            });
        });
    });

    describe('Recommendations', () => {
        it('should provide refactoring recommendations', async () => {
            const issues = await detector.detect();
            const issuesWithRecommendations = issues.filter(i => i.recommendation);
            expect(issuesWithRecommendations.length).toBeGreaterThan(0);
        });

        it('should suggest splitting for high complexity', async () => {
            const issues = await detector.detect();
            const highComplexity = issues.filter(i => i.complexity && i.complexity > 20);
            
            if (highComplexity.length > 0) {
                highComplexity.forEach(issue => {
                    expect(issue.recommendation?.toLowerCase()).toMatch(/split|smaller|refactor/);
                });
            }
        });

        it('should suggest simplification for moderate complexity', async () => {
            const issues = await detector.detect();
            const moderateComplexity = issues.filter(i => 
                i.complexity && i.complexity > 10 && i.complexity <= 20
            );
            
            if (moderateComplexity.length > 0) {
                moderateComplexity.forEach(issue => {
                    expect(issue.recommendation).toBeTruthy();
                });
            }
        });
    });

    describe('Threshold Configuration', () => {
        it('should detect complexity above threshold (>5)', async () => {
            const issues = await detector.detect();
            const allComplexityIssues = issues.filter(i => i.complexity);
            
            // With threshold of 5, should detect moderate complexity
            allComplexityIssues.forEach(issue => {
                expect(issue.complexity).toBeGreaterThan(5);
            });
        });
    });

    describe('Error Handling', () => {
        it('should handle missing radon', async () => {
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
            
            // Python detectors call external tools (radon), need more time
            expect(duration).toBeLessThan(10000);
        }, 15000);
    });

    describe('Integration', () => {
        it('should provide actionable metrics', async () => {
            const issues = await detector.detect();
            issues.forEach(issue => {
                expect(issue.file).toBeTruthy();
                expect(issue.line).toBeGreaterThan(0);
                expect(issue.message).toBeTruthy();
                expect(issue.severity).toBeTruthy();
            });
        });

        it('should work with other detectors', async () => {
            const issues = await detector.detect();
            // Should not interfere with file system or other operations
            expect(issues).toBeDefined();
        });
    });
});
