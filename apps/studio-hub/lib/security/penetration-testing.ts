/**
 * Automated Penetration Testing Script
 *
 * Uses OWASP ZAP for automated security testing
 * Integrates with CI/CD pipeline for continuous security validation
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import { logger } from '@/lib/logger';

const execAsync = promisify(exec);

export interface PentestResult {
  timestamp: Date;
  target: string;
  duration: number;
  alerts: Alert[];
  summary: {
    high: number;
    medium: number;
    low: number;
    informational: number;
  };
  passed: boolean;
  score: number;
}

export interface Alert {
  id: string;
  name: string;
  risk: 'High' | 'Medium' | 'Low' | 'Informational';
  confidence: 'High' | 'Medium' | 'Low';
  description: string;
  solution: string;
  url: string;
  method: string;
  param?: string;
  evidence?: string;
  cwe?: number;
  wasc?: number;
  reference: string;
}

/**
 * Run OWASP ZAP baseline scan
 */
export async function runBaselineScan(targetUrl: string): Promise<PentestResult> {
  const startTime = Date.now();
  const reportPath = path.join(process.cwd(), 'reports', 'security', `zap-report-${Date.now()}.json`);

  try {
    logger.emoji('🔍', `Starting OWASP ZAP baseline scan on ${targetUrl}...`);

    // Run ZAP baseline scan
    // Note: Requires Docker or ZAP installed locally
    const command = `docker run --rm \
      -v ${path.join(process.cwd(), 'reports', 'security')}:/zap/wrk:rw \
      -t ghcr.io/zaproxy/zaproxy:stable zap-baseline.py \
      -t ${targetUrl} \
      -J zap-report-${Date.now()}.json \
      -r zap-report-${Date.now()}.html`;

    const { stdout, stderr } = await execAsync(command, {
      maxBuffer: 10 * 1024 * 1024, // 10MB buffer
    });

    logger.debug('ZAP scan output', { stdout });

    // Parse ZAP report
    const reportContent = await fs.readFile(reportPath, 'utf-8');
    const zapReport = JSON.parse(reportContent);

    const alerts = parseZAPAlerts(zapReport);
    const summary = calculateSummary(alerts);

    const duration = Date.now() - startTime;
    const score = calculateSecurityScore(summary);
    const passed = summary.high === 0 && summary.medium <= 5;

    return {
      timestamp: new Date(),
      target: targetUrl,
      duration,
      alerts,
      summary,
      passed,
      score,
    };
  } catch (error) {
    logger.error('ZAP scan failed', error as Error);
    throw error;
  }
}

/**
 * Run full OWASP ZAP scan (includes spider and active scan)
 */
export async function runFullScan(targetUrl: string): Promise<PentestResult> {
  const startTime = Date.now();

  try {
    logger.emoji('🔍', `Starting OWASP ZAP full scan on ${targetUrl}...`);
    logger.warn('This may take 30-60 minutes');

    const command = `docker run --rm \
      -v ${path.join(process.cwd(), 'reports', 'security')}:/zap/wrk:rw \
      -t ghcr.io/zaproxy/zaproxy:stable zap-full-scan.py \
      -t ${targetUrl} \
      -J zap-full-report-${Date.now()}.json \
      -r zap-full-report-${Date.now()}.html`;

    const { stdout } = await execAsync(command, {
      maxBuffer: 50 * 1024 * 1024, // 50MB buffer
      timeout: 3600000, // 1 hour timeout
    });

    logger.debug('ZAP full scan output', { stdout });

    // Parse results (similar to baseline)
    const reportPath = path.join(
      process.cwd(),
      'reports',
      'security',
      `zap-full-report-${Date.now()}.json`
    );

    const reportContent = await fs.readFile(reportPath, 'utf-8');
    const zapReport = JSON.parse(reportContent);

    const alerts = parseZAPAlerts(zapReport);
    const summary = calculateSummary(alerts);

    const duration = Date.now() - startTime;
    const score = calculateSecurityScore(summary);
    const passed = summary.high === 0 && summary.medium <= 3;

    return {
      timestamp: new Date(),
      target: targetUrl,
      duration,
      alerts,
      summary,
      passed,
      score,
    };
  } catch (error) {
    logger.error('ZAP full scan failed', error as Error);
    throw error;
  }
}

/**
 * Test for common vulnerabilities
 */
export async function testCommonVulnerabilities(baseUrl: string): Promise<{
  tests: Array<{
    name: string;
    passed: boolean;
    details?: string;
  }>;
  totalTests: number;
  passedTests: number;
}> {
  const tests = [
    {
      name: 'SQL Injection Protection',
      test: async () => {
        try {
          const response = await fetch(`${baseUrl}/api/test?id=1' OR '1'='1`);
          return response.status === 400 || response.status === 403;
        } catch (error) {
          console.error('SQL Injection test failed:', error);
          return false;
        }
      },
    },
    {
      name: 'XSS Protection',
      test: async () => {
        try {
          const response = await fetch(`${baseUrl}/api/test?name=<script>alert(1)</script>`);
          const text = await response.text();
          return !text.includes('<script>');
        } catch (error) {
          console.error('XSS Protection test failed:', error);
          return false;
        }
      },
    },
    {
      name: 'CSRF Protection',
      test: async () => {
        try {
          const response = await fetch(`${baseUrl}/api/protected`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ test: 'data' }),
          });
          return response.status === 403;
        } catch (error) {
          console.error('CSRF Protection test failed:', error);
          return false;
        }
      },
    },
    {
      name: 'HTTPS Enforcement',
      test: async () => {
        try {
          const response = await fetch(baseUrl.replace('https://', 'http://'));
          return response.redirected && response.url.startsWith('https://');
        } catch {
          return true; // Connection refused is also good (HTTP not enabled)
        }
      },
    },
    {
      name: 'Security Headers Present',
      test: async () => {
        try {
          const response = await fetch(baseUrl);
          const headers = response.headers;

          return (
            headers.has('strict-transport-security') &&
            headers.has('x-frame-options') &&
            headers.has('x-content-type-options') &&
            headers.has('content-security-policy')
          );
        } catch (error) {
          console.error('Security Headers test failed:', error);
          return false;
        }
      },
    },
    {
      name: 'Rate Limiting Enforced',
      test: async () => {
        try {
          // Make 20 rapid requests
          const requests = Array.from({ length: 20 }, () =>
            fetch(`${baseUrl}/api/test`).catch(() => null)
          );

          const responses = await Promise.all(requests);
          const validResponses = responses.filter((r): r is Response => r !== null);
          const rateLimited = validResponses.some(r => r.status === 429);

          return rateLimited;
        } catch (error) {
          console.error('Rate Limiting test failed:', error);
          return false;
        }
      },
    },
    {
      name: 'Directory Listing Disabled',
      test: async () => {
        try {
          const response = await fetch(`${baseUrl}/static/`);
          return response.status === 404 || response.status === 403;
        } catch (error) {
          console.error('Directory Listing test failed:', error);
          return false;
        }
      },
    },
    {
      name: 'Error Messages Not Verbose',
      test: async () => {
        try {
          const response = await fetch(`${baseUrl}/api/nonexistent`);
          const text = await response.text();

          return (
            !text.includes('stack trace') &&
            !text.includes('at Object') &&
            !text.includes('node_modules')
          );
        } catch (error) {
          console.error('Error Messages test failed:', error);
          return false;
        }
      },
    },
  ];

  const results = await Promise.all(
    tests.map(async ({ name, test }) => {
      try {
        const passed = await test();
        return { name, passed };
      } catch (error) {
        return {
          name,
          passed: false,
          details: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    })
  );

  return {
    tests: results,
    totalTests: tests.length,
    passedTests: results.filter(r => r.passed).length,
  };
}

/**
 * Generate penetration testing report
 */
export async function generatePentestReport(
  result: PentestResult
): Promise<string> {
  const report = `
# Penetration Testing Report

**Generated:** ${result.timestamp.toISOString()}
**Target:** ${result.target}
**Duration:** ${Math.round(result.duration / 1000)}s
**Overall Score:** ${result.score}/100
**Status:** ${result.passed ? '✅ PASSED' : '❌ FAILED'}

## Summary

| Risk Level | Count |
|------------|-------|
| High       | ${result.summary.high} |
| Medium     | ${result.summary.medium} |
| Low        | ${result.summary.low} |
| Info       | ${result.summary.informational} |

## Detailed Findings

${result.alerts
  .filter(a => a.risk === 'High')
  .map(alert => `
### 🔴 ${alert.name} (High Risk)
**URL:** ${alert.url}
**Method:** ${alert.method}
**CWE:** ${alert.cwe || 'N/A'}

**Description:**
${alert.description}

**Solution:**
${alert.solution}

**Reference:**
${alert.reference}
`).join('\n')}

${result.alerts
  .filter(a => a.risk === 'Medium')
  .map(alert => `
### 🟡 ${alert.name} (Medium Risk)
**URL:** ${alert.url}
**Description:** ${alert.description}
**Solution:** ${alert.solution}
`).join('\n')}

## Recommendations

${result.summary.high > 0 ? '⚠️  CRITICAL: Fix all high-risk vulnerabilities immediately\n' : ''}
${result.summary.medium > 5 ? '⚠️  Address medium-risk vulnerabilities before production\n' : ''}
${result.passed ? '✅ No critical security issues found\n' : ''}

## Next Steps

1. Review and prioritize findings
2. Assign remediation tasks to development team
3. Implement fixes and re-test
4. Document security improvements
5. Schedule next penetration test
`;

  return report;
}

// Helper functions

interface ZAPReport {
  site?: Array<{
    '@name'?: string;
    alerts?: Array<{
      pluginid?: string;
      name?: string;
      risk?: string;
      riskdesc?: string;
      confidence?: string;
      desc?: string;
      description?: string;
      solution?: string;
      url?: string;
      method?: string;
      param?: string;
      evidence?: string;
      cweid?: string;
      wascid?: string;
      reference?: string;
    }>;
  }>;
}

/**
 * Helper function to parse a single ZAP alert into our Alert format
 */
function parseZAPAlert(alert: any, siteName: string): Alert {
  const riskLevel = alert.riskdesc?.split(' ')[0] || alert.risk || 'Informational';

  return {
    id: alert.pluginid || 'unknown',
    name: alert.name || 'Unknown Alert',
    risk: riskLevel as Alert['risk'],
    confidence: (alert.confidence || 'Medium') as Alert['confidence'],
    description: alert.desc || alert.description || '',
    solution: alert.solution || '',
    url: alert.url || siteName || '',
    method: alert.method || 'GET',
    param: alert.param,
    evidence: alert.evidence,
    cwe: alert.cweid ? parseInt(alert.cweid) : undefined,
    wasc: alert.wascid ? parseInt(alert.wascid) : undefined,
    reference: alert.reference || '',
  };
}

/**
 * Parse ZAP report alerts into simplified Alert format
 * Reduced complexity: cognitive 33→15, cyclomatic 20→8
 */
function parseZAPAlerts(zapReport: ZAPReport): Alert[] {
  const alerts: Alert[] = [];

  if (!zapReport.site) {
    return alerts;
  }

  for (const site of zapReport.site) {
    if (!site.alerts) continue;

    const siteName = site['@name'] || '';
    for (const alert of site.alerts) {
      alerts.push(parseZAPAlert(alert, siteName));
    }
  }

  return alerts;
}

function calculateSummary(alerts: Alert[]): {
  high: number;
  medium: number;
  low: number;
  informational: number;
} {
  return {
    high: alerts.filter(a => a.risk === 'High').length,
    medium: alerts.filter(a => a.risk === 'Medium').length,
    low: alerts.filter(a => a.risk === 'Low').length,
    informational: alerts.filter(a => a.risk === 'Informational').length,
  };
}

function calculateSecurityScore(summary: {
  high: number;
  medium: number;
  low: number;
  informational: number;
}): number {
  let score = 100;

  score -= summary.high * 20;
  score -= summary.medium * 10;
  score -= summary.low * 5;
  score -= summary.informational * 1;

  return Math.max(0, score);
}
