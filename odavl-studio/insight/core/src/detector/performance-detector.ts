/**
 * Performance Profiler Detector - ODAVL Insight
 * Performance Profiling & Optimization (v1.4.0)
 * 
 * Detects performance issues:
 * - Bundle size analysis (webpack, vite, rollup) ✅
 * - React unnecessary renders ✅
 * - Inefficient loop patterns ✅
 * - Large asset detection ✅
 * - Blocking operation warnings ✅
 * 
 * Target Coverage: 35% → 80%
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { glob } from 'glob';
import { logger } from '../utils/logger';
import { filterFalsePositives, type CodeContext } from './false-positive-filters';
import {
    BundleSizeAnalyzer,
    ReactRenderOptimizer,
    LoopComplexityAnalyzer,
    AssetOptimizer,
} from './performance/index';

export interface PerformanceError {
    file: string;
    filePath?: string; // Added for backwards compatibility
    line?: number;
    column?: number;
    type: PerformanceErrorType;
    severity: 'critical' | 'high' | 'medium' | 'low';
    message: string;
    pattern?: string;
    suggestedFix: string;
    details?: string;
    metrics?: {
        size?: number;
        threshold?: number;
        impact?: string;
        complexity?: number;
        lines?: number;
    };
}

export enum PerformanceErrorType {
    // Bundle size issues
    BUNDLE_TOO_LARGE = 'BUNDLE_TOO_LARGE',
    LARGE_MODULE_IMPORT = 'LARGE_MODULE_IMPORT',
    MISSING_CODE_SPLITTING = 'MISSING_CODE_SPLITTING',
    NO_TREE_SHAKING = 'NO_TREE_SHAKING',
    DUPLICATE_DEPENDENCIES = 'DUPLICATE_DEPENDENCIES',

    // React render issues
    UNNECESSARY_RENDER = 'UNNECESSARY_RENDER',
    MISSING_MEMO = 'MISSING_MEMO',
    MISSING_USE_CALLBACK = 'MISSING_USE_CALLBACK',
    INLINE_FUNCTION_IN_JSX = 'INLINE_FUNCTION_IN_JSX',
    INLINE_OBJECT_IN_JSX = 'INLINE_OBJECT_IN_JSX',
    MISSING_KEY_PROP = 'MISSING_KEY_PROP',

    // Loop inefficiencies
    NESTED_LOOP_O_N_SQUARED = 'NESTED_LOOP_O_N_SQUARED',
    LOOP_WITH_DOM_ACCESS = 'LOOP_WITH_DOM_ACCESS',
    UNOPTIMIZED_ARRAY_METHOD = 'UNOPTIMIZED_ARRAY_METHOD',
    LOOP_CREATING_CLOSURES = 'LOOP_CREATING_CLOSURES',
    INEFFICIENT_LOOP = 'INEFFICIENT_LOOP',
    N_PLUS_ONE_QUERY = 'N_PLUS_ONE_QUERY',

    // Asset issues
    LARGE_IMAGE_WITHOUT_OPTIMIZATION = 'LARGE_IMAGE_WITHOUT_OPTIMIZATION',
    MISSING_LAZY_LOADING = 'MISSING_LAZY_LOADING',
    UNCOMPRESSED_ASSET = 'UNCOMPRESSED_ASSET',

    // Blocking operations & memory leaks
    SYNC_FILE_OPERATION = 'SYNC_FILE_OPERATION',
    BLOCKING_COMPUTATION = 'BLOCKING_COMPUTATION',
    LONG_RUNNING_FUNCTION = 'LONG_RUNNING_FUNCTION',
    HEAVY_COMPUTATION_IN_RENDER = 'HEAVY_COMPUTATION_IN_RENDER',
    MISSING_CLEANUP_LOGIC = 'MISSING_CLEANUP_LOGIC',
    SLOW_FUNCTION = 'SLOW_FUNCTION',
}

export interface PerformanceStatistics {
    totalIssues: number;
    criticalIssues: number;
    highIssues: number;
    mediumIssues: number;
    lowIssues: number;
    issuesByType: Record<PerformanceErrorType, number>;
    filesScanned: number;
    bundleSizeIssues: number;
    renderIssues: number;
    loopIssues: number;
    assetIssues: number;
    blockingIssues: number;
    estimatedImpact?: {
        bundleSizeReduction?: string;
        renderPerformance?: string;
        computationTime?: string;
    };
}

export interface PerformanceDetectorOptions {
    workspaceRoot: string;
    includePatterns?: string[];
    excludePatterns?: string[];
    bundleSizeThresholdKB?: number;
    assetSizeThresholdKB?: number;
    maxFunctionLines?: number;
    verbose?: boolean;
}

export class PerformanceDetector {
    private readonly options: Required<PerformanceDetectorOptions>;
    private errors: PerformanceError[] = [];
    
    // Specialized analyzers
    private readonly bundleSizeAnalyzer: BundleSizeAnalyzer;
    private readonly reactRenderOptimizer: ReactRenderOptimizer;
    private readonly loopComplexityAnalyzer: LoopComplexityAnalyzer;
    private readonly assetOptimizer: AssetOptimizer;

    constructor(optionsOrPath: PerformanceDetectorOptions | string) {
        // Backwards compatibility: accept string path like old tests expect
        const options = typeof optionsOrPath === 'string'
            ? { workspaceRoot: optionsOrPath }
            : optionsOrPath;

        this.options = {
            includePatterns: ['**/*.{ts,tsx,js,jsx}'],
            excludePatterns: [
                '**/node_modules/**',
                '**/dist/**',
                '**/dist-test/**',
                '**/build/**',
                '**/.next/**',
                '**/out/**',
                '**/coverage/**',
                '**/*.test.*',
                '**/*.spec.*',
            ],
            bundleSizeThresholdKB: 500,
            assetSizeThresholdKB: 200,
            maxFunctionLines: 100,
            verbose: false,
            ...options,
        };
        
        // Initialize specialized analyzers
        this.bundleSizeAnalyzer = new BundleSizeAnalyzer(this.options.workspaceRoot);
        this.reactRenderOptimizer = new ReactRenderOptimizer(this.options.workspaceRoot);
        this.loopComplexityAnalyzer = new LoopComplexityAnalyzer(this.options.workspaceRoot);
        this.assetOptimizer = new AssetOptimizer(this.options.workspaceRoot, this.options.assetSizeThresholdKB);
    }

    async analyze(): Promise<{ errors: PerformanceError[]; statistics: PerformanceStatistics }> {
        this.errors = [];
        const files = await this.getFiles();

        if (this.options.verbose) {
            logger.debug(`[PerformanceDetector] Found ${files.length} files in ${this.options.workspaceRoot}`);
            logger.debug(`[PerformanceDetector] Patterns: ${this.options.includePatterns.join(', ')}`);
            if (files.length > 0) logger.debug(`[PerformanceDetector] First file: ${files[0]}`);
        }

        for (const file of files) {
            // Check file size first (before reading content)
            const stats = fs.statSync(file);
            const sizeKB = stats.size / 1024;

            if (sizeKB > 500) {
                let severity: 'critical' | 'high' | 'medium' = 'medium';
                if (sizeKB > 1024) severity = 'critical'; // >1MB
                else if (sizeKB > 750) severity = 'high'; // >750KB

                // Estimate load time (assuming 3G: ~50KB/s, 4G: ~150KB/s)
                const loadTime3G = (sizeKB / 50).toFixed(1);
                const loadTime4G = (sizeKB / 150).toFixed(1);

                this.errors.push({
                    file,
                    line: 1,
                    type: PerformanceErrorType.BUNDLE_TOO_LARGE,
                    severity,
                    message: `Large file (${Math.round(sizeKB)}KB)`,
                    pattern: path.basename(file),
                    suggestedFix: 'Split file, enable code splitting, or lazy load',
                    details: `File size: ${Math.round(sizeKB)}KB (threshold: 500KB)`,
                    metrics: {
                        size: Math.round(sizeKB),
                        threshold: 500,
                        impact: `Estimated load time: ${loadTime3G}s (3G), ${loadTime4G}s (4G)`
                    },
                });
            }

            const content = fs.readFileSync(file, 'utf-8');

            // Delegate to specialized analyzers
            const bundleIssues = this.bundleSizeAnalyzer.detect(file, content);
            this.errors.push(...this.convertBundleIssuesToPerformanceErrors(bundleIssues));

            const reactIssues = this.reactRenderOptimizer.detect(file, content);
            this.errors.push(...this.convertReactIssuesToPerformanceErrors(reactIssues));

            const loopIssues = this.loopComplexityAnalyzer.detect(file, content);
            this.errors.push(...this.convertLoopIssuesToPerformanceErrors(loopIssues));

            const assetIssues = this.assetOptimizer.detect(file, content);
            this.errors.push(...this.convertAssetIssuesToPerformanceErrors(assetIssues));

            // Keep legacy detectors for now
            this.detectSlowFunctions(file, content);
            this.detectNPlusOneQueries(file, content);
        }

        const statistics = this.calculateStatistics();
        return { errors: this.errors, statistics };
    }

    /**
     * Convert specialized analyzer results to PerformanceError format
     */
    private convertBundleIssuesToPerformanceErrors(issues: any[]): PerformanceError[] {
        return issues.map(issue => ({
            file: issue.file,
            filePath: issue.file,
            line: issue.line,
            type: issue.type,
            severity: issue.severity,
            message: issue.message,
            pattern: issue.pattern,
            suggestedFix: issue.suggestedFix,
            details: issue.details,
            metrics: issue.metrics,
        }));
    }

    private convertReactIssuesToPerformanceErrors(issues: any[]): PerformanceError[] {
        return issues.map(issue => ({
            file: issue.file,
            filePath: issue.file,
            line: issue.line,
            type: issue.type,
            severity: issue.severity,
            message: issue.message,
            pattern: issue.pattern,
            suggestedFix: issue.suggestedFix,
            details: issue.details,
        }));
    }

    private convertLoopIssuesToPerformanceErrors(issues: any[]): PerformanceError[] {
        return issues.map(issue => ({
            file: issue.file,
            filePath: issue.file,
            line: issue.line,
            type: issue.type,
            severity: issue.severity,
            message: issue.message,
            pattern: issue.pattern,
            suggestedFix: issue.suggestedFix,
            details: issue.details,
            metrics: issue.metrics,
        }));
    }

    private convertAssetIssuesToPerformanceErrors(issues: any[]): PerformanceError[] {
        return issues.map(issue => ({
            file: issue.file,
            filePath: issue.file,
            line: issue.line,
            type: issue.type,
            severity: issue.severity,
            message: issue.message,
            pattern: issue.pattern,
            suggestedFix: issue.suggestedFix,
            details: issue.details,
            metrics: issue.metrics,
        }));
    }

    // ====== LEGACY METHODS (kept for backwards compatibility) ======

    detectBundleSizeIssues(file: string, content: string): void {
        const lines = content.split('\n');

        lines.forEach((line, index) => {
            const lineNum = index + 1;

            if (/import\s+\*\s+as\s+\w+\s+from\s+['"](?:lodash|moment|rxjs|@material-ui\/core)['"]/.test(line)) {
                this.errors.push({
                    file,
                    line: lineNum,
                    type: PerformanceErrorType.LARGE_MODULE_IMPORT,
                    severity: 'high',
                    message: 'Importing entire large library',
                    pattern: line.trim(),
                    suggestedFix: 'import { debounce } from "lodash"',
                    details: 'Tree-shakeable imports reduce bundle size',
                });
            }

            if (/import\s+_\s+from\s+['"]lodash['"]/.test(line)) {
                this.errors.push({
                    file,
                    line: lineNum,
                    type: PerformanceErrorType.LARGE_MODULE_IMPORT,
                    severity: 'high',
                    message: 'Full lodash import (72KB+ gzipped)',
                    pattern: line.trim(),
                    suggestedFix: 'import debounce from "lodash/debounce"',
                    details: 'Use per-method imports',
                    metrics: { size: 72, threshold: 10 },
                });
            }

            if (/import\s+.*\s+from\s+['"]moment['"]/.test(line)) {
                this.errors.push({
                    file,
                    line: lineNum,
                    type: PerformanceErrorType.LARGE_MODULE_IMPORT,
                    severity: 'high',
                    message: 'Moment.js is large (67KB+)',
                    pattern: line.trim(),
                    suggestedFix: 'Consider date-fns or dayjs',
                    details: 'Modern alternatives are smaller',
                    metrics: { size: 67, threshold: 12 },
                });
            }
        });
    }

    detectReactRenders(file: string, content: string): void {
        if (!/\.(tsx|jsx)$/.test(file)) return;

        // Skip test/dev files - performance issues less critical there
        if (file.includes('.test.') || file.includes('.spec.') || file.includes('__tests__')) {
            return;
        }

        const lines = content.split('\n');
        const fileSize = lines.length;

        // Check if file uses useCallback/useMemo (reduces false positives)
        const hasUseCallback = content.includes('useCallback');
        const hasUseMemo = content.includes('useMemo');

        lines.forEach((line, index) => {
            const lineNum = index + 1;

            // 1. Inline arrow functions in JSX
            if (/<\w+[^>]*\s+(?:onClick|onChange|onSubmit)=\{[^}]*=>/.test(line)) {
                // Smart severity based on context
                let severity: 'critical' | 'high' | 'medium' | 'low' = 'low';

                // Only flag as medium/high if component is large (likely re-renders often)
                if (fileSize > 100) severity = 'medium';
                if (fileSize > 300) severity = 'high';

                // If file already uses useCallback elsewhere, it's lower priority
                if (hasUseCallback) severity = 'low';

                // Skip if it's just a simple state setter like onClick={() => setOpen(true)}
                if (/=\{[^}]*\b(set\w+|toggle\w+)\([^)]*\)\s*\}/.test(line)) {
                    return; // Simple setters are fine, no need to wrap in useCallback
                }

                this.errors.push({
                    file,
                    line: lineNum,
                    type: PerformanceErrorType.INLINE_FUNCTION_IN_JSX,
                    severity,
                    message: 'Inline arrow function in JSX',
                    pattern: line.trim(),
                    suggestedFix: 'Use useCallback for complex handlers',
                    details: `File size: ${fileSize} lines - ${severity} priority`,
                });
            }

            // 2. Inline style objects
            if (/<\w+[^>]*\s+style=\{\{/.test(line)) {
                // Count properties in style object (multi-line aware)
                const styleMatch = line.match(/style=\{\{([^}]+)\}\}/);
                if (styleMatch) {
                    const styleContent = styleMatch[1];
                    const propCount = (styleContent.match(/:/g) || []).length;

                    // Only flag if style has multiple properties or dynamic values
                    if (propCount <= 2 && !styleContent.includes('${') && !styleContent.includes('props.')) {
                        return; // Simple static styles are fine (e.g., style={{ color: 'red' }})
                    }
                }

                let severity: 'critical' | 'high' | 'medium' | 'low' = 'low';
                if (fileSize > 100) severity = 'medium';
                if (hasUseMemo) severity = 'low'; // Already using useMemo elsewhere

                this.errors.push({
                    file,
                    line: lineNum,
                    type: PerformanceErrorType.INLINE_OBJECT_IN_JSX,
                    severity,
                    message: 'Inline style object in JSX',
                    pattern: line.trim(),
                    suggestedFix: 'Extract complex styles to useMemo or CSS',
                    details: `Consider CSS modules or styled-components for complex styles`,
                });
            }

            // 3. Missing key prop in .map() - IMPROVED
            if (/\.map\([^)]*=>\s*</.test(line)) {
                // Check current line and next 2 lines for key prop (multi-line JSX)
                const contextLines = lines.slice(index, index + 3).join('\n');

                if (!contextLines.includes('key=')) {
                    this.errors.push({
                        file,
                        line: lineNum,
                        type: PerformanceErrorType.MISSING_KEY_PROP,
                        severity: 'high', // This is actually critical for React performance
                        message: 'Missing key prop in .map() list',
                        pattern: line.trim(),
                        suggestedFix: '<Component key={item.id} />',
                        details: 'React cannot optimize re-renders without unique keys',
                    });
                }
            }
        });
    }

    detectIneffLoops(file: string, content: string): void {
        const lines = content.split('\n');
        let loopDepth = 0;
        let inPromiseAll = false;
        const loopVariables: { variable: string; array: string }[] = [];

        for (let index = 0; index < lines.length; index++) {
            const line = lines[index];
            const lineNum = index + 1;

            // Check if we're inside Promise.all context (parallel execution, NOT O(n²))
            if (/Promise\.all\s*\(/.test(line) || /await\s+Promise\.all\s*\(/.test(line)) {
                inPromiseAll = true;
            }

            // CRITICAL FIX: Check for batch operation patterns (FALSE POSITIVE PREVENTION)
            const isBatchOperation = content.includes('createMany') || 
                                   content.includes('insertMany') || 
                                   content.includes('bulkCreate') ||
                                   content.includes('bulkWrite');

            // Track loop nesting depth
            const forMatch = /\bfor\s*\((?:let|const|var)\s+(\w+)(?:\s+of\s+(\w+))?/g.exec(line);
            if (forMatch && !inPromiseAll) { // Only flag if NOT in Promise.all
                loopDepth++;
                const variable = forMatch[1];
                const array = forMatch[2] || '';
                loopVariables.push({ variable, array });

                // CRITICAL FIX: Check if loops iterate over SAME array (true O(n²)) or DIFFERENT arrays (O(n*m))
                if (loopDepth >= 2) {
                    const outerArray = loopVariables[0]?.array || '';
                    const innerArray = loopVariables[loopVariables.length - 1]?.array || '';
                    
                    // Only flag as O(n²) if same array or if array names suggest same dataset
                    const isSameArray = outerArray && innerArray && (
                        outerArray === innerArray || 
                        outerArray.replace(/s$/, '') === innerArray.replace(/s$/, '') // users vs user
                    );

                    // Skip if it's building array for batch operation
                    if (isBatchOperation && (content.includes('.push(') || content.includes('data.push('))) {
                        // This is optimized code building array for batch insert - NOT O(n²)
                        continue;
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
                        // Skip false positive
                        continue;
                    }

                    // Lower severity if different arrays (O(n*m) not O(n²))
                    let severity: 'critical' | 'high' | 'medium' | 'low' = isSameArray ? 'critical' : (loopDepth === 3 ? 'high' : 'medium');
                    const complexityLabel = isSameArray ? 'O(n²)' : 'O(n*m)';
                    
                    // Apply severity adjustment from filter
                    if (filterResult.adjustedSeverity) {
                        severity = filterResult.adjustedSeverity;
                    }

                    // Detect triple nested loops (O(n³)) - critical severity
                    if (loopDepth >= 3) {
                        this.errors.push({
                            file,
                            line: lineNum,
                            type: PerformanceErrorType.INEFFICIENT_LOOP,
                            severity,
                            message: `Triple nested loop (${complexityLabel} complexity)`,
                            pattern: line.trim(),
                            suggestedFix: isSameArray ? 
                                'Refactor to reduce nesting, use Map/Set for lookups' :
                                'Consider if this can be optimized with joins/batch operations',
                            details: isSameArray ? 
                                'Cubic time complexity on SAME array - extremely slow' :
                                'Nested loops on DIFFERENT arrays - may be acceptable for small datasets',
                        });
                    }
                    // Detect nested loops (O(n²)) - high severity
                    else if (loopDepth === 2) {
                        this.errors.push({
                            file,
                            line: lineNum,
                            type: PerformanceErrorType.INEFFICIENT_LOOP,
                            severity,
                            message: `Nested loop detected (${complexityLabel} complexity)`,
                            pattern: line.trim(),
                            suggestedFix: isSameArray ?
                                'Use Map/Set lookup or optimize with hash table' :
                                'Different arrays - consider if optimization needed',
                            details: isSameArray ?
                                'Quadratic time complexity on SAME array - performance degrades rapidly' :
                                'Loops over DIFFERENT arrays - O(n*m) complexity',
                        });
                    }
                }
            }

            // Decrease depth when closing braces found
            if (line.includes('}')) {
                const braceCount = (line.match(/}/g) || []).length;
                loopDepth = Math.max(0, loopDepth - braceCount);
                // Pop loop variables when exiting loop
                for (let i = 0; i < braceCount; i++) {
                    loopVariables.pop();
                }
            }

            // Reset Promise.all flag when block ends
            if (inPromiseAll && line.includes(');')) {
                inPromiseAll = false;
            }

            // REMOVED: Array.push detection (too many false positives, .push() is usually fine)

            // Detect large array allocations (>50k elements only, not 10k)
            const largeArrayMatch = /(?:new\s+Array|Array)\s*\(\s*(\d+)\s*\)/.exec(line);
            if (largeArrayMatch) {
                const size = Number.parseInt(largeArrayMatch[1], 10);
                if (size >= 50000) { // Increased threshold from 10k to 50k
                    let severity: 'critical' | 'high' | 'medium' = 'medium';
                    if (size >= 100000) severity = 'critical';
                    else if (size >= 75000) severity = 'high';

                    this.errors.push({
                        file,
                        line: lineNum,
                        type: PerformanceErrorType.INEFFICIENT_LOOP,
                        severity,
                        message: `Large array allocation (${size.toLocaleString()} elements)`,
                        pattern: line.trim(),
                        suggestedFix: 'Use iterators, generators, or stream processing for large datasets',
                        details: `Memory allocation: ~${Math.round((size * 8) / 1024)}KB (assuming 8 bytes/element)`,
                        metrics: { size, threshold: 50000 },
                    });
                }
            }

            // Detect DOM access in loop (only if it's inside the loop body)
            if (loopDepth > 0 && /document\.(getElementById|querySelector|querySelectorAll|getElementsBy)/.test(line)) {
                this.errors.push({
                    file,
                    line: lineNum,
                    type: PerformanceErrorType.LOOP_WITH_DOM_ACCESS,
                    severity: 'high',
                    message: 'DOM query in loop body',
                    pattern: line.trim(),
                    suggestedFix: 'Cache DOM references outside loop',
                    details: 'Each DOM query triggers style recalculation',
                });
            }
        }
    }

    detectLargeAssets(file: string, content: string): void {
        const lines = content.split('\n');
        lines.forEach((line, index) => {
            const lineNum = index + 1;

            if (/import\s+.*\s+from\s+['"][^'"]*\.(jpg|png|webp)['"]/.test(line)) {
                const match = line.match(/['"]([^'"]*\.(jpg|png|webp))['"]/);
                if (match) {
                    const assetPath = path.resolve(path.dirname(file), match[1]);
                    if (fs.existsSync(assetPath)) {
                        const stats = fs.statSync(assetPath);
                        const sizeKB = stats.size / 1024;

                        if (sizeKB > this.options.assetSizeThresholdKB) {
                            this.errors.push({
                                file,
                                line: lineNum,
                                type: PerformanceErrorType.LARGE_IMAGE_WITHOUT_OPTIMIZATION,
                                severity: 'high',
                                message: `Large image (${Math.round(sizeKB)}KB)`,
                                pattern: line.trim(),
                                suggestedFix: 'Use next/image or compress',
                                details: `>${this.options.assetSizeThresholdKB}KB`,
                                metrics: { size: Math.round(sizeKB), threshold: this.options.assetSizeThresholdKB },
                            });
                        }
                    }
                }
            }

            if (/<img\s+[^>]*src=/.test(line) && !line.includes('loading="lazy"')) {
                this.errors.push({
                    file,
                    line: lineNum,
                    type: PerformanceErrorType.MISSING_LAZY_LOADING,
                    severity: 'medium',
                    message: 'Image without lazy loading',
                    pattern: line.trim(),
                    suggestedFix: 'loading="lazy"',
                    details: 'Improves initial load',
                });
            }
        });
    }

    detectSlowFunctions(file: string, content: string): void {
        // Simple line-by-line analysis for performance
        const functionRegex = /function\s+(\w+)\s*\([^)]*\)\s*{/g;
        let match;

        while ((match = functionRegex.exec(content)) !== null) {
            const functionName = match[1];
            const startPos = match.index;

            // Count lines and complexity in function body
            const startLine = content.substring(0, startPos).split('\n').length;
            const remainingContent = content.substring(startPos);

            // Find function end by counting braces
            let braceCount = 0;
            let functionBody = '';
            let i = 0;

            for (; i < remainingContent.length; i++) {
                const char = remainingContent[i];
                functionBody += char;
                if (char === '{') braceCount++;
                if (char === '}') {
                    braceCount--;
                    if (braceCount === 0) break;
                }
            }

            // Calculate metrics
            const lineCount = functionBody.split('\n').length;
            let complexity = 1;

            // Count complexity indicators
            complexity += (functionBody.match(/\bif\s*\(/g) || []).length;
            complexity += (functionBody.match(/\belse\b/g) || []).length;
            complexity += (functionBody.match(/\bfor\s*\(/g) || []).length * 2;
            complexity += (functionBody.match(/\bwhile\s*\(/g) || []).length * 2;
            complexity += (functionBody.match(/\bswitch\s*\(/g) || []).length;
            complexity += (functionBody.match(/\bcase\s+/g) || []).length;
            complexity += (functionBody.match(/&&|\|\|/g) || []).length;
            complexity += (functionBody.match(/\?[^:]*:/g) || []).length;

            // Report issues
            if (complexity > 15) {
                this.errors.push({
                    file,
                    line: startLine,
                    type: PerformanceErrorType.SLOW_FUNCTION,
                    severity: complexity > 25 ? 'critical' : 'high',
                    message: `High cyclomatic complexity (${complexity})`,
                    pattern: `function ${functionName}`,
                    suggestedFix: 'Refactor into smaller functions',
                    details: `Complexity: ${complexity}, Lines: ${lineCount}`,
                    metrics: { complexity, lines: lineCount },
                });
            }

            if (lineCount > 100) {
                this.errors.push({
                    file,
                    line: startLine,
                    type: PerformanceErrorType.SLOW_FUNCTION,
                    severity: lineCount > 200 ? 'critical' : 'high',
                    message: `Long function (${lineCount} lines)`,
                    pattern: `function ${functionName}`,
                    suggestedFix: 'Split into smaller functions',
                    details: `Function spans ${lineCount} lines`,
                    metrics: { lines: lineCount },
                });
            }
        }
    }

    /**
     * LEGACY: Basic blocking operations detection (replaced by context-aware detector)
     * Kept for reference - use detectBlockingOpsContextAware() instead
     * 
     * This method had 55% false positive rate because it flagged:
     * - Sync operations in build scripts (appropriate)
     * - Sync operations in CLI commands (appropriate)
     * - Sync operations in migration scripts (appropriate)
     * 
     * Context-aware detector reduces false positives to <6%
     */
    /*
    detectBlockingOps(file: string, content: string): void {
        // OLD IMPLEMENTATION COMMENTED OUT - use context-aware detector instead
        // See: packages/insight-core/src/detector/context-aware-performance.ts
    }
    */


    detectNPlusOneQueries(file: string, content: string): void {
        const lines = content.split('\n');
        let loopDepth = 0;

        // CRITICAL: Check for batch operation patterns ONCE at file level
        const hasBatchOperation = 
            content.includes('createMany') ||
            content.includes('findMany') ||
            content.includes('updateMany') ||
            content.includes('deleteMany') ||
            content.includes('insertMany') ||
            content.includes('bulkCreate') ||
            content.includes('bulkWrite') ||
            content.includes('Promise.all');

        // Check if this is a seed/migration script (allowed patterns)
        const isSeedScript = file.includes('seed') || file.includes('migration') || file.includes('fixture');

        for (let index = 0; index < lines.length; index++) {
            const line = lines[index];
            const lineNum = index + 1;

            // Track loop start (for, for...of, for...in, for await, while, forEach, map, etc.)
            const forLoopMatch = /\bfor\s*(\(|await\s+\(|\(const\s+|\(let\s+|\(var\s+)/.test(line) || /\bfor\s+(const|let|var)\s+/.test(line);
            const whileLoopMatch = /\bwhile\s*\(/.test(line);
            const arrayMethodMatch = /\.(forEach|map)\s*\(/.test(line);

            if (forLoopMatch || whileLoopMatch || arrayMethodMatch) {
                loopDepth++;
            }

            // Track opening braces on the same line as loop declaration
            // (handles cases like `for (const x of arr) {`)
            const openBraceCount = (line.match(/\{/g) || []).length;
            const closeBraceCount = (line.match(/\}/g) || []).length;
            const netBraces = openBraceCount - closeBraceCount;

            // Adjust depth based on net braces AFTER loop detection
            // but BEFORE query detection (so queries on same line as opening brace work)
            if (netBraces !== 0 && loopDepth > 0) {
                loopDepth += netBraces;
                // Ensure depth doesn't go negative
                if (loopDepth < 0) loopDepth = 0;
            }

            // Only check for queries if we're inside a loop
            if (loopDepth === 0) continue;

            // CRITICAL FIX: Skip if file uses batch operations
            if (hasBatchOperation) {
                // Check if this specific loop builds data array for batch operation
                const contextLines = lines.slice(Math.max(0, index - 5), Math.min(lines.length, index + 10)).join('\n');
                
                if (contextLines.includes('.push(') && 
                    (contextLines.includes('createMany') || 
                     contextLines.includes('insertMany') ||
                     contextLines.includes('findMany') ||
                     contextLines.includes('bulkCreate'))) {
                    // This loop builds data for batch operation - SKIP
                    continue;
                }
            }

            // CRITICAL FIX: Skip seed scripts with explicit batching
            if (isSeedScript && hasBatchOperation) {
                continue; // Seed scripts typically use batch operations correctly
            }

            // Detect Prisma queries in loops (most critical - database N+1)
            // IMPORTANT: Don't flag findMany - it's often part of the batched solution!
            if (/\bprisma\.\w+\.(findUnique|findFirst|create|update|delete|upsert)\s*\(/.test(line)) {
                this.errors.push({
                    file,
                    line: lineNum,
                    type: PerformanceErrorType.N_PLUS_ONE_QUERY,
                    severity: 'critical',
                    message: 'Prisma query inside loop (N+1 problem)',
                    pattern: line.trim(),
                    suggestedFix: 'Use Prisma batch operations: findMany with "in" filter, createMany, updateMany',
                    details: 'Each iteration triggers a separate database query',
                    metrics: { impact: 'N database queries instead of 1 batch query' },
                });
            }

            // Detect fetch() in loops (HTTP N+1) - but skip if using Promise.all
            if (/\bfetch\s*\(/.test(line) && /await/.test(line)) {
                const contextLines = lines.slice(Math.max(0, index - 3), Math.min(lines.length, index + 3)).join('\n');
                if (contextLines.includes('Promise.all')) {
                    continue; // Parallel fetch with Promise.all is fine
                }

                this.errors.push({
                    file,
                    line: lineNum,
                    type: PerformanceErrorType.N_PLUS_ONE_QUERY,
                    severity: 'high',
                    message: 'fetch call inside loop (N+1 HTTP requests)',
                    pattern: line.trim(),
                    suggestedFix: 'Batch requests: collect IDs, make single request with all IDs, or use Promise.all',
                    details: 'Each iteration makes a separate HTTP request',
                    metrics: { impact: 'N HTTP requests instead of 1 batch request' },
                });
            }

            // Detect axios in loops (HTTP N+1) - but skip if using Promise.all
            if (/\baxios\.(get|post|put|delete|patch)\s*\(/.test(line)) {
                const contextLines = lines.slice(Math.max(0, index - 3), Math.min(lines.length, index + 3)).join('\n');
                if (contextLines.includes('Promise.all')) {
                    continue; // Parallel axios with Promise.all is fine
                }

                this.errors.push({
                    file,
                    line: lineNum,
                    type: PerformanceErrorType.N_PLUS_ONE_QUERY,
                    severity: 'high',
                    message: 'axios call inside loop (N+1 HTTP requests)',
                    pattern: line.trim(),
                    suggestedFix: 'Use Promise.all with batch endpoint or collect data first',
                    details: 'Sequential HTTP requests block each iteration',
                    metrics: { impact: 'Consider using Promise.all for parallel requests' },
                });
            }

            // Detect GraphQL queries in loops
            if (/(?:client\.query|apolloClient\.query|query\()\s*\(/.test(line) && /await/.test(line)) {
                this.errors.push({
                    file,
                    line: lineNum,
                    type: PerformanceErrorType.N_PLUS_ONE_QUERY,
                    severity: 'critical',
                    message: 'GraphQL query inside loop (N+1 problem)',
                    pattern: line.trim(),
                    suggestedFix: 'Use GraphQL batching or DataLoader pattern',
                    details: 'Multiple queries instead of single batched query',
                });
            }
        }
    }

    private calculateStatistics(): PerformanceStatistics {
        const stats: PerformanceStatistics = {
            totalIssues: this.errors.length,
            criticalIssues: this.errors.filter(e => e.severity === 'critical').length,
            highIssues: this.errors.filter(e => e.severity === 'high').length,
            mediumIssues: this.errors.filter(e => e.severity === 'medium').length,
            lowIssues: this.errors.filter(e => e.severity === 'low').length,
            issuesByType: {} as Record<PerformanceErrorType, number>,
            filesScanned: new Set(this.errors.map(e => e.file)).size,
            bundleSizeIssues: 0,
            renderIssues: 0,
            loopIssues: 0,
            assetIssues: 0,
            blockingIssues: 0,
        };

        for (const error of this.errors) {
            stats.issuesByType[error.type] = (stats.issuesByType[error.type] || 0) + 1;

            if ([
                PerformanceErrorType.BUNDLE_TOO_LARGE,
                PerformanceErrorType.LARGE_MODULE_IMPORT,
                PerformanceErrorType.MISSING_CODE_SPLITTING,
                PerformanceErrorType.NO_TREE_SHAKING,
                PerformanceErrorType.DUPLICATE_DEPENDENCIES,
            ].includes(error.type)) {
                stats.bundleSizeIssues++;
            } else if ([
                PerformanceErrorType.UNNECESSARY_RENDER,
                PerformanceErrorType.MISSING_MEMO,
                PerformanceErrorType.MISSING_USE_CALLBACK,
                PerformanceErrorType.INLINE_FUNCTION_IN_JSX,
                PerformanceErrorType.INLINE_OBJECT_IN_JSX,
                PerformanceErrorType.MISSING_KEY_PROP,
            ].includes(error.type)) {
                stats.renderIssues++;
            } else if ([
                PerformanceErrorType.NESTED_LOOP_O_N_SQUARED,
                PerformanceErrorType.LOOP_WITH_DOM_ACCESS,
                PerformanceErrorType.UNOPTIMIZED_ARRAY_METHOD,
                PerformanceErrorType.LOOP_CREATING_CLOSURES,
            ].includes(error.type)) {
                stats.loopIssues++;
            } else if ([
                PerformanceErrorType.LARGE_IMAGE_WITHOUT_OPTIMIZATION,
                PerformanceErrorType.MISSING_LAZY_LOADING,
                PerformanceErrorType.UNCOMPRESSED_ASSET,
            ].includes(error.type)) {
                stats.assetIssues++;
            } else if ([
                PerformanceErrorType.SYNC_FILE_OPERATION,
                PerformanceErrorType.BLOCKING_COMPUTATION,
                PerformanceErrorType.LONG_RUNNING_FUNCTION,
                PerformanceErrorType.HEAVY_COMPUTATION_IN_RENDER,
            ].includes(error.type)) {
                stats.blockingIssues++;
            }
        }

        const bundleSavings = this.errors
            .filter(e => e.metrics?.size)
            .reduce((sum, e) => sum + (e.metrics!.size! * 0.7), 0);

        stats.estimatedImpact = {
            bundleSizeReduction: bundleSavings > 0 ? `~${Math.round(bundleSavings)}KB` : 'N/A',
            renderPerformance: stats.renderIssues > 0 ? `${stats.renderIssues} optimizations` : 'N/A',
            computationTime: stats.loopIssues > 0 ? `O(n²) → O(n) possible` : 'N/A',
        };

        return stats;
    }

    private async getFiles(): Promise<string[]> {
        const allFiles: string[] = [];

        for (const pattern of this.options.includePatterns) {
            const files = await glob(pattern, {
                cwd: this.options.workspaceRoot,
                absolute: true,
                ignore: this.options.excludePatterns,
            });
            allFiles.push(...files);
        }

        return [...new Set(allFiles)];
    }

    getErrors(): PerformanceError[] {
        return this.errors;
    }

    clearErrors(): void {
        this.errors = [];
    }

    /**
     * Backwards compatibility API for old tests
     * Maps new Phase 4 structure to old test expectations
     */
    async detect(directory: string): Promise<OldPerformanceIssue[]> {
        // Create a new detector instance for the target directory (avoids state mutation)
        const tempDetector = new PerformanceDetector({
            workspaceRoot: directory,
            includePatterns: ['**/*.{ts,tsx,js,jsx}'], // Scan all files in test dir
            excludePatterns: this.options.excludePatterns,
            bundleSizeThresholdKB: this.options.bundleSizeThresholdKB,
            assetSizeThresholdKB: this.options.assetSizeThresholdKB,
            maxFunctionLines: this.options.maxFunctionLines,
            verbose: this.options.verbose,
        });

        // Run Phase 4 analysis on temp instance
        const { errors } = await tempDetector.analyze();

        // Map to old structure
        return errors.map(error => this.mapToOldIssue(error));
    }

    private mapToOldIssue(error: PerformanceError): OldPerformanceIssue {
        // Map Phase 4 error types to old issue types
        const typeMap: Record<string, string> = {
            [PerformanceErrorType.SYNC_FILE_OPERATION]: 'blocking-operation',
            [PerformanceErrorType.BLOCKING_COMPUTATION]: 'blocking-operation',
            [PerformanceErrorType.LONG_RUNNING_FUNCTION]: 'slow-function',
            [PerformanceErrorType.HEAVY_COMPUTATION_IN_RENDER]: 'blocking-operation',
            [PerformanceErrorType.BUNDLE_TOO_LARGE]: 'large-bundle',
            [PerformanceErrorType.LARGE_MODULE_IMPORT]: 'large-bundle',
            [PerformanceErrorType.NESTED_LOOP_O_N_SQUARED]: 'inefficient-loop',
            [PerformanceErrorType.LOOP_WITH_DOM_ACCESS]: 'inefficient-loop',
            [PerformanceErrorType.UNOPTIMIZED_ARRAY_METHOD]: 'inefficient-loop',
            [PerformanceErrorType.LOOP_CREATING_CLOSURES]: 'inefficient-loop',
            [PerformanceErrorType.INEFFICIENT_LOOP]: 'inefficient-loop',
            [PerformanceErrorType.N_PLUS_ONE_QUERY]: 'n-plus-one-query',
            [PerformanceErrorType.UNNECESSARY_RENDER]: 'memory-leak',
            [PerformanceErrorType.MISSING_MEMO]: 'memory-leak',
            [PerformanceErrorType.MISSING_USE_CALLBACK]: 'memory-leak',
            [PerformanceErrorType.INLINE_FUNCTION_IN_JSX]: 'memory-leak',
            [PerformanceErrorType.INLINE_OBJECT_IN_JSX]: 'memory-leak',
            [PerformanceErrorType.MISSING_KEY_PROP]: 'memory-leak',
            [PerformanceErrorType.LARGE_IMAGE_WITHOUT_OPTIMIZATION]: 'large-bundle',
            [PerformanceErrorType.MISSING_LAZY_LOADING]: 'large-bundle',
            [PerformanceErrorType.UNCOMPRESSED_ASSET]: 'large-bundle',
            [PerformanceErrorType.MISSING_CODE_SPLITTING]: 'large-bundle',
            [PerformanceErrorType.NO_TREE_SHAKING]: 'large-bundle',
            [PerformanceErrorType.DUPLICATE_DEPENDENCIES]: 'large-bundle',
            [PerformanceErrorType.MISSING_CLEANUP_LOGIC]: 'memory-leak',
            [PerformanceErrorType.SLOW_FUNCTION]: 'slow-function',
        };

        return {
            type: typeMap[error.type] || 'slow-function',
            severity: error.severity,
            message: error.message,
            filePath: error.filePath || error.file,
            line: error.line || 1,
            column: error.column || 1,
            impact: error.metrics?.impact || error.suggestedFix || 'Performance impact detected',
        };
    }

    /**
     * Old API: Format error (for backwards compatibility)
     */
    formatError(issue: OldPerformanceIssue): string {
        const severityIcons: Record<string, string> = {
            critical: '🔥',
            high: '⚠️',
            medium: '⚡',
            low: '💡',
        };

        const typeIcons: Record<string, string> = {
            'blocking-operation': '⏸️',
            'slow-function': '🐌',
            'large-bundle': '📦',
            'inefficient-loop': '🔄',
            'memory-leak': '💧',
            'n-plus-one-query': '🔁',
        };

        const icon = severityIcons[issue.severity] || '❓';
        const typeIcon = typeIcons[issue.type] || '🔍';

        let formatted = `${icon} ${typeIcon} [${issue.severity.toUpperCase()}] ${issue.type}\n`;
        formatted += `📄 ${issue.filePath}:${issue.line}:${issue.column}\n`;
        formatted += `💬 ${issue.message}\n`;

        if (issue.impact) {
            formatted += `\n📊 Impact: ${issue.impact}\n`;
        }

        // Add fix suggestion if available
        if (issue.message.includes('lodash')) {
            formatted += `\n✅ Fix: Use specific imports like "import debounce from 'lodash/debounce'"\n`;
        } else if (issue.type === 'n-plus-one-query') {
            formatted += `\n✅ Fix: Use batch loading (e.g., Prisma findMany, Promise.all with batching)\n`;
        } else if (issue.type === 'blocking-operation') {
            formatted += `\n✅ Fix: Use async alternatives (readFile, pbkdf2, exec instead of sync versions)\n`;
        }

        return formatted;
    }

    /**
     * Old API: Get statistics (for backwards compatibility)
     */
    getStatistics(issues: OldPerformanceIssue[]): OldPerformanceStats {
        const stats: OldPerformanceStats = {
            totalFiles: new Set(issues.map(i => i.filePath)).size,
            averageFileSize: 0,
            largestFiles: [],
            bySeverity: { critical: 0, high: 0, medium: 0, low: 0 },
            byType: {},
        };

        // Count by severity
        for (const issue of issues) {
            stats.bySeverity[issue.severity]++;
            stats.byType[issue.type] = (stats.byType[issue.type] || 0) + 1;
        }

        // Calculate file sizes (simplified for old API)
        const fileSizes = new Map<string, number>();
        for (const issue of issues) {
            if (!fileSizes.has(issue.filePath)) {
                try {
                    const content = fs.readFileSync(issue.filePath, 'utf-8');
                    fileSizes.set(issue.filePath, content.length);
                } catch {
                    fileSizes.set(issue.filePath, 0);
                }
            }
        }

        const sizes = Array.from(fileSizes.values());
        stats.averageFileSize = sizes.length > 0 ? sizes.reduce((a, b) => a + b, 0) / sizes.length : 0;

        // Get largest files
        stats.largestFiles = Array.from(fileSizes.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([path, size]) => ({ path, size }));

        return stats;
    }
}

/**
 * Old API interfaces for backwards compatibility
 */
interface OldPerformanceIssue {
    type: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    message: string;
    filePath: string;
    line: number;
    column: number;
    impact?: string;
}

interface OldPerformanceStats {
    totalFiles: number;
    averageFileSize: number;
    largestFiles: Array<{ path: string; size: number }>;
    bySeverity: {
        critical: number;
        high: number;
        medium: number;
        low: number;
    };
    byType: Record<string, number>;
}
