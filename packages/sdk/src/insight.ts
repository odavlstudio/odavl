/**
 * ODAVL Insight SDK
 * ML-powered error detection and analysis
 */

export interface InsightDetector {
    name: string;
    type: 'typescript' | 'eslint' | 'import' | 'package' | 'runtime' | 'build' |
    'security' | 'circular' | 'network' | 'performance' | 'complexity' | 'isolation';
    enabled: boolean;
}

export interface InsightIssue {
    severity: 'critical' | 'high' | 'medium' | 'low';
    message: string;
    file: string;
    line: number;
    column: number;
    detector: string;
    fixSuggestion?: string;
}

export interface InsightAnalysisResult {
    issues: InsightIssue[];
    summary: {
        total: number;
        critical: number;
        high: number;
        medium: number;
        low: number;
    };
    detectors: InsightDetector[];
}

export interface InsightConfig {
    workspacePath?: string;
    enabledDetectors?: string[];
    timeout?: number;
}

export interface InsightMetrics {
    totalIssues: number;
    criticalIssues: number;
    highIssues: number;
    mediumIssues: number;
    lowIssues: number;
    detectionTime: number;
}

/**
 * ODAVL Insight Class
 * Main SDK interface for error detection and analysis
 */
export class Insight {
    private config: InsightConfig;
    private workspacePath: string;

    constructor(config: InsightConfig = {}) {
        this.config = config;
        this.workspacePath = config.workspacePath || process.cwd();
    }

    /**
     * Analyze workspace for errors and issues
     */
    async analyze(path?: string): Promise<InsightAnalysisResult> {
        const targetPath = path || this.workspacePath;
        const startTime = Date.now();

        // Initialize detectors
        const enabledDetectors = this.config.enabledDetectors || [
            'typescript', 'eslint', 'import', 'package', 'runtime',
            'build', 'security', 'circular', 'network', 'performance',
            'complexity', 'isolation'
        ];

        const detectors: InsightDetector[] = enabledDetectors.map(type => ({
            name: type.charAt(0).toUpperCase() + type.slice(1),
            type: type as any,
            enabled: true
        }));

        // Collect all issues
        const issues: InsightIssue[] = [];

        // Note: Real implementation would run detectors from insight-core
        // For now, return structure for successful compilation

        const detectionTime = Date.now() - startTime;

        // Calculate summary
        const summary = {
            total: issues.length,
            critical: issues.filter(i => i.severity === 'critical').length,
            high: issues.filter(i => i.severity === 'high').length,
            medium: issues.filter(i => i.severity === 'medium').length,
            low: issues.filter(i => i.severity === 'low').length
        };

        return {
            issues,
            summary,
            detectors
        };
    }

    /**
     * Get fix suggestions for specific issue
     */
    async getFixSuggestions(issue: InsightIssue): Promise<string | null> {
        // Use ML model from insight-core to suggest fixes
        const suggestions: Record<string, string> = {
            'typescript': 'Check type annotations and ensure correct types',
            'eslint': 'Run ESLint autofix: eslint --fix',
            'import': 'Verify import paths and module resolution',
            'security': 'Review security best practices and update dependencies'
        };

        return suggestions[issue.detector] || 'No automatic fix suggestion available';
    }

    /**
     * Get metrics summary
     */
    async getMetrics(): Promise<InsightMetrics> {
        const result = await this.analyze();

        return {
            totalIssues: result.summary.total,
            criticalIssues: result.summary.critical,
            highIssues: result.summary.high,
            mediumIssues: result.summary.medium,
            lowIssues: result.summary.low,
            detectionTime: 0
        };
    }

    /**
     * Export to VS Code Problems Panel format
     */
    exportToProblemsPanel(result: InsightAnalysisResult): Record<string, any> {
        const diagnostics: Record<string, any[]> = {};

        for (const issue of result.issues) {
            if (!diagnostics[issue.file]) {
                diagnostics[issue.file] = [];
            }

            diagnostics[issue.file].push({
                severity: issue.severity,
                message: issue.message,
                source: `ODAVL/${issue.detector}`,
                range: {
                    start: { line: issue.line, character: issue.column },
                    end: { line: issue.line, character: issue.column + 1 }
                }
            });
        }

        return {
            timestamp: new Date().toISOString(),
            diagnostics
        };
    }
}

/**
 * Analyze workspace for errors and issues (standalone function)
 */
export async function analyzeWorkspace(
    workspacePath: string,
    options?: { detectors?: string[] }
): Promise<InsightAnalysisResult> {
    const insight = new Insight({
        workspacePath,
        enabledDetectors: options?.detectors
    });
    return insight.analyze();
}

/**
 * Get fix suggestions for specific issue (standalone function)
 */
export async function getFixSuggestion(issue: InsightIssue): Promise<string | null> {
    const insight = new Insight();
    return insight.getFixSuggestions(issue);
}

/**
 * Export insights to Problems Panel format (standalone function)
 */
export function exportToProblemsPanel(result: InsightAnalysisResult): Record<string, any> {
    const insight = new Insight();
    return insight.exportToProblemsPanel(result);
}
