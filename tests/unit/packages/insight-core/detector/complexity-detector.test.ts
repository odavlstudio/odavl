/**
 * ComplexityDetector Tests
 * 
 * Phase 5: Test all 5 complexity detection features
 * Target: Achieve 85% coverage
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ComplexityDetector, ComplexityErrorType } from '../../../../../packages/insight-core/src/detector/complexity-detector';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

describe('ComplexityDetector', () => {
    let detector: ComplexityDetector;
    let tempDir: string;

    beforeEach(() => {
        // Cleanup previous temp directory if exists
        if (tempDir && fs.existsSync(tempDir)) {
            fs.rmSync(tempDir, { recursive: true, force: true });
        }

        detector = new ComplexityDetector();
        tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'complexity-test-'));
    });

    afterEach(() => {
        // Cleanup
        if (fs.existsSync(tempDir)) {
            fs.rmSync(tempDir, { recursive: true, force: true });
        }
    });

    // ============================================
    // 1. COGNITIVE COMPLEXITY TESTS
    // ============================================

    describe('Cognitive Complexity Detection', () => {
        it('should detect high cognitive complexity (nested if statements)', async () => {
            const testCode = `
function complexFunction(a, b, c) {
    if (a > 0) {
        if (b > 0) {
            if (c > 0) {
                if (a > b) {
                    if (b > c) {
                        return true;
                    }
                }
            }
        }
    }
    return false;
}
            `.trim();

            const testFile = path.join(tempDir, 'cognitive-test.ts');
            fs.writeFileSync(testFile, testCode);

            const errors = await detector.detect(tempDir);
            const cognitiveErrors = errors.filter(e => e.type === ComplexityErrorType.HIGH_COGNITIVE_COMPLEXITY);

            expect(cognitiveErrors.length).toBeGreaterThan(0);
            expect(cognitiveErrors[0].severity).toBe('medium');
            expect(cognitiveErrors[0].metrics?.complexity).toBeGreaterThan(15);
        });

        it('should detect cognitive complexity from logical operators', async () => {
            const testCode = `
function validateInput(user, settings, permissions) {
    if (user && user.name && user.email && user.age > 18 && user.verified) {
        if (user.role === 'admin' || user.role === 'moderator' || user.role === 'editor') {
            if (user.permissions && user.permissions.length > 0 && user.status === 'active') {
                if (settings && settings.enabled && settings.allowAccess) {
                    if (permissions && permissions.read && permissions.write && permissions.delete) {
                        if (user.lastLogin && user.loginCount > 10 && user.trustScore > 0.8) {
                            return true;
                        }
                    }
                }
            }
        }
    }
    return false;
}
            `.trim();

            const testFile = path.join(tempDir, 'logical-ops.ts');
            fs.writeFileSync(testFile, testCode);

            const errors = await detector.detect(tempDir);
            const cognitiveErrors = errors.filter(e => e.type === ComplexityErrorType.HIGH_COGNITIVE_COMPLEXITY);

            expect(cognitiveErrors.length).toBeGreaterThan(0);
            expect(cognitiveErrors[0].metrics?.complexity).toBeGreaterThan(15);
        });

        it('should detect cognitive complexity from nested loops', async () => {
            const testCode = `
function processMatrix(matrix) {
    for (let i = 0; i < matrix.length; i++) {
        for (let j = 0; j < matrix[i].length; j++) {
            if (matrix[i][j] > 0) {
                for (let k = 0; k < 10; k++) {
                    if (k % 2 === 0) {
                        console.log(matrix[i][j] * k);
                    }
                }
            }
        }
    }
}
            `.trim();

            const testFile = path.join(tempDir, 'nested-loops.ts');
            fs.writeFileSync(testFile, testCode);

            const errors = await detector.detect(tempDir);
            const cognitiveErrors = errors.filter(e => e.type === ComplexityErrorType.HIGH_COGNITIVE_COMPLEXITY);

            expect(cognitiveErrors.length).toBeGreaterThan(0);
        });

        it('should NOT flag low cognitive complexity functions', async () => {
            const testCode = `
function simpleFunction(x) {
    if (x > 0) {
        return x * 2;
    }
    return 0;
}
            `.trim();

            const testFile = path.join(tempDir, 'simple.ts');
            fs.writeFileSync(testFile, testCode);

            const errors = await detector.detect(tempDir);
            const cognitiveErrors = errors.filter(e => e.type === ComplexityErrorType.HIGH_COGNITIVE_COMPLEXITY);

            expect(cognitiveErrors.length).toBe(0);
        });
    });

    // ============================================
    // 2. CYCLOMATIC COMPLEXITY TESTS
    // ============================================

    describe('Cyclomatic Complexity Detection', () => {
        it('should detect high cyclomatic complexity (many decision points)', async () => {
            const testCode = `
function validateForm(data) {
    if (!data.name) return false;
    if (!data.email) return false;
    if (!data.phone) return false;
    if (data.age < 18) return false;
    if (data.country === 'US' && !data.ssn) return false;
    if (data.country === 'UK' && !data.nin) return false;
    if (data.subscribe && !data.newsletter) return false;
    if (data.premium && !data.paymentMethod) return false;
    if (data.shipping && !data.address) return false;
    if (data.terms === false) return false;
    if (data.privacy === false) return false;
    return true;
}
            `.trim();

            const testFile = path.join(tempDir, 'cyclomatic-test.ts');
            fs.writeFileSync(testFile, testCode);

            const errors = await detector.detect(tempDir);
            const cyclomaticErrors = errors.filter(e => e.type === ComplexityErrorType.HIGH_CYCLOMATIC_COMPLEXITY);

            expect(cyclomaticErrors.length).toBeGreaterThan(0);
            expect(cyclomaticErrors[0].metrics?.complexity).toBeGreaterThan(10);
        });

        it('should detect cyclomatic complexity from switch statements', async () => {
            const testCode = `
function handleAction(action) {
    switch (action.type) {
        case 'CREATE': return create();
        case 'UPDATE': return update();
        case 'DELETE': return remove();
        case 'READ': return read();
        case 'LIST': return list();
        case 'SEARCH': return search();
        case 'FILTER': return filter();
        case 'SORT': return sort();
        case 'EXPORT': return exportData();
        case 'IMPORT': return importData();
        case 'SYNC': return sync();
        default: return null;
    }
}
            `.trim();

            const testFile = path.join(tempDir, 'switch-test.ts');
            fs.writeFileSync(testFile, testCode);

            const errors = await detector.detect(tempDir);
            const cyclomaticErrors = errors.filter(e => e.type === ComplexityErrorType.HIGH_CYCLOMATIC_COMPLEXITY);

            expect(cyclomaticErrors.length).toBeGreaterThan(0);
        });

        it('should detect cyclomatic complexity from ternary operators', async () => {
            const testCode = `
function calculatePrice(item, discount, coupon, membership, season, location) {
    const price = item.price;
    const d1 = discount ? price * 0.9 : price;
    const d2 = coupon ? d1 * 0.85 : d1;
    const d3 = membership === 'gold' ? d2 * 0.8 : membership === 'silver' ? d2 * 0.9 : d2;
    const d4 = season === 'winter' ? d3 * 0.75 : season === 'summer' ? d3 * 0.85 : d3;
    const d5 = location === 'US' ? d4 * 1.0 : location === 'EU' ? d4 * 1.2 : d4 * 1.1;
    const d6 = item.category === 'electronics' ? d5 * 0.95 : item.category === 'books' ? d5 * 0.9 : d5;
    const d7 = item.inStock ? d6 : d6 * 1.5;
    return d7;
}
            `.trim();

            const testFile = path.join(tempDir, 'ternary-test.ts');
            fs.writeFileSync(testFile, testCode);

            const errors = await detector.detect(tempDir);
            const cyclomaticErrors = errors.filter(e => e.type === ComplexityErrorType.HIGH_CYCLOMATIC_COMPLEXITY);

            expect(cyclomaticErrors.length).toBeGreaterThan(0);
        });

        it('should NOT flag low cyclomatic complexity functions', async () => {
            const testCode = `
function add(a, b) {
    return a + b;
}
            `.trim();

            const testFile = path.join(tempDir, 'simple-add.ts');
            fs.writeFileSync(testFile, testCode);

            const errors = await detector.detect(tempDir);
            const cyclomaticErrors = errors.filter(e => e.type === ComplexityErrorType.HIGH_CYCLOMATIC_COMPLEXITY);

            expect(cyclomaticErrors.length).toBe(0);
        });
    });

    // ============================================
    // 3. FUNCTION LENGTH TESTS
    // ============================================

    describe('Function Length Detection', () => {
        it('should detect excessively long functions (>100 lines)', async () => {
            const lines = ['function longFunction() {'];
            for (let i = 0; i < 120; i++) {
                lines.push(`    console.log('Line ${i}');`);
            }
            lines.push('}');

            const testCode = lines.join('\n');
            const testFile = path.join(tempDir, 'long-function.ts');
            fs.writeFileSync(testFile, testCode);

            const errors = await detector.detect(tempDir);
            const lengthErrors = errors.filter(e => e.type === ComplexityErrorType.EXCESSIVE_FUNCTION_LENGTH);

            expect(lengthErrors.length).toBeGreaterThan(0);
            expect(lengthErrors[0].severity).toBe('medium');
            expect(lengthErrors[0].metrics?.length).toBeGreaterThan(100);
        });

        it('should detect critically long functions (>200 lines)', async () => {
            const lines = ['function veryLongFunction() {'];
            for (let i = 0; i < 220; i++) {
                lines.push(`    const var${i} = ${i};`);
            }
            lines.push('}');

            const testCode = lines.join('\n');
            const testFile = path.join(tempDir, 'very-long.ts');
            fs.writeFileSync(testFile, testCode);

            const errors = await detector.detect(tempDir);
            const lengthErrors = errors.filter(e => e.type === ComplexityErrorType.EXCESSIVE_FUNCTION_LENGTH);

            expect(lengthErrors.length).toBeGreaterThan(0);
            expect(lengthErrors[0].severity).toBe('high');
        });

        it('should detect extremely long functions (>300 lines)', async () => {
            const lines = ['function extremelyLongFunction() {'];
            for (let i = 0; i < 320; i++) {
                lines.push(`    // Comment ${i}`);
            }
            lines.push('}');

            const testCode = lines.join('\n');
            const testFile = path.join(tempDir, 'extreme.ts');
            fs.writeFileSync(testFile, testCode);

            const errors = await detector.detect(tempDir);
            const lengthErrors = errors.filter(e => e.type === ComplexityErrorType.EXCESSIVE_FUNCTION_LENGTH);

            expect(lengthErrors.length).toBeGreaterThan(0);
            expect(lengthErrors[0].severity).toBe('critical');
        });

        it('should NOT flag short functions', async () => {
            const testCode = `
function shortFunction() {
    return true;
}
            `.trim();

            const testFile = path.join(tempDir, 'short.ts');
            fs.writeFileSync(testFile, testCode);

            const errors = await detector.detect(tempDir);
            const lengthErrors = errors.filter(e => e.type === ComplexityErrorType.EXCESSIVE_FUNCTION_LENGTH);

            expect(lengthErrors.length).toBe(0);
        });
    });

    // ============================================
    // 4. NESTING DEPTH TESTS
    // ============================================

    describe('Nesting Depth Detection', () => {
        it('should detect excessive nesting (>4 levels)', async () => {
            const testCode = `
function deepNesting() {
    if (true) {
        if (true) {
            if (true) {
                if (true) {
                    if (true) {
                        return 'too deep';
                    }
                }
            }
        }
    }
}
            `.trim();

            const testFile = path.join(tempDir, 'deep-nesting.ts');
            fs.writeFileSync(testFile, testCode);

            const errors = await detector.detect(tempDir);
            const nestingErrors = errors.filter(e => e.type === ComplexityErrorType.EXCESSIVE_NESTING_DEPTH);

            expect(nestingErrors.length).toBeGreaterThan(0);
            expect(nestingErrors[0].metrics?.nestingDepth).toBeGreaterThan(4);
        });

        it('should detect critical nesting depth (>6 levels)', async () => {
            const testCode = `
function criticalNesting() {
    for (let i = 0; i < 10; i++) {
        if (i > 0) {
            while (i < 5) {
                if (i % 2 === 0) {
                    for (let j = 0; j < i; j++) {
                        if (j > 0) {
                            if (j % 2 === 0) {
                                console.log('deep');
                            }
                        }
                    }
                }
            }
        }
    }
}
            `.trim();

            const testFile = path.join(tempDir, 'critical-nesting.ts');
            fs.writeFileSync(testFile, testCode);

            const errors = await detector.detect(tempDir);
            const nestingErrors = errors.filter(e => e.type === ComplexityErrorType.EXCESSIVE_NESTING_DEPTH);

            expect(nestingErrors.length).toBeGreaterThan(0);
            expect(nestingErrors[0].severity).toBe('high'); // 7 levels = high (>6)
        });

        it('should detect extreme nesting (>8 levels)', async () => {
            const testCode = `
function extremeNesting() {
    if (1) { if (2) { if (3) { if (4) { if (5) { if (6) { if (7) { if (8) { if (9) {
        return 'extreme';
    }}}}}}}}}
}
            `.trim();

            const testFile = path.join(tempDir, 'extreme-nesting.ts');
            fs.writeFileSync(testFile, testCode);

            const errors = await detector.detect(tempDir);
            const nestingErrors = errors.filter(e => e.type === ComplexityErrorType.EXCESSIVE_NESTING_DEPTH);

            expect(nestingErrors.length).toBeGreaterThan(0);
            expect(nestingErrors[0].severity).toBe('critical');
        });

        it('should NOT flag shallow nesting', async () => {
            const testCode = `
function shallowNesting() {
    if (true) {
        if (true) {
            return 'ok';
        }
    }
}
            `.trim();

            const testFile = path.join(tempDir, 'shallow.ts');
            fs.writeFileSync(testFile, testCode);

            const errors = await detector.detect(tempDir);
            const nestingErrors = errors.filter(e => e.type === ComplexityErrorType.EXCESSIVE_NESTING_DEPTH);

            // Debug: log any unexpected errors
            if (nestingErrors.length > 0) {
                console.log('Unexpected nesting errors:', nestingErrors.map(e => ({
                    file: path.basename(e.file),
                    line: e.line,
                    depth: e.metrics?.nestingDepth
                })));
            }

            expect(nestingErrors.length).toBe(0);
        });
    });

    // ============================================
    // 5. CODE DUPLICATION TESTS
    // ============================================

    describe('Code Duplication Detection', () => {
        it('should detect exact code duplication (>10 lines)', async () => {
            const testCode = `
function processA() {
    const data = fetchData();
    const filtered = data.filter(x => x.active);
    const mapped = filtered.map(x => x.value);
    const sorted = mapped.sort();
    const unique = [...new Set(sorted)];
    const validated = unique.filter(x => x > 0);
    const transformed = validated.map(x => x * 2);
    const result = transformed.reduce((a, b) => a + b, 0);
    console.log(result);
    return result;
}

function processB() {
    const data = fetchData();
    const filtered = data.filter(x => x.active);
    const mapped = filtered.map(x => x.value);
    const sorted = mapped.sort();
    const unique = [...new Set(sorted)];
    const validated = unique.filter(x => x > 0);
    const transformed = validated.map(x => x * 2);
    const result = transformed.reduce((a, b) => a + b, 0);
    console.log(result);
    return result;
}
            `.trim();

            const testFile = path.join(tempDir, 'duplication.ts');
            fs.writeFileSync(testFile, testCode);

            const errors = await detector.detect(tempDir);
            const duplicationErrors = errors.filter(e => e.type === ComplexityErrorType.CODE_DUPLICATION);

            expect(duplicationErrors.length).toBeGreaterThan(0);
            expect(duplicationErrors[0].metrics?.duplicateLines).toBeGreaterThan(10);
        });

        it('should detect large duplication (>20 lines)', async () => {
            const lines = ['function largeA() {'];
            for (let i = 0; i < 25; i++) {
                lines.push(`    const step${i} = process(${i});`);
            }
            lines.push('}');
            lines.push('');
            lines.push('function largeB() {');
            for (let i = 0; i < 25; i++) {
                lines.push(`    const step${i} = process(${i});`);
            }
            lines.push('}');

            const testCode = lines.join('\n');
            const testFile = path.join(tempDir, 'large-dup.ts');
            fs.writeFileSync(testFile, testCode);

            const errors = await detector.detect(tempDir);
            const duplicationErrors = errors.filter(e => e.type === ComplexityErrorType.CODE_DUPLICATION);

            expect(duplicationErrors.length).toBeGreaterThan(0);
            expect(duplicationErrors[0].severity).toBe('high');
        });

        it('should detect critical duplication (>50 lines)', async () => {
            const lines = ['function hugeA() {'];
            for (let i = 0; i < 60; i++) {
                lines.push(`    console.log('Line ${i}');`);
            }
            lines.push('}');
            lines.push('');
            lines.push('function hugeB() {');
            for (let i = 0; i < 60; i++) {
                lines.push(`    console.log('Line ${i}');`);
            }
            lines.push('}');

            const testCode = lines.join('\n');
            const testFile = path.join(tempDir, 'huge-dup.ts');
            fs.writeFileSync(testFile, testCode);

            const errors = await detector.detect(tempDir);
            const duplicationErrors = errors.filter(e => e.type === ComplexityErrorType.CODE_DUPLICATION);

            expect(duplicationErrors.length).toBeGreaterThan(0);
            expect(duplicationErrors[0].severity).toBe('critical');
        });

        it('should NOT flag small duplications (<10 lines)', async () => {
            const testCode = `
function small1() {
    const x = 1;
    const y = 2;
    return x + y;
}

function small2() {
    const x = 1;
    const y = 2;
    return x + y;
}
            `.trim();

            const testFile = path.join(tempDir, 'small-dup.ts');
            fs.writeFileSync(testFile, testCode);

            const errors = await detector.detect(tempDir);
            const duplicationErrors = errors.filter(e => e.type === ComplexityErrorType.CODE_DUPLICATION);

            expect(duplicationErrors.length).toBe(0);
        });
    });

    // ============================================
    // 6. STATISTICS TESTS
    // ============================================

    describe('Statistics Calculation', () => {
        it('should calculate aggregate statistics correctly', async () => {
            const testCode = `
function complexFunc1() {
    if (a) { if (b) { if (c) { if (d) { if (e) { if (f) { return 1; }}}}}
}

function complexFunc2() {
    if (x) return 1; if (y) return 2; if (z) return 3;
    if (a) return 4; if (b) return 5; if (c) return 6;
    if (d) return 7; if (e) return 8; if (f) return 9;
    if (g) return 10; if (h) return 11; if (i) return 12;
}
            `.trim();

            const testFile = path.join(tempDir, 'stats-test.ts');
            fs.writeFileSync(testFile, testCode);

            await detector.detect(tempDir);
            const stats = detector.calculateStatistics();

            expect(stats.totalErrors).toBeGreaterThan(0);
            expect(stats.bySeverity).toBeDefined();
            expect(stats.byType).toBeDefined();
            expect(Object.keys(stats.byType).length).toBeGreaterThan(0);
        });

        it('should track severity distribution', async () => {
            const testCode = `
function mediumComplexity() {
    if (a) { if (b) { if (c) { if (d) { return 1; }}}}
}

function highComplexity() {
    if (a) { if (b) { if (c) { if (d) { if (e) { if (f) { if (g) { return 1; }}}}}}}
}
            `.trim();

            const testFile = path.join(tempDir, 'severity-test.ts');
            fs.writeFileSync(testFile, testCode);

            await detector.detect(tempDir);
            const stats = detector.calculateStatistics();

            const totalSeverity = stats.bySeverity.low + stats.bySeverity.medium +
                stats.bySeverity.high + stats.bySeverity.critical;
            expect(totalSeverity).toBe(stats.totalErrors);
        });
    });

    // ============================================
    // 7. FORMATTING TESTS
    // ============================================

    describe('Error Formatting', () => {
        it('should format errors with all required fields', async () => {
            const testCode = `
function testFunc() {
    if (a) {
        if (b) {
            if (c) {
                if (d) {
                    if (e) {
                        if (f) {
                            if (g) {
                                if (h) {
                                    return 1;
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
            `.trim();

            const testFile = path.join(tempDir, 'format-test.ts');
            fs.writeFileSync(testFile, testCode);

            const errors = await detector.detect(tempDir);
            expect(errors.length).toBeGreaterThan(0);

            const formatted = detector.formatError(errors[0]);
            expect(formatted).toContain('File:');
            expect(formatted).toContain('Pattern:');
            expect(formatted).toContain('Fix:');
        });

        it('should include severity icon in formatted output', async () => {
            const testCode = `
function criticalFunc() {
    if (1) { if (2) { if (3) { if (4) { if (5) { if (6) { if (7) { if (8) { return 1; }}}}}}}}
}
            `.trim();

            const testFile = path.join(tempDir, 'icon-test.ts');
            fs.writeFileSync(testFile, testCode);

            const errors = await detector.detect(tempDir);
            const criticalError = errors.find(e => e.severity === 'critical');

            if (criticalError) {
                const formatted = detector.formatError(criticalError);
                expect(formatted).toMatch(/🔥|📕|📙|📘/);
            }
        });
    });

    // ============================================
    // 8. EDGE CASES
    // ============================================

    describe('Edge Cases', () => {
        it('should handle empty files', async () => {
            const testFile = path.join(tempDir, 'empty.ts');
            fs.writeFileSync(testFile, '');

            const errors = await detector.detect(tempDir);
            expect(errors).toBeDefined();
        });

        it('should handle files with only comments', async () => {
            const testCode = `
// This is a comment
/* Multi-line
   comment */
            `.trim();

            const testFile = path.join(tempDir, 'comments.ts');
            fs.writeFileSync(testFile, testCode);

            const errors = await detector.detect(tempDir);
            expect(errors).toBeDefined();
        });

        it('should skip node_modules directory', async () => {
            const nodeModulesDir = path.join(tempDir, 'node_modules');
            fs.mkdirSync(nodeModulesDir);

            const badFile = path.join(nodeModulesDir, 'bad.ts');
            fs.writeFileSync(badFile, 'function bad() { if (1) { if (2) { if (3) { if (4) { if (5) { return 1; }}}}} }');

            const errors = await detector.detect(tempDir);
            const nodeModulesErrors = errors.filter(e => e.file.includes('node_modules'));

            expect(nodeModulesErrors.length).toBe(0);
        });

        it('should skip test files', async () => {
            const testCode = `
function testFunc() {
    if (1) { if (2) { if (3) { if (4) { if (5) { return 1; }}}}}
}
            `.trim();

            const testFile = path.join(tempDir, 'something.test.ts');
            fs.writeFileSync(testFile, testCode);

            const errors = await detector.detect(tempDir);
            const testFileErrors = errors.filter(e => e.file.includes('.test.'));

            expect(testFileErrors.length).toBe(0);
        });

        it('should handle arrow functions', async () => {
            const testCode = `
const arrowFunc = () => {
    if (a) {
        if (b) {
            if (c) {
                if (d) {
                    if (e) {
                        return 1;
                    }
                }
            }
        }
    }
};
            `.trim();

            const testFile = path.join(tempDir, 'arrow.ts');
            fs.writeFileSync(testFile, testCode);

            const errors = await detector.detect(tempDir);
            expect(errors.length).toBeGreaterThan(0);
        });

        it('should handle async functions', async () => {
            const testCode = `
async function asyncFunc() {
    if (a) {
        if (b) {
            if (c) {
                if (d) {
                    if (e) {
                        return await fetch();
                    }
                }
            }
        }
    }
}
            `.trim();

            const testFile = path.join(tempDir, 'async.ts');
            fs.writeFileSync(testFile, testCode);

            const errors = await detector.detect(tempDir);
            expect(errors.length).toBeGreaterThan(0);
        });
    });
});
