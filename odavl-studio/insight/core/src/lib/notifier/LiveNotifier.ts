import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync, watch } from "node:fs";
import path from "node:path";

export interface InsightNotification {
    file: string;
    error: string;
    suggestion: string;
    confidence: number;
    timestamp: number;
}

export class LiveNotifier {
    private readonly stateFile: string;
    private readonly suggestionsFile: string;
    private notifiedIds: Set<string>;

    constructor() {
        this.stateFile = path.resolve(".odavl/insight/notifier/state.json");
        this.suggestionsFile = path.resolve(".odavl/insight/fixes/suggestions.json");
        this.notifiedIds = new Set();
    }

    async initialize(): Promise<void> {
        await this.loadState();
    }

    watch(callback: (notification: InsightNotification) => void): void {
        if (!existsSync(this.suggestionsFile)) {
            return;
        }

        watch(this.suggestionsFile, async () => {
            const notifications = await this.checkForNew();
            for (const notif of notifications) {
                callback(notif);
                await this.markNotified(notif);
            }
        });
    }

    private async checkForNew(): Promise<InsightNotification[]> {
        try {
            const data = await readFile(this.suggestionsFile, "utf-8");
            const suggestions = JSON.parse(data);

            return suggestions
                .filter((s: { error: string }) => !this.notifiedIds.has(s.error))
                .map((s: { error: string; suggestion: string; confidence: number }) => ({
                    file: this.extractFile(s.error),
                    error: s.error,
                    suggestion: s.suggestion,
                    confidence: s.confidence,
                    timestamp: Date.now(),
                }));
        } catch {
            return [];
        }
    }

    private extractFile(error: string): string {
        const match = /in (.+\.tsx?)/i.exec(error);
        return match?.[1] || "unknown";
    }

    private async loadState(): Promise<void> {
        try {
            const data = await readFile(this.stateFile, "utf-8");
            const state = JSON.parse(data);
            this.notifiedIds = new Set(state.notifiedIds || []);
        } catch {
            this.notifiedIds = new Set();
        }
    }

    private async markNotified(notif: InsightNotification): Promise<void> {
        this.notifiedIds.add(notif.error);
        const dir = path.dirname(this.stateFile);
        await mkdir(dir, { recursive: true });
        await writeFile(
            this.stateFile,
            JSON.stringify({ notifiedIds: Array.from(this.notifiedIds) }, null, 2)
        );
    }
}
