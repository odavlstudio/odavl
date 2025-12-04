/**
 * Enhanced Error Messages Utility
 * Provides clear, actionable error messages with solutions
 */

export interface ErrorContext {
  code: string;
  message: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  location?: {
    file: string;
    line?: number;
    column?: number;
  };
  suggestion?: string;
  learnMore?: string;
  quickFix?: string;
}

export class EnhancedError extends Error {
  public readonly context: ErrorContext;

  constructor(context: ErrorContext) {
    super(context.message);
    this.name = 'EnhancedError';
    this.context = context;
  }

  /**
   * Format error with colors and helpful information
   */
  format(): string {
    const { code, message, severity, location, suggestion, learnMore, quickFix } = this.context;

    const colors = {
      critical: '\x1b[41m\x1b[37m', // Red background, white text
      high: '\x1b[31m',             // Red
      medium: '\x1b[33m',           // Yellow
      low: '\x1b[36m',              // Cyan
      reset: '\x1b[0m',
      bold: '\x1b[1m',
      dim: '\x1b[2m',
    };

    const severityColor = colors[severity];
    const severityLabel = severity.toUpperCase().padEnd(8);

    let output = '';

    // Header
    output += `\n${severityColor}${colors.bold} ${severityLabel} ${colors.reset} ${colors.bold}${code}${colors.reset}\n`;
    output += `${colors.dim}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n\n`;

    // Message
    output += `${message}\n`;

    // Location
    if (location) {
      output += `\n${colors.dim}Location:${colors.reset} ${location.file}`;
      if (location.line) {
        output += `:${location.line}`;
        if (location.column) {
          output += `:${location.column}`;
        }
      }
      output += '\n';
    }

    // Suggestion
    if (suggestion) {
      output += `\n${colors.bold}💡 Suggested Fix:${colors.reset}\n`;
      output += `   ${suggestion}\n`;
    }

    // Quick Fix
    if (quickFix) {
      output += `\n${colors.bold}⚡ Quick Fix:${colors.reset}\n`;
      output += `   ${colors.dim}$${colors.reset} ${quickFix}\n`;
    }

    // Learn More
    if (learnMore) {
      output += `\n${colors.dim}📚 Learn more: ${learnMore}${colors.reset}\n`;
    }

    return output;
  }
}

/**
 * Common error messages with helpful suggestions
 */
export const ErrorMessages = {
  // Autopilot Errors
  AUTOPILOT_NO_RECIPES: (recipesDir: string): ErrorContext => ({
    code: 'AUTOPILOT_001',
    message: `No recipes found in ${recipesDir}`,
    severity: 'high',
    suggestion: 'Create your first recipe or check if the recipes directory exists',
    quickFix: 'pnpm odavl:autopilot init --create-sample-recipes',
    learnMore: 'docs/autopilot/recipes.md'
  }),

  AUTOPILOT_RISK_BUDGET_EXCEEDED: (filesModified: number, maxFiles: number): ErrorContext => ({
    code: 'AUTOPILOT_002',
    message: `Risk budget exceeded: attempting to modify ${filesModified} files (max: ${maxFiles})`,
    severity: 'critical',
    suggestion: `Increase max_files_per_cycle in .odavl/gates.yml or split into smaller changes`,
    quickFix: 'pnpm odavl:autopilot run --max-files 20',
    learnMore: 'docs/autopilot/safety.md#risk-budget'
  }),

  AUTOPILOT_PROTECTED_PATH: (path: string): ErrorContext => ({
    code: 'AUTOPILOT_003',
    message: `Cannot modify protected path: ${path}`,
    severity: 'critical',
    suggestion: 'Remove this path from forbidden_paths in .odavl/gates.yml if intentional',
    learnMore: 'docs/autopilot/safety.md#protected-paths'
  }),

  AUTOPILOT_VERIFICATION_FAILED: (beforeIssues: number, afterIssues: number): ErrorContext => ({
    code: 'AUTOPILOT_004',
    message: `Verification failed: quality did not improve (${beforeIssues} → ${afterIssues} issues)`,
    severity: 'high',
    suggestion: 'Changes will be rolled back automatically. Check .odavl/ledger/ for details',
    quickFix: 'pnpm odavl:autopilot undo',
    learnMore: 'docs/autopilot/verification.md'
  }),

  AUTOPILOT_ML_MODEL_NOT_FOUND: (): ErrorContext => ({
    code: 'AUTOPILOT_005',
    message: 'ML trust predictor model not found. Falling back to heuristic scoring.',
    severity: 'medium',
    suggestion: 'Train the ML model for better recipe selection accuracy',
    quickFix: 'pnpm ml:train',
    learnMore: 'docs/autopilot/ml-trust-prediction.md'
  }),

  // Insight Errors
  INSIGHT_DETECTOR_FAILED: (detector: string, error: string): ErrorContext => ({
    code: 'INSIGHT_001',
    message: `Detector "${detector}" failed: ${error}`,
    severity: 'high',
    suggestion: 'Check if required dependencies are installed (ESLint, TypeScript, etc.)',
    quickFix: 'pnpm install',
    learnMore: 'docs/insight/detectors.md'
  }),

  INSIGHT_NO_ISSUES_FOUND: (): ErrorContext => ({
    code: 'INSIGHT_002',
    message: 'No issues detected in the codebase',
    severity: 'low',
    suggestion: '✨ Your code quality is excellent! Consider running specific detectors for deeper analysis.',
    learnMore: 'docs/insight/detectors.md'
  }),

  INSIGHT_CRITICAL_VULNERABILITY: (vulnerability: string, location: string): ErrorContext => ({
    code: 'INSIGHT_003',
    message: `Critical security vulnerability detected: ${vulnerability}`,
    severity: 'critical',
    location: { file: location },
    suggestion: 'Address this vulnerability immediately before deployment',
    quickFix: 'pnpm odavl:insight security --fix',
    learnMore: 'docs/insight/security.md'
  }),

  // Guardian Errors
  GUARDIAN_SITE_UNREACHABLE: (url: string): ErrorContext => ({
    code: 'GUARDIAN_001',
    message: `Cannot reach site: ${url}`,
    severity: 'critical',
    suggestion: 'Check if the URL is correct and the site is running',
    quickFix: 'curl -I ' + url,
    learnMore: 'docs/guardian/troubleshooting.md'
  }),

  GUARDIAN_WCAG_VIOLATION: (violation: string, level: string): ErrorContext => ({
    code: 'GUARDIAN_002',
    message: `WCAG ${level} violation: ${violation}`,
    severity: 'high',
    suggestion: 'Fix accessibility issues to ensure compliance with WCAG 2.1 standards',
    learnMore: 'https://www.w3.org/WAI/WCAG21/quickref/'
  }),

  GUARDIAN_PERFORMANCE_BUDGET_EXCEEDED: (metric: string, actual: number, budget: number): ErrorContext => ({
    code: 'GUARDIAN_003',
    message: `Performance budget exceeded: ${metric} is ${actual}ms (budget: ${budget}ms)`,
    severity: 'high',
    suggestion: 'Optimize resources, enable compression, or use a CDN',
    learnMore: 'docs/guardian/performance.md'
  }),

  GUARDIAN_CSP_MISSING: (): ErrorContext => ({
    code: 'GUARDIAN_004',
    message: 'Content Security Policy (CSP) header is missing',
    severity: 'medium',
    suggestion: 'Add CSP header to prevent XSS and other injection attacks',
    quickFix: `Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'`,
    learnMore: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP'
  }),

  // General Errors
  CONFIGURATION_NOT_FOUND: (configPath: string): ErrorContext => ({
    code: 'CONFIG_001',
    message: `Configuration file not found: ${configPath}`,
    severity: 'medium',
    suggestion: 'Create a configuration file or run the setup wizard',
    quickFix: 'pnpm setup',
    learnMore: 'docs/configuration.md'
  }),

  DEPENDENCIES_NOT_INSTALLED: (): ErrorContext => ({
    code: 'DEPS_001',
    message: 'Dependencies are not installed',
    severity: 'critical',
    suggestion: 'Install dependencies before running ODAVL commands',
    quickFix: 'pnpm install',
  }),

  BUILD_REQUIRED: (package_: string): ErrorContext => ({
    code: 'BUILD_001',
    message: `Package "${package_}" is not built`,
    severity: 'high',
    suggestion: 'Build the platform before running commands',
    quickFix: 'pnpm build',
  }),

  PERMISSION_DENIED: (path: string): ErrorContext => ({
    code: 'PERM_001',
    message: `Permission denied: ${path}`,
    severity: 'critical',
    suggestion: 'Check file/directory permissions or run with appropriate privileges',
  }),

  NETWORK_ERROR: (url: string, error: string): ErrorContext => ({
    code: 'NET_001',
    message: `Network error while accessing ${url}: ${error}`,
    severity: 'high',
    suggestion: 'Check your internet connection and try again',
  }),
};

/**
 * Format and display an enhanced error
 */
export function displayError(context: ErrorContext): void {
  const error = new EnhancedError(context);
  console.error(error.format());
}

/**
 * Create a success message with similar formatting
 */
export function displaySuccess(message: string, details?: string): void {
  const colors = {
    green: '\x1b[32m',
    bold: '\x1b[1m',
    dim: '\x1b[2m',
    reset: '\x1b[0m',
  };

  console.log('');
  console.log(`${colors.green}${colors.bold}✅ SUCCESS${colors.reset} ${message}`);
  if (details) {
    console.log(`${colors.dim}   ${details}${colors.reset}`);
  }
  console.log('');
}

/**
 * Create a warning message
 */
export function displayWarning(message: string, suggestion?: string): void {
  const colors = {
    yellow: '\x1b[33m',
    bold: '\x1b[1m',
    dim: '\x1b[2m',
    reset: '\x1b[0m',
  };

  console.log('');
  console.log(`${colors.yellow}${colors.bold}⚠️  WARNING${colors.reset} ${message}`);
  if (suggestion) {
    console.log(`${colors.dim}   💡 ${suggestion}${colors.reset}`);
  }
  console.log('');
}

/**
 * Create an info message
 */
export function displayInfo(message: string, details?: string): void {
  const colors = {
    cyan: '\x1b[36m',
    bold: '\x1b[1m',
    dim: '\x1b[2m',
    reset: '\x1b[0m',
  };

  console.log('');
  console.log(`${colors.cyan}${colors.bold}ℹ️  INFO${colors.reset} ${message}`);
  if (details) {
    console.log(`${colors.dim}   ${details}${colors.reset}`);
  }
  console.log('');
}
