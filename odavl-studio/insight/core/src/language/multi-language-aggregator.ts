/**
 * Multi-Language Aggregator
 * 
 * Combines issues from TypeScript, Python, and Java detectors
 * into unified reports for cross-language projects.
 * 
 * @module multi-language-aggregator
 */

import { LanguageDetector, Language, ProjectLanguages } from './language-detector.js';
import * as fs from 'node:fs';
import * as path from 'node:path';

/**
 * Issue from any language detector
 */
export interface AggregatedIssue {
  language: Language;
  detector: string;
  file: string;
  line: number;
  column?: number;
  severity: 'error' | 'warning' | 'info';
  message: string;
  category: string;
  autoFixable: boolean;
  suggestion?: string;
}

/**
 * Language-specific report
 */
export interface LanguageReport {
  language: Language;
  issueCount: number;
  errors: number;
  warnings: number;
  info: number;
  autoFixable: number;
  timeMs: number;
  files: number;
}

/**
 * Category-based report
 */
export interface CategoryReport {
  category: string;
  issueCount: number;
  languages: Language[];
  severity: Record<string, number>;
}

/**
 * Severity-based report
 */
export interface SeverityReport {
  severity: 'error' | 'warning' | 'info';
  issueCount: number;
  byLanguage: Record<Language, number>;
  byCategory: Record<string, number>;
}

/**
 * Complete multi-language analysis report
 */
export interface MultiLanguageReport {
  project: string;
  languages: Language[];
  timestamp: string;
  summary: {
    totalIssues: number;
    errors: number;
    warnings: number;
    info: number;
    autoFixable: number;
    totalTimeMs: number;
    filesAnalyzed: number;
  };
  byLanguage: Record<Language, LanguageReport>;
  byCategory: Record<string, CategoryReport>;
  bySeverity: Record<string, SeverityReport>;
  issues: AggregatedIssue[];
}

/**
 * Detector interface for running language-specific analysis
 */
export interface LanguageDetectorRunner {
  language: Language;
  detect(projectRoot: string): Promise<AggregatedIssue[]>;
}

/**
 * Multi-Language Aggregator
 * 
 * Orchestrates analysis across multiple languages and combines results
 */
export class MultiLanguageAggregator {
  private languageDetector = new LanguageDetector();
  private detectorRegistry = new Map<Language, LanguageDetectorRunner[]>();

  /**
   * Register a detector for a specific language
   */
  registerDetector(detector: LanguageDetectorRunner): void {
    const detectors = this.detectorRegistry.get(detector.language) || [];
    detectors.push(detector);
    this.detectorRegistry.set(detector.language, detectors);
  }

  /**
   * Analyze a project with multiple languages
   * 
   * @param projectRoot - Root directory of the project
   * @param languages - Optional: specific languages to analyze (auto-detect if omitted)
   * @returns Complete multi-language report
   */
  async analyzeProject(
    projectRoot: string,
    languages?: Language[]
  ): Promise<MultiLanguageReport> {
    const startTime = performance.now();

    // 1. Auto-detect languages if not specified
    const detectedLanguages = languages || await this.detectLanguages(projectRoot);

    // 2. Run detectors for each language
    const allIssues: AggregatedIssue[] = [];
    const languageReports = new Map<Language, LanguageReport>();

    for (const language of detectedLanguages) {
      const languageStart = performance.now();
      const detectors = this.detectorRegistry.get(language) || [];
      const languageIssues: AggregatedIssue[] = [];

      for (const detector of detectors) {
        try {
          const issues = await detector.detect(projectRoot);
          languageIssues.push(...issues);
        } catch (error) {
          console.error(`Error running ${language} detector:`, error);
        }
      }

      const languageEnd = performance.now();
      
      // Create language report
      const report = this.createLanguageReport(
        language,
        languageIssues,
        languageEnd - languageStart
      );
      languageReports.set(language, report);
      allIssues.push(...languageIssues);
    }

    const endTime = performance.now();

    // 3. Generate comprehensive report
    return this.generateReport(
      projectRoot,
      detectedLanguages,
      allIssues,
      languageReports,
      endTime - startTime
    );
  }

  /**
   * Detect languages in project
   */
  private async detectLanguages(projectRoot: string): Promise<Language[]> {
    const detected = this.languageDetector.detectFromProject(projectRoot);
    
    // Filter out Unknown language
    const languages = [detected.primary, ...detected.secondary].filter(
      (lang) => lang !== Language.Unknown
    );

    // Remove duplicates
    return Array.from(new Set(languages));
  }

  /**
   * Create language-specific report
   */
  private createLanguageReport(
    language: Language,
    issues: AggregatedIssue[],
    timeMs: number
  ): LanguageReport {
    const errors = issues.filter((i) => i.severity === 'error').length;
    const warnings = issues.filter((i) => i.severity === 'warning').length;
    const info = issues.filter((i) => i.severity === 'info').length;
    const autoFixable = issues.filter((i) => i.autoFixable).length;
    
    // Count unique files
    const files = new Set(issues.map((i) => i.file)).size;

    return {
      language,
      issueCount: issues.length,
      errors,
      warnings,
      info,
      autoFixable,
      timeMs,
      files,
    };
  }

  /**
   * Generate comprehensive multi-language report
   */
  private generateReport(
    projectRoot: string,
    languages: Language[],
    issues: AggregatedIssue[],
    languageReports: Map<Language, LanguageReport>,
    totalTimeMs: number
  ): MultiLanguageReport {
    const projectName = path.basename(projectRoot);

    // Summary statistics
    const summary = {
      totalIssues: issues.length,
      errors: issues.filter((i) => i.severity === 'error').length,
      warnings: issues.filter((i) => i.severity === 'warning').length,
      info: issues.filter((i) => i.severity === 'info').length,
      autoFixable: issues.filter((i) => i.autoFixable).length,
      totalTimeMs: Math.round(totalTimeMs),
      filesAnalyzed: new Set(issues.map((i) => i.file)).size,
    };

    // By language
    const byLanguage: Record<Language, LanguageReport> = {};
    for (const [lang, report] of languageReports) {
      byLanguage[lang] = report;
    }

    // By category
    const byCategory = this.groupByCategory(issues);

    // By severity
    const bySeverity = this.groupBySeverity(issues);

    return {
      project: projectName,
      languages,
      timestamp: new Date().toISOString(),
      summary,
      byLanguage,
      byCategory,
      bySeverity,
      issues,
    };
  }

  /**
   * Group issues by category
   */
  private groupByCategory(issues: AggregatedIssue[]): Record<string, CategoryReport> {
    const categories = new Map<string, AggregatedIssue[]>();

    for (const issue of issues) {
      const categoryIssues = categories.get(issue.category) || [];
      categoryIssues.push(issue);
      categories.set(issue.category, categoryIssues);
    }

    const result: Record<string, CategoryReport> = {};
    for (const [category, categoryIssues] of categories) {
      const languages = Array.from(new Set(categoryIssues.map((i) => i.language)));
      const severity: Record<string, number> = {
        error: categoryIssues.filter((i) => i.severity === 'error').length,
        warning: categoryIssues.filter((i) => i.severity === 'warning').length,
        info: categoryIssues.filter((i) => i.severity === 'info').length,
      };

      result[category] = {
        category,
        issueCount: categoryIssues.length,
        languages,
        severity,
      };
    }

    return result;
  }

  /**
   * Group issues by severity
   */
  private groupBySeverity(issues: AggregatedIssue[]): Record<string, SeverityReport> {
    const severities = new Map<string, AggregatedIssue[]>();

    for (const issue of issues) {
      const severityIssues = severities.get(issue.severity) || [];
      severityIssues.push(issue);
      severities.set(issue.severity, severityIssues);
    }

    const result: Record<string, SeverityReport> = {};
    for (const [severity, severityIssues] of severities) {
      const byLanguage: Record<Language, number> = {};
      for (const lang of Object.values(Language)) {
        byLanguage[lang] = severityIssues.filter((i) => i.language === lang).length;
      }

      const byCategory: Record<string, number> = {};
      for (const issue of severityIssues) {
        byCategory[issue.category] = (byCategory[issue.category] || 0) + 1;
      }

      result[severity] = {
        severity: severity as 'error' | 'warning' | 'info',
        issueCount: severityIssues.length,
        byLanguage,
        byCategory,
      };
    }

    return result;
  }

  /**
   * Export report to JSON file
   */
  async exportToJSON(report: MultiLanguageReport, outputPath: string): Promise<void> {
    const json = JSON.stringify(report, null, 2);
    await fs.promises.writeFile(outputPath, json, 'utf-8');
  }

  /**
   * Export report to HTML file
   */
  async exportToHTML(report: MultiLanguageReport, outputPath: string): Promise<void> {
    const html = this.generateHTML(report);
    await fs.promises.writeFile(outputPath, html, 'utf-8');
  }

  /**
   * Generate HTML report
   */
  private generateHTML(report: MultiLanguageReport): string {
    const languageIcons: Record<Language, string> = {
      [Language.TypeScript]: '🔷',
      [Language.Python]: '🐍',
      [Language.Java]: '☕',
      [Language.Unknown]: '❓',
    };

    const languageNames: Record<Language, string> = {
      [Language.TypeScript]: 'TypeScript',
      [Language.Python]: 'Python',
      [Language.Java]: 'Java',
      [Language.Unknown]: 'Unknown',
    };

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Multi-Language Analysis Report - ${report.project}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background: #f5f5f5;
      padding: 20px;
      line-height: 1.6;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      padding: 30px;
    }
    h1 {
      color: #1a1a1a;
      margin-bottom: 10px;
      font-size: 32px;
    }
    .subtitle {
      color: #666;
      margin-bottom: 30px;
      font-size: 14px;
    }
    .section {
      margin-bottom: 40px;
    }
    h2 {
      color: #333;
      margin-bottom: 20px;
      font-size: 24px;
      border-bottom: 2px solid #3b82f6;
      padding-bottom: 10px;
    }
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }
    .stat-card {
      background: #f9fafb;
      padding: 20px;
      border-radius: 8px;
      border-left: 4px solid #3b82f6;
    }
    .stat-label {
      color: #666;
      font-size: 14px;
      margin-bottom: 5px;
    }
    .stat-value {
      font-size: 32px;
      font-weight: bold;
      color: #1a1a1a;
    }
    .language-report {
      background: #f9fafb;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 15px;
    }
    .language-header {
      font-size: 20px;
      font-weight: bold;
      margin-bottom: 15px;
      color: #1a1a1a;
    }
    .language-stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
      gap: 10px;
    }
    .language-stat {
      text-align: center;
      padding: 10px;
      background: white;
      border-radius: 6px;
    }
    .language-stat-label {
      font-size: 12px;
      color: #666;
    }
    .language-stat-value {
      font-size: 20px;
      font-weight: bold;
      color: #1a1a1a;
    }
    .error { color: #dc2626; }
    .warning { color: #f59e0b; }
    .info { color: #3b82f6; }
    .issues-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 20px;
    }
    .issues-table th {
      background: #f9fafb;
      padding: 12px;
      text-align: left;
      font-weight: 600;
      color: #666;
      border-bottom: 2px solid #e5e7eb;
    }
    .issues-table td {
      padding: 12px;
      border-bottom: 1px solid #e5e7eb;
    }
    .issues-table tr:hover {
      background: #f9fafb;
    }
    .severity-badge {
      display: inline-block;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 600;
    }
    .severity-error { background: #fee2e2; color: #dc2626; }
    .severity-warning { background: #fef3c7; color: #f59e0b; }
    .severity-info { background: #dbeafe; color: #3b82f6; }
    .auto-fix { color: #10b981; font-weight: 600; }
  </style>
</head>
<body>
  <div class="container">
    <h1>🔍 Multi-Language Analysis Report</h1>
    <p class="subtitle">Project: ${report.project} | Generated: ${new Date(report.timestamp).toLocaleString()}</p>

    <div class="section">
      <h2>📊 Summary</h2>
      <div class="summary-grid">
        <div class="stat-card">
          <div class="stat-label">Total Issues</div>
          <div class="stat-value">${report.summary.totalIssues}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Errors</div>
          <div class="stat-value error">${report.summary.errors}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Warnings</div>
          <div class="stat-value warning">${report.summary.warnings}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Info</div>
          <div class="stat-value info">${report.summary.info}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Auto-Fixable</div>
          <div class="stat-value">${report.summary.autoFixable} (${Math.round((report.summary.autoFixable / report.summary.totalIssues) * 100)}%)</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Analysis Time</div>
          <div class="stat-value">${(report.summary.totalTimeMs / 1000).toFixed(2)}s</div>
        </div>
      </div>
    </div>

    <div class="section">
      <h2>🌐 By Language</h2>
      ${report.languages.map((lang) => {
        const langReport = report.byLanguage[lang];
        if (!langReport) return '';
        
        return `
        <div class="language-report">
          <div class="language-header">${languageIcons[lang]} ${languageNames[lang]}</div>
          <div class="language-stats">
            <div class="language-stat">
              <div class="language-stat-label">Issues</div>
              <div class="language-stat-value">${langReport.issueCount}</div>
            </div>
            <div class="language-stat">
              <div class="language-stat-label">Errors</div>
              <div class="language-stat-value error">${langReport.errors}</div>
            </div>
            <div class="language-stat">
              <div class="language-stat-label">Warnings</div>
              <div class="language-stat-value warning">${langReport.warnings}</div>
            </div>
            <div class="language-stat">
              <div class="language-stat-label">Info</div>
              <div class="language-stat-value info">${langReport.info}</div>
            </div>
            <div class="language-stat">
              <div class="language-stat-label">Auto-Fix</div>
              <div class="language-stat-value">${langReport.autoFixable}</div>
            </div>
            <div class="language-stat">
              <div class="language-stat-label">Time</div>
              <div class="language-stat-value">${(langReport.timeMs / 1000).toFixed(2)}s</div>
            </div>
          </div>
        </div>
        `;
      }).join('')}
    </div>

    <div class="section">
      <h2>🐛 Issues (Top 50)</h2>
      <table class="issues-table">
        <thead>
          <tr>
            <th>Language</th>
            <th>Severity</th>
            <th>File</th>
            <th>Line</th>
            <th>Message</th>
            <th>Auto-Fix</th>
          </tr>
        </thead>
        <tbody>
          ${report.issues.slice(0, 50).map((issue) => `
            <tr>
              <td>${languageIcons[issue.language]} ${languageNames[issue.language]}</td>
              <td><span class="severity-badge severity-${issue.severity}">${issue.severity.toUpperCase()}</span></td>
              <td>${path.basename(issue.file)}</td>
              <td>${issue.line}</td>
              <td>${issue.message}</td>
              <td>${issue.autoFixable ? '<span class="auto-fix">✓</span>' : '—'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      ${report.issues.length > 50 ? `<p style="margin-top: 15px; color: #666;">Showing 50 of ${report.issues.length} total issues</p>` : ''}
    </div>
  </div>
</body>
</html>`;
  }
}
