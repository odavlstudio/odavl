/**
 * Rust Error Detector - ODAVL Insight
 * Detects Rust code issues using cargo clippy and rustc
 * 
 * Coverage:
 * - cargo clippy integration (official Rust linter)
 * - rustc compile checks
 * - Common Rust anti-patterns
 * - Ownership and borrowing issues
 * - Unsafe code patterns
 * 
 * Target: Detectors 8/10 → 9/10
 */

import { execSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { glob } from 'glob';
import { logger } from '../utils/logger';
import { safeReadFile } from '../utils/safe-file-reader.js';

export interface RustError {
    file: string;
    line: number;
    column?: number;
    message: string;
    tool: 'cargo-clippy' | 'rustc' | 'pattern-analysis';
    severity: 'critical' | 'high' | 'medium' | 'low';
    category: RustErrorCategory;
    code?: string; // E0308, clippy::needless_return, etc.
    rootCause?: string;
    suggestedFix?: string;
}

export enum RustErrorCategory {
    // Ownership & Borrowing
    BORROW_CHECKER = 'BORROW_CHECKER',
    LIFETIME_ERROR = 'LIFETIME_ERROR',
    MOVED_VALUE = 'MOVED_VALUE',
    
    // Safety
    UNSAFE_CODE = 'UNSAFE_CODE',
    MEMORY_LEAK = 'MEMORY_LEAK',
    NULL_POINTER = 'NULL_POINTER',
    
    // Code Quality
    UNUSED_CODE = 'UNUSED_CODE',
    DEPRECATED_API = 'DEPRECATED_API',
    INEFFICIENT_CODE = 'INEFFICIENT_CODE',
    
    // Clippy Lints
    COMPLEXITY = 'COMPLEXITY',
    CORRECTNESS = 'CORRECTNESS',
    PEDANTIC = 'PEDANTIC',
    STYLE = 'STYLE',
    
    // Anti-patterns
    UNWRAP_ABUSE = 'UNWRAP_ABUSE',
    CLONE_ABUSE = 'CLONE_ABUSE',
    PANIC_IN_LIBRARY = 'PANIC_IN_LIBRARY',
}

export interface RustStatistics {
    totalIssues: number;
    bySeverity: Record<'critical' | 'high' | 'medium' | 'low', number>;
    byCategory: Record<RustErrorCategory, number>;
    affectedFiles: number;
    clippyIssues: number;
    rustcErrors: number;
    patternIssues: number;
}

export class RustDetector {
    private workspaceRoot: string;
    private cargoAvailable: boolean = false;
    private clippyAvailable: boolean = false;

    constructor(workspaceRoot: string) {
        this.workspaceRoot = workspaceRoot;
        this.checkToolAvailability();
    }

    /**
     * Check if Rust tools are installed
     */
    private checkToolAvailability(): void {
        try {
            execSync('cargo --version', { stdio: 'pipe' });
            this.cargoAvailable = true;
            logger.debug('[RustDetector] cargo available');
        } catch {
            logger.warn('[RustDetector] cargo not available - install Rust to use this detector');
        }

        try {
            execSync('cargo clippy --version', { stdio: 'pipe' });
            this.clippyAvailable = true;
            logger.debug('[RustDetector] cargo clippy available');
        } catch {
            logger.debug('[RustDetector] clippy not available (install with: rustup component add clippy)');
        }
    }

    /**
     * Main detection method
     */
    async detect(targetDir?: string): Promise<RustError[]> {
        const dir = targetDir || this.workspaceRoot;
        const errors: RustError[] = [];

        // Check if directory has Rust files or Cargo.toml
        const hasCargoToml = fs.existsSync(path.join(dir, 'Cargo.toml'));
        const rustFiles = await glob('**/*.rs', {
            cwd: dir,
            ignore: ['**/target/**', '**/node_modules/**'],
        });

        if (!hasCargoToml && rustFiles.length === 0) {
            logger.debug('[RustDetector] No Rust project found');
            return errors;
        }

        logger.info(`[RustDetector] Found Rust project with ${rustFiles.length} files`);

        // 1. Run cargo clippy
        if (this.cargoAvailable && this.clippyAvailable) {
            const clippyErrors = await this.runCargoClippy(dir);
            errors.push(...clippyErrors);
        }

        // 2. Run cargo check (rustc)
        if (this.cargoAvailable) {
            const checkErrors = await this.runCargoCheck(dir);
            errors.push(...checkErrors);
        }

        // 3. Run pattern analysis
        const patternErrors = await this.analyzePatterns(dir, rustFiles);
        errors.push(...patternErrors);

        return errors;
    }

    /**
     * Run cargo clippy (official Rust linter)
     */
    private async runCargoClippy(dir: string): Promise<RustError[]> {
        const errors: RustError[] = [];

        try {
            logger.debug('[RustDetector] Running cargo clippy...');
            
            // Run clippy with JSON output
            const output = execSync('cargo clippy --message-format=json -- -W clippy::all', {
                cwd: dir,
                stdio: 'pipe',
                encoding: 'utf8',
            });

            const clippyErrors = this.parseClippyOutput(output);
            errors.push(...clippyErrors);
        } catch (error: any) {
            // Clippy outputs to stdout even on error
            const output = error.stdout?.toString() || '';
            
            if (output.trim()) {
                const clippyErrors = this.parseClippyOutput(output);
                errors.push(...clippyErrors);
            }
        }

        logger.info(`[RustDetector] cargo clippy found ${errors.length} issues`);
        return errors;
    }

    /**
     * Parse cargo clippy JSON output
     */
    private parseClippyOutput(output: string): RustError[] {
        const errors: RustError[] = [];
        const lines = output.split('\n').filter(l => l.trim());

        for (const line of lines) {
            try {
                const msg = JSON.parse(line);
                
                // Only process compiler messages
                if (msg.reason !== 'compiler-message') continue;
                
                const diagnostic = msg.message;
                if (!diagnostic) continue;

                // Extract primary span
                const span = diagnostic.spans?.[0];
                if (!span) continue;

                errors.push({
                    file: span.file_name || 'unknown',
                    line: span.line_start || 0,
                    column: span.column_start || 0,
                    message: diagnostic.message || '',
                    tool: 'cargo-clippy',
                    severity: this.mapClippySeverity(diagnostic.level),
                    category: this.categorizeClippyError(diagnostic.code?.code || ''),
                    code: diagnostic.code?.code,
                    rootCause: diagnostic.code?.explanation || diagnostic.message,
                    suggestedFix: this.extractClippyFix(diagnostic),
                });
            } catch (parseError) {
                // Skip invalid JSON lines
                continue;
            }
        }

        return errors;
    }

    /**
     * Run cargo check (rustc compile check)
     */
    private async runCargoCheck(dir: string): Promise<RustError[]> {
        const errors: RustError[] = [];

        try {
            logger.debug('[RustDetector] Running cargo check...');
            
            // Run cargo check with JSON output
            const output = execSync('cargo check --message-format=json', {
                cwd: dir,
                stdio: 'pipe',
                encoding: 'utf8',
            });

            const checkErrors = this.parseCargoCheckOutput(output);
            errors.push(...checkErrors);
        } catch (error: any) {
            const output = error.stdout?.toString() || '';
            
            if (output.trim()) {
                const checkErrors = this.parseCargoCheckOutput(output);
                errors.push(...checkErrors);
            }
        }

        logger.info(`[RustDetector] cargo check found ${errors.length} issues`);
        return errors;
    }

    /**
     * Parse cargo check JSON output
     */
    private parseCargoCheckOutput(output: string): RustError[] {
        const errors: RustError[] = [];
        const lines = output.split('\n').filter(l => l.trim());

        for (const line of lines) {
            try {
                const msg = JSON.parse(line);
                
                if (msg.reason !== 'compiler-message') continue;
                
                const diagnostic = msg.message;
                if (!diagnostic || diagnostic.level === 'help') continue;

                const span = diagnostic.spans?.[0];
                if (!span) continue;

                errors.push({
                    file: span.file_name || 'unknown',
                    line: span.line_start || 0,
                    column: span.column_start || 0,
                    message: diagnostic.message || '',
                    tool: 'rustc',
                    severity: this.mapRustcSeverity(diagnostic.level),
                    category: this.categorizeRustcError(diagnostic.code?.code || ''),
                    code: diagnostic.code?.code,
                    rootCause: diagnostic.code?.explanation || diagnostic.message,
                    suggestedFix: this.extractRustcFix(diagnostic),
                });
            } catch (parseError) {
                continue;
            }
        }

        return errors;
    }

    /**
     * Analyze Rust code patterns
     */
    private async analyzePatterns(dir: string, rustFiles: string[]): Promise<RustError[]> {
        const errors: RustError[] = [];

        for (const file of rustFiles) {
            const filePath = path.join(dir, file);
            
            const content = safeReadFile(filePath);
            if (!content) {
                logger.warn(`[RustDetector] Cannot read ${filePath}`);
                continue;
            }
            
            try {
                const lines = content.split('\n');

                // Pattern 1: Unwrap abuse
                errors.push(...this.detectUnwrapAbuse(content, filePath, lines));

                // Pattern 2: Clone abuse
                errors.push(...this.detectCloneAbuse(content, filePath, lines));

                // Pattern 3: Unsafe code
                errors.push(...this.detectUnsafeCode(content, filePath, lines));

                // Pattern 4: Panic in library
                errors.push(...this.detectPanicInLibrary(content, filePath, lines));

            } catch (err) {
                logger.warn(`[RustDetector] Failed to analyze ${filePath}:`, err);
            }
        }

        logger.info(`[RustDetector] Pattern analysis found ${errors.length} issues`);
        return errors;
    }

    /**
     * Detect unwrap/expect abuse
     */
    private detectUnwrapAbuse(content: string, filePath: string, lines: string[]): RustError[] {
        const errors: RustError[] = [];
        
        // Pattern: .unwrap() or .expect() without proper error context
        const unwrapRegex = /\.(unwrap|expect)\(/g;
        let match;

        while ((match = unwrapRegex.exec(content)) !== null) {
            const lineNum = content.substring(0, match.index).split('\n').length;
            const line = lines[lineNum - 1];

            // Skip if in test code
            if (content.includes('#[test]') || content.includes('#[cfg(test)]')) {
                continue;
            }

            errors.push({
                file: filePath,
                line: lineNum,
                message: `Use of .${match[1]}() can cause panic - consider using Result/Option properly`,
                tool: 'pattern-analysis',
                severity: 'high',
                category: RustErrorCategory.UNWRAP_ABUSE,
                rootCause: 'Unwrap/expect can panic if value is None/Err',
                suggestedFix: 'Use pattern matching or ? operator: match result { Ok(v) => v, Err(e) => return Err(e) }',
            });
        }

        return errors;
    }

    /**
     * Detect clone abuse
     */
    private detectCloneAbuse(content: string, filePath: string, lines: string[]): RustError[] {
        const errors: RustError[] = [];
        
        // Pattern: Excessive .clone() calls
        const cloneRegex = /\.clone\(\)/g;
        const cloneCount = (content.match(cloneRegex) || []).length;

        // Flag if more than 5 clones in a file
        if (cloneCount > 5) {
            errors.push({
                file: filePath,
                line: 1,
                message: `Excessive use of .clone() (${cloneCount} times) - consider using references or Rc/Arc`,
                tool: 'pattern-analysis',
                severity: 'medium',
                category: RustErrorCategory.CLONE_ABUSE,
                rootCause: 'Cloning can be expensive, especially for large types',
                suggestedFix: 'Use references (&T), Rc<T>, or Arc<T> instead of cloning',
            });
        }

        return errors;
    }

    /**
     * Detect unsafe code
     */
    private detectUnsafeCode(content: string, filePath: string, lines: string[]): RustError[] {
        const errors: RustError[] = [];
        
        // Pattern: unsafe blocks
        const unsafeRegex = /unsafe\s+\{/g;
        let match;

        while ((match = unsafeRegex.exec(content)) !== null) {
            const lineNum = content.substring(0, match.index).split('\n').length;

            errors.push({
                file: filePath,
                line: lineNum,
                message: 'unsafe block detected - ensure safety invariants are documented and maintained',
                tool: 'pattern-analysis',
                severity: 'critical',
                category: RustErrorCategory.UNSAFE_CODE,
                rootCause: 'Unsafe code bypasses Rust\'s safety guarantees',
                suggestedFix: 'Document safety invariants with SAFETY comments, minimize unsafe scope',
            });
        }

        return errors;
    }

    /**
     * Detect panic in library code
     */
    private detectPanicInLibrary(content: string, filePath: string, lines: string[]): RustError[] {
        const errors: RustError[] = [];
        
        // Skip if in tests or bin
        if (filePath.includes('tests/') || filePath.includes('src/main.rs')) {
            return errors;
        }

        // Pattern: panic!, todo!, unimplemented!
        const panicRegex = /\b(panic!|todo!|unimplemented!)\(/g;
        let match;

        while ((match = panicRegex.exec(content)) !== null) {
            const lineNum = content.substring(0, match.index).split('\n').length;

            errors.push({
                file: filePath,
                line: lineNum,
                message: `${match[1]} in library code - should return Result instead`,
                tool: 'pattern-analysis',
                severity: 'high',
                category: RustErrorCategory.PANIC_IN_LIBRARY,
                rootCause: 'Library code should not panic - let caller decide error handling',
                suggestedFix: 'Return Result<T, Error> and use ? operator for error propagation',
            });
        }

        return errors;
    }

    /**
     * Map clippy severity
     */
    private mapClippySeverity(level: string): 'critical' | 'high' | 'medium' | 'low' {
        switch (level?.toLowerCase()) {
            case 'error': return 'critical';
            case 'warning': return 'high';
            case 'note': return 'medium';
            case 'help': return 'low';
            default: return 'medium';
        }
    }

    /**
     * Map rustc severity
     */
    private mapRustcSeverity(level: string): 'critical' | 'high' | 'medium' | 'low' {
        switch (level?.toLowerCase()) {
            case 'error': return 'critical';
            case 'warning': return 'high';
            default: return 'medium';
        }
    }

    /**
     * Categorize clippy error
     */
    private categorizeClippyError(code: string): RustErrorCategory {
        if (!code) return RustErrorCategory.STYLE;

        if (code.includes('complexity')) return RustErrorCategory.COMPLEXITY;
        if (code.includes('correctness')) return RustErrorCategory.CORRECTNESS;
        if (code.includes('pedantic')) return RustErrorCategory.PEDANTIC;
        if (code.includes('deprecated')) return RustErrorCategory.DEPRECATED_API;
        
        return RustErrorCategory.STYLE;
    }

    /**
     * Categorize rustc error
     */
    private categorizeRustcError(code: string): RustErrorCategory {
        if (!code) return RustErrorCategory.BORROW_CHECKER;

        // E0382: use of moved value
        if (code.includes('E0382') || code.includes('E0505')) {
            return RustErrorCategory.MOVED_VALUE;
        }
        // E0499: cannot borrow as mutable more than once
        if (code.includes('E0499') || code.includes('E0502')) {
            return RustErrorCategory.BORROW_CHECKER;
        }
        // E0106: missing lifetime specifier
        if (code.includes('E0106')) {
            return RustErrorCategory.LIFETIME_ERROR;
        }
        
        return RustErrorCategory.BORROW_CHECKER;
    }

    /**
     * Extract clippy fix suggestion
     */
    private extractClippyFix(diagnostic: any): string {
        // Check for suggested replacements
        const span = diagnostic.spans?.[0];
        if (span?.suggested_replacement) {
            return `Replace with: ${span.suggested_replacement}`;
        }

        // Check for help messages
        if (diagnostic.children) {
            for (const child of diagnostic.children) {
                if (child.level === 'help' && child.message) {
                    return child.message;
                }
            }
        }

        return 'See clippy documentation for details';
    }

    /**
     * Extract rustc fix suggestion
     */
    private extractRustcFix(diagnostic: any): string {
        // Check for help messages
        if (diagnostic.children) {
            for (const child of diagnostic.children) {
                if (child.level === 'help' && child.message) {
                    return child.message;
                }
            }
        }

        return 'See Rust compiler error explanation for details';
    }

    /**
     * Get statistics
     */
    async getStatistics(errors: RustError[]): Promise<RustStatistics> {
        const stats: RustStatistics = {
            totalIssues: errors.length,
            bySeverity: { critical: 0, high: 0, medium: 0, low: 0 },
            byCategory: {} as Record<RustErrorCategory, number>,
            affectedFiles: new Set(errors.map(e => e.file)).size,
            clippyIssues: errors.filter(e => e.tool === 'cargo-clippy').length,
            rustcErrors: errors.filter(e => e.tool === 'rustc').length,
            patternIssues: errors.filter(e => e.tool === 'pattern-analysis').length,
        };

        for (const error of errors) {
            stats.bySeverity[error.severity]++;
            stats.byCategory[error.category] = (stats.byCategory[error.category] || 0) + 1;
        }

        return stats;
    }
}
