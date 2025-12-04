import type { MemoryEntry } from "./InsightMemory";
import { writeFile } from "node:fs/promises";
import { join } from "node:path";

export interface PatternStats {
    errorType: string;
    frequency: number;
    confidenceBoost: number;
    newConfidence: number;
}

export class PatternRecognizer {
    private readonly maxBoost = 0.2;
    private readonly boostPerRecurrence = 0.05;

    recognizePatterns(entries: MemoryEntry[]): PatternStats[] {
        return entries.map((entry) => ({
            errorType: entry.errorType,
            frequency: entry.timesSeen,
            confidenceBoost: this.calculateBoost(entry.timesSeen),
            newConfidence: Math.min(
                1,
                entry.avgConfidence + this.calculateBoost(entry.timesSeen)
            ),
        }));
    }

    async generateReport(patterns: PatternStats[], outputDir: string): Promise<void> {
        const reportPath = join(outputDir, "memory-report.md");

        const content = [
            "# ODAVL Insight Memory Report",
            "",
            `Generated: ${new Date().toISOString()}`,
            "",
            "## Pattern Statistics",
            "",
            "| Error Type | Frequency | Confidence Boost | New Confidence |",
            "|------------|-----------|------------------|----------------|",
            ...patterns.map(
                (p) =>
                    `| ${p.errorType} | ${p.frequency} | +${p.confidenceBoost.toFixed(2)} | ${p.newConfidence.toFixed(2)} |`
            ),
        ].join("\n");

        await writeFile(reportPath, content, "utf-8");
    }

    private calculateBoost(timesSeen: number): number {
        const boost = (timesSeen - 1) * this.boostPerRecurrence;
        return Math.min(boost, this.maxBoost);
    }
}
