/**
 * Java Exception Detector
 * Detects poor exception handling practices
 * 
 * Enforces proper exception handling, logging, and resource cleanup
 */

import { BaseJavaDetector, type JavaIssue } from './base-java-detector.js';
import * as path from 'path';

interface ExceptionIssue {
    line: number;
    type: 'empty-catch' | 'generic-exception' | 'swallowed' | 'missing-finally' | 'exception-as-control';
    severity: 'error' | 'warning' | 'info';
    message: string;
    recommendation: string;
    code: string;
}

export class JavaExceptionDetector extends BaseJavaDetector {
    constructor(workspaceRoot: string) {
        super(workspaceRoot, 'java-exception');
    }

    async detect(): Promise<JavaIssue[]> {
        const issues: JavaIssue[] = [];

        try {
            // Check if this is a Java project
            const isJava = await this.isJavaProject(this.workspaceRoot);
            if (!isJava) return [];

            // Find all Java files
            const javaFiles = await this.findJavaFiles(this.workspaceRoot);
            if (javaFiles.length === 0) return [];

            console.log(`[JavaExceptionDetector] Found ${javaFiles.length} Java files`);

            // Analyze each file
            for (const file of javaFiles) {
                const fileIssues = await this.analyzeFile(file);
                issues.push(...fileIssues);
            }

            return issues;
        } catch (error) {
            console.error('[JavaExceptionDetector] Error:', error);
            return [this.createErrorIssue(error instanceof Error ? error.message : 'Unknown error')];
        }
    }

    /**
     * Analyze a single Java file for exception handling issues
     */
    private async analyzeFile(filePath: string): Promise<JavaIssue[]> {
        const issues: JavaIssue[] = [];

        try {
            const content = await this.readFile(filePath);
            const lines = content.split('\n');

            // Detect all exception issues
            const exceptionIssues = [
                ...this.detectEmptyCatch(lines),
                ...this.detectGenericException(lines),
                ...this.detectSwallowedException(lines),
                ...this.detectMissingFinally(lines),
                ...this.detectExceptionAsControl(lines),
            ];

            // Convert to JavaIssue format
            for (const issue of exceptionIssues) {
                const codeSnippet = await this.extractCodeSnippet(filePath, issue.line, 3);

                issues.push({
                    id: `exception-${issue.code}-${issue.line}`,
                    file: path.relative(this.workspaceRoot, filePath),
                    line: issue.line,
                    column: 0,
                    severity: issue.severity,
                    category: 'exception-handling',
                    message: issue.message,
                    recommendation: issue.recommendation,
                    code: issue.code,
                    codeSnippet,
                });
            }

        } catch (error) {
            console.error(`[JavaExceptionDetector] Failed to analyze ${filePath}:`, error);
        }

        return issues;
    }

    /**
     * Detect empty catch blocks
     * Example: try { ... } catch (Exception e) { }
     */
    private detectEmptyCatch(lines: string[]): ExceptionIssue[] {
        const issues: ExceptionIssue[] = [];

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();

            // Match: catch (ExceptionType var) {
            const catchMatch = line.match(/catch\s*\(\s*(\w+)\s+(\w+)\s*\)\s*\{?/);
            if (!catchMatch) continue;

            const exceptionType = catchMatch[1];
            const exceptionVar = catchMatch[2];

            // Check if catch block is empty
            let isEmpty = true;
            let braceCount = line.endsWith('{') ? 1 : 0;

            for (let j = i + 1; j < Math.min(i + 10, lines.length); j++) {
                const nextLine = lines[j].trim();

                // Skip blank lines and comments
                if (!nextLine || nextLine.startsWith('//') || nextLine.startsWith('/*')) continue;

                // Count braces
                braceCount += (nextLine.match(/{/g) || []).length;
                braceCount -= (nextLine.match(/}/g) || []).length;

                // If we find a closing brace at level 0, check if we saw any code
                if (braceCount === 0) {
                    if (nextLine === '}') {
                        // Empty catch block
                        issues.push({
                            line: i + 1,
                            type: 'empty-catch',
                            severity: 'warning',
                            message: `Empty catch block - exceptions should be logged or handled`,
                            recommendation: `Add proper exception handling:\n  catch (${exceptionType} ${exceptionVar}) {\n    logger.error("Error occurred", ${exceptionVar});\n    // or throw new RuntimeException(${exceptionVar});\n  }`,
                            code: 'EXCEPTION-001',
                        });
                    }
                    break;
                }

                // If we find any non-empty statement, it's not empty
                if (nextLine !== '{' && nextLine !== '}') {
                    isEmpty = false;
                    break;
                }
            }
        }

        return issues;
    }

    /**
     * Detect overly generic Exception catching
     * Example: catch (Exception e) instead of specific exception
     */
    private detectGenericException(lines: string[]): ExceptionIssue[] {
        const issues: ExceptionIssue[] = [];

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();

            // Match: catch (Exception e) or catch (Throwable t)
            const genericMatch = line.match(/catch\s*\(\s*(Exception|Throwable)\s+(\w+)\s*\)/);
            if (!genericMatch) continue;

            const genericType = genericMatch[1];
            const exceptionVar = genericMatch[2];

            issues.push({
                line: i + 1,
                type: 'generic-exception',
                severity: 'info',
                message: `Catching ${genericType} is too generic - catch specific exceptions`,
                recommendation: `Catch specific exceptions like IOException, SQLException, etc.\nOnly catch Exception in top-level handlers or when truly necessary.`,
                code: 'EXCEPTION-002',
            });
        }

        return issues;
    }

    /**
     * Detect swallowed exceptions (caught but not logged)
     * Example: catch (Exception e) { return null; }
     */
    private detectSwallowedException(lines: string[]): ExceptionIssue[] {
        const issues: ExceptionIssue[] = [];

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();

            // Match: catch (ExceptionType var) {
            const catchMatch = line.match(/catch\s*\(\s*(\w+)\s+(\w+)\s*\)\s*\{?/);
            if (!catchMatch) continue;

            const exceptionType = catchMatch[1];
            const exceptionVar = catchMatch[2];

            // Look for catch block without logging
            let hasLogging = false;
            let hasReturn = false;
            let braceCount = line.endsWith('{') ? 1 : 0;

            for (let j = i + 1; j < Math.min(i + 10, lines.length); j++) {
                const nextLine = lines[j].trim();

                // Count braces
                braceCount += (nextLine.match(/{/g) || []).length;
                braceCount -= (nextLine.match(/}/g) || []).length;

                // Check for logging
                if (nextLine.includes('log.') || nextLine.includes('logger.') || 
                    nextLine.includes('System.out.print') || nextLine.includes('printStackTrace')) {
                    hasLogging = true;
                }

                // Check for early return/break without logging
                if ((nextLine.includes('return') || nextLine.includes('break')) && !hasLogging) {
                    hasReturn = true;
                }

                // End of catch block
                if (braceCount === 0) break;
            }

            // If we have return but no logging, it's swallowed
            if (hasReturn && !hasLogging) {
                issues.push({
                    line: i + 1,
                    type: 'swallowed',
                    severity: 'warning',
                    message: `Exception is swallowed (caught but not logged)`,
                    recommendation: `Always log exceptions before returning:\n  catch (${exceptionType} ${exceptionVar}) {\n    logger.error("Error occurred", ${exceptionVar});\n    return null; // or throw\n  }`,
                    code: 'EXCEPTION-003',
                });
            }
        }

        return issues;
    }

    /**
     * Detect missing finally blocks for resource cleanup
     * Example: try { stream = ... } catch { } // missing finally
     */
    private detectMissingFinally(lines: string[]): ExceptionIssue[] {
        const issues: ExceptionIssue[] = [];

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();

            // Match: try {
            if (!line.match(/try\s*\{/)) continue;

            // Look for resources that need cleanup
            let hasResource = false;
            let hasFinally = false;
            let tryEnd = -1;

            let braceCount = 1;
            for (let j = i + 1; j < Math.min(i + 30, lines.length); j++) {
                const nextLine = lines[j].trim();

                // Count braces in try block
                braceCount += (nextLine.match(/{/g) || []).length;
                braceCount -= (nextLine.match(/}/g) || []).length;

                // Check for resources needing cleanup
                if (braceCount > 0 && (
                    nextLine.includes('new FileInputStream') ||
                    nextLine.includes('new FileOutputStream') ||
                    nextLine.includes('new BufferedReader') ||
                    nextLine.includes('new Connection') ||
                    nextLine.includes('.getConnection(') ||
                    nextLine.includes('.open(')
                )) {
                    hasResource = true;
                }

                // End of try block
                if (braceCount === 0) {
                    tryEnd = j;
                    break;
                }
            }

            // Check for finally block after try-catch
            if (tryEnd > 0 && hasResource) {
                for (let k = tryEnd; k < Math.min(tryEnd + 10, lines.length); k++) {
                    if (lines[k].trim().startsWith('finally')) {
                        hasFinally = true;
                        break;
                    }
                }

                // If we have resources but no finally, suggest try-with-resources
                if (!hasFinally) {
                    issues.push({
                        line: i + 1,
                        type: 'missing-finally',
                        severity: 'warning',
                        message: `Missing finally block for resource cleanup`,
                        recommendation: `Use try-with-resources (Java 7+):\n  try (ResourceType resource = new ResourceType()) {\n    // use resource\n  } catch (Exception e) {\n    // handle\n  }\nOr add finally block to close resources manually.`,
                        code: 'EXCEPTION-004',
                    });
                }
            }
        }

        return issues;
    }

    /**
     * Detect using exceptions for control flow
     * Example: try { Integer.parseInt(...) } catch { ... }
     */
    private detectExceptionAsControl(lines: string[]): ExceptionIssue[] {
        const issues: ExceptionIssue[] = [];

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();

            // Match: try {
            if (!line.match(/try\s*\{/)) continue;

            // Look for control flow operations that might throw
            let hasControlFlow = false;

            for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
                const nextLine = lines[j].trim();

                // Common control flow patterns
                if (nextLine.includes('Integer.parseInt') ||
                    nextLine.includes('Double.parseDouble') ||
                    nextLine.includes('Boolean.parseBoolean') ||
                    nextLine.includes('.get(') && nextLine.includes('[')) {
                    hasControlFlow = true;
                    break;
                }

                // End of try block
                if (nextLine.includes('}')) break;
            }

            if (hasControlFlow) {
                issues.push({
                    line: i + 1,
                    type: 'exception-as-control',
                    severity: 'info',
                    message: `Avoid using exceptions for control flow`,
                    recommendation: `Use validation instead:\n  // Instead of try-catch around parseInt\n  if (str.matches("\\\\d+")) {\n    int value = Integer.parseInt(str);\n  }\n  // Or use Optional<Integer> parseIntSafe(String)`,
                    code: 'EXCEPTION-005',
                });
            }
        }

        return issues;
    }
}
