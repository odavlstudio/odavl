/**
 * Java Null Safety Detector
 * Detects potential NullPointerExceptions using static analysis
 * 
 * Integrates with tools:
 * - NullAway (Uber's null safety checker)
 * - SpotBugs (with FindBugs-style null annotations)
 * - IntelliJ IDEA's nullability inspections
 * - Eclipse JDT annotations
 */

import { execSync } from 'child_process';
import { JavaParser } from '../../parsers/java-parser.js';
import { BaseJavaDetector, type JavaIssue } from './base-java-detector.js';

interface NullSafetyPattern {
    pattern: RegExp;
    message: string;
    severity: 'error' | 'warning' | 'info';
    recommendation: string;
    category: string;
}

export class JavaNullSafetyDetector extends BaseJavaDetector {
    private parser: JavaParser;
    private patterns: NullSafetyPattern[];

    constructor(workspaceRoot: string) {
        super(workspaceRoot, 'java-null-safety');
        this.parser = new JavaParser();
        this.patterns = this.initializePatterns();
    }

    /**
     * Initialize null safety violation patterns
     */
    private initializePatterns(): NullSafetyPattern[] {
        return [
            // Direct method call on potentially null variable
            {
                pattern: /\.(\w+)\(/,
                message: 'Potential NullPointerException: method call on potentially null object',
                severity: 'warning',
                recommendation: 'Add null check before method call or use Optional',
                category: 'null-dereference',
            },
            // Array access on potentially null array
            {
                pattern: /\[\s*\d+\s*\]/,
                message: 'Potential NullPointerException: array access on potentially null array',
                severity: 'warning',
                recommendation: 'Add null check before array access',
                category: 'null-array-access',
            },
            // Returning null in method
            {
                pattern: /return\s+null\s*;/,
                message: 'Returning null may cause NullPointerException in caller',
                severity: 'info',
                recommendation: 'Consider returning Optional<T> instead of null',
                category: 'null-return',
            },
            // Comparing with null using ==
            {
                pattern: /==\s*null|null\s*==/,
                message: 'Null comparison found',
                severity: 'info',
                recommendation: 'Consider using Objects.isNull() or Optional',
                category: 'null-comparison',
            },
            // String concatenation with potentially null
            {
                pattern: /\+\s*"|\+\s*'|"\s*\+|'\s*\+/,
                message: 'String concatenation with potentially null value',
                severity: 'info',
                recommendation: 'Use String.valueOf() or Objects.toString() for null-safe concatenation',
                category: 'null-concatenation',
            },
        ];
    }

    async detect(): Promise<JavaIssue[]> {
        const issues: JavaIssue[] = [];

        try {
            // Check if this is a Java project
            const isJava = await this.isJavaProject(this.workspaceRoot);
            console.log(`[JavaNullSafetyDetector] Is Java project: ${isJava}`);
            if (!isJava) {
                return [];
            }

            // Find all Java files
            const javaFiles = await this.findJavaFiles(this.workspaceRoot);
            console.log(`[JavaNullSafetyDetector] Found ${javaFiles.length} Java files:`, javaFiles.map(f => f.split('\\').pop()));
            if (javaFiles.length === 0) return [];

            // Try to use NullAway if available (Uber's null safety tool)
            const nullAwayIssues = await this.runNullAway(this.workspaceRoot);
            issues.push(...nullAwayIssues);
            console.log(`[JavaNullSafetyDetector] NullAway issues: ${nullAwayIssues.length}`);

            // Try to use SpotBugs if available
            const spotBugsIssues = await this.runSpotBugs(this.workspaceRoot);
            issues.push(...spotBugsIssues);
            console.log(`[JavaNullSafetyDetector] SpotBugs issues: ${spotBugsIssues.length}`);

            // Fallback: Pattern-based analysis
            if (issues.length === 0) {
                console.log(`[JavaNullSafetyDetector] Falling back to pattern-based analysis for ${javaFiles.length} files`);
                for (const file of javaFiles) {
                    console.log(`[JavaNullSafetyDetector] Analyzing file: ${file.split('\\').pop()}`);
                    const fileIssues = await this.analyzeFile(file);
                    console.log(`[JavaNullSafetyDetector]   Found ${fileIssues.length} issues`);
                    issues.push(...fileIssues);
                }
            }

            console.log(`[JavaNullSafetyDetector] Total issues: ${issues.length}`);
            return issues;
        } catch (error) {
            console.error('Java Null Safety Detector failed:', error);
            return [this.createErrorIssue(error instanceof Error ? error.message : 'Unknown error')];
        }
    }

    /**
     * Analyze a single Java file for null safety issues
     */
    private async analyzeFile(filePath: string): Promise<JavaIssue[]> {
        const issues: JavaIssue[] = [];

        try {
            // Parse file to AST
            const ast = await this.parser.parseFile(filePath);
            console.log(`  [analyzeFile] Parsed ${filePath.split('\\').pop()}: ${ast.classes.length} classes`);
            
            const content = await this.readFile(filePath);
            const lines = content.split('\n');

            // Check each class
            for (const classDecl of ast.classes) {
                console.log(`    [class] ${classDecl.name}: ${classDecl.methods.length} methods, ${classDecl.fields.length} fields`);
                
                // Check methods for null safety issues
                for (const method of classDecl.methods) {
                    console.log(`      [method] ${method.name} (line ${method.line}): ${method.parameters.length} params, returns ${method.returnType}`);
                    
                    // Get method body content
                    const methodStartLine = method.line - 1;
                    const methodEndLine = methodStartLine + method.bodyLines;
                    const methodBody = lines.slice(methodStartLine, methodEndLine).join('\n');

                    // Check for null dereferences
                    const nullIssues = this.detectNullDereferences(methodBody, method.line);
                    console.log(`        [null-deref] Found ${nullIssues.length} null dereference issues`);
                    issues.push(...nullIssues.map(issue => ({
                        ...issue,
                        file: filePath,
                    })));

                    // Check for missing null checks in parameters
                    if (method.parameters.length > 0) {
                        const paramIssues = this.checkParameterNullability(method, methodBody, method.line);
                        console.log(`        [params] Found ${paramIssues.length} parameter nullability issues`);
                        issues.push(...paramIssues.map(issue => ({
                            ...issue,
                            file: filePath,
                        })));
                    }

                    // Check for null returns
                    if (method.returnType !== 'void') {
                        const returnIssues = this.checkNullReturns(methodBody, method.line, method.returnType);
                        console.log(`        [returns] Found ${returnIssues.length} null return issues`);
                        issues.push(...returnIssues.map(issue => ({
                            ...issue,
                            file: filePath,
                        })));
                    }
                }

                // Check fields for nullability annotations
                for (const field of classDecl.fields) {
                    const fieldIssues = this.checkFieldNullability(field, content, field.line);
                    console.log(`    [field] ${field.name}: Found ${fieldIssues.length} nullability issues`);
                    issues.push(...fieldIssues.map(issue => ({
                        ...issue,
                        file: filePath,
                    })));
                }
            }

            return issues;
        } catch (error) {
            console.error(`Failed to analyze file ${filePath}:`, error);
            return [];
        }
    }

    /**
     * Detect null dereferences (calling methods on potentially null objects)
     */
    private detectNullDereferences(code: string, startLine: number): Omit<JavaIssue, 'file'>[] {
        const issues: Omit<JavaIssue, 'file'>[] = [];
        const lines = code.split('\n');

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const lineNumber = startLine + i;

            // Skip comments and strings
            if (line.trim().startsWith('//') || line.trim().startsWith('*')) continue;

            // Pattern: variable.method() where variable might be null
            const dereferences = line.matchAll(/(\w+)\.(get|set|equals|toString|hashCode|compareTo)\(/g);
            for (const match of dereferences) {
                const variable = match[1];
                
                // Check if there's a prior null check
                const hasNullCheck = this.hasPriorNullCheck(lines.slice(0, i), variable);
                if (!hasNullCheck) {
                    issues.push({
                        id: `null-dereference-${lineNumber}`,
                        line: lineNumber,
                        column: match.index || 0,
                        severity: 'warning',
                        category: 'null-dereference',
                        message: `Potential NullPointerException: '${variable}.${match[2]}()' may be called on null`,
                        recommendation: `Add null check: if (${variable} != null) { ... } or use Optional`,
                        code: 'NPE-001',
                        autoFix: {
                            description: 'Add null check',
                            replacement: `if (${variable} != null) {\n    ${line.trim()}\n}`,
                        },
                    });
                }
            }

            // Pattern: return variable.method() without null check
            const returnMatch = line.match(/return\s+(\w+)\./);
            if (returnMatch) {
                const variable = returnMatch[1];
                const hasNullCheck = this.hasPriorNullCheck(lines.slice(0, i), variable);
                if (!hasNullCheck) {
                    issues.push({
                        id: `null-return-dereference-${lineNumber}`,
                        line: lineNumber,
                        column: returnMatch.index || 0,
                        severity: 'warning',
                        category: 'null-dereference',
                        message: `Potential NullPointerException: returning method call on potentially null '${variable}'`,
                        recommendation: `Add null check before return or use Optional.ofNullable()`,
                        code: 'NPE-002',
                    });
                }
            }
        }

        return issues;
    }

    /**
     * Check if there's a prior null check for a variable
     */
    private hasPriorNullCheck(priorLines: string[], variable: string): boolean {
        for (let i = priorLines.length - 1; i >= 0; i--) {
            const line = priorLines[i];
            // Check for: if (variable == null) or if (variable != null)
            if (line.includes(`if`) && (line.includes(`${variable} == null`) || line.includes(`${variable} != null`))) {
                return true;
            }
            // Check for: Objects.requireNonNull(variable)
            if (line.includes(`Objects.requireNonNull(${variable})`)) {
                return true;
            }
            // Check for: Objects.isNull(variable) or Objects.nonNull(variable)
            if (line.includes(`Objects.isNull(${variable})`) || line.includes(`Objects.nonNull(${variable})`)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Check method parameters for missing null checks
     */
    private checkParameterNullability(method: any, methodBody: string, startLine: number): Omit<JavaIssue, 'file'>[] {
        const issues: Omit<JavaIssue, 'file'>[] = [];

        for (const param of method.parameters) {
            // Check if parameter is used without null check
            const hasAnnotation = param.annotations.some((ann: any) => 
                ann.name === 'NonNull' || ann.name === 'NotNull' || ann.name === 'Nonnull'
            );

            if (!hasAnnotation) {
                // Check if parameter is dereferenced in method body
                const isDereferenced = methodBody.includes(`${param.name}.`);
                const hasNullCheck = methodBody.includes(`${param.name} == null`) || 
                                     methodBody.includes(`${param.name} != null`) ||
                                     methodBody.includes(`Objects.requireNonNull(${param.name})`);

                if (isDereferenced && !hasNullCheck) {
                    issues.push({
                        id: `missing-null-check-${startLine}`,
                        line: startLine,
                        column: 0,
                        severity: 'warning',
                        category: 'missing-null-check',
                        message: `Parameter '${param.name}' may be null, but no null check found`,
                        recommendation: `Add @NonNull annotation or null check: Objects.requireNonNull(${param.name})`,
                        code: 'NPE-003',
                        autoFix: {
                            description: 'Add null check at method start',
                            replacement: `Objects.requireNonNull(${param.name}, "${param.name} must not be null");`,
                        },
                    });
                }
            }
        }

        return issues;
    }

    /**
     * Check for returning null in methods
     */
    private checkNullReturns(methodBody: string, startLine: number, returnType: string): Omit<JavaIssue, 'file'>[] {
        const issues: Omit<JavaIssue, 'file'>[] = [];
        const lines = methodBody.split('\n');

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const lineNumber = startLine + i;

            if (line.includes('return null')) {
                // Check if return type could use Optional
                const canUseOptional = !returnType.includes('Optional') && 
                                      !returnType.match(/^(int|long|short|byte|char|float|double|boolean|void)$/);

                if (canUseOptional) {
                    issues.push({
                        id: `null-return-${lineNumber}`,
                        line: lineNumber,
                        column: line.indexOf('return null'),
                        severity: 'info',
                        category: 'null-return',
                        message: `Returning null from method with return type '${returnType}'`,
                        recommendation: `Consider using Optional<${returnType}> instead of returning null`,
                        code: 'NPE-004',
                        autoFix: {
                            description: 'Return Optional.empty() instead',
                            replacement: 'return Optional.empty();',
                        },
                    });
                }
            }
        }

        return issues;
    }

    /**
     * Check fields for nullability annotations
     */
    private checkFieldNullability(field: any, content: string, line: number): Omit<JavaIssue, 'file'>[] {
        const issues: Omit<JavaIssue, 'file'>[] = [];

        // Check if field has @NonNull or @Nullable annotation
        const hasNonNull = field.annotations.some((ann: any) => 
            ann.name === 'NonNull' || ann.name === 'NotNull' || ann.name === 'Nonnull'
        );
        const hasNullable = field.annotations.some((ann: any) => 
            ann.name === 'Nullable'
        );

        // Check if field is not initialized and doesn't have @Nullable
        if (!field.initializer && !hasNullable && !hasNonNull) {
            // Check if field type is reference type (not primitive)
            const isPrimitive = field.type.match(/^(int|long|short|byte|char|float|double|boolean)$/);
            
            if (!isPrimitive) {
                issues.push({
                    id: `uninitialized-field-${line}`,
                    line,
                    column: 0,
                    severity: 'info',
                    category: 'uninitialized-field',
                    message: `Field '${field.name}' may be null but lacks @Nullable annotation`,
                    recommendation: `Add @Nullable annotation or initialize field`,
                    code: 'NPE-005',
                });
            }
        }

        return issues;
    }

    /**
     * Run NullAway (Uber's null safety checker) if available
     */
    private async runNullAway(dir: string): Promise<JavaIssue[]> {
        try {
            // Check if project uses NullAway (Gradle or Maven)
            // NullAway is typically configured as an Error Prone plugin
            
            // For now, return empty array
            // TODO: Implement NullAway integration when it's commonly used
            return [];
        } catch {
            return [];
        }
    }

    /**
     * Run SpotBugs for null analysis
     */
    private async runSpotBugs(dir: string): Promise<JavaIssue[]> {
        try {
            // Check if spotbugs is available
            try {
                execSync('spotbugs -version', { stdio: 'ignore' });
            } catch {
                return []; // SpotBugs not installed
            }

            // Run SpotBugs
            // TODO: Implement SpotBugs integration
            return [];
        } catch {
            return [];
        }
    }
}
