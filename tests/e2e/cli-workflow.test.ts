import { describe, it, expect } from 'vitest';
import { execSync } from 'node:child_process';

describe('E2E: ODAVL CLI Commands', () => {
    const cliPath = 'node apps/studio-cli/dist/index.js';

    it('should display version information', () => {
        const output = execSync(`${cliPath} -V`, { encoding: 'utf-8' });
        expect(output.trim()).toMatch(/\d+\.\d+\.\d+/);
    });

    it('should display main help', () => {
        const output = execSync(`${cliPath} --help`, { encoding: 'utf-8' });
        expect(output).toContain('ODAVL Studio');
        expect(output).toContain('insight');
        expect(output).toContain('autopilot');
        expect(output).toContain('guardian');
    });

    it('should display studio information', () => {
        const output = execSync(`${cliPath} info`, { encoding: 'utf-8' });
        expect(output).toContain('ODAVL Studio');
        expect(output).toContain('ODAVL Insight');
        expect(output).toContain('ODAVL Autopilot');
        expect(output).toContain('ODAVL Guardian');
    });

    describe('Insight Commands', () => {
        it('should display insight help', () => {
            const output = execSync(`${cliPath} insight --help`, { encoding: 'utf-8' });
            expect(output).toContain('Error detection');
            expect(output).toContain('analyze');
            expect(output).toContain('fix');
        });

        it('should display analyze help', () => {
            const output = execSync(`${cliPath} insight analyze --help`, { encoding: 'utf-8' });
            expect(output).toContain('Analyze workspace');
            expect(output).toContain('detectors');
        });
    });

    describe('Autopilot Commands', () => {
        it('should display autopilot help', () => {
            const output = execSync(`${cliPath} autopilot --help`, { encoding: 'utf-8' });
            expect(output).toContain('Self-healing');
            expect(output).toContain('run');
            expect(output).toContain('observe');
            expect(output).toContain('decide');
            expect(output).toContain('act');
            expect(output).toContain('verify');
            expect(output).toContain('learn');
            expect(output).toContain('undo');
        });

        it('should display run help with options', () => {
            const output = execSync(`${cliPath} autopilot run --help`, { encoding: 'utf-8' });
            expect(output).toContain('O-D-A-V-L cycle');
            expect(output).toContain('--max-files');
            expect(output).toContain('--max-loc');
        });
    });

    describe('Guardian Commands', () => {
        it('should display guardian help', () => {
            const output = execSync(`${cliPath} guardian --help`, { encoding: 'utf-8' });
            expect(output).toContain('Pre-deploy');
            expect(output).toContain('test');
            expect(output).toContain('accessibility');
            expect(output).toContain('performance');
            expect(output).toContain('security');
        });

        it('should display test help', () => {
            const output = execSync(`${cliPath} guardian test --help`, { encoding: 'utf-8' });
            expect(output).toContain('pre-deploy tests');
            expect(output).toContain('<url>');
        });
    });

    describe('Error Handling', () => {
        it('should handle invalid commands gracefully', () => {
            try {
                execSync(`${cliPath} invalid-command`, { encoding: 'utf-8', stdio: 'pipe' });
                expect(false).toBe(true); // Should not reach here
            } catch (error: any) {
                expect(error.stderr || error.stdout).toBeDefined();
            }
        });

        it('should handle missing arguments', () => {
            try {
                // Guardian test requires URL
                execSync(`${cliPath} guardian test`, { encoding: 'utf-8', stdio: 'pipe' });
            } catch (error: any) {
                // Should either show help or error about missing URL
                const output = error.stderr?.toString() || error.stdout?.toString() || '';
                expect(output.length).toBeGreaterThan(0);
            }
        });
    });
});
