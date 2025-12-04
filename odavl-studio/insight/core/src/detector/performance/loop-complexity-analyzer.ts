/**
 * Loop Complexity Analyzer - ODAVL Insight
 * Detects inefficient loop patterns and O(n²) complexity issues
 */

import { PerformanceErrorType } from '../performance-detector';
import { filterFalsePositives, type CodeContext } from '../false-positive-filters';

export interface LoopComplexityIssue {
    file: string;
    line: number;
    type: PerformanceErrorType;
    severity: 'critical' | 'high' | 'medium' | 'low';
    message: string;
    pattern: string;
    suggestedFix: string;
    details?: string;
    metrics?: {
        size?: number;
        threshold?: number;
        complexity?: number;
    };
}

export class LoopComplexityAnalyzer {
    private readonly workspaceRoot: string;

    constructor(workspaceRoot: string) {
        this.workspaceRoot = workspaceRoot;
    }

    /**
     * Detect inefficient loop patterns and complexity issues
     */
    detect(file: string, content: string): LoopComplexityIssue[] {
        const issues: LoopComplexityIssue[] = [];
        const lines = content.split('\n');
        
        let loopDepth = 0;
        let inPromiseAll = false;
        const loopVariables: { variable: string; array: string }[] = [];

        // Pre-scan for batch operations
        const isBatchOperation = content.includes('createMany') || 
                               content.includes('insertMany') || 
                               content.includes('bulkCreate') ||
                               content.includes('bulkWrite');

        for (let index = 0; index < lines.length; index++) {
            const line = lines[index];
            const lineNum = index + 1;

            // Track Promise.all context (parallel execution, NOT sequential)
            if (/Promise\.all\s*\(/.test(line) || /await\s+Promise\.all\s*\(/.test(line)) {
                inPromiseAll = true;
            }

            // Track loop nesting depth
            const forMatch = /\bfor\s*\((?:let|const|var)\s+(\w+)(?:\s+of\s+(\w+))?/g.exec(line);
            if (forMatch && !inPromiseAll) {
                loopDepth++;
                const variable = forMatch[1];
                const array = forMatch[2] || '';
                loopVariables.push({ variable, array });

                // Detect nested loops (O(n²) or O(n*m))
                if (loopDepth >= 2) {
                    const nestedLoopIssue = this.analyzeNestedLoop(
                        file, 
                        content, 
                        line, 
                        lineNum, 
                        loopDepth, 
                        loopVariables,
                        isBatchOperation
                    );
                    if (nestedLoopIssue) issues.push(nestedLoopIssue);
                }
            }

            // Decrease depth when closing braces found
            if (line.includes('}')) {
                const braceCount = (line.match(/}/g) || []).length;
                loopDepth = Math.max(0, loopDepth - braceCount);
                for (let i = 0; i < braceCount; i++) {
                    loopVariables.pop();
                }
            }

            // Reset Promise.all flag
            if (inPromiseAll && line.includes(');')) {
                inPromiseAll = false;
            }

            // Detect large array allocations
            if (loopDepth > 0) {
                const largeArrayIssue = this.detectLargeArrayAllocation(file, line, lineNum);
                if (largeArrayIssue) issues.push(largeArrayIssue);

                // Detect DOM access in loop
                const domAccessIssue = this.detectDOMAccessInLoop(file, line, lineNum);
                if (domAccessIssue) issues.push(domAccessIssue);
            }
        }

        return issues;
    }

    /**
     * Analyze nested loop complexity
     */
    private analyzeNestedLoop(
        file: string,
        content: string,
        line: string,
        lineNum: number,
        loopDepth: number,
        loopVariables: { variable: string; array: string }[],
        isBatchOperation: boolean
    ): LoopComplexityIssue | null {
        const outerArray = loopVariables[0]?.array || '';
        const innerArray = loopVariables[loopVariables.length - 1]?.array || '';

        // Check if loops iterate over SAME array (true O(n²)) or DIFFERENT arrays (O(n*m))
        const isSameArray = outerArray && innerArray && (
            outerArray === innerArray || 
            outerArray.replace(/s$/, '') === innerArray.replace(/s$/, '') // users vs user
        );

        // Skip if building array for batch operation (optimized pattern)
        if (isBatchOperation && (content.includes('.push(') || content.includes('data.push('))) {
            return null;
        }

        // Apply false-positive filters
        const filterContext: CodeContext = {
            file,
            content,
            line: lineNum,
            pattern: line.trim(),
        };
        const filterResult = filterFalsePositives(filterContext, 'NESTED_LOOP');
        if (filterResult.isFalsePositive) {
            return null;
        }

        // Calculate severity
        let severity: 'critical' | 'high' | 'medium' | 'low' = isSameArray ? 'critical' : (loopDepth === 3 ? 'high' : 'medium');
        if (filterResult.adjustedSeverity) {
            severity = filterResult.adjustedSeverity;
        }

        const complexityLabel = isSameArray ? 'O(n²)' : 'O(n*m)';

        // Triple nested loops (O(n³))
        if (loopDepth >= 3) {
            return {
                file,
                line: lineNum,
                type: PerformanceErrorType.INEFFICIENT_LOOP,
                severity,
                message: `Triple nested loop (${complexityLabel} complexity)`,
                pattern: line.trim(),
                suggestedFix: isSameArray ? 
                    'Refactor to reduce nesting, use Map/Set for O(1) lookups' :
                    'Consider batch operations, joins, or database-level optimization',
                details: isSameArray ? 
                    'Cubic time complexity on SAME array - extremely slow for large datasets' :
                    'Nested loops on DIFFERENT arrays - O(n*m*p) complexity',
                metrics: { complexity: 3 },
            };
        }
        
        // Double nested loops (O(n²))
        if (loopDepth === 2) {
            return {
                file,
                line: lineNum,
                type: PerformanceErrorType.NESTED_LOOP_O_N_SQUARED,
                severity,
                message: `Nested loop detected (${complexityLabel} complexity)`,
                pattern: line.trim(),
                suggestedFix: isSameArray ?
                    'Use Map/Set for O(1) lookups instead of nested iteration' :
                    'Different arrays - consider if optimization needed based on data size',
                details: isSameArray ?
                    'Quadratic time complexity on SAME array - performance degrades rapidly with scale' :
                    'Loops over DIFFERENT arrays - O(n*m) complexity (may be acceptable for small m)',
                metrics: { complexity: 2 },
            };
        }

        return null;
    }

    /**
     * Detect large array allocations (memory concerns)
     */
    private detectLargeArrayAllocation(
        file: string,
        line: string,
        lineNum: number
    ): LoopComplexityIssue | null {
        const largeArrayMatch = /(?:new\s+Array|Array)\s*\(\s*(\d+)\s*\)/.exec(line);
        if (!largeArrayMatch) return null;

        const size = Number.parseInt(largeArrayMatch[1], 10);
        
        // Only flag arrays >= 50k elements (reduced false positives)
        if (size < 50000) return null;

        let severity: 'critical' | 'high' | 'medium' = 'medium';
        if (size >= 100000) severity = 'critical';
        else if (size >= 75000) severity = 'high';

        const memoryKB = Math.round((size * 8) / 1024); // Assuming 8 bytes/element

        return {
            file,
            line: lineNum,
            type: PerformanceErrorType.INEFFICIENT_LOOP,
            severity,
            message: `Large array allocation (${size.toLocaleString()} elements)`,
            pattern: line.trim(),
            suggestedFix: 'Use iterators, generators, or stream processing for large datasets',
            details: `Memory allocation: ~${memoryKB}KB. Consider lazy evaluation or chunking.`,
            metrics: { size, threshold: 50000 },
        };
    }

    /**
     * Detect DOM access inside loops (expensive operations)
     */
    private detectDOMAccessInLoop(
        file: string,
        line: string,
        lineNum: number
    ): LoopComplexityIssue | null {
        // Check for DOM query methods
        if (!/document\.(getElementById|querySelector|querySelectorAll|getElementsBy)/.test(line)) {
            return null;
        }

        return {
            file,
            line: lineNum,
            type: PerformanceErrorType.LOOP_WITH_DOM_ACCESS,
            severity: 'high',
            message: 'DOM query inside loop body',
            pattern: line.trim(),
            suggestedFix: 'Cache DOM references outside loop: const element = document.getElementById(...)',
            details: 'Each DOM query triggers style recalculation and layout thrashing. Cache references.',
        };
    }

    /**
     * Detect N+1 query patterns (database access in loops)
     */
    detectNPlusOneQueries(file: string, content: string): LoopComplexityIssue[] {
        const issues: LoopComplexityIssue[] = [];
        const lines = content.split('\n');
        let inLoop = false;

        for (let index = 0; index < lines.length; index++) {
            const line = lines[index];
            const lineNum = index + 1;

            // Track loop entry
            if (/\b(for|while|forEach|map)\b/.test(line)) {
                inLoop = true;
            }

            // Track loop exit
            if (line.includes('}')) {
                inLoop = false;
            }

            // Detect database queries in loop
            if (inLoop) {
                const queryPatterns = [
                    /await\s+\w+\.(find|findOne|findById|query|execute)\(/,
                    /\.(find|findOne|findById|query|execute)\([^)]*\)\.then\(/,
                    /await\s+fetch\(/,
                    /await\s+axios\./,
                ];

                for (const pattern of queryPatterns) {
                    if (pattern.test(line)) {
                        // Check if it's in Promise.all (which is optimized)
                        const contextLines = lines.slice(Math.max(0, index - 3), index + 1).join('\n');
                        if (contextLines.includes('Promise.all')) {
                            continue; // Parallel execution is fine
                        }

                        issues.push({
                            file,
                            line: lineNum,
                            type: PerformanceErrorType.N_PLUS_ONE_QUERY,
                            severity: 'critical',
                            message: 'N+1 query pattern detected',
                            pattern: line.trim(),
                            suggestedFix: 'Use batch query with IN clause or Promise.all for parallel execution',
                            details: 'Making database queries in loop causes N+1 problem. Load all data upfront.',
                        });
                        break;
                    }
                }
            }
        }

        return issues;
    }
}
