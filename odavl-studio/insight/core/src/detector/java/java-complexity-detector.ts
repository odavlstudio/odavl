/**
 * Java Complexity Detector
 * Detects code complexity issues using PMD (Java static analysis tool)
 * 
 * Similar approach to Python detectors: use external tool (PMD) for analysis
 */

import { execSync } from 'child_process';
import { BaseJavaDetector, type JavaIssue } from './base-java-detector.js';
import * as fs from 'fs/promises';
import * as path from 'path';

interface PMDViolation {
    file: string;
    line: number;
    rule: string;
    priority: number;
    message: string;
}

export class JavaComplexityDetector extends BaseJavaDetector {
    constructor() {
        super('java-complexity');
    }

    async detect(targetDir?: string): Promise<JavaIssue[]> {
        const workspaceRoot = targetDir || process.cwd();
        const issues: JavaIssue[] = [];

        try {
            // Check if this is a Java project
            const isJava = await this.isJavaProject(workspaceRoot);
            if (!isJava) return [];

            // Find all Java files
            const javaFiles = await this.findJavaFiles(workspaceRoot);
            if (javaFiles.length === 0) return [];

            console.log(`[JavaComplexityDetector] Found ${javaFiles.length} Java files`);

            // Try PMD first (if available)
            const pmdIssues = await this.runPMD(workspaceRoot);
            if (pmdIssues.length > 0) {
                issues.push(...pmdIssues);
                return issues;
            }

            // Fallback: Pattern-based analysis (simple heuristics)
            for (const file of javaFiles) {
                const fileIssues = await this.analyzeFileComplexity(file, workspaceRoot);
                issues.push(...fileIssues);
            }

            return issues;
        } catch (error) {
            console.error('[JavaComplexityDetector] Error:', error);
            return [this.createErrorIssue(error instanceof Error ? error.message : 'Unknown error')];
        }
    }

    /**
     * Run PMD (Programming Mistake Detector) for complexity analysis
     */
    private async runPMD(dir: string): Promise<JavaIssue[]> {
        try {
            // Check if PMD is available
            try {
                execSync('pmd --version', { stdio: 'ignore' });
            } catch {
                console.log('[JavaComplexityDetector] PMD not installed, using fallback analysis');
                return [];
            }

            // Run PMD with complexity ruleset
            const cmd = `pmd check -d "${dir}" -R category/java/design.xml -f json --no-cache`;
            const result = execSync(cmd, { encoding: 'utf-8', stdio: ['ignore', 'pipe', 'pipe'] });
            
            return this.parsePMDOutput(result);
        } catch (error: any) {
            // PMD returns non-zero exit on violations
            const output = error.stdout || '';
            if (output) {
                return this.parsePMDOutput(output);
            }
            return [];
        }
    }

    /**
     * Parse PMD JSON output
     */
    private parsePMDOutput(output: string): JavaIssue[] {
        const issues: JavaIssue[] = [];
        
        try {
            const data = JSON.parse(output);
            const violations = data.files || [];

            for (const fileData of violations) {
                const violations = fileData.violations || [];
                
                for (const violation of violations) {
                    const workspaceRoot = process.cwd(); // Use current directory for relative paths in parsing context
                    issues.push({
                        id: `pmd-${violation.rule}-${violation.beginline}`,
                        file: path.relative(workspaceRoot, fileData.filename),
                        line: violation.beginline,
                        column: violation.begincolumn || 0,
                        severity: this.getPrioritySeverity(violation.priority),
                        category: 'complexity',
                        message: violation.description,
                        code: violation.rule,
                        recommendation: 'Refactor to reduce complexity',
                    });
                }
            }
        } catch (error) {
            console.error('[JavaComplexityDetector] Failed to parse PMD output:', error);
        }

        return issues;
    }

    /**
     * Convert PMD priority to severity
     */
    private getPrioritySeverity(priority: number): 'error' | 'warning' | 'info' {
        if (priority <= 2) return 'error';
        if (priority <= 3) return 'warning';
        return 'info';
    }

    /**
     * Fallback: Pattern-based complexity analysis
     */
    private async analyzeFileComplexity(filePath: string): Promise<JavaIssue[]> {
        const issues: JavaIssue[] = [];
        
        try {
            const content = await this.readFile(filePath);
            const lines = content.split('\n');

            // Count nesting levels (if/for/while blocks)
            let currentNesting = 0;
            let maxNesting = 0;
            let maxNestingLine = 0;

            for (let i = 0; i < lines.length; i++) {
                const line = lines[i].trim();
                const lineNumber = i + 1;

                // Skip comments
                if (line.startsWith('//') || line.startsWith('*') || line.startsWith('/*')) {
                    continue;
                }

                // Count opening braces
                const openBraces = (line.match(/\{/g) || []).length;
                const closeBraces = (line.match(/\}/g) || []).length;
                
                currentNesting += openBraces - closeBraces;

                if (currentNesting > maxNesting) {
                    maxNesting = currentNesting;
                    maxNestingLine = lineNumber;
                }

                // Detect deeply nested code (> 4 levels)
                if (currentNesting > 4) {
                    issues.push({
                        id: `deep-nesting-${lineNumber}`,
                        file: path.relative(this.workspaceRoot, filePath),
                        line: lineNumber,
                        column: 0,
                        severity: 'warning',
                        category: 'complexity',
                        message: `Deeply nested code (${currentNesting} levels deep)`,
                        recommendation: 'Extract nested logic into separate methods',
                        code: 'COMPLEXITY-001',
                    });
                }

                // Detect long methods (> 50 lines)
                if (line.match(/^\s*(public|private|protected).*\{/)) {
                    const methodStart = i;
                    let bracesCount = 1;
                    let methodEnd = i;

                    for (let j = i + 1; j < lines.length && bracesCount > 0; j++) {
                        const methodLine = lines[j];
                        bracesCount += (methodLine.match(/\{/g) || []).length;
                        bracesCount -= (methodLine.match(/\}/g) || []).length;
                        methodEnd = j;
                    }

                    const methodLength = methodEnd - methodStart;
                    if (methodLength > 50) {
                        issues.push({
                            id: `long-method-${lineNumber}`,
                            file: path.relative(this.workspaceRoot, filePath),
                            line: lineNumber,
                            column: 0,
                            severity: 'info',
                            category: 'complexity',
                            message: `Long method detected (${methodLength} lines)`,
                            recommendation: 'Break down into smaller methods (max 50 lines recommended)',
                            code: 'COMPLEXITY-002',
                        });
                    }
                }

                // Detect complex conditionals (multiple && or ||)
                const andCount = (line.match(/&&/g) || []).length;
                const orCount = (line.match(/\|\|/g) || []).length;
                const totalOperators = andCount + orCount;

                if (totalOperators >= 3) {
                    issues.push({
                        id: `complex-conditional-${lineNumber}`,
                        file: path.relative(this.workspaceRoot, filePath),
                        line: lineNumber,
                        column: 0,
                        severity: 'info',
                        category: 'complexity',
                        message: `Complex conditional with ${totalOperators} logical operators`,
                        recommendation: 'Extract conditional logic into well-named boolean variables',
                        code: 'COMPLEXITY-003',
                    });
                }

                // Detect long parameter lists (> 5 parameters)
                const paramMatch = line.match(/\(([^)]+)\)/);
                if (paramMatch) {
                    const params = paramMatch[1].split(',');
                    if (params.length > 5) {
                        issues.push({
                            id: `long-param-list-${lineNumber}`,
                            file: path.relative(this.workspaceRoot, filePath),
                            line: lineNumber,
                            column: 0,
                            severity: 'info',
                            category: 'complexity',
                            message: `Long parameter list (${params.length} parameters)`,
                            recommendation: 'Consider using a parameter object or builder pattern',
                            code: 'COMPLEXITY-004',
                        });
                    }
                }
            }

        } catch (error) {
            console.error(`[JavaComplexityDetector] Failed to analyze ${filePath}:`, error);
        }

        return issues;
    }
}
