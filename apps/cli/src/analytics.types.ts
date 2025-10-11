// ODAVL Wave 9: Analytics Dashboard Schema
// Comprehensive data models for real-time metrics, trends, and team performance

import type { 
  QualityLevel, 
  Priority, 
  TimeHorizon, 
  ActionableInsight,
  QualityForecast
} from './ml-engine.types.js';

// Type aliases for ESLint compliance
type FeatureStatus = 'operational' | 'degraded' | 'offline';  
type TaskResult = 'success' | 'failure' | 'pending';
type MitigationStatus = 'open' | 'in_progress' | 'resolved';

// Time series data structures
export interface TimeSeriesDataPoint {
  timestamp: string;
  value: number;
  metadata?: Record<string, unknown>;
}

export interface TimeSeriesData {
  metric: string;
  timeframe: TimeHorizon;
  data: TimeSeriesDataPoint[];
  aggregation: 'sum' | 'average' | 'max' | 'min' | 'count';
  unit?: string;
}

// Team performance tracking
export interface TeamMember {
  id: string;
  name: string;
  email?: string;
  role: 'developer' | 'lead' | 'architect' | 'qa' | 'devops';
  joinDate: string;
  active: boolean;
}

export interface TeamMetrics {
  teamId: string;
  teamName: string;
  members: TeamMember[];
  
  // Performance metrics
  codeQualityScore: number; // 0-100
  productivityMetrics: {
    commitsPerWeek: number;
    linesOfCodePerWeek: number;
    issuesResolvedPerWeek: number;
    codeReviewTurnaroundHours: number;
  };
  
  // ODAVL-specific metrics
  odavlAdoption: {
    activeUsers: number;
    totalRuns: number;
    automationRate: number; // percentage of fixes applied automatically
    manualOverrideRate: number;
  };
  
  // Quality trends
  qualityTrends: {
    eslintWarningsReduction: number; // percentage change over period
    typeErrorsReduction: number;
    overallQualityImprovement: number;
  };
  
  // Collaboration metrics
  collaboration: {
    pairProgrammingSessions: number;
    codeReviewParticipation: number;
    knowledgeSharingScore: number;
  };
}

// Real-time system health
export interface SystemHealth {
  status: 'healthy' | 'warning' | 'critical';
  uptime: number; // seconds
  lastCheck: string;
  
  // Performance indicators
  performance: {
    averageResponseTime: number; // milliseconds
    throughputPerHour: number;
    errorRate: number; // percentage
    resourceUtilization: {
      cpu: number;
      memory: number;
      disk: number;
    };
  };
  
  // Feature health
  features: {
    mlEngine: FeatureStatus;
    analytics: FeatureStatus;
    contextAnalysis: FeatureStatus;
    predictiveModel: FeatureStatus;
  };
  
  // Recent issues
  recentIssues: {
    timestamp: string;
    severity: Priority;
    component: string;
    description: string;
    resolved: boolean;
  }[];
}

// Compliance and governance
export interface ComplianceReport {
  reportDate: string;
  complianceScore: number; // 0-100
  
  // Regulatory compliance
  regulatory: {
    gdpr: { compliant: boolean; lastAudit: string; score: number };
    sox: { compliant: boolean; lastAudit: string; score: number };
    iso27001: { compliant: boolean; lastAudit: string; score: number };
  };
  
  // Internal governance
  governance: {
    codeQualityStandards: { compliant: boolean; violationsCount: number };
    securityPolicies: { compliant: boolean; violationsCount: number };
    dataHandling: { compliant: boolean; violationsCount: number };
  };
  
  // Policy adherence
  policies: {
    qualityGates: { enforced: boolean; bypassCount: number };
    approvalWorkflows: { followed: boolean; violationsCount: number };
    accessControls: { properly_configured: boolean; reviewDate: string };
  };
  
  // Risk assessment
  riskAssessment: {
    overallRisk: QualityLevel;
    identifiedRisks: {
      type: string;
      severity: Priority;
      description: string;
      mitigationStatus: MitigationStatus;
    }[];
  };
}

// Quality insights and recommendations
export interface QualityInsight {
  id: string;
  category: 'code_quality' | 'performance' | 'security' | 'maintainability' | 'team_productivity';
  insight: string;
  evidence: {
    metrics: string[];
    dataPoints: TimeSeriesDataPoint[];
    confidenceLevel: number;
  };
  impact: {
    severity: Priority;
    affectedAreas: string[];
    estimatedTimeToResolve: string;
  };
  recommendations: ActionableInsight[];
  generatedAt: string;
  expiresAt?: string;
}

// Dashboard layout and widgets
export interface DashboardWidget {
  id: string;
  type: 'chart' | 'metric' | 'table' | 'alert' | 'forecast' | 'heatmap';
  title: string;
  position: { x: number; y: number; width: number; height: number };
  
  // Widget configuration
  config: {
    dataSource: string;
    refreshInterval: number; // seconds
    filters?: Record<string, unknown>;
    visualization?: {
      chartType?: 'line' | 'bar' | 'pie' | 'scatter' | 'heatmap';
      colors?: string[];
      showLegend?: boolean;
      showGrid?: boolean;
    };
  };
  
  // Access control
  permissions: {
    view: string[]; // role names
    edit: string[];
  };
}

export interface DashboardLayout {
  id: string;
  name: string;
  description: string;
  owner: string;
  createdAt: string;
  lastModified: string;
  
  // Layout configuration
  widgets: DashboardWidget[];
  filters: {
    timeRange: { start: string; end: string };
    teams?: string[];
    projects?: string[];
    users?: string[];
  };
  
  // Sharing and permissions
  sharing: {
    isPublic: boolean;
    allowedUsers: string[];
    allowedRoles: string[];
  };
}

// Main analytics dashboard interface
export interface AnalyticsDashboard {
  // Real-time data
  systemHealth: SystemHealth;
  liveMetrics: {
    currentUsers: number;
    activeRuns: number;
    queuedTasks: number;
    recentActivities: {
      timestamp: string;
      user: string;
      action: string;
      result: TaskResult;
    }[];
  };
  
  // Historical trends
  qualityTrends: TimeSeriesData[];
  teamPerformance: TeamMetrics[];
  
  // Insights and recommendations
  insights: QualityInsight[];
  recommendedActions: ActionableInsight[];
  
  // Predictive analytics
  forecasts: QualityForecast[];
  
  // Compliance and governance
  complianceStatus: ComplianceReport;
  
  // User-specific data
  userPreferences: {
    defaultTimeRange: TimeHorizon;
    favoriteWidgets: string[];
    notificationSettings: {
      qualityAlerts: boolean;
      performanceAlerts: boolean;
      complianceAlerts: boolean;
      emailNotifications: boolean;
    };
  };
  
  // Meta information
  lastUpdated: string;
  dataFreshness: {
    [key: string]: string; // component -> last update timestamp
  };
}

// Analytics query interface
export interface AnalyticsQuery {
  metric: string;
  timeRange: { start: string; end: string };
  granularity: 'minute' | 'hour' | 'day' | 'week' | 'month';
  filters: {
    teams?: string[];
    projects?: string[];
    users?: string[];
    recipeTypes?: string[];
  };
  aggregation: 'sum' | 'average' | 'max' | 'min' | 'count' | 'percentile';
  groupBy?: string[];
}

export interface AnalyticsQueryResult {
  query: AnalyticsQuery;
  data: TimeSeriesDataPoint[];
  metadata: {
    totalRecords: number;
    queryTime: number; // milliseconds
    cacheHit: boolean;
    dataQuality: number; // 0-1
  };
}

// Real-time event streaming
export interface AnalyticsEvent {
  id: string;
  timestamp: string;
  type: 'metric_update' | 'user_action' | 'system_event' | 'quality_alert' | 'ml_decision';
  source: string;
  data: Record<string, unknown>;
  
  // Event routing
  targets: string[]; // dashboard IDs or user IDs
  priority: Priority;
  
  // Processing metadata
  processed: boolean;
  processingTime?: number;
  errors?: string[];
}

// Analytics engine interface
export interface AnalyticsEngine {
  /**
   * Queries analytics data with filtering and aggregation
   */
  query(query: AnalyticsQuery): Promise<AnalyticsQueryResult>;
  
  /**
   * Generates insights based on current data patterns
   */
  generateInsights(timeRange: { start: string; end: string }): Promise<QualityInsight[]>;
  
  /**
   * Creates real-time dashboard data
   */
  getDashboardData(dashboardId: string): Promise<AnalyticsDashboard>;
  
  /**
   * Streams real-time events to connected clients
   */
  subscribeToEvents(callback: (event: AnalyticsEvent) => void): () => void;
  
  /**
   * Records analytics events from ODAVL operations
   */
  recordEvent(event: Omit<AnalyticsEvent, 'id' | 'timestamp' | 'processed'>): Promise<void>;
  
  /**
   * Exports analytics data for reporting or backup
   */
  exportData(
    format: 'json' | 'csv' | 'parquet',
    timeRange: { start: string; end: string }
  ): Promise<Buffer>;
  
  /**
   * Validates analytics data integrity
   */
  validateDataIntegrity(): Promise<{
    valid: boolean;
    issues: string[];
    repairedCount: number;
  }>;
}

// Data storage and persistence
export interface AnalyticsStorage {
  /**
   * Stores time series data points efficiently
   */
  storeTimeSeriesData(data: TimeSeriesDataPoint[]): Promise<void>;
  
  /**
   * Retrieves time series data with optional filtering
   */
  getTimeSeriesData(
    metric: string,
    timeRange: { start: string; end: string },
    filters?: Record<string, unknown>
  ): Promise<TimeSeriesDataPoint[]>;
  
  /**
   * Stores team performance metrics
   */
  storeTeamMetrics(metrics: TeamMetrics): Promise<void>;
  
  /**
   * Retrieves team performance data
   */
  getTeamMetrics(teamId: string, timeRange?: { start: string; end: string }): Promise<TeamMetrics[]>;
  
  /**
   * Cleans up old data according to retention policies
   */
  cleanup(retentionDays: number): Promise<{ deletedRecords: number }>;
}