import { promises as fs } from "node:fs";
import path from "node:path";

export interface TrustEntry {
    nodeId: string;
    trustScore: number;
    lastInteraction: string;
    totalPackets: number;
    verifiedPackets: number;
}

export class TrustRegistry {
    private readonly registry: Map<string, TrustEntry> = new Map();
    private readonly registryPath: string;

    constructor(basePath: string = ".odavl/grid") {
        this.registryPath = path.join(process.cwd(), basePath, "trust-registry.json");
    }

    async load(): Promise<void> {
        try {
            const data = await fs.readFile(this.registryPath, "utf-8");
            const entries: TrustEntry[] = JSON.parse(data);
            for (const entry of entries) {
                this.registry.set(entry.nodeId, entry);
            }
        } catch {
            // Registry doesn't exist yet
        }
    }

    async save(): Promise<void> {
        const entries = Array.from(this.registry.values());
        const dir = path.dirname(this.registryPath);
        await fs.mkdir(dir, { recursive: true });
        await fs.writeFile(this.registryPath, JSON.stringify(entries, null, 2));
    }

    recordVerifiedPacket(nodeId: string): void {
        const entry = this.registry.get(nodeId) || {
            nodeId,
            trustScore: 0.5,
            lastInteraction: new Date().toISOString(),
            totalPackets: 0,
            verifiedPackets: 0,
        };

        entry.totalPackets += 1;
        entry.verifiedPackets += 1;
        entry.lastInteraction = new Date().toISOString();
        entry.trustScore = Math.min(1, entry.trustScore + 0.05);

        this.registry.set(nodeId, entry);
    }

    recordInvalidPacket(nodeId: string): void {
        const entry = this.registry.get(nodeId);
        if (!entry) return;

        entry.totalPackets += 1;
        entry.lastInteraction = new Date().toISOString();
        entry.trustScore = Math.max(0, entry.trustScore - 0.1);

        this.registry.set(nodeId, entry);
    }

    getTrustScore(nodeId: string): number {
        return this.registry.get(nodeId)?.trustScore || 0;
    }

    getAll(): TrustEntry[] {
        return Array.from(this.registry.values());
    }
}
