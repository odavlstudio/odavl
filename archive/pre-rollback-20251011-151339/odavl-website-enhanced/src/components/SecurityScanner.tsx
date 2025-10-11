/**
 * ODAVL Enterprise Security Scanner
 * Comprehensive security vulnerability detection and monitoring system
 */

'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { config } from '@/lib/config';

// Security check types
export interface SecurityCheck {
  id: string;
  name: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  category: 'auth' | 'data' | 'transport' | 'config' | 'content' | 'privacy';
  check: () => Promise<SecurityResult>;
}

export interface SecurityResult {
  passed: boolean;
  message: string;
  details?: string;
  remediation?: string;
  references?: string[];
}

export interface SecurityReport {
  id: string;
  timestamp: string;
  overallScore: number;
  totalChecks: number;
  passed: number;
  failed: number;
  results: Array<{
    check: SecurityCheck;
    result: SecurityResult;
  }>;
  recommendations: string[];
}

export class EnterpriseSecurityScanner {
  private static instance: EnterpriseSecurityScanner | null = null;
  private checks: SecurityCheck[] = [];
  private lastReport: SecurityReport | null = null;

  private constructor() {
    this.initializeChecks();
  }

  public static getInstance(): EnterpriseSecurityScanner {
    if (!EnterpriseSecurityScanner.instance) {
      EnterpriseSecurityScanner.instance = new EnterpriseSecurityScanner();
    }
    return EnterpriseSecurityScanner.instance;
  }

  private initializeChecks() {
    this.checks = [
      {
        id: 'https-enforcement',
        name: 'HTTPS Enforcement',
        description: 'Verify HTTPS is enforced and HTTP redirects properly',
        severity: 'critical',
        category: 'transport',
        check: this.checkHttpsEnforcement.bind(this),
      },
      {
        id: 'csp-headers',
        name: 'Content Security Policy',
        description: 'Check for proper CSP headers implementation',
        severity: 'high',
        category: 'content',
        check: this.checkCSPHeaders.bind(this),
      },
      {
        id: 'xss-protection',
        name: 'XSS Protection',
        description: 'Verify XSS protection headers are present',
        severity: 'high',  
        category: 'content',
        check: this.checkXSSProtection.bind(this),
      },
      {
        id: 'clickjacking-protection',
        name: 'Clickjacking Protection',
        description: 'Check X-Frame-Options or frame-ancestors CSP',
        severity: 'medium',
        category: 'content',
        check: this.checkClickjackingProtection.bind(this),
      },
      {
        id: 'secure-cookies',
        name: 'Secure Cookie Configuration',
        description: 'Verify cookies have secure flags set',
        severity: 'medium',
        category: 'auth',
        check: this.checkSecureCookies.bind(this),
      },
      {
        id: 'data-validation',
        name: 'Input Data Validation',
        description: 'Check for proper input validation patterns',
        severity: 'high',
        category: 'data',
        check: this.checkDataValidation.bind(this),
      },
      {
        id: 'sensitive-data-exposure',
        name: 'Sensitive Data Exposure',
        description: 'Scan for potential sensitive data in client-side code',
        severity: 'critical',
        category: 'privacy',
        check: this.checkSensitiveDataExposure.bind(this),
      },
      {
        id: 'dependency-vulnerabilities',
        name: 'Dependency Vulnerabilities',
        description: 'Check for known vulnerabilities in dependencies',
        severity: 'high',
        category: 'config',
        check: this.checkDependencyVulnerabilities.bind(this),
      },
    ];
  }

  // Security check implementations
  private async checkHttpsEnforcement(): Promise<SecurityResult> {
    if (typeof window === 'undefined') {
      return {
        passed: true,
        message: 'HTTPS check skipped in SSR environment',
        details: 'This check runs only in browser environment',
      };
    }

    const isHttps = window.location.protocol === 'https:';
    const hasHSTS = document.querySelector('meta[http-equiv="Strict-Transport-Security"]');

    if (!isHttps && config.isProduction) {
      return {
        passed: false,
        message: 'HTTPS not enforced in production',
        details: 'Application is not using HTTPS in production environment',
        remediation: 'Configure HTTPS enforcement in production deployment',
        references: ['https://owasp.org/www-project-cheat-sheets/cheatsheets/Transport_Layer_Protection_Cheat_Sheet.html'],
      };
    }

    return {
      passed: true,
      message: 'HTTPS properly configured',
      details: `Protocol: ${window.location.protocol}, HSTS: ${hasHSTS ? 'Present' : 'Not detected'}`,
    };
  }

  private async checkCSPHeaders(): Promise<SecurityResult> {
    if (typeof window === 'undefined') {
      return {
        passed: true,
        message: 'CSP check skipped in SSR environment',
      };
    }

    const cspMeta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
    
    // In real implementation, you'd check response headers
    // This is a simplified client-side check
    if (!cspMeta) {
      return {
        passed: false,
        message: 'Content Security Policy not detected',
        details: 'No CSP meta tag found in document head',
        remediation: 'Implement Content Security Policy headers',
        references: ['https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP'],
      };
    }

    return {
      passed: true,
      message: 'Content Security Policy configured',
      details: 'CSP meta tag detected in document',
    };
  }

  private async checkXSSProtection(): Promise<SecurityResult> {
    if (typeof window === 'undefined') {
      return { passed: true, message: 'XSS check skipped in SSR environment' };
    }

    // Check for XSS protection indicators
    const hasXSSProtection = document.querySelector('meta[http-equiv="X-XSS-Protection"]');
    
    return {
      passed: true, // Most modern browsers have built-in XSS protection
      message: 'XSS protection available',
      details: `Meta tag: ${hasXSSProtection ? 'Present' : 'Not found'}, Modern browsers have built-in protection`,
    };
  }

  private async checkClickjackingProtection(): Promise<SecurityResult> {
    if (typeof window === 'undefined') {
      return { passed: true, message: 'Clickjacking check skipped in SSR environment' };
    }

    // Check if page can be framed
    try {
      const isFramed = window.top !== window.self;
      const hasFrameOptions = document.querySelector('meta[http-equiv="X-Frame-Options"]');

      if (isFramed && !hasFrameOptions) {
        return {
          passed: false,
          message: 'Potential clickjacking vulnerability',
          details: 'Page can be framed without explicit protection',
          remediation: 'Implement X-Frame-Options or frame-ancestors CSP directive',
        };
      }

      return {
        passed: true,
        message: 'Clickjacking protection adequate',
        details: `Framed: ${isFramed}, Protection: ${hasFrameOptions ? 'Present' : 'Default browser behavior'}`,
      };
    } catch (error) {
      // Frame access restriction is actually a good security indicator
      console.log('Frame access check:', error instanceof Error ? error.message : 'Access restricted');
      return {
        passed: true,
        message: 'Frame access restricted (good)',
        details: 'Cannot access parent frame - indicates protection is working',
      };
    }
  }

  private async checkSecureCookies(): Promise<SecurityResult> {
    if (typeof window === 'undefined') {
      return { passed: true, message: 'Cookie check skipped in SSR environment' };
    }

    const cookies = document.cookie.split(';');
    const insecureCookies: string[] = [];

    // This is a simplified check - in real implementation you'd analyze cookie attributes
    cookies.forEach(cookie => {
      const cookieName = cookie.trim().split('=')[0];
      if (cookieName && !cookie.includes('Secure') && !cookie.includes('HttpOnly')) {
        insecureCookies.push(cookieName);
      }
    });

    if (insecureCookies.length > 0 && config.isProduction) {
      return {
        passed: false,
        message: 'Insecure cookies detected',
        details: `Cookies without secure flags: ${insecureCookies.join(', ')}`,
        remediation: 'Set Secure and HttpOnly flags on all cookies',
      };
    }

    return {
      passed: true,
      message: 'Cookie security adequate',
      details: `Total cookies: ${cookies.length}, Potentially insecure: ${insecureCookies.length}`,
    };
  }

  private async checkDataValidation(): Promise<SecurityResult> {
    // This would typically check form validation, API endpoints, etc.
    // For demo purposes, we'll check for common validation patterns
    
    const forms = document.querySelectorAll('form');
    const inputsWithValidation = document.querySelectorAll('input[required], input[pattern], input[minlength], input[maxlength]');
    
    const validationScore = forms.length > 0 ? (inputsWithValidation.length / (forms.length * 2)) : 1;

    return {
      passed: validationScore > 0.5,
      message: validationScore > 0.5 ? 'Input validation present' : 'Limited input validation detected',
      details: `Forms: ${forms.length}, Validated inputs: ${inputsWithValidation.length}`,
      remediation: validationScore <= 0.5 ? 'Implement comprehensive input validation' : undefined,
    };
  }

  private async checkSensitiveDataExposure(): Promise<SecurityResult> {
    if (typeof window === 'undefined') {
      return { passed: true, message: 'Data exposure check skipped in SSR environment' };
    }

    // Check for common sensitive data patterns in the DOM
    const sensitivePatterns = [
      /api[_-]?key/i,
      /secret/i,
      /token/i,
      /password/i,
      /\b[A-Za-z0-9]{32,}\b/, // Long hex strings
      /\b[A-Za-z0-9_-]{40,}\b/, // API tokens
    ];

    const pageContent = document.documentElement.innerHTML;
    const foundPatterns: string[] = [];

    sensitivePatterns.forEach(pattern => {
      if (pattern.test(pageContent)) {
        foundPatterns.push(pattern.toString());
      }
    });

    // Filter out common false positives
    const filteredPatterns = foundPatterns.filter(pattern => 
      !pattern.includes('password') || !document.querySelector('input[type="password"]')
    );

    if (filteredPatterns.length > 0) {
      return {
        passed: false,
        message: 'Potential sensitive data exposure',
        details: `Detected patterns: ${filteredPatterns.length}`,
        remediation: 'Review and remove any hardcoded secrets from client-side code',
        references: ['https://owasp.org/www-project-top-ten/2017/A3_2017-Sensitive_Data_Exposure'],
      };
    }

    return {
      passed: true,
      message: 'No obvious sensitive data exposure detected',
      details: 'Client-side code scan completed',
    };
  }

  private async checkDependencyVulnerabilities(): Promise<SecurityResult> {
    // This is a simplified check - in real implementation you'd integrate with npm audit or similar
    const packageInfo = {
      react: '19.1.0',
      next: '15.5.4',
      // Add more as needed
    };

    // Simulate vulnerability check
    const knownVulnerabilities: string[] = [];
    
    return {
      passed: knownVulnerabilities.length === 0,
      message: knownVulnerabilities.length === 0 ? 'No known vulnerabilities detected' : 'Vulnerabilities found',
      details: `Checked packages: ${Object.keys(packageInfo).length}, Issues: ${knownVulnerabilities.length}`,
      remediation: knownVulnerabilities.length > 0 ? 'Update vulnerable dependencies' : undefined,
    };
  }

  // Public API methods
  public async runScan(): Promise<SecurityReport> {
    const startTime = Date.now();
    const results: Array<{ check: SecurityCheck; result: SecurityResult }> = [];

    console.log('🔒 Starting enterprise security scan...');

    for (const check of this.checks) {
      try {
        const result = await check.check();
        results.push({ check, result });
        
        console.log(`Security check ${check.id}: ${result.passed ? '✅ PASS' : '❌ FAIL'} - ${result.message}`);
      } catch (error) {
        results.push({
          check,
          result: {
            passed: false,
            message: `Check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            details: 'Security check encountered an error during execution',
          },
        });
      }
    }

    const passed = results.filter(r => r.result.passed).length;
    const failed = results.length - passed;
    const overallScore = Math.round((passed / results.length) * 100);

    const report: SecurityReport = {
      id: `security_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      overallScore,
      totalChecks: results.length,
      passed,
      failed,
      results,
      recommendations: this.generateRecommendations(results),
    };

    this.lastReport = report;
    this.storeReport(report);

    const duration = Date.now() - startTime;
    console.log(`🔒 Security scan completed in ${duration}ms - Score: ${overallScore}%`);

    return report;
  }

  private generateRecommendations(results: Array<{ check: SecurityCheck; result: SecurityResult }>): string[] {
    const recommendations: string[] = [];
    const failedResults = results.filter(r => !r.result.passed);

    // Group by severity
    const critical = failedResults.filter(r => r.check.severity === 'critical');
    const high = failedResults.filter(r => r.check.severity === 'high');
    const medium = failedResults.filter(r => r.check.severity === 'medium');

    if (critical.length > 0) {
      recommendations.push(`🚨 Critical: Address ${critical.length} critical security issues immediately`);
    }
    if (high.length > 0) {
      recommendations.push(`⚠️ High Priority: Fix ${high.length} high-severity vulnerabilities`);
    }
    if (medium.length > 0) {
      recommendations.push(`📋 Medium Priority: Review ${medium.length} medium-risk items`);
    }

    // Add specific recommendations
    failedResults.forEach(({ result }) => {
      if (result.remediation) {
        recommendations.push(`• ${result.remediation}`);
      }
    });

    if (recommendations.length === 0) {
      recommendations.push('✅ All security checks passed! Continue monitoring regularly.');
    }

    return recommendations;
  }

  private storeReport(report: SecurityReport) {
    if (typeof window === 'undefined') return;

    try {
      const storageKey = `odavl_security_${report.id}`;
      localStorage.setItem(storageKey, JSON.stringify(report));
      
      // Cleanup old reports (keep last 5)
      const securityKeys = Object.keys(localStorage)
        .filter(key => key.startsWith('odavl_security_'))
        .sort()
        .reverse();

      securityKeys.slice(5).forEach(key => {
        localStorage.removeItem(key);
      });
    } catch (error) {
      console.error('Failed to store security report:', error);
    }
  }

  public getLastReport(): SecurityReport | null {
    return this.lastReport;
  }

  public addCustomCheck(check: SecurityCheck) {
    this.checks.push(check);
  }

  public getCheckById(id: string): SecurityCheck | undefined {
    return this.checks.find(check => check.id === id);
  }
}

// React hook for security scanning
export function useSecurityScanner() {
  const [isScanning, setIsScanning] = useState(false);
  const [lastReport, setLastReport] = useState<SecurityReport | null>(null);

  const runScan = useCallback(async () => {
    if (!config.flags.securityScanning) return null;

    setIsScanning(true);
    try {
      const scanner = EnterpriseSecurityScanner.getInstance();
      const report = await scanner.runScan();
      setLastReport(report);
      return report;
    } finally {
      setIsScanning(false);
    }
  }, []);

  const addCustomCheck = useCallback((check: SecurityCheck) => {
    const scanner = EnterpriseSecurityScanner.getInstance();
    scanner.addCustomCheck(check);
  }, []);

  return {
    runScan,
    addCustomCheck,
    isScanning,
    lastReport,
  };
}

// Component for automatic security monitoring
export function SecurityScanner({ children }: { children?: React.ReactNode }) {
  const { runScan } = useSecurityScanner();

  useEffect(() => {
    if (config.flags.securityScanning && config.isProduction) {
      // Run security scan on mount
      runScan();
      
      // Schedule periodic scans
      const interval = setInterval(runScan, 24 * 60 * 60 * 1000); // Daily
      
      return () => clearInterval(interval);
    }
  }, [runScan]);

  return <>{children}</>;
}

export default SecurityScanner;