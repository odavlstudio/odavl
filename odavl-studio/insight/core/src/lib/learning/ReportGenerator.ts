import type { ModelWeights } from "./Predictor";
import { writeFile, mkdir } from "node:fs/promises";
import { dirname } from "node:path";

export class ReportGenerator {
    async generate(weights: ModelWeights, outputPath: string): Promise<void> {
        const sorted = Object.entries(weights)
            .sort(([, a], [, b]) => b - a);

        const content = [
            "# Learning Engine Report",
            "",
            `Generated: ${new Date().toISOString()}`,
            "",
            "## Probability Weights",
            "",
            ...sorted.map(([type, weight]) => `- ${type} → ${weight.toFixed(2)}`),
            "",
            `Total learned patterns: ${sorted.length}`,
        ].join("\n");

        const dir = dirname(outputPath);
        await mkdir(dir, { recursive: true });
        await writeFile(outputPath, content, "utf-8");
    }
}
