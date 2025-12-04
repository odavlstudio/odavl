import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import type { Correlation } from "./CorrelationEngine";

export interface RootCause {
    error: string;
    rootCause: string;
    confidence: number;
    suggestion: string;
}

export class RootCauseDetector {
    async detectAll(correlations: Correlation[]): Promise<RootCause[]> {
        const rootCauses: RootCause[] = [];

        for (const corr of correlations.filter((c) => c.score >= 0.5)) {
            rootCauses.push({
                error: `Error in ${corr.errorFile}`,
                rootCause: `File ${corr.relatedChange} was modified in commit ${corr.commit.slice(0, 7)}`,
                confidence: corr.score,
                suggestion: this.generateSuggestion(corr),
            });
        }

        await this.saveCauses(rootCauses);
        return rootCauses;
    }

    private generateSuggestion(corr: Correlation): string {
        if (corr.score === 1) {
            return `Review changes in ${corr.relatedChange} from recent commit`;
        }
        return `Check if ${corr.errorFile} depends on ${corr.relatedChange}`;
    }

    private async saveCauses(causes: RootCause[]): Promise<void> {
        const outputDir = path.resolve(".odavl/insight/root");
        await mkdir(outputDir, { recursive: true });
        await writeFile(path.join(outputDir, "causes.json"), JSON.stringify(causes, null, 2));
    }
}
