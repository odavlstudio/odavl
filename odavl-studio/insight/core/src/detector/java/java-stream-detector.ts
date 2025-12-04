/**
 * Java Stream API Detector
 * Detects imperative for-loops that can be converted to functional Stream API
 * 
 * Promotes modern Java (8+) functional programming patterns
 */

import { BaseJavaDetector, type JavaIssue } from './base-java-detector.js';
import * as path from 'path';

interface LoopPattern {
    line: number;
    type: 'filter' | 'map' | 'collect' | 'forEach' | 'reduce';
    description: string;
    suggestion: string;
    originalCode: string;
    streamCode: string;
}

export class JavaStreamDetector extends BaseJavaDetector {
    constructor(workspaceRoot: string) {
        super(workspaceRoot, 'java-stream');
    }

    async detect(): Promise<JavaIssue[]> {
        const issues: JavaIssue[] = [];

        try {
            // Check if this is a Java project
            const isJava = await this.isJavaProject(this.workspaceRoot);
            if (!isJava) return [];

            // Detect Java version (Streams require Java 8+)
            const javaVersion = await this.detectJavaVersion(this.workspaceRoot);
            const versionNum = javaVersion ? parseInt(javaVersion) : 8;

            if (versionNum < 8) {
                return [this.createInfoIssue('system', 0, 
                    'Stream API requires Java 8+. Current project uses Java ' + javaVersion,
                    'Upgrade to Java 8 or higher to use Stream API')];
            }

            // Find all Java files
            const javaFiles = await this.findJavaFiles(this.workspaceRoot);
            if (javaFiles.length === 0) return [];

            console.log(`[JavaStreamDetector] Found ${javaFiles.length} Java files`);

            // Analyze each file
            for (const file of javaFiles) {
                const fileIssues = await this.analyzeFile(file);
                issues.push(...fileIssues);
            }

            return issues;
        } catch (error) {
            console.error('[JavaStreamDetector] Error:', error);
            return [this.createErrorIssue(error instanceof Error ? error.message : 'Unknown error')];
        }
    }

    /**
     * Analyze a single Java file for stream opportunities
     */
    private async analyzeFile(filePath: string): Promise<JavaIssue[]> {
        const issues: JavaIssue[] = [];

        try {
            const content = await this.readFile(filePath);
            const lines = content.split('\n');

            // Pattern 1: for-each with conditional add (filter + collect)
            const filterCollectPatterns = this.detectFilterCollect(lines);
            for (const pattern of filterCollectPatterns) {
                issues.push({
                    id: `stream-filter-collect-${pattern.line}`,
                    file: path.relative(this.workspaceRoot, filePath),
                    line: pattern.line,
                    column: 0,
                    severity: 'info',
                    category: 'stream-api',
                    message: `For-loop can be converted to Stream API (filter + collect)`,
                    recommendation: pattern.suggestion,
                    code: 'STREAM-001',
                    codeSnippet: pattern.originalCode,
                    autoFix: {
                        description: 'Convert to Stream API',
                        replacement: pattern.streamCode,
                    },
                });
            }

            // Pattern 2: for-each with transformation (map + collect)
            const mapCollectPatterns = this.detectMapCollect(lines);
            for (const pattern of mapCollectPatterns) {
                issues.push({
                    id: `stream-map-collect-${pattern.line}`,
                    file: path.relative(this.workspaceRoot, filePath),
                    line: pattern.line,
                    column: 0,
                    severity: 'info',
                    category: 'stream-api',
                    message: `For-loop can be converted to Stream API (map + collect)`,
                    recommendation: pattern.suggestion,
                    code: 'STREAM-002',
                    codeSnippet: pattern.originalCode,
                    autoFix: {
                        description: 'Convert to Stream API',
                        replacement: pattern.streamCode,
                    },
                });
            }

            // Pattern 3: for-each without return value (forEach)
            const forEachPatterns = this.detectForEach(lines);
            for (const pattern of forEachPatterns) {
                issues.push({
                    id: `stream-foreach-${pattern.line}`,
                    file: path.relative(this.workspaceRoot, filePath),
                    line: pattern.line,
                    column: 0,
                    severity: 'info',
                    category: 'stream-api',
                    message: `For-loop can be converted to Stream API (forEach)`,
                    recommendation: pattern.suggestion,
                    code: 'STREAM-003',
                    codeSnippet: pattern.originalCode,
                    autoFix: {
                        description: 'Convert to Stream API forEach',
                        replacement: pattern.streamCode,
                    },
                });
            }

            // Pattern 4: Accumulation (reduce)
            const reducePatterns = this.detectReduce(lines);
            for (const pattern of reducePatterns) {
                issues.push({
                    id: `stream-reduce-${pattern.line}`,
                    file: path.relative(this.workspaceRoot, filePath),
                    line: pattern.line,
                    column: 0,
                    severity: 'info',
                    category: 'stream-api',
                    message: `For-loop accumulation can be converted to Stream API (reduce)`,
                    recommendation: pattern.suggestion,
                    code: 'STREAM-004',
                    codeSnippet: pattern.originalCode,
                    autoFix: {
                        description: 'Convert to Stream reduce',
                        replacement: pattern.streamCode,
                    },
                });
            }

        } catch (error) {
            console.error(`[JavaStreamDetector] Failed to analyze ${filePath}:`, error);
        }

        return issues;
    }

    /**
     * Detect filter + collect pattern
     * Example: for (User user : users) { if (user.isActive()) { names.add(user.getName()); } }
     */
    private detectFilterCollect(lines: string[]): LoopPattern[] {
        const patterns: LoopPattern[] = [];

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();

            // Match: for (Type var : collection)
            const forMatch = line.match(/for\s*\(\s*(\w+)\s+(\w+)\s*:\s*(\w+)\s*\)\s*\{?/);
            if (!forMatch) continue;

            const type = forMatch[1];
            const variable = forMatch[2];
            const collection = forMatch[3];

            // Look ahead for if condition and add
            let foundPattern = false;
            let ifCondition = '';
            let targetCollection = '';
            let transformation = '';

            for (let j = i + 1; j < Math.min(i + 10, lines.length); j++) {
                const nextLine = lines[j].trim();

                // Match: if (condition)
                const ifMatch = nextLine.match(/if\s*\(\s*(.+?)\s*\)\s*\{?/);
                if (ifMatch) {
                    ifCondition = ifMatch[1];
                }

                // Match: collection.add(expression)
                const addMatch = nextLine.match(/(\w+)\.add\((.+?)\)/);
                if (addMatch && ifCondition) {
                    targetCollection = addMatch[1];
                    transformation = addMatch[2];
                    foundPattern = true;
                    break;
                }
            }

            if (foundPattern) {
                const isTransformation = transformation !== variable;
                const streamCode = isTransformation
                    ? `${targetCollection} = ${collection}.stream()\n    .filter(${variable} -> ${ifCondition})\n    .map(${variable} -> ${transformation})\n    .collect(Collectors.toList());`
                    : `${targetCollection} = ${collection}.stream()\n    .filter(${variable} -> ${ifCondition})\n    .collect(Collectors.toList());`;

                patterns.push({
                    line: i + 1,
                    type: 'filter',
                    description: 'Filter and collect pattern',
                    suggestion: 'Use Stream API filter() and collect()',
                    originalCode: lines.slice(i, Math.min(i + 5, lines.length)).join('\n'),
                    streamCode,
                });
            }
        }

        return patterns;
    }

    /**
     * Detect map + collect pattern
     * Example: for (User user : users) { names.add(user.getName()); }
     */
    private detectMapCollect(lines: string[]): LoopPattern[] {
        const patterns: LoopPattern[] = [];

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();

            // Match: for (Type var : collection)
            const forMatch = line.match(/for\s*\(\s*(\w+)\s+(\w+)\s*:\s*(\w+)\s*\)\s*\{?/);
            if (!forMatch) continue;

            const type = forMatch[1];
            const variable = forMatch[2];
            const collection = forMatch[3];

            // Look ahead for add without if
            for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
                const nextLine = lines[j].trim();

                // Skip if there's an if statement
                if (nextLine.includes('if (')) continue;

                // Match: collection.add(transformation)
                const addMatch = nextLine.match(/(\w+)\.add\((.+?)\)/);
                if (addMatch) {
                    const targetCollection = addMatch[1];
                    const transformation = addMatch[2];

                    // Only suggest if it's a transformation (not just adding the variable itself)
                    if (transformation !== variable) {
                        const streamCode = `${targetCollection} = ${collection}.stream()\n    .map(${variable} -> ${transformation})\n    .collect(Collectors.toList());`;

                        patterns.push({
                            line: i + 1,
                            type: 'map',
                            description: 'Map and collect pattern',
                            suggestion: 'Use Stream API map() and collect()',
                            originalCode: lines.slice(i, Math.min(i + 3, lines.length)).join('\n'),
                            streamCode,
                        });
                    }
                    break;
                }
            }
        }

        return patterns;
    }

    /**
     * Detect forEach pattern
     * Example: for (User user : users) { System.out.println(user); }
     */
    private detectForEach(lines: string[]): LoopPattern[] {
        const patterns: LoopPattern[] = [];

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();

            // Match: for (Type var : collection)
            const forMatch = line.match(/for\s*\(\s*(\w+)\s+(\w+)\s*:\s*(\w+)\s*\)\s*\{?/);
            if (!forMatch) continue;

            const variable = forMatch[2];
            const collection = forMatch[3];

            // Look ahead for single statement (no add/return)
            for (let j = i + 1; j < Math.min(i + 3, lines.length); j++) {
                const nextLine = lines[j].trim();

                // Skip empty lines
                if (!nextLine || nextLine === '{' || nextLine === '}') continue;

                // If it's not an add/return statement, suggest forEach
                if (!nextLine.includes('.add(') && !nextLine.includes('return')) {
                    const streamCode = `${collection}.forEach(${variable} -> ${nextLine.replace(/;$/, '')});`;

                    patterns.push({
                        line: i + 1,
                        type: 'forEach',
                        description: 'Simple iteration pattern',
                        suggestion: 'Use Stream API forEach() for side effects',
                        originalCode: lines.slice(i, Math.min(i + 3, lines.length)).join('\n'),
                        streamCode,
                    });
                    break;
                }
            }
        }

        return patterns;
    }

    /**
     * Detect reduce pattern (accumulation)
     * Example: int sum = 0; for (int n : numbers) { sum += n; }
     */
    private detectReduce(lines: string[]): LoopPattern[] {
        const patterns: LoopPattern[] = [];

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();

            // Match: Type accumulator = initialValue;
            const accMatch = line.match(/(\w+)\s+(\w+)\s*=\s*(.+?);/);
            if (!accMatch) continue;

            const accType = accMatch[1];
            const accumulator = accMatch[2];
            const initialValue = accMatch[3];

            // Look ahead for for-loop with accumulation
            for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
                const nextLine = lines[j].trim();

                // Match: for (Type var : collection)
                const forMatch = nextLine.match(/for\s*\(\s*\w+\s+(\w+)\s*:\s*(\w+)\s*\)\s*\{?/);
                if (!forMatch) continue;

                const variable = forMatch[1];
                const collection = forMatch[2];

                // Look for accumulation statement
                for (let k = j + 1; k < Math.min(j + 3, lines.length); k++) {
                    const accLine = lines[k].trim();

                    // Match: accumulator += variable or accumulator = accumulator + variable
                    if (accLine.includes(`${accumulator} +=`) || accLine.includes(`${accumulator} = ${accumulator} +`)) {
                        const streamCode = `${accType} ${accumulator} = ${collection}.stream()\n    .reduce(${initialValue}, (acc, ${variable}) -> acc + ${variable});`;

                        patterns.push({
                            line: i + 1,
                            type: 'reduce',
                            description: 'Accumulation pattern',
                            suggestion: 'Use Stream API reduce() for accumulation',
                            originalCode: lines.slice(i, Math.min(k + 1, lines.length)).join('\n'),
                            streamCode,
                        });
                        break;
                    }
                }
            }
        }

        return patterns;
    }
}
