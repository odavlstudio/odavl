import { writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { PhaseRegistry } from "./PhaseRegistry";
import { TrustRegistry } from "./TrustRegistry";
import { InsightBridge } from "./InsightBridge";
import { logger } from '../utils/logger';

interface HealthMetrics {
    systemHealthScore: number;
    riskLevel: number;
    trustLevel: number;
    neuralConfidence: number;
    status: "OPTIMAL" | "HEALTHY" | "DEGRADED" | "CRITICAL";
    timestamp: string;
}

/**
 * ODAVL Ω Monitor — System health evaluation
 * Monitors PhaseRegistry, GovernanceLedger, TrustRegistry
 */
export class OmegaMonitor {
    async evaluate(): Promise<HealthMetrics> {
        const phaseSummary = PhaseRegistry.getSummary();
        const trustRegistry = new TrustRegistry();
        await trustRegistry.load();
        const trustData = trustRegistry.getAll();

        const riskLevel = this.calculateRisk(phaseSummary);
        const trustLevel = this.calculateTrust(trustData);
        const neuralConfidence = 0.82; // Placeholder - would query NeuralFeedbackEngine

        const systemHealthScore = this.calculateHealthScore(
            riskLevel,
            trustLevel,
            neuralConfidence
        );

        let status: HealthMetrics["status"];
        if (systemHealthScore > 0.9) {
            status = "OPTIMAL";
        } else if (systemHealthScore > 0.7) {
            status = "HEALTHY";
        } else if (systemHealthScore > 0.6) {
            status = "DEGRADED";
            await this.issueAlert("System health degraded", systemHealthScore);
        } else {
            status = "CRITICAL";
            await this.issueAlert("CRITICAL: System health critical", systemHealthScore);
        }

        const metrics: HealthMetrics = {
            systemHealthScore,
            riskLevel,
            trustLevel,
            neuralConfidence,
            status,
            timestamp: new Date().toISOString(),
        };

        await this.logHeartbeat(metrics);
        return metrics;
    }

    private calculateRisk(phases: ReturnType<typeof PhaseRegistry.getSummary>): number {
        const totalRisk = phases.reduce((sum, p) => sum + (p.riskUsed || 0), 0);
        return Math.min(totalRisk / 100, 1); // Normalize to 0-1
    }

    private calculateTrust(trustData: ReturnType<TrustRegistry["getAll"]>): number {
        if (trustData.length === 0) return 1;
        const avgTrust =
            trustData.reduce((sum: number, t) => sum + t.trustScore, 0) / trustData.length;
        return avgTrust;
    }

    private calculateHealthScore(risk: number, trust: number, confidence: number): number {
        // Weighted average: trust (40%), confidence (40%), risk (20% inverse)
        return trust * 0.4 + confidence * 0.4 + (1 - risk) * 0.2;
    }

    private async issueAlert(message: string, score: number): Promise<void> {
        InsightBridge.sendEvent("omega_alert", { message, score, timestamp: Date.now() });
        logger.warn(`⚠️ ${message} (score: ${score.toFixed(2)})`);
    }

    private async logHeartbeat(metrics: HealthMetrics): Promise<void> {
        const reportsDir = join(process.cwd(), ".odavl", "reports", "omega");
        await mkdir(reportsDir, { recursive: true });

        const timestamp = Date.now();
        const reportPath = join(reportsDir, `heartbeat-${timestamp}.json`);

        await writeFile(reportPath, JSON.stringify(metrics, null, 2), "utf8");
    }
}

export const omegaMonitor = new OmegaMonitor();
