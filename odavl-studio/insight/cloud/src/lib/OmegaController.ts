import { metaOrchestrator } from "./MetaOrchestrator";
import { PhaseRegistry } from "./PhaseRegistry";
import { InsightBridge } from "./InsightBridge";
import { logger } from '../utils/logger';

/**
 * ODAVL Ω Controller — Perpetual autonomous loop
 * Runs continuous meta cycles every 60s
 */
export class OmegaController {
    private running = false;

    async start(): Promise<void> {
        if (this.running) {
            logger.debug("⚠️ Omega already running");
            return;
        }

        this.running = true;
        logger.debug("🌀 ODAVL Ω Controller started");

        while (this.running) {
            try {
                await metaOrchestrator.runCycle();
                await this.heartbeat();
                await this.sleep(60000); // 1 min loop
            } catch (error) {
                logger.error("❌ Omega cycle error:", error);
                await this.sleep(10000); // retry after 10s on error
            }
        }
    }

    async stop(): Promise<void> {
        this.running = false;
        logger.debug("🛑 Omega Controller stopped");
    }

    async heartbeat(): Promise<void> {
        const metrics = PhaseRegistry.getSummary();
        const timestamp = Date.now();

        InsightBridge.sendEvent("omega_heartbeat", {
            metrics,
            timestamp,
            status: this.running ? "active" : "stopped",
        });

        logger.debug(`💓 Omega heartbeat: ${new Date().toISOString()}`);
    }

    sleep(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}

export const omega = new OmegaController();
