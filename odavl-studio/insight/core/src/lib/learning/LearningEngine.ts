import { Predictor, type PredictionResult, type ModelWeights } from "./Predictor";
import { LearningTrainer } from "./LearningTrainer";
import type { MemoryEntry } from "../memory/InsightMemory";
import { readFile } from "node:fs/promises";

export class LearningEngine {
    private predictor: Predictor;
    private readonly trainer: LearningTrainer;

    constructor() {
        this.trainer = new LearningTrainer();
        this.predictor = new Predictor();
    }

    async train(memoryEntries: MemoryEntry[]): Promise<ModelWeights> {
        const weights = await this.trainer.train(memoryEntries);
        this.predictor = new Predictor(weights);
        return weights;
    }

    async loadModel(): Promise<void> {
        const weights = await this.trainer.loadModel();
        this.predictor = new Predictor(weights);
    }

    async getPredictionForFile(filePath: string): Promise<PredictionResult[]> {
        try {
            const content = await readFile(filePath, "utf-8");
            return this.predictor.predictLikelihood(content);
        } catch {
            return this.predictor.predictLikelihood("");
        }
    }

    predictFromContext(context: string): PredictionResult[] {
        return this.predictor.predictLikelihood(context);
    }
}
