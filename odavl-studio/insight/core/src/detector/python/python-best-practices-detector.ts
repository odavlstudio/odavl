/**
 * Python Best Practices Detector - pylint integration
 * Detects code quality violations
 */

import { execSync } from 'child_process';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface PythonBestPracticesIssue {
    id: string;
    file: string;
    line: number;
    column: number;
    severity: 'error' | 'warning' | 'info';
    category: string;
    message: string;
    symbol?: string;
    recommendation?: string;
}

export class PythonBestPracticesDetector {
    private workspaceRoot: string;

    constructor(workspaceRoot: string) {
        this.workspaceRoot = workspaceRoot;
    }

    async detect(): Promise<PythonBestPracticesIssue[]> {
        const issues: PythonBestPracticesIssue[] = [];

        try {
            // Check pylint
            try {
                execSync('pylint --version', { stdio: 'ignore' });
            } catch {
                return [{
                    id: 'pylint-not-installed',
                    file: 'system',
                    line: 0,
                    column: 0,
                    severity: 'error',
                    category: 'setup',
                    message: 'pylint is not installed. Install with: pip install pylint',
                    recommendation: 'Install pylint for best practices checking',
                }];
            }

            const pythonFiles = await this.findPythonFiles(this.workspaceRoot);
            if (pythonFiles.length === 0) return [];

            const messages = await this.runPylint(this.workspaceRoot);

            for (const msg of messages) {
                issues.push({
                    id: `python-bp-${issues.length}`,
                    file: path.relative(this.workspaceRoot, msg.path),
                    line: msg.line,
                    column: msg.column,
                    severity: this.mapSeverity(msg.type),
                    category: this.categorize(msg.symbol),
                    message: `${msg.symbol}: ${msg.message}`,
                    symbol: msg.symbol,
                    recommendation: this.getRecommendation(msg.symbol),
                });
            }

            return issues;
        } catch (error) {
            console.error('Python Best Practices Detector failed:', error);
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
                if (['node_modules', '.git', '__pycache__', 'venv', '.venv'].includes(entry.name)) continue;
                if (entry.isDirectory()) await walk(fullPath);
                else if (entry.name.endsWith('.py')) files.push(fullPath);
            }
        }
        await walk(dir);
        return files;
    }

    private async runPylint(dir: string): Promise<any[]> {
        try {
            const output = execSync(
                `pylint "${dir}" --recursive=y --output-format=json --disable=C0114,C0115,C0116 --ignore=node_modules,venv,.venv`,
                { encoding: 'utf-8', stdio: ['ignore', 'pipe', 'pipe'] }
            );
            return JSON.parse(output);
        } catch (error: any) {
            if (error.stdout) {
                try { return JSON.parse(error.stdout); }
                catch { return []; }
            }
            return [];
        }
    }

    private mapSeverity(type: string): 'error' | 'warning' | 'info' {
        if (type === 'error' || type === 'fatal') return 'error';
        if (type === 'warning') return 'warning';
        return 'info';
    }

    private categorize(symbol: string): string {
        const map: Record<string, string> = {
            'invalid-name': 'naming', 'line-too-long': 'style', 'trailing-whitespace': 'style',
            'wrong-import-order': 'imports', 'wildcard-import': 'imports',
            'too-many-arguments': 'function-design', 'too-many-branches': 'complexity',
            'missing-docstring': 'documentation', 'undefined-variable': 'undefined',
        };
        for (const [key, cat] of Object.entries(map)) {
            if (symbol.includes(key)) return cat;
        }
        return 'best-practices';
    }

    private getRecommendation(symbol: string): string {
        const map: Record<string, string> = {
            'invalid-name': 'Follow PEP 8 naming (snake_case for functions, PascalCase for classes)',
            'line-too-long': 'Break line into multiple lines (max 100 chars)',
            'too-many-arguments': 'Reduce arguments or group into class/dict',
            'too-many-branches': 'Simplify logic or extract methods',
            'missing-docstring': 'Add docstring with purpose, params, return value',
            'undefined-variable': 'Define variable before use',
            'wrong-import-order': 'Sort imports: stdlib → third-party → local (use isort)',
            'wildcard-import': 'Use explicit imports instead of *',
        };
        for (const [key, rec] of Object.entries(map)) {
            if (symbol.includes(key)) return rec;
        }
        return 'Follow PEP 8 and Python best practices';
    }
}
