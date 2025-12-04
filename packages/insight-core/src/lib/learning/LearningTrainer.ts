import type { MemoryEntry } from "../memory/InsightMemory";
import type { ModelWeights } from "./Predictor";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname } from "node:path";

export class LearningTrainer {
    private readonly modelFile: string;

    constructor(modelFile = ".odavl/insight/learning/model.json") {
        this.modelFile = modelFile;
    }

    async train(memoryEntries: MemoryEntry[]): Promise<ModelWeights> {
        const rawWeights = this.calculateWeights(memoryEntries);
        const normalized = this.normalize(rawWeights);

        await this.saveModel(normalized);

        return normalized;
    }

    async loadModel(): Promise<ModelWeights> {
        if (!existsSync(this.modelFile)) {
            return {};
        }

        const data = await readFile(this.modelFile, "utf-8");
        return JSON.parse(data);
    }

    private calculateWeights(entries: MemoryEntry[]): ModelWeights {
        const weights: ModelWeights = {};

        for (const entry of entries) {
            weights[entry.errorType] = entry.timesSeen * entry.avgConfidence;
        }

        return weights;
    }

    private normalize(weights: ModelWeights): ModelWeights {
        const values = Object.values(weights);
        const max = Math.max(...values, 1);

        const normalized: ModelWeights = {};
        for (const [type, weight] of Object.entries(weights)) {
            normalized[type] = weight / max;
        }

        return normalized;
    }

    private async saveModel(weights: ModelWeights): Promise<void> {
        const dir = dirname(this.modelFile);
        await mkdir(dir, { recursive: true });
        await writeFile(this.modelFile, JSON.stringify(weights, null, 2), "utf-8");
    }
}
