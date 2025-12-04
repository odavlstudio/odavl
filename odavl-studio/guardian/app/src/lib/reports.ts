/**
 * Report Generation System
 * Supports PDF and HTML report generation for test results, uptime, performance, and security
 */

import PDFDocument from 'pdfkit';
import { format } from 'date-fns';
import { prisma } from '@/lib/prisma';
import { AlertsService } from '@/lib/alerts';

const alertsService = new AlertsService();

export async function sendEmail(to: string, subject: string, body: string) {
  return alertsService.sendEmail(to, subject, body);
}

import logger from '@/lib/logger';
import type { Readable } from 'stream';

// Report Types
export type ReportType = 'test-results' | 'uptime' | 'performance' | 'security' | 'comprehensive';
export type ReportFormat = 'pdf' | 'html' | 'json';

// Report Configuration
export interface ReportConfig {
  type: ReportType;
  format: ReportFormat;
  title: string;
  dateFrom: Date;
  dateTo: Date;
  organizationId?: string;
  includeCharts?: boolean;
  emailTo?: string[];
}

// Report Data Interfaces
interface TestResultsData {
  totalTests: number;
  passedTests: number;
  failedTests: number;
  averageDuration: number;
  testsByType: Record<string, number>;
  recentFailures: Array<{
    name: string;
    type: string;
    error: string;
    timestamp: Date;
  }>;
}

interface UptimeData {
  totalChecks: number;
  successfulChecks: number;
  failedChecks: number;
  averageResponseTime: number;
  uptime: number;
  downtimeMinutes: number;
  incidentsByDay: Array<{ date: string; count: number }>;
}

interface PerformanceData {
  apiResponseTime: {
    avg: number;
    p50: number;
    p90: number;
    p95: number;
    p99: number;
  };
  databaseQueryTime: {
    avg: number;
    slowQueries: number;
  };
  memoryUsage: {
    avg: number;
    peak: number;
  };
  cpuUsage: {
    avg: number;
  };
}

interface SecurityData {
  totalScans: number;
  vulnerabilitiesFound: number;
  criticalIssues: number;
  highIssues: number;
  mediumIssues: number;
  lowIssues: number;
  recentIncidents: Array<{
    severity: string;
    description: string;
    timestamp: Date;
  }>;
}

/**
 * Report Generator Class
 */
export class ReportGenerator {
  private config: ReportConfig;

  constructor(config: ReportConfig) {
    this.config = config;
  }

  /**
   * Generate report in specified format
   */
  async generate(): Promise<Buffer | string> {
    logger.info('Generating report', {
      type: this.config.type,
      format: this.config.format,
      dateFrom: this.config.dateFrom,
      dateTo: this.config.dateTo,
    });

    // Fetch data based on report type
    const data = await this.fetchReportData();

    // Generate report in requested format
    switch (this.config.format) {
      case 'pdf':
        return this.generatePDF(data);
      case 'html':
        return this.generateHTML(data);
      case 'json':
        return JSON.stringify(data, null, 2);
      default:
        throw new Error(`Unsupported format: ${this.config.format}`);
    }
  }

  /**
   * Fetch data for report based on type
   */
  private async fetchReportData(): Promise<any> {
    switch (this.config.type) {
      case 'test-results':
        return this.fetchTestResultsData();
      case 'uptime':
        return this.fetchUptimeData();
      case 'performance':
        return this.fetchPerformanceData();
      case 'security':
        return this.fetchSecurityData();
      case 'comprehensive':
        return {
          testResults: await this.fetchTestResultsData(),
          uptime: await this.fetchUptimeData(),
          performance: await this.fetchPerformanceData(),
          security: await this.fetchSecurityData(),
        };
      default:
        throw new Error(`Unknown report type: ${this.config.type}`);
    }
  }

  /**
   * Fetch test results data
   */
  private async fetchTestResultsData(): Promise<TestResultsData> {
    const testRuns = await prisma.testRun.findMany({
      where: {
        createdAt: {
          gte: this.config.dateFrom,
          lte: this.config.dateTo,
        },
        ...(this.config.organizationId && {
          organizationId: this.config.organizationId,
        }),
      },
      orderBy: { createdAt: 'desc' },
      take: 1000,
    });

    const totalTests = testRuns.length;
    const passedTests = testRuns.filter((t: any) => t.status === 'passed').length;
    const failedTests = testRuns.filter((t: any) => t.status === 'failed').length;
    const averageDuration =
      testRuns.reduce((sum: number, t: any) => sum + (t.duration || 0), 0) / totalTests || 0;

    const testsByType = testRuns.reduce(
      (acc: any, test: any) => {
        acc[test.type] = (acc[test.type] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const recentFailures = testRuns
      .filter((t: any) => t.status === 'failed')
      .slice(0, 10)
      .map((t: any) => ({
        name: t.name,
        type: t.type,
        error: t.error || 'Unknown error',
        timestamp: t.createdAt,
      }));

    return {
      totalTests,
      passedTests,
      failedTests,
      averageDuration,
      testsByType,
      recentFailures,
    };
  }

  /**
   * Fetch uptime monitoring data
   */
  private async fetchUptimeData(): Promise<UptimeData> {
    const checks = await prisma.monitor.findMany({
      where: {
        createdAt: {
          gte: this.config.dateFrom,
          lte: this.config.dateTo,
        },
        ...(this.config.organizationId && {
          organizationId: this.config.organizationId,
        }),
      },
      orderBy: { createdAt: 'desc' },
    });

    const totalChecks = checks.length;
    const successfulChecks = checks.filter((c: any) => c.status === 'up').length;
    const failedChecks = checks.filter((c: any) => c.status === 'down').length;
    const averageResponseTime =
      checks.reduce((sum: number, c: any) => sum + (c.responseTime || 0), 0) / totalChecks || 0;
    const uptime = totalChecks > 0 ? (successfulChecks / totalChecks) * 100 : 0;

    // Calculate downtime in minutes (assuming checks every 5 minutes)
    const downtimeMinutes = failedChecks * 5;

    // Group incidents by day
    const incidentsByDay = checks
      .filter((c: any) => c.status === 'down')
      .reduce(
        (acc: any, check: any) => {
          const date = format(check.createdAt, 'yyyy-MM-dd');
          const existing = acc.find((item: any) => item.date === date);
          if (existing) {
            existing.count++;
          } else {
            acc.push({ date, count: 1 });
          }
          return acc;
        },
        [] as Array<{ date: string; count: number }>
      );

    return {
      totalChecks,
      successfulChecks,
      failedChecks,
      averageResponseTime,
      uptime,
      downtimeMinutes,
      incidentsByDay,
    };
  }

  /**
   * Fetch performance metrics data
   */
  private async fetchPerformanceData(): Promise<PerformanceData> {
    // This would typically come from your metrics collection system
    // For now, returning mock data structure
    return {
      apiResponseTime: {
        avg: 150,
        p50: 120,
        p90: 250,
        p95: 400,
        p99: 800,
      },
      databaseQueryTime: {
        avg: 45,
        slowQueries: 12,
      },
      memoryUsage: {
        avg: 512,
        peak: 1024,
      },
      cpuUsage: {
        avg: 35,
      },
    };
  }

  /**
   * Fetch security scan data
   */
  private async fetchSecurityData(): Promise<SecurityData> {
    // Mock security data - would integrate with actual security scanning system
    return {
      totalScans: 50,
      vulnerabilitiesFound: 8,
      criticalIssues: 1,
      highIssues: 2,
      mediumIssues: 3,
      lowIssues: 2,
      recentIncidents: [
        {
          severity: 'high',
          description: 'SQL injection vulnerability detected in API endpoint',
          timestamp: new Date(),
        },
      ],
    };
  }

  /**
   * Generate PDF report
   */
  private async generatePDF(data: any): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50 });
        const chunks: Buffer[] = [];

        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // Header
        doc
          .fontSize(24)
          .font('Helvetica-Bold')
          .text(this.config.title, { align: 'center' });

        doc.moveDown();
        doc
          .fontSize(12)
          .font('Helvetica')
          .text(
            `Report Period: ${format(this.config.dateFrom, 'MMM dd, yyyy')} - ${format(this.config.dateTo, 'MMM dd, yyyy')}`,
            { align: 'center' }
          );

        doc.moveDown(2);

        // Generate content based on report type
        if (this.config.type === 'test-results' || this.config.type === 'comprehensive') {
          this.addTestResultsSection(doc, data.testResults || data);
        }

        if (this.config.type === 'uptime' || this.config.type === 'comprehensive') {
          this.addUptimeSection(doc, data.uptime || data);
        }

        if (this.config.type === 'performance' || this.config.type === 'comprehensive') {
          this.addPerformanceSection(doc, data.performance || data);
        }

        if (this.config.type === 'security' || this.config.type === 'comprehensive') {
          this.addSecuritySection(doc, data.security || data);
        }

        // Footer
        doc
          .fontSize(10)
          .text(`Generated on ${format(new Date(), 'PPpp')}`, 50, doc.page.height - 50, {
            align: 'center',
          });

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Add test results section to PDF
   */
  private addTestResultsSection(doc: PDFKit.PDFDocument, data: TestResultsData): void {
    doc.fontSize(18).font('Helvetica-Bold').text('Test Results Summary');
    doc.moveDown();

    doc.fontSize(12).font('Helvetica');
    doc.text(`Total Tests: ${data.totalTests}`);
    doc.text(`Passed: ${data.passedTests} (${((data.passedTests / data.totalTests) * 100).toFixed(1)}%)`);
    doc.text(`Failed: ${data.failedTests} (${((data.failedTests / data.totalTests) * 100).toFixed(1)}%)`);
    doc.text(`Average Duration: ${(data.averageDuration / 1000).toFixed(2)}s`);

    doc.moveDown();
    doc.fontSize(14).font('Helvetica-Bold').text('Tests by Type');
    doc.fontSize(12).font('Helvetica');
    Object.entries(data.testsByType).forEach(([type, count]) => {
      doc.text(`  ${type}: ${count}`);
    });

    if (data.recentFailures.length > 0) {
      doc.moveDown();
      doc.fontSize(14).font('Helvetica-Bold').text('Recent Failures');
      doc.fontSize(10).font('Helvetica');
      data.recentFailures.slice(0, 5).forEach((failure) => {
        doc.text(`• ${failure.name} (${failure.type})`);
        doc.fontSize(9).text(`  ${failure.error.substring(0, 100)}...`, { indent: 15 });
        doc.fontSize(10);
      });
    }

    doc.moveDown(2);
  }

  /**
   * Add uptime section to PDF
   */
  private addUptimeSection(doc: PDFKit.PDFDocument, data: UptimeData): void {
    doc.fontSize(18).font('Helvetica-Bold').text('Uptime Monitoring');
    doc.moveDown();

    doc.fontSize(12).font('Helvetica');
    doc.text(`Total Checks: ${data.totalChecks}`);
    doc.text(`Successful: ${data.successfulChecks}`);
    doc.text(`Failed: ${data.failedChecks}`);
    doc.text(`Uptime: ${data.uptime.toFixed(2)}%`);
    doc.text(`Downtime: ${data.downtimeMinutes} minutes`);
    doc.text(`Average Response Time: ${data.averageResponseTime.toFixed(0)}ms`);

    doc.moveDown(2);
  }

  /**
   * Add performance section to PDF
   */
  private addPerformanceSection(doc: PDFKit.PDFDocument, data: PerformanceData): void {
    doc.fontSize(18).font('Helvetica-Bold').text('Performance Metrics');
    doc.moveDown();

    doc.fontSize(14).font('Helvetica-Bold').text('API Response Time');
    doc.fontSize(12).font('Helvetica');
    doc.text(`Average: ${data.apiResponseTime.avg}ms`);
    doc.text(`P50: ${data.apiResponseTime.p50}ms`);
    doc.text(`P90: ${data.apiResponseTime.p90}ms`);
    doc.text(`P95: ${data.apiResponseTime.p95}ms`);
    doc.text(`P99: ${data.apiResponseTime.p99}ms`);

    doc.moveDown();
    doc.fontSize(14).font('Helvetica-Bold').text('Database Performance');
    doc.fontSize(12).font('Helvetica');
    doc.text(`Average Query Time: ${data.databaseQueryTime.avg}ms`);
    doc.text(`Slow Queries: ${data.databaseQueryTime.slowQueries}`);

    doc.moveDown();
    doc.fontSize(14).font('Helvetica-Bold').text('System Resources');
    doc.fontSize(12).font('Helvetica');
    doc.text(`Average Memory: ${data.memoryUsage.avg}MB`);
    doc.text(`Peak Memory: ${data.memoryUsage.peak}MB`);
    doc.text(`Average CPU: ${data.cpuUsage.avg}%`);

    doc.moveDown(2);
  }

  /**
   * Add security section to PDF
   */
  private addSecuritySection(doc: PDFKit.PDFDocument, data: SecurityData): void {
    doc.fontSize(18).font('Helvetica-Bold').text('Security Summary');
    doc.moveDown();

    doc.fontSize(12).font('Helvetica');
    doc.text(`Total Scans: ${data.totalScans}`);
    doc.text(`Vulnerabilities Found: ${data.vulnerabilitiesFound}`);
    doc.moveDown();

    doc.fontSize(14).font('Helvetica-Bold').text('Issues by Severity');
    doc.fontSize(12).font('Helvetica');
    doc.fillColor('red').text(`Critical: ${data.criticalIssues}`);
    doc.fillColor('orange').text(`High: ${data.highIssues}`);
    doc.fillColor('yellow').text(`Medium: ${data.mediumIssues}`);
    doc.fillColor('green').text(`Low: ${data.lowIssues}`);
    doc.fillColor('black');

    doc.moveDown(2);
  }

  /**
   * Generate HTML report
   */
  private generateHTML(data: any): string {
    let html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${this.config.title}</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
      background: #f5f5f5;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px;
      border-radius: 10px;
      margin-bottom: 30px;
      text-align: center;
    }
    .header h1 {
      margin: 0 0 10px 0;
      font-size: 2em;
    }
    .header p {
      margin: 0;
      opacity: 0.9;
    }
    .section {
      background: white;
      padding: 25px;
      margin-bottom: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .section h2 {
      color: #667eea;
      border-bottom: 2px solid #667eea;
      padding-bottom: 10px;
      margin-top: 0;
    }
    .metric {
      display: inline-block;
      margin: 10px 20px 10px 0;
      padding: 15px;
      background: #f8f9fa;
      border-radius: 6px;
      border-left: 4px solid #667eea;
    }
    .metric-label {
      font-size: 0.9em;
      color: #666;
      margin-bottom: 5px;
    }
    .metric-value {
      font-size: 1.5em;
      font-weight: bold;
      color: #333;
    }
    .success { color: #28a745; }
    .danger { color: #dc3545; }
    .warning { color: #ffc107; }
    .info { color: #17a2b8; }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 15px;
    }
    th, td {
      padding: 12px;
      text-align: left;
      border-bottom: 1px solid #ddd;
    }
    th {
      background: #667eea;
      color: white;
      font-weight: 600;
    }
    tr:hover {
      background: #f8f9fa;
    }
    .footer {
      text-align: center;
      color: #666;
      margin-top: 30px;
      padding: 20px;
      font-size: 0.9em;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>${this.config.title}</h1>
    <p>Report Period: ${format(this.config.dateFrom, 'MMM dd, yyyy')} - ${format(this.config.dateTo, 'MMM dd, yyyy')}</p>
  </div>
`;

    // Add sections based on report type
    if (this.config.type === 'test-results' || this.config.type === 'comprehensive') {
      html += this.generateTestResultsHTML(data.testResults || data);
    }

    if (this.config.type === 'uptime' || this.config.type === 'comprehensive') {
      html += this.generateUptimeHTML(data.uptime || data);
    }

    if (this.config.type === 'performance' || this.config.type === 'comprehensive') {
      html += this.generatePerformanceHTML(data.performance || data);
    }

    if (this.config.type === 'security' || this.config.type === 'comprehensive') {
      html += this.generateSecurityHTML(data.security || data);
    }

    html += `
  <div class="footer">
    <p>Generated on ${format(new Date(), 'PPpp')}</p>
    <p>Guardian Testing Platform | Automated Report</p>
  </div>
</body>
</html>
`;

    return html;
  }

  /**
   * Generate test results HTML section
   */
  private generateTestResultsHTML(data: TestResultsData): string {
    const passRate = ((data.passedTests / data.totalTests) * 100).toFixed(1);
    const failRate = ((data.failedTests / data.totalTests) * 100).toFixed(1);

    return `
  <div class="section">
    <h2>📊 Test Results Summary</h2>
    <div class="metric">
      <div class="metric-label">Total Tests</div>
      <div class="metric-value">${data.totalTests}</div>
    </div>
    <div class="metric">
      <div class="metric-label">Passed</div>
      <div class="metric-value success">${data.passedTests} (${passRate}%)</div>
    </div>
    <div class="metric">
      <div class="metric-label">Failed</div>
      <div class="metric-value danger">${data.failedTests} (${failRate}%)</div>
    </div>
    <div class="metric">
      <div class="metric-label">Avg Duration</div>
      <div class="metric-value">${(data.averageDuration / 1000).toFixed(2)}s</div>
    </div>

    <h3>Tests by Type</h3>
    <table>
      <thead>
        <tr>
          <th>Test Type</th>
          <th>Count</th>
          <th>Percentage</th>
        </tr>
      </thead>
      <tbody>
        ${Object.entries(data.testsByType)
        .map(
          ([type, count]) => `
          <tr>
            <td>${type}</td>
            <td>${count}</td>
            <td>${((count / data.totalTests) * 100).toFixed(1)}%</td>
          </tr>
        `
        )
        .join('')}
      </tbody>
    </table>

    ${data.recentFailures.length > 0
        ? `
      <h3>Recent Failures</h3>
      <table>
        <thead>
          <tr>
            <th>Test Name</th>
            <th>Type</th>
            <th>Error</th>
            <th>Time</th>
          </tr>
        </thead>
        <tbody>
          ${data.recentFailures
          .slice(0, 5)
          .map(
            (failure) => `
            <tr>
              <td>${failure.name}</td>
              <td>${failure.type}</td>
              <td>${failure.error.substring(0, 100)}...</td>
              <td>${format(failure.timestamp, 'MMM dd, HH:mm')}</td>
            </tr>
          `
          )
          .join('')}
        </tbody>
      </table>
    `
        : ''
      }
  </div>
`;
  }

  /**
   * Generate uptime HTML section
   */
  private generateUptimeHTML(data: UptimeData): string {
    return `
  <div class="section">
    <h2>⏱️ Uptime Monitoring</h2>
    <div class="metric">
      <div class="metric-label">Uptime</div>
      <div class="metric-value success">${data.uptime.toFixed(2)}%</div>
    </div>
    <div class="metric">
      <div class="metric-label">Total Checks</div>
      <div class="metric-value">${data.totalChecks}</div>
    </div>
    <div class="metric">
      <div class="metric-label">Failed Checks</div>
      <div class="metric-value ${data.failedChecks > 0 ? 'danger' : 'success'}">${data.failedChecks}</div>
    </div>
    <div class="metric">
      <div class="metric-label">Downtime</div>
      <div class="metric-value">${data.downtimeMinutes} min</div>
    </div>
    <div class="metric">
      <div class="metric-label">Avg Response Time</div>
      <div class="metric-value">${data.averageResponseTime.toFixed(0)}ms</div>
    </div>
  </div>
`;
  }

  /**
   * Generate performance HTML section
   */
  private generatePerformanceHTML(data: PerformanceData): string {
    return `
  <div class="section">
    <h2>⚡ Performance Metrics</h2>
    
    <h3>API Response Time</h3>
    <div class="metric">
      <div class="metric-label">Average</div>
      <div class="metric-value">${data.apiResponseTime.avg}ms</div>
    </div>
    <div class="metric">
      <div class="metric-label">P50</div>
      <div class="metric-value">${data.apiResponseTime.p50}ms</div>
    </div>
    <div class="metric">
      <div class="metric-label">P90</div>
      <div class="metric-value">${data.apiResponseTime.p90}ms</div>
    </div>
    <div class="metric">
      <div class="metric-label">P95</div>
      <div class="metric-value">${data.apiResponseTime.p95}ms</div>
    </div>
    <div class="metric">
      <div class="metric-label">P99</div>
      <div class="metric-value">${data.apiResponseTime.p99}ms</div>
    </div>

    <h3>Database Performance</h3>
    <div class="metric">
      <div class="metric-label">Avg Query Time</div>
      <div class="metric-value">${data.databaseQueryTime.avg}ms</div>
    </div>
    <div class="metric">
      <div class="metric-label">Slow Queries</div>
      <div class="metric-value ${data.databaseQueryTime.slowQueries > 0 ? 'warning' : 'success'}">${data.databaseQueryTime.slowQueries}</div>
    </div>

    <h3>System Resources</h3>
    <div class="metric">
      <div class="metric-label">Avg Memory</div>
      <div class="metric-value">${data.memoryUsage.avg}MB</div>
    </div>
    <div class="metric">
      <div class="metric-label">Peak Memory</div>
      <div class="metric-value">${data.memoryUsage.peak}MB</div>
    </div>
    <div class="metric">
      <div class="metric-label">Avg CPU</div>
      <div class="metric-value">${data.cpuUsage.avg}%</div>
    </div>
  </div>
`;
  }

  /**
   * Generate security HTML section
   */
  private generateSecurityHTML(data: SecurityData): string {
    return `
  <div class="section">
    <h2>🔒 Security Summary</h2>
    <div class="metric">
      <div class="metric-label">Total Scans</div>
      <div class="metric-value">${data.totalScans}</div>
    </div>
    <div class="metric">
      <div class="metric-label">Vulnerabilities</div>
      <div class="metric-value ${data.vulnerabilitiesFound > 0 ? 'danger' : 'success'}">${data.vulnerabilitiesFound}</div>
    </div>

    <h3>Issues by Severity</h3>
    <table>
      <thead>
        <tr>
          <th>Severity</th>
          <th>Count</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><span class="danger">Critical</span></td>
          <td>${data.criticalIssues}</td>
        </tr>
        <tr>
          <td><span class="warning">High</span></td>
          <td>${data.highIssues}</td>
        </tr>
        <tr>
          <td><span class="warning">Medium</span></td>
          <td>${data.mediumIssues}</td>
        </tr>
        <tr>
          <td><span class="success">Low</span></td>
          <td>${data.lowIssues}</td>
        </tr>
      </tbody>
    </table>
  </div>
`;
  }

  /**
   * Send report via email
   */
  async sendViaEmail(): Promise<void> {
    if (!this.config.emailTo || this.config.emailTo.length === 0) {
      throw new Error('No email recipients specified');
    }

    logger.info('Sending report via email', {
      recipients: this.config.emailTo,
      type: this.config.type,
    });

    const report = await this.generate();

    const emailTo = Array.isArray(this.config.emailTo)
      ? this.config.emailTo[0]
      : this.config.emailTo;

    await sendEmail(
      emailTo,
      `${this.config.title} - ${format(new Date(), 'MMM dd, yyyy')}`,
      this.config.format === 'html'
        ? (report as string)
        : `
        <h2>${this.config.title}</h2>
        <p>Please find the attached ${this.config.format.toUpperCase()} report.</p>
        <p>Report Period: ${format(this.config.dateFrom, 'MMM dd, yyyy')} - ${format(this.config.dateTo, 'MMM dd, yyyy')}</p>
      `
    );

    logger.info('Report sent successfully via email');
  }
}

/**
 * Helper function to generate and send report
 */
export async function generateReport(config: ReportConfig): Promise<Buffer | string> {
  const generator = new ReportGenerator(config);
  return generator.generate();
}

/**
 * Helper function to generate and email report
 */
export async function generateAndEmailReport(config: ReportConfig): Promise<void> {
  const generator = new ReportGenerator(config);
  await generator.sendViaEmail();
}

/**
 * Schedule recurring reports
 */
export interface ScheduledReport {
  id: string;
  config: ReportConfig;
  schedule: 'daily' | 'weekly' | 'monthly';
  enabled: boolean;
}

// In-memory store for scheduled reports (would use database in production)
const scheduledReports: ScheduledReport[] = [];

export function scheduleReport(report: ScheduledReport): void {
  scheduledReports.push(report);
  logger.info('Report scheduled', {
    id: report.id,
    schedule: report.schedule,
    type: report.config.type,
  });
}

export function getScheduledReports(): ScheduledReport[] {
  return scheduledReports;
}

export function cancelScheduledReport(id: string): boolean {
  const index = scheduledReports.findIndex((r) => r.id === id);
  if (index !== -1) {
    scheduledReports.splice(index, 1);
    logger.info('Scheduled report cancelled', { id });
    return true;
  }
  return false;
}
