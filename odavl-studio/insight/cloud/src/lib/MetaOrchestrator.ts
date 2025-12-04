import { CycleController } from "./CycleController";
import { PhaseRegistry } from "./PhaseRegistry";
import { OrchestratorBridge } from "./OrchestratorBridge";

export class MetaOrchestrator {
    private static instance: MetaOrchestrator;
    private readonly phases = ["observe", "decide", "act", "verify", "learn"];

    private constructor() { }

    static getInstance(): MetaOrchestrator {
        if (!MetaOrchestrator.instance) {
            MetaOrchestrator.instance = new MetaOrchestrator();
        }
        return MetaOrchestrator.instance;
    }

    async runCycle(): Promise<void> {
        for (const phase of this.phases) {
            await this.executePhase(phase);
        }
    }

    async executePhase(name: string): Promise<void> {
        const start = Date.now();
        await CycleController.run(name);
        const duration = Date.now() - start;

        await PhaseRegistry.update(name, {
            status: "done",
            duration,
            lastRun: new Date().toISOString(),
        });

        OrchestratorBridge.notify(name, "completed");
    }

    getPhases(): string[] {
        return [...this.phases];
    }
}

export const metaOrchestrator = MetaOrchestrator.getInstance();
