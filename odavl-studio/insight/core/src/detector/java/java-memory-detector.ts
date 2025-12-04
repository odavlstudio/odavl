/**
 * Java Memory Detector
 * Detects memory-related issues and resource leaks
 * 
 * Focuses on proper resource management and memory-efficient patterns
 * Enhanced with Lombok detection to prevent false positives
 */

import { BaseJavaDetector, type JavaIssue } from './base-java-detector.js';
import { MavenParser } from '../maven-parser.js';
import { GradleParser } from '../gradle-parser.js';
import * as path from 'path';

interface MemoryIssue {
    line: number;
    type: 'resource-leak' | 'string-concat' | 'large-collection' | 'inefficient-boxing' | 'static-collection';
    severity: 'error' | 'warning' | 'info';
    message: string;
    recommendation: string;
    code: string;
}

export class JavaMemoryDetector extends BaseJavaDetector {
    private mavenParser: MavenParser;
    private gradleParser: GradleParser;
    private hasLombok: boolean = false;

    constructor(workspaceRoot: string) {
        super(workspaceRoot, 'java-memory');
        this.mavenParser = new MavenParser();
        this.gradleParser = new GradleParser();
    }

    async detect(): Promise<JavaIssue[]> {
        const issues: JavaIssue[] = [];

        try {
            // Check if this is a Java project
            const isJava = await this.isJavaProject(this.workspaceRoot);
            if (!isJava) return [];

            // Detect Lombok to prevent false positives
            this.hasLombok = await this.detectLombok(this.workspaceRoot);
            if (this.hasLombok) {
                console.log('[JavaMemoryDetector] Lombok detected - skipping getter/setter checks');
            }

            // Find all Java files
            const javaFiles = await this.findJavaFiles(this.workspaceRoot);
            if (javaFiles.length === 0) return [];

            console.log(`[JavaMemoryDetector] Found ${javaFiles.length} Java files`);

            // Analyze each file
            for (const file of javaFiles) {
                const fileIssues = await this.analyzeFile(file);
                issues.push(...fileIssues);
            }

            return issues;
        } catch (error) {
            console.error('[JavaMemoryDetector] Error:', error);
            return [this.createErrorIssue(error instanceof Error ? error.message : 'Unknown error')];
        }
    }

    /**
     * Analyze a single Java file for memory issues
     */
    private async analyzeFile(filePath: string): Promise<JavaIssue[]> {
        const issues: JavaIssue[] = [];

        try {
            const content = await this.readFile(filePath);
            const lines = content.split('\n');

            // Detect all memory issues
            const memoryIssues = [
                ...this.detectResourceLeaks(lines),
                ...this.detectStringConcatInLoops(lines),
                ...this.detectLargeCollections(lines),
                ...this.detectInefficientBoxing(lines),
                ...this.detectStaticCollections(lines),
            ];

            // Convert to JavaIssue format
            for (const issue of memoryIssues) {
                const codeSnippet = await this.extractCodeSnippet(filePath, issue.line, 3);

                issues.push({
                    id: `memory-${issue.code}-${issue.line}`,
                    file: path.relative(this.workspaceRoot, filePath),
                    line: issue.line,
                    column: 0,
                    severity: issue.severity,
                    category: 'memory',
                    message: issue.message,
                    recommendation: issue.recommendation,
                    code: issue.code,
                    codeSnippet,
                });
            }

        } catch (error) {
            console.error(`[JavaMemoryDetector] Failed to analyze ${filePath}:`, error);
        }

        return issues;
    }

    /**
     * Detect resource leaks (unclosed streams, connections, readers)
     */
    private detectResourceLeaks(lines: string[]): MemoryIssue[] {
        const issues: MemoryIssue[] = [];
        const resourceTypes = [
            'FileInputStream', 'FileOutputStream', 'FileReader', 'FileWriter',
            'BufferedReader', 'BufferedWriter', 'Scanner',
            'Connection', 'Statement', 'PreparedStatement', 'ResultSet',
            'InputStream', 'OutputStream', 'Socket', 'ServerSocket'
        ];

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();

            // Skip try-with-resources (safe)
            if (line.includes('try (')) continue;

            // Check for resource allocation
            for (const resourceType of resourceTypes) {
                if (line.includes(`new ${resourceType}`)) {
                    // Check if variable is assigned
                    const varMatch = line.match(/(\w+)\s*=\s*new/);
                    if (!varMatch) continue;

                    const varName = varMatch[1];

                    // Look ahead for close() call
                    let hasTryWithResources = false;
                    let hasCloseCall = false;
                    let hasFinallyBlock = false;

                    // Check previous line for try-with-resources
                    if (i > 0 && lines[i - 1].trim().includes('try (')) {
                        hasTryWithResources = true;
                    }

                    // Look ahead for close() or finally block
                    for (let j = i + 1; j < Math.min(i + 20, lines.length); j++) {
                        const nextLine = lines[j].trim();

                        if (nextLine.includes(`${varName}.close()`)) {
                            hasCloseCall = true;
                        }

                        if (nextLine.startsWith('finally')) {
                            hasFinallyBlock = true;
                        }

                        // End of method
                        if (nextLine.match(/^}\s*$/)) break;
                    }

                    // Report if no proper cleanup
                    if (!hasTryWithResources && !hasCloseCall && !hasFinallyBlock) {
                        issues.push({
                            line: i + 1,
                            type: 'resource-leak',
                            severity: 'warning',
                            message: `Potential resource leak: ${resourceType} may not be closed`,
                            recommendation: `Use try-with-resources:\ntry (${resourceType} ${varName} = new ${resourceType}(...)) {\n    // use resource\n} // auto-closed`,
                            code: 'MEMORY-001',
                        });
                    }
                }
            }
        }

        return issues;
    }

    /**
     * Detect String concatenation in loops (should use StringBuilder)
     */
    private detectStringConcatInLoops(lines: string[]): MemoryIssue[] {
        const issues: MemoryIssue[] = [];

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();

            // Match: for/while loop
            if (!line.match(/^(for|while)\s*\(/)) continue;

            // Look inside loop for String concatenation
            let braceCount = line.endsWith('{') ? 1 : 0;
            let foundStringConcat = false;
            let stringVar = '';

            for (let j = i + 1; j < Math.min(i + 30, lines.length); j++) {
                const nextLine = lines[j].trim();

                // Count braces
                braceCount += (nextLine.match(/{/g) || []).length;
                braceCount -= (nextLine.match(/}/g) || []).length;

                // Check for String += pattern
                const concatMatch = nextLine.match(/(\w+)\s*\+=\s*.+/);
                if (concatMatch) {
                    stringVar = concatMatch[1];
                    
                    // Verify it's a String variable (check for String type or "" initialization)
                    let isString = false;
                    for (let k = i; k >= Math.max(0, i - 10); k--) {
                        const prevLine = lines[k].trim();
                        if (prevLine.includes(`String ${stringVar}`) || 
                            prevLine.includes(`${stringVar} = ""`)) {
                            isString = true;
                            break;
                        }
                    }

                    if (isString) {
                        foundStringConcat = true;
                        issues.push({
                            line: j + 1,
                            type: 'string-concat',
                            severity: 'warning',
                            message: `String concatenation in loop creates many temporary objects`,
                            recommendation: `Use StringBuilder:\nStringBuilder ${stringVar} = new StringBuilder();\n// In loop:\n${stringVar}.append(...);\n// After loop:\nString result = ${stringVar}.toString();`,
                            code: 'MEMORY-002',
                        });
                        break;
                    }
                }

                // End of loop
                if (braceCount === 0) break;
            }
        }

        return issues;
    }

    /**
     * Detect large collection allocations without size hints
     */
    private detectLargeCollections(lines: string[]): MemoryIssue[] {
        const issues: MemoryIssue[] = [];

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();

            // Match: new ArrayList(), new HashMap(), etc. without size
            const noSizeMatch = line.match(/new\s+(ArrayList|HashMap|HashSet|LinkedList|Vector)<.*>\(\s*\)/);
            if (!noSizeMatch) continue;

            const collectionType = noSizeMatch[1];

            // Check if followed by many add() calls
            let addCount = 0;
            for (let j = i + 1; j < Math.min(i + 15, lines.length); j++) {
                if (lines[j].includes('.add(') || lines[j].includes('.put(')) {
                    addCount++;
                }
            }

            // If 5+ adds, suggest initial capacity
            if (addCount >= 5) {
                issues.push({
                    line: i + 1,
                    type: 'large-collection',
                    severity: 'info',
                    message: `${collectionType} created without initial capacity (${addCount}+ elements)`,
                    recommendation: `Specify initial capacity to avoid resizing:\nnew ${collectionType}<>(${addCount * 2}) // or estimated size`,
                    code: 'MEMORY-003',
                });
            }
        }

        return issues;
    }

    /**
     * Detect inefficient autoboxing (Integer.valueOf in loops)
     */
    private detectInefficientBoxing(lines: string[]): MemoryIssue[] {
        const issues: MemoryIssue[] = [];

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();

            // Match: for/while loop
            if (!line.match(/^(for|while)\s*\(/)) continue;

            // Look for boxing operations in loop
            let braceCount = line.endsWith('{') ? 1 : 0;

            for (let j = i + 1; j < Math.min(i + 20, lines.length); j++) {
                const nextLine = lines[j].trim();

                // Count braces
                braceCount += (nextLine.match(/{/g) || []).length;
                braceCount -= (nextLine.match(/}/g) || []).length;

                // Check for boxing (Integer.valueOf, new Integer, etc.)
                if (nextLine.match(/Integer\.valueOf|Long\.valueOf|Double\.valueOf|new\s+(Integer|Long|Double)\(/)) {
                    issues.push({
                        line: j + 1,
                        type: 'inefficient-boxing',
                        severity: 'info',
                        message: `Autoboxing in loop creates unnecessary objects`,
                        recommendation: `Use primitive types (int, long, double) in performance-critical loops`,
                        code: 'MEMORY-004',
                    });
                    break;
                }

                // End of loop
                if (braceCount === 0) break;
            }
        }

        return issues;
    }

    /**
     * Detect static collections that grow unbounded
     */
    private detectStaticCollections(lines: string[]): MemoryIssue[] {
        const issues: MemoryIssue[] = [];

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();

            // Match: static collection field
            const staticCollMatch = line.match(/static\s+.*?(List|Set|Map|Collection)<.*?>\s+(\w+)\s*=/);
            if (!staticCollMatch) continue;

            const collectionType = staticCollMatch[1];
            const varName = staticCollMatch[2];

            // Check if it's a cache pattern (common and acceptable)
            if (varName.toLowerCase().includes('cache') || 
                varName.toLowerCase().includes('pool') ||
                line.includes('Collections.synchronizedMap')) {
                continue;
            }

            issues.push({
                line: i + 1,
                type: 'static-collection',
                severity: 'warning',
                message: `Static ${collectionType} '${varName}' may grow unbounded and cause memory leak`,
                recommendation: `Consider:\n1. Use WeakHashMap for caches\n2. Implement size limit (LRU eviction)\n3. Use proper cache library (Guava Cache, Caffeine)\n4. Make non-static if possible`,
                code: 'MEMORY-005',
            });
        }

        return issues;
    }

    /**
     * Detect Lombok from build metadata
     * Prevents false positives for generated getters/setters
     */
    private async detectLombok(dir: string): Promise<boolean> {
        try {
            // Try Maven
            const isMaven = await this.mavenParser.isMavenProject(dir);
            if (isMaven) {
                const pomPath = path.join(dir, 'pom.xml');
                const project = await this.mavenParser.parsePom(pomPath);
                
                if (project) {
                    const plugins = this.mavenParser.detectPlugins(project);
                    if (plugins.includes('Lombok')) {
                        console.log('[JavaMemoryDetector] Maven: Lombok detected');
                        return true;
                    }
                }
            }

            // Try Gradle
            const isGradle = await this.gradleParser.isGradleProject(dir);
            if (isGradle) {
                const groovyBuild = path.join(dir, 'build.gradle');
                const kotlinBuild = path.join(dir, 'build.gradle.kts');
                
                let project = await this.gradleParser.parseGradleBuild(groovyBuild);
                if (!project) {
                    project = await this.gradleParser.parseGradleBuild(kotlinBuild);
                }
                
                if (project) {
                    const plugins = this.gradleParser.detectPlugins(project);
                    if (plugins.includes('Lombok')) {
                        console.log('[JavaMemoryDetector] Gradle: Lombok detected');
                        return true;
                    }
                }
            }

            return false;
        } catch (error) {
            console.error('[JavaMemoryDetector] Lombok detection failed:', error);
            return false;
        }
    }
}
