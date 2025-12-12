/**
 * Python Complexity Detector - radon integration
 * Detects code complexity issues
 */

import { execSync } from 'child_process';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface PythonComplexityIssue {
    id: string;
    file: string;
    line: number;
    column: number;
    severity: 'error' | 'warning' | 'info';
    category: string;
    message: string;
    complexity?: number;
    maintainabilityIndex?: number;
    recommendation?: string;
}

export class PythonComplexityDetector {
    async detect(targetDir?: string): Promise<PythonComplexityIssue[]> {
        const workspaceRoot = targetDir || process.cwd();
        const issues: PythonComplexityIssue[] = [];

        try {
            // Check radon
            try {
                execSync('radon --version', { stdio: 'ignore' });
            } catch {
                return [{
                    id: 'radon-not-installed',
                    file: 'system',
                    line: 0,
                    column: 0,
                    severity: 'error',
                    category: 'setup',
                    message: 'radon is not installed. Install with: pip install radon',
                    recommendation: 'Install radon for complexity analysis',
                }];
            }

            const pythonFiles = await this.findPythonFiles(workspaceRoot);
            if (pythonFiles.length === 0) return [];

            for (const file of pythonFiles) {
                const relPath = path.relative(workspaceRoot, file);
                
                // Cyclomatic complexity
                const ccIssues = await this.checkComplexity(file, relPath);
                issues.push(...ccIssues);

                // Maintainability index
                const miIssues = await this.checkMaintainability(file, relPath);
                issues.push(...miIssues);
            }

            return issues;
        } catch (error) {
            console.error('Python Complexity Detector failed:', error);
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
                if (['node_modules', '.git', '__pycache__', 'venv', '.venv', 'dist', 'build'].includes(entry.name)) continue;
                if (entry.isDirectory()) await walk(fullPath);
                else if (entry.name.endsWith('.py')) files.push(fullPath);
            }
        }
        await walk(dir);
        return files;
    }

    private async checkComplexity(file: string, relPath: string): Promise<PythonComplexityIssue[]> {
        const issues: PythonComplexityIssue[] = [];
        try {
            const output = execSync(`radon cc "${file}" -j`, { encoding: 'utf-8', stdio: ['ignore', 'pipe', 'pipe'] });
            const results: Record<string, any[]> = JSON.parse(output);
            const items = results[file] || [];

            for (const item of items) {
                // Lower thresholds for stricter detection
                // Complexity > 5 = INFO
                // Complexity > 10 = WARNING  
                // Complexity > 20 = ERROR
                if (item.complexity > 5) {
                    issues.push({
                        id: `python-complexity-${issues.length}`,
                        file: relPath,
                        line: item.lineno,
                        column: item.col_offset || 0,
                        severity: item.complexity > 20 ? 'error' : item.complexity > 10 ? 'warning' : 'info',
                        category: 'complexity',
                        message: `Function '${item.name}' has ${item.complexity > 20 ? 'very high' : item.complexity > 10 ? 'high' : 'moderate'} cyclomatic complexity: ${item.complexity}`,
                        complexity: item.complexity,
                        recommendation: item.complexity > 20 ? 'Split into smaller functions immediately' : item.complexity > 10 ? 'Simplify logic' : 'Consider refactoring if it grows',
                    });
                }
            }
        } catch { /* Skip on error */ }
        return issues;
    }

    private async checkMaintainability(file: string, relPath: string): Promise<PythonComplexityIssue[]> {
        const issues: PythonComplexityIssue[] = [];
        try {
            const output = execSync(`radon mi "${file}" -j`, { encoding: 'utf-8', stdio: ['ignore', 'pipe', 'pipe'] });
            const results: Record<string, any> = JSON.parse(output);
            const result = results[file];

            if (result && result.mi < 40) {
                issues.push({
                    id: `python-maintainability-${issues.length}`,
                    file: relPath,
                    line: 1,
                    column: 0,
                    severity: result.mi < 20 ? 'error' : 'warning',
                    category: 'maintainability',
                    message: `Low maintainability index: ${result.mi.toFixed(2)} (rank ${result.rank})`,
                    maintainabilityIndex: result.mi,
                    recommendation: result.mi < 20 ? 'Major refactoring needed' : 'Consider refactoring',
                });
            }
        } catch { /* Skip on error */ }
        return issues;
    }
}
