import { promises as fs } from "node:fs";
import path from "node:path";
import { TrustRegistry } from "./TrustRegistry";

interface NeuralWeights {
    lcp: number;
    cls: number;
    fid: number;
    tbt: number;
    bias: number;
}

interface NodeModel {
    nodeId: string;
    weights: NeuralWeights;
    timestamp: string;
}

export class FederatedLearningManager {
    private readonly trustRegistry: TrustRegistry;
    private readonly federatedDir: string;

    constructor(trustRegistry: TrustRegistry, basePath: string = ".odavl/attestations/federated") {
        this.trustRegistry = trustRegistry;
        this.federatedDir = path.join(process.cwd(), basePath);
    }

    async mergeModels(models: NodeModel[]): Promise<NeuralWeights> {
        let totalTrust = 0;
        const weightedSums: NeuralWeights = { lcp: 0, cls: 0, fid: 0, tbt: 0, bias: 0 };

        for (const model of models) {
            const trust = this.trustRegistry.getTrustScore(model.nodeId);
            if (trust <= 0) continue;

            totalTrust += trust;
            weightedSums.lcp += model.weights.lcp * trust;
            weightedSums.cls += model.weights.cls * trust;
            weightedSums.fid += model.weights.fid * trust;
            weightedSums.tbt += model.weights.tbt * trust;
            weightedSums.bias += model.weights.bias * trust;
        }

        if (totalTrust === 0) {
            return { lcp: -0.3, cls: -0.2, fid: -0.1, tbt: -0.1, bias: 0.5 };
        }

        return {
            lcp: weightedSums.lcp / totalTrust,
            cls: weightedSums.cls / totalTrust,
            fid: weightedSums.fid / totalTrust,
            tbt: weightedSums.tbt / totalTrust,
            bias: weightedSums.bias / totalTrust,
        };
    }

    async saveMergedModel(weights: NeuralWeights): Promise<string> {
        await fs.mkdir(this.federatedDir, { recursive: true });
        const filename = `model-${Date.now()}.json`;
        const filepath = path.join(this.federatedDir, filename);
        await fs.writeFile(filepath, JSON.stringify({ weights, timestamp: new Date().toISOString() }, null, 2));
        return filepath;
    }
}
