/**
 * Shared Reports Service
 * Report templates, scheduling, and distribution
 * 
 * Features:
 * - Report templates (quality, performance, security)
 * - Scheduled automated reports (daily, weekly, monthly)
 * - Email distribution lists
 * - Interactive dashboard sharing
 * - Public report links with tokens
 */

import crypto from 'node:crypto';

export enum ReportType {
  QUALITY = 'QUALITY',
  PERFORMANCE = 'PERFORMANCE',
  SECURITY = 'SECURITY',
  COMPREHENSIVE = 'COMPREHENSIVE',
  AUTOPILOT = 'AUTOPILOT',
  GUARDIAN = 'GUARDIAN',
  CUSTOM = 'CUSTOM',
}

export enum ReportSchedule {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  MANUAL = 'MANUAL',
}

export enum ReportFormat {
  PDF = 'PDF',
  HTML = 'HTML',
  JSON = 'JSON',
  CSV = 'CSV',
}

export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  type: ReportType;
  
  // Content configuration
  sections: {
    id: string;
    title: string;
    enabled: boolean;
    config?: Record<string, unknown>;
  }[];
  
  // Filters
  dateRange?: {
    type: 'last_7_days' | 'last_30_days' | 'last_90_days' | 'custom';
    customStart?: Date;
    customEnd?: Date;
  };
  
  projectIds?: string[];
  includeCharts: boolean;
  includeRawData: boolean;
  
  // Metadata
  organizationId: string;
  createdBy: string;
  isPublic: boolean;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface ScheduledReport {
  id: string;
  templateId: string;
  name: string;
  
  // Schedule
  schedule: ReportSchedule;
  scheduledTime?: string; // HH:MM format
  dayOfWeek?: number; // 0-6 for weekly reports
  dayOfMonth?: number; // 1-31 for monthly reports
  timezone: string;
  
  // Distribution
  recipients: string[]; // Email addresses
  subject?: string;
  message?: string;
  format: ReportFormat;
  
  // Status
  enabled: boolean;
  lastRunAt?: Date;
  nextRunAt?: Date;
  lastRunSuccess?: boolean;
  lastRunError?: string;
  runCount: number;
  
  // Metadata
  organizationId: string;
  createdBy: string;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface SharedReport {
  id: string;
  reportId: string;
  name: string;
  description?: string;
  
  // Sharing
  token: string;
  publicUrl: string;
  isPublic: boolean;
  expiresAt?: Date;
  
  // Access control
  allowedEmails?: string[];
  requireAuth: boolean;
  password?: string;
  
  // Tracking
  viewCount: number;
  lastViewedAt?: Date;
  
  // Metadata
  organizationId: string;
  sharedBy: string;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface GeneratedReport {
  id: string;
  templateId?: string;
  scheduledReportId?: string;
  
  name: string;
  type: ReportType;
  format: ReportFormat;
  
  // Content
  data: Record<string, unknown>;
  htmlContent?: string;
  pdfUrl?: string;
  jsonData?: string;
  csvData?: string;
  
  // Period
  generatedFor: {
    start: Date;
    end: Date;
  };
  
  // Metadata
  organizationId: string;
  generatedBy?: string;
  generatedAt: Date;
  
  // File info
  fileSize?: number;
  downloadUrl?: string;
}

export interface ReportStats {
  totalReports: number;
  scheduledReports: number;
  sharedReports: number;
  
  byType: Record<ReportType, number>;
  byFormat: Record<ReportFormat, number>;
  
  recentReports: GeneratedReport[];
  
  scheduledUpcoming: Array<{
    reportId: string;
    name: string;
    nextRunAt: Date;
  }>;
}

export class SharedReportsService {
  private static instance: SharedReportsService;
  private templates = new Map<string, ReportTemplate>();
  private scheduledReports = new Map<string, ScheduledReport>();
  private sharedReports = new Map<string, SharedReport>();
  private generatedReports = new Map<string, GeneratedReport>();
  
  private constructor() {
    // Initialize with default templates
    this.createDefaultTemplates();
  }
  
  public static getInstance(): SharedReportsService {
    if (!SharedReportsService.instance) {
      SharedReportsService.instance = new SharedReportsService();
    }
    return SharedReportsService.instance;
  }
  
  /**
   * Create default report templates
   */
  private createDefaultTemplates(): void {
    const defaultTemplates: Omit<ReportTemplate, 'id' | 'createdAt' | 'updatedAt'>[] = [
      {
        name: 'Weekly Quality Report',
        description: 'Comprehensive quality metrics and trends',
        type: ReportType.QUALITY,
        sections: [
          { id: 'overview', title: 'Quality Overview', enabled: true },
          { id: 'trends', title: 'Trends Analysis', enabled: true },
          { id: 'recommendations', title: 'Recommendations', enabled: true },
          { id: 'comparison', title: 'Project Comparison', enabled: true },
        ],
        dateRange: { type: 'last_7_days' },
        includeCharts: true,
        includeRawData: false,
        organizationId: 'default',
        createdBy: 'system',
        isPublic: true,
      },
      {
        name: 'Security Audit Report',
        description: 'Security vulnerabilities and issues',
        type: ReportType.SECURITY,
        sections: [
          { id: 'vulnerabilities', title: 'Vulnerabilities', enabled: true },
          { id: 'trends', title: 'Security Trends', enabled: true },
          { id: 'compliance', title: 'Compliance Status', enabled: true },
        ],
        dateRange: { type: 'last_30_days' },
        includeCharts: true,
        includeRawData: true,
        organizationId: 'default',
        createdBy: 'system',
        isPublic: true,
      },
      {
        name: 'Performance Dashboard',
        description: 'Build times, load times, and performance metrics',
        type: ReportType.PERFORMANCE,
        sections: [
          { id: 'metrics', title: 'Performance Metrics', enabled: true },
          { id: 'trends', title: 'Performance Trends', enabled: true },
          { id: 'bottlenecks', title: 'Bottleneck Analysis', enabled: true },
        ],
        dateRange: { type: 'last_7_days' },
        includeCharts: true,
        includeRawData: false,
        organizationId: 'default',
        createdBy: 'system',
        isPublic: true,
      },
      {
        name: 'Autopilot Activity Report',
        description: 'Self-healing cycles and improvements',
        type: ReportType.AUTOPILOT,
        sections: [
          { id: 'cycles', title: 'Cycle Summary', enabled: true },
          { id: 'improvements', title: 'Code Improvements', enabled: true },
          { id: 'trust', title: 'Trust Scores', enabled: true },
        ],
        dateRange: { type: 'last_30_days' },
        includeCharts: true,
        includeRawData: false,
        organizationId: 'default',
        createdBy: 'system',
        isPublic: true,
      },
    ];
    
    defaultTemplates.forEach(template => {
      const id = `template_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
      this.templates.set(id, {
        ...template,
        id,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    });
  }
  
  /**
   * Create report template
   */
  public async createTemplate(params: Omit<ReportTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<ReportTemplate> {
    const id = `template_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
    
    const template: ReportTemplate = {
      ...params,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    this.templates.set(id, template);
    return template;
  }
  
  /**
   * Get templates
   */
  public async getTemplates(organizationId: string): Promise<ReportTemplate[]> {
    return Array.from(this.templates.values())
      .filter(template => template.organizationId === organizationId || template.isPublic)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  
  /**
   * Schedule report
   */
  public async scheduleReport(params: Omit<ScheduledReport, 'id' | 'createdAt' | 'updatedAt' | 'runCount' | 'publicUrl'>): Promise<ScheduledReport> {
    const id = `scheduled_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
    
    const scheduledReport: ScheduledReport = {
      ...params,
      id,
      runCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    // Calculate next run time
    scheduledReport.nextRunAt = this.calculateNextRunTime(scheduledReport);
    
    this.scheduledReports.set(id, scheduledReport);
    return scheduledReport;
  }
  
  /**
   * Calculate next run time for scheduled report
   */
  private calculateNextRunTime(report: ScheduledReport): Date {
    const now = new Date();
    const [hours, minutes] = (report.scheduledTime || '09:00').split(':').map(Number);
    
    let nextRun = new Date(now);
    nextRun.setHours(hours, minutes, 0, 0);
    
    switch (report.schedule) {
      case ReportSchedule.DAILY:
        if (nextRun <= now) {
          nextRun.setDate(nextRun.getDate() + 1);
        }
        break;
        
      case ReportSchedule.WEEKLY:
        const targetDay = report.dayOfWeek ?? 1; // Default Monday
        const currentDay = nextRun.getDay();
        let daysUntilTarget = (targetDay - currentDay + 7) % 7;
        if (daysUntilTarget === 0 && nextRun <= now) {
          daysUntilTarget = 7;
        }
        nextRun.setDate(nextRun.getDate() + daysUntilTarget);
        break;
        
      case ReportSchedule.MONTHLY:
        const targetDate = report.dayOfMonth ?? 1;
        nextRun.setDate(targetDate);
        if (nextRun <= now) {
          nextRun.setMonth(nextRun.getMonth() + 1);
        }
        break;
        
      case ReportSchedule.MANUAL:
      default:
        // No automatic scheduling
        break;
    }
    
    return nextRun;
  }
  
  /**
   * Get scheduled reports
   */
  public async getScheduledReports(organizationId: string): Promise<ScheduledReport[]> {
    return Array.from(this.scheduledReports.values())
      .filter(report => report.organizationId === organizationId)
      .sort((a, b) => {
        if (!a.nextRunAt) return 1;
        if (!b.nextRunAt) return -1;
        return a.nextRunAt.getTime() - b.nextRunAt.getTime();
      });
  }
  
  /**
   * Generate report
   */
  public async generateReport(params: {
    templateId?: string;
    scheduledReportId?: string;
    name: string;
    type: ReportType;
    format: ReportFormat;
    dateRange: { start: Date; end: Date };
    organizationId: string;
    generatedBy?: string;
  }): Promise<GeneratedReport> {
    const id = `report_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
    
    // TODO: In production, fetch actual data based on template/type
    const mockData = {
      summary: {
        totalProjects: 5,
        qualityScore: 87,
        issues: 12,
        improvements: 45,
      },
      trends: [
        { date: '2024-11-20', value: 82 },
        { date: '2024-11-27', value: 87 },
      ],
    };
    
    const report: GeneratedReport = {
      id,
      templateId: params.templateId,
      scheduledReportId: params.scheduledReportId,
      name: params.name,
      type: params.type,
      format: params.format,
      data: mockData,
      generatedFor: params.dateRange,
      organizationId: params.organizationId,
      generatedBy: params.generatedBy,
      generatedAt: new Date(),
    };
    
    // Generate content based on format
    if (params.format === ReportFormat.HTML) {
      report.htmlContent = this.generateHTMLContent(report);
    } else if (params.format === ReportFormat.JSON) {
      report.jsonData = JSON.stringify(mockData, null, 2);
    } else if (params.format === ReportFormat.CSV) {
      report.csvData = this.generateCSVContent(report);
    }
    
    this.generatedReports.set(id, report);
    
    // Update scheduled report if applicable
    if (params.scheduledReportId) {
      const scheduled = this.scheduledReports.get(params.scheduledReportId);
      if (scheduled) {
        scheduled.lastRunAt = new Date();
        scheduled.lastRunSuccess = true;
        scheduled.runCount++;
        scheduled.nextRunAt = this.calculateNextRunTime(scheduled);
        this.scheduledReports.set(params.scheduledReportId, scheduled);
      }
    }
    
    return report;
  }
  
  /**
   * Generate HTML content for report
   */
  private generateHTMLContent(report: GeneratedReport): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${report.name}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { background: #0066cc; color: white; padding: 20px; }
            .section { margin: 20px 0; }
            .metric { display: inline-block; margin: 10px; padding: 15px; background: #f5f5f5; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${report.name}</h1>
            <p>Generated: ${report.generatedAt.toLocaleString()}</p>
          </div>
          <div class="section">
            <h2>Summary</h2>
            ${JSON.stringify(report.data, null, 2)}
          </div>
        </body>
      </html>
    `;
  }
  
  /**
   * Generate CSV content for report
   */
  private generateCSVContent(report: GeneratedReport): string {
    // Simple CSV generation for trends
    const data = report.data as { trends?: Array<{ date: string; value: number }> };
    if (!data.trends) return '';
    
    const headers = ['Date', 'Value'];
    const rows = data.trends.map(t => [t.date, t.value.toString()]);
    
    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }
  
  /**
   * Share report
   */
  public async shareReport(params: {
    reportId: string;
    name: string;
    description?: string;
    isPublic: boolean;
    expiresInDays?: number;
    allowedEmails?: string[];
    requireAuth: boolean;
    password?: string;
    organizationId: string;
    sharedBy: string;
  }): Promise<SharedReport> {
    const id = `shared_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
    const token = crypto.randomBytes(32).toString('hex');
    const publicUrl = `https://odavl.studio/reports/${token}`;
    
    const sharedReport: SharedReport = {
      id,
      reportId: params.reportId,
      name: params.name,
      description: params.description,
      token,
      publicUrl,
      isPublic: params.isPublic,
      expiresAt: params.expiresInDays
        ? new Date(Date.now() + params.expiresInDays * 24 * 60 * 60 * 1000)
        : undefined,
      allowedEmails: params.allowedEmails,
      requireAuth: params.requireAuth,
      password: params.password,
      viewCount: 0,
      organizationId: params.organizationId,
      sharedBy: params.sharedBy,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    this.sharedReports.set(id, sharedReport);
    return sharedReport;
  }
  
  /**
   * Get shared report by token
   */
  public async getSharedReportByToken(token: string): Promise<SharedReport | null> {
    const shared = Array.from(this.sharedReports.values()).find(s => s.token === token);
    
    if (!shared) return null;
    
    // Check expiration
    if (shared.expiresAt && new Date() > shared.expiresAt) {
      return null;
    }
    
    // Increment view count
    shared.viewCount++;
    shared.lastViewedAt = new Date();
    this.sharedReports.set(shared.id, shared);
    
    return shared;
  }
  
  /**
   * Get shared reports for organization
   */
  public async getSharedReports(organizationId: string): Promise<SharedReport[]> {
    return Array.from(this.sharedReports.values())
      .filter(report => report.organizationId === organizationId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  
  /**
   * Get generated reports
   */
  public async getGeneratedReports(
    organizationId: string,
    filters?: {
      type?: ReportType;
      limit?: number;
    }
  ): Promise<GeneratedReport[]> {
    let reports = Array.from(this.generatedReports.values())
      .filter(report => report.organizationId === organizationId);
    
    if (filters?.type) {
      reports = reports.filter(report => report.type === filters.type);
    }
    
    reports.sort((a, b) => b.generatedAt.getTime() - a.generatedAt.getTime());
    
    if (filters?.limit) {
      reports = reports.slice(0, filters.limit);
    }
    
    return reports;
  }
  
  /**
   * Get report statistics
   */
  public async getStats(organizationId: string): Promise<ReportStats> {
    const generatedReports = Array.from(this.generatedReports.values())
      .filter(r => r.organizationId === organizationId);
    
    const scheduledReports = Array.from(this.scheduledReports.values())
      .filter(r => r.organizationId === organizationId);
    
    const sharedReports = Array.from(this.sharedReports.values())
      .filter(r => r.organizationId === organizationId);
    
    // By type
    const byType = {} as Record<ReportType, number>;
    Object.values(ReportType).forEach(type => {
      byType[type] = generatedReports.filter(r => r.type === type).length;
    });
    
    // By format
    const byFormat = {} as Record<ReportFormat, number>;
    Object.values(ReportFormat).forEach(format => {
      byFormat[format] = generatedReports.filter(r => r.format === format).length;
    });
    
    // Recent reports
    const recentReports = generatedReports
      .sort((a, b) => b.generatedAt.getTime() - a.generatedAt.getTime())
      .slice(0, 10);
    
    // Upcoming scheduled reports
    const scheduledUpcoming = scheduledReports
      .filter(r => r.enabled && r.nextRunAt)
      .sort((a, b) => a.nextRunAt!.getTime() - b.nextRunAt!.getTime())
      .slice(0, 5)
      .map(r => ({
        reportId: r.id,
        name: r.name,
        nextRunAt: r.nextRunAt!,
      }));
    
    return {
      totalReports: generatedReports.length,
      scheduledReports: scheduledReports.length,
      sharedReports: sharedReports.length,
      byType,
      byFormat,
      recentReports,
      scheduledUpcoming,
    };
  }
  
  /**
   * Delete report
   */
  public async deleteReport(reportId: string): Promise<void> {
    this.generatedReports.delete(reportId);
  }
  
  /**
   * Delete shared report
   */
  public async deleteSharedReport(sharedReportId: string): Promise<void> {
    this.sharedReports.delete(sharedReportId);
  }
  
  /**
   * Update scheduled report
   */
  public async updateScheduledReport(
    reportId: string,
    updates: Partial<Pick<ScheduledReport, 'enabled' | 'recipients' | 'schedule' | 'scheduledTime'>>
  ): Promise<ScheduledReport> {
    const report = this.scheduledReports.get(reportId);
    if (!report) {
      throw new Error('Scheduled report not found');
    }
    
    Object.assign(report, updates);
    report.updatedAt = new Date();
    
    // Recalculate next run time if schedule changed
    if (updates.schedule || updates.scheduledTime) {
      report.nextRunAt = this.calculateNextRunTime(report);
    }
    
    this.scheduledReports.set(reportId, report);
    return report;
  }
}

// Export singleton instance
export const sharedReportsService = SharedReportsService.getInstance();
