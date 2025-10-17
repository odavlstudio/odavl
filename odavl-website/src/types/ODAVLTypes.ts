// Canonical ODAVL Evidence types for use in website and extension
// Sourced from apps/vscode-ext/src/types/ODAVLTypes.ts and CLI types

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

export interface EvidenceFile {
    id: string;
    timestamp: string;
    type: string;
    source: string;
    category: string;
    data: unknown;
}

// Minimal type for evidence run (for EvidenceTable)
export type EvidenceRun = {
    ts: string;
    before: { eslintWarnings: number; typeErrors: number; timestamp: string };
    after: { eslintWarnings: number; typeErrors: number; timestamp: string };
    deltas: { eslint: number; types: number };
    decision: string;
    success?: boolean;
};
