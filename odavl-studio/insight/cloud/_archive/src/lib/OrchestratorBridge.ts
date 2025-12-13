import { logger } from '../utils/logger';

export class OrchestratorBridge {
    static notify(phase: string, status: string): void {
        const event = {
            type: "meta_cycle",
            phase,
            status,
            timestamp: new Date().toISOString(),
        };

        logger.debug(`🔔 Bridge: ${phase} → ${status}`, event);
    }
}
