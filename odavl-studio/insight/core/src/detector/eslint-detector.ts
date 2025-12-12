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
            // WAVE 8 PHASE 1: Add timeout protection
            const output = execSync(`eslint . --format json --ignore-pattern ".next/**" --ignore-pattern "dist-test/**" --ignore-pattern "out/**"`, {
                cwd: dir,
                stdio: 'pipe',
                encoding: 'utf8',
                timeout: 120000, // 2 minutes timeout
            });

            return this.parseESLintOutput(output);

        } catch (error: any) {
            // Check if timeout occurred
            if (error.killed && error.signal === 'SIGTERM') {
                return [{
                    file: '',
                    line: 0,
                    column: 0,
                    message: 'ESLint detector exceeded timeout (2 minutes)',
                    ruleId: 'timeout',
                    severity: 2,
                    rootCause: 'Large project or complex linting rules',
                    suggestedFix: 'Optimize ESLint configuration or reduce scope'
                }];
            }
            
            // ESLint throws exception if errors found
            const output = error.stdout?.toString() || '[]';
            return this.parseESLintOutput(output);
        }
    }

    /**
     * Parse JSON output from ESLint
     * PHASE 2 FIX: Sanitize output before parsing to prevent JSON errors
     * PHASE 7 ENHANCEMENT: Handle multi-line output, multiple arrays, truncated JSON
     */
    private parseESLintOutput(output: string): ESLintError[] {
        const errors: ESLintError[] = [];

        try {
            // PHASE 2 FIX: Clean output - remove ANSI codes and trim
            let cleanOutput = output.replace(/\x1b\[[0-9;]*m/g, '').trim();
            
            // PHASE 7 ENHANCEMENT: Remove non-JSON prefix lines (e.g., "Linting...")
            const jsonStart = cleanOutput.indexOf('[');
            if (jsonStart > 0) {
                cleanOutput = cleanOutput.substring(jsonStart);
            }
            
            // PHASE 7 ENHANCEMENT: Extract first complete JSON array if multiple present
            const jsonEnd = cleanOutput.lastIndexOf(']');
            if (jsonEnd > 0 && jsonEnd < cleanOutput.length - 1) {
                cleanOutput = cleanOutput.substring(0, jsonEnd + 1);
            }
            
            // PHASE 2 FIX: If output is empty or not JSON, return empty array
            if (!cleanOutput || !cleanOutput.startsWith('[')) {
                logger.warn('[ESLintDetector] No valid JSON output from ESLint');
                return errors;
            }
            
            // PHASE 2 FIX: Validate JSON structure before parsing
            const results = JSON.parse(cleanOutput);
            
            if (!Array.isArray(results)) {
                logger.warn('[ESLintDetector] ESLint output is not an array');
                return errors;
            }

            for (const result of results) {
                if (!result || typeof result !== 'object') continue;
                
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
        } catch (parseError: any) {
            // PHASE 2 FIX: More detailed error logging
            logger.error('[ESLintDetector] Failed to parse ESLint output:', {
                error: parseError.message,
                outputLength: output.length,
                outputPreview: output.substring(0, 200)
            });
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
