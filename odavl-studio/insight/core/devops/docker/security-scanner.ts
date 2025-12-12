/**
 * @fileoverview Docker image security scanner integration
 * Integrates with Trivy, Snyk, and Docker Scout for vulnerability scanning
 */

export interface SecurityScanOptions {
  imageName: string;
  imageTag: string;
  scanner: 'trivy' | 'snyk' | 'docker-scout';
  severityThreshold?: 'low' | 'medium' | 'high' | 'critical';
  failOnVulnerabilities?: boolean;
  outputFormat?: 'json' | 'table' | 'sarif';
}

export interface VulnerabilityScanResult {
  scanner: string;
  timestamp: string;
  image: string;
  totalVulnerabilities: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  passed: boolean;
  vulnerabilities: Vulnerability[];
}

export interface Vulnerability {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  package: string;
  version: string;
  fixedVersion?: string;
  description: string;
  cve?: string;
}

export class DockerSecurityScanner {
  /**
   * Scan Docker image for vulnerabilities
   */
  static async scan(options: SecurityScanOptions): Promise<VulnerabilityScanResult> {
    const scanner = this.getScannerImplementation(options.scanner);
    return scanner(options);
  }

  /**
   * Get scanner implementation
   */
  private static getScannerImplementation(
    scanner: SecurityScanOptions['scanner']
  ): (opts: SecurityScanOptions) => Promise<VulnerabilityScanResult> {
    const scanners: Record<
      SecurityScanOptions['scanner'],
      (opts: SecurityScanOptions) => Promise<VulnerabilityScanResult>
    > = {
      trivy: this.scanWithTrivy,
      snyk: this.scanWithSnyk,
      'docker-scout': this.scanWithDockerScout,
    };

    return scanners[scanner];
  }

  /**
   * Scan with Trivy
   */
  private static async scanWithTrivy(options: SecurityScanOptions): Promise<VulnerabilityScanResult> {
    const { imageName, imageTag, severityThreshold = 'high', outputFormat = 'json' } = options;
    const image = `${imageName}:${imageTag}`;

    try {
      const { execSync } = await import('child_process');

      const cmd = `trivy image --format ${outputFormat} --severity ${severityThreshold.toUpperCase()} ${image}`;

      const output = execSync(cmd, {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
      });

      const scanResult = JSON.parse(output);

      return this.parseTrivyOutput(scanResult, image);
    } catch (error: unknown) {
      const execError = error as { stdout?: Buffer; stderr?: Buffer };

      if (execError.stdout) {
        try {
          const scanResult = JSON.parse(execError.stdout.toString());
          return this.parseTrivyOutput(scanResult, image);
        } catch {
          // Parsing failed
        }
      }

      throw new Error(`Trivy scan failed: ${execError.stderr?.toString() || 'Unknown error'}`);
    }
  }

  /**
   * Parse Trivy output
   */
  private static parseTrivyOutput(scanResult: any, image: string): VulnerabilityScanResult {
    const vulnerabilities: Vulnerability[] = [];
    let critical = 0;
    let high = 0;
    let medium = 0;
    let low = 0;

    if (scanResult.Results) {
      for (const result of scanResult.Results) {
        if (result.Vulnerabilities) {
          for (const vuln of result.Vulnerabilities) {
            const severity = vuln.Severity.toLowerCase() as Vulnerability['severity'];

            vulnerabilities.push({
              id: vuln.VulnerabilityID,
              severity,
              package: vuln.PkgName,
              version: vuln.InstalledVersion,
              fixedVersion: vuln.FixedVersion,
              description: vuln.Description || vuln.Title,
              cve: vuln.VulnerabilityID,
            });

            // Count by severity
            if (severity === 'critical') critical++;
            else if (severity === 'high') high++;
            else if (severity === 'medium') medium++;
            else if (severity === 'low') low++;
          }
        }
      }
    }

    return {
      scanner: 'trivy',
      timestamp: new Date().toISOString(),
      image,
      totalVulnerabilities: vulnerabilities.length,
      critical,
      high,
      medium,
      low,
      passed: critical === 0 && high === 0,
      vulnerabilities,
    };
  }

  /**
   * Scan with Snyk
   */
  private static async scanWithSnyk(options: SecurityScanOptions): Promise<VulnerabilityScanResult> {
    const { imageName, imageTag, severityThreshold = 'high' } = options;
    const image = `${imageName}:${imageTag}`;

    try {
      const { execSync } = await import('child_process');

      const cmd = `snyk container test ${image} --json --severity-threshold=${severityThreshold}`;

      const output = execSync(cmd, {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
      });

      const scanResult = JSON.parse(output);

      return this.parseSnykOutput(scanResult, image);
    } catch (error: unknown) {
      const execError = error as { stdout?: Buffer; stderr?: Buffer };

      if (execError.stdout) {
        try {
          const scanResult = JSON.parse(execError.stdout.toString());
          return this.parseSnykOutput(scanResult, image);
        } catch {
          // Parsing failed
        }
      }

      throw new Error(`Snyk scan failed: ${execError.stderr?.toString() || 'Unknown error'}`);
    }
  }

  /**
   * Parse Snyk output
   */
  private static parseSnykOutput(scanResult: any, image: string): VulnerabilityScanResult {
    const vulnerabilities: Vulnerability[] = [];
    let critical = 0;
    let high = 0;
    let medium = 0;
    let low = 0;

    if (scanResult.vulnerabilities) {
      for (const vuln of scanResult.vulnerabilities) {
        const severity = vuln.severity.toLowerCase() as Vulnerability['severity'];

        vulnerabilities.push({
          id: vuln.id,
          severity,
          package: vuln.packageName,
          version: vuln.version,
          fixedVersion: vuln.fixedIn?.[0],
          description: vuln.title,
          cve: vuln.identifiers?.CVE?.[0],
        });

        // Count by severity
        if (severity === 'critical') critical++;
        else if (severity === 'high') high++;
        else if (severity === 'medium') medium++;
        else if (severity === 'low') low++;
      }
    }

    return {
      scanner: 'snyk',
      timestamp: new Date().toISOString(),
      image,
      totalVulnerabilities: vulnerabilities.length,
      critical,
      high,
      medium,
      low,
      passed: critical === 0 && high === 0,
      vulnerabilities,
    };
  }

  /**
   * Scan with Docker Scout
   */
  private static async scanWithDockerScout(options: SecurityScanOptions): Promise<VulnerabilityScanResult> {
    const { imageName, imageTag, outputFormat = 'json' } = options;
    const image = `${imageName}:${imageTag}`;

    try {
      const { execSync } = await import('child_process');

      const cmd = `docker scout cves ${image} --format ${outputFormat}`;

      const output = execSync(cmd, {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
      });

      const scanResult = JSON.parse(output);

      return this.parseDockerScoutOutput(scanResult, image);
    } catch (error: unknown) {
      const execError = error as { stdout?: Buffer; stderr?: Buffer };

      if (execError.stdout) {
        try {
          const scanResult = JSON.parse(execError.stdout.toString());
          return this.parseDockerScoutOutput(scanResult, image);
        } catch {
          // Parsing failed
        }
      }

      throw new Error(`Docker Scout scan failed: ${execError.stderr?.toString() || 'Unknown error'}`);
    }
  }

  /**
   * Parse Docker Scout output
   */
  private static parseDockerScoutOutput(scanResult: any, image: string): VulnerabilityScanResult {
    const vulnerabilities: Vulnerability[] = [];
    let critical = 0;
    let high = 0;
    let medium = 0;
    let low = 0;

    if (scanResult.vulnerabilities) {
      for (const vuln of scanResult.vulnerabilities) {
        const severity = vuln.severity.toLowerCase() as Vulnerability['severity'];

        vulnerabilities.push({
          id: vuln.cve || vuln.id,
          severity,
          package: vuln.package,
          version: vuln.version,
          fixedVersion: vuln.fixedVersion,
          description: vuln.description,
          cve: vuln.cve,
        });

        // Count by severity
        if (severity === 'critical') critical++;
        else if (severity === 'high') high++;
        else if (severity === 'medium') medium++;
        else if (severity === 'low') low++;
      }
    }

    return {
      scanner: 'docker-scout',
      timestamp: new Date().toISOString(),
      image,
      totalVulnerabilities: vulnerabilities.length,
      critical,
      high,
      medium,
      low,
      passed: critical === 0 && high === 0,
      vulnerabilities,
    };
  }

  /**
   * Generate security scan report
   */
  static generateReport(result: VulnerabilityScanResult): string {
    const { scanner, timestamp, image, totalVulnerabilities, critical, high, medium, low, passed } = result;

    let report = `# Docker Security Scan Report

**Scanner:** ${scanner}
**Image:** ${image}
**Timestamp:** ${timestamp}
**Status:** ${passed ? '✅ PASSED' : '❌ FAILED'}

## Summary

- **Total Vulnerabilities:** ${totalVulnerabilities}
- **Critical:** ${critical}
- **High:** ${high}
- **Medium:** ${medium}
- **Low:** ${low}

`;

    if (result.vulnerabilities.length > 0) {
      report += `## Vulnerabilities\n\n`;

      // Group by severity
      const bySeverity: Record<string, Vulnerability[]> = {
        critical: [],
        high: [],
        medium: [],
        low: [],
      };

      for (const vuln of result.vulnerabilities) {
        bySeverity[vuln.severity].push(vuln);
      }

      for (const [severity, vulns] of Object.entries(bySeverity)) {
        if (vulns.length > 0) {
          report += `### ${severity.toUpperCase()} (${vulns.length})\n\n`;

          for (const vuln of vulns) {
            report += `#### ${vuln.id}\n`;
            report += `- **Package:** ${vuln.package}@${vuln.version}\n`;
            if (vuln.fixedVersion) {
              report += `- **Fixed In:** ${vuln.fixedVersion}\n`;
            }
            report += `- **Description:** ${vuln.description}\n`;
            if (vuln.cve) {
              report += `- **CVE:** ${vuln.cve}\n`;
            }
            report += `\n`;
          }
        }
      }
    }

    return report;
  }
}
