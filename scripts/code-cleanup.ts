#!/usr/bin/env tsx
/**
 * Code Cleanup Script
 * 
 * **Purpose:** Automated code quality improvements
 * 
 * **Features:**
 * 1. Find and remove console.log statements
 * 2. Find and list TODO comments
 * 3. Find complex functions (cyclomatic complexity > 10)
 * 4. Find long functions (> 100 lines)
 * 5. Find duplicate code patterns
 * 
 * **Usage:**
 * ```bash
 * pnpm tsx scripts/code-cleanup.ts --analyze
 * pnpm tsx scripts/code-cleanup.ts --fix
 * ```
 */

import { execSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { glob } from 'glob';

interface CleanupResult {
    consoleStatements: ConsoleFinding[];
    todoComments: TodoFinding[];
    complexFunctions: ComplexityFinding[];
    longFunctions: LongFunctionFinding[];
    duplicateCode: DuplicateFinding[];
}

interface ConsoleFinding {
    file: string;
    line: number;
    statement: string;
    type: 'log' | 'error' | 'warn' | 'debug';
}

interface TodoFinding {
    file: string;
    line: number;
    comment: string;
    type: 'TODO' | 'FIXME' | 'XXX' | 'HACK';
}

interface ComplexityFinding {
    file: string;
    function: string;
    complexity: number;
    line: number;
}

interface LongFunctionFinding {
    file: string;
    function: string;
    lines: number;
    startLine: number;
}

interface DuplicateFinding {
    pattern: string;
    occurrences: Array<{ file: string; line: number }>;
}

class CodeCleanup {
    private workspaceRoot: string;
    
    constructor(workspaceRoot: string) {
        this.workspaceRoot = workspaceRoot;
    }
    
    /**
     * Analyze codebase for cleanup opportunities
     */
    async analyze(): Promise<CleanupResult> {
        console.log('🔍 Analyzing codebase for cleanup opportunities...\n');
        
        const result: CleanupResult = {
            consoleStatements: await this.findConsoleStatements(),
            todoComments: await this.findTodoComments(),
            complexFunctions: await this.findComplexFunctions(),
            longFunctions: await this.findLongFunctions(),
            duplicateCode: await this.findDuplicateCode(),
        };
        
        this.printReport(result);
        return result;
    }
    
    /**
     * Find all console.log, console.error, etc.
     */
    private async findConsoleStatements(): Promise<ConsoleFinding[]> {
        console.log('📋 Finding console statements...');
        
        const findings: ConsoleFinding[] = [];
        const files = await glob('odavl-studio/**/*.{ts,tsx,js,jsx}', {
            cwd: this.workspaceRoot,
            ignore: ['**/node_modules/**', '**/dist/**', '**/.next/**'],
        });
        
        for (const file of files) {
            const filePath = path.join(this.workspaceRoot, file);
            const content = fs.readFileSync(filePath, 'utf-8');
            const lines = content.split('\n');
            
            lines.forEach((line, index) => {
                const consoleMatch = line.match(/console\.(log|error|warn|debug)\(/);
                if (consoleMatch) {
                    findings.push({
                        file,
                        line: index + 1,
                        statement: line.trim(),
                        type: consoleMatch[1] as any,
                    });
                }
            });
        }
        
        console.log(`   Found ${findings.length} console statements\n`);
        return findings;
    }
    
    /**
     * Find all TODO, FIXME, XXX, HACK comments
     */
    private async findTodoComments(): Promise<TodoFinding[]> {
        console.log('📝 Finding TODO comments...');
        
        const findings: TodoFinding[] = [];
        const files = await glob('odavl-studio/**/*.{ts,tsx,js,jsx}', {
            cwd: this.workspaceRoot,
            ignore: ['**/node_modules/**', '**/dist/**', '**/.next/**'],
        });
        
        for (const file of files) {
            const filePath = path.join(this.workspaceRoot, file);
            const content = fs.readFileSync(filePath, 'utf-8');
            const lines = content.split('\n');
            
            lines.forEach((line, index) => {
                const todoMatch = line.match(/\/\/\s*(TODO|FIXME|XXX|HACK):?\s*(.+)/);
                if (todoMatch) {
                    findings.push({
                        file,
                        line: index + 1,
                        comment: todoMatch[2],
                        type: todoMatch[1] as any,
                    });
                }
            });
        }
        
        console.log(`   Found ${findings.length} TODO comments\n`);
        return findings;
    }
    
    /**
     * Find functions with high cyclomatic complexity
     */
    private async findComplexFunctions(): Promise<ComplexityFinding[]> {
        console.log('🔢 Finding complex functions...');
        
        const findings: ComplexityFinding[] = [];
        const files = await glob('odavl-studio/**/*.{ts,tsx}', {
            cwd: this.workspaceRoot,
            ignore: ['**/node_modules/**', '**/dist/**', '**/.next/**', '**/*.test.ts', '**/*.spec.ts'],
        });
        
        for (const file of files) {
            const filePath = path.join(this.workspaceRoot, file);
            const content = fs.readFileSync(filePath, 'utf-8');
            const lines = content.split('\n');
            
            let currentFunction = '';
            let functionStartLine = 0;
            let braceCount = 0;
            let complexity = 1; // Base complexity
            
            lines.forEach((line, index) => {
                const functionMatch = line.match(/(function|async\s+function|const\s+\w+\s*=\s*(?:async\s*)?\(.*?\)\s*=>|(?:async\s+)?\w+\s*\(.*?\))/);
                
                if (functionMatch && braceCount === 0) {
                    currentFunction = functionMatch[0].trim();
                    functionStartLine = index + 1;
                    complexity = 1;
                }
                
                // Count complexity indicators
                if (line.match(/\b(if|else if|while|for|case|catch|\?|&&|\|\|)\b/)) {
                    complexity++;
                }
                
                // Track braces
                braceCount += (line.match(/{/g) || []).length;
                braceCount -= (line.match(/}/g) || []).length;
                
                // End of function
                if (braceCount === 0 && currentFunction && complexity > 10) {
                    findings.push({
                        file,
                        function: currentFunction,
                        complexity,
                        line: functionStartLine,
                    });
                    currentFunction = '';
                }
            });
        }
        
        console.log(`   Found ${findings.length} complex functions (complexity > 10)\n`);
        return findings;
    }
    
    /**
     * Find functions longer than 100 lines
     */
    private async findLongFunctions(): Promise<LongFunctionFinding[]> {
        console.log('📏 Finding long functions...');
        
        const findings: LongFunctionFinding[] = [];
        const files = await glob('odavl-studio/**/*.{ts,tsx}', {
            cwd: this.workspaceRoot,
            ignore: ['**/node_modules/**', '**/dist/**', '**/.next/**', '**/*.test.ts', '**/*.spec.ts'],
        });
        
        for (const file of files) {
            const filePath = path.join(this.workspaceRoot, file);
            const content = fs.readFileSync(filePath, 'utf-8');
            const lines = content.split('\n');
            
            let currentFunction = '';
            let functionStartLine = 0;
            let functionLines = 0;
            let braceCount = 0;
            
            lines.forEach((line, index) => {
                const functionMatch = line.match(/(function|async\s+function|const\s+\w+\s*=\s*(?:async\s*)?\(.*?\)\s*=>|(?:async\s+)?\w+\s*\(.*?\))/);
                
                if (functionMatch && braceCount === 0) {
                    currentFunction = functionMatch[0].trim();
                    functionStartLine = index + 1;
                    functionLines = 0;
                }
                
                if (currentFunction) {
                    functionLines++;
                }
                
                // Track braces
                braceCount += (line.match(/{/g) || []).length;
                braceCount -= (line.match(/}/g) || []).length;
                
                // End of function
                if (braceCount === 0 && currentFunction && functionLines > 100) {
                    findings.push({
                        file,
                        function: currentFunction,
                        lines: functionLines,
                        startLine: functionStartLine,
                    });
                    currentFunction = '';
                }
            });
        }
        
        console.log(`   Found ${findings.length} long functions (> 100 lines)\n`);
        return findings;
    }
    
    /**
     * Find duplicate code patterns (simple heuristic)
     */
    private async findDuplicateCode(): Promise<DuplicateFinding[]> {
        console.log('🔄 Finding duplicate code...');
        
        const findings: DuplicateFinding[] = [];
        const codeBlocks = new Map<string, Array<{ file: string; line: number }>>();
        
        const files = await glob('odavl-studio/**/*.{ts,tsx}', {
            cwd: this.workspaceRoot,
            ignore: ['**/node_modules/**', '**/dist/**', '**/.next/**', '**/*.test.ts', '**/*.spec.ts'],
        });
        
        for (const file of files) {
            const filePath = path.join(this.workspaceRoot, file);
            const content = fs.readFileSync(filePath, 'utf-8');
            const lines = content.split('\n');
            
            // Check for duplicate blocks of 5+ lines
            for (let i = 0; i < lines.length - 5; i++) {
                const block = lines.slice(i, i + 5)
                    .map(l => l.trim())
                    .filter(l => l && !l.startsWith('//'))
                    .join('\n');
                
                if (block.length > 50) { // Ignore trivial blocks
                    if (!codeBlocks.has(block)) {
                        codeBlocks.set(block, []);
                    }
                    codeBlocks.get(block)!.push({ file, line: i + 1 });
                }
            }
        }
        
        // Find duplicates
        codeBlocks.forEach((occurrences, pattern) => {
            if (occurrences.length > 1) {
                findings.push({ pattern, occurrences });
            }
        });
        
        console.log(`   Found ${findings.length} duplicate code patterns\n`);
        return findings;
    }
    
    /**
     * Print analysis report
     */
    private printReport(result: CleanupResult): void {
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📊 CODE CLEANUP ANALYSIS REPORT');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        
        // Console statements
        if (result.consoleStatements.length > 0) {
            console.log(`🔴 Console Statements (${result.consoleStatements.length})`);
            console.log('   Should be replaced with Logger utility\n');
            result.consoleStatements.slice(0, 10).forEach(f => {
                console.log(`   ${f.file}:${f.line}`);
                console.log(`      ${f.statement}`);
            });
            if (result.consoleStatements.length > 10) {
                console.log(`   ... and ${result.consoleStatements.length - 10} more\n`);
            }
            console.log();
        }
        
        // TODO comments
        if (result.todoComments.length > 0) {
            console.log(`📝 TODO Comments (${result.todoComments.length})`);
            const byType = new Map<string, number>();
            result.todoComments.forEach(f => {
                byType.set(f.type, (byType.get(f.type) || 0) + 1);
            });
            byType.forEach((count, type) => {
                console.log(`   ${type}: ${count}`);
            });
            console.log();
        }
        
        // Complex functions
        if (result.complexFunctions.length > 0) {
            console.log(`🔢 Complex Functions (${result.complexFunctions.length})`);
            console.log('   Consider refactoring to reduce complexity\n');
            result.complexFunctions.slice(0, 5).forEach(f => {
                console.log(`   ${f.file}:${f.line}`);
                console.log(`      ${f.function}`);
                console.log(`      Complexity: ${f.complexity}`);
            });
            if (result.complexFunctions.length > 5) {
                console.log(`   ... and ${result.complexFunctions.length - 5} more\n`);
            }
            console.log();
        }
        
        // Long functions
        if (result.longFunctions.length > 0) {
            console.log(`📏 Long Functions (${result.longFunctions.length})`);
            console.log('   Consider splitting into smaller functions\n');
            result.longFunctions.slice(0, 5).forEach(f => {
                console.log(`   ${f.file}:${f.startLine}`);
                console.log(`      ${f.function}`);
                console.log(`      Lines: ${f.lines}`);
            });
            if (result.longFunctions.length > 5) {
                console.log(`   ... and ${result.longFunctions.length - 5} more\n`);
            }
            console.log();
        }
        
        // Duplicate code
        if (result.duplicateCode.length > 0) {
            console.log(`🔄 Duplicate Code Patterns (${result.duplicateCode.length})`);
            console.log('   Consider extracting to shared utilities\n');
            result.duplicateCode.slice(0, 3).forEach(f => {
                console.log(`   Found in ${f.occurrences.length} locations:`);
                f.occurrences.forEach(o => {
                    console.log(`      ${o.file}:${o.line}`);
                });
                console.log();
            });
            if (result.duplicateCode.length > 3) {
                console.log(`   ... and ${result.duplicateCode.length - 3} more patterns\n`);
            }
        }
        
        // Summary
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📈 SUMMARY');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        console.log(`Console Statements:     ${result.consoleStatements.length}`);
        console.log(`TODO Comments:          ${result.todoComments.length}`);
        console.log(`Complex Functions:      ${result.complexFunctions.length}`);
        console.log(`Long Functions:         ${result.longFunctions.length}`);
        console.log(`Duplicate Code Patterns: ${result.duplicateCode.length}`);
        console.log();
        
        // Save report
        const reportPath = path.join(this.workspaceRoot, 'reports', 'code-cleanup-analysis.json');
        fs.mkdirSync(path.dirname(reportPath), { recursive: true });
        fs.writeFileSync(reportPath, JSON.stringify(result, null, 2));
        console.log(`📄 Full report saved to: ${reportPath}\n`);
    }
}

// Main execution
if (import.meta.url === `file://${process.argv[1]}`) {
    const workspaceRoot = process.cwd();
    const cleanup = new CodeCleanup(workspaceRoot);
    
    cleanup.analyze().catch(error => {
        console.error('Error:', error);
        process.exit(1);
    });
}
