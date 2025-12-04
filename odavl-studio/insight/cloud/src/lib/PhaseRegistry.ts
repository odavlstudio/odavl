import { writeFile, readFile, mkdir } from "node:fs/promises";
import { join } from "node:path";

interface PhaseEntry {
    phaseName: string;
    status: string;
    duration: number;
    lastRun: string;
    trustImpact?: number;
    riskUsed?: number;
}

export class PhaseRegistry {
    private static readonly registry = new Map<string, PhaseEntry>();
    private static readonly registryPath = ".odavl/ledger/phase-registry.json";

    static async update(
        phaseName: string,
        data: Partial<Omit<PhaseEntry, "phaseName">>,
    ): Promise<void> {
        const existing = PhaseRegistry.registry.get(phaseName) || {
            phaseName,
            status: "pending",
            duration: 0,
            lastRun: new Date().toISOString(),
        };

        PhaseRegistry.registry.set(phaseName, { ...existing, ...data });
        await PhaseRegistry.save();
    }

    static getSummary(): PhaseEntry[] {
        return [...PhaseRegistry.registry.values()];
    }

    private static async save(): Promise<void> {
        const basePath = process.cwd();
        const fullPath = join(basePath, PhaseRegistry.registryPath);
        await mkdir(join(basePath, ".odavl", "ledger"), { recursive: true });

        const data = JSON.stringify([...PhaseRegistry.registry.values()], null, 2);
        await writeFile(fullPath, data, "utf8");
    }

    static async load(): Promise<void> {
        try {
            const basePath = process.cwd();
            const fullPath = join(basePath, PhaseRegistry.registryPath);
            const data = await readFile(fullPath, "utf8");
            const entries = JSON.parse(data) as PhaseEntry[];

            PhaseRegistry.registry.clear();
            for (const entry of entries) {
                PhaseRegistry.registry.set(entry.phaseName, entry);
            }
        } catch {
            // Registry doesn't exist yet
        }
    }
}
