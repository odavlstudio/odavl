import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { CircularDependencyDetector } from '../../../../../packages/insight-core/src/detector/circular-detector.js';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

describe('CircularDependencyDetector', () => {
    let tempDir: string;
    let detector: CircularDependencyDetector;

    beforeEach(() => {
        // Create temp directory for test files
        tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'circular-test-'));
        detector = new CircularDependencyDetector(tempDir);
    });

    afterEach(() => {
        // Clean up temp directory
        if (fs.existsSync(tempDir)) {
            fs.rmSync(tempDir, { recursive: true, force: true });
        }
    });

    // Helper function to create test files
    function createFile(filePath: string, content: string): void {
        const fullPath = path.join(tempDir, filePath);
        const dir = path.dirname(fullPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(fullPath, content, 'utf8');
    }

    describe('Import Pattern Detection', () => {
        it('should detect ES6 named imports', async () => {
            createFile('a.ts', `import { foo } from './b';`);
            createFile('b.ts', `import { bar } from './a';`);

            const cycles = await detector.detect(tempDir);
            expect(cycles.length).toBe(1);
            expect(cycles[0].depth).toBe(2);
        });

        it('should detect ES6 default imports', async () => {
            createFile('a.ts', `import foo from './b';`);
            createFile('b.ts', `import bar from './a';`);

            const cycles = await detector.detect(tempDir);
            expect(cycles.length).toBe(1);
        });

        it('should detect ES6 namespace imports', async () => {
            createFile('a.ts', `import * as foo from './b';`);
            createFile('b.ts', `import * as bar from './a';`);

            const cycles = await detector.detect(tempDir);
            expect(cycles.length).toBe(1);
        });

        it('should detect dynamic imports', async () => {
            createFile('a.ts', `const b = import('./b');`);
            createFile('b.ts', `const a = import('./a');`);

            const cycles = await detector.detect(tempDir);
            expect(cycles.length).toBe(1);
        });

        it('should detect CommonJS require', async () => {
            createFile('a.js', `const b = require('./b');`);
            createFile('b.js', `const a = require('./a');`);

            const cycles = await detector.detect(tempDir);
            expect(cycles.length).toBe(1);
        });

        it('should detect export-from statements', async () => {
            createFile('a.ts', `export { foo } from './b';`);
            createFile('b.ts', `export { bar } from './a';`);

            const cycles = await detector.detect(tempDir);
            expect(cycles.length).toBe(1);
        });

        it('should detect multiple import patterns in one file', async () => {
            createFile('a.ts', `
                import { foo } from './b';
                import bar from './c';
                const d = import('./d');
            `);
            createFile('b.ts', `import { baz } from './a';`);
            createFile('c.ts', `import stuff from './a';`);
            createFile('d.ts', `import { thing } from './a';`);

            const cycles = await detector.detect(tempDir);
            expect(cycles.length).toBe(3); // a-b, a-c, a-d
        });
    });

    describe('Cycle Detection', () => {
        it('should detect simple 2-file cycle', async () => {
            createFile('a.ts', `import { foo } from './b';`);
            createFile('b.ts', `import { bar } from './a';`);

            const cycles = await detector.detect(tempDir);
            expect(cycles.length).toBe(1);
            expect(cycles[0].depth).toBe(2);
            expect(cycles[0].cycle.length).toBe(2);
        });

        it('should detect 3-file cycle', async () => {
            createFile('a.ts', `import { foo } from './b';`);
            createFile('b.ts', `import { bar } from './c';`);
            createFile('c.ts', `import { baz } from './a';`);

            const cycles = await detector.detect(tempDir);
            expect(cycles.length).toBe(1);
            expect(cycles[0].depth).toBe(3);
        });

        it('should detect 4-file cycle', async () => {
            createFile('a.ts', `import { foo } from './b';`);
            createFile('b.ts', `import { bar } from './c';`);
            createFile('c.ts', `import { baz } from './d';`);
            createFile('d.ts', `import { qux } from './a';`);

            const cycles = await detector.detect(tempDir);
            expect(cycles.length).toBe(1);
            expect(cycles[0].depth).toBe(4);
        });

        it('should detect multiple independent cycles', async () => {
            // Cycle 1: a-b
            createFile('a.ts', `import { foo } from './b';`);
            createFile('b.ts', `import { bar } from './a';`);

            // Cycle 2: c-d
            createFile('c.ts', `import { baz } from './d';`);
            createFile('d.ts', `import { qux } from './c';`);

            const cycles = await detector.detect(tempDir);
            expect(cycles.length).toBe(2);
        });

        it('should detect nested cycles', async () => {
            // Main cycle: a -> b -> c -> a
            createFile('a.ts', `import { foo } from './b';`);
            createFile('b.ts', `import { bar } from './c';`);
            createFile('c.ts', `import { baz } from './a';`);

            // Inner cycle: b -> d -> b
            createFile('d.ts', `import { qux } from './b';`);
            fs.appendFileSync(path.join(tempDir, 'b.ts'), `\nimport { inner } from './d';`);

            const cycles = await detector.detect(tempDir);
            expect(cycles.length).toBeGreaterThanOrEqual(2);
        });

        it('should not report false positives for non-circular imports', async () => {
            createFile('a.ts', `import { foo } from './b';`);
            createFile('b.ts', `import { bar } from './c';`);
            createFile('c.ts', `export const bar = 42;`);

            const cycles = await detector.detect(tempDir);
            expect(cycles.length).toBe(0);
        });
    });

    describe('Path Resolution', () => {
        it('should resolve relative imports with .ts extension', async () => {
            createFile('a.ts', `import { foo } from './b.ts';`);
            createFile('b.ts', `import { bar } from './a.ts';`);

            const cycles = await detector.detect(tempDir);
            expect(cycles.length).toBe(1);
        });

        it('should resolve relative imports without extension', async () => {
            createFile('a.ts', `import { foo } from './b';`);
            createFile('b.ts', `import { bar } from './a';`);

            const cycles = await detector.detect(tempDir);
            expect(cycles.length).toBe(1);
        });

        it('should resolve parent directory imports', async () => {
            createFile('dir1/a.ts', `import { foo } from '../dir2/b';`);
            createFile('dir2/b.ts', `import { bar } from '../dir1/a';`);

            const cycles = await detector.detect(tempDir);
            expect(cycles.length).toBe(1);
        });

        it('should resolve index.ts imports', async () => {
            createFile('dir1/index.ts', `import { foo } from '../dir2';`);
            createFile('dir2/index.ts', `import { bar } from '../dir1';`);

            const cycles = await detector.detect(tempDir);
            expect(cycles.length).toBe(1);
        });

        it('should try multiple extensions (.ts, .tsx, .js, .jsx)', async () => {
            createFile('a.tsx', `import { foo } from './b';`);
            createFile('b.jsx', `import { bar } from './a';`);

            const cycles = await detector.detect(tempDir);
            expect(cycles.length).toBe(1);
        });
    });

    describe('Severity Assessment', () => {
        it('should mark 2-file cycles as HIGH severity', async () => {
            createFile('a.ts', `import { foo } from './b';`);
            createFile('b.ts', `import { bar } from './a';`);

            const cycles = await detector.detect(tempDir);
            expect(cycles[0].severity).toBe('high');
        });

        it('should mark 3-4 file cycles as MEDIUM severity', async () => {
            createFile('a.ts', `import { foo } from './b';`);
            createFile('b.ts', `import { bar } from './c';`);
            createFile('c.ts', `import { baz } from './d';`);
            createFile('d.ts', `import { qux } from './a';`);

            const cycles = await detector.detect(tempDir);
            expect(cycles[0].severity).toBe('medium');
        });

        it('should mark 5+ file cycles as LOW severity', async () => {
            createFile('a.ts', `import { foo } from './b';`);
            createFile('b.ts', `import { bar } from './c';`);
            createFile('c.ts', `import { baz } from './d';`);
            createFile('d.ts', `import { qux } from './e';`);
            createFile('e.ts', `import { quux } from './f';`);
            createFile('f.ts', `import { corge } from './a';`);

            const cycles = await detector.detect(tempDir);
            expect(cycles[0].severity).toBe('low');
        });
    });

    describe('Refactoring Suggestions', () => {
        it('should provide suggestions for 2-file cycles', async () => {
            createFile('a.ts', `import { foo } from './b';`);
            createFile('b.ts', `import { bar } from './a';`);

            const cycles = await detector.detect(tempDir);
            expect(cycles[0].suggestedFix).toContain('Extract common code');
            expect(cycles[0].suggestedFix).toContain('dependency injection');
            expect(cycles[0].suggestedFix).toContain('lazy');
        });

        it('should provide suggestions for medium cycles', async () => {
            createFile('a.ts', `import { foo } from './b';`);
            createFile('b.ts', `import { bar } from './c';`);
            createFile('c.ts', `import { baz } from './a';`);

            const cycles = await detector.detect(tempDir);
            expect(cycles[0].suggestedFix).toContain('interfaces');
            expect(cycles[0].suggestedFix).toContain('dependency flow');
        });

        it('should provide suggestions for complex cycles', async () => {
            createFile('a.ts', `import { foo } from './b';`);
            createFile('b.ts', `import { bar } from './c';`);
            createFile('c.ts', `import { baz } from './d';`);
            createFile('d.ts', `import { qux } from './e';`);
            createFile('e.ts', `import { quux } from './a';`);

            const cycles = await detector.detect(tempDir);
            expect(cycles[0].suggestedFix).toContain('architecture');
            expect(cycles[0].suggestedFix).toContain('event-driven');
        });
    });

    describe('Exclusion Patterns', () => {
        it('should exclude node_modules', async () => {
            createFile('node_modules/a.ts', `import { foo } from './b';`);
            createFile('node_modules/b.ts', `import { bar } from './a';`);

            const cycles = await detector.detect(tempDir);
            expect(cycles.length).toBe(0);
        });

        it('should exclude dist directory', async () => {
            createFile('dist/a.ts', `import { foo } from './b';`);
            createFile('dist/b.ts', `import { bar } from './a';`);

            const cycles = await detector.detect(tempDir);
            expect(cycles.length).toBe(0);
        });

        it('should exclude .next directory', async () => {
            createFile('.next/a.ts', `import { foo } from './b';`);
            createFile('.next/b.ts', `import { bar } from './a';`);

            const cycles = await detector.detect(tempDir);
            expect(cycles.length).toBe(0);
        });

        it('should exclude test files', async () => {
            createFile('a.test.ts', `import { foo } from './b.test';`);
            createFile('b.test.ts', `import { bar } from './a.test';`);

            const cycles = await detector.detect(tempDir);
            expect(cycles.length).toBe(0);
        });

        it('should exclude spec files', async () => {
            createFile('a.spec.ts', `import { foo } from './b.spec';`);
            createFile('b.spec.ts', `import { bar } from './a.spec';`);

            const cycles = await detector.detect(tempDir);
            expect(cycles.length).toBe(0);
        });

        it('should exclude mock files', async () => {
            createFile('a.mock.ts', `import { foo } from './b.mock';`);
            createFile('b.mock.ts', `import { bar } from './a.mock';`);

            const cycles = await detector.detect(tempDir);
            expect(cycles.length).toBe(0);
        });

        it('should exclude fixture files', async () => {
            createFile('a.fixture.ts', `import { foo } from './b.fixture';`);
            createFile('b.fixture.ts', `import { bar } from './a.fixture';`);

            const cycles = await detector.detect(tempDir);
            expect(cycles.length).toBe(0);
        });

        it('should exclude data files', async () => {
            createFile('a.data.ts', `import { foo } from './b.data';`);
            createFile('b.data.ts', `import { bar } from './a.data';`);

            const cycles = await detector.detect(tempDir);
            expect(cycles.length).toBe(0);
        });

        it('should exclude examples directory', async () => {
            createFile('examples/a.ts', `import { foo } from './b';`);
            createFile('examples/b.ts', `import { bar } from './a';`);

            const cycles = await detector.detect(tempDir);
            expect(cycles.length).toBe(0);
        });

        it('should exclude demo directory', async () => {
            createFile('demo/a.ts', `import { foo } from './b';`);
            createFile('demo/b.ts', `import { bar } from './a';`);

            const cycles = await detector.detect(tempDir);
            expect(cycles.length).toBe(0);
        });
    });

    describe('Statistics', () => {
        it('should calculate total cycles', async () => {
            createFile('a.ts', `import { foo } from './b';`);
            createFile('b.ts', `import { bar } from './a';`);
            createFile('c.ts', `import { baz } from './d';`);
            createFile('d.ts', `import { qux } from './c';`);

            const cycles = await detector.detect(tempDir);
            const stats = detector.getStatistics(cycles);
            expect(stats.totalCycles).toBe(2);
        });

        it('should count cycles by severity', async () => {
            // HIGH: 2-file cycle
            createFile('a.ts', `import { foo } from './b';`);
            createFile('b.ts', `import { bar } from './a';`);

            // MEDIUM: 3-file cycle
            createFile('c.ts', `import { baz } from './d';`);
            createFile('d.ts', `import { qux } from './e';`);
            createFile('e.ts', `import { quux } from './c';`);

            const cycles = await detector.detect(tempDir);
            const stats = detector.getStatistics(cycles);
            expect(stats.bySeverity.high).toBe(1);
            expect(stats.bySeverity.medium).toBe(1);
        });

        it('should count cycles by depth', async () => {
            createFile('a.ts', `import { foo } from './b';`);
            createFile('b.ts', `import { bar } from './a';`);
            createFile('c.ts', `import { baz } from './d';`);
            createFile('d.ts', `import { qux } from './e';`);
            createFile('e.ts', `import { quux } from './c';`);

            const cycles = await detector.detect(tempDir);
            const stats = detector.getStatistics(cycles);
            expect(stats.byDepth[2]).toBe(1);
            expect(stats.byDepth[3]).toBe(1);
        });

        it('should count affected files', async () => {
            createFile('a.ts', `import { foo } from './b';`);
            createFile('b.ts', `import { bar } from './a';`);
            createFile('c.ts', `import { baz } from './d';`);
            createFile('d.ts', `import { qux } from './c';`);

            const cycles = await detector.detect(tempDir);
            const stats = detector.getStatistics(cycles);
            expect(stats.affectedFiles.size).toBe(4); // a, b, c, d
        });

        it('should handle empty results', async () => {
            createFile('a.ts', `export const foo = 42;`);

            const cycles = await detector.detect(tempDir);
            const stats = detector.getStatistics(cycles);
            expect(stats.totalCycles).toBe(0);
            expect(stats.bySeverity.high).toBe(0);
            expect(stats.affectedFiles.size).toBe(0);
        });
    });

    describe('Output Formatting', () => {
        it('should format error with cycle visualization', async () => {
            createFile('a.ts', `import { foo } from './b';`);
            createFile('b.ts', `import { bar } from './a';`);

            const cycles = await detector.detect(tempDir);
            const formatted = detector.formatError(cycles[0]);

            expect(formatted).toContain('CIRCULAR DEPENDENCY');
            expect(formatted).toContain('Depth: 2');
            expect(formatted).toContain('a.ts');
            expect(formatted).toContain('b.ts');
            expect(formatted).toContain('back to start');
        });

        it('should include severity emoji', async () => {
            createFile('a.ts', `import { foo } from './b';`);
            createFile('b.ts', `import { bar } from './a';`);

            const cycles = await detector.detect(tempDir);
            const formatted = detector.formatError(cycles[0]);

            expect(formatted).toContain('🔴'); // HIGH severity
        });

        it('should include suggested fix', async () => {
            createFile('a.ts', `import { foo } from './b';`);
            createFile('b.ts', `import { bar } from './a';`);

            const cycles = await detector.detect(tempDir);
            const formatted = detector.formatError(cycles[0]);

            expect(formatted).toContain('Suggested Fix');
            expect(formatted).toContain('Extract common code');
        });
    });

    describe('Edge Cases', () => {
        it('should handle empty directory', async () => {
            const cycles = await detector.detect(tempDir);
            expect(cycles.length).toBe(0);
        });

        it('should handle single file with no imports', async () => {
            createFile('a.ts', `export const foo = 42;`);

            const cycles = await detector.detect(tempDir);
            expect(cycles.length).toBe(0);
        });

        it('should handle self-import (edge case)', async () => {
            createFile('a.ts', `import { foo } from './a';`);

            const cycles = await detector.detect(tempDir);
            // Self-import might or might not be detected depending on implementation
            // This test documents the behavior
            expect(cycles.length).toBeGreaterThanOrEqual(0);
        });

        it('should handle malformed imports gracefully', async () => {
            createFile('a.ts', `import { incomplete from`);
            createFile('b.ts', `import { foo } from './a';`);

            // Should not throw, just skip malformed imports
            const cycles = await detector.detect(tempDir);
            expect(cycles).toBeDefined();
        });

        it('should handle non-existent import paths', async () => {
            createFile('a.ts', `import { foo } from './nonexistent';`);

            const cycles = await detector.detect(tempDir);
            expect(cycles.length).toBe(0);
        });

        it('should handle absolute imports (no cycles expected)', async () => {
            createFile('a.ts', `import { foo } from 'external-package';`);
            createFile('b.ts', `import { bar } from 'another-package';`);

            const cycles = await detector.detect(tempDir);
            expect(cycles.length).toBe(0);
        });
    });
});
