/**
 * Enhanced Error Reporting for Guardian
 * 
 * Provides detailed, actionable error messages with:
 * - Code snippets
 * - Visual diffs
 * - Fix suggestions
 * - WCAG/Performance guidelines
 * - Multilingual support (English, Arabic, German)
 */

import chalk from 'chalk';

export interface EnhancedError {
  type: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  message: string;
  location?: {
    url: string;
    selector?: string;
    line?: number;
    column?: number;
  };
  codeSnippet?: string;
  wcagCriteria?: string[];
  fixes: string[];
  learnMore?: string[];
  impact: string;
  visualDiff?: {
    before: string;
    after: string;
  };
}

export type Locale = 'en' | 'ar' | 'de';

/**
 * Translations for error messages
 */
const TRANSLATIONS = {
  en: {
    severity: {
      critical: 'Critical',
      high: 'High',
      medium: 'Medium',
      low: 'Low',
    },
    headers: {
      issue: 'Issue',
      location: 'Location',
      impact: 'Impact',
      fixes: 'How to Fix',
      wcag: 'WCAG Criteria',
      learnMore: 'Learn More',
    },
  },
  ar: {
    severity: {
      critical: 'حرج',
      high: 'عالي',
      medium: 'متوسط',
      low: 'منخفض',
    },
    headers: {
      issue: 'المشكلة',
      location: 'الموقع',
      impact: 'التأثير',
      fixes: 'كيفية الإصلاح',
      wcag: 'معايير WCAG',
      learnMore: 'اعرف المزيد',
    },
  },
  de: {
    severity: {
      critical: 'Kritisch',
      high: 'Hoch',
      medium: 'Mittel',
      low: 'Niedrig',
    },
    headers: {
      issue: 'Problem',
      location: 'Ort',
      impact: 'Auswirkung',
      fixes: 'So beheben Sie es',
      wcag: 'WCAG-Kriterien',
      learnMore: 'Mehr erfahren',
    },
  },
};

/**
 * Format error for CLI output with colors and structure
 */
export function formatError(error: EnhancedError, locale: Locale = 'en'): string {
  const t = TRANSLATIONS[locale];
  const isRTL = locale === 'ar';
  
  // Severity color
  const severityColor = {
    critical: chalk.red.bold,
    high: chalk.red,
    medium: chalk.yellow,
    low: chalk.blue,
  }[error.severity];

  let output = '\n';
  
  // Header with severity
  output += severityColor(`${'='.repeat(70)}\n`);
  output += severityColor(`${error.severity.toUpperCase()}: ${error.title}\n`);
  output += severityColor(`${'='.repeat(70)}\n\n`);

  // Issue description
  output += chalk.white.bold(`${t.headers.issue}:\n`);
  output += chalk.white(`  ${error.message}\n\n`);

  // Location
  if (error.location) {
    output += chalk.cyan.bold(`${t.headers.location}:\n`);
    output += chalk.cyan(`  URL: ${error.location.url}\n`);
    if (error.location.selector) {
      output += chalk.cyan(`  Selector: ${error.location.selector}\n`);
    }
    if (error.location.line) {
      output += chalk.cyan(`  Line: ${error.location.line}${error.location.column ? `, Column: ${error.location.column}` : ''}\n`);
    }
    output += '\n';
  }

  // Code snippet
  if (error.codeSnippet) {
    output += chalk.gray.bold('Code:\n');
    output += chalk.gray('  ┌──────────────────────────────────────────────────────────────────┐\n');
    error.codeSnippet.split('\n').forEach((line, i) => {
      output += chalk.gray(`  │ `) + chalk.white(line.padEnd(64)) + chalk.gray('│\n');
    });
    output += chalk.gray('  └──────────────────────────────────────────────────────────────────┘\n\n');
  }

  // Impact
  output += chalk.magenta.bold(`${t.headers.impact}:\n`);
  output += chalk.magenta(`  ${error.impact}\n\n`);

  // WCAG Criteria
  if (error.wcagCriteria && error.wcagCriteria.length > 0) {
    output += chalk.blue.bold(`${t.headers.wcag}:\n`);
    error.wcagCriteria.forEach(criterion => {
      output += chalk.blue(`  • ${criterion}\n`);
    });
    output += '\n';
  }

  // Fixes
  output += chalk.green.bold(`${t.headers.fixes}:\n`);
  error.fixes.forEach((fix, i) => {
    output += chalk.green(`  ${i + 1}. ${fix}\n`);
  });
  output += '\n';

  // Visual diff
  if (error.visualDiff) {
    output += chalk.gray.bold('Visual Diff:\n');
    output += chalk.red(`  - ${error.visualDiff.before}\n`);
    output += chalk.green(`  + ${error.visualDiff.after}\n\n`);
  }

  // Learn more
  if (error.learnMore && error.learnMore.length > 0) {
    output += chalk.gray.bold(`${t.headers.learnMore}:\n`);
    error.learnMore.forEach(link => {
      output += chalk.gray(`  🔗 ${link}\n`);
    });
    output += '\n';
  }

  return output;
}

/**
 * Format multiple errors as a summary report
 */
export function formatErrorSummary(errors: EnhancedError[], locale: Locale = 'en'): string {
  const t = TRANSLATIONS[locale];
  
  const critical = errors.filter(e => e.severity === 'critical').length;
  const high = errors.filter(e => e.severity === 'high').length;
  const medium = errors.filter(e => e.severity === 'medium').length;
  const low = errors.filter(e => e.severity === 'low').length;

  let output = '\n';
  output += chalk.bold('═'.repeat(70)) + '\n';
  output += chalk.bold.white(`           GUARDIAN TEST RESULTS SUMMARY\n`);
  output += chalk.bold('═'.repeat(70)) + '\n\n';

  output += chalk.white(`Total Issues: ${errors.length}\n\n`);

  if (critical > 0) {
    output += chalk.red(`  🔴 ${t.severity.critical}: ${critical}\n`);
  }
  if (high > 0) {
    output += chalk.red(`  🟠 ${t.severity.high}: ${high}\n`);
  }
  if (medium > 0) {
    output += chalk.yellow(`  🟡 ${t.severity.medium}: ${medium}\n`);
  }
  if (low > 0) {
    output += chalk.blue(`  🔵 ${t.severity.low}: ${low}\n`);
  }

  output += '\n';

  // Group by type
  const byType = errors.reduce((acc, err) => {
    if (!acc[err.type]) acc[err.type] = [];
    acc[err.type].push(err);
    return acc;
  }, {} as Record<string, EnhancedError[]>);

  output += chalk.bold('Issues by Category:\n\n');
  Object.entries(byType).forEach(([type, typeErrors]) => {
    output += chalk.white(`  • ${type}: ${typeErrors.length}\n`);
  });

  output += '\n' + chalk.bold('═'.repeat(70)) + '\n';

  return output;
}

/**
 * Export errors to JSON for CI/CD integration
 */
export function exportToJSON(errors: EnhancedError[]): string {
  return JSON.stringify({
    summary: {
      total: errors.length,
      critical: errors.filter(e => e.severity === 'critical').length,
      high: errors.filter(e => e.severity === 'high').length,
      medium: errors.filter(e => e.severity === 'medium').length,
      low: errors.filter(e => e.severity === 'low').length,
    },
    errors: errors.map(e => ({
      type: e.type,
      severity: e.severity,
      title: e.title,
      message: e.message,
      location: e.location,
      wcagCriteria: e.wcagCriteria,
      fixes: e.fixes,
      impact: e.impact,
    })),
    timestamp: new Date().toISOString(),
  }, null, 2);
}

/**
 * Export errors to HTML report
 */
export function exportToHTML(errors: EnhancedError[], title: string = 'Guardian Test Report'): string {
  const critical = errors.filter(e => e.severity === 'critical').length;
  const high = errors.filter(e => e.severity === 'high').length;
  const medium = errors.filter(e => e.severity === 'medium').length;
  const low = errors.filter(e => e.severity === 'low').length;

  let html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 1200px; margin: 0 auto; padding: 20px; background: #f5f5f5; }
    h1 { color: #333; }
    .summary { background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .summary-stats { display: flex; gap: 20px; margin-top: 20px; }
    .stat { flex: 1; padding: 15px; border-radius: 6px; text-align: center; }
    .stat.critical { background: #fee; border-left: 4px solid #e53e3e; }
    .stat.high { background: #ffe; border-left: 4px solid #dd6b20; }
    .stat.medium { background: #fef5e7; border-left: 4px solid #d69e2e; }
    .stat.low { background: #ebf8ff; border-left: 4px solid #3182ce; }
    .stat-number { font-size: 32px; font-weight: bold; }
    .stat-label { font-size: 14px; color: #666; margin-top: 5px; }
    .error { background: white; padding: 20px; border-radius: 8px; margin-bottom: 15px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .error.critical { border-left: 4px solid #e53e3e; }
    .error.high { border-left: 4px solid #dd6b20; }
    .error.medium { border-left: 4px solid #d69e2e; }
    .error.low { border-left: 4px solid #3182ce; }
    .error-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
    .error-title { font-size: 18px; font-weight: bold; color: #333; }
    .error-severity { padding: 4px 12px; border-radius: 4px; font-size: 12px; font-weight: bold; text-transform: uppercase; }
    .severity-critical { background: #e53e3e; color: white; }
    .severity-high { background: #dd6b20; color: white; }
    .severity-medium { background: #d69e2e; color: white; }
    .severity-low { background: #3182ce; color: white; }
    .error-message { color: #666; margin-bottom: 15px; }
    .error-location { background: #f7fafc; padding: 10px; border-radius: 4px; margin-bottom: 10px; font-size: 14px; }
    .error-fixes { margin-top: 15px; }
    .error-fixes h4 { margin-bottom: 10px; color: #2d3748; }
    .error-fixes ul { margin: 0; padding-left: 20px; }
    .error-fixes li { margin-bottom: 8px; color: #4a5568; }
    .wcag-criteria { margin-top: 10px; display: flex; flex-wrap: wrap; gap: 8px; }
    .wcag-badge { background: #edf2f7; padding: 4px 8px; border-radius: 4px; font-size: 12px; color: #2d3748; }
  </style>
</head>
<body>
  <h1>🛡️ ${title}</h1>
  
  <div class="summary">
    <h2>Summary</h2>
    <p>Total Issues: <strong>${errors.length}</strong></p>
    <div class="summary-stats">
      <div class="stat critical">
        <div class="stat-number">${critical}</div>
        <div class="stat-label">Critical</div>
      </div>
      <div class="stat high">
        <div class="stat-number">${high}</div>
        <div class="stat-label">High</div>
      </div>
      <div class="stat medium">
        <div class="stat-number">${medium}</div>
        <div class="stat-label">Medium</div>
      </div>
      <div class="stat low">
        <div class="stat-number">${low}</div>
        <div class="stat-label">Low</div>
      </div>
    </div>
  </div>

  <h2>Issues</h2>
`;

  errors.forEach((error, i) => {
    html += `
  <div class="error ${error.severity}">
    <div class="error-header">
      <div class="error-title">${i + 1}. ${error.title}</div>
      <div class="error-severity severity-${error.severity}">${error.severity}</div>
    </div>
    <div class="error-message">${error.message}</div>
    ${error.location ? `
    <div class="error-location">
      <strong>Location:</strong> ${error.location.url}
      ${error.location.selector ? `<br><strong>Selector:</strong> <code>${error.location.selector}</code>` : ''}
    </div>
    ` : ''}
    <div><strong>Impact:</strong> ${error.impact}</div>
    ${error.wcagCriteria && error.wcagCriteria.length > 0 ? `
    <div class="wcag-criteria">
      ${error.wcagCriteria.map(c => `<span class="wcag-badge">${c}</span>`).join('')}
    </div>
    ` : ''}
    <div class="error-fixes">
      <h4>How to Fix:</h4>
      <ul>
        ${error.fixes.map(fix => `<li>${fix}</li>`).join('')}
      </ul>
    </div>
  </div>
`;
  });

  html += `
  <footer style="text-align: center; margin-top: 40px; padding: 20px; color: #999;">
    <p>Generated by ODAVL Guardian v5.0 | ${new Date().toLocaleString()}</p>
  </footer>
</body>
</html>`;

  return html;
}

/**
 * Example usage:
 * 
 * ```typescript
 * const error: EnhancedError = {
 *   type: 'MISSING_ALT_TEXT',
 *   severity: 'high',
 *   title: 'Images missing alt text',
 *   message: '5 images found without alternative text',
 *   location: { url: 'https://example.com', selector: 'img:not([alt])' },
 *   codeSnippet: '<img src="logo.png">',
 *   wcagCriteria: ['WCAG 2.1 Level A - 1.1.1 Non-text Content'],
 *   fixes: [
 *     'Add descriptive alt text to all images',
 *     'Use alt="" for decorative images',
 *     'Test with screen reader'
 *   ],
 *   impact: 'Users with screen readers cannot understand image content',
 *   learnMore: ['https://www.w3.org/WAI/WCAG21/Understanding/non-text-content.html']
 * };
 * 
 * console.log(formatError(error, 'en'));
 * ```
 */
