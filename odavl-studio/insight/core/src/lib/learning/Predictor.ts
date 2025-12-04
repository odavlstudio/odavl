export interface PredictionResult {
    errorType: string;
    probability: number;
    confidence: number;
}

export interface ModelWeights {
    [errorType: string]: number;
}

export class Predictor {
    private readonly weights: ModelWeights;

    constructor(weights: ModelWeights = {}) {
        this.weights = weights;
    }

    predictLikelihood(fileContext: string): PredictionResult[] {
        const predictions: PredictionResult[] = [];

        for (const [errorType, weight] of Object.entries(this.weights)) {
            const contextBoost = this.analyzeContext(fileContext, errorType);
            const probability = Math.min(1, weight * contextBoost);

            predictions.push({
                errorType,
                probability,
                confidence: weight,
            });
        }

        return predictions.sort((a, b) => b.probability - a.probability);
    }

    private analyzeContext(context: string, errorType: string): number {
        let boost = 1;

        if (errorType === "ReferenceError" && /import|require/i.test(context)) {
            boost = 1.2;
        }
        if (errorType === "TypeError" && /map|filter|forEach/i.test(context)) {
            boost = 1.15;
        }
        if (errorType === "ModuleNotFound" && /from ['"]|require\(/i.test(context)) {
            boost = 1.25;
        }

        return boost;
    }
}
