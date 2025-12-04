/**
 * Build Error Detector
 * Detects build errors: webpack/vite/rollup errors, compilation failures
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { execSync } from 'node:child_process';

export interface BuildError {
    type: 'webpack' | 'vite' | 'rollup' | 'tsc' | 'esbuild' | 'next' | 'generic';
    file?: string;
    line?: number;
    message: string;
    errorCode?: string;
    rootCause: string;
    suggestedFix: string;
    severity: 'error' | 'warning';
}

export class BuildDetector {
    private readonly workspaceRoot: string;

    constructor(workspaceRoot: string) {
        this.workspaceRoot = workspaceRoot;
    }

    /**
     * Detects build errors
     */
    async detect(targetDir?: string): Promise<BuildError[]> {
        const dir = targetDir || this.workspaceRoot;
        const errors: BuildError[] = [];

        // Check package.json to identify build tool being used
        const pkgPath = path.join(dir, 'package.json');
        if (!fs.existsSync(pkgPath)) {
            return [{
                type: 'generic',
                message: 'package.json not found',
                rootCause: 'No package.json file found in directory',
                suggestedFix: 'Ensure you are in the correct project directory',
                severity: 'error'
            }];
        }

        const pkgJson = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

        // Detect build tool
        const buildTool = this.detectBuildTool(pkgJson);

        // Run build and extract errors
        try {
            const buildOutput = await this.runBuild(dir, buildTool);
            // Build succeeded - only parse output if there are actual ERROR patterns
            // Don't report generic errors for successful builds (warnings are OK)
            const buildErrors = this.parseBuildOutput(buildOutput, buildTool, false);
            errors.push(...buildErrors);
        } catch (err: unknown) {
            // Build failed - extract errors from stderr/stdout
            const error = err as { stderr?: string; stdout?: string; message?: string };
            const output = error.stderr || error.stdout || error.message || '';
            const buildErrors = this.parseBuildOutput(output, buildTool, true);
            errors.push(...buildErrors);
        }

        return errors;
    }

    /**
     * Detect build tool from package.json
     */
    private detectBuildTool(pkgJson: Record<string, unknown>): BuildError['type'] {
        const scripts = (pkgJson.scripts || {}) as Record<string, string>;
        const deps = { ...(pkgJson.dependencies as Record<string, string> || {}), ...(pkgJson.devDependencies as Record<string, string> || {}) };

        if (deps.next || scripts.build?.includes('next')) return 'next';
        if (deps.vite || scripts.build?.includes('vite')) return 'vite';
        if (deps.webpack || scripts.build?.includes('webpack')) return 'webpack';
        if (deps.rollup || scripts.build?.includes('rollup')) return 'rollup';
        if (deps.esbuild || scripts.build?.includes('esbuild')) return 'esbuild';
        if (scripts.build?.includes('tsc')) return 'tsc';

        return 'generic';
    }

    /**
     * Run build command
     */
    private async runBuild(dir: string, buildTool: BuildError['type']): Promise<string> {
        const commands: Record<string, string> = {
            next: 'pnpm run build',
            vite: 'pnpm run build',
            webpack: 'pnpm run build',
            rollup: 'pnpm run build',
            esbuild: 'pnpm run build',
            tsc: 'pnpm exec tsc --noEmit',
            generic: 'pnpm run build'
        };

        const cmd = commands[buildTool];

        try {
            const output = execSync(cmd, {
                cwd: dir,
                stdio: 'pipe',
                encoding: 'utf8',
                timeout: 60000 // 1 minute timeout
            });
            return output;
        } catch (err: unknown) {
            // Re-throw to handle in detect()
            throw err;
        }
    }

    /**
     * Parse build output and extract errors
     * @param output - Build command output
     * @param buildTool - Detected build tool type
     * @param buildFailed - Whether the build command failed (exited with error)
     */
    private parseBuildOutput(output: string, buildTool: BuildError['type'], buildFailed: boolean): BuildError[] {
        const errors: BuildError[] = [];

        // Common patterns
        const patterns = [
            // Webpack errors
            {
                regex: /ERROR in (.+)\n\s*Module not found: Error: Can't resolve '(.+)'/g,
                type: 'webpack' as const,
                extract: (match: RegExpExecArray): Partial<BuildError> => ({
                    file: match[1],
                    message: `Module not found: ${match[2]}`,
                    rootCause: `Webpack couldn't find module: ${match[2]}`,
                    suggestedFix: `Verify file exists or install package:\n   pnpm add ${match[2]}`
                })
            },
            // Vite errors
            {
                regex: /(\[vite\]|×) (.+?)\n.*?at (.+):(\d+):\d+/gs,
                type: 'vite' as const,
                extract: (match: RegExpExecArray): Partial<BuildError> => ({
                    file: match[3],
                    line: Number.parseInt(match[4], 10),
                    message: match[2],
                    rootCause: `Vite error: ${match[2]}`,
                    suggestedFix: `Check file ${match[3]} line ${match[4]}`
                })
            },
            // Next.js errors
            {
                regex: /Error: (.+?)\n.*?> (\d+) \| (.+)/gs,
                type: 'next' as const,
                extract: (match: RegExpExecArray): Partial<BuildError> => ({
                    line: Number.parseInt(match[2], 10),
                    message: match[1],
                    rootCause: `Next.js build error: ${match[1]}`,
                    suggestedFix: 'Check Next.js documentation'
                })
            },
            // Generic module errors
            {
                regex: /Cannot find module ['"](.+?)['"]/g,
                type: buildTool,
                extract: (match: RegExpExecArray): Partial<BuildError> => ({
                    message: `Cannot find module: ${match[1]}`,
                    rootCause: `Module not found: ${match[1]}`,
                    suggestedFix: `pnpm add ${match[1]}`
                })
            },
            // Syntax errors
            {
                regex: /SyntaxError: (.+)\n.*?at (.+):(\d+):(\d+)/g,
                type: buildTool,
                extract: (match: RegExpExecArray): Partial<BuildError> => ({
                    file: match[2],
                    line: Number.parseInt(match[3], 10),
                    message: `SyntaxError: ${match[1]}`,
                    rootCause: `Syntax error: ${match[1]}`,
                    suggestedFix: `Check file ${match[2]} line ${match[3]}`
                })
            }
        ];

        for (const pattern of patterns) {
            let match: RegExpExecArray | null;
            while ((match = pattern.regex.exec(output)) !== null) {
                const extracted = pattern.extract(match);
                errors.push({
                    type: pattern.type,
                    file: extracted.file,
                    line: extracted.line,
                    message: extracted.message || 'Unknown error',
                    rootCause: extracted.rootCause || 'Unknown cause',
                    suggestedFix: extracted.suggestedFix || 'No suggestion available',
                    severity: 'error'
                });
            }
        }

        // If no specific errors found but build failed, add generic error
        if (buildFailed && errors.length === 0 && output.toLowerCase().includes('error')) {
            errors.push({
                type: buildTool,
                message: 'Build failed',
                rootCause: 'Build failed - review full output',
                suggestedFix: 'Run build command manually and review details:\n   pnpm run build',
                severity: 'error'
            });
        }

        return errors;
    }

    /**
     * Format error for display
     */
    formatError(error: BuildError): string {
        const relPath = error.file ? path.relative(this.workspaceRoot, error.file) : 'N/A';

        return `
🏗️  BUILD ERROR [${error.type.toUpperCase()}]
📁 File: ${relPath}
${error.line ? `📍 Line: ${error.line}` : ''}
💬 Message: ${error.message}

🔍 Root Cause:
   ${error.rootCause}

✅ Suggested Fix:
   ${error.suggestedFix}
${'─'.repeat(60)}
`;
    }
}
