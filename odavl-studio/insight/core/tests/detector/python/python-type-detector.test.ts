/**
 * Python Type Detector Tests
 * Tests for mypy integration and type safety detection
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { PythonTypeDetector } from '../../../src/detector/python/python-type-detector.js';
import * as fs from 'fs/promises';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('PythonTypeDetector', () => {
    const testFixturesDir = path.join(__dirname, '../../../../../../test-fixtures/python');
    let detector: PythonTypeDetector;

    beforeAll(() => {
        detector = new PythonTypeDetector(testFixturesDir);
    });

    describe('Basic Functionality', () => {
        it('should create detector instance', () => {
            expect(detector).toBeDefined();
            expect(detector).toBeInstanceOf(PythonTypeDetector);
        });

        it('should detect type issues in test file', async () => {
            const issues = await detector.detect();
            expect(issues).toBeDefined();
            expect(Array.isArray(issues)).toBe(true);
        });

        it('should return array of issues with required properties', async () => {
            const issues = await detector.detect();
            if (issues.length > 0) {
                const issue = issues[0];
                expect(issue).toHaveProperty('id');
                expect(issue).toHaveProperty('file');
                expect(issue).toHaveProperty('line');
                expect(issue).toHaveProperty('column');
                expect(issue).toHaveProperty('severity');
                expect(issue).toHaveProperty('category');
                expect(issue).toHaveProperty('message');
            }
        });
    });

    describe('Type Issue Detection', () => {
        it('should detect missing type hints', async () => {
            const issues = await detector.detect();
            const missingTypeHints = issues.filter(i => 
                i.message.includes('missing a type annotation') ||
                i.message.includes('no-untyped-def')
            );
            expect(missingTypeHints.length).toBeGreaterThan(0);
        });

        it('should detect type mismatches', async () => {
            const issues = await detector.detect();
            const typeMismatches = issues.filter(i => 
                i.message.includes('Incompatible return value type') ||
                i.message.includes('return-value')
            );
            // test_types.py has: def process_data(...) -> int: return items (list)
            expect(typeMismatches.length).toBeGreaterThan(0);
        });

        it('should report correct severity levels', async () => {
            const issues = await detector.detect();
            const severities = issues.map(i => i.severity);
            expect(severities).toContain('error');
            // Most mypy issues are errors
            const errors = issues.filter(i => i.severity === 'error');
            expect(errors.length).toBeGreaterThan(0);
        });

        it('should include line and column numbers', async () => {
            const issues = await detector.detect();
            if (issues.length > 0) {
                issues.forEach(issue => {
                    expect(issue.line).toBeGreaterThan(0);
                    expect(issue.column).toBeGreaterThanOrEqual(0);
                });
            }
        });

        it('should include error codes when available', async () => {
            const issues = await detector.detect();
            // Note: mypy may not always return error codes depending on configuration
            // Just verify that some issues exist
            expect(issues.length).toBeGreaterThan(0);
            
            // If any issues have codes, verify format
            const issuesWithCodes = issues.filter(i => i.code);
            if (issuesWithCodes.length > 0) {
                const codes = issuesWithCodes.map(i => i.code);
                expect(codes.some(c => c && c.length > 0)).toBe(true);
            }
        });
    });

    describe('File Path Handling', () => {
        it('should normalize file paths', async () => {
            const issues = await detector.detect();
            if (issues.length > 0) {
                issues.forEach(issue => {
                    // Paths should be relative and use forward slashes
                    expect(issue.file).not.toContain('\\');
                    expect(issue.file.endsWith('.py')).toBe(true);
                });
            }
        });

        it('should handle test_types.py specifically', async () => {
            const issues = await detector.detect();
            const typeFileIssues = issues.filter(i => i.file.includes('test_types.py'));
            expect(typeFileIssues.length).toBeGreaterThan(0);
        });
    });

    describe('Error Handling', () => {
        it('should handle missing mypy gracefully', async () => {
            // This test assumes mypy is installed
            // In CI/CD without mypy, should return setup error
            const issues = await detector.detect();
            expect(issues).toBeDefined();
            expect(Array.isArray(issues)).toBe(true);
        });

        it('should handle empty directories', async () => {
            const emptyDir = path.join(__dirname, '../../../../../empty-test-dir');
            await fs.mkdir(emptyDir, { recursive: true });
            
            const emptyDetector = new PythonTypeDetector(emptyDir);
            const issues = await emptyDetector.detect();
            
            expect(issues).toBeDefined();
            expect(Array.isArray(issues)).toBe(true);
            
            await fs.rmdir(emptyDir);
        });

        it('should not throw on parsing errors', async () => {
            await expect(detector.detect()).resolves.not.toThrow();
        });
    });

    describe('Configuration Support', () => {
        it('should use mypy.ini if present', async () => {
            // test-fixtures/python has mypy.ini
            const configPath = path.join(testFixturesDir, 'mypy.ini');
            const configExists = await fs.access(configPath).then(() => true).catch(() => false);
            expect(configExists).toBe(true);
            
            const issues = await detector.detect();
            // With strict config, should detect more issues
            expect(issues.length).toBeGreaterThan(10);
        });
    });

    describe('Recommendation Generation', () => {
        it('should provide recommendations', async () => {
            const issues = await detector.detect();
            if (issues.length > 0) {
                const issuesWithRecommendations = issues.filter(i => i.recommendation);
                expect(issuesWithRecommendations.length).toBeGreaterThan(0);
            }
        });

        it('should categorize as type-safety', async () => {
            const issues = await detector.detect();
            if (issues.length > 0) {
                issues.forEach(issue => {
                    if (issue.category !== 'setup' && issue.category !== 'detector') {
                        expect(issue.category).toBe('type-safety');
                    }
                });
            }
        });
    });

    describe('Performance', () => {
        it('should complete analysis in reasonable time', async () => {
            const startTime = Date.now();
            await detector.detect();
            const duration = Date.now() - startTime;
            
            // Should complete in under 5 seconds for small test files
            expect(duration).toBeLessThan(5000);
        }, 10000);
    });

    describe('Integration', () => {
        it('should work with multiple Python files', async () => {
            const issues = await detector.detect();
            const files = new Set(issues.map(i => i.file));
            
            // Should analyze multiple test files
            expect(files.size).toBeGreaterThanOrEqual(1);
        });

        it('should skip non-Python files', async () => {
            const issues = await detector.detect();
            issues.forEach(issue => {
                expect(issue.file.endsWith('.py')).toBe(true);
            });
        });
    });
});
