/**
 * TypeScript Error Detector
 * Detects TypeScript errors via tsc --noEmit
 */

import { execSync } from 'node:child_process';
import * as path from 'node:path';

export interface TSError {
    file: string;           // Full file path
    line: number;           // Line number
    column: number;         // Column number
    message: string;        // Error message
    code: string;           // TS error code (e.g. TS2307)
    severity: 'error' | 'warning';
    rootCause?: string;     // Root cause analysis
    suggestedFix?: string;  // Suggested solution
}

export class TSDetector {
    private workspaceRoot: string;

    constructor(workspaceRoot: string) {
        this.workspaceRoot = workspaceRoot;
    }

    /**
     * Detects all TypeScript errors in the specified directory
     */
    async detect(targetDir?: string): Promise<TSError[]> {
        const dir = targetDir || this.workspaceRoot;

        try {
            // Run TypeScript compiler in noEmit mode
            const tsconfigPath = path.join(dir, 'tsconfig.json');
            execSync(`tsc --noEmit --project ${tsconfigPath}`, {
                cwd: dir,
                stdio: 'pipe',
                encoding: 'utf8'
            });

            // If no exception occurred, no errors found
            return [];

        } catch (error: any) {
            // Parse output from TypeScript compiler
            const output = error.stdout?.toString() || error.stderr?.toString() || '';
            return this.parseTypeScriptOutput(output);
        }
    }

    /**
     * Parse tsc output and convert to TSError[]
     */
    private parseTypeScriptOutput(output: string): TSError[] {
        const errors: TSError[] = [];
        const lines = output.split('\n');

        // TypeScript error pattern:
        // src/index.ts(10,5): error TS2304: Cannot find name 'foo'.
        const errorRegex = /^(.+?)\((\d+),(\d+)\): (error|warning) (TS\d+): (.+)$/;

        for (const line of lines) {
            const match = line.match(errorRegex);
            if (match) {
                const [, file, lineNum, column, severity, code, message] = match;

                const error: TSError = {
                    file: path.resolve(this.workspaceRoot, file),
                    line: Number.parseInt(lineNum, 10),
                    column: Number.parseInt(column, 10),
                    message: message.trim(),
                    code,
                    severity: severity as 'error' | 'warning',
                };

                // Analyze root cause and solution
                this.analyzeRootCause(error);

                errors.push(error);
            }
        }

        return errors;
    }

    /**
     * Analyze root cause of error and suggest solution
     */
    private analyzeRootCause(error: TSError): void {
        // Common and known errors
        const knownPatterns: Record<string, { cause: string; fix: string }> = {
            'TS2307': {
                cause: 'Module not found - import file does not exist or path is incorrect',
                fix: 'Ensure file exists, or check tsconfig.json paths'
            },
            'TS2304': {
                cause: 'Variable/Type not defined - variable or type is undefined',
                fix: 'Add import for library or define variable before use'
            },
            'TS2345': {
                cause: 'Type mismatch - data types do not match',
                fix: 'Change variable or value type to match definition'
            },
            'TS2339': {
                cause: 'Property does not exist - property not found in type',
                fix: 'Add property to interface or use type assertion'
            },
            'TS2322': {
                cause: 'Type assignment error - cannot assign this type',
                fix: 'Ensure types match or use type casting'
            },
            'TS2554': {
                cause: 'Function arguments mismatch - incorrect number of arguments',
                fix: 'Check required number and types of arguments'
            },
            'TS2571': {
                cause: 'Object type unknown - object type is unknown',
                fix: 'Add type annotation or use type guard'
            },
            'TS1192': {
                cause: 'Module has no default export',
                fix: 'Use import { name } instead of import name'
            }
        };

        const pattern = knownPatterns[error.code];
        if (pattern) {
            error.rootCause = pattern.cause;
            error.suggestedFix = pattern.fix;
        } else {
            error.rootCause = 'Unknown TypeScript error - refer to documentation';
            error.suggestedFix = `Search for ${error.code} in TypeScript docs`;
        }
    }

    /**
     * Format error for terminal display
     */
    formatError(error: TSError): string {
        const icon = error.severity === 'error' ? '❌' : '⚠️';
        const relPath = path.relative(this.workspaceRoot, error.file);

        return `
${icon} ${error.severity.toUpperCase()} [${error.code}]
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
}
