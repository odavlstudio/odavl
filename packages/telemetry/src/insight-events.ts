/**
 * ODAVL Insight — Product Telemetry Events
 * 
 * Strongly-typed event schema for tracking Insight usage, adoption, and conversion.
 * 
 * Privacy:
 * - NO code content in events (only metadata)
 * - User can opt-out via settings
 * - Anonymous by default (userId is hashed)
 * 
 * Metrics tracked:
 * - Active users (daily/weekly/monthly)
 * - Active projects
 * - Number of analyses (local vs cloud)
 * - Issues found over time
 * - Conversion funnel (free → trial → paid)
 */

/**
 * Insight plan IDs (mirrored from insight-product to avoid circular deps)
 */
export type InsightPlanId = 'INSIGHT_FREE' | 'INSIGHT_PRO' | 'INSIGHT_TEAM' | 'INSIGHT_ENTERPRISE';

/**
 * Base event properties shared across all Insight events
 */
export interface InsightEventBase {
  /** Anonymous user ID (SHA-256 hash of email) */
  userId: string;
  
  /** Session ID for tracking user sessions */
  sessionId?: string;
  
  /** Organization ID (for team/enterprise plans) */
  organizationId?: string;
  
  /** Current plan (FREE/PRO/TEAM/ENTERPRISE) */
  planId: InsightPlanId;
  
  /** Is user on trial? */
  isTrial?: boolean;
  
  /** Client source (cli, cloud, vscode) */
  source: 'cli' | 'cloud' | 'vscode';
  
  /** Timestamp (ISO 8601) */
  timestamp: string;
  
  /** Client version (e.g., "1.2.0") */
  version?: string;
}

/**
 * Analysis lifecycle events
 */
export interface InsightAnalysisStartedEvent extends InsightEventBase {
  type: 'insight.analysis_started';
  properties: {
    /** Analysis mode (local or cloud) */
    mode: 'local' | 'cloud';
    
    /** Project ID */
    projectId?: string;
    
    /** Detectors enabled (array of detector names) */
    detectors: string[];
    
    /** Approximate file count (binned for privacy) */
    fileCountBucket: '<10' | '10-50' | '50-100' | '100-500' | '500-1000' | '1000+';
    
    /** Programming languages detected */
    languages?: string[];
  };
}

export interface InsightAnalysisCompletedEvent extends InsightEventBase {
  type: 'insight.analysis_completed';
  properties: {
    /** Analysis mode */
    mode: 'local' | 'cloud';
    
    /** Analysis ID (for tracking) */
    analysisId: string;
    
    /** Duration in milliseconds */
    durationMs: number;
    
    /** Total issues found */
    issuesFound: number;
    
    /** Issues by severity (aggregated) */
    criticalCount: number;
    highCount: number;
    mediumCount: number;
    lowCount: number;
    
    /** Issues by category (top 5) */
    issueCategories: Record<string, number>;
    
    /** Was analysis successful? */
    success: boolean;
    
    /** Error message (if failed) */
    errorMessage?: string;
  };
}

/**
 * Cloud-specific analysis events
 */
export interface InsightCloudAnalysisStartedEvent extends InsightEventBase {
  type: 'insight.cloud_analysis_started';
  properties: {
    projectId: string;
    gitUrl?: string;
    branch?: string;
    fileCountBucket: '<10' | '10-50' | '50-100' | '100-500' | '500-1000' | '1000+';
  };
}

export interface InsightCloudAnalysisCompletedEvent extends InsightEventBase {
  type: 'insight.cloud_analysis_completed';
  properties: {
    analysisId: string;
    projectId: string;
    durationMs: number;
    issuesFound: number;
    success: boolean;
  };
}

/**
 * Extension-specific events
 */
export interface InsightExtensionScanTriggeredEvent extends InsightEventBase {
  type: 'insight.extension_scan_triggered';
  properties: {
    /** Trigger source (manual, auto-save, command-palette) */
    trigger: 'manual' | 'auto_save' | 'command_palette';
    
    /** Workspace type (single-folder, multi-folder, remote) */
    workspaceType: 'single' | 'multi' | 'remote';
    
    /** Number of detectors enabled */
    detectorsCount: number;
  };
}

export interface InsightExtensionIssueClickedEvent extends InsightEventBase {
  type: 'insight.extension_issue_clicked';
  properties: {
    /** Issue severity */
    severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
    
    /** Issue category */
    category: string;
    
    /** Did user click "Fix with Autopilot"? */
    clickedAutopilot?: boolean;
  };
}

/**
 * CLI-specific events
 */
export interface InsightCLIScanTriggeredEvent extends InsightEventBase {
  type: 'insight.cli_scan_triggered';
  properties: {
    /** CLI command used */
    command: string;
    
    /** Flags used */
    flags?: string[];
    
    /** Detectors specified */
    detectors?: string[];
  };
}

export interface InsightCLILoginEvent extends InsightEventBase {
  type: 'insight.cli_login';
  properties: {
    /** Auth method (oauth, api-key) */
    authMethod: 'oauth' | 'api_key';
    
    /** Is first login? */
    isFirstLogin: boolean;
  };
}

export interface InsightCLIPlanViewedEvent extends InsightEventBase {
  type: 'insight.cli_plan_viewed';
  properties: {
    /** Current plan */
    currentPlan: InsightPlanId;
    
    /** Is user on trial? */
    isTrial: boolean;
    
    /** Days remaining in trial */
    trialDaysRemaining?: number;
  };
}

/**
 * User lifecycle events
 */
export interface InsightUserSignedUpEvent extends InsightEventBase {
  type: 'insight.user_signed_up';
  properties: {
    /** Auth provider */
    authProvider: 'github' | 'google' | 'email';
    
    /** Starting plan (usually FREE or TRIAL) */
    startingPlan: InsightPlanId;
    
    /** Is trial user? */
    isTrial: boolean;
  };
}

export interface InsightPlanUpgradedEvent extends InsightEventBase {
  type: 'insight.plan_upgraded';
  properties: {
    /** Previous plan */
    fromPlan: InsightPlanId;
    
    /** New plan */
    toPlan: InsightPlanId;
    
    /** Was this from a trial conversion? */
    fromTrial: boolean;
    
    /** Upgrade source (dashboard, cli, extension) */
    upgradeSource: 'dashboard' | 'cli' | 'extension' | 'email';
  };
}

export interface InsightTrialStartedEvent extends InsightEventBase {
  type: 'insight.trial_started';
  properties: {
    /** Trial plan (usually PRO) */
    trialPlan: InsightPlanId;
    
    /** Trial duration in days */
    trialDurationDays: number;
  };
}

export interface InsightTrialExpiredEvent extends InsightEventBase {
  type: 'insight.trial_expired';
  properties: {
    /** Trial plan that expired */
    trialPlan: InsightPlanId;
    
    /** Plan after degradation (usually FREE) */
    degradedToPlan: InsightPlanId;
    
    /** Did user upgrade before expiration? */
    didUpgrade: boolean;
  };
}

/**
 * Limit events (for conversion tracking)
 */
export interface InsightLimitHitEvent extends InsightEventBase {
  type: 'insight.limit_hit';
  properties: {
    /** Limit type */
    limitType: 'projects' | 'files' | 'daily_analyses' | 'cloud_access';
    
    /** Current value */
    currentValue: number;
    
    /** Max value (limit) */
    maxValue: number;
    
    /** Did user click upgrade? */
    clickedUpgrade?: boolean;
  };
}

export interface InsightUpgradePromptShownEvent extends InsightEventBase {
  type: 'insight.upgrade_prompt_shown';
  properties: {
    /** Context where prompt was shown */
    context: 'limit_banner' | 'usage_page' | 'trial_warning' | 'extension_popup';
    
    /** Limit type (if from limit) */
    limitType?: 'projects' | 'files' | 'daily_analyses' | 'cloud_access';
  };
}

export interface InsightUpgradePromptClickedEvent extends InsightEventBase {
  type: 'insight.upgrade_prompt_clicked';
  properties: {
    /** Context where prompt was clicked */
    context: 'limit_banner' | 'usage_page' | 'trial_warning' | 'extension_popup';
    
    /** Target plan */
    targetPlan?: InsightPlanId;
    
    /** Action (upgrade_now, compare_plans, dismiss) */
    action: 'upgrade_now' | 'compare_plans' | 'dismiss';
  };
}

/**
 * Project lifecycle events
 */
export interface InsightProjectCreatedEvent extends InsightEventBase {
  type: 'insight.project_created';
  properties: {
    projectId: string;
    
    /** Project name (hashed for privacy) */
    projectNameHash: string;
    
    /** Is first project? */
    isFirstProject: boolean;
    
    /** Has Git integration? */
    hasGit: boolean;
  };
}

export interface InsightProjectDeletedEvent extends InsightEventBase {
  type: 'insight.project_deleted';
  properties: {
    projectId: string;
    
    /** Project age in days */
    projectAgeDays: number;
    
    /** Total analyses run on project */
    totalAnalyses: number;
  };
}

/**
 * Feature adoption events
 */
export interface InsightDetectorEnabledEvent extends InsightEventBase {
  type: 'insight.detector_enabled';
  properties: {
    /** Detector name */
    detectorName: string;
    
    /** Is experimental? */
    isExperimental: boolean;
  };
}

export interface InsightProblemsPanelExportedEvent extends InsightEventBase {
  type: 'insight.problems_panel_exported';
  properties: {
    /** Export format */
    format: 'json' | 'sarif' | 'csv';
    
    /** Issue count */
    issueCount: number;
  };
}

/**
 * Union type of all Insight events
 */
export type InsightEvent =
  // Analysis
  | InsightAnalysisStartedEvent
  | InsightAnalysisCompletedEvent
  | InsightCloudAnalysisStartedEvent
  | InsightCloudAnalysisCompletedEvent
  
  // Extension
  | InsightExtensionScanTriggeredEvent
  | InsightExtensionIssueClickedEvent
  
  // CLI
  | InsightCLIScanTriggeredEvent
  | InsightCLILoginEvent
  | InsightCLIPlanViewedEvent
  
  // User lifecycle
  | InsightUserSignedUpEvent
  | InsightPlanUpgradedEvent
  | InsightTrialStartedEvent
  | InsightTrialExpiredEvent
  
  // Limits & conversion
  | InsightLimitHitEvent
  | InsightUpgradePromptShownEvent
  | InsightUpgradePromptClickedEvent
  
  // Projects
  | InsightProjectCreatedEvent
  | InsightProjectDeletedEvent
  
  // Features
  | InsightDetectorEnabledEvent
  | InsightProblemsPanelExportedEvent;

/**
 * Event type names (for type guards)
 */
export type InsightEventType = InsightEvent['type'];

/**
 * Extract event by type
 */
export type ExtractEvent<T extends InsightEventType> = Extract<InsightEvent, { type: T }>;

/**
 * Helper to create properly typed events
 */
export function createInsightEvent<T extends InsightEventType>(
  type: T,
  base: InsightEventBase,
  properties: ExtractEvent<T>['properties']
): ExtractEvent<T> {
  return {
    ...base,
    type,
    properties,
  } as ExtractEvent<T>;
}
