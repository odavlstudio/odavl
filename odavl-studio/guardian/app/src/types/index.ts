// Shared type definitions for ODAVL Guardian

export type TestRunStatus = 'pending' | 'running' | 'passed' | 'failed';
export type TestRunType = 'e2e' | 'visual' | 'a11y' | 'i18n' | 'performance';
export type MonitorStatus = 'up' | 'down' | 'degraded';
export type MonitorType = 'health' | 'uptime' | 'performance';
export type AlertSeverity = 'critical' | 'warning' | 'info';
export type AlertType = 'test_failure' | 'monitor_down' | 'performance_degraded';

export interface TestRun {
    id: string;
    type: TestRunType;
    status: TestRunStatus;
    startedAt: Date;
    completedAt: Date | null;
    duration: number | null;
    results: Record<string, unknown>;
    screenshots: string[];
    errorCount: number;
    warningCount: number;
    passedCount: number;
    failedCount: number;
    projectId: string;
}

export interface Monitor {
    id: string;
    name: string;
    type: MonitorType;
    endpoint: string;
    interval: number;
    enabled: boolean;
    responseTimeThreshold: number | null;
    uptimeThreshold: number | null;
    projectId: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface MonitorCheck {
    id: string;
    status: MonitorStatus;
    checkedAt: Date;
    responseTime: number | null;
    error: string | null;
    statusCode: number | null;
    headers: Record<string, unknown> | null;
    monitorId: string;
}

export interface Alert {
    id: string;
    type: AlertType;
    severity: AlertSeverity;
    message: string;
    resolved: boolean;
    resolvedAt: Date | null;
    createdAt: Date;
    metadata: Record<string, unknown> | null;
}

export interface Project {
    id: string;
    name: string;
    url: string;
    createdAt: Date;
    updatedAt: Date;
}
