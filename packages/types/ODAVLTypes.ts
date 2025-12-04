
export interface SystemMetrics {
    eslintWarnings: number;
    typeErrors: number;
    timestamp: string;
    lastRun?: string;
    cycleStatus?: string;
}

export interface HistoryEntry {
    ts: string;
    success?: boolean;
    before: SystemMetrics;
    after: SystemMetrics;
    deltas: { eslint: number; types: number };
    decision: string;
    gatesPassed?: boolean;
    gates?: Record<string, unknown>;
}

export interface RecipeTrust {
    id: string;
    score: number;
    lastSuccess: string;
}

export interface ODAVLConfig {
    maxConnections: number;
    heartbeatInterval: number;
    aggregationIntervals: {
        realtime: number;
    };
    alertThresholds: {
        qualityScoreMin: number;
        eslintWarningsMax: number;
    };
    dataRetentionPeriod: number;
}

export interface EvidenceFile {
    id: string;
    path: string;
    created: string;
    type: string;
}
