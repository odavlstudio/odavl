/**
 * @fileoverview Advanced Dashboard Generator
 * Generates comprehensive HTML dashboards with interactive visualizations
 * Provides executive summaries, detailed metrics, and actionable insights
 * 
 * Features:
 * - Executive summary dashboard
 * - Interactive charts (Chart.js)
 * - Severity distribution
 * - Trend visualizations
 * - File heatmaps
 * - Category breakdowns
 * - Historical comparisons
 * - Export to HTML/PDF
 * - Responsive design
 * - Dark/light themes
 * 
 * @module reporting/advanced-dashboard
 */

import type { AnalysisResult, Issue } from '../types';
import type { TrendAnalysisResult } from './trend-analysis';
import type { ComparisonResult } from './historical-comparison';

// ============================================================================
// Types & Interfaces
// ============================================================================

/**
 * Dashboard configuration
 */
export interface DashboardConfig {
  /** Current analysis result */
  current: AnalysisResult;
  
  /** Trend analysis (optional) */
  trends?: TrendAnalysisResult;
  
  /** Historical comparison (optional) */
  comparison?: ComparisonResult;
  
  /** Dashboard title */
  title?: string;
  
  /** Project name */
  projectName?: string;
  
  /** Theme */
  theme?: 'light' | 'dark';
  
  /** Include charts */
  includeCharts?: boolean;
  
  /** Include detailed issue list */
  includeIssueList?: boolean;
  
  /** Maximum issues to display */
  maxIssues?: number;
  
  /** Custom CSS */
  customCss?: string;
  
  /** Logo URL */
  logoUrl?: string;
}

/**
 * Dashboard data structure
 */
export interface DashboardData {
  title: string;
  projectName: string;
  timestamp: string;
  theme: 'light' | 'dark';
  
  summary: {
    totalIssues: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
    filesAnalyzed: number;
    linesOfCode: number;
    duration: number;
    overallStatus: 'excellent' | 'good' | 'needs-attention' | 'critical';
    statusColor: string;
  };
  
  charts: {
    severityDistribution: ChartData;
    categoryBreakdown: ChartData;
    trendOverTime?: ChartData;
    fileHeatmap: ChartData;
  };
  
  issues: {
    critical: Issue[];
    high: Issue[];
    medium: Issue[];
    low: Issue[];
  };
  
  insights: string[];
  recommendations: string[];
}

/**
 * Chart data for Chart.js
 */
export interface ChartData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string | string[];
    borderWidth?: number;
  }>;
}

// ============================================================================
// Advanced Dashboard Generator
// ============================================================================

/**
 * Advanced dashboard generator
 */
export class AdvancedDashboardGenerator {
  private config: Required<DashboardConfig>;

  constructor(config: DashboardConfig) {
    this.config = {
      current: config.current,
      trends: config.trends,
      comparison: config.comparison,
      title: config.title || 'ODAVL Code Quality Dashboard',
      projectName: config.projectName || 'Project',
      theme: config.theme || 'light',
      includeCharts: config.includeCharts ?? true,
      includeIssueList: config.includeIssueList ?? true,
      maxIssues: config.maxIssues || 50,
      customCss: config.customCss || '',
      logoUrl: config.logoUrl || '',
    };
  }

  // --------------------------------------------------------------------------
  // Public Methods
  // --------------------------------------------------------------------------

  /**
   * Generate complete HTML dashboard
   */
  generateHtml(): string {
    console.log('📊 Generating advanced dashboard...');

    const data = this.prepareDashboardData();
    const html = this.buildHtmlPage(data);

    console.log('✅ Dashboard generated');
    return html;
  }

  /**
   * Generate dashboard data (for custom rendering)
   */
  generateData(): DashboardData {
    return this.prepareDashboardData();
  }

  // --------------------------------------------------------------------------
  // Private Methods - Data Preparation
  // --------------------------------------------------------------------------

  private prepareDashboardData(): DashboardData {
    const issues = this.config.current.issues || [];
    const metrics = this.config.current.metrics || {};

    // Categorize issues by severity
    const critical = issues.filter(i => i.severity === 'critical');
    const high = issues.filter(i => i.severity === 'high');
    const medium = issues.filter(i => i.severity === 'medium');
    const low = issues.filter(i => i.severity === 'low');

    // Determine overall status
    const overallStatus = this.determineOverallStatus(critical.length, high.length, issues.length);

    return {
      title: this.config.title,
      projectName: this.config.projectName,
      timestamp: new Date(this.config.current.timestamp).toLocaleString(),
      theme: this.config.theme,
      summary: {
        totalIssues: issues.length,
        critical: critical.length,
        high: high.length,
        medium: medium.length,
        low: low.length,
        filesAnalyzed: metrics.filesAnalyzed || 0,
        linesOfCode: metrics.linesOfCode || 0,
        duration: metrics.duration || 0,
        overallStatus: overallStatus.status,
        statusColor: overallStatus.color,
      },
      charts: {
        severityDistribution: this.createSeverityChart(critical.length, high.length, medium.length, low.length),
        categoryBreakdown: this.createCategoryChart(issues),
        trendOverTime: this.config.trends ? this.createTrendChart(this.config.trends) : undefined,
        fileHeatmap: this.createFileHeatmap(issues),
      },
      issues: {
        critical: critical.slice(0, this.config.maxIssues),
        high: high.slice(0, this.config.maxIssues),
        medium: medium.slice(0, this.config.maxIssues),
        low: low.slice(0, this.config.maxIssues),
      },
      insights: this.generateInsights(issues, this.config.trends, this.config.comparison),
      recommendations: this.generateRecommendations(issues, this.config.comparison),
    };
  }

  private determineOverallStatus(critical: number, high: number, total: number): { status: DashboardData['summary']['overallStatus']; color: string } {
    if (critical > 0 || high > 10) {
      return { status: 'critical', color: '#ef4444' };
    } else if (high > 0 || total > 50) {
      return { status: 'needs-attention', color: '#f59e0b' };
    } else if (total > 20) {
      return { status: 'good', color: '#3b82f6' };
    } else {
      return { status: 'excellent', color: '#10b981' };
    }
  }

  // --------------------------------------------------------------------------
  // Private Methods - Chart Creation
  // --------------------------------------------------------------------------

  private createSeverityChart(critical: number, high: number, medium: number, low: number): ChartData {
    return {
      labels: ['Critical', 'High', 'Medium', 'Low'],
      datasets: [{
        label: 'Issues by Severity',
        data: [critical, high, medium, low],
        backgroundColor: ['#ef4444', '#f59e0b', '#3b82f6', '#6b7280'],
        borderColor: ['#dc2626', '#d97706', '#2563eb', '#4b5563'],
        borderWidth: 2,
      }],
    };
  }

  private createCategoryChart(issues: Issue[]): ChartData {
    const categoryMap = new Map<string, number>();
    
    for (const issue of issues) {
      const category = issue.category || 'uncategorized';
      categoryMap.set(category, (categoryMap.get(category) || 0) + 1);
    }

    const sortedCategories = Array.from(categoryMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    return {
      labels: sortedCategories.map(([cat]) => cat),
      datasets: [{
        label: 'Issues by Category',
        data: sortedCategories.map(([, count]) => count),
        backgroundColor: '#3b82f6',
        borderColor: '#2563eb',
        borderWidth: 2,
      }],
    };
  }

  private createTrendChart(trends: TrendAnalysisResult): ChartData {
    const windows = trends.movingAverages.map(ma => `${ma.window}d MA`);
    const totalIssues = trends.movingAverages.map(ma => ma.totalIssues);
    const critical = trends.movingAverages.map(ma => ma.critical);

    return {
      labels: windows,
      datasets: [
        {
          label: 'Total Issues',
          data: totalIssues,
          backgroundColor: 'rgba(59, 130, 246, 0.2)',
          borderColor: '#3b82f6',
          borderWidth: 2,
        },
        {
          label: 'Critical Issues',
          data: critical,
          backgroundColor: 'rgba(239, 68, 68, 0.2)',
          borderColor: '#ef4444',
          borderWidth: 2,
        },
      ],
    };
  }

  private createFileHeatmap(issues: Issue[]): ChartData {
    const fileMap = new Map<string, number>();

    for (const issue of issues) {
      fileMap.set(issue.file, (fileMap.get(issue.file) || 0) + 1);
    }

    const sortedFiles = Array.from(fileMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15);

    return {
      labels: sortedFiles.map(([file]) => this.truncateFilename(file)),
      datasets: [{
        label: 'Issues per File',
        data: sortedFiles.map(([, count]) => count),
        backgroundColor: sortedFiles.map(([, count]) => {
          if (count > 10) return '#ef4444';
          if (count > 5) return '#f59e0b';
          return '#3b82f6';
        }),
        borderWidth: 0,
      }],
    };
  }

  // --------------------------------------------------------------------------
  // Private Methods - Insights & Recommendations
  // --------------------------------------------------------------------------

  private generateInsights(issues: Issue[], trends?: TrendAnalysisResult, comparison?: ComparisonResult): string[] {
    const insights: string[] = [];

    // Issue insights
    const critical = issues.filter(i => i.severity === 'critical');
    if (critical.length > 0) {
      insights.push(`🔴 ${critical.length} critical issue(s) require immediate attention`);
    }

    // Trend insights
    if (trends) {
      insights.push(`📈 Overall trend: ${trends.overallTrend} (${trends.trendConfidence}% confidence)`);
      
      if (trends.anomalies.length > 0) {
        insights.push(`⚠️ ${trends.anomalies.length} anomal${trends.anomalies.length === 1 ? 'y' : 'ies'} detected in recent analysis`);
      }
    }

    // Comparison insights
    if (comparison) {
      insights.push(`${comparison.assessment.status === 'improved' ? '✅' : '⚠️'} ${comparison.assessment.summary}`);
      
      if (comparison.regressions.length > 0) {
        insights.push(`⚠️ ${comparison.regressions.length} file(s) with regressions detected`);
      }
    }

    // File concentration insight
    const fileMap = new Map<string, number>();
    for (const issue of issues) {
      fileMap.set(issue.file, (fileMap.get(issue.file) || 0) + 1);
    }
    const hotspots = Array.from(fileMap.entries()).filter(([, count]) => count > 10);
    if (hotspots.length > 0) {
      insights.push(`🔥 ${hotspots.length} hotspot file(s) with >10 issues each`);
    }

    return insights;
  }

  private generateRecommendations(issues: Issue[], comparison?: ComparisonResult): string[] {
    const recommendations: string[] = [];

    // Critical issues
    const critical = issues.filter(i => i.severity === 'critical');
    if (critical.length > 0) {
      recommendations.push('🔴 Priority: Address all critical issues before next deployment');
    }

    // High issues
    const high = issues.filter(i => i.severity === 'high');
    if (high.length > 5) {
      recommendations.push('🟠 Focus on reducing high-severity issues in next sprint');
    }

    // Comparison recommendations
    if (comparison?.recommendations) {
      recommendations.push(...comparison.recommendations.slice(0, 3));
    }

    // Default recommendations
    if (recommendations.length === 0) {
      recommendations.push('✅ Maintain current code quality standards');
      recommendations.push('📚 Consider setting up pre-commit hooks for automated checks');
    }

    return recommendations;
  }

  // --------------------------------------------------------------------------
  // Private Methods - HTML Generation
  // --------------------------------------------------------------------------

  private buildHtmlPage(data: DashboardData): string {
    return `<!DOCTYPE html>
<html lang="en" data-theme="${data.theme}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${data.title}</title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
  <style>
${this.getBaseStyles()}
${this.config.customCss}
  </style>
</head>
<body>
  <div class="container">
    ${this.buildHeader(data)}
    ${this.buildSummaryCards(data)}
    ${this.config.includeCharts ? this.buildChartsSection(data) : ''}
    ${this.buildInsightsSection(data)}
    ${this.buildRecommendationsSection(data)}
    ${this.config.includeIssueList ? this.buildIssueListSection(data) : ''}
    ${this.buildFooter()}
  </div>
  
  ${this.config.includeCharts ? this.buildChartScripts(data) : ''}
</body>
</html>`;
  }

  private getBaseStyles(): string {
    return `
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    :root {
      --bg-primary: #ffffff;
      --bg-secondary: #f9fafb;
      --text-primary: #111827;
      --text-secondary: #6b7280;
      --border-color: #e5e7eb;
      --accent-color: #3b82f6;
      --critical: #ef4444;
      --high: #f59e0b;
      --medium: #3b82f6;
      --low: #6b7280;
    }
    
    [data-theme="dark"] {
      --bg-primary: #1f2937;
      --bg-secondary: #111827;
      --text-primary: #f9fafb;
      --text-secondary: #9ca3af;
      --border-color: #374151;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: var(--bg-secondary);
      color: var(--text-primary);
      line-height: 1.6;
    }
    
    .container { max-width: 1400px; margin: 0 auto; padding: 2rem; }
    
    .header {
      background: var(--bg-primary);
      padding: 2rem;
      border-radius: 12px;
      margin-bottom: 2rem;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    
    .header h1 { font-size: 2rem; margin-bottom: 0.5rem; }
    .header .subtitle { color: var(--text-secondary); }
    
    .summary-cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      margin-bottom: 2rem;
    }
    
    .card {
      background: var(--bg-primary);
      padding: 1.5rem;
      border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    
    .card-title {
      font-size: 0.875rem;
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 0.5rem;
    }
    
    .card-value {
      font-size: 2.5rem;
      font-weight: bold;
      margin-bottom: 0.25rem;
    }
    
    .card-label { font-size: 0.875rem; color: var(--text-secondary); }
    
    .status-excellent { color: #10b981; }
    .status-good { color: #3b82f6; }
    .status-needs-attention { color: #f59e0b; }
    .status-critical { color: #ef4444; }
    
    .charts-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
      gap: 2rem;
      margin-bottom: 2rem;
    }
    
    .chart-container {
      background: var(--bg-primary);
      padding: 1.5rem;
      border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    
    .chart-container h3 {
      font-size: 1.125rem;
      margin-bottom: 1rem;
    }
    
    .section {
      background: var(--bg-primary);
      padding: 2rem;
      border-radius: 12px;
      margin-bottom: 2rem;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    
    .section h2 {
      font-size: 1.5rem;
      margin-bottom: 1rem;
      padding-bottom: 0.5rem;
      border-bottom: 2px solid var(--border-color);
    }
    
    .insight-list, .recommendation-list {
      list-style: none;
      padding: 0;
    }
    
    .insight-list li, .recommendation-list li {
      padding: 0.75rem 1rem;
      margin-bottom: 0.5rem;
      background: var(--bg-secondary);
      border-radius: 8px;
      border-left: 4px solid var(--accent-color);
    }
    
    .issue-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 1rem;
    }
    
    .issue-table th {
      background: var(--bg-secondary);
      padding: 0.75rem;
      text-align: left;
      font-weight: 600;
      border-bottom: 2px solid var(--border-color);
    }
    
    .issue-table td {
      padding: 0.75rem;
      border-bottom: 1px solid var(--border-color);
    }
    
    .severity-badge {
      display: inline-block;
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
    }
    
    .severity-critical { background: #fef2f2; color: #991b1b; }
    .severity-high { background: #fffbeb; color: #92400e; }
    .severity-medium { background: #eff6ff; color: #1e40af; }
    .severity-low { background: #f3f4f6; color: #374151; }
    
    .footer {
      text-align: center;
      padding: 2rem;
      color: var(--text-secondary);
      font-size: 0.875rem;
    }
    
    @media print {
      body { background: white; }
      .container { padding: 1rem; }
      .card, .chart-container, .section { box-shadow: none; }
    }
    `;
  }

  private buildHeader(data: DashboardData): string {
    return `
    <div class="header">
      ${data.logoUrl ? `<img src="${data.logoUrl}" alt="Logo" style="height: 48px; margin-bottom: 1rem;">` : ''}
      <h1>${data.title}</h1>
      <p class="subtitle">${data.projectName} • ${data.timestamp}</p>
    </div>
    `;
  }

  private buildSummaryCards(data: DashboardData): string {
    return `
    <div class="summary-cards">
      <div class="card">
        <div class="card-title">Overall Status</div>
        <div class="card-value status-${data.summary.overallStatus}">${data.summary.overallStatus.toUpperCase()}</div>
        <div class="card-label">Code Quality</div>
      </div>
      
      <div class="card">
        <div class="card-title">Total Issues</div>
        <div class="card-value">${data.summary.totalIssues}</div>
        <div class="card-label">${data.summary.filesAnalyzed} files analyzed</div>
      </div>
      
      <div class="card">
        <div class="card-title">Critical Issues</div>
        <div class="card-value" style="color: var(--critical)">${data.summary.critical}</div>
        <div class="card-label">Requires immediate action</div>
      </div>
      
      <div class="card">
        <div class="card-title">High Priority</div>
        <div class="card-value" style="color: var(--high)">${data.summary.high}</div>
        <div class="card-label">Should fix soon</div>
      </div>
      
      <div class="card">
        <div class="card-title">Lines of Code</div>
        <div class="card-value">${data.summary.linesOfCode.toLocaleString()}</div>
        <div class="card-label">Total LOC analyzed</div>
      </div>
      
      <div class="card">
        <div class="card-title">Analysis Time</div>
        <div class="card-value">${this.formatDuration(data.summary.duration)}</div>
        <div class="card-label">Scan duration</div>
      </div>
    </div>
    `;
  }

  private buildChartsSection(data: DashboardData): string {
    return `
    <div class="charts-grid">
      <div class="chart-container">
        <h3>Issues by Severity</h3>
        <canvas id="severityChart"></canvas>
      </div>
      
      <div class="chart-container">
        <h3>Issues by Category</h3>
        <canvas id="categoryChart"></canvas>
      </div>
      
      ${data.charts.trendOverTime ? `
      <div class="chart-container">
        <h3>Trend Over Time</h3>
        <canvas id="trendChart"></canvas>
      </div>
      ` : ''}
      
      <div class="chart-container">
        <h3>File Hotspots</h3>
        <canvas id="heatmapChart"></canvas>
      </div>
    </div>
    `;
  }

  private buildInsightsSection(data: DashboardData): string {
    return `
    <div class="section">
      <h2>Key Insights</h2>
      <ul class="insight-list">
        ${data.insights.map(insight => `<li>${insight}</li>`).join('\n        ')}
      </ul>
    </div>
    `;
  }

  private buildRecommendationsSection(data: DashboardData): string {
    return `
    <div class="section">
      <h2>Recommendations</h2>
      <ul class="recommendation-list">
        ${data.recommendations.map(rec => `<li>${rec}</li>`).join('\n        ')}
      </ul>
    </div>
    `;
  }

  private buildIssueListSection(data: DashboardData): string {
    const allIssues = [
      ...data.issues.critical.map(i => ({ ...i, severity: 'critical' })),
      ...data.issues.high.map(i => ({ ...i, severity: 'high' })),
    ].slice(0, 20);

    if (allIssues.length === 0) {
      return '<div class="section"><h2>Issues</h2><p>No critical or high priority issues found! 🎉</p></div>';
    }

    return `
    <div class="section">
      <h2>Top Issues</h2>
      <table class="issue-table">
        <thead>
          <tr>
            <th>Severity</th>
            <th>File</th>
            <th>Line</th>
            <th>Message</th>
            <th>Category</th>
          </tr>
        </thead>
        <tbody>
          ${allIssues.map(issue => `
          <tr>
            <td><span class="severity-badge severity-${issue.severity}">${issue.severity}</span></td>
            <td><code>${this.truncateFilename(issue.file)}</code></td>
            <td>${issue.line}</td>
            <td>${this.escapeHtml(issue.message.slice(0, 80))}${issue.message.length > 80 ? '...' : ''}</td>
            <td>${issue.category}</td>
          </tr>
          `).join('\n          ')}
        </tbody>
      </table>
    </div>
    `;
  }

  private buildFooter(): string {
    return `
    <div class="footer">
      <p>Generated by ODAVL Studio • ${new Date().toLocaleString()}</p>
      <p>Powered by ODAVL Insight Enterprise Edition</p>
    </div>
    `;
  }

  private buildChartScripts(data: DashboardData): string {
    return `
  <script>
    // Severity Chart
    new Chart(document.getElementById('severityChart'), {
      type: 'doughnut',
      data: ${JSON.stringify(data.charts.severityDistribution)},
      options: { responsive: true, maintainAspectRatio: true }
    });
    
    // Category Chart
    new Chart(document.getElementById('categoryChart'), {
      type: 'bar',
      data: ${JSON.stringify(data.charts.categoryBreakdown)},
      options: { 
        responsive: true, 
        maintainAspectRatio: true,
        scales: { y: { beginAtZero: true } }
      }
    });
    
    ${data.charts.trendOverTime ? `
    // Trend Chart
    new Chart(document.getElementById('trendChart'), {
      type: 'line',
      data: ${JSON.stringify(data.charts.trendOverTime)},
      options: { 
        responsive: true, 
        maintainAspectRatio: true,
        scales: { y: { beginAtZero: true } }
      }
    });
    ` : ''}
    
    // Heatmap Chart
    new Chart(document.getElementById('heatmapChart'), {
      type: 'bar',
      data: ${JSON.stringify(data.charts.fileHeatmap)},
      options: { 
        responsive: true,
        maintainAspectRatio: true,
        indexAxis: 'y',
        scales: { x: { beginAtZero: true } }
      }
    });
  </script>
    `;
  }

  // --------------------------------------------------------------------------
  // Private Methods - Utilities
  // --------------------------------------------------------------------------

  private truncateFilename(filename: string, maxLength = 40): string {
    if (filename.length <= maxLength) return filename;
    const parts = filename.split('/');
    const name = parts[parts.length - 1];
    return `.../${name}`;
  }

  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  private formatDuration(ms: number): string {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Create dashboard generator
 */
export function createDashboard(config: DashboardConfig): AdvancedDashboardGenerator {
  return new AdvancedDashboardGenerator(config);
}

/**
 * Quick HTML generation
 */
export function generateDashboardHtml(
  current: AnalysisResult,
  options?: Partial<DashboardConfig>
): string {
  const generator = createDashboard({ current, ...options });
  return generator.generateHtml();
}

/**
 * Save dashboard to file
 */
export async function saveDashboard(
  html: string,
  outputPath: string
): Promise<void> {
  const fs = await import('fs/promises');
  await fs.writeFile(outputPath, html, 'utf-8');
  console.log(`✅ Dashboard saved to ${outputPath}`);
}
