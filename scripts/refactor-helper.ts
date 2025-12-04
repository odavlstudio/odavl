#!/usr/bin/env tsx
/**
 * Refactoring Helper Script
 * 
 * **Purpose:** Automated refactoring operations
 * 
 * **Features:**
 * 1. Extract repeated code to utilities
 * 2. Rename poorly named variables
 * 3. Add missing JSDoc comments
 * 4. Simplify complex conditionals
 * 5. Remove dead code
 * 
 * **Usage:**
 * ```bash
 * pnpm tsx scripts/refactor-helper.ts --extract-utils
 * pnpm tsx scripts/refactor-helper.ts --add-jsdoc
 * pnpm tsx scripts/refactor-helper.ts --simplify
 * ```
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { glob } from 'glob';

interface RefactoringTask {
    file: string;
    line: number;
    type: 'extract' | 'rename' | 'jsdoc' | 'simplify' | 'remove';
    description: string;
    before: string;
    after: string;
}

class RefactorHelper {
    private workspaceRoot: string;
    
    constructor(workspaceRoot: string) {
        this.workspaceRoot = workspaceRoot;
    }
    
    /**
     * Find functions missing JSDoc comments
     */
    async findMissingJsDoc(): Promise<RefactoringTask[]> {
        console.log('📝 Finding functions missing JSDoc...');
        
        const tasks: RefactoringTask[] = [];
        const files = await glob('odavl-studio/**/*.{ts,tsx}', {
            cwd: this.workspaceRoot,
            ignore: ['**/node_modules/**', '**/dist/**', '**/.next/**', '**/*.test.ts'],
        });
        
        for (const file of files) {
            const filePath = path.join(this.workspaceRoot, file);
            const content = fs.readFileSync(filePath, 'utf-8');
            const lines = content.split('\n');
            
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i];
                
                // Check for exported functions without JSDoc
                if (line.match(/^export\s+(async\s+)?function\s+\w+/) ||
                    line.match(/^export\s+const\s+\w+\s*=\s*(?:async\s*)?\(/)) {
                    
                    // Check if previous line is JSDoc
                    const prevLine = i > 0 ? lines[i - 1].trim() : '';
                    if (!prevLine.startsWith('*/') && !prevLine.startsWith('*')) {
                        const functionName = line.match(/(?:function|const)\s+(\w+)/)?.[1] || 'unknown';
                        
                        tasks.push({
                            file,
                            line: i + 1,
                            type: 'jsdoc',
                            description: `Add JSDoc for function: ${functionName}`,
                            before: line,
                            after: `/**\n * TODO: Add description\n * @param params - TODO\n * @returns TODO\n */\n${line}`,
                        });
                    }
                }
            }
        }
        
        console.log(`   Found ${tasks.length} functions missing JSDoc\n`);
        return tasks;
    }
    
    /**
     * Find poorly named variables (single letter, non-descriptive)
     */
    async findPoorlyNamedVariables(): Promise<RefactoringTask[]> {
        console.log('🔤 Finding poorly named variables...');
        
        const tasks: RefactoringTask[] = [];
        const files = await glob('odavl-studio/**/*.{ts,tsx}', {
            cwd: this.workspaceRoot,
            ignore: ['**/node_modules/**', '**/dist/**', '**/.next/**', '**/*.test.ts'],
        });
        
        const poorNames = ['x', 'y', 'z', 'tmp', 'temp', 'data', 'info', 'obj', 'arr'];
        
        for (const file of files) {
            const filePath = path.join(this.workspaceRoot, file);
            const content = fs.readFileSync(filePath, 'utf-8');
            const lines = content.split('\n');
            
            lines.forEach((line, index) => {
                const varMatch = line.match(/(?:const|let|var)\s+([a-z]+)\s*=/);
                if (varMatch && poorNames.includes(varMatch[1])) {
                    tasks.push({
                        file,
                        line: index + 1,
                        type: 'rename',
                        description: `Rename poorly named variable: ${varMatch[1]}`,
                        before: line,
                        after: `// TODO: Rename '${varMatch[1]}' to something descriptive`,
                    });
                }
            });
        }
        
        console.log(`   Found ${tasks.length} poorly named variables\n`);
        return tasks;
    }
    
    /**
     * Find complex conditionals that can be simplified
     */
    async findComplexConditionals(): Promise<RefactoringTask[]> {
        console.log('🔀 Finding complex conditionals...');
        
        const tasks: RefactoringTask[] = [];
        const files = await glob('odavl-studio/**/*.{ts,tsx}', {
            cwd: this.workspaceRoot,
            ignore: ['**/node_modules/**', '**/dist/**', '**/.next/**', '**/*.test.ts'],
        });
        
        for (const file of files) {
            const filePath = path.join(this.workspaceRoot, file);
            const content = fs.readFileSync(filePath, 'utf-8');
            const lines = content.split('\n');
            
            lines.forEach((line, index) => {
                // Find if statements with many conditions
                const conditionCount = (line.match(/&&|\|\|/g) || []).length;
                if (line.includes('if') && conditionCount >= 3) {
                    tasks.push({
                        file,
                        line: index + 1,
                        type: 'simplify',
                        description: 'Simplify complex conditional',
                        before: line,
                        after: '// TODO: Extract to well-named boolean variable',
                    });
                }
            });
        }
        
        console.log(`   Found ${tasks.length} complex conditionals\n`);
        return tasks;
    }
    
    /**
     * Generate refactoring report
     */
    async generateReport(): Promise<void> {
        console.log('🔍 Analyzing codebase for refactoring opportunities...\n');
        
        const missingJsDoc = await this.findMissingJsDoc();
        const poorlyNamed = await this.findPoorlyNamedVariables();
        const complexConditionals = await this.findComplexConditionals();
        
        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                missingJsDoc: missingJsDoc.length,
                poorlyNamed: poorlyNamed.length,
                complexConditionals: complexConditionals.length,
                total: missingJsDoc.length + poorlyNamed.length + complexConditionals.length,
            },
            tasks: {
                missingJsDoc,
                poorlyNamed,
                complexConditionals,
            },
        };
        
        // Print summary
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📊 REFACTORING OPPORTUNITIES');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        console.log(`Missing JSDoc:          ${report.summary.missingJsDoc}`);
        console.log(`Poorly Named Variables: ${report.summary.poorlyNamed}`);
        console.log(`Complex Conditionals:   ${report.summary.complexConditionals}`);
        console.log(`\nTotal Tasks:            ${report.summary.total}\n`);
        
        // Save report
        const reportPath = path.join(this.workspaceRoot, 'reports', 'refactoring-opportunities.json');
        fs.mkdirSync(path.dirname(reportPath), { recursive: true });
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        console.log(`📄 Full report saved to: ${reportPath}\n`);
    }
}

// Main execution
if (import.meta.url === `file://${process.argv[1]}`) {
    const workspaceRoot = process.cwd();
    const refactor = new RefactorHelper(workspaceRoot);
    
    refactor.generateReport().catch(error => {
        console.error('Error:', error);
        process.exit(1);
    });
}
