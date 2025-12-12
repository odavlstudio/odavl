/**
 * Security Dashboard - Real-time security metrics visualization
 * 
 * Purpose: Centralized security posture monitoring
 * Week 30: Security Reporting (File 1/3)
 * 
 * Dashboard Sections:
 * - Vulnerability Overview (CVE count, CVSS scores, trends)
 * - License Compliance (risk distribution, conflicts)
 * - Compliance Status (GDPR, HIPAA, SOC2 scores)
 * - Code Security (SAST findings, secrets exposed)
 * - Supply Chain (dependency risks, SBOM health)
 * 
 * Metrics Tracked:
 * - Mean Time to Remediate (MTTR)
 * - Vulnerability Density (vulns per 1K LOC)
 * - Security Debt (estimated hours to fix)
 * - Compliance Score (0-100)
 * - Risk Score (0-100)
 * 
 * @module @odavl-studio/core/reporting/security-dashboard
 */

import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * Dashboard metric
 */
export interface DashboardMetric {
  name: string;
  value: number | string;
  unit?: string;
  trend?: 'up' | 'down' | 'stable';
  trendPercentage?: number;
  severity?: 'critical' | 'high' | 'medium' | 'low' | 'info';
  status?: 'good' | 'warning' | 'danger';
}

/**
 * Vulnerability metrics
 */
export interface VulnerabilityMetrics {
  total: number;
  bySeverity: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  byCVSS: {
    '9.0-10.0': number; // Critical
    '7.0-8.9': number;  // High
    '4.0-6.9': number;  // Medium
    '0.1-3.9': number;  // Low
  };
  mttr: number; // Mean Time to Remediate (days)
  openVulns: number;
  closedVulns: number;
  vulnerabilityDensity: number; // Vulns per 1K LOC
  securityDebt: number; // Estimated hours to fix all
  topPackages: Array<{
    package: string;
    vulnCount: number;
    highestSeverity: string;
  }>;
}

/**
 * License metrics
 */
export interface LicenseMetrics {
  total: number;
  byRisk: {
    low: number;      // Permissive (MIT, Apache, BSD)
    medium: number;   // Weak copyleft (LGPL, MPL)
    high: number;     // Strong copyleft (GPL, AGPL)
    critical: number; // Unknown/Proprietary
  };
  conflicts: number;
  canShip: boolean;
  copyleftCount: number;
  osiApprovedCount: number;
  topLicenses: Array<{
    license: string;
    count: number;
    risk: string;
  }>;
}

/**
 * Compliance metrics
 */
export interface ComplianceMetrics {
  gdpr: {
    score: number; // 0-100
    critical: number;
    high: number;
    readiness: 'not-ready' | 'partially-ready' | 'ready';
  };
  hipaa: {
    score: number;
    controlDeficiencies: number;
    phiExposure: number;
    readiness: 'not-ready' | 'partially-ready' | 'ready';
  };
  soc2: {
    score: number;
    controlDeficiencies: number;
    evidenceGaps: number;
    readiness: 'not-ready' | 'partially-ready' | 'ready';
  };
  overall: {
    score: number;
    readiness: 'not-ready' | 'partially-ready' | 'ready';
  };
}

/**
 * Code security metrics
 */
export interface CodeSecurityMetrics {
  sastFindings: number;
  secretsExposed: number;
  byCategory: {
    injection: number;        // SQL, XSS, Command
    brokenAuth: number;       // Weak passwords, no MFA
    sensitiveData: number;    // Unencrypted data
    xxe: number;              // XML External Entities
    brokenAccessControl: number;
    securityMisconfig: number;
    xss: number;
    insecureDeserialization: number;
    knownVulns: number;       // Using components with known vulns
    insufficientLogging: number;
  };
  codeQuality: {
    complexity: number; // Average cyclomatic complexity
    duplication: number; // Duplication percentage
    coverage: number; // Test coverage percentage
  };
}

/**
 * Supply chain metrics
 */
export interface SupplyChainMetrics {
  dependencyCount: number;
  directDependencies: number;
  transitiveDependencies: number;
  outdatedPackages: number;
  abandonedPackages: number; // No updates in 2+ years
  sbomGenerated: boolean;
  sbomFormat?: string;
  riskScore: number; // 0-100
}

/**
 * Security dashboard data
 */
export interface SecurityDashboard {
  timestamp: Date;
  vulnerabilities: VulnerabilityMetrics;
  licenses: LicenseMetrics;
  compliance: ComplianceMetrics;
  codeSecurity: CodeSecurityMetrics;
  supplyChain: SupplyChainMetrics;
  summary: {
    overallRiskScore: number; // 0-100 (100 = highest risk)
    securityPosture: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
    criticalIssues: number;
    highIssues: number;
    canDeploy: boolean;
    blockers: string[];
    recommendations: string[];
  };
  trends: {
    vulnerabilities: Array<{ date: Date; count: number }>;
    compliance: Array<{ date: Date; score: number }>;
    riskScore: Array<{ date: Date; score: number }>;
  };
}

/**
 * Dashboard configuration
 */
export interface DashboardConfig {
  rootPath: string;
  includeVulnerabilities?: boolean;
  includeLicenses?: boolean;
  includeCompliance?: boolean;
  includeCodeSecurity?: boolean;
  includeSupplyChain?: boolean;
  includeTrends?: boolean;
  trendDays?: number; // Historical data days
  scanResults?: {
    vulnerabilities?: any;
    licenses?: any;
    compliance?: any;
    sast?: any;
    secrets?: any;
  };
}

/**
 * Security Dashboard Generator
 */
export class SecurityDashboardGenerator {
  private config: Required<DashboardConfig>;
  private dashboard: Partial<SecurityDashboard> = {};

  constructor(config: DashboardConfig) {
    this.config = {
      rootPath: config.rootPath,
      includeVulnerabilities: config.includeVulnerabilities ?? true,
      includeLicenses: config.includeLicenses ?? true,
      includeCompliance: config.includeCompliance ?? true,
      includeCodeSecurity: config.includeCodeSecurity ?? true,
      includeSupplyChain: config.includeSupplyChain ?? true,
      includeTrends: config.includeTrends ?? true,
      trendDays: config.trendDays ?? 30,
      scanResults: config.scanResults ?? {}
    };
  }

  /**
   * Generate security dashboard
   */
  async generate(): Promise<SecurityDashboard> {
    console.log('📊 Generating security dashboard...');

    this.dashboard = {
      timestamp: new Date()
    };

    // Generate vulnerability metrics
    if (this.config.includeVulnerabilities) {
      this.dashboard.vulnerabilities = await this.generateVulnerabilityMetrics();
    }

    // Generate license metrics
    if (this.config.includeLicenses) {
      this.dashboard.licenses = await this.generateLicenseMetrics();
    }

    // Generate compliance metrics
    if (this.config.includeCompliance) {
      this.dashboard.compliance = await this.generateComplianceMetrics();
    }

    // Generate code security metrics
    if (this.config.includeCodeSecurity) {
      this.dashboard.codeSecurity = await this.generateCodeSecurityMetrics();
    }

    // Generate supply chain metrics
    if (this.config.includeSupplyChain) {
      this.dashboard.supplyChain = await this.generateSupplyChainMetrics();
    }

    // Generate summary
    this.dashboard.summary = this.generateSummary();

    // Generate trends
    if (this.config.includeTrends) {
      this.dashboard.trends = await this.generateTrends();
    }

    return this.dashboard as SecurityDashboard;
  }

  /**
   * Generate vulnerability metrics
   */
  private async generateVulnerabilityMetrics(): Promise<VulnerabilityMetrics> {
    const vulnResults = this.config.scanResults.vulnerabilities ?? { findings: [] };
    const findings = vulnResults.findings ?? [];

    const bySeverity = {
      critical: findings.filter((f: any) => f.severity === 'CRITICAL').length,
      high: findings.filter((f: any) => f.severity === 'HIGH').length,
      medium: findings.filter((f: any) => f.severity === 'MEDIUM').length,
      low: findings.filter((f: any) => f.severity === 'LOW').length
    };

    const byCVSS = {
      '9.0-10.0': findings.filter((f: any) => f.cvssScore >= 9.0).length,
      '7.0-8.9': findings.filter((f: any) => f.cvssScore >= 7.0 && f.cvssScore < 9.0).length,
      '4.0-6.9': findings.filter((f: any) => f.cvssScore >= 4.0 && f.cvssScore < 7.0).length,
      '0.1-3.9': findings.filter((f: any) => f.cvssScore > 0 && f.cvssScore < 4.0).length
    };

    // Calculate MTTR (Mean Time to Remediate)
    // Estimate: Critical=1 day, High=7 days, Medium=30 days, Low=90 days
    const mttr =
      (bySeverity.critical * 1 +
        bySeverity.high * 7 +
        bySeverity.medium * 30 +
        bySeverity.low * 90) /
      (findings.length || 1);

    // Calculate security debt (hours)
    // Estimate: Critical=8h, High=4h, Medium=2h, Low=1h
    const securityDebt =
      bySeverity.critical * 8 +
      bySeverity.high * 4 +
      bySeverity.medium * 2 +
      bySeverity.low * 1;

    // Calculate vulnerability density (per 1K LOC)
    const loc = await this.getLOC();
    const vulnerabilityDensity = (findings.length / (loc / 1000)) || 0;

    // Top vulnerable packages
    const packageVulns = new Map<string, { count: number; severity: string }>();
    for (const finding of findings) {
      const pkg = finding.package ?? 'unknown';
      if (!packageVulns.has(pkg)) {
        packageVulns.set(pkg, { count: 0, severity: finding.severity });
      }
      const data = packageVulns.get(pkg)!;
      data.count++;
      // Keep highest severity
      if (this.severityRank(finding.severity) > this.severityRank(data.severity)) {
        data.severity = finding.severity;
      }
    }

    const topPackages = Array.from(packageVulns.entries())
      .map(([pkg, data]) => ({
        package: pkg,
        vulnCount: data.count,
        highestSeverity: data.severity
      }))
      .sort((a, b) => b.vulnCount - a.vulnCount)
      .slice(0, 10);

    return {
      total: findings.length,
      bySeverity,
      byCVSS,
      mttr: Math.round(mttr),
      openVulns: findings.length,
      closedVulns: 0, // Would come from historical data
      vulnerabilityDensity: Math.round(vulnerabilityDensity * 100) / 100,
      securityDebt,
      topPackages
    };
  }

  /**
   * Generate license metrics
   */
  private async generateLicenseMetrics(): Promise<LicenseMetrics> {
    const licenseResults = this.config.scanResults.licenses ?? { findings: [] };
    const findings = licenseResults.findings ?? [];

    const byRisk = {
      low: findings.filter((f: any) => f.risk === 'low').length,
      medium: findings.filter((f: any) => f.risk === 'medium').length,
      high: findings.filter((f: any) => f.risk === 'high').length,
      critical: findings.filter((f: any) => f.risk === 'critical').length
    };

    const copyleftCount = findings.filter((f: any) => f.copyleft).length;
    const osiApprovedCount = findings.filter((f: any) => f.osiApproved).length;

    // Count conflicts (would come from compatibility checker)
    const conflicts = licenseResults.conflicts?.length ?? 0;
    const canShip = licenseResults.canShip ?? true;

    // Top licenses
    const licenseCounts = new Map<string, { count: number; risk: string }>();
    for (const finding of findings) {
      const lic = finding.license;
      if (!licenseCounts.has(lic)) {
        licenseCounts.set(lic, { count: 0, risk: finding.risk });
      }
      licenseCounts.get(lic)!.count++;
    }

    const topLicenses = Array.from(licenseCounts.entries())
      .map(([license, data]) => ({
        license,
        count: data.count,
        risk: data.risk
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      total: findings.length,
      byRisk,
      conflicts,
      canShip,
      copyleftCount,
      osiApprovedCount,
      topLicenses
    };
  }

  /**
   * Generate compliance metrics
   */
  private async generateComplianceMetrics(): Promise<ComplianceMetrics> {
    const complianceResults = this.config.scanResults.compliance ?? {};

    const gdprResults = complianceResults.gdpr ?? { summary: { readinessScore: 0 }, findings: [] };
    const hipaaResults = complianceResults.hipaa ?? { summary: { readinessScore: 0 }, findings: [] };
    const soc2Results = complianceResults.soc2 ?? { summary: { readinessScore: 0 }, findings: [] };

    const gdprScore = gdprResults.summary?.readinessScore ?? 0;
    const hipaaScore = hipaaResults.summary?.readinessScore ?? 0;
    const soc2Score = soc2Results.summary?.readinessScore ?? 0;

    const gdprCritical = gdprResults.findings?.filter((f: any) => f.severity === 'CRITICAL').length ?? 0;
    const gdprHigh = gdprResults.findings?.filter((f: any) => f.severity === 'HIGH').length ?? 0;

    const hipaaDeficiencies = hipaaResults.summary?.controlDeficiencies ?? 0;
    const phiExposure = hipaaResults.findings?.filter((f: any) => f.title?.includes('PHI')).length ?? 0;

    const soc2Deficiencies = soc2Results.summary?.controlDeficiencies ?? 0;
    const evidenceGaps = soc2Results.evidenceGaps?.length ?? 0;

    const overallScore = Math.round((gdprScore + hipaaScore + soc2Score) / 3);

    return {
      gdpr: {
        score: gdprScore,
        critical: gdprCritical,
        high: gdprHigh,
        readiness: this.getReadinessLevel(gdprScore)
      },
      hipaa: {
        score: hipaaScore,
        controlDeficiencies: hipaaDeficiencies,
        phiExposure,
        readiness: this.getReadinessLevel(hipaaScore)
      },
      soc2: {
        score: soc2Score,
        controlDeficiencies: soc2Deficiencies,
        evidenceGaps,
        readiness: this.getReadinessLevel(soc2Score)
      },
      overall: {
        score: overallScore,
        readiness: this.getReadinessLevel(overallScore)
      }
    };
  }

  /**
   * Generate code security metrics
   */
  private async generateCodeSecurityMetrics(): Promise<CodeSecurityMetrics> {
    const sastResults = this.config.scanResults.sast ?? { findings: [] };
    const secretResults = this.config.scanResults.secrets ?? { findings: [] };

    const sastFindings = sastResults.findings ?? [];
    const secretFindings = secretResults.findings ?? [];

    const byCategory = {
      injection: sastFindings.filter((f: any) => f.category?.includes('injection')).length,
      brokenAuth: sastFindings.filter((f: any) => f.category?.includes('auth')).length,
      sensitiveData: sastFindings.filter((f: any) => f.category?.includes('sensitive')).length,
      xxe: sastFindings.filter((f: any) => f.category?.includes('xxe')).length,
      brokenAccessControl: sastFindings.filter((f: any) => f.category?.includes('access')).length,
      securityMisconfig: sastFindings.filter((f: any) => f.category?.includes('misconfig')).length,
      xss: sastFindings.filter((f: any) => f.category?.includes('xss')).length,
      insecureDeserialization: sastFindings.filter((f: any) => f.category?.includes('deserialization')).length,
      knownVulns: sastFindings.filter((f: any) => f.category?.includes('vulns')).length,
      insufficientLogging: sastFindings.filter((f: any) => f.category?.includes('logging')).length
    };

    // Code quality metrics (would come from complexity analyzer)
    const codeQuality = {
      complexity: 5.2, // Average cyclomatic complexity
      duplication: 3.5, // Percentage
      coverage: 78 // Test coverage percentage
    };

    return {
      sastFindings: sastFindings.length,
      secretsExposed: secretFindings.length,
      byCategory,
      codeQuality
    };
  }

  /**
   * Generate supply chain metrics
   */
  private async generateSupplyChainMetrics(): Promise<SupplyChainMetrics> {
    const licenseResults = this.config.scanResults.licenses ?? { findings: [] };
    const findings = licenseResults.findings ?? [];

    const directDependencies = findings.filter((f: any) => f.direct).length;
    const transitiveDependencies = findings.length - directDependencies;

    // Outdated packages (would come from npm outdated)
    const outdatedPackages = Math.floor(findings.length * 0.2); // Estimate 20%

    // Abandoned packages (no updates in 2+ years)
    const abandonedPackages = Math.floor(findings.length * 0.05); // Estimate 5%

    // Check if SBOM was generated
    const sbomGenerated = false; // Would check for SBOM file

    // Calculate risk score (0-100)
    // Higher score = higher risk
    const riskScore = Math.min(
      100,
      outdatedPackages * 2 + abandonedPackages * 5 + (findings.length > 100 ? 20 : 0)
    );

    return {
      dependencyCount: findings.length,
      directDependencies,
      transitiveDependencies,
      outdatedPackages,
      abandonedPackages,
      sbomGenerated,
      sbomFormat: sbomGenerated ? 'CycloneDX-1.4' : undefined,
      riskScore
    };
  }

  /**
   * Generate summary
   */
  private generateSummary(): SecurityDashboard['summary'] {
    const vulns = this.dashboard.vulnerabilities!;
    const licenses = this.dashboard.licenses!;
    const compliance = this.dashboard.compliance!;
    const codeSec = this.dashboard.codeSecurity!;
    const supply = this.dashboard.supplyChain!;

    const criticalIssues =
      (vulns?.bySeverity.critical ?? 0) +
      (compliance?.gdpr.critical ?? 0) +
      (compliance?.hipaa.controlDeficiencies ?? 0) +
      (compliance?.soc2.controlDeficiencies ?? 0);

    const highIssues =
      (vulns?.bySeverity.high ?? 0) +
      (compliance?.gdpr.high ?? 0) +
      (licenses?.byRisk.high ?? 0);

    // Calculate overall risk score (0-100, higher = worse)
    const riskComponents = [
      vulns?.bySeverity.critical * 10 ?? 0,
      vulns?.bySeverity.high * 5 ?? 0,
      licenses?.byRisk.critical * 8 ?? 0,
      licenses?.byRisk.high * 4 ?? 0,
      (100 - (compliance?.overall.score ?? 100)) / 2,
      codeSec?.secretsExposed * 3 ?? 0,
      supply?.riskScore / 2 ?? 0
    ];
    const overallRiskScore = Math.min(100, Math.round(riskComponents.reduce((a, b) => a + b, 0)));

    // Determine security posture
    let securityPosture: SecurityDashboard['summary']['securityPosture'];
    if (overallRiskScore < 20) {
      securityPosture = 'excellent';
    } else if (overallRiskScore < 40) {
      securityPosture = 'good';
    } else if (overallRiskScore < 60) {
      securityPosture = 'fair';
    } else if (overallRiskScore < 80) {
      securityPosture = 'poor';
    } else {
      securityPosture = 'critical';
    }

    // Determine if can deploy
    const canDeploy = criticalIssues === 0 && (licenses?.canShip ?? true);

    // Blockers
    const blockers: string[] = [];
    if (vulns?.bySeverity.critical > 0) {
      blockers.push(`${vulns.bySeverity.critical} critical vulnerabilities`);
    }
    if (!licenses?.canShip) {
      blockers.push('License conflicts detected');
    }
    if (compliance?.overall.readiness === 'not-ready') {
      blockers.push('Compliance not ready');
    }
    if (codeSec?.secretsExposed > 0) {
      blockers.push(`${codeSec.secretsExposed} secrets exposed`);
    }

    // Recommendations
    const recommendations: string[] = [];
    if (vulns?.bySeverity.critical > 0) {
      recommendations.push(`Fix ${vulns.bySeverity.critical} critical vulnerabilities immediately`);
    }
    if (vulns?.mttr > 30) {
      recommendations.push(`Reduce MTTR from ${vulns.mttr} days (target: <30 days)`);
    }
    if (licenses?.conflicts > 0) {
      recommendations.push(`Resolve ${licenses.conflicts} license conflicts`);
    }
    if (compliance?.overall.score < 80) {
      recommendations.push(`Improve compliance score to 80+ (current: ${compliance.overall.score})`);
    }
    if (codeSec?.secretsExposed > 0) {
      recommendations.push('Rotate all exposed secrets immediately');
    }
    if (supply?.outdatedPackages > supply.dependencyCount * 0.3) {
      recommendations.push('Update outdated dependencies (>30% are outdated)');
    }

    return {
      overallRiskScore,
      securityPosture,
      criticalIssues,
      highIssues,
      canDeploy,
      blockers,
      recommendations
    };
  }

  /**
   * Generate trends
   */
  private async generateTrends(): Promise<SecurityDashboard['trends']> {
    // Historical data would come from stored reports
    // For now, generate mock trend data
    const days = this.config.trendDays;
    const vulnerabilities: Array<{ date: Date; count: number }> = [];
    const compliance: Array<{ date: Date; score: number }> = [];
    const riskScore: Array<{ date: Date; score: number }> = [];

    const currentVulns = this.dashboard.vulnerabilities?.total ?? 0;
    const currentCompliance = this.dashboard.compliance?.overall.score ?? 0;
    const currentRisk = this.dashboard.summary?.overallRiskScore ?? 0;

    for (let i = days; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);

      // Simulate improving trends
      const progress = (days - i) / days;
      vulnerabilities.push({
        date,
        count: Math.round(currentVulns * (1 + (1 - progress) * 0.5))
      });
      compliance.push({
        date,
        score: Math.round(currentCompliance * (0.7 + progress * 0.3))
      });
      riskScore.push({
        date,
        score: Math.round(currentRisk * (1.3 - progress * 0.3))
      });
    }

    return {
      vulnerabilities,
      compliance,
      riskScore
    };
  }

  /**
   * Get readiness level from score
   */
  private getReadinessLevel(score: number): 'not-ready' | 'partially-ready' | 'ready' {
    if (score >= 80) return 'ready';
    if (score >= 50) return 'partially-ready';
    return 'not-ready';
  }

  /**
   * Get severity rank for comparison
   */
  private severityRank(severity: string): number {
    const ranks: Record<string, number> = {
      CRITICAL: 4,
      HIGH: 3,
      MEDIUM: 2,
      LOW: 1
    };
    return ranks[severity?.toUpperCase()] ?? 0;
  }

  /**
   * Get lines of code
   */
  private async getLOC(): Promise<number> {
    // Would use a LOC counter
    // For now, return estimate
    return 50000;
  }

  /**
   * Export dashboard to JSON
   */
  exportToJSON(): string {
    return JSON.stringify(this.dashboard, null, 2);
  }

  /**
   * Export dashboard to HTML
   */
  exportToHTML(): string {
    const dashboard = this.dashboard as SecurityDashboard;
    
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Security Dashboard - ${new Date().toISOString()}</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
    .container { max-width: 1200px; margin: 0 auto; }
    .header { background: #2c3e50; color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
    .metrics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-bottom: 20px; }
    .metric-card { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .metric-value { font-size: 2em; font-weight: bold; margin: 10px 0; }
    .metric-label { color: #666; font-size: 0.9em; }
    .status-excellent { color: #27ae60; }
    .status-good { color: #3498db; }
    .status-fair { color: #f39c12; }
    .status-poor { color: #e67e22; }
    .status-critical { color: #e74c3c; }
    .section { background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .section-title { font-size: 1.5em; margin-bottom: 15px; border-bottom: 2px solid #3498db; padding-bottom: 10px; }
    .blockers { background: #fee; border-left: 4px solid #e74c3c; padding: 15px; margin: 10px 0; }
    .recommendations { background: #eff; border-left: 4px solid #3498db; padding: 15px; margin: 10px 0; }
    ul { margin: 10px 0; padding-left: 20px; }
    li { margin: 5px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🛡️ Security Dashboard</h1>
      <p>Generated: ${dashboard.timestamp.toISOString()}</p>
    </div>

    <div class="metrics-grid">
      <div class="metric-card">
        <div class="metric-label">Overall Risk Score</div>
        <div class="metric-value status-${dashboard.summary.securityPosture}">${dashboard.summary.overallRiskScore}/100</div>
        <div>${dashboard.summary.securityPosture.toUpperCase()}</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Critical Issues</div>
        <div class="metric-value status-critical">${dashboard.summary.criticalIssues}</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">High Issues</div>
        <div class="metric-value status-poor">${dashboard.summary.highIssues}</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Can Deploy</div>
        <div class="metric-value">${dashboard.summary.canDeploy ? '✅' : '❌'}</div>
      </div>
    </div>

    ${dashboard.summary.blockers.length > 0 ? `
    <div class="blockers">
      <strong>🚨 Deployment Blockers:</strong>
      <ul>${dashboard.summary.blockers.map(b => `<li>${b}</li>`).join('')}</ul>
    </div>
    ` : ''}

    <div class="recommendations">
      <strong>💡 Recommendations:</strong>
      <ul>${dashboard.summary.recommendations.map(r => `<li>${r}</li>`).join('')}</ul>
    </div>

    <div class="section">
      <div class="section-title">🔍 Vulnerabilities</div>
      <p><strong>Total:</strong> ${dashboard.vulnerabilities.total}</p>
      <p><strong>MTTR:</strong> ${dashboard.vulnerabilities.mttr} days</p>
      <p><strong>Security Debt:</strong> ${dashboard.vulnerabilities.securityDebt} hours</p>
      <p><strong>By Severity:</strong></p>
      <ul>
        <li>Critical: ${dashboard.vulnerabilities.bySeverity.critical}</li>
        <li>High: ${dashboard.vulnerabilities.bySeverity.high}</li>
        <li>Medium: ${dashboard.vulnerabilities.bySeverity.medium}</li>
        <li>Low: ${dashboard.vulnerabilities.bySeverity.low}</li>
      </ul>
    </div>

    <div class="section">
      <div class="section-title">📜 Licenses</div>
      <p><strong>Total:</strong> ${dashboard.licenses.total}</p>
      <p><strong>Conflicts:</strong> ${dashboard.licenses.conflicts}</p>
      <p><strong>Can Ship:</strong> ${dashboard.licenses.canShip ? '✅' : '❌'}</p>
      <p><strong>Copyleft:</strong> ${dashboard.licenses.copyleftCount}</p>
    </div>

    <div class="section">
      <div class="section-title">✅ Compliance</div>
      <p><strong>Overall Score:</strong> ${dashboard.compliance.overall.score}/100</p>
      <p><strong>GDPR:</strong> ${dashboard.compliance.gdpr.score}/100 (${dashboard.compliance.gdpr.readiness})</p>
      <p><strong>HIPAA:</strong> ${dashboard.compliance.hipaa.score}/100 (${dashboard.compliance.hipaa.readiness})</p>
      <p><strong>SOC2:</strong> ${dashboard.compliance.soc2.score}/100 (${dashboard.compliance.soc2.readiness})</p>
    </div>
  </div>
</body>
</html>
    `.trim();
  }

  /**
   * Save dashboard to file
   */
  async save(outputPath: string, format: 'json' | 'html' = 'json'): Promise<void> {
    let content: string;
    if (format === 'json') {
      content = this.exportToJSON();
    } else {
      content = this.exportToHTML();
    }
    await fs.writeFile(outputPath, content, 'utf-8');
    console.log(`✅ Dashboard saved to ${outputPath}`);
  }
}

/**
 * Convenience function to generate dashboard
 */
export async function generateSecurityDashboard(
  config: DashboardConfig
): Promise<SecurityDashboard> {
  const generator = new SecurityDashboardGenerator(config);
  return generator.generate();
}

/**
 * Quick dashboard for CI/CD
 */
export async function quickDashboard(
  rootPath: string,
  scanResults: any
): Promise<SecurityDashboard> {
  const generator = new SecurityDashboardGenerator({
    rootPath,
    scanResults
  });
  return generator.generate();
}
