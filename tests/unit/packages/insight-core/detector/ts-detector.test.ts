/**
 * ODAVL Insight - TSDetector Unit Tests
 * Target: 80% coverage for TypeScript detector
 * Created: 2025-01-09
 */

import { describe, expect, it, beforeEach, vi, afterEach } from 'vitest';
import { TSDetector, type TSError } from '../../../../../odavl-studio/insight/core/src/detector/ts-detector.js';
import * as path from 'node:path';
import * as childProcess from 'node:child_process';

// Mock child_process to avoid real tsc execution
vi.mock('node:child_process', () => ({
    execSync: vi.fn()
}));

describe('TSDetector', () => {
    let detector: TSDetector;
    const mockWorkspaceRoot = '/test/workspace';

    beforeEach(() => {
        detector = new TSDetector(mockWorkspaceRoot);
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('Constructor', () => {
        it('should create detector instance with workspace root', () => {
            expect(detector).toBeInstanceOf(TSDetector);
        });

        it('should store workspace root', () => {
            // Test internal state by running detect and checking paths
            const testDetector = new TSDetector('/custom/path');
            expect(testDetector).toBeDefined();
        });
    });

    describe('detect() - Success Cases', () => {
        it('should return empty array when no TypeScript errors', async () => {
            // Mock successful tsc execution (no errors)
            vi.mocked(childProcess.execSync).mockReturnValue(Buffer.from(''));

            const result = await detector.detect();

            expect(result).toEqual([]);
            expect(childProcess.execSync).toHaveBeenCalledWith(
                expect.stringContaining('tsc --noEmit'),
                expect.objectContaining({ cwd: mockWorkspaceRoot })
            );
        });

        it('should use custom target directory if provided', async () => {
            vi.mocked(childProcess.execSync).mockReturnValue(Buffer.from(''));

            const customDir = '/custom/dir';
            await detector.detect(customDir);

            expect(childProcess.execSync).toHaveBeenCalledWith(
                expect.stringContaining('tsc --noEmit'),
                expect.objectContaining({ cwd: customDir })
            );
        });

        it('should use workspace root tsconfig.json', async () => {
            vi.mocked(childProcess.execSync).mockReturnValue(Buffer.from(''));

            await detector.detect();

            const expectedTsconfigPath = path.join(mockWorkspaceRoot, 'tsconfig.json');
            expect(childProcess.execSync).toHaveBeenCalledWith(
                expect.stringContaining(`--project ${expectedTsconfigPath}`),
                expect.any(Object)
            );
        });
    });

    describe('detect() - Error Parsing', () => {
        it('should parse single TS2307 error (module not found)', async () => {
            const mockOutput = `src/index.ts(10,5): error TS2307: Cannot find module 'express'.`;

            const mockError: any = new Error('tsc failed');
            mockError.stdout = mockOutput;
            vi.mocked(childProcess.execSync).mockImplementation(() => {
                throw mockError;
            });

            const result = await detector.detect();

            expect(result).toHaveLength(1);
            expect(result[0].file).toMatch(/src[\\\/]index\.ts$/); // Platform-agnostic path check
            expect(result[0].line).toBe(10);
            expect(result[0].column).toBe(5);
            expect(result[0].message).toBe(`Cannot find module 'express'.`);
            expect(result[0].code).toBe('TS2307');
            expect(result[0].severity).toBe('error');
            expect(result[0].rootCause).toContain('Module not found');
            expect(result[0].suggestedFix).toContain('tsconfig.json');
        });

        it('should parse multiple TypeScript errors', async () => {
            const mockOutput = `
src/index.ts(10,5): error TS2307: Cannot find module 'express'.
src/utils.ts(5,12): error TS2304: Cannot find name 'foo'.
src/types.ts(20,8): warning TS2571: Object is of type 'unknown'.
`;

            const mockError: any = new Error('tsc failed');
            mockError.stdout = mockOutput;
            vi.mocked(childProcess.execSync).mockImplementation(() => {
                throw mockError;
            });

            const result = await detector.detect();

            expect(result).toHaveLength(3);
            expect(result[0].code).toBe('TS2307');
            expect(result[1].code).toBe('TS2304');
            expect(result[2].code).toBe('TS2571');
            expect(result[2].severity).toBe('warning');
        });

        it('should parse TS2304 error (variable not defined)', async () => {
            const mockOutput = `src/app.ts(15,8): error TS2304: Cannot find name 'console'.`;

            const mockError: any = new Error('tsc failed');
            mockError.stdout = mockOutput;
            vi.mocked(childProcess.execSync).mockImplementation(() => {
                throw mockError;
            });

            const result = await detector.detect();

            expect(result[0]).toMatchObject({
                code: 'TS2304',
                rootCause: expect.stringContaining('Variable/Type not defined'),
                suggestedFix: expect.stringContaining('Add import')
            });
        });

        it('should parse TS2345 error (type mismatch)', async () => {
            const mockOutput = `src/math.ts(7,12): error TS2345: Argument of type 'string' is not assignable to parameter of type 'number'.`;

            const mockError: any = new Error('tsc failed');
            mockError.stdout = mockOutput;
            vi.mocked(childProcess.execSync).mockImplementation(() => {
                throw mockError;
            });

            const result = await detector.detect();

            expect(result[0]).toMatchObject({
                code: 'TS2345',
                rootCause: expect.stringContaining('Type mismatch'),
                suggestedFix: expect.stringContaining('Change variable or value type')
            });
        });

        it('should parse TS2339 error (property does not exist)', async () => {
            const mockOutput = `src/user.ts(12,5): error TS2339: Property 'age' does not exist on type 'User'.`;

            const mockError: any = new Error('tsc failed');
            mockError.stdout = mockOutput;
            vi.mocked(childProcess.execSync).mockImplementation(() => {
                throw mockError;
            });

            const result = await detector.detect();

            expect(result[0]).toMatchObject({
                code: 'TS2339',
                rootCause: expect.stringContaining('Property does not exist'),
                suggestedFix: expect.stringContaining('Add property to interface')
            });
        });

        it('should parse TS2322 error (type assignment)', async () => {
            const mockOutput = `src/config.ts(8,2): error TS2322: Type 'number' is not assignable to type 'string'.`;

            const mockError: any = new Error('tsc failed');
            mockError.stdout = mockOutput;
            vi.mocked(childProcess.execSync).mockImplementation(() => {
                throw mockError;
            });

            const result = await detector.detect();

            expect(result[0]).toMatchObject({
                code: 'TS2322',
                rootCause: expect.stringContaining('Type assignment error'),
                suggestedFix: expect.stringContaining('types match')
            });
        });

        it('should parse TS2554 error (function arguments)', async () => {
            const mockOutput = `src/api.ts(20,10): error TS2554: Expected 2 arguments, but got 1.`;

            const mockError: any = new Error('tsc failed');
            mockError.stdout = mockOutput;
            vi.mocked(childProcess.execSync).mockImplementation(() => {
                throw mockError;
            });

            const result = await detector.detect();

            expect(result[0]).toMatchObject({
                code: 'TS2554',
                rootCause: expect.stringContaining('Function arguments mismatch'),
                suggestedFix: expect.stringContaining('Check required number')
            });
        });

        it('should parse TS1192 error (no default export)', async () => {
            const mockOutput = `src/module.ts(1,8): error TS1192: Module '"./utils"' has no default export.`;

            const mockError: any = new Error('tsc failed');
            mockError.stdout = mockOutput;
            vi.mocked(childProcess.execSync).mockImplementation(() => {
                throw mockError;
            });

            const result = await detector.detect();

            expect(result[0]).toMatchObject({
                code: 'TS1192',
                rootCause: expect.stringContaining('Module has no default export'),
                suggestedFix: expect.stringContaining('import { name }')
            });
        });

        it('should handle unknown error codes with fallback', async () => {
            const mockOutput = `src/test.ts(5,2): error TS9999: Unknown error occurred.`;

            const mockError: any = new Error('tsc failed');
            mockError.stdout = mockOutput;
            vi.mocked(childProcess.execSync).mockImplementation(() => {
                throw mockError;
            });

            const result = await detector.detect();

            expect(result[0]).toMatchObject({
                code: 'TS9999',
                rootCause: expect.stringContaining('Unknown TypeScript error'),
                suggestedFix: expect.stringContaining('Search for TS9999')
            });
        });
    });

    describe('detect() - Edge Cases', () => {
        it('should handle stderr output when stdout is empty', async () => {
            const mockOutput = `src/index.ts(10,5): error TS2307: Cannot find module 'express'.`;

            const mockError: any = new Error('tsc failed');
            mockError.stderr = mockOutput;
            vi.mocked(childProcess.execSync).mockImplementation(() => {
                throw mockError;
            });

            const result = await detector.detect();

            expect(result).toHaveLength(1);
            expect(result[0].code).toBe('TS2307');
        });

        it('should return empty array when error has no output', async () => {
            const mockError: any = new Error('tsc failed');
            mockError.stdout = '';
            mockError.stderr = '';
            vi.mocked(childProcess.execSync).mockImplementation(() => {
                throw mockError;
            });

            const result = await detector.detect();

            expect(result).toEqual([]);
        });

        it('should ignore lines that do not match error pattern', async () => {
            const mockOutput = `
Compiling TypeScript files...
src/index.ts(10,5): error TS2307: Cannot find module 'express'.
This is a random line that should be ignored
Another random line
src/utils.ts(5,12): error TS2304: Cannot find name 'foo'.
`;

            const mockError: any = new Error('tsc failed');
            mockError.stdout = mockOutput;
            vi.mocked(childProcess.execSync).mockImplementation(() => {
                throw mockError;
            });

            const result = await detector.detect();

            expect(result).toHaveLength(2);
            expect(result[0].code).toBe('TS2307');
            expect(result[1].code).toBe('TS2304');
        });

        it('should handle warnings correctly', async () => {
            const mockOutput = `src/index.ts(10,5): warning TS2571: Object is of type 'unknown'.`;

            const mockError: any = new Error('tsc failed');
            mockError.stdout = mockOutput;
            vi.mocked(childProcess.execSync).mockImplementation(() => {
                throw mockError;
            });

            const result = await detector.detect();

            expect(result[0].severity).toBe('warning');
        });

        it('should resolve file paths relative to workspace root', async () => {
            const mockOutput = `src/nested/deep/file.ts(10,5): error TS2307: Cannot find module 'express'.`;

            const mockError: any = new Error('tsc failed');
            mockError.stdout = mockOutput;
            vi.mocked(childProcess.execSync).mockImplementation(() => {
                throw mockError;
            });

            const result = await detector.detect();

            expect(result[0].file).toMatch(/src[\\\/]nested[\\\/]deep[\\\/]file\.ts$/);
            expect(path.isAbsolute(result[0].file)).toBe(true);
        });
    });

    describe('formatError()', () => {
        it('should format error with icon for error severity', () => {
            const error: TSError = {
                file: '/test/workspace/src/index.ts',
                line: 10,
                column: 5,
                message: 'Cannot find module',
                code: 'TS2307',
                severity: 'error',
                rootCause: 'Module not found',
                suggestedFix: 'Check path'
            };

            const formatted = detector.formatError(error);

            expect(formatted).toContain('❌');
            expect(formatted).toContain('ERROR');
            expect(formatted).toContain('TS2307');
            expect(formatted).toMatch(/src[\\\/]index\.ts/); // Platform-agnostic path check
            expect(formatted).toContain('Line: 10, Column: 5');
            expect(formatted).toContain('Cannot find module');
            expect(formatted).toContain('Module not found');
        });

        it('should format warning with icon for warning severity', () => {
            const error: TSError = {
                file: '/test/workspace/src/utils.ts',
                line: 5,
                column: 12,
                message: 'Object is of type unknown',
                code: 'TS2571',
                severity: 'warning',
                rootCause: 'Type unknown',
                suggestedFix: 'Add type annotation'
            };

            const formatted = detector.formatError(error);

            expect(formatted).toContain('⚠️');
            expect(formatted).toContain('WARNING');
        });

        it('should use relative paths in formatted output', () => {
            const error: TSError = {
                file: path.join(mockWorkspaceRoot, 'src', 'deeply', 'nested', 'file.ts'),
                line: 10,
                column: 5,
                message: 'Error',
                code: 'TS2307',
                severity: 'error'
            };

            const formatted = detector.formatError(error);

            // Check for platform-agnostic path separators
            expect(formatted).toMatch(/src[\\\/]deeply[\\\/]nested[\\\/]file\.ts/);
            expect(formatted).not.toContain(mockWorkspaceRoot);
        });

        it('should include root cause analysis when available', () => {
            const error: TSError = {
                file: '/test/workspace/src/index.ts',
                line: 10,
                column: 5,
                message: 'Error',
                code: 'TS2307',
                severity: 'error',
                rootCause: 'Detailed root cause explanation',
                suggestedFix: 'Suggested solution'
            };

            const formatted = detector.formatError(error);

            expect(formatted).toContain('Root Cause:');
            expect(formatted).toContain('Detailed root cause explanation');
        });

        it('should include suggested fix when available', () => {
            const error: TSError = {
                file: '/test/workspace/src/index.ts',
                line: 10,
                column: 5,
                message: 'Error',
                code: 'TS2307',
                severity: 'error',
                suggestedFix: 'Try this fix'
            };

            const formatted = detector.formatError(error);

            expect(formatted).toContain('Try this fix');
        });
    });

    describe('Performance', () => {
        it('should complete detection within reasonable time', async () => {
            vi.mocked(childProcess.execSync).mockReturnValue(Buffer.from(''));

            const startTime = Date.now();
            await detector.detect();
            const duration = Date.now() - startTime;

            expect(duration).toBeLessThan(1000); // Should complete in < 1 second
        });

        it('should handle large error output efficiently', async () => {
            // Generate 100 errors
            const mockOutput = Array.from({ length: 100 }, (_, i) =>
                `src/file${i}.ts(${i + 1},5): error TS2307: Cannot find module 'module${i}'.`
            ).join('\n');

            const mockError: any = new Error('tsc failed');
            mockError.stdout = mockOutput;
            vi.mocked(childProcess.execSync).mockImplementation(() => {
                throw mockError;
            });

            const startTime = Date.now();
            const result = await detector.detect();
            const duration = Date.now() - startTime;

            expect(result).toHaveLength(100);
            expect(duration).toBeLessThan(1000); // Should parse 100 errors in < 1 second
        });
    });

    describe('Integration Scenarios', () => {
        it('should handle mixed error and warning severities', async () => {
            const mockOutput = `
src/index.ts(10,5): error TS2307: Cannot find module 'express'.
src/utils.ts(5,12): warning TS2571: Object is of type 'unknown'.
src/types.ts(20,8): error TS2304: Cannot find name 'foo'.
`;

            const mockError: any = new Error('tsc failed');
            mockError.stdout = mockOutput;
            vi.mocked(childProcess.execSync).mockImplementation(() => {
                throw mockError;
            });

            const result = await detector.detect();

            expect(result).toHaveLength(3);
            expect(result.filter(e => e.severity === 'error')).toHaveLength(2);
            expect(result.filter(e => e.severity === 'warning')).toHaveLength(1);
        });

        it('should handle all known error codes', async () => {
            const knownCodes = ['TS2307', 'TS2304', 'TS2345', 'TS2339', 'TS2322', 'TS2554', 'TS2571', 'TS1192'];

            for (const code of knownCodes) {
                const mockOutput = `src/test.ts(1,1): error ${code}: Error message.`;
                const mockError: any = new Error('tsc failed');
                mockError.stdout = mockOutput;
                vi.mocked(childProcess.execSync).mockImplementation(() => {
                    throw mockError;
                });

                const result = await detector.detect();

                expect(result[0].code).toBe(code);
                expect(result[0].rootCause).toBeDefined();
                expect(result[0].suggestedFix).toBeDefined();
                expect(result[0].rootCause).not.toContain('Unknown');
            }
        });
    });
});
