import type { InsightNotification } from "./LiveNotifier";
import { logger } from '../../utils/logger';

export class NotifierCLI {
    private recentNotifications: InsightNotification[] = [];
    private readonly maxRecent = 10;

    printNotification(notif: InsightNotification): void {
        const confidencePercent = (notif.confidence * 100).toFixed(0);

        logger.debug(
            `\n\x1b[36m💡 [Insight Live]\x1b[0m \x1b[33m${notif.file}\x1b[0m → ${notif.suggestion} \x1b[32m(${confidencePercent}%)\x1b[0m`
        );

        this.addToRecent(notif);
    }

    getRecent(): InsightNotification[] {
        return [...this.recentNotifications];
    }

    private addToRecent(notif: InsightNotification): void {
        this.recentNotifications.unshift(notif);
        if (this.recentNotifications.length > this.maxRecent) {
            this.recentNotifications.pop();
        }
    }

    printSummary(): void {
        logger.debug("\n\x1b[36m📊 Recent Notifications:\x1b[0m");
        for (const notif of this.recentNotifications) {
            logger.debug(`  - ${notif.file}: ${notif.suggestion}`);
        }
    }
}
