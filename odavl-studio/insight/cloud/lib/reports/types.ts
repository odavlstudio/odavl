/**
 * Report Types
 * Week 10 Day 3: Reports & Insights
 */

export type ReportType = 'summary' | 'detailed' | 'team' | 'security' | 'performance';
export type ReportFormat = 'pdf' | 'html' | 'json';
export type ReportStatus = 'pending' | 'generating' | 'completed' | 'failed';

export interface Report {
  id: string;
  projectId: string;
  type: ReportType;
  title: string;
  description: string;
  format: ReportFormat;
  status: ReportStatus;
  generatedAt: string | null;
  generatedBy: string;
  fileUrl?: string;
  fileSize?: number;
  sections: ReportSection[];
}

export interface ReportSection {
  id: string;
  title: string;
  content: string;
  data?: any;
  chartType?: 'line' | 'bar' | 'pie' | 'area';
}

export interface Insight {
  id: string;
  type: 'positive' | 'negative' | 'neutral' | 'warning';
  category: 'quality' | 'performance' | 'security' | 'team' | 'trend';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  recommendation?: string;
  metrics?: Record<string, number>;
  timestamp: string;
}

export interface Anomaly {
  id: string;
  type: 'spike' | 'drop' | 'unusual-pattern';
  metric: string;
  detectedAt: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  expectedValue: number;
  actualValue: number;
  deviation: number; // percentage
}

export interface Recommendation {
  id: string;
  priority: 'high' | 'medium' | 'low';
  category: 'code-quality' | 'performance' | 'security' | 'team-process';
  title: string;
  description: string;
  impact: string;
  effort: 'low' | 'medium' | 'high';
  status: 'open' | 'in-progress' | 'completed' | 'dismissed';
}
