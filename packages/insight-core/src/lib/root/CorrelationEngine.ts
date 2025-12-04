import path from "node:path";
import type { FileChange } from "./ChangeHistoryReader";

export interface Correlation {
    errorFile: string;
    relatedChange: string;
    score: number;
    commit: string;
    timestamp: string;
}

export class CorrelationEngine {
    calculateCorrelations(errorFile: string, changes: FileChange[]): Correlation[] {
        const correlations: Correlation[] = [];

        for (const change of changes) {
            const score = this.calculateScore(errorFile, change.file);

            if (score > 0) {
                correlations.push({
                    errorFile,
                    relatedChange: change.file,
                    score,
                    commit: change.commit,
                    timestamp: change.timestamp,
                });
            }
        }

        return correlations.sort((a, b) => b.score - a.score);
    }

    private calculateScore(errorFile: string, changedFile: string): number {
        const errorNorm = this.normalizePath(errorFile);
        const changeNorm = this.normalizePath(changedFile);

        if (errorNorm === changeNorm) {
            return 1;
        }

        const errorDir = path.dirname(errorNorm);
        const changeDir = path.dirname(changeNorm);

        if (errorDir === changeDir) {
            return 0.5;
        }

        if (errorNorm.includes(changeNorm) || changeNorm.includes(errorNorm)) {
            return 0.2;
        }

        return 0;
    }

    private normalizePath(filePath: string): string {
        return filePath.replaceAll("\\", "/").toLowerCase();
    }
}
