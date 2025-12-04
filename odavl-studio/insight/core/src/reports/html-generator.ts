/**
 * HTML Report Generator for ODAVL Insight
 * 
 * Generates interactive HTML reports with:
 * - Chart.js visualizations (error distribution, severity trends, file heatmap)
 * - Detailed issue tables with filtering and sorting
 * - Executive summary with key metrics
 * - Responsive design with dark mode support
 * 
 * Usage:
 *   const generator = new HTMLReportGenerator();
 *   const html = generator.generate(diagnostics, options);
 *   fs.writeFileSync('report.html', html);
 */

export interface HTMLReportDiagnostic {
    file: string;
    line: number;
    message: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    source: string;
    code?: string;
}

export interface HTMLReportOptions {
    title?: string;
    workspaceRoot?: string;
    timestamp?: string;
    includeCharts?: boolean;
    darkMode?: boolean;
    customCSS?: string;
}

export class HTMLReportGenerator {
    /**
     * Generate complete HTML report from diagnostics data
     */
    generate(diagnostics: Record<string, HTMLReportDiagnostic[]>, options: HTMLReportOptions = {}): string {
        const {
            title = 'ODAVL Insight Report',
            workspaceRoot = 'Workspace',
            timestamp = new Date().toISOString(),
            includeCharts = true,
            darkMode = false,
            customCSS = ''
        } = options;

        const stats = this.calculateStats(diagnostics);
        const chartData = includeCharts ? this.prepareChartData(diagnostics) : null;

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${this.escape(title)}</title>
    ${this.getStyles(darkMode, customCSS)}
    ${includeCharts ? this.getChartJS() : ''}
</head>
<body${darkMode ? ' class="dark-mode"' : ''}>
    <div class="container">
        ${this.generateHeader(title, workspaceRoot, timestamp)}
        ${this.generateExecutiveSummary(stats)}
        ${includeCharts ? this.generateCharts(chartData!) : ''}
        ${this.generateIssuesTable(diagnostics)}
        ${this.generateFooter()}
    </div>
    ${includeCharts ? this.getChartScripts(chartData!) : ''}
</body>
</html>`;
    }

    /**
     * Calculate statistics from diagnostics
     */
    private calculateStats(diagnostics: Record<string, HTMLReportDiagnostic[]>): {
        totalIssues: number;
        criticalCount: number;
        highCount: number;
        mediumCount: number;
        lowCount: number;
        filesAffected: number;
        topIssueTypes: Array<{ source: string; count: number }>;
        mostAffectedFiles: Array<{ file: string; count: number }>;
    } {
        const allIssues = Object.values(diagnostics).flat();
        const filesAffected = Object.keys(diagnostics).length;

        const severityCounts = {
            critical: allIssues.filter(d => d.severity === 'critical').length,
            high: allIssues.filter(d => d.severity === 'high').length,
            medium: allIssues.filter(d => d.severity === 'medium').length,
            low: allIssues.filter(d => d.severity === 'low').length
        };

        // Top issue types
        const sourceMap = new Map<string, number>();
        for (const issue of allIssues) {
            sourceMap.set(issue.source, (sourceMap.get(issue.source) || 0) + 1);
        }
        const topIssueTypes = Array.from(sourceMap.entries())
            .map(([source, count]) => ({ source, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

        // Most affected files
        const fileMap = new Map<string, number>();
        for (const [file, issues] of Object.entries(diagnostics)) {
            fileMap.set(file, issues.length);
        }
        const mostAffectedFiles = Array.from(fileMap.entries())
            .map(([file, count]) => ({ file, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);

        return {
            totalIssues: allIssues.length,
            criticalCount: severityCounts.critical,
            highCount: severityCounts.high,
            mediumCount: severityCounts.medium,
            lowCount: severityCounts.low,
            filesAffected,
            topIssueTypes,
            mostAffectedFiles
        };
    }

    /**
     * Prepare data for Chart.js visualizations
     */
    private prepareChartData(diagnostics: Record<string, HTMLReportDiagnostic[]>): {
        severityDistribution: { labels: string[]; data: number[] };
        issuesBySource: { labels: string[]; data: number[] };
        fileHeatmap: { labels: string[]; data: number[] };
    } {
        const allIssues = Object.values(diagnostics).flat();

        // Severity distribution
        const severityCounts = {
            Critical: allIssues.filter(d => d.severity === 'critical').length,
            High: allIssues.filter(d => d.severity === 'high').length,
            Medium: allIssues.filter(d => d.severity === 'medium').length,
            Low: allIssues.filter(d => d.severity === 'low').length
        };

        // Issues by source
        const sourceMap = new Map<string, number>();
        for (const issue of allIssues) {
            sourceMap.set(issue.source, (sourceMap.get(issue.source) || 0) + 1);
        }
        const topSources = Array.from(sourceMap.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10);

        // File heatmap (top 15 files)
        const fileMap = new Map<string, number>();
        for (const [file, issues] of Object.entries(diagnostics)) {
            fileMap.set(file, issues.length);
        }
        const topFiles = Array.from(fileMap.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 15);

        return {
            severityDistribution: {
                labels: Object.keys(severityCounts),
                data: Object.values(severityCounts)
            },
            issuesBySource: {
                labels: topSources.map(([source]) => source),
                data: topSources.map(([, count]) => count)
            },
            fileHeatmap: {
                labels: topFiles.map(([file]) => this.shortenPath(file)),
                data: topFiles.map(([, count]) => count)
            }
        };
    }

    /**
     * Generate HTML header section
     */
    private generateHeader(title: string, workspaceRoot: string, timestamp: string): string {
        return `
        <header class="header">
            <div class="header-content">
                <h1>${this.escape(title)}</h1>
                <div class="header-meta">
                    <span><strong>Workspace:</strong> ${this.escape(workspaceRoot)}</span>
                    <span><strong>Generated:</strong> ${this.formatTimestamp(timestamp)}</span>
                </div>
            </div>
        </header>`;
    }

    /**
     * Generate executive summary section
     */
    private generateExecutiveSummary(stats: ReturnType<typeof this.calculateStats>): string {
        const healthScore = this.calculateHealthScore(stats);
        let healthClass: string;
        if (healthScore >= 80) {
            healthClass = 'good';
        } else if (healthScore >= 60) {
            healthClass = 'medium';
        } else {
            healthClass = 'poor';
        }

        return `
        <section class="summary">
            <h2>Executive Summary</h2>
            <div class="summary-grid">
                <div class="summary-card health-${healthClass}">
                    <div class="card-label">Health Score</div>
                    <div class="card-value">${healthScore}/100</div>
                </div>
                <div class="summary-card">
                    <div class="card-label">Total Issues</div>
                    <div class="card-value">${stats.totalIssues}</div>
                </div>
                <div class="summary-card severity-critical">
                    <div class="card-label">Critical</div>
                    <div class="card-value">${stats.criticalCount}</div>
                </div>
                <div class="summary-card severity-high">
                    <div class="card-label">High</div>
                    <div class="card-value">${stats.highCount}</div>
                </div>
                <div class="summary-card severity-medium">
                    <div class="card-label">Medium</div>
                    <div class="card-value">${stats.mediumCount}</div>
                </div>
                <div class="summary-card severity-low">
                    <div class="card-label">Low</div>
                    <div class="card-value">${stats.lowCount}</div>
                </div>
            </div>
            <div class="top-issues">
                <div class="top-issues-column">
                    <h3>Top Issue Types</h3>
                    <ul>
                        ${stats.topIssueTypes.map(({ source, count }) => {
            const plural = count === 1 ? '' : 's';
            return `<li><strong>${this.escape(source)}:</strong> ${count} issue${plural}</li>`;
        }).join('')}
                    </ul>
                </div>
                <div class="top-issues-column">
                    <h3>Most Affected Files</h3>
                    <ul>
                        ${stats.mostAffectedFiles.slice(0, 5).map(({ file, count }) =>
            `<li><code>${this.escape(this.shortenPath(file))}</code> (${count})</li>`
        ).join('')}
                    </ul>
                </div>
            </div>
        </section>`;
    }

    /**
     * Generate charts section
     */
    private generateCharts(_chartData: ReturnType<typeof this.prepareChartData>): string {
        return `
        <section class="charts">
            <h2>Visual Analysis</h2>
            <div class="chart-grid">
                <div class="chart-container">
                    <h3>Severity Distribution</h3>
                    <canvas id="severityChart"></canvas>
                </div>
                <div class="chart-container">
                    <h3>Issues by Source</h3>
                    <canvas id="sourceChart"></canvas>
                </div>
                <div class="chart-container chart-full-width">
                    <h3>File Heatmap (Top 15)</h3>
                    <canvas id="fileChart"></canvas>
                </div>
            </div>
        </section>`;
    }

    /**
     * Generate issues table section
     */
    private generateIssuesTable(diagnostics: Record<string, HTMLReportDiagnostic[]>): string {
        const allIssues = Object.values(diagnostics)
            .flat(1)
            .sort((a, b) => {
                const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
                return severityOrder[a.severity] - severityOrder[b.severity];
            });

        return `
        <section class="issues">
            <h2>Detailed Issues</h2>
            <div class="table-container">
                <table class="issues-table">
                    <thead>
                        <tr>
                            <th>Severity</th>
                            <th>File</th>
                            <th>Line</th>
                            <th>Source</th>
                            <th>Message</th>
                            <th>Code</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${allIssues.map(issue => `
                        <tr class="severity-${issue.severity}">
                            <td><span class="badge badge-${issue.severity}">${this.escape(issue.severity)}</span></td>
                            <td><code>${this.escape(this.shortenPath(issue.file))}</code></td>
                            <td>${issue.line}</td>
                            <td><span class="source-tag">${this.escape(issue.source)}</span></td>
                            <td>${this.escape(issue.message)}</td>
                            <td>${issue.code ? `<code>${this.escape(issue.code)}</code>` : '-'}</td>
                        </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </section>`;
    }

    /**
     * Generate footer section
     */
    private generateFooter(): string {
        return `
        <footer class="footer">
            <p>Generated by <strong>ODAVL Insight</strong> • <a href="https://odavl.dev" target="_blank">odavl.dev</a></p>
        </footer>`;
    }

    /**
     * Get Chart.js CDN script
     */
    private getChartJS(): string {
        return '<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js"></script>';
    }

    /**
     * Get Chart.js initialization scripts
     */
    private getChartScripts(chartData: ReturnType<typeof this.prepareChartData>): string {
        return `
    <script>
        // Severity Distribution Chart
        new Chart(document.getElementById('severityChart'), {
            type: 'doughnut',
            data: {
                labels: ${JSON.stringify(chartData.severityDistribution.labels)},
                datasets: [{
                    data: ${JSON.stringify(chartData.severityDistribution.data)},
                    backgroundColor: ['#dc2626', '#f59e0b', '#3b82f6', '#10b981']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom' }
                }
            }
        });

        // Issues by Source Chart
        new Chart(document.getElementById('sourceChart'), {
            type: 'bar',
            data: {
                labels: ${JSON.stringify(chartData.issuesBySource.labels)},
                datasets: [{
                    label: 'Issues',
                    data: ${JSON.stringify(chartData.issuesBySource.data)},
                    backgroundColor: '#6366f1'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: { beginAtZero: true }
                }
            }
        });

        // File Heatmap Chart
        new Chart(document.getElementById('fileChart'), {
            type: 'bar',
            data: {
                labels: ${JSON.stringify(chartData.fileHeatmap.labels)},
                datasets: [{
                    label: 'Issues per File',
                    data: ${JSON.stringify(chartData.fileHeatmap.data)},
                    backgroundColor: '#ec4899'
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    x: { beginAtZero: true }
                }
            }
        });
    </script>`;
    }

    /**
     * Get CSS styles
     */
    private getStyles(darkMode: boolean, customCSS: string): string {
        const baseStyles = `
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', sans-serif;
            line-height: 1.6;
            color: #1f2937;
            background: #f9fafb;
            padding: 2rem 1rem;
        }
        .container {
            max-width: 1400px;
            margin: 0 auto;
            background: white;
            border-radius: 8px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 2rem;
        }
        .header h1 {
            font-size: 2rem;
            margin-bottom: 0.5rem;
        }
        .header-meta {
            display: flex;
            gap: 2rem;
            font-size: 0.9rem;
            opacity: 0.9;
        }
        section {
            padding: 2rem;
            border-bottom: 1px solid #e5e7eb;
        }
        section:last-of-type {
            border-bottom: none;
        }
        h2 {
            font-size: 1.5rem;
            margin-bottom: 1.5rem;
            color: #111827;
        }
        h3 {
            font-size: 1.1rem;
            margin-bottom: 1rem;
            color: #374151;
        }
        .summary-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 1rem;
            margin-bottom: 2rem;
        }
        .summary-card {
            background: #f3f4f6;
            padding: 1.5rem;
            border-radius: 8px;
            text-align: center;
        }
        .card-label {
            font-size: 0.875rem;
            color: #6b7280;
            margin-bottom: 0.5rem;
        }
        .card-value {
            font-size: 2rem;
            font-weight: bold;
            color: #111827;
        }
        .health-good { background: #d1fae5; }
        .health-good .card-value { color: #047857; }
        .health-medium { background: #fef3c7; }
        .health-medium .card-value { color: #b45309; }
        .health-poor { background: #fee2e2; }
        .health-poor .card-value { color: #b91c1c; }
        .severity-critical { background: #fee2e2; }
        .severity-critical .card-value { color: #dc2626; }
        .severity-high { background: #fef3c7; }
        .severity-high .card-value { color: #f59e0b; }
        .severity-medium { background: #dbeafe; }
        .severity-medium .card-value { color: #3b82f6; }
        .severity-low { background: #d1fae5; }
        .severity-low .card-value { color: #10b981; }
        .top-issues {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 2rem;
        }
        .top-issues ul {
            list-style: none;
        }
        .top-issues li {
            padding: 0.5rem 0;
            border-bottom: 1px solid #e5e7eb;
        }
        .top-issues li:last-child {
            border-bottom: none;
        }
        .chart-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
            gap: 2rem;
        }
        .chart-container {
            background: #f9fafb;
            padding: 1.5rem;
            border-radius: 8px;
            height: 300px;
        }
        .chart-full-width {
            grid-column: 1 / -1;
            height: 400px;
        }
        .table-container {
            overflow-x: auto;
        }
        .issues-table {
            width: 100%;
            border-collapse: collapse;
        }
        .issues-table th {
            background: #f3f4f6;
            padding: 0.75rem;
            text-align: left;
            font-weight: 600;
            border-bottom: 2px solid #e5e7eb;
        }
        .issues-table td {
            padding: 0.75rem;
            border-bottom: 1px solid #e5e7eb;
        }
        .issues-table tr:hover {
            background: #f9fafb;
        }
        .badge {
            padding: 0.25rem 0.75rem;
            border-radius: 9999px;
            font-size: 0.75rem;
            font-weight: 600;
            text-transform: uppercase;
        }
        .badge-critical { background: #fca5a5; color: #7f1d1d; }
        .badge-high { background: #fcd34d; color: #78350f; }
        .badge-medium { background: #93c5fd; color: #1e3a8a; }
        .badge-low { background: #6ee7b7; color: #064e3b; }
        .source-tag {
            padding: 0.25rem 0.5rem;
            background: #e0e7ff;
            border-radius: 4px;
            font-size: 0.875rem;
            color: #4338ca;
        }
        code {
            font-family: 'Courier New', monospace;
            font-size: 0.875rem;
            background: #f3f4f6;
            padding: 0.125rem 0.25rem;
            border-radius: 3px;
        }
        .footer {
            text-align: center;
            padding: 2rem;
            background: #f9fafb;
            color: #6b7280;
            font-size: 0.875rem;
        }
        .footer a {
            color: #6366f1;
            text-decoration: none;
        }
        .footer a:hover {
            text-decoration: underline;
        }
        ${darkMode ? this.getDarkModeStyles() : ''}
        ${customCSS}
    </style>`;
        return baseStyles;
    }

    /**
     * Get dark mode CSS overrides
     */
    private getDarkModeStyles(): string {
        return `
        body.dark-mode {
            background: #111827;
            color: #f9fafb;
        }
        .dark-mode .container {
            background: #1f2937;
        }
        .dark-mode h2,
        .dark-mode h3,
        .dark-mode .card-value {
            color: #f9fafb;
        }
        .dark-mode .summary-card {
            background: #374151;
        }
        .dark-mode .chart-container {
            background: #374151;
        }
        .dark-mode .issues-table th {
            background: #374151;
        }
        .dark-mode .issues-table tr:hover {
            background: #374151;
        }
        .dark-mode code {
            background: #374151;
        }
        .dark-mode .footer {
            background: #1f2937;
            color: #9ca3af;
        }`;
    }

    /**
     * Calculate health score (0-100) based on issue distribution
     */
    private calculateHealthScore(stats: ReturnType<typeof this.calculateStats>): number {
        const { totalIssues, criticalCount, highCount, mediumCount, lowCount } = stats;
        if (totalIssues === 0) return 100;

        // Weighted penalties
        const penalty = (criticalCount * 10) + (highCount * 5) + (mediumCount * 2) + (lowCount * 1);
        const maxScore = 100;
        const score = Math.max(0, maxScore - penalty);
        return Math.round(score);
    }

    /**
     * Shorten file path for display (show last 3 segments)
     */
    private shortenPath(filePath: string): string {
        const segments = filePath.split(/[/\\]/);
        if (segments.length <= 3) return filePath;
        return `.../${segments.slice(-3).join('/')}`;
    }

    /**
     * Format ISO timestamp to readable format
     */
    private formatTimestamp(timestamp: string): string {
        const date = new Date(timestamp);
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    /**
     * Escape HTML special characters
     */
    private escape(text: string): string {
        return text
            .replaceAll('&', '&amp;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;')
            .replaceAll('"', '&quot;')
            .replaceAll("'", '&#039;');
    }
}
