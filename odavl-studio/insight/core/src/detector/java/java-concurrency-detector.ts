/**
 * Java Concurrency Detector
 * Detects concurrency issues: race conditions, thread safety violations, deadlocks
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { JavaParser } from '../../parsers/java-parser.js';
import type { JavaAST, JavaClass, JavaMethod, JavaField } from '../../parsers/java-parser.js';

export interface JavaIssue {
    file: string;
    line: number;
    column: number;
    severity: 'error' | 'warning' | 'info';
    message: string;
    code: string;
    category: string;
    autoFixable: boolean;
    suggestion?: string;
}

export class JavaConcurrencyDetector {
    private parser: JavaParser;
    private workspaceRoot: string;

    constructor(workspaceRoot: string) {
        this.workspaceRoot = workspaceRoot;
        this.parser = new JavaParser();
    }

    /**
     * Main detection method
     */
    async detect(): Promise<JavaIssue[]> {
        const issues: JavaIssue[] = [];
        try {
            const isJava = await this.isJavaProject(this.workspaceRoot);
            if (!isJava) {
                return [];
            }

            const javaFiles = await this.findJavaFiles(this.workspaceRoot);

            // Analyze each file
            for (const file of javaFiles) {
                const fileIssues = await this.analyzeFile(file);
                issues.push(...fileIssues);
            }

            return issues;
        } catch (error: any) {
            console.error('Java Concurrency Detector failed:', error);
            return [this.createErrorIssue(error.message)];
        }
    }

    /**
     * Analyze a single Java file for concurrency issues
     */
    private async analyzeFile(filePath: string): Promise<JavaIssue[]> {
        const issues: JavaIssue[] = [];
        try {
            const ast = await this.parser.parseFile(filePath);
            const content = await this.readFile(filePath);
            const lines = content.split('\n');

            for (const classDecl of ast.classes) {
                // Check for shared mutable state (race conditions)
                for (const field of classDecl.fields) {
                    const fieldIssues = this.checkSharedMutableState(field, content, field.line);
                    issues.push(...fieldIssues.map((issue) => ({ ...issue, file: filePath })));
                }

                // Check for unsynchronized collections
                for (const field of classDecl.fields) {
                    const collectionIssues = this.checkUnsynchronizedCollections(field, content, field.line);
                    issues.push(...collectionIssues.map((issue) => ({ ...issue, file: filePath })));
                }

                // Check for deadlock potential in methods
                for (const method of classDecl.methods) {
                    const methodStartLine = method.line - 1;
                    const methodEndLine = methodStartLine + method.bodyLines;
                    const methodBody = lines.slice(methodStartLine, methodEndLine).join('\n');

                    const deadlockIssues = this.checkDeadlockPotential(methodBody, method.line);
                    issues.push(...deadlockIssues.map((issue) => ({ ...issue, file: filePath })));
                }

                // Check for singleton thread safety
                const singletonIssues = this.checkSingletonThreadSafety(classDecl, content);
                issues.push(...singletonIssues.map((issue) => ({ ...issue, file: filePath })));

                // Check for concurrent modification during iteration
                for (const method of classDecl.methods) {
                    const methodStartLine = method.line - 1;
                    const methodEndLine = methodStartLine + method.bodyLines;
                    const methodBody = lines.slice(methodStartLine, methodEndLine).join('\n');

                    const concurrentModIssues = this.checkConcurrentModification(methodBody, method.line);
                    issues.push(...concurrentModIssues.map((issue) => ({ ...issue, file: filePath })));
                }
            }

            return issues;
        } catch (error: any) {
            console.error(`Failed to analyze file ${filePath}:`, error);
            return [];
        }
    }

    /**
     * Pattern 1: Check for shared mutable state without synchronization
     */
    private checkSharedMutableState(field: JavaField, code: string, startLine: number): JavaIssue[] {
        const issues: JavaIssue[] = [];

        // Check if field is:
        // 1. Non-final (mutable)
        // 2. Not volatile
        // 3. Not using atomic types
        // 4. Not synchronized
        
        const isFinal = field.modifiers.includes('final');
        const isVolatile = field.modifiers.includes('volatile');
        const isAtomic = /Atomic(Integer|Long|Boolean|Reference)/.test(field.type);
        
        // Check for thread-safe types (should NOT be flagged)
        const isThreadSafe = /Concurrent|CopyOnWrite|synchronized/.test(field.type);
        
        // Extract field declaration line
        const lines = code.split('\n');
        const fieldLine = lines[startLine - 1] || '';

        if (!isFinal && !isVolatile && !isAtomic && !isThreadSafe) {
            // Check if it's a primitive type or common mutable type
            const mutableTypes = ['int', 'long', 'double', 'float', 'boolean', 'String', 'List', 'Map', 'Set'];
            const isMutableType = mutableTypes.some(type => field.type.includes(type));

            if (isMutableType && !field.modifiers.includes('private static final')) {
                issues.push({
                    file: '',
                    line: startLine,
                    column: 0,
                    severity: 'warning',
                    message: `Potential race condition: Field '${field.name}' is shared mutable state without synchronization`,
                    code: 'CONCURRENCY-001',
                    category: 'RACE-CONDITION',
                    autoFixable: true,
                    suggestion: `Consider using AtomicInteger/AtomicLong, volatile keyword, or synchronization for field '${field.name}'`,
                });
            }
        }

        return issues;
    }

    /**
     * Pattern 2: Check for unsynchronized collection access
     */
    private checkUnsynchronizedCollections(field: JavaField, code: string, startLine: number): JavaIssue[] {
        const issues: JavaIssue[] = [];

        // Check for non-thread-safe collections
        const unsafeCollections = [
            { pattern: /ArrayList/, safe: 'CopyOnWriteArrayList or Collections.synchronizedList()' },
            { pattern: /HashMap/, safe: 'ConcurrentHashMap' },
            { pattern: /HashSet/, safe: 'ConcurrentHashMap.newKeySet() or Collections.synchronizedSet()' },
            { pattern: /TreeMap/, safe: 'ConcurrentSkipListMap' },
            { pattern: /LinkedList/, safe: 'ConcurrentLinkedQueue or Collections.synchronizedList()' },
        ];

        for (const { pattern, safe } of unsafeCollections) {
            if (pattern.test(field.type)) {
                // Check if it's wrapped in Collections.synchronized*
                const lines = code.split('\n');
                const fieldLine = lines[startLine - 1] || '';
                
                if (!fieldLine.includes('Collections.synchronized') && 
                    !fieldLine.includes('Concurrent') &&
                    !fieldLine.includes('CopyOnWrite')) {
                    
                    issues.push({
                        file: '',
                        line: startLine,
                        column: 0,
                        severity: 'warning',
                        message: `Unsynchronized collection: Field '${field.name}' uses ${field.type} which is not thread-safe`,
                        code: 'CONCURRENCY-002',
                        category: 'UNSAFE-COLLECTION',
                        autoFixable: true,
                        suggestion: `Replace with ${safe}`,
                    });
                }
            }
        }

        return issues;
    }

    /**
     * Pattern 3: Check for deadlock potential (lock ordering issues)
     */
    private checkDeadlockPotential(code: string, startLine: number): JavaIssue[] {
        const issues: JavaIssue[] = [];

        // Detect nested synchronized blocks
        const nestedSyncRegex = /synchronized\s*\([^)]+\)\s*\{[^}]*synchronized\s*\([^)]+\)/gs;
        const matches = [...code.matchAll(nestedSyncRegex)];

        for (const match of matches) {
            const lineOffset = code.substring(0, match.index).split('\n').length - 1;
            const line = startLine + lineOffset;

            issues.push({
                file: '',
                line,
                column: 0,
                severity: 'warning',
                message: 'Potential deadlock: Nested synchronized blocks detected (lock ordering issue)',
                code: 'CONCURRENCY-003',
                category: 'DEADLOCK-RISK',
                autoFixable: false,
                suggestion: 'Ensure consistent lock ordering across all methods to prevent deadlock',
            });
        }

        return issues;
    }

    /**
     * Pattern 4: Check for singleton thread safety violations
     */
    private checkSingletonThreadSafety(classDecl: JavaClass, code: string): JavaIssue[] {
        const issues: JavaIssue[] = [];

        // Look for getInstance pattern
        const hasGetInstance = classDecl.methods.some(m => m.name === 'getInstance');
        if (!hasGetInstance) return issues;

        // Check for double-checked locking without volatile
        const doubleCheckedPattern = /if\s*\(\s*instance\s*==\s*null\s*\)[^}]*synchronized[^}]*if\s*\(\s*instance\s*==\s*null\s*\)/s;
        
        if (doubleCheckedPattern.test(code)) {
            // Check if instance field is volatile
            const instanceField = classDecl.fields.find(f => f.name === 'instance');
            if (instanceField && !instanceField.modifiers.includes('volatile')) {
                issues.push({
                    file: '',
                    line: instanceField.line,
                    column: 0,
                    severity: 'error',
                    message: 'Broken double-checked locking: instance field must be volatile',
                    code: 'CONCURRENCY-004',
                    category: 'SINGLETON-UNSAFE',
                    autoFixable: true,
                    suggestion: "Add 'volatile' keyword to instance field",
                });
            }
        }

        // Check for lazy initialization without synchronization
        const lazyInitPattern = /if\s*\(\s*instance\s*==\s*null\s*\)\s*\{\s*instance\s*=\s*new/;
        const hasSync = /synchronized/.test(code);
        
        if (lazyInitPattern.test(code) && !hasSync) {
            const getInstanceMethod = classDecl.methods.find(m => m.name === 'getInstance');
            if (getInstanceMethod) {
                issues.push({
                    file: '',
                    line: getInstanceMethod.line,
                    column: 0,
                    severity: 'warning',
                    message: 'Singleton lazy initialization without synchronization (race condition)',
                    code: 'CONCURRENCY-005',
                    category: 'SINGLETON-UNSAFE',
                    autoFixable: true,
                    suggestion: 'Use synchronized method, double-checked locking with volatile, or initialization-on-demand holder idiom',
                });
            }
        }

        return issues;
    }

    /**
     * Pattern 5: Check for concurrent modification during iteration
     */
    private checkConcurrentModification(code: string, startLine: number): JavaIssue[] {
        const issues: JavaIssue[] = [];

        // Pattern: for-each loop with collection modification
        const forEachModifyRegex = /for\s*\([^)]+:\s*(\w+)\)\s*\{[^}]*\1\.(remove|add|clear)\(/gs;
        const matches = [...code.matchAll(forEachModifyRegex)];

        for (const match of matches) {
            const lineOffset = code.substring(0, match.index).split('\n').length - 1;
            const line = startLine + lineOffset;
            const operation = match[2];

            issues.push({
                file: '',
                line,
                column: 0,
                severity: 'error',
                message: `ConcurrentModificationException risk: Calling ${operation}() on collection during iteration`,
                code: 'CONCURRENCY-006',
                category: 'CONCURRENT-MODIFICATION',
                autoFixable: true,
                suggestion: 'Use Iterator.remove() instead, or collect items to modify and process after iteration',
            });
        }

        return issues;
    }

    /**
     * Helper: Check if directory is a Java project
     */
    private async isJavaProject(dir: string): Promise<boolean> {
        try {
            const entries = await fs.readdir(dir);
            return entries.some(entry => 
                entry === 'pom.xml' || 
                entry === 'build.gradle' || 
                entry === 'build.gradle.kts' ||
                entry.endsWith('.java')
            );
        } catch {
            return false;
        }
    }

    /**
     * Helper: Find all Java files recursively
     */
    private async findJavaFiles(dir: string): Promise<string[]> {
        return await this.parser.findJavaFiles(dir);
    }

    /**
     * Helper: Read file content
     */
    private async readFile(filePath: string): Promise<string> {
        return await fs.readFile(filePath, 'utf-8');
    }

    /**
     * Helper: Create error issue
     */
    private createErrorIssue(message: string): JavaIssue {
        return {
            file: this.workspaceRoot,
            line: 0,
            column: 0,
            severity: 'error',
            message: `Java Concurrency Detector Error: ${message}`,
            code: 'CONCURRENCY-ERROR',
            category: 'DETECTOR-ERROR',
            autoFixable: false,
        };
    }
}
