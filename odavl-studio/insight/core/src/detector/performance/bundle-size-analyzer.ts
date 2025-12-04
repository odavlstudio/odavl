/**
 * Bundle Size Analyzer - ODAVL Insight
 * Detects bundle size issues and large module imports
 */

import { PerformanceErrorType } from '../performance-detector';

export interface BundleSizeIssue {
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
        impact?: string;
    };
}

export class BundleSizeAnalyzer {
    private readonly workspaceRoot: string;

    constructor(workspaceRoot: string) {
        this.workspaceRoot = workspaceRoot;
    }

    /**
     * Detect bundle size issues from import patterns
     */
    detect(file: string, content: string): BundleSizeIssue[] {
        const issues: BundleSizeIssue[] = [];
        const lines = content.split('\n');

        lines.forEach((line, index) => {
            const lineNum = index + 1;

            // 1. Import entire large library (lodash, moment, rxjs, etc.)
            if (this.detectLargeLibraryImport(line)) {
                issues.push({
                    file,
                    line: lineNum,
                    type: PerformanceErrorType.LARGE_MODULE_IMPORT,
                    severity: 'high',
                    message: 'Importing entire large library',
                    pattern: line.trim(),
                    suggestedFix: 'import { debounce } from "lodash" (tree-shakeable)',
                    details: 'Namespace imports prevent tree-shaking and increase bundle size',
                });
            }

            // 2. Full lodash import
            if (/import\s+_\s+from\s+['"]lodash['"]/.test(line)) {
                issues.push({
                    file,
                    line: lineNum,
                    type: PerformanceErrorType.LARGE_MODULE_IMPORT,
                    severity: 'high',
                    message: 'Full lodash import (72KB+ gzipped)',
                    pattern: line.trim(),
                    suggestedFix: 'import debounce from "lodash/debounce"',
                    details: 'Use per-method imports to reduce bundle size',
                    metrics: { size: 72, threshold: 10 },
                });
            }

            // 3. Moment.js import (large legacy library)
            if (/import\s+.*\s+from\s+['"]moment['"]/.test(line)) {
                issues.push({
                    file,
                    line: lineNum,
                    type: PerformanceErrorType.LARGE_MODULE_IMPORT,
                    severity: 'high',
                    message: 'Moment.js is large (67KB+ minified)',
                    pattern: line.trim(),
                    suggestedFix: 'Consider date-fns (2KB) or dayjs (2KB)',
                    details: 'Modern alternatives provide similar API with 97% smaller bundle size',
                    metrics: { size: 67, threshold: 12 },
                });
            }

            // 4. Full @material-ui/core import
            if (/import\s+.*\s+from\s+['"]@material-ui\/core['"]/.test(line)) {
                issues.push({
                    file,
                    line: lineNum,
                    type: PerformanceErrorType.LARGE_MODULE_IMPORT,
                    severity: 'high',
                    message: 'Importing from @material-ui/core barrel',
                    pattern: line.trim(),
                    suggestedFix: 'import Button from "@material-ui/core/Button"',
                    details: 'Barrel imports prevent tree-shaking',
                });
            }

            // 5. Full @mui/material import
            if (/import\s+.*\s+from\s+['"]@mui\/material['"]/.test(line)) {
                issues.push({
                    file,
                    line: lineNum,
                    type: PerformanceErrorType.LARGE_MODULE_IMPORT,
                    severity: 'high',
                    message: 'Importing from @mui/material barrel',
                    pattern: line.trim(),
                    suggestedFix: 'import { Button } from "@mui/material/Button"',
                    details: 'Use direct component imports for better tree-shaking',
                });
            }

            // 6. Axios default import (includes all features)
            if (/import\s+axios\s+from\s+['"]axios['"]/.test(line)) {
                issues.push({
                    file,
                    line: lineNum,
                    type: PerformanceErrorType.LARGE_MODULE_IMPORT,
                    severity: 'medium',
                    message: 'Full axios import (13KB minified)',
                    pattern: line.trim(),
                    suggestedFix: 'Consider native fetch() or axios.create() with only needed interceptors',
                    details: 'Axios includes many features you might not need',
                    metrics: { size: 13, threshold: 5 },
                });
            }

            // 7. Chart.js full import
            if (/import\s+.*\s+from\s+['"]chart\.js['"]/.test(line)) {
                issues.push({
                    file,
                    line: lineNum,
                    type: PerformanceErrorType.LARGE_MODULE_IMPORT,
                    severity: 'medium',
                    message: 'Chart.js full import (~200KB)',
                    pattern: line.trim(),
                    suggestedFix: 'Import specific chart types: import { Chart, registerables } from "chart.js"',
                    details: 'Register only the components you need',
                    metrics: { size: 200, threshold: 50 },
                });
            }
        });

        return issues;
    }

    /**
     * Detect namespace imports of large libraries
     */
    private detectLargeLibraryImport(line: string): boolean {
        const largeLibraries = [
            'lodash',
            'moment',
            'rxjs',
            '@material-ui/core',
            '@mui/material',
            'antd',
            'semantic-ui-react',
        ];

        // Pattern: import * as Something from "library"
        const namespaceImportRegex = /import\s+\*\s+as\s+\w+\s+from\s+['"]([^'"]+)['"]/;
        const match = line.match(namespaceImportRegex);

        if (match) {
            const importPath = match[1];
            return largeLibraries.some(lib => importPath === lib || importPath.startsWith(`${lib}/`));
        }

        return false;
    }

    /**
     * Analyze if code splitting is recommended based on file imports
     */
    analyzeCodeSplittingOpportunities(file: string, content: string): BundleSizeIssue[] {
        const issues: BundleSizeIssue[] = [];
        const lines = content.split('\n');

        // Check for route components that should be lazy-loaded
        const hasRouteDefinition = content.includes('Route ') || content.includes('<Route');
        const hasLazyImport = content.includes('React.lazy') || content.includes('lazy(');

        if (hasRouteDefinition && !hasLazyImport) {
            const importLines = lines.filter(line => /^import\s+.*\s+from/.test(line.trim()));
            const componentImports = importLines.filter(line => 
                /\.(tsx|jsx)['"]$/.test(line) && 
                !line.includes('Layout') &&
                !line.includes('App')
            );

            if (componentImports.length > 3) {
                issues.push({
                    file,
                    line: 1,
                    type: PerformanceErrorType.MISSING_CODE_SPLITTING,
                    severity: 'medium',
                    message: `${componentImports.length} route components imported synchronously`,
                    pattern: 'import Component from "./Component"',
                    suggestedFix: 'const Component = React.lazy(() => import("./Component"))',
                    details: 'Code splitting reduces initial bundle size and improves Time to Interactive',
                });
            }
        }

        return issues;
    }
}
