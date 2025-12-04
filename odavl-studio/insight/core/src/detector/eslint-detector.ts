/**
 * ESLint Error Detector
 * Detects ESLint errors in the project
 */

import { execSync } from 'node:child_process';
import * as path from 'node:path';
import { logger } from '../utils/logger';

export interface ESLintError {
    file: string;
    line: number;
    column: number;
    message: string;
    ruleId: string;           // e.g. no-unused-vars
    severity: 1 | 2;          // 1=warning, 2=error
    rootCause?: string;
    suggestedFix?: string;
    fixable?: boolean;        // Can it be auto-fixed?
}

export class ESLintDetector {
    private workspaceRoot: string;

    constructor(workspaceRoot: string) {
        this.workspaceRoot = workspaceRoot;
    }

    /**
     * Detects all ESLint errors in the specified directory
     */
    async detect(targetDir?: string): Promise<ESLintError[]> {
        const dir = targetDir || this.workspaceRoot;

        try {
            // Run ESLint with JSON format, ignoring .next, dist-test, out directories
            const output = execSync(`eslint . --format json --ignore-pattern ".next/**" --ignore-pattern "dist-test/**" --ignore-pattern "out/**"`, {
                cwd: dir,
                stdio: 'pipe',
                encoding: 'utf8'
            });

            return this.parseESLintOutput(output);

        } catch (error: any) {
            // ESLint throws exception if errors found
            const output = error.stdout?.toString() || '[]';
            return this.parseESLintOutput(output);
        }
    }

    /**
     * Parse JSON output from ESLint
     */
    private parseESLintOutput(output: string): ESLintError[] {
        const errors: ESLintError[] = [];

        try {
            const results = JSON.parse(output);

            for (const result of results) {
                const filePath = result.filePath;

                // Skip build artifacts and compiled files
                if (filePath.includes('.next' + path.sep) || 
                    filePath.includes('dist-test' + path.sep) || 
                    filePath.includes(path.sep + 'out' + path.sep)) {
                    continue;
                }

                for (const message of result.messages) {
                    const error: ESLintError = {
                        file: filePath,
                        line: message.line || 0,
                        column: message.column || 0,
                        message: message.message,
                        ruleId: message.ruleId || 'unknown',
                        severity: message.severity,
                        fixable: message.fix !== undefined
                    };

                    this.analyzeRootCause(error);
                    errors.push(error);
                }
            }
        } catch (parseError) {
            logger.error('Failed to parse ESLint output:', parseError);
        }

        return errors;
    }

    /**
     * Analyze root cause of the error
     */
    private analyzeRootCause(error: ESLintError): void {
        const knownRules: Record<string, { cause: string; fix: string }> = {
            'no-unused-vars': {
                cause: 'Variable declared but not used',
                fix: 'Delete the variable, use it, or prefix with _ if intentional'
            },
            'no-console': {
                cause: 'Using console.log in code',
                fix: 'Use a custom logger or remove console.log before production'
            },
            '@typescript-eslint/no-explicit-any': {
                cause: 'Using any instead of specific type',
                fix: 'Specify a precise type instead of any (e.g. string, number, object)'
            },
            'import/no-unresolved': {
                cause: 'Import path not found',
                fix: 'Verify path correctness and file existence'
            },
            'no-debugger': {
                cause: 'Using debugger statement',
                fix: 'Remove debugger before committing code'
            },
            '@typescript-eslint/no-unused-vars': {
                cause: 'TypeScript variable not used',
                fix: 'Delete the variable or use it'
            },
            'react/prop-types': {
                cause: 'Component props without PropTypes definition',
                fix: 'Add PropTypes or use TypeScript interfaces'
            },
            'react-hooks/exhaustive-deps': {
                cause: 'useEffect dependencies incomplete',
                fix: 'Add all used variables to dependency array'
            }
        };

        const rule = knownRules[error.ruleId];
        if (rule) {
            error.rootCause = rule.cause;
            error.suggestedFix = rule.fix;
        } else {
            error.rootCause = `ESLint rule: ${error.ruleId}`;
            error.suggestedFix = `Check ESLint docs for ${error.ruleId}`;
        }
    }

    /**
     * Format error for display
     */
    formatError(error: ESLintError): string {
        const icon = error.severity === 2 ? '❌' : '⚠️';
        const relPath = path.relative(this.workspaceRoot, error.file);
        const fixableTag = error.fixable ? '🔧 [Auto-fixable]' : '';

        return `
${icon} ${error.severity === 2 ? 'ERROR' : 'WARNING'} [${error.ruleId}] ${fixableTag}
📁 File: ${relPath}
📍 Line: ${error.line}, Column: ${error.column}
💬 Error: ${error.message}

🔍 Root Cause:
   ${error.rootCause}

✅ Suggested Fix:
   ${error.suggestedFix}
${'─'.repeat(60)}
`;
    }

    /**
     * Apply automatic fixes
     */
    async autoFix(targetDir?: string): Promise<{ fixed: number; failed: number }> {
        const dir = targetDir || this.workspaceRoot;

        try {
            execSync(`eslint . --fix`, {
                cwd: dir,
                stdio: 'inherit'
            });

            return { fixed: 0, failed: 0 }; // ESLint doesn't return fix count
        } catch (error) {
            logger.error('Auto-fix failed:', error);
            return { fixed: 0, failed: 1 };
        }
    }
}
