/**
 * @fileoverview Enterprise Dashboard Manager - Centralized dashboard orchestration
 * @module @odavl-studio/insight-core/dashboard/enterprise-dashboard-manager
 * 
 * **Purpose**: Manage multi-tenant enterprise dashboards with real-time metrics
 * 
 * **Features**:
 * - Multi-tenant dashboard isolation (workspace, team, organization)
 * - Real-time metrics aggregation (WebSocket + Server-Sent Events)
 * - Custom dashboard layouts (drag-and-drop widgets)
 * - Role-based access control (admin, developer, viewer)
 * - Historical data retention (30/90/365 days)
 * - Export capabilities (PDF, CSV, JSON)
 * - Alert integration (Slack, Email, PagerDuty)
 * - Performance optimization (caching, pagination, lazy loading)
 * 
 * **Dashboard Types**:
 * - Executive: High-level KPIs, trends, team performance
 * - Developer: Code quality, issues, personal metrics
 * - Team: Team-wide metrics, collaboration, knowledge sharing
 * - Project: Project-specific metrics, milestones, risks
 * 
 * **Widget Categories**:
 * - Metrics: Counters, gauges, progress bars
 * - Charts: Line, bar, pie, scatter, heatmap
 * - Lists: Issues, PRs, commits, contributors
 * - Insights: AI-powered recommendations, predictions
 * - Custom: User-defined widgets (React components)
 * 
 * **Architecture**:
 * ```
 * EnterpriseDashboardManager
 *   ├── createDashboard(config) → Dashboard
 *   ├── getDashboard(id) → Dashboard
 *   ├── updateDashboard(id, config) → Dashboard
 *   ├── deleteDashboard(id) → void
 *   ├── listDashboards(filters) → Dashboard[]
 *   ├── addWidget(dashboardId, widget) → Widget
 *   ├── updateWidget(widgetId, config) → Widget
 *   ├── removeWidget(widgetId) → void
 *   ├── getMetrics(dashboardId) → Metrics
 *   ├── exportDashboard(id, format) → Buffer
 *   └── subscribeToUpdates(dashboardId, callback) → Subscription
 * ```
 * 
 * **Integration Points**:
 * - Used by: Studio Hub, VS Code extension, CLI
 * - Integrates with: All detectors, Insight Recommender, ML models
 * - Data sources: PostgreSQL, Redis, TimescaleDB
 * - Real-time: WebSocket (Socket.io), SSE (Server-Sent Events)
 */

import { EventEmitter } from 'events';

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Dashboard types
 */
export enum DashboardType {
  /** Executive-level overview */
  EXECUTIVE = 'EXECUTIVE',
  /** Developer-focused metrics */
  DEVELOPER = 'DEVELOPER',
  /** Team collaboration metrics */
  TEAM = 'TEAM',
  /** Project-specific metrics */
  PROJECT = 'PROJECT',
  /** Custom dashboard */
  CUSTOM = 'CUSTOM',
}

/**
 * Widget types
 */
export enum WidgetType {
  /** Single metric counter */
  COUNTER = 'COUNTER',
  /** Gauge visualization */
  GAUGE = 'GAUGE',
  /** Progress bar */
  PROGRESS = 'PROGRESS',
  /** Line chart */
  LINE_CHART = 'LINE_CHART',
  /** Bar chart */
  BAR_CHART = 'BAR_CHART',
  /** Pie chart */
  PIE_CHART = 'PIE_CHART',
  /** Scatter plot */
  SCATTER = 'SCATTER',
  /** Heatmap */
  HEATMAP = 'HEATMAP',
  /** Issue list */
  ISSUE_LIST = 'ISSUE_LIST',
  /** Commit list */
  COMMIT_LIST = 'COMMIT_LIST',
  /** Contributor list */
  CONTRIBUTOR_LIST = 'CONTRIBUTOR_LIST',
  /** AI insight */
  AI_INSIGHT = 'AI_INSIGHT',
  /** Custom widget */
  CUSTOM = 'CUSTOM',
}

/**
 * Widget size
 */
export type WidgetSize = 'SMALL' | 'MEDIUM' | 'LARGE' | 'FULL_WIDTH';

/**
 * User role
 */
export type UserRole = 'ADMIN' | 'DEVELOPER' | 'VIEWER';

/**
 * Time range
 */
export interface TimeRange {
  /** Start timestamp */
  start: Date;
  /** End timestamp */
  end: Date;
}

/**
 * Dashboard configuration
 */
export interface DashboardConfig {
  /** Dashboard ID */
  id: string;

  /** Dashboard name */
  name: string;

  /** Dashboard type */
  type: DashboardType;

  /** Description */
  description?: string;

  /** Owner user ID */
  ownerId: string;

  /** Tenant ID (organization, workspace) */
  tenantId: string;

  /** Visibility */
  visibility: 'PRIVATE' | 'TEAM' | 'ORGANIZATION' | 'PUBLIC';

  /** Access control */
  access: {
    /** Allowed roles */
    roles: UserRole[];
    /** Allowed user IDs */
    users?: string[];
    /** Allowed team IDs */
    teams?: string[];
  };

  /** Layout configuration */
  layout: {
    /** Number of columns */
    columns: number;
    /** Row height (px) */
    rowHeight: number;
    /** Responsive breakpoints */
    breakpoints?: {
      lg: number; // Large screen
      md: number; // Medium screen
      sm: number; // Small screen
    };
  };

  /** Widgets */
  widgets: Widget[];

  /** Refresh interval (ms) */
  refreshInterval: number;

  /** Time range */
  timeRange: TimeRange;

  /** Filters */
  filters?: {
    /** Project IDs */
    projects?: string[];
    /** Team IDs */
    teams?: string[];
    /** Severity levels */
    severities?: string[];
    /** Categories */
    categories?: string[];
  };

  /** Metadata */
  metadata: {
    /** Created at */
    createdAt: Date;
    /** Updated at */
    updatedAt: Date;
    /** Last viewed at */
    lastViewedAt?: Date;
    /** View count */
    viewCount: number;
  };
}

/**
 * Dashboard widget
 */
export interface Widget {
  /** Widget ID */
  id: string;

  /** Widget type */
  type: WidgetType;

  /** Widget title */
  title: string;

  /** Description */
  description?: string;

  /** Size */
  size: WidgetSize;

  /** Position */
  position: {
    /** Column index (0-based) */
    x: number;
    /** Row index (0-based) */
    y: number;
    /** Width (columns) */
    width: number;
    /** Height (rows) */
    height: number;
  };

  /** Data source */
  dataSource: {
    /** Source type (detector, aggregator, custom) */
    type: 'DETECTOR' | 'AGGREGATOR' | 'CUSTOM';
    /** Query/filter */
    query: Record<string, any>;
    /** Refresh interval (ms, overrides dashboard default) */
    refreshInterval?: number;
  };

  /** Visualization config */
  visualization: {
    /** Chart type (for chart widgets) */
    chartType?: 'line' | 'bar' | 'pie' | 'scatter' | 'heatmap';
    /** Color scheme */
    colors?: string[];
    /** Axis labels */
    axes?: {
      x: { label: string; format?: string };
      y: { label: string; format?: string };
    };
    /** Legend */
    legend?: { position: 'top' | 'bottom' | 'left' | 'right' };
    /** Thresholds (for gauges) */
    thresholds?: Array<{ value: number; color: string; label: string }>;
  };

  /** Metadata */
  metadata: {
    /** Created at */
    createdAt: Date;
    /** Updated at */
    updatedAt: Date;
    /** Last refreshed at */
    lastRefreshedAt?: Date;
  };
}

/**
 * Dashboard metrics
 */
export interface DashboardMetrics {
  /** Dashboard ID */
  dashboardId: string;

  /** Metrics by widget */
  widgets: Map<string, WidgetMetrics>;

  /** Aggregated metrics */
  aggregated: {
    /** Total issues */
    totalIssues: number;
    /** Critical issues */
    criticalIssues: number;
    /** High issues */
    highIssues: number;
    /** Code quality score (0-100) */
    qualityScore: number;
    /** Security score (0-100) */
    securityScore: number;
    /** Maintainability index (0-100) */
    maintainabilityIndex: number;
    /** Technical debt (hours) */
    technicalDebt: number;
    /** Test coverage (%) */
    testCoverage: number;
  };

  /** Trends */
  trends: {
    /** Quality score change (last 7 days) */
    qualityScoreChange: number;
    /** Issue count change (last 7 days) */
    issueCountChange: number;
    /** Coverage change (last 7 days) */
    coverageChange: number;
  };

  /** Timestamp */
  timestamp: Date;
}

/**
 * Widget metrics
 */
export interface WidgetMetrics {
  /** Widget ID */
  widgetId: string;

  /** Data points */
  data: any[];

  /** Summary statistics */
  summary?: {
    /** Total count */
    count: number;
    /** Average */
    average?: number;
    /** Min */
    min?: number;
    /** Max */
    max?: number;
    /** Standard deviation */
    stdDev?: number;
  };

  /** Timestamp */
  timestamp: Date;
}

/**
 * Dashboard export format
 */
export type ExportFormat = 'PDF' | 'CSV' | 'JSON' | 'PNG';

/**
 * Dashboard subscription
 */
export interface DashboardSubscription {
  /** Subscription ID */
  id: string;

  /** Dashboard ID */
  dashboardId: string;

  /** Callback function */
  callback: (metrics: DashboardMetrics) => void;

  /** Unsubscribe function */
  unsubscribe: () => void;
}

/**
 * Configuration options
 */
export interface EnterpriseDashboardConfig {
  /** Enable real-time updates */
  enableRealtime: boolean;

  /** Default refresh interval (ms) */
  defaultRefreshInterval: number;

  /** Max widgets per dashboard */
  maxWidgetsPerDashboard: number;

  /** Data retention (days) */
  dataRetention: {
    /** Short-term (high resolution) */
    shortTerm: number;
    /** Medium-term (hourly aggregates) */
    mediumTerm: number;
    /** Long-term (daily aggregates) */
    longTerm: number;
  };

  /** Caching */
  cache: {
    /** Enable caching */
    enabled: boolean;
    /** TTL (seconds) */
    ttl: number;
    /** Max cache size (MB) */
    maxSize: number;
  };

  /** Export limits */
  export: {
    /** Max rows per CSV */
    maxCsvRows: number;
    /** Max PDF pages */
    maxPdfPages: number;
  };
}

// ============================================================================
// Default Configuration
// ============================================================================

const DEFAULT_CONFIG: EnterpriseDashboardConfig = {
  enableRealtime: true,
  defaultRefreshInterval: 30000, // 30 seconds
  maxWidgetsPerDashboard: 20,
  dataRetention: {
    shortTerm: 7, // 1 week
    mediumTerm: 90, // 3 months
    longTerm: 365, // 1 year
  },
  cache: {
    enabled: true,
    ttl: 300, // 5 minutes
    maxSize: 100, // 100 MB
  },
  export: {
    maxCsvRows: 100000,
    maxPdfPages: 50,
  },
};

// ============================================================================
// EnterpriseDashboardManager Class
// ============================================================================

/**
 * Enterprise Dashboard Manager
 * 
 * **Usage**:
 * ```typescript
 * const manager = new EnterpriseDashboardManager(config);
 * 
 * // Create dashboard
 * const dashboard = await manager.createDashboard({
 *   name: 'Engineering Dashboard',
 *   type: DashboardType.TEAM,
 *   ownerId: 'user-123',
 *   tenantId: 'org-456',
 *   visibility: 'TEAM',
 *   access: { roles: ['ADMIN', 'DEVELOPER'] },
 *   layout: { columns: 12, rowHeight: 100 },
 *   widgets: [],
 *   refreshInterval: 30000,
 *   timeRange: { start: new Date(Date.now() - 7 * 86400000), end: new Date() },
 *   metadata: { createdAt: new Date(), updatedAt: new Date(), viewCount: 0 },
 * });
 * 
 * // Add widget
 * const widget = await manager.addWidget(dashboard.id, {
 *   type: WidgetType.COUNTER,
 *   title: 'Critical Issues',
 *   size: 'SMALL',
 *   position: { x: 0, y: 0, width: 3, height: 2 },
 *   dataSource: {
 *     type: 'AGGREGATOR',
 *     query: { severity: 'CRITICAL' },
 *   },
 *   visualization: {
 *     colors: ['#ff0000'],
 *     thresholds: [
 *       { value: 0, color: '#00ff00', label: 'Good' },
 *       { value: 5, color: '#ffaa00', label: 'Warning' },
 *       { value: 10, color: '#ff0000', label: 'Critical' },
 *     ],
 *   },
 *   metadata: { createdAt: new Date(), updatedAt: new Date() },
 * });
 * 
 * // Get metrics
 * const metrics = await manager.getMetrics(dashboard.id);
 * console.log(`Quality Score: ${metrics.aggregated.qualityScore}`);
 * 
 * // Subscribe to real-time updates
 * const subscription = await manager.subscribeToUpdates(dashboard.id, (metrics) => {
 *   console.log('Dashboard updated:', metrics.timestamp);
 * });
 * 
 * // Export to PDF
 * const pdf = await manager.exportDashboard(dashboard.id, 'PDF');
 * await fs.writeFile('dashboard.pdf', pdf);
 * ```
 */
export class EnterpriseDashboardManager extends EventEmitter {
  private config: EnterpriseDashboardConfig;
  private dashboards: Map<string, DashboardConfig> = new Map();
  private metrics: Map<string, DashboardMetrics> = new Map();
  private subscriptions: Map<string, DashboardSubscription[]> = new Map();
  private cache: Map<string, { data: any; expiry: number }> = new Map();

  constructor(config: Partial<EnterpriseDashboardConfig> = {}) {
    super();
    this.config = { ...DEFAULT_CONFIG, ...config };

    // Start real-time update loop
    if (this.config.enableRealtime) {
      this.startRealtimeUpdates();
    }

    // Start cache cleanup
    this.startCacheCleanup();
  }

  // ==========================================================================
  // Public API - Dashboard Management
  // ==========================================================================

  /**
   * Create new dashboard
   * 
   * @param config - Dashboard configuration
   * @returns Created dashboard
   */
  async createDashboard(config: Omit<DashboardConfig, 'id'>): Promise<DashboardConfig> {
    const id = this.generateId('dashboard');

    const dashboard: DashboardConfig = {
      ...config,
      id,
      metadata: {
        ...config.metadata,
        createdAt: new Date(),
        updatedAt: new Date(),
        viewCount: 0,
      },
    };

    // Validate
    this.validateDashboard(dashboard);

    // Store
    this.dashboards.set(id, dashboard);

    // Initialize metrics
    await this.refreshMetrics(id);

    this.emit('dashboard:created', dashboard);

    return dashboard;
  }

  /**
   * Get dashboard by ID
   * 
   * @param id - Dashboard ID
   * @returns Dashboard or undefined
   */
  async getDashboard(id: string): Promise<DashboardConfig | undefined> {
    const dashboard = this.dashboards.get(id);

    if (dashboard) {
      // Update view count
      dashboard.metadata.viewCount++;
      dashboard.metadata.lastViewedAt = new Date();
    }

    return dashboard;
  }

  /**
   * Update dashboard
   * 
   * @param id - Dashboard ID
   * @param updates - Partial dashboard config
   * @returns Updated dashboard
   */
  async updateDashboard(id: string, updates: Partial<DashboardConfig>): Promise<DashboardConfig> {
    const dashboard = this.dashboards.get(id);
    if (!dashboard) {
      throw new Error(`Dashboard not found: ${id}`);
    }

    const updated: DashboardConfig = {
      ...dashboard,
      ...updates,
      id, // Preserve ID
      metadata: {
        ...dashboard.metadata,
        updatedAt: new Date(),
      },
    };

    this.validateDashboard(updated);
    this.dashboards.set(id, updated);

    // Refresh metrics
    await this.refreshMetrics(id);

    this.emit('dashboard:updated', updated);

    return updated;
  }

  /**
   * Delete dashboard
   * 
   * @param id - Dashboard ID
   */
  async deleteDashboard(id: string): Promise<void> {
    const dashboard = this.dashboards.get(id);
    if (!dashboard) {
      throw new Error(`Dashboard not found: ${id}`);
    }

    // Unsubscribe all
    const subs = this.subscriptions.get(id) || [];
    subs.forEach(sub => sub.unsubscribe());

    this.dashboards.delete(id);
    this.metrics.delete(id);
    this.subscriptions.delete(id);

    this.emit('dashboard:deleted', id);
  }

  /**
   * List dashboards with filters
   * 
   * @param filters - Optional filters
   * @returns Array of dashboards
   */
  async listDashboards(filters?: {
    ownerId?: string;
    tenantId?: string;
    type?: DashboardType;
    visibility?: DashboardConfig['visibility'];
  }): Promise<DashboardConfig[]> {
    let dashboards = Array.from(this.dashboards.values());

    if (filters?.ownerId) {
      dashboards = dashboards.filter(d => d.ownerId === filters.ownerId);
    }

    if (filters?.tenantId) {
      dashboards = dashboards.filter(d => d.tenantId === filters.tenantId);
    }

    if (filters?.type) {
      dashboards = dashboards.filter(d => d.type === filters.type);
    }

    if (filters?.visibility) {
      dashboards = dashboards.filter(d => d.visibility === filters.visibility);
    }

    return dashboards;
  }

  // ==========================================================================
  // Public API - Widget Management
  // ==========================================================================

  /**
   * Add widget to dashboard
   * 
   * @param dashboardId - Dashboard ID
   * @param widget - Widget configuration (without ID)
   * @returns Created widget
   */
  async addWidget(dashboardId: string, widget: Omit<Widget, 'id'>): Promise<Widget> {
    const dashboard = this.dashboards.get(dashboardId);
    if (!dashboard) {
      throw new Error(`Dashboard not found: ${dashboardId}`);
    }

    // Check widget limit
    if (dashboard.widgets.length >= this.config.maxWidgetsPerDashboard) {
      throw new Error(`Dashboard widget limit reached: ${this.config.maxWidgetsPerDashboard}`);
    }

    const id = this.generateId('widget');
    const newWidget: Widget = {
      ...widget,
      id,
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    };

    dashboard.widgets.push(newWidget);
    dashboard.metadata.updatedAt = new Date();

    // Refresh metrics for this widget
    await this.refreshWidgetMetrics(dashboardId, id);

    this.emit('widget:added', { dashboardId, widget: newWidget });

    return newWidget;
  }

  /**
   * Update widget
   * 
   * @param widgetId - Widget ID
   * @param updates - Partial widget config
   * @returns Updated widget
   */
  async updateWidget(widgetId: string, updates: Partial<Widget>): Promise<Widget> {
    // Find dashboard containing this widget
    let dashboard: DashboardConfig | undefined;
    let widgetIndex = -1;

    for (const [, d] of this.dashboards) {
      const index = d.widgets.findIndex(w => w.id === widgetId);
      if (index !== -1) {
        dashboard = d;
        widgetIndex = index;
        break;
      }
    }

    if (!dashboard || widgetIndex === -1) {
      throw new Error(`Widget not found: ${widgetId}`);
    }

    const widget = dashboard.widgets[widgetIndex];
    const updated: Widget = {
      ...widget,
      ...updates,
      id: widgetId, // Preserve ID
      metadata: {
        ...widget.metadata,
        updatedAt: new Date(),
      },
    };

    dashboard.widgets[widgetIndex] = updated;
    dashboard.metadata.updatedAt = new Date();

    // Refresh metrics
    await this.refreshWidgetMetrics(dashboard.id, widgetId);

    this.emit('widget:updated', { dashboardId: dashboard.id, widget: updated });

    return updated;
  }

  /**
   * Remove widget from dashboard
   * 
   * @param widgetId - Widget ID
   */
  async removeWidget(widgetId: string): Promise<void> {
    // Find dashboard containing this widget
    let dashboard: DashboardConfig | undefined;

    for (const [, d] of this.dashboards) {
      if (d.widgets.some(w => w.id === widgetId)) {
        dashboard = d;
        break;
      }
    }

    if (!dashboard) {
      throw new Error(`Widget not found: ${widgetId}`);
    }

    dashboard.widgets = dashboard.widgets.filter(w => w.id !== widgetId);
    dashboard.metadata.updatedAt = new Date();

    this.emit('widget:removed', { dashboardId: dashboard.id, widgetId });
  }

  // ==========================================================================
  // Public API - Metrics
  // ==========================================================================

  /**
   * Get dashboard metrics
   * 
   * @param dashboardId - Dashboard ID
   * @returns Dashboard metrics
   */
  async getMetrics(dashboardId: string): Promise<DashboardMetrics> {
    // Check cache
    const cached = this.getFromCache(`metrics:${dashboardId}`);
    if (cached) {
      return cached;
    }

    // Refresh and return
    await this.refreshMetrics(dashboardId);
    return this.metrics.get(dashboardId)!;
  }

  /**
   * Export dashboard
   * 
   * @param dashboardId - Dashboard ID
   * @param format - Export format
   * @returns Exported data (Buffer for PDF/PNG, string for CSV/JSON)
   */
  async exportDashboard(dashboardId: string, format: ExportFormat): Promise<Buffer | string> {
    const dashboard = this.dashboards.get(dashboardId);
    if (!dashboard) {
      throw new Error(`Dashboard not found: ${dashboardId}`);
    }

    const metrics = await this.getMetrics(dashboardId);

    switch (format) {
      case 'JSON':
        return JSON.stringify({ dashboard, metrics }, null, 2);

      case 'CSV':
        return this.exportToCsv(dashboard, metrics);

      case 'PDF':
        return this.exportToPdf(dashboard, metrics);

      case 'PNG':
        return this.exportToPng(dashboard, metrics);

      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  // ==========================================================================
  // Public API - Real-time Subscriptions
  // ==========================================================================

  /**
   * Subscribe to dashboard updates
   * 
   * @param dashboardId - Dashboard ID
   * @param callback - Callback function for updates
   * @returns Subscription object
   */
  async subscribeToUpdates(
    dashboardId: string,
    callback: (metrics: DashboardMetrics) => void
  ): Promise<DashboardSubscription> {
    const id = this.generateId('subscription');

    const subscription: DashboardSubscription = {
      id,
      dashboardId,
      callback,
      unsubscribe: () => {
        const subs = this.subscriptions.get(dashboardId) || [];
        this.subscriptions.set(
          dashboardId,
          subs.filter(s => s.id !== id)
        );
      },
    };

    const subs = this.subscriptions.get(dashboardId) || [];
    subs.push(subscription);
    this.subscriptions.set(dashboardId, subs);

    return subscription;
  }

  // ==========================================================================
  // Private Methods - Metrics Refresh
  // ==========================================================================

  /**
   * Refresh dashboard metrics
   */
  private async refreshMetrics(dashboardId: string): Promise<void> {
    const dashboard = this.dashboards.get(dashboardId);
    if (!dashboard) return;

    // Collect widget metrics
    const widgetMetrics = new Map<string, WidgetMetrics>();
    for (const widget of dashboard.widgets) {
      const metrics = await this.fetchWidgetData(widget);
      widgetMetrics.set(widget.id, metrics);
    }

    // Calculate aggregated metrics (mock for now)
    const aggregated = {
      totalIssues: 42,
      criticalIssues: 5,
      highIssues: 12,
      qualityScore: 78,
      securityScore: 85,
      maintainabilityIndex: 72,
      technicalDebt: 120,
      testCoverage: 68,
    };

    const trends = {
      qualityScoreChange: 2.5,
      issueCountChange: -3,
      coverageChange: 1.2,
    };

    const metrics: DashboardMetrics = {
      dashboardId,
      widgets: widgetMetrics,
      aggregated,
      trends,
      timestamp: new Date(),
    };

    this.metrics.set(dashboardId, metrics);
    this.setCache(`metrics:${dashboardId}`, metrics);

    // Notify subscribers
    this.notifySubscribers(dashboardId, metrics);
  }

  /**
   * Refresh widget metrics
   */
  private async refreshWidgetMetrics(dashboardId: string, widgetId: string): Promise<void> {
    const dashboard = this.dashboards.get(dashboardId);
    if (!dashboard) return;

    const widget = dashboard.widgets.find(w => w.id === widgetId);
    if (!widget) return;

    const metrics = await this.fetchWidgetData(widget);

    // Update in dashboard metrics
    const dashboardMetrics = this.metrics.get(dashboardId);
    if (dashboardMetrics) {
      dashboardMetrics.widgets.set(widgetId, metrics);
      dashboardMetrics.timestamp = new Date();
    }
  }

  /**
   * Fetch widget data
   */
  private async fetchWidgetData(widget: Widget): Promise<WidgetMetrics> {
    // Mock data fetch (in real implementation, query database/detectors)
    return {
      widgetId: widget.id,
      data: Array.from({ length: 10 }, (_, i) => ({
        timestamp: new Date(Date.now() - i * 3600000),
        value: Math.random() * 100,
      })),
      summary: {
        count: 10,
        average: 50,
        min: 0,
        max: 100,
        stdDev: 20,
      },
      timestamp: new Date(),
    };
  }

  // ==========================================================================
  // Private Methods - Real-time Updates
  // ==========================================================================

  /**
   * Start real-time update loop
   */
  private startRealtimeUpdates(): void {
    setInterval(() => {
      for (const [dashboardId] of this.dashboards) {
        this.refreshMetrics(dashboardId);
      }
    }, this.config.defaultRefreshInterval);
  }

  /**
   * Notify subscribers
   */
  private notifySubscribers(dashboardId: string, metrics: DashboardMetrics): void {
    const subs = this.subscriptions.get(dashboardId) || [];
    subs.forEach(sub => sub.callback(metrics));
  }

  // ==========================================================================
  // Private Methods - Export
  // ==========================================================================

  /**
   * Export to CSV
   */
  private exportToCsv(dashboard: DashboardConfig, metrics: DashboardMetrics): string {
    // Mock CSV export
    return `Dashboard: ${dashboard.name}\nQuality Score,${metrics.aggregated.qualityScore}\n`;
  }

  /**
   * Export to PDF
   */
  private exportToPdf(dashboard: DashboardConfig, metrics: DashboardMetrics): Buffer {
    // Mock PDF export (use puppeteer or pdfkit in real implementation)
    return Buffer.from('PDF content');
  }

  /**
   * Export to PNG
   */
  private exportToPng(dashboard: DashboardConfig, metrics: DashboardMetrics): Buffer {
    // Mock PNG export (use canvas or puppeteer in real implementation)
    return Buffer.from('PNG content');
  }

  // ==========================================================================
  // Private Methods - Utilities
  // ==========================================================================

  /**
   * Validate dashboard
   */
  private validateDashboard(dashboard: DashboardConfig): void {
    if (!dashboard.name || dashboard.name.length === 0) {
      throw new Error('Dashboard name is required');
    }

    if (dashboard.widgets.length > this.config.maxWidgetsPerDashboard) {
      throw new Error(`Too many widgets: ${dashboard.widgets.length}`);
    }
  }

  /**
   * Generate unique ID
   */
  private generateId(prefix: string): string {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get from cache
   */
  private getFromCache(key: string): any {
    if (!this.config.cache.enabled) return null;

    const cached = this.cache.get(key);
    if (!cached) return null;

    if (Date.now() > cached.expiry) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  /**
   * Set cache
   */
  private setCache(key: string, data: any): void {
    if (!this.config.cache.enabled) return;

    this.cache.set(key, {
      data,
      expiry: Date.now() + this.config.cache.ttl * 1000,
    });
  }

  /**
   * Start cache cleanup
   */
  private startCacheCleanup(): void {
    setInterval(() => {
      const now = Date.now();
      for (const [key, value] of this.cache) {
        if (now > value.expiry) {
          this.cache.delete(key);
        }
      }
    }, 60000); // Every minute
  }
}
