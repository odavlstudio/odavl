/**
 * Python Imports Detector - isort integration
 * Detects import-related issues
 */

import { execSync } from 'child_process';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface PythonImportsIssue {
    id: string;
    file: string;
    line: number;
    column: number;
    severity: 'error' | 'warning' | 'info';
    category: string;
    message: string;
    recommendation?: string;
}

export class PythonImportsDetector {
    private workspaceRoot: string;

    constructor(workspaceRoot: string) {
        this.workspaceRoot = workspaceRoot;
    }

    async detect(): Promise<PythonImportsIssue[]> {
        const issues: PythonImportsIssue[] = [];

        try {
            // Check isort
            try {
                execSync('isort --version', { stdio: 'ignore' });
            } catch {
                return [{
                    id: 'isort-not-installed',
                    file: 'system',
                    line: 0,
                    column: 0,
                    severity: 'error',
                    category: 'setup',
                    message: 'isort is not installed. Install with: pip install isort',
                    recommendation: 'Install isort for import analysis',
                }];
            }

            const pythonFiles = await this.findPythonFiles(this.workspaceRoot);
            if (pythonFiles.length === 0) return [];

            for (const file of pythonFiles) {
                const relPath = path.relative(this.workspaceRoot, file);
                
                // Check import order
                const orderIssues = await this.checkImportOrder(file, relPath);
                issues.push(...orderIssues);

                // Check unused imports
                const unusedIssues = await this.checkUnusedImports(file, relPath);
                issues.push(...unusedIssues);
            }

            return issues;
        } catch (error) {
            console.error('Python Imports Detector failed:', error);
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

    private async checkImportOrder(file: string, relPath: string): Promise<PythonImportsIssue[]> {
        try {
            execSync(`isort "${file}" --check-only --diff`, { encoding: 'utf-8', stdio: ['ignore', 'pipe', 'pipe'] });
        } catch (error: any) {
            if (error.status === 1) {
                const content = await fs.readFile(file, 'utf-8');
                const lines = content.split('\n');
                let importLine = 1;
                for (let i = 0; i < lines.length; i++) {
                    if (lines[i].trim().startsWith('import ') || lines[i].trim().startsWith('from ')) {
                        importLine = i + 1;
                        break;
                    }
                }
                return [{
                    id: 'python-import-order',
                    file: relPath,
                    line: importLine,
                    column: 0,
                    severity: 'info',
                    category: 'import-order',
                    message: 'Imports not sorted according to PEP 8',
                    recommendation: `Run: isort ${relPath}`,
                }];
            }
        }
        return [];
    }

    private async checkUnusedImports(file: string, relPath: string): Promise<PythonImportsIssue[]> {
        const issues: PythonImportsIssue[] = [];
        try {
            const content = await fs.readFile(file, 'utf-8');
            const lines = content.split('\n');
            const imports: Array<{ name: string; line: number }> = [];

            for (let i = 0; i < lines.length; i++) {
                const line = lines[i].trim();
                const importMatch = line.match(/^import\s+(\w+)(?:\s+as\s+(\w+))?/);
                if (importMatch) {
                    imports.push({ name: importMatch[2] || importMatch[1], line: i + 1 });
                }
                const fromMatch = line.match(/^from\s+[\w.]+\s+import\s+(.+)/);
                if (fromMatch) {
                    const items = fromMatch[1].split(',');
                    for (const item of items) {
                        const asMatch = item.match(/\s+as\s+(\w+)/);
                        const name = asMatch ? asMatch[1] : item.trim().replace(/\s+as\s+\w+/, '');
                        if (name && name !== '*') imports.push({ name, line: i + 1 });
                    }
                }
            }

            for (const imp of imports) {
                if (imp.name === '_' || imp.name === '__version__') continue;
                const usageRegex = new RegExp(`\\b${imp.name}\\b`);
                let used = false;
                for (let i = imp.line; i < lines.length; i++) {
                    if (usageRegex.test(lines[i])) { used = true; break; }
                }
                if (!used) {
                    issues.push({
                        id: `python-unused-import-${issues.length}`,
                        file: relPath,
                        line: imp.line,
                        column: 0,
                        severity: 'info',
                        category: 'unused-import',
                        message: `Unused import: ${imp.name}`,
                        recommendation: 'Remove unused import',
                    });
                }
            }
        } catch { /* Skip on error */ }
        return issues;
    }
}
