/**
 * React Render Optimizer - ODAVL Insight
 * Detects unnecessary re-renders and React performance anti-patterns
 */

import { PerformanceErrorType } from '../performance-detector';

export interface ReactRenderIssue {
    file: string;
    line: number;
    type: PerformanceErrorType;
    severity: 'critical' | 'high' | 'medium' | 'low';
    message: string;
    pattern: string;
    suggestedFix: string;
    details?: string;
}

export class ReactRenderOptimizer {
    private readonly workspaceRoot: string;

    constructor(workspaceRoot: string) {
        this.workspaceRoot = workspaceRoot;
    }

    /**
     * Detect React render performance issues
     */
    detect(file: string, content: string): ReactRenderIssue[] {
        // Only analyze React/JSX files
        if (!/\.(tsx|jsx)$/.test(file)) {
            return [];
        }

        // Skip test files - performance less critical in tests
        if (file.includes('.test.') || file.includes('.spec.') || file.includes('__tests__')) {
            return [];
        }

        const issues: ReactRenderIssue[] = [];
        const lines = content.split('\n');
        const fileSize = lines.length;

        // Context analysis
        const hasUseCallback = content.includes('useCallback');
        const hasUseMemo = content.includes('useMemo');
        const hasMemo = content.includes('React.memo') || /^import.*\bmemo\b/.test(content);

        lines.forEach((line, index) => {
            const lineNum = index + 1;

            // 1. Inline arrow functions in event handlers
            const inlineFunctionIssue = this.detectInlineFunctions(
                file, line, lineNum, fileSize, hasUseCallback
            );
            if (inlineFunctionIssue) issues.push(inlineFunctionIssue);

            // 2. Inline style objects
            const inlineStyleIssue = this.detectInlineStyles(
                file, line, lineNum, fileSize, hasUseMemo
            );
            if (inlineStyleIssue) issues.push(inlineStyleIssue);

            // 3. Missing key prop in .map()
            const missingKeyIssue = this.detectMissingKeys(file, lines, index, lineNum);
            if (missingKeyIssue) issues.push(missingKeyIssue);

            // 4. Large component without React.memo
            if (index === 0 && fileSize > 150 && !hasMemo) {
                const componentMatch = content.match(/^export\s+(default\s+)?function\s+(\w+)|^export\s+(default\s+)?const\s+(\w+)\s*=/m);
                if (componentMatch) {
                    issues.push({
                        file,
                        line: 1,
                        type: PerformanceErrorType.MISSING_MEMO,
                        severity: fileSize > 300 ? 'medium' : 'low',
                        message: `Large component (${fileSize} lines) without React.memo`,
                        pattern: componentMatch[0],
                        suggestedFix: 'export default React.memo(MyComponent)',
                        details: 'Prevents unnecessary re-renders when props don\'t change',
                    });
                }
            }
        });

        return issues;
    }

    /**
     * Detect inline arrow functions in JSX event handlers
     */
    private detectInlineFunctions(
        file: string,
        line: string,
        lineNum: number,
        fileSize: number,
        hasUseCallback: boolean
    ): ReactRenderIssue | null {
        // Pattern: <Component onClick={() => ...} />
        if (!/<\w+[^>]*\s+(?:onClick|onChange|onSubmit|onFocus|onBlur|onKeyDown|onKeyPress)=\{[^}]*=>/.test(line)) {
            return null;
        }

        // Skip simple state setters (performance impact negligible)
        // Examples: onClick={() => setOpen(true)}, onChange={(e) => setValue(e.target.value)}
        if (/=\{[^}]*\b(set\w+|toggle\w+)\([^)]*\)\s*\}/.test(line)) {
            return null;
        }

        // Skip simple expressions (no function body)
        // Example: onClick={() => console.log('clicked')}
        if (/=\{[^}]*=>\s*[^{][^}]*\}/.test(line) && line.length < 80) {
            return null;
        }

        // Calculate severity based on context
        let severity: 'critical' | 'high' | 'medium' | 'low' = 'low';

        // Large files likely have frequent re-renders
        if (fileSize > 100) severity = 'medium';
        if (fileSize > 300) severity = 'high';

        // Already using useCallback elsewhere = developer is aware
        if (hasUseCallback) severity = 'low';

        return {
            file,
            line: lineNum,
            type: PerformanceErrorType.INLINE_FUNCTION_IN_JSX,
            severity,
            message: 'Inline arrow function in JSX event handler',
            pattern: line.trim(),
            suggestedFix: 'const handleClick = useCallback(() => { ... }, [deps])',
            details: `Component size: ${fileSize} lines. Creates new function on every render.`,
        };
    }

    /**
     * Detect inline style objects in JSX
     */
    private detectInlineStyles(
        file: string,
        line: string,
        lineNum: number,
        fileSize: number,
        hasUseMemo: boolean
    ): ReactRenderIssue | null {
        // Pattern: <Component style={{ ... }} />
        if (!/<\w+[^>]*\s+style=\{\{/.test(line)) {
            return null;
        }

        // Check complexity of style object
        const styleMatch = line.match(/style=\{\{([^}]+)\}\}/);
        if (styleMatch) {
            const styleContent = styleMatch[1];
            const propCount = (styleContent.match(/:/g) || []).length;

            // Skip simple static styles (acceptable performance impact)
            // Example: style={{ color: 'red', fontSize: 16 }}
            if (propCount <= 2 && 
                !styleContent.includes('${') && 
                !styleContent.includes('props.') &&
                !styleContent.includes('state.')
            ) {
                return null;
            }
        }

        // Calculate severity
        let severity: 'critical' | 'high' | 'medium' | 'low' = 'low';
        if (fileSize > 100) severity = 'medium';
        if (hasUseMemo) severity = 'low'; // Already optimizing elsewhere

        return {
            file,
            line: lineNum,
            type: PerformanceErrorType.INLINE_OBJECT_IN_JSX,
            severity,
            message: 'Complex inline style object in JSX',
            pattern: line.trim(),
            suggestedFix: 'const styles = useMemo(() => ({ ... }), [deps]) or use CSS modules',
            details: 'Creates new object reference on every render, causing child re-renders',
        };
    }

    /**
     * Detect missing key prop in .map() list rendering
     */
    private detectMissingKeys(
        file: string,
        lines: string[],
        index: number,
        lineNum: number
    ): ReactRenderIssue | null {
        const line = lines[index];

        // Pattern: .map(...) => <Component />
        if (!/\.map\([^)]*=>\s*</.test(line)) {
            return null;
        }

        // Check current line and next 2 lines for key prop (handle multi-line JSX)
        const contextLines = lines.slice(index, index + 3).join('\n');

        if (contextLines.includes('key=')) {
            return null; // Key prop found
        }

        return {
            file,
            line: lineNum,
            type: PerformanceErrorType.MISSING_KEY_PROP,
            severity: 'high', // Critical for React's reconciliation algorithm
            message: 'Missing key prop in .map() list rendering',
            pattern: line.trim(),
            suggestedFix: 'items.map(item => <Component key={item.id} />)',
            details: 'React cannot efficiently update lists without unique keys. Use stable IDs, not array indices.',
        };
    }

    /**
     * Detect heavy computations in render that should use useMemo
     */
    detectHeavyComputations(file: string, content: string): ReactRenderIssue[] {
        const issues: ReactRenderIssue[] = [];
        const lines = content.split('\n');

        lines.forEach((line, index) => {
            const lineNum = index + 1;

            // Heavy array operations in render body (not in useEffect/useMemo)
            const heavyOperations = [
                /\.sort\(/,
                /\.filter\([^)]+\)\.map\(/,  // Chained operations
                /\.reduce\(/,
                /JSON\.parse\(/,
                /JSON\.stringify\(/,
            ];

            const isInRenderBody = !line.includes('useEffect') && 
                                    !line.includes('useMemo') && 
                                    !line.includes('useCallback');

            if (isInRenderBody) {
                for (const pattern of heavyOperations) {
                    if (pattern.test(line)) {
                        issues.push({
                            file,
                            line: lineNum,
                            type: PerformanceErrorType.HEAVY_COMPUTATION_IN_RENDER,
                            severity: 'medium',
                            message: 'Heavy computation in render',
                            pattern: line.trim(),
                            suggestedFix: 'const result = useMemo(() => heavyComputation(), [deps])',
                            details: 'Computation runs on every render. Memoize expensive operations.',
                        });
                        break;
                    }
                }
            }
        });

        return issues;
    }
}
