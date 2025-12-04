export interface InsightPacket {
    project: string;
    errorCount: number;
    fixesApplied: number;
    confidenceAvg: number;
    timestamp: string;
    ledgerHash: string;
}

export interface GuardianAttestation {
    cycle: string;
    status: 'STABLE' | 'WARNING' | 'CRITICAL';
    verifiedAt: string;
    checksum: string;
    riskScore: number;
    insights?: InsightPacket[];
}

export interface SyncState {
    success: boolean;
    timestamp: string;
    packetsSent: number;
    error?: string;
}

export const RISK_THRESHOLDS = {
    STABLE: 0.15,
    WARNING: 0.35,
    CRITICAL: 0.50,
} as const;

export function calculateRiskScore(errorCount: number, fixesApplied: number): number {
    if (errorCount === 0) return 0;
    const unfixedErrors = Math.max(0, errorCount - fixesApplied);
    return Math.min(1.0, unfixedErrors / (errorCount + 10));
}

export function determineStatus(riskScore: number): GuardianAttestation['status'] {
    if (riskScore <= RISK_THRESHOLDS.STABLE) return 'STABLE';
    if (riskScore <= RISK_THRESHOLDS.WARNING) return 'WARNING';
    return 'CRITICAL';
}
