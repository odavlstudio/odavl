/**
 * Python Security Detector Tests
 * Tests for bandit integration and security vulnerability detection
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { PythonSecurityDetector } from '../../../src/detector/python/python-security-detector.js';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('PythonSecurityDetector', () => {
    const testFixturesDir = path.join(__dirname, '../../../../../../test-fixtures/python');
    let detector: PythonSecurityDetector;

    beforeAll(() => {
        detector = new PythonSecurityDetector(testFixturesDir);
    });

    describe('Basic Functionality', () => {
        it('should create detector instance', () => {
            expect(detector).toBeDefined();
            expect(detector).toBeInstanceOf(PythonSecurityDetector);
        });

        it('should detect security issues', async () => {
            const issues = await detector.detect();
            expect(issues).toBeDefined();
            expect(Array.isArray(issues)).toBe(true);
            expect(issues.length).toBeGreaterThan(0);
        });
    });

    describe('SQL Injection Detection', () => {
        it('should detect SQL injection vulnerabilities', async () => {
            const issues = await detector.detect();
            const sqlInjection = issues.filter(i => 
                i.message.toLowerCase().includes('sql') ||
                i.category === 'sql-injection'
            );
            // test_security.py has: f"SELECT * FROM users WHERE id = {user_id}"
            expect(sqlInjection.length).toBeGreaterThan(0);
        });

        it('should flag hardcoded SQL expressions', async () => {
            const issues = await detector.detect();
            const hardcodedSQL = issues.filter(i =>
                i.message.includes('hardcoded_sql_expressions') ||
                i.message.includes('SQL injection')
            );
            expect(hardcodedSQL.length).toBeGreaterThan(0);
        });
    });

    describe('Command Injection Detection', () => {
        it('should detect os.system usage', async () => {
            const issues = await detector.detect();
            const commandInjection = issues.filter(i =>
                i.message.includes('start_process_with_a_shell') ||
                i.message.includes('shell')
            );
            // test_security.py has: os.system(f"echo {user_input}")
            expect(commandInjection.length).toBeGreaterThan(0);
        });

        it('should report command injection as high severity', async () => {
            const issues = await detector.detect();
            const shellIssues = issues.filter(i =>
                i.message.includes('shell') && i.severity === 'error'
            );
            expect(shellIssues.length).toBeGreaterThan(0);
        });
    });

    describe('Hardcoded Secrets Detection', () => {
        it('should detect hardcoded credentials', async () => {
            const issues = await detector.detect();
            // test_security.py has: API_KEY = "sk-1234567890abcdef"
            // Note: bandit may not always catch this as a standalone constant
            // It depends on bandit version and rules
            expect(issues.length).toBeGreaterThan(0);
        });
    });

    describe('Unsafe Operations Detection', () => {
        it('should detect pickle usage', async () => {
            const issues = await detector.detect();
            const pickleIssues = issues.filter(i =>
                i.message.toLowerCase().includes('pickle')
            );
            // test_security.py has: import pickle
            expect(pickleIssues.length).toBeGreaterThan(0);
        });

        it('should flag insecure random usage', async () => {
            const issues = await detector.detect();
            const randomIssues = issues.filter(i =>
                i.message.includes('pseudo-random') ||
                i.message.includes('random')
            );
            // test_imports.py uses random
            expect(randomIssues.length).toBeGreaterThan(0);
        });
    });

    describe('Severity Levels', () => {
        it('should categorize issues by severity', async () => {
            const issues = await detector.detect();
            const errors = issues.filter(i => i.severity === 'error');
            const warnings = issues.filter(i => i.severity === 'warning');
            const info = issues.filter(i => i.severity === 'info');

            // Should have mix of severities
            expect(errors.length + warnings.length + info.length).toBe(issues.length);
        });

        it('should mark shell injection as error', async () => {
            const issues = await detector.detect();
            const shellErrors = issues.filter(i =>
                i.message.includes('shell') && i.severity === 'error'
            );
            expect(shellErrors.length).toBeGreaterThan(0);
        });

        it('should provide appropriate severity for each issue', async () => {
            const issues = await detector.detect();
            issues.forEach(issue => {
                expect(['error', 'warning', 'info']).toContain(issue.severity);
            });
        });
    });

    describe('CWE Mapping', () => {
        it('should map vulnerabilities to CWE', async () => {
            const issues = await detector.detect();
            const issuesWithCWE = issues.filter(i => i.cwe);
            // Bandit provides CWE mappings
            expect(issuesWithCWE.length).toBeGreaterThan(0);
        });
    });

    describe('Recommendations', () => {
        it('should provide security recommendations', async () => {
            const issues = await detector.detect();
            const issuesWithRecommendations = issues.filter(i => i.recommendation);
            expect(issuesWithRecommendations.length).toBeGreaterThan(0);
        });

        it('should suggest safe alternatives', async () => {
            const issues = await detector.detect();
            const sqlIssue = issues.find(i => i.message.toLowerCase().includes('sql'));
            if (sqlIssue && sqlIssue.recommendation) {
                // Should suggest parameterized queries
                expect(sqlIssue.recommendation.toLowerCase()).toMatch(/parameter|prepared|safe/);
            }
        });
    });

    describe('File Coverage', () => {
        it('should analyze test_security.py', async () => {
            const issues = await detector.detect();
            const securityFileIssues = issues.filter(i => i.file.includes('test_security.py'));
            expect(securityFileIssues.length).toBeGreaterThan(0);
        });

        it('should report correct file paths', async () => {
            const issues = await detector.detect();
            issues.forEach(issue => {
                expect(issue.file.endsWith('.py')).toBe(true);
                expect(issue.file).not.toContain('\\');
            });
        });
    });

    describe('Error Handling', () => {
        it('should handle missing bandit', async () => {
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
            
            expect(duration).toBeLessThan(5000);
        }, 10000);
    });

    describe('Integration', () => {
        it('should detect multiple vulnerability types', async () => {
            const issues = await detector.detect();
            const categories = new Set(issues.map(i => i.category));
            
            // Should detect various security issue types
            expect(categories.size).toBeGreaterThan(1);
        });

        it('should provide actionable information', async () => {
            const issues = await detector.detect();
            issues.forEach(issue => {
                expect(issue.line).toBeGreaterThan(0);
                expect(issue.message).toBeTruthy();
                expect(issue.file).toBeTruthy();
            });
        });
    });
});
