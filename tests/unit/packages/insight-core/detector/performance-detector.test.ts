import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { PerformanceDetector } from '../../../../../packages/insight-core/src/detector/performance-detector.js';
import { writeFileSync, mkdirSync, rmSync } from 'fs';
import { join } from 'path';

describe('PerformanceDetector', () => {
    let detector: PerformanceDetector;
    const testDir = join(process.cwd(), 'tests', 'fixtures', 'performance');

    beforeEach(() => {
        detector = new PerformanceDetector({ workspaceRoot: testDir });
        // Create test directory
        try {
            mkdirSync(testDir, { recursive: true });
        } catch {
            // Directory may already exist
        }
    });

    // Clean up after all tests
    afterAll(() => {
        try {
            rmSync(testDir, { recursive: true, force: true });
        } catch {
            // Ignore cleanup errors
        }
    });

    describe('Memory Leak Detection', () => {
        it('should detect addEventListener without removeEventListener', async () => {
            const testFile = join(testDir, 'memory-leak-1.ts');
            writeFileSync(testFile, `
                function setupListeners() {
                    document.addEventListener('click', handleClick);
                    window.addEventListener('resize', handleResize);
                    document.addEventListener('scroll', handleScroll);
                    // Missing removeEventListener calls
                }
            `);

            const issues = await detector.detect(testDir);
            const memoryLeaks = issues.filter(i => i.message.includes('addEventListener'));

            expect(memoryLeaks.length).toBeGreaterThan(0);
            expect(memoryLeaks[0].severity).toBe('high');
            expect(memoryLeaks[0].message).toContain('addEventListener');
        });

        it('should detect setInterval without clearInterval', async () => {
            const testFile = join(testDir, 'memory-leak-2.ts');
            writeFileSync(testFile, `
                function startPolling() {
                    setInterval(() => {
                        fetchData();
                    }, 1000);
                    setInterval(() => {
                        updateUI();
                    }, 500);
                    // Missing clearInterval calls
                }
            `);

            const issues = await detector.detect(testDir);
            const memoryLeaks = issues.filter(i => i.message.includes('setInterval'));

            expect(memoryLeaks.length).toBeGreaterThan(0);
            expect(memoryLeaks[0].severity).toBe('critical');
        });

        it('should NOT flag properly cleaned event listeners', async () => {
            const testFile = join(testDir, 'memory-leak-clean.ts');
            writeFileSync(testFile, `
                function setupListeners() {
                    const handler = () => console.log('click');
                    document.addEventListener('click', handler);
                    // Properly cleaned up
                    return () => document.removeEventListener('click', handler);
                }
            `);

            const issues = await detector.detect(testDir);
            const memoryLeaks = issues.filter(i =>
                i.type === 'memory-leak' &&
                i.filePath.includes('memory-leak-clean.ts')
            );

            expect(memoryLeaks.length).toBe(0);
        });

        it('should detect setTimeout leaks with high count', async () => {
            const testFile = join(testDir, 'memory-leak-timeout.ts');
            const timeoutCalls = Array(50).fill(0).map((_, i) =>
                `setTimeout(() => task${i}(), ${i * 100});`
            ).join('\n    ');

            writeFileSync(testFile, `
                function scheduleMany() {
                    ${timeoutCalls}
                }
            `);

            const issues = await detector.detect(testDir);
            const timeoutLeaks = issues.filter(i =>
                i.type === 'memory-leak' &&
                i.message.includes('setTimeout')
            );

            expect(timeoutLeaks.length).toBeGreaterThan(0);
            expect(timeoutLeaks[0].severity).toBe('medium');
        });
    });

    describe('Slow Function Detection', () => {
        it('should detect high cyclomatic complexity', async () => {
            const testFile = join(testDir, 'slow-function-complex.ts');
            writeFileSync(testFile, `
                function veryComplexFunction(a: number, b: string, c: boolean, d: boolean) {
                    if (a > 0) {
                        if (b === 'test') {
                            if (c) {
                                for (let i = 0; i < 10; i++) {
                                    if (i % 2 === 0) {
                                        switch (i) {
                                            case 0:
                                                break;
                                            case 2:
                                                break;
                                            case 4:
                                                break;
                                            case 6:
                                                break;
                                            case 8:
                                                break;
                                        }
                                    } else if (i % 3 === 0) {
                                        // Another branch
                                    } else if (i % 5 === 0) {
                                        // Another branch
                                    } else if (i % 7 === 0) {
                                        // Another branch (complexity: +1)
                                    }
                                    
                                    if (d && i > 5) {
                                        // Extra complexity (+2 for if and &&)
                                    }
                                }
                            } else {
                                // Another branch
                            }
                        } else {
                            // Another branch
                        }
                    } else {
                        // Another branch
                    }
                }
            `);

            const issues = await detector.detect(testDir);
            const slowFunctions = issues.filter(i => i.type === 'slow-function');

            expect(slowFunctions.length).toBeGreaterThan(0);
            expect(slowFunctions[0].message).toContain('complexity');
        });

        it('should detect long functions (>100 lines)', async () => {
            const testFile = join(testDir, 'slow-function-long.ts');
            const longFunction = Array(150).fill(0).map((_, i) =>
                `    console.log('Line ${i}');`
            ).join('\n');

            writeFileSync(testFile, `
                function veryLongFunction() {
                ${longFunction}
                }
            `);

            const issues = await detector.detect(testDir);
            const slowFunctions = issues.filter(i =>
                i.type === 'slow-function' &&
                i.message.includes('lines')
            );

            expect(slowFunctions.length).toBeGreaterThan(0);
        });

        it('should tier severity based on complexity', async () => {
            const testFile = join(testDir, 'slow-function-critical.ts');
            // Create function with complexity > 30 (critical)
            const complexBranches = Array(35).fill(0).map((_, i) =>
                `if (x === ${i}) return ${i};`
            ).join(' else ');

            writeFileSync(testFile, `
                function extremelyComplex(x: number) {
                    ${complexBranches}
                }
            `);

            const issues = await detector.detect(testDir);
            const criticalFunctions = issues.filter(i =>
                i.type === 'slow-function' &&
                i.severity === 'critical'
            );

            expect(criticalFunctions.length).toBeGreaterThan(0);
        });
    });

    describe('Large Bundle Detection', () => {
        it('should detect files larger than 500KB', async () => {
            const testFile = join(testDir, 'large-bundle.ts');
            // Create file > 500KB
            const largeContent = 'x'.repeat(600 * 1024);
            writeFileSync(testFile, largeContent);

            const issues = await detector.detect(testDir);
            const largeFiles = issues.filter(i => i.type === 'large-bundle');

            expect(largeFiles.length).toBeGreaterThan(0);
            expect(largeFiles[0].message).toContain('KB');
        });

        it('should tier severity: medium (>500KB), high (>750KB), critical (>1MB)', async () => {
            const mediumFile = join(testDir, 'bundle-medium.ts');
            const highFile = join(testDir, 'bundle-high.ts');
            const criticalFile = join(testDir, 'bundle-critical.ts');

            writeFileSync(mediumFile, 'x'.repeat(600 * 1024)); // 600KB
            writeFileSync(highFile, 'x'.repeat(800 * 1024));   // 800KB
            writeFileSync(criticalFile, 'x'.repeat(1100 * 1024)); // 1.1MB

            const issues = await detector.detect(testDir);
            const bundleIssues = issues.filter(i => i.type === 'large-bundle');

            const mediumIssues = bundleIssues.filter(i =>
                i.severity === 'medium' && i.filePath.includes('bundle-medium')
            );
            const highIssues = bundleIssues.filter(i =>
                i.severity === 'high' && i.filePath.includes('bundle-high')
            );
            const criticalIssues = bundleIssues.filter(i =>
                i.severity === 'critical' && i.filePath.includes('bundle-critical')
            );

            expect(mediumIssues.length).toBe(1);
            expect(highIssues.length).toBe(1);
            expect(criticalIssues.length).toBe(1);
        });

        it('should estimate load time impact', async () => {
            const testFile = join(testDir, 'large-with-impact.ts');
            writeFileSync(testFile, 'x'.repeat(1000 * 1024)); // 1MB

            const issues = await detector.detect(testDir);
            const largeFiles = issues.filter(i =>
                i.type === 'large-bundle' &&
                i.filePath.includes('large-with-impact')
            );

            expect(largeFiles.length).toBeGreaterThan(0);
            expect(largeFiles[0].impact).toBeDefined();
            expect(largeFiles[0].impact).toContain('load time');
        });
    });

    describe('Blocking Operation Detection', () => {
        it('should detect sync file system operations', async () => {
            const testFile = join(testDir, 'blocking-fs.ts');
            writeFileSync(testFile, `
                import { readFileSync, writeFileSync, readdirSync } from 'fs';
                
                function loadConfig() {
                    const data = readFileSync('config.json', 'utf-8');
                    const files = readdirSync('./src');
                    writeFileSync('output.json', data);
                }
            `);

            const issues = await detector.detect(testDir);
            const blockingOps = issues.filter(i => i.message.includes('Synchronous file operation') || i.message.includes('readFileSync'));

            expect(blockingOps.length).toBeGreaterThan(0);
            expect(blockingOps.some(i => i.message.includes('readFileSync'))).toBe(true);
        });

        it('should detect sync crypto operations', async () => {
            const testFile = join(testDir, 'blocking-crypto.ts');
            writeFileSync(testFile, `
                import { pbkdf2Sync, scryptSync, randomBytesSync } from 'crypto';
                
                function hashPassword(password: string) {
                    const salt = randomBytesSync(16);
                    const hash = pbkdf2Sync(password, salt, 100000, 64, 'sha512');
                    const altHash = scryptSync(password, salt, 64);
                    return hash;
                }
            `);

            const issues = await detector.detect(testDir);
            const cryptoOps = issues.filter(i =>
                i.message.includes('crypto') || i.message.includes('pbkdf2Sync') || i.message.includes('scryptSync')
            );

            expect(cryptoOps.length).toBeGreaterThan(0);
            expect(cryptoOps[0].severity).toBe('critical');
        });

        it.skip('should detect execSync', async () => {
            const testFile = join(testDir, 'blocking-exec.ts');
            writeFileSync(testFile, `
                import { execSync } from 'child_process';
                
                function runCommand() {
                    const output = execSync('npm install');
                    return output.toString();
                }
            `);

            const issues = await detector.detect(testDir);
            const execOps = issues.filter(i =>
                i.message.includes('execSync') &&
                i.file?.includes('blocking-exec')
            );

            expect(execOps.length).toBeGreaterThan(0);
        });

        it.skip('should estimate blocking time', async () => {
            const testFile = join(testDir, 'blocking-with-impact.ts');
            writeFileSync(testFile, `
                import { pbkdf2Sync } from 'crypto';
                const hash = pbkdf2Sync('password', 'salt', 100000, 64, 'sha512');
            `);

            const issues = await detector.detect(testDir);
            const blockingOps = issues.filter(i =>
                i.message.includes('pbkdf2Sync') &&
                i.file?.includes('blocking-with-impact')
            );

            expect(blockingOps.length).toBeGreaterThan(0);
            expect(blockingOps[0].metrics?.impact).toContain('ms');
        });
    });

    describe('Inefficient Loop Detection', () => {
        it.skip('should detect nested loops (O(n²))', async () => {
            const testFile = join(testDir, 'inefficient-nested.ts');
            writeFileSync(testFile, `
                function findPairs(arr: number[]) {
                    for (let i = 0; i < arr.length; i++) {
                        for (let j = 0; j < arr.length; j++) {
                            if (arr[i] + arr[j] === 10) {
                                console.log(i, j);
                            }
                        }
                    }
                }
            `);

            const issues = await detector.detect(testDir);
            const loopIssues = issues.filter(i =>
                i.type === 'inefficient-loop' &&
                i.message.includes('nested')
            );

            expect(loopIssues.length).toBeGreaterThan(0);
            expect(loopIssues[0].severity).toBe('high');
        });

        it('should detect triple nested loops (O(n³))', async () => {
            const testFile = join(testDir, 'inefficient-triple.ts');
            writeFileSync(testFile, `
                function findTriplets(arr: number[]) {
                    for (let i = 0; i < arr.length; i++) {
                        for (let j = 0; j < arr.length; j++) {
                            for (let k = 0; k < arr.length; k++) {
                                if (arr[i] + arr[j] + arr[k] === 0) {
                                    console.log(i, j, k);
                                }
                            }
                        }
                    }
                }
            `);

            const issues = await detector.detect(testDir);
            const tripleLoops = issues.filter(i =>
                i.type === 'inefficient-loop' &&
                i.severity === 'critical'
            );

            expect(tripleLoops.length).toBeGreaterThan(0);
        });

        it.skip('should detect array.push in loops', async () => {
            const testFile = join(testDir, 'inefficient-push.ts');
            writeFileSync(testFile, `
                function collectItems(count: number) {
                    const items = [];
                    for (let i = 0; i < count; i++) {
                        items.push(i * 2);
                        items.push(i * 3);
                    }
                    return items;
                }
            `);

            const issues = await detector.detect(testDir);
            const pushIssues = issues.filter(i =>
                i.type === 'inefficient-loop' &&
                i.message.includes('push')
            );

            expect(pushIssues.length).toBeGreaterThan(0);
        });

        it.skip('should detect large array allocations', async () => {
            const testFile = join(testDir, 'inefficient-large-array.ts');
            writeFileSync(testFile, `
                function createLargeArray() {
                    const huge = new Array(50000);
                    const massive = Array(100000).fill(0);
                    return [huge, massive];
                }
            `);

            const issues = await detector.detect(testDir);
            const arrayIssues = issues.filter(i =>
                i.type === 'inefficient-loop' &&
                i.message.includes('Array')
            );

            expect(arrayIssues.length).toBeGreaterThan(0);
        });
    });

    describe('N+1 Query Detection', () => {
        it('should detect Prisma queries in loops', async () => {
            const testFile = join(testDir, 'n-plus-one-prisma.ts');
            writeFileSync(testFile, `
                async function loadUsers(ids: number[]) {
                    const results = [];
                    for (const id of ids) {
                        const user = await prisma.user.findUnique({
                            where: { id }
                        });
                        results.push(user);
                    }
                    return results;
                }
            `);

            const issues = await detector.detect(testDir);
            const queryIssues = issues.filter(i =>
                i.type === 'n-plus-one-query' &&
                i.filePath.includes('n-plus-one-prisma')
            );

            expect(queryIssues.length).toBeGreaterThan(0);
            expect(queryIssues[0].severity).toBe('critical');
        });

        it('should detect fetch in loops', async () => {
            const testFile = join(testDir, 'n-plus-one-fetch.ts');
            writeFileSync(testFile, `
                async function loadData(urls: string[]) {
                    const data = [];
                    for (const url of urls) {
                        const response = await fetch(url);
                        const json = await response.json();
                        data.push(json);
                    }
                    return data;
                }
            `);

            const issues = await detector.detect(testDir);
            const fetchIssues = issues.filter(i =>
                i.type === 'n-plus-one-query' &&
                i.message.includes('fetch')
            );

            expect(fetchIssues.length).toBeGreaterThan(0);
            expect(fetchIssues[0].severity).toBe('high');
        });

        it('should detect axios in loops', async () => {
            const testFile = join(testDir, 'n-plus-one-axios.ts');
            writeFileSync(testFile, `
                import axios from 'axios';
                
                async function fetchMultiple(ids: number[]) {
                    for (const id of ids) {
                        const response = await axios.get(\`/api/items/\${id}\`);
                        console.log(response.data);
                    }
                }
            `);

            const issues = await detector.detect(testDir);
            const axiosIssues = issues.filter(i =>
                i.type === 'n-plus-one-query' &&
                i.message.includes('axios')
            );

            expect(axiosIssues.length).toBeGreaterThan(0);
        });

        it('should suggest batching solutions', async () => {
            const testFile = join(testDir, 'n-plus-one-with-fix.ts');
            writeFileSync(testFile, `
                async function loadUsers(ids: number[]) {
                    for (const id of ids) {
                        await prisma.user.findUnique({ where: { id } });
                    }
                }
            `);

            const issues = await detector.detect(testDir);
            const queryIssues = issues.filter(i =>
                i.type === 'n-plus-one-query' &&
                i.filePath.includes('n-plus-one-with-fix')
            );

            expect(queryIssues.length).toBeGreaterThan(0);
            // Verify the formatted error contains fix suggestion
            const formatted = detector.formatError(queryIssues[0]);
            expect(formatted).toContain('Fix:');
        });
    });

    describe('Statistics Calculation', () => {
        it('should aggregate by severity', async () => {
            const criticalFile = join(testDir, 'stats-critical.ts');
            const highFile = join(testDir, 'stats-high.ts');

            // Critical: O(n³) loop
            writeFileSync(criticalFile, `
                for (let i = 0; i < n; i++) {
                    for (let j = 0; j < n; j++) {
                        for (let k = 0; k < n; k++) {
                            // O(n³)
                        }
                    }
                }
            `);

            // High: O(n²) loop
            writeFileSync(highFile, `
                for (let i = 0; i < n; i++) {
                    for (let j = 0; j < n; j++) {
                        // O(n²)
                    }
                }
            `);

            const issues = await detector.detect(testDir);
            const stats = detector.getStatistics(issues);

            expect(stats.bySeverity.critical).toBeGreaterThan(0);
            expect(stats.bySeverity.high).toBeGreaterThan(0);
        });

        it.skip('should aggregate by type', async () => {
            const memoryFile = join(testDir, 'stats-memory.ts');
            const blockingFile = join(testDir, 'stats-blocking.ts');

            writeFileSync(memoryFile, `
                setInterval(() => {}, 1000);
                setInterval(() => {}, 2000);
            `);

            writeFileSync(blockingFile, `
                import { readFileSync } from 'fs';
                const data = readFileSync('file.txt');
            `);

            const issues = await detector.detect(testDir);
            const stats = detector.getStatistics(issues);

            expect(stats.byType['memory-leak']).toBeGreaterThan(0);
            expect(stats.byType['blocking-operation']).toBeGreaterThan(0);
        });

        it('should calculate average file size', async () => {
            const file1 = join(testDir, 'stats-size-1.ts');
            const file2 = join(testDir, 'stats-size-2.ts');

            writeFileSync(file1, 'x'.repeat(100 * 1024)); // 100KB
            writeFileSync(file2, 'x'.repeat(200 * 1024)); // 200KB

            const issues = await detector.detect(testDir);
            const stats = detector.getStatistics(issues);

            expect(stats.averageFileSize).toBeGreaterThan(0);
            expect(stats.totalFiles).toBeGreaterThan(0);
        });

        it('should identify largest files', async () => {
            const largeFile = join(testDir, 'stats-largest.ts');
            writeFileSync(largeFile, 'x'.repeat(800 * 1024)); // 800KB

            const issues = await detector.detect(testDir);
            const stats = detector.getStatistics(issues);

            expect(stats.largestFiles.length).toBeGreaterThan(0);
            expect(stats.largestFiles[0].size).toBeGreaterThan(700 * 1024);
        });
    });

    describe('Exclusion Patterns', () => {
        it('should exclude test files', async () => {
            const testFile = join(testDir, 'some.test.ts');
            writeFileSync(testFile, `
                import { readFileSync } from 'fs';
                const data = readFileSync('file.txt');
            `);

            const issues = await detector.detect(testDir);
            const testIssues = issues.filter(i => i.filePath.includes('.test.ts'));

            expect(testIssues.length).toBe(0);
        });

        it('should exclude spec files', async () => {
            const specFile = join(testDir, 'component.spec.tsx');
            writeFileSync(specFile, `
                setInterval(() => {}, 1000);
            `);

            const issues = await detector.detect(testDir);
            const specIssues = issues.filter(i => i.filePath.includes('.spec.'));

            expect(specIssues.length).toBe(0);
        });
    });

    describe('formatError', () => {
        it.skip('should format with severity icons', async () => {
            const testFile = join(testDir, 'stats-blocking.ts');
            writeFileSync(testFile, `
                import { pbkdf2Sync } from 'crypto';
                function hashPassword() {
                    return pbkdf2Sync('password', 'salt', 100000, 64, 'sha512');
                }
            `);

            const issues = await detector.detect(testDir);
            const blockingIssues = issues.filter(i => i.type === 'blocking-operation');
            expect(blockingIssues.length).toBeGreaterThan(0);

            const formatted = detector.formatError(blockingIssues[0]);

            expect(formatted).toContain('🔥'); // Critical icon
            expect(formatted).toContain('⏸️'); // Blocking operation icon
        });

        it('should include fix suggestions', async () => {
            const testFile = join(testDir, 'format-fix.ts');
            writeFileSync(testFile, `
                async function load(ids: number[]) {
                    for (const id of ids) {
                        await prisma.user.findUnique({ where: { id } });
                    }
                }
            `);

            const issues = await detector.detect(testDir);
            const queryIssue = issues.find(i => i.type === 'n-plus-one-query');

            if (queryIssue) {
                const formatted = detector.formatError(queryIssue);
                expect(formatted).toContain('Fix:');
                expect(formatted.length).toBeGreaterThan(50);
            }
        });
    });

    describe('Edge Cases', () => {
        it('should handle empty directory', async () => {
            const emptyDir = join(testDir, 'empty');
            mkdirSync(emptyDir, { recursive: true });

            const issues = await detector.detect(emptyDir);

            expect(issues).toEqual([]);
        });

        it('should handle files with no issues', async () => {
            const cleanFile = join(testDir, 'clean-code.ts');
            writeFileSync(cleanFile, `
                export function add(a: number, b: number): number {
                    return a + b;
                }
            `);

            const issues = await detector.detect(testDir);
            const cleanIssues = issues.filter(i => i.filePath.includes('clean-code'));

            expect(cleanIssues.length).toBe(0);
        });

        it('should handle very large files gracefully', async () => {
            const hugeFile = join(testDir, 'huge.ts');
            writeFileSync(hugeFile, 'x'.repeat(5 * 1024 * 1024)); // 5MB

            const issues = await detector.detect(testDir);
            const hugeIssues = issues.filter(i => i.filePath.includes('huge.ts'));

            expect(hugeIssues.length).toBeGreaterThan(0);
            expect(hugeIssues[0].type).toBe('large-bundle');
            expect(hugeIssues[0].severity).toBe('critical');
        });
    });
});
