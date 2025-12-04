/**
 * Security Testing
 * OWASP Top 10 basic checks (headers, cookies, mixed content)
 */

import type { SecurityResult, SecurityVulnerability } from '../types.js';

export async function testSecurity(url: string): Promise<SecurityResult> {
  console.log(`🔒 Running security tests on ${url}...`);
  
  try {
    const puppeteer = await import('puppeteer');
    
    const browser = await puppeteer.default.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    
    const page = await browser.newPage();
    
    const vulnerabilities: SecurityVulnerability[] = [];
    const recommendations: string[] = [];
    
    // Listen for mixed content warnings
    page.on('console', (msg: any) => {
      if (msg.text().includes('Mixed Content')) {
        vulnerabilities.push({
          type: 'Misconfiguration',
          severity: 'medium',
          description: 'Mixed Content: Loading HTTP resources on HTTPS page',
          evidence: msg.text(),
          fix: 'Use HTTPS for all resources',
        });
      }
    });
    
    const response = await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    
    if (!response) {
      throw new Error('Failed to load page');
    }
    
    const headers = response.headers();
    
    // Check security headers
    const securityHeaders = {
      'strict-transport-security': {
        name: 'HSTS',
        severity: 'high' as const,
        recommendation: 'Add Strict-Transport-Security header',
      },
      'content-security-policy': {
        name: 'CSP',
        severity: 'high' as const,
        recommendation: 'Add Content-Security-Policy header',
      },
      'x-frame-options': {
        name: 'Clickjacking Protection',
        severity: 'medium' as const,
        recommendation: 'Add X-Frame-Options: DENY header',
      },
      'x-content-type-options': {
        name: 'MIME Sniffing Protection',
        severity: 'low' as const,
        recommendation: 'Add X-Content-Type-Options: nosniff header',
      },
    };
    
    for (const [header, info] of Object.entries(securityHeaders)) {
      if (!headers[header]) {
        vulnerabilities.push({
          type: 'Misconfiguration',
          severity: info.severity,
          description: `Missing ${info.name} header`,
          fix: info.recommendation,
        });
        recommendations.push(info.recommendation);
      }
    }
    
    // Check for sensitive data in URLs (basic check)
    const urlLower = url.toLowerCase();
    if (urlLower.includes('password') || urlLower.includes('token') || urlLower.includes('key')) {
      vulnerabilities.push({
        type: 'SensitiveData',
        severity: 'critical',
        description: 'Sensitive data detected in URL',
        evidence: 'URL contains: password/token/key',
        fix: 'Use POST requests and encrypt sensitive data',
      });
    }
    
    // Check cookies security
    const cookies = await page.cookies();
    for (const cookie of cookies) {
      if (!cookie.secure && url.startsWith('https')) {
        vulnerabilities.push({
          type: 'Misconfiguration',
          severity: 'medium',
          description: `Cookie "${cookie.name}" missing Secure flag`,
          fix: 'Set Secure flag on all cookies for HTTPS sites',
        });
      }
      if (!cookie.httpOnly && cookie.name.toLowerCase().includes('session')) {
        vulnerabilities.push({
          type: 'BrokenAuth',
          severity: 'high',
          description: `Session cookie "${cookie.name}" missing HttpOnly flag`,
          fix: 'Set HttpOnly flag to prevent XSS attacks',
        });
      }
    }
    
    await browser.close();
    
    // Calculate score (100 - weighted by severity)
    const severityWeights = { low: 2, medium: 5, high: 10, critical: 20 };
    const totalPenalty = vulnerabilities.reduce(
      (sum, v) => sum + severityWeights[v.severity],
      0
    );
    const score = Math.max(0, 100 - totalPenalty);
    
    return {
      url,
      timestamp: new Date().toISOString(),
      vulnerabilities,
      score,
      recommendations: [...new Set(recommendations)], // Deduplicate
    };
  } catch (error) {
    console.error('Security test failed:', error);
    throw new Error(`Failed to test security: ${(error as Error).message}`);
  }
}
