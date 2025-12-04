/**
 * Python Security Detector - bandit integration
 * Detects security vulnerabilities in Python code
 */

import { execSync } from 'child_process';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface PythonSecurityIssue {
    id: string;
    file: string;
    line: number;
    column: number;
    severity: 'error' | 'warning' | 'info';
    category: string;
    message: string;
    testId?: string;
    cwe?: string;
    recommendation?: string;
    codeSnippet?: string;
}

interface BanditIssue {
    filename: string;
    line_number: number;
    issue_severity: 'HIGH' | 'MEDIUM' | 'LOW';
    issue_text: string;
    test_id: string;
    test_name: string;
}

export class PythonSecurityDetector {
    private workspaceRoot: string;

    constructor(workspaceRoot: string) {
        this.workspaceRoot = workspaceRoot;
    }

    async detect(): Promise<PythonSecurityIssue[]> {
        const issues: PythonSecurityIssue[] = [];

        try {
            // Check bandit
            try {
                execSync('bandit --version', { stdio: 'ignore' });
            } catch {
                return [{
                    id: 'bandit-not-installed',
                    file: 'system',
                    line: 0,
                    column: 0,
                    severity: 'error',
                    category: 'setup',
                    message: 'bandit is not installed. Install with: pip install bandit',
                    recommendation: 'Install bandit for Python security scanning',
                }];
            }

            const pythonFiles = await this.findPythonFiles(this.workspaceRoot);
            if (pythonFiles.length === 0) return [];

            const banditResults = await this.runBandit(this.workspaceRoot);

            for (const issue of banditResults) {
                issues.push({
                    id: `python-security-${issues.length}`,
                    file: path.relative(this.workspaceRoot, issue.filename),
                    line: issue.line_number,
                    column: 0,
                    severity: issue.issue_severity === 'HIGH' ? 'error' : issue.issue_severity === 'MEDIUM' ? 'warning' : 'info',
                    category: this.getCategoryFromTestId(issue.test_id),
                    message: `${issue.test_name}: ${issue.issue_text}`,
                    testId: issue.test_id,
                    cwe: this.getCWE(issue.test_id),
                    recommendation: this.getRecommendation(issue.test_id),
                });
            }

            return issues;
        } catch (error) {
            console.error('Python Security Detector failed:', error);
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

    private async runBandit(dir: string): Promise<BanditIssue[]> {
        try {
            const output = execSync(
                `bandit -r "${dir}" -f json --skip B404,B603 --exclude ./node_modules,./venv,./.venv`,
                { encoding: 'utf-8', stdio: ['ignore', 'pipe', 'pipe'] }
            );
            const result = JSON.parse(output);
            return result.results || [];
        } catch (error: any) {
            if (error.stdout) {
                try {
                    const result = JSON.parse(error.stdout);
                    return result.results || [];
                } catch { return []; }
            }
            return [];
        }
    }

    private getCategoryFromTestId(testId: string): string {
        const map: Record<string, string> = {
            B201: 'injection', B202: 'injection', B608: 'sql-injection', B609: 'sql-injection',
            B301: 'deserialization', B302: 'deserialization',
            B303: 'weak-crypto', B304: 'weak-crypto', B305: 'weak-crypto',
            B311: 'weak-random', B312: 'telnet', B501: 'ssl', B502: 'ssl',
            B601: 'shell-injection', B602: 'shell-injection', B603: 'subprocess',
        };
        return map[testId] || 'security';
    }

    private getCWE(testId: string): string {
        const map: Record<string, string> = {
            B201: 'CWE-89', B202: 'CWE-89', B608: 'CWE-89', B609: 'CWE-89',
            B301: 'CWE-502', B302: 'CWE-502',
            B303: 'CWE-327', B304: 'CWE-327', B305: 'CWE-330', B311: 'CWE-330',
            B501: 'CWE-295', B502: 'CWE-295',
            B601: 'CWE-78', B602: 'CWE-78', B603: 'CWE-78',
        };
        return map[testId] || 'CWE-unknown';
    }

    private getRecommendation(testId: string): string {
        const map: Record<string, string> = {
            B201: 'Use parameterized queries instead of string formatting',
            B301: 'Avoid pickle for untrusted data - use json',
            B303: 'Use hashlib.sha256() instead of MD5',
            B311: 'Use secrets module for cryptographic randomness',
            B501: 'Enable SSL/TLS certificate verification',
            B601: 'Avoid shell=True in subprocess calls',
            B608: 'Use parameterized SQL queries',
        };
        return map[testId] || 'Review security best practices';
    }
}
