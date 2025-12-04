import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import type { RootCause } from "../root/RootCauseDetector";
import { SuggestionEngine, type FixSuggestion } from "./SuggestionEngine";

export class FixAdvisor {
    private readonly engine: SuggestionEngine;
    private readonly confidenceThreshold = 0.6;

    constructor() {
        this.engine = new SuggestionEngine();
    }

    async generateSuggestions(causesPath: string): Promise<FixSuggestion[]> {
        const causesData = await readFile(causesPath, "utf-8");
        const rootCauses: RootCause[] = JSON.parse(causesData);

        const allSuggestions = rootCauses.map((cause) =>
            this.engine.generateSuggestion(cause)
        );

        const filtered = allSuggestions.filter(
            (s) => s.confidence >= this.confidenceThreshold
        );

        await this.saveSuggestions(filtered);
        return filtered;
    }

    private async saveSuggestions(suggestions: FixSuggestion[]): Promise<void> {
        const outputDir = path.resolve(".odavl/insight/fixes");
        await mkdir(outputDir, { recursive: true });
        await writeFile(
            path.join(outputDir, "suggestions.json"),
            JSON.stringify(suggestions, null, 2)
        );
    }
}
