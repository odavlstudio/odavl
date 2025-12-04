/**
 * ComplexityDetector - Code Quality Metrics Detection
 * 
 * Phase 5: Detects code complexity issues including:
 * - Cognitive complexity (nested logic, readability impact)
 * - Cyclomatic complexity (decision points, testability)
 * - Function length analysis (maintainability)
 * - Nesting depth warnings (readability)
 * - Code duplication detection (DRY principle)
 * 
 * Target Coverage: 40% → 85%
 */

import { filterFalsePositives, type CodeContext } from './false-positive-filters';

export enum ComplexityErrorType {
    HIGH_COGNITIVE_COMPLEXITY = 'HIGH_COGNITIVE_COMPLEXITY',
    HIGH_CYCLOMATIC_COMPLEXITY = 'HIGH_CYCLOMATIC_COMPLEXITY',
    EXCESSIVE_FUNCTION_LENGTH = 'EXCESSIVE_FUNCTION_LENGTH',
    EXCESSIVE_NESTING_DEPTH = 'EXCESSIVE_NESTING_DEPTH',
    CODE_DUPLICATION = 'CODE_DUPLICATION',
}

export interface ComplexityError {
    file: string;
    line: number;
    type: ComplexityErrorType;
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    pattern: string;
    suggestedFix: string;
    details?: string;
    metrics?: {
        complexity?: number;
        length?: number;
        nestingDepth?: number;
        duplicateLines?: number;
        threshold?: number;
    };
}

export interface ComplexityStatistics {
    totalErrors: number;
    bySeverity: Record<string, number>;
    byType: Record<string, number>;
    averageComplexity: number;
    averageFunctionLength: number;
    maxNestingDepth: number;
    duplicationPercentage: number;
}

export class ComplexityDetector {
    private errors: ComplexityError[] = [];
    private processedFiles = 0;
    private totalLines = 0;

    /**
     * Main detection entry point
     */
    async detect(directory: string): Promise<ComplexityError[]> {
        const fs = await import('fs');
        const path = await import('path');

        this.errors = [];
        this.processedFiles = 0;
        this.totalLines = 0;

        const scanDir = (dir: string) => {
            if (!fs.existsSync(dir)) return;

            const entries = fs.readdirSync(dir, { withFileTypes: true });

            for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);

                // Skip node_modules, dist, .git, etc.
                if (
                    entry.name === 'node_modules' ||
                    entry.name === 'dist' ||
                    entry.name === 'dist-test' ||
                    entry.name === '.git' ||
                    entry.name === 'coverage' ||
                    entry.name === '.next' ||
                    entry.name === 'out'
                ) {
                    continue;
                }

                if (entry.isDirectory()) {
                    scanDir(fullPath);
                } else if (this.shouldAnalyze(entry.name)) {
                    const content = fs.readFileSync(fullPath, 'utf-8');
                    this.analyzeFile(fullPath, content);
                    this.processedFiles++;
                }
            }
        };

        scanDir(directory);
        return this.errors;
    }

    /**
     * Check if file should be analyzed
     */
    private shouldAnalyze(filename: string): boolean {
        // Analyze TypeScript and JavaScript files
        const extensions = ['.ts', '.tsx', '.js', '.jsx'];

        // Exclude test files for complexity analysis
        if (filename.includes('.test.') || filename.includes('.spec.')) {
            return false;
        }

        return extensions.some(ext => filename.endsWith(ext));
    }

    /**
     * Analyze a single file for complexity issues
     */
    private analyzeFile(file: string, content: string): void {
        const lines = content.split('\n');
        this.totalLines += lines.length;

        // Run all complexity detections
        this.detectCognitiveComplexity(file, content);
        this.detectCyclomaticComplexity(file, content);
        this.detectExcessiveFunctionLength(file, content);
        this.detectExcessiveNesting(file, content);
        this.detectCodeDuplication(file, content);
    }

    /**
     * 1. Cognitive Complexity Detection
     * 
     * Measures how difficult code is to understand:
     * - Nested structures increase complexity non-linearly
     * - Breaks in linear flow (if/else/loops) increase complexity
     * - Logical operators (&&, ||) in conditions increase complexity
     * 
     * Thresholds:
     * - >20: Medium (harder to understand) - increased from 15
     * - >30: High (refactoring recommended) - increased from 25
     * - >50: Critical (urgent refactoring needed) - increased from 40
     */
    private detectCognitiveComplexity(file: string, content: string): void {
        const lines = content.split('\n');
        let inFunction = false;
        let functionName = '';
        let functionStartLine = 0;
        let braceDepth = 0;
        let functionBraceDepth = 0;
        let cognitiveScore = 0;
        let nestingLevel = 0;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const trimmed = line.trim();

            // Skip comments and empty lines
            if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed === '') {
                continue;
            }

            // Track brace depth
            const openBraces = (line.match(/\{/g) || []).length;
            const closeBraces = (line.match(/\}/g) || []).length;
            braceDepth += openBraces - closeBraces;

            // Detect function start (simplified to avoid ESLint complexity warning)
            let isFunctionStart = false;
            let funcName = 'anonymous';

            // Check for traditional function declarations
            if (/function\s+(\w+)/.test(line)) {
                isFunctionStart = true;
                const match = line.match(/function\s+(\w+)/);
                funcName = match?.[1] || 'anonymous';
            }
            // Check for async function declarations
            else if (/async\s+function\s+(\w+)/.test(line)) {
                isFunctionStart = true;
                const match = line.match(/async\s+function\s+(\w+)/);
                funcName = match?.[1] || 'anonymous';
            }
            // Check for arrow functions: const name = () => or const name = (params) =>
            else if (/const\s+(\w+)\s*=\s*(?:async\s+)?\([^)]*\)\s*=>/.test(line)) {
                isFunctionStart = true;
                const match = line.match(/const\s+(\w+)\s*=/);
                funcName = match?.[1] || 'anonymous';
            }
            // Check for function expressions: name = function() or name: function()
            else if (/(\w+)\s*[:=]\s*(?:async\s+)?function/.test(line)) {
                isFunctionStart = true;
                const match = line.match(/(\w+)\s*[:=]/);
                funcName = match?.[1] || 'anonymous';
            }

            if (isFunctionStart) {
                inFunction = true;
                functionName = funcName;
                functionStartLine = i + 1;
                functionBraceDepth = braceDepth;
                cognitiveScore = 0;
                nestingLevel = 0;
            }

            if (inFunction) {
                // Calculate cognitive complexity based on nesting and control flow

                // if/else statements (+1 + nesting level)
                if (/\bif\s*\(/.test(trimmed)) {
                    cognitiveScore += 1 + nestingLevel;
                    nestingLevel++;
                } else if (/\belse\b/.test(trimmed)) {
                    cognitiveScore += 1;
                }

                // Loops (+1 + nesting level)
                if (/\b(for|while|do)\s*\(/.test(trimmed) || /\.(forEach|map|filter|reduce)\s*\(/.test(trimmed)) {
                    cognitiveScore += 1 + nestingLevel;
                    nestingLevel++;
                }

                // Switch cases (+1 per case, +nesting for nested switches)
                if (/\bswitch\s*\(/.test(trimmed)) {
                    cognitiveScore += 1 + nestingLevel;
                    nestingLevel++;
                }
                if (/\bcase\b/.test(trimmed)) {
                    cognitiveScore += 1;
                }

                // Logical operators in conditions (+1 per operator)
                const logicalOps = (trimmed.match(/&&|\|\|/g) || []).length;
                cognitiveScore += logicalOps;

                // Recursion (+1)
                if (functionName && new RegExp(`\\b${functionName}\\s*\\(`).test(trimmed)) {
                    cognitiveScore += 1;
                }

                // Ternary operators (+1 + nesting)
                if (/\?.*:/.test(trimmed)) {
                    cognitiveScore += 1 + nestingLevel;
                }

                // Track nesting decrease
                if (closeBraces > 0 && nestingLevel > 0) {
                    nestingLevel = Math.max(0, nestingLevel - closeBraces);
                }

                // Function end detection
                if (braceDepth <= functionBraceDepth && closeBraces > 0 && i > functionStartLine) {
                    // Report if complexity is high
                    if (cognitiveScore > 20) { // Increased from 15 to reduce noise
                        const severity = cognitiveScore > 50 ? 'critical' : cognitiveScore > 30 ? 'high' : 'medium';

                        this.errors.push({
                            file,
                            line: functionStartLine,
                            type: ComplexityErrorType.HIGH_COGNITIVE_COMPLEXITY,
                            severity,
                            message: `Function '${functionName}' has high cognitive complexity (${cognitiveScore})`,
                            pattern: lines[functionStartLine - 1].trim(),
                            suggestedFix: 'Break down into smaller functions, reduce nesting, extract complex conditions',
                            details: `Cognitive complexity: ${cognitiveScore} (threshold: 20)`,
                            metrics: { complexity: cognitiveScore, threshold: 20 },
                        });
                    }

                    inFunction = false;
                }
            }
        }
    }

    /**
     * 2. Cyclomatic Complexity Detection
     * 
     * Measures the number of linearly independent paths through code:
     * - Each decision point (if, while, for, case, &&, ||) adds 1
     * - Higher complexity = harder to test
     * 
     * Thresholds:
     * - >10: Medium (consider refactoring)
     * - >15: High (hard to test)
     * - >20: Critical (very hard to test)
     */
    private detectCyclomaticComplexity(file: string, content: string): void {
        const lines = content.split('\n');
        let inFunction = false;
        let functionName = '';
        let functionStartLine = 0;
        let braceDepth = 0;
        let functionBraceDepth = 0;
        let cyclomaticScore = 1; // Base complexity is 1

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const trimmed = line.trim();

            // Skip comments
            if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed === '') {
                continue;
            }

            // Track brace depth
            const openBraces = (line.match(/\{/g) || []).length;
            const closeBraces = (line.match(/\}/g) || []).length;
            braceDepth += openBraces - closeBraces;

            // Detect function start (simplified to avoid ESLint complexity warning)
            let isFunctionStart = false;
            let funcName = 'anonymous';

            // Check for traditional function declarations
            if (/function\s+(\w+)/.test(line)) {
                isFunctionStart = true;
                const match = line.match(/function\s+(\w+)/);
                funcName = match?.[1] || 'anonymous';
            }
            // Check for async function declarations
            else if (/async\s+function\s+(\w+)/.test(line)) {
                isFunctionStart = true;
                const match = line.match(/async\s+function\s+(\w+)/);
                funcName = match?.[1] || 'anonymous';
            }
            // Check for arrow functions: const name = () => or const name = (params) =>
            else if (/const\s+(\w+)\s*=\s*(?:async\s+)?\([^)]*\)\s*=>/.test(line)) {
                isFunctionStart = true;
                const match = line.match(/const\s+(\w+)\s*=/);
                funcName = match?.[1] || 'anonymous';
            }
            // Check for function expressions: name = function() or name: function()
            else if (/(\w+)\s*[:=]\s*(?:async\s+)?function/.test(line)) {
                isFunctionStart = true;
                const match = line.match(/(\w+)\s*[:=]/);
                funcName = match?.[1] || 'anonymous';
            }

            if (isFunctionStart) {
                inFunction = true;
                functionName = funcName;
                functionStartLine = i + 1;
                functionBraceDepth = braceDepth;
                cyclomaticScore = 1;
            }

            if (inFunction) {
                // Count decision points

                // if statements
                cyclomaticScore += (trimmed.match(/\bif\s*\(/g) || []).length;

                // else if
                cyclomaticScore += (trimmed.match(/\belse\s+if\s*\(/g) || []).length;

                // Loops
                cyclomaticScore += (trimmed.match(/\b(for|while|do)\s*\(/g) || []).length;

                // Case statements
                cyclomaticScore += (trimmed.match(/\bcase\b/g) || []).length;

                // Logical operators
                cyclomaticScore += (trimmed.match(/&&|\|\|/g) || []).length;

                // Ternary operators
                cyclomaticScore += (trimmed.match(/\?/g) || []).length;

                // Catch blocks
                cyclomaticScore += (trimmed.match(/\bcatch\s*\(/g) || []).length;

                // Function end detection
                if (braceDepth <= functionBraceDepth && closeBraces > 0 && i > functionStartLine) {
                    // Report if complexity is high
                    if (cyclomaticScore > 12) { // Increased from 10 to reduce noise
                        const severity = cyclomaticScore > 25 ? 'critical' : cyclomaticScore > 18 ? 'high' : 'medium';

                        this.errors.push({
                            file,
                            line: functionStartLine,
                            type: ComplexityErrorType.HIGH_CYCLOMATIC_COMPLEXITY,
                            severity,
                            message: `Function '${functionName}' has high cyclomatic complexity (${cyclomaticScore})`,
                            pattern: lines[functionStartLine - 1].trim(),
                            suggestedFix: 'Split into smaller functions, use early returns, extract conditions to named functions',
                            details: `Cyclomatic complexity: ${cyclomaticScore} (threshold: 12)`,
                            metrics: { complexity: cyclomaticScore, threshold: 12 },
                        });
                    }

                    inFunction = false;
                }
            }
        }
    }

    /**
     * 3. Function Length Detection
     * 
     * Long functions are harder to understand and maintain:
     * - >100 lines: Medium (consider splitting)
     * - >200 lines: High (definitely split)
     * - >300 lines: Critical (urgent refactoring)
     */
    private detectExcessiveFunctionLength(file: string, content: string): void {
        const lines = content.split('\n');
        let inFunction = false;
        let functionName = '';
        let functionStartLine = 0;
        let braceDepth = 0;
        let functionBraceDepth = 0;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            // Track brace depth
            const openBraces = (line.match(/\{/g) || []).length;
            const closeBraces = (line.match(/\}/g) || []).length;
            braceDepth += openBraces - closeBraces;

            // Detect function start
            const funcMatch = /(?:function\s+(\w+)|(\w+)\s*[:=]\s*(?:async\s+)?(?:function|\([^)]*\)\s*=>)|const\s+(\w+)\s*=\s*(?:async\s+)?\([^)]*\)\s*=>|const\s+(\w+)\s*=\s*\(\)\s*=>)/;
            if (funcMatch.test(line)) {
                inFunction = true;
                const match = line.match(/(?:function\s+(\w+)|(\w+)\s*[:=]|const\s+(\w+)\s*=)/);
                functionName = match?.[1] || match?.[2] || match?.[3] || 'anonymous';
                functionStartLine = i + 1;
                functionBraceDepth = braceDepth;
            }

            if (inFunction) {
                // Function end detection
                if (braceDepth <= functionBraceDepth && closeBraces > 0 && i > functionStartLine) {
                    // Count only code lines (exclude empty lines and comments)
                    let codeLineCount = 0;
                    for (let j = functionStartLine - 1; j <= i; j++) {
                        const ln = lines[j].trim();
                        if (ln && !ln.startsWith('//') && !ln.startsWith('/*') && !ln.startsWith('*')) {
                            codeLineCount++;
                        }
                    }

                    // Report if function is too long
                    if (codeLineCount > 100) {
                        const severity = codeLineCount > 300 ? 'critical' : codeLineCount > 200 ? 'high' : 'medium';

                        this.errors.push({
                            file,
                            line: functionStartLine,
                            type: ComplexityErrorType.EXCESSIVE_FUNCTION_LENGTH,
                            severity,
                            message: `Long function (${codeLineCount} lines)`,
                            pattern: lines[functionStartLine - 1].trim(),
                            suggestedFix: '1. Extract logical blocks into separate functions',
                            details: `Function length: ${codeLineCount} lines (threshold: 100)`,
                            metrics: { length: codeLineCount, threshold: 100 },
                        });
                    }

                    inFunction = false;
                }
            }
        }
    }

    /**
     * 4. Nesting Depth Detection
     * 
     * Deep nesting makes code hard to follow:
     * - >4 levels: Medium (getting complex)
     * - >6 levels: High (refactor recommended)
     * - >8 levels: Critical (urgent refactoring)
     */
    private detectExcessiveNesting(file: string, content: string): void {
        const lines = content.split('\n');
        let currentDepth = 0;
        let maxDepthInFunction = 0;
        let maxDepthLine = 0;
        let inFunction = false;
        let functionName = '';

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const trimmed = line.trim();

            // Skip comments
            if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed === '') {
                continue;
            }

            // Detect function start (simplified to avoid ESLint complexity warning)
            let isFunctionStart = false;
            let funcName = 'anonymous';

            // Check for traditional function declarations
            if (/function\s+(\w+)/.test(line)) {
                isFunctionStart = true;
                const match = line.match(/function\s+(\w+)/);
                funcName = match?.[1] || 'anonymous';
            }
            // Check for async function declarations
            else if (/async\s+function\s+(\w+)/.test(line)) {
                isFunctionStart = true;
                const match = line.match(/async\s+function\s+(\w+)/);
                funcName = match?.[1] || 'anonymous';
            }
            // Check for arrow functions: const name = () => or const name = (params) =>
            else if (/const\s+(\w+)\s*=\s*(?:async\s+)?\([^)]*\)\s*=>/.test(line)) {
                isFunctionStart = true;
                const match = line.match(/const\s+(\w+)\s*=/);
                funcName = match?.[1] || 'anonymous';
            }
            // Check for function expressions: name = function() or name: function()
            else if (/(\w+)\s*[:=]\s*(?:async\s+)?function/.test(line)) {
                isFunctionStart = true;
                const match = line.match(/(\w+)\s*[:=]/);
                funcName = match?.[1] || 'anonymous';
            }

            if (isFunctionStart) {
                // Report previous function if needed
                if (inFunction && maxDepthInFunction > 4) {
                    // Apply false-positive filter for if/else chains
                    const filterContext: CodeContext = {
                        file,
                        content,
                        line: maxDepthLine,
                        pattern: lines[maxDepthLine - 1].trim(),
                    };
                    const filterResult = filterFalsePositives(filterContext, 'NESTING_DEPTH');
                    
                    if (!filterResult.isFalsePositive) {
                        const severity = maxDepthInFunction > 8 ? 'critical' : maxDepthInFunction > 6 ? 'high' : 'medium';

                        this.errors.push({
                            file,
                            line: maxDepthLine,
                            type: ComplexityErrorType.EXCESSIVE_NESTING_DEPTH,
                            severity,
                            message: `Excessive nesting depth (${maxDepthInFunction} levels) in function '${functionName}'`,
                            pattern: lines[maxDepthLine - 1].trim(),
                            suggestedFix: 'Use early returns, extract nested logic to separate functions, flatten structure',
                            details: `Nesting depth: ${maxDepthInFunction} levels (threshold: 4)`,
                            metrics: { nestingDepth: maxDepthInFunction, threshold: 4 },
                        });
                    }
                }

                inFunction = true;
                functionName = funcName;
                currentDepth = 0;
                maxDepthInFunction = 0;
            }

            if (inFunction) {
                // CRITICAL FIX: Only count opening braces after control flow keywords
                // Don't count object literals, function parameters, or JSX
                const controlFlowMatches = (trimmed.match(/\b(if|for|while|switch|try|catch)\s*\([^)]*\)\s*\{/g) || []).length;
                const elseMatches = (trimmed.match(/\belse\s*\{/g) || []).length;
                
                // Only increase depth if there's actual control flow nesting
                if (controlFlowMatches > 0 || elseMatches > 0) {
                    currentDepth += (controlFlowMatches + elseMatches);
                }

                // Track closing braces to decrease depth
                const openBraces = (line.match(/\{/g) || []).length;
                const closeBraces = (line.match(/\}/g) || []).length;
                const netCloseBraces = closeBraces - openBraces;

                // Decrease depth only for closing braces (when netCloseBraces > 0)
                if (netCloseBraces > 0) {
                    currentDepth = Math.max(0, currentDepth - netCloseBraces);
                }

                // Update max depth after processing the line
                if (currentDepth > maxDepthInFunction) {
                    maxDepthInFunction = currentDepth;
                    maxDepthLine = i + 1;
                }
            }
        }

        // Report last function if needed
        if (inFunction && maxDepthInFunction > 4) {
            const severity = maxDepthInFunction > 8 ? 'critical' : maxDepthInFunction > 6 ? 'high' : 'medium';

            this.errors.push({
                file,
                line: maxDepthLine,
                type: ComplexityErrorType.EXCESSIVE_NESTING_DEPTH,
                severity,
                message: `Excessive nesting depth (${maxDepthInFunction} levels) in function '${functionName}'`,
                pattern: lines[maxDepthLine - 1].trim(),
                suggestedFix: 'Use early returns, extract nested logic to separate functions, flatten structure',
                details: `Nesting depth: ${maxDepthInFunction} levels (threshold: 4)`,
                metrics: { nestingDepth: maxDepthInFunction, threshold: 4 },
            });
        }
    }

    /**
     * 5. Code Duplication Detection
     * 
     * Detects duplicate code blocks (violates DRY principle):
     * - Exact match of 10+ lines
     * - Similar patterns (80%+ similarity)
     * 
     * Severity based on duplication size:
     * - 10-20 lines: Medium
     * - 20-50 lines: High
     * - >50 lines: Critical
     */
    private detectCodeDuplication(file: string, content: string): void {
        const lines = content.split('\n');
        const minDuplicateLines = 10;
        const lineHashes = new Map<string, number[]>();

        // Hash lines (ignore whitespace and comments)
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();

            // Skip empty lines and comments
            if (line === '' || line.startsWith('//') || line.startsWith('/*') || line.startsWith('*')) {
                continue;
            }

            // Normalize line (remove extra spaces)
            const normalized = line.replace(/\s+/g, ' ');

            if (!lineHashes.has(normalized)) {
                lineHashes.set(normalized, []);
            }
            lineHashes.get(normalized)!.push(i);
        }

        // Find duplicate blocks
        const processedRanges = new Set<string>();

        for (const [_hash, positions] of lineHashes) {
            if (positions.length < 2) continue;

            // Check each pair of positions
            for (let i = 0; i < positions.length; i++) {
                for (let j = i + 1; j < positions.length; j++) {
                    const start1 = positions[i];
                    const start2 = positions[j];

                    // Count consecutive matching lines
                    let matchCount = 0;
                    while (
                        start1 + matchCount < lines.length &&
                        start2 + matchCount < lines.length &&
                        this.normalizeCode(lines[start1 + matchCount]) === this.normalizeCode(lines[start2 + matchCount])
                    ) {
                        matchCount++;
                    }

                    // Report if duplicate is significant
                    if (matchCount >= minDuplicateLines) {
                        const rangeKey = `${start1}-${start2}-${matchCount}`;
                        if (processedRanges.has(rangeKey)) continue;
                        processedRanges.add(rangeKey);

                        const severity = matchCount > 50 ? 'critical' : matchCount > 20 ? 'high' : 'medium';

                        this.errors.push({
                            file,
                            line: start1 + 1,
                            type: ComplexityErrorType.CODE_DUPLICATION,
                            severity,
                            message: `Duplicate code block detected (${matchCount} lines, also at line ${start2 + 1})`,
                            pattern: lines[start1].trim(),
                            suggestedFix: 'Extract to shared function, create reusable utility, apply DRY principle',
                            details: `Duplicate: lines ${start1 + 1}-${start1 + matchCount} match lines ${start2 + 1}-${start2 + matchCount}`,
                            metrics: { duplicateLines: matchCount, threshold: minDuplicateLines },
                        });
                    }
                }
            }
        }
    }

    /**
     * Normalize code for comparison (remove whitespace, standardize formatting)
     */
    private normalizeCode(line: string): string {
        return line
            .trim()
            .replace(/\s+/g, ' ')
            .replace(/\s*([{}()[\];,])\s*/g, '$1');
    }

    /**
     * Calculate aggregate statistics
     */
    calculateStatistics(): ComplexityStatistics {
        const stats: ComplexityStatistics = {
            totalErrors: this.errors.length,
            bySeverity: { low: 0, medium: 0, high: 0, critical: 0 },
            byType: {},
            averageComplexity: 0,
            averageFunctionLength: 0,
            maxNestingDepth: 0,
            duplicationPercentage: 0,
        };

        let totalComplexity = 0;
        let complexityCount = 0;
        let totalFunctionLength = 0;
        let lengthCount = 0;
        let totalDuplicateLines = 0;

        for (const error of this.errors) {
            stats.bySeverity[error.severity]++;
            stats.byType[error.type] = (stats.byType[error.type] || 0) + 1;

            if (error.metrics?.complexity) {
                totalComplexity += error.metrics.complexity;
                complexityCount++;
            }

            if (error.metrics?.length) {
                totalFunctionLength += error.metrics.length;
                lengthCount++;
            }

            if (error.metrics?.nestingDepth && error.metrics.nestingDepth > stats.maxNestingDepth) {
                stats.maxNestingDepth = error.metrics.nestingDepth;
            }

            if (error.metrics?.duplicateLines) {
                totalDuplicateLines += error.metrics.duplicateLines;
            }
        }

        stats.averageComplexity = complexityCount > 0 ? Math.round(totalComplexity / complexityCount) : 0;
        stats.averageFunctionLength = lengthCount > 0 ? Math.round(totalFunctionLength / lengthCount) : 0;
        stats.duplicationPercentage = this.totalLines > 0 ? Math.round((totalDuplicateLines / this.totalLines) * 100) : 0;

        return stats;
    }

    /**
     * Format error for display
     */
    formatError(error: ComplexityError): string {
        const icon = {
            low: '📘',
            medium: '📙',
            high: '📕',
            critical: '🔥',
        }[error.severity];

        let output = `${icon} ${error.message}\n`;
        output += `   File: ${error.file}:${error.line}\n`;
        output += `   Pattern: ${error.pattern}\n`;
        output += `   Fix: ${error.suggestedFix}\n`;

        if (error.details) {
            output += `   Details: ${error.details}\n`;
        }

        return output;
    }
}
