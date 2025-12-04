export interface MemoryEntry {
    errorType: string;
    timesSeen: number;
    avgConfidence: number;
    lastFix: string;
    lastSeen: number;
}

export interface MemoryStats {
    totalPatterns: number;
    mostFrequent: MemoryEntry | null;
    averageConfidence: number;
}

export class InsightMemory {
    private static instance: InsightMemory;
    private readonly entries: Map<string, MemoryEntry>;

    private constructor() {
        this.entries = new Map();
    }

    static getInstance(): InsightMemory {
        if (!InsightMemory.instance) {
            InsightMemory.instance = new InsightMemory();
        }
        return InsightMemory.instance;
    }

    record(errorType: string, confidence: number, suggestion: string): void {
        const existing = this.entries.get(errorType);

        if (existing) {
            const totalConfidence = existing.avgConfidence * existing.timesSeen + confidence;
            existing.timesSeen += 1;
            existing.avgConfidence = totalConfidence / existing.timesSeen;
            existing.lastFix = suggestion;
            existing.lastSeen = Date.now();
        } else {
            this.entries.set(errorType, {
                errorType,
                timesSeen: 1,
                avgConfidence: confidence,
                lastFix: suggestion,
                lastSeen: Date.now(),
            });
        }
    }

    getStats(): MemoryStats {
        const entries = Array.from(this.entries.values());

        let mostFrequent: MemoryEntry | null = null;
        let totalConfidence = 0;

        for (const entry of entries) {
            totalConfidence += entry.avgConfidence;
            if (!mostFrequent || entry.timesSeen > mostFrequent.timesSeen) {
                mostFrequent = entry;
            }
        }

        return {
            totalPatterns: entries.length,
            mostFrequent,
            averageConfidence: entries.length > 0 ? totalConfidence / entries.length : 0,
        };
    }

    getEntries(): MemoryEntry[] {
        return Array.from(this.entries.values());
    }

    loadEntries(entries: MemoryEntry[]): void {
        this.entries.clear();
        for (const entry of entries) {
            this.entries.set(entry.errorType, entry);
        }
    }
}
