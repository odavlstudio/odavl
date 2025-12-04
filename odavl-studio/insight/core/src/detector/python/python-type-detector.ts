/**
 * Python Type Detector - mypy integration
 * Detects type-related issues in Python code
 */

import { execSync } from 'child_process';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface PythonTypeIssue {
    id: string;
    file: string;
    line: number;
    column: number;
    severity: 'error' | 'warning' | 'info';
    category: string;
    message: string;
    code?: string;
    recommendation?: string;
    codeSnippet?: string;
}

interface MypyError {
    file: string;
    line: number;
    column: number;
    severity: 'error' | 'note' | 'warning';
    message: string;
    code?: string;
}

export class PythonTypeDetector {
    private workspaceRoot: string;

    constructor(workspaceRoot: string) {
        this.workspaceRoot = workspaceRoot;
    }

    async detect(): Promise<PythonTypeIssue[]> {
        const issues: PythonTypeIssue[] = [];

        try {
            // Check if mypy is installed
            try {
                execSync('mypy --version', { stdio: 'ignore' });
            } catch {
                return [{
                    id: 'mypy-not-installed',
                    file: 'system',
                    line: 0,
                    column: 0,
                    severity: 'error',
                    category: 'setup',
                    message: 'mypy is not installed. Install with: pip install mypy',
                    recommendation: 'Install mypy to enable Python type checking',
                }];
            }

            // Find Python files
            const pythonFiles = await this.findPythonFiles(this.workspaceRoot);
            if (pythonFiles.length === 0) return [];

            // Run mypy
            const mypyErrors = await this.runMypy(this.workspaceRoot);

            // Convert to issues
            for (const error of mypyErrors) {
                issues.push({
                    id: `python-type-${issues.length}`,
                    file: path.relative(this.workspaceRoot, error.file),
                    line: error.line,
                    column: error.column,
                    severity: error.severity === 'error' ? 'error' : error.severity === 'warning' ? 'warning' : 'info',
                    category: 'type-safety',
                    message: error.message,
                    code: error.code,
                    recommendation: 'Add type hints or fix type mismatches',
                });
            }

            return issues;
        } catch (error) {
            console.error('Python Type Detector failed:', error);
            return [{
                id: 'detector-error',
                file: 'system',
                line: 0,
                column: 0,
                severity: 'error',
                category: 'detector',
                message: `Detector failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            }];
        }
    }

    private async findPythonFiles(dir: string): Promise<string[]> {
        const files: string[] = [];
        async function walk(directory: string) {
            const entries = await fs.readdir(directory, { withFileTypes: true });
            for (const entry of entries) {
                const fullPath = path.join(directory, entry.name);
                if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === '__pycache__' || entry.name === 'venv') continue;
                if (entry.isDirectory()) await walk(fullPath);
                else if (entry.name.endsWith('.py')) files.push(fullPath);
            }
        }
        await walk(dir);
        return files;
    }

    private async runMypy(dir: string): Promise<MypyError[]> {
        try {
            // Run mypy with strict configuration
            // Look for mypy.ini in the directory first, then use inline config
            const configPath = path.join(dir, 'mypy.ini');
            const hasConfig = await fs.access(configPath).then(() => true).catch(() => false);
            
            const cmd = hasConfig 
                ? `mypy "${dir}" --config-file="${configPath}" --show-column-numbers --no-error-summary`
                : `mypy "${dir}" --show-column-numbers --no-error-summary --warn-return-any --warn-unused-configs --disallow-untyped-defs --disallow-incomplete-defs`;
            
            const result = execSync(cmd, { encoding: 'utf-8', stdio: ['ignore', 'pipe', 'pipe'] });
            return this.parseMypyOutput(result);
        } catch (error: any) {
            // mypy returns non-zero exit code when it finds errors, so we parse both stdout and stderr
            const output = (error.stdout || '') + '\n' + (error.stderr || '');
            return this.parseMypyOutput(output);
        }
    }

    private parseMypyOutput(output: string): MypyError[] {
        const errors: MypyError[] = [];
        const lines = output.split('\n');
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            
            // Match mypy error format: file.py:line:col: severity: message [code]
            // Support both forward slashes and backslashes in path
            const match = line.match(/^(.+?\.py):(\d+):(\d+):\s+(error|note|warning):\s+(.+?)(?:\s+\[(.+?)\])?$/);
            if (match) {
                let message = match[5].trim();
                
                // If message is truncated and next line has details, append it
                if (i + 1 < lines.length) {
                    const nextLine = lines[i + 1].trim();
                    if (nextLine && !nextLine.includes(':') && !nextLine.startsWith('def ') && !nextLine.startsWith('^')) {
                        message += ' ' + nextLine;
                    }
                }
                
                errors.push({
                    file: match[1].replace(/\\/g, '/'), // Normalize path to forward slashes
                    line: parseInt(match[2]),
                    column: parseInt(match[3]),
                    severity: match[4] as 'error' | 'note' | 'warning',
                    message: message,
                    code: match[6],
                });
            }
        }
        return errors;
    }
}
