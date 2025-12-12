/**
 * Go Error Detector - ODAVL Insight
 * Detects Go code issues using go vet and staticcheck
 * 
 * Coverage:
 * - go vet integration (official Go linter)
 * - staticcheck integration (advanced static analysis)
 * - Common Go anti-patterns
 * - Goroutine leaks and race conditions
 * - Error handling patterns
 * 
 * Target: Detectors 8/10 → 8.5/10
 */

import { execSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { glob } from 'glob';
import { logger } from '../utils/logger';
import { safeReadFile } from '../utils/safe-file-reader.js';

export interface GoError {
    file: string;
    line: number;
    column?: number;
    message: string;
    tool: 'go-vet' | 'staticcheck' | 'pattern-analysis';
    severity: 'critical' | 'high' | 'medium' | 'low';
    category: GoErrorCategory;
    rootCause?: string;
    suggestedFix?: string;
}

export enum GoErrorCategory {
    // go vet categories
    UNREACHABLE_CODE = 'UNREACHABLE_CODE',
    UNUSED_VARIABLE = 'UNUSED_VARIABLE',
    SHADOWED_VARIABLE = 'SHADOWED_VARIABLE',
    NIL_POINTER = 'NIL_POINTER',
    
    // staticcheck categories
    DEPRECATED_API = 'DEPRECATED_API',
    INEFFICIENT_CODE = 'INEFFICIENT_CODE',
    UNUSED_CODE = 'UNUSED_CODE',
    
    // Go anti-patterns
    GOROUTINE_LEAK = 'GOROUTINE_LEAK',
    RACE_CONDITION = 'RACE_CONDITION',
    UNCHECKED_ERROR = 'UNCHECKED_ERROR',
    DEFER_IN_LOOP = 'DEFER_IN_LOOP',
    
    // Error handling
    ERROR_SHADOWING = 'ERROR_SHADOWING',
    PANIC_IN_LIBRARY = 'PANIC_IN_LIBRARY',
    IGNORED_ERROR = 'IGNORED_ERROR',
}

export interface GoStatistics {
    totalIssues: number;
    bySeverity: Record<'critical' | 'high' | 'medium' | 'low', number>;
    byCategory: Record<GoErrorCategory, number>;
    affectedFiles: number;
    goVetIssues: number;
    staticcheckIssues: number;
    patternIssues: number;
}

export class GoDetector {
    private workspaceRoot: string;
    private goVetAvailable: boolean = false;
    private staticcheckAvailable: boolean = false;

    constructor(workspaceRoot: string) {
        this.workspaceRoot = workspaceRoot;
        this.checkToolAvailability();
    }

    /**
     * Check if Go tools are installed
     */
    private checkToolAvailability(): void {
        try {
            execSync('go version', { stdio: 'pipe' });
            this.goVetAvailable = true;
            logger.debug('[GoDetector] go vet available');
        } catch {
            logger.warn('[GoDetector] go vet not available - install Go to use this detector');
        }

        try {
            execSync('staticcheck -version', { stdio: 'pipe' });
            this.staticcheckAvailable = true;
            logger.debug('[GoDetector] staticcheck available');
        } catch {
            logger.debug('[GoDetector] staticcheck not available (optional - install with: go install honnef.co/go/tools/cmd/staticcheck@latest)');
        }
    }

    /**
     * Main detection method
     */
    async detect(targetDir?: string): Promise<GoError[]> {
        const dir = targetDir || this.workspaceRoot;
        const errors: GoError[] = [];

        // Check if directory has Go files
        const goFiles = await glob('**/*.go', {
            cwd: dir,
            ignore: ['**/vendor/**', '**/node_modules/**', '**/testdata/**'],
        });

        if (goFiles.length === 0) {
            logger.debug('[GoDetector] No Go files found');
            return errors;
        }

        logger.info(`[GoDetector] Found ${goFiles.length} Go files`);

        // 1. Run go vet
        if (this.goVetAvailable) {
            const vetErrors = await this.runGoVet(dir);
            errors.push(...vetErrors);
        }

        // 2. Run staticcheck
        if (this.staticcheckAvailable) {
            const staticErrors = await this.runStaticcheck(dir);
            errors.push(...staticErrors);
        }

        // 3. Run pattern analysis (always available)
        const patternErrors = await this.analyzePatterns(dir, goFiles);
        errors.push(...patternErrors);

        return errors;
    }

    /**
     * Run go vet (official Go linter)
     */
    private async runGoVet(dir: string): Promise<GoError[]> {
        const errors: GoError[] = [];

        try {
            logger.debug('[GoDetector] Running go vet...');
            
            // Run go vet on all packages
            execSync('go vet ./...', {
                cwd: dir,
                stdio: 'pipe',
                encoding: 'utf8',
            });
        } catch (error: any) {
            // go vet outputs to stderr
            const output = error.stderr?.toString() || '';
            
            if (output.trim()) {
                const vetErrors = this.parseGoVetOutput(output, dir);
                errors.push(...vetErrors);
            }
        }

        logger.info(`[GoDetector] go vet found ${errors.length} issues`);
        return errors;
    }

    /**
     * Parse go vet output
     * Format: file.go:line:column: message
     */
    private parseGoVetOutput(output: string, baseDir: string): GoError[] {
        const errors: GoError[] = [];
        const lines = output.split('\n').filter(l => l.trim());

        for (const line of lines) {
            // Match: ./path/file.go:10:5: message
            const match = line.match(/^(.+?):(\d+):(\d+): (.+)$/);
            if (!match) continue;

            const [, filePath, lineStr, colStr, message] = match;
            const fullPath = path.isAbsolute(filePath) 
                ? filePath 
                : path.join(baseDir, filePath);

            errors.push({
                file: fullPath,
                line: parseInt(lineStr, 10),
                column: parseInt(colStr, 10),
                message,
                tool: 'go-vet',
                severity: this.determineSeverity(message),
                category: this.categorizeGoVetError(message),
                rootCause: this.analyzeRootCause(message),
                suggestedFix: this.suggestFix(message),
            });
        }

        return errors;
    }

    /**
     * Run staticcheck (advanced static analyzer)
     */
    private async runStaticcheck(dir: string): Promise<GoError[]> {
        const errors: GoError[] = [];

        try {
            logger.debug('[GoDetector] Running staticcheck...');
            
            // Run staticcheck with JSON output
            const output = execSync('staticcheck -f json ./...', {
                cwd: dir,
                stdio: 'pipe',
                encoding: 'utf8',
            });

            const staticErrors = this.parseStaticcheckOutput(output, dir);
            errors.push(...staticErrors);
        } catch (error: any) {
            // staticcheck exits with non-zero if issues found
            const output = error.stdout?.toString() || '';
            
            if (output.trim()) {
                const staticErrors = this.parseStaticcheckOutput(output, dir);
                errors.push(...staticErrors);
            }
        }

        logger.info(`[GoDetector] staticcheck found ${errors.length} issues`);
        return errors;
    }

    /**
     * Parse staticcheck JSON output
     */
    private parseStaticcheckOutput(output: string, baseDir: string): GoError[] {
        const errors: GoError[] = [];
        const lines = output.split('\n').filter(l => l.trim());

        for (const line of lines) {
            try {
                const issue = JSON.parse(line);
                
                errors.push({
                    file: issue.location?.file || 'unknown',
                    line: issue.location?.line || 0,
                    column: issue.location?.column || 0,
                    message: issue.message || '',
                    tool: 'staticcheck',
                    severity: this.mapStaticcheckSeverity(issue.severity),
                    category: this.categorizeStaticcheckError(issue.code),
                    rootCause: `staticcheck ${issue.code}`,
                    suggestedFix: this.suggestStaticcheckFix(issue.code, issue.message),
                });
            } catch (parseError) {
                // Skip invalid JSON lines
                continue;
            }
        }

        return errors;
    }

    /**
     * Analyze Go code patterns (custom analysis)
     */
    private async analyzePatterns(dir: string, goFiles: string[]): Promise<GoError[]> {
        const errors: GoError[] = [];

        for (const file of goFiles) {
            const filePath = path.join(dir, file);
            
            const content = safeReadFile(filePath);
            if (!content) {
                logger.warn(`[GoDetector] Cannot read ${filePath}`);
                continue;
            }
            
            try {
                const lines = content.split('\n');

                // Pattern 1: Goroutine leaks (goroutine without proper cleanup)
                errors.push(...this.detectGoroutineLeaks(content, filePath, lines));

                // Pattern 2: Unchecked errors
                errors.push(...this.detectUncheckedErrors(content, filePath, lines));

                // Pattern 3: defer in loop
                errors.push(...this.detectDeferInLoop(content, filePath, lines));

                // Pattern 4: Panic in library code
                errors.push(...this.detectPanicInLibrary(content, filePath, lines));

            } catch (err) {
                logger.warn(`[GoDetector] Failed to analyze ${filePath}:`, err);
            }
        }

        logger.info(`[GoDetector] Pattern analysis found ${errors.length} issues`);
        return errors;
    }

    /**
     * Detect goroutine leaks
     */
    private detectGoroutineLeaks(content: string, filePath: string, lines: string[]): GoError[] {
        const errors: GoError[] = [];
        
        // Pattern: go func() without context/cancel/waitgroup
        const goroutineRegex = /go\s+(func\s*\(|[\w.]+\()/g;
        let match;

        while ((match = goroutineRegex.exec(content)) !== null) {
            const lineNum = content.substring(0, match.index).split('\n').length;
            const line = lines[lineNum - 1];

            // Check if goroutine has proper cleanup
            const hasContext = /ctx\s+context\.Context/.test(content);
            const hasCancel = /cancel\(\)/.test(content);
            const hasWaitGroup = /wg\s+sync\.WaitGroup/.test(content);

            if (!hasContext && !hasCancel && !hasWaitGroup) {
                errors.push({
                    file: filePath,
                    line: lineNum,
                    message: 'Goroutine may leak - no context, cancel, or WaitGroup found',
                    tool: 'pattern-analysis',
                    severity: 'high',
                    category: GoErrorCategory.GOROUTINE_LEAK,
                    rootCause: 'Goroutine started without cleanup mechanism',
                    suggestedFix: 'Use context.WithCancel() or sync.WaitGroup to manage goroutine lifecycle',
                });
            }
        }

        return errors;
    }

    /**
     * Detect unchecked errors
     */
    private detectUncheckedErrors(content: string, filePath: string, lines: string[]): GoError[] {
        const errors: GoError[] = [];
        
        // Pattern: function call that returns error, but error is ignored
        const uncheckedRegex = /(\w+)\([^)]*\)\s*$/gm;
        let match;

        while ((match = uncheckedRegex.exec(content)) !== null) {
            const lineNum = content.substring(0, match.index).split('\n').length;
            const line = lines[lineNum - 1].trim();

            // Check if line assigns to _ (ignoring error)
            if (line.includes('_') && (line.includes('.Write') || line.includes('.Close') || line.includes('.Flush'))) {
                errors.push({
                    file: filePath,
                    line: lineNum,
                    message: 'Error ignored with blank identifier (_)',
                    tool: 'pattern-analysis',
                    severity: 'medium',
                    category: GoErrorCategory.IGNORED_ERROR,
                    rootCause: 'Error return value explicitly ignored',
                    suggestedFix: 'Check and handle the error: if err != nil { return err }',
                });
            }
        }

        return errors;
    }

    /**
     * Detect defer in loop
     */
    private detectDeferInLoop(content: string, filePath: string, lines: string[]): GoError[] {
        const errors: GoError[] = [];
        
        // Pattern: defer inside for/range loop
        const deferInLoopRegex = /for\s+.*?\{[^}]*defer\s+/gs;
        let match;

        while ((match = deferInLoopRegex.exec(content)) !== null) {
            const lineNum = content.substring(0, match.index).split('\n').length;

            errors.push({
                file: filePath,
                line: lineNum,
                message: 'defer inside loop - may cause resource leaks or unexpected behavior',
                tool: 'pattern-analysis',
                severity: 'high',
                category: GoErrorCategory.DEFER_IN_LOOP,
                rootCause: 'defer statements accumulate until function returns, not loop iteration ends',
                suggestedFix: 'Move defer to separate function or use manual cleanup',
            });
        }

        return errors;
    }

    /**
     * Detect panic in library code
     */
    private detectPanicInLibrary(content: string, filePath: string, lines: string[]): GoError[] {
        const errors: GoError[] = [];
        
        // Skip if file is in main package or test file
        if (content.includes('package main') || filePath.endsWith('_test.go')) {
            return errors;
        }

        // Pattern: panic() in library code
        const panicRegex = /\bpanic\(/g;
        let match;

        while ((match = panicRegex.exec(content)) !== null) {
            const lineNum = content.substring(0, match.index).split('\n').length;

            errors.push({
                file: filePath,
                line: lineNum,
                message: 'panic() in library code - should return error instead',
                tool: 'pattern-analysis',
                severity: 'critical',
                category: GoErrorCategory.PANIC_IN_LIBRARY,
                rootCause: 'Library code should not panic - let caller decide how to handle errors',
                suggestedFix: 'Return error instead: return fmt.Errorf("error message")',
            });
        }

        return errors;
    }

    /**
     * Determine severity based on message
     */
    private determineSeverity(message: string): 'critical' | 'high' | 'medium' | 'low' {
        const lowerMsg = message.toLowerCase();
        
        if (lowerMsg.includes('nil pointer') || lowerMsg.includes('panic')) {
            return 'critical';
        }
        if (lowerMsg.includes('race') || lowerMsg.includes('leak')) {
            return 'high';
        }
        if (lowerMsg.includes('unused') || lowerMsg.includes('shadow')) {
            return 'medium';
        }
        return 'low';
    }

    /**
     * Categorize go vet error
     */
    private categorizeGoVetError(message: string): GoErrorCategory {
        const lowerMsg = message.toLowerCase();
        
        if (lowerMsg.includes('unreachable')) return GoErrorCategory.UNREACHABLE_CODE;
        if (lowerMsg.includes('unused')) return GoErrorCategory.UNUSED_VARIABLE;
        if (lowerMsg.includes('shadow')) return GoErrorCategory.SHADOWED_VARIABLE;
        if (lowerMsg.includes('nil')) return GoErrorCategory.NIL_POINTER;
        
        return GoErrorCategory.UNUSED_CODE;
    }

    /**
     * Categorize staticcheck error
     */
    private categorizeStaticcheckError(code: string): GoErrorCategory {
        if (code.startsWith('SA')) return GoErrorCategory.INEFFICIENT_CODE;
        if (code.startsWith('ST')) return GoErrorCategory.DEPRECATED_API;
        if (code.startsWith('U')) return GoErrorCategory.UNUSED_CODE;
        
        return GoErrorCategory.UNUSED_CODE;
    }

    /**
     * Map staticcheck severity
     */
    private mapStaticcheckSeverity(severity: string): 'critical' | 'high' | 'medium' | 'low' {
        switch (severity?.toLowerCase()) {
            case 'error': return 'critical';
            case 'warning': return 'high';
            case 'info': return 'medium';
            default: return 'low';
        }
    }

    /**
     * Analyze root cause
     */
    private analyzeRootCause(message: string): string {
        // Generic root cause analysis
        return `Go vet detected: ${message}`;
    }

    /**
     * Suggest fix
     */
    private suggestFix(message: string): string {
        const lowerMsg = message.toLowerCase();
        
        if (lowerMsg.includes('unused')) {
            return 'Remove the unused variable or use it';
        }
        if (lowerMsg.includes('shadow')) {
            return 'Rename the variable to avoid shadowing';
        }
        if (lowerMsg.includes('nil')) {
            return 'Add nil check: if x != nil { ... }';
        }
        
        return 'Refer to Go documentation for best practices';
    }

    /**
     * Suggest staticcheck fix
     */
    private suggestStaticcheckFix(code: string, message: string): string {
        if (code.startsWith('SA')) {
            return `Simplify code: ${message}`;
        }
        if (code.startsWith('ST')) {
            return `Update to non-deprecated API: ${message}`;
        }
        if (code.startsWith('U')) {
            return `Remove unused code: ${message}`;
        }
        
        return 'Run staticcheck with -explain flag for details';
    }

    /**
     * Get statistics
     */
    async getStatistics(errors: GoError[]): Promise<GoStatistics> {
        const stats: GoStatistics = {
            totalIssues: errors.length,
            bySeverity: { critical: 0, high: 0, medium: 0, low: 0 },
            byCategory: {} as Record<GoErrorCategory, number>,
            affectedFiles: new Set(errors.map(e => e.file)).size,
            goVetIssues: errors.filter(e => e.tool === 'go-vet').length,
            staticcheckIssues: errors.filter(e => e.tool === 'staticcheck').length,
            patternIssues: errors.filter(e => e.tool === 'pattern-analysis').length,
        };

        for (const error of errors) {
            stats.bySeverity[error.severity]++;
            stats.byCategory[error.category] = (stats.byCategory[error.category] || 0) + 1;
        }

        return stats;
    }
}
