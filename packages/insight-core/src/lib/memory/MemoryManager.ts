import type { MemoryEntry } from "./InsightMemory";
import { readFile, writeFile, mkdir, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname } from "node:path";

export class MemoryManager {
    private readonly maxSizeBytes = 5 * 1024 * 1024; // 5 MB
    private readonly memoryFile: string;

    constructor(memoryFile = ".odavl/insight/memory/insight-memory.json") {
        this.memoryFile = memoryFile;
    }

    async load(): Promise<MemoryEntry[]> {
        if (!existsSync(this.memoryFile)) {
            return [];
        }

        const data = await readFile(this.memoryFile, "utf-8");
        const parsed = JSON.parse(data);

        // Handle legacy object format (convert to array)
        if (!Array.isArray(parsed)) {
            return Object.entries(parsed).map(([errorType, entry]: [string, unknown]) => {
                const e = entry as { timesSeen: number; avgConfidence: number; lastSeen: number; lastFix?: string };
                return {
                    errorType,
                    timesSeen: e.timesSeen,
                    avgConfidence: e.avgConfidence,
                    lastSeen: e.lastSeen,
                    lastFix: e.lastFix || '',
                };
            });
        }

        return parsed;
    }

    async save(entries: MemoryEntry[]): Promise<void> {
        const dir = dirname(this.memoryFile);
        await mkdir(dir, { recursive: true });

        const data = JSON.stringify(entries, null, 2);
        await writeFile(this.memoryFile, data, "utf-8");

        await this.rotateIfNeeded();
    }

    private async rotateIfNeeded(): Promise<void> {
        const stats = await stat(this.memoryFile);

        if (stats.size > this.maxSizeBytes) {
            const entries = await this.load();
            const trimmed = this.trimOldEntries(entries);
            const data = JSON.stringify(trimmed, null, 2);
            await writeFile(this.memoryFile, data, "utf-8");
        }
    }

    private trimOldEntries(entries: MemoryEntry[]): MemoryEntry[] {
        const sorted = [...entries].sort((a, b) => b.lastSeen - a.lastSeen);
        return sorted.slice(0, Math.floor(entries.length * 0.8));
    }
}
