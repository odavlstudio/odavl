#!/usr/bin/env tsx
import { LearningEngine } from "../src/lib/learning/LearningEngine";
import { ReportGenerator } from "../src/lib/learning/ReportGenerator";
import { MemoryManager } from "../src/lib/memory/MemoryManager";
import { existsSync } from "node:fs";
import { glob } from "glob";

async function main() {
    const memoryFile = ".odavl/insight/memory/insight-memory.json";

    if (!existsSync(memoryFile)) {
        console.error("❌ Memory file not found. Run 'pnpm insight:train' first.");
        process.exit(1);
    }

    const manager = new MemoryManager();
    const engine = new LearningEngine();
    const reporter = new ReportGenerator();

    // Load memory and train
    const memoryEntries = await manager.load();
    const weights = await engine.train(memoryEntries);

    // Generate report
    await reporter.generate(weights, ".odavl/insight/learning/learning-report.md");

    console.log("\n🧠 [Insight Learning Engine]");
    console.log(`Trained on ${memoryEntries.length} error patterns\n`);

    // Find sample TypeScript files for prediction
    const files = await glob("**/*.{ts,tsx}", {
        ignore: ["node_modules/**", "dist/**", ".odavl/**"],
        cwd: process.cwd(),
        absolute: false,
    });

    const sampleFile = files[0];
    if (sampleFile) {
        const predictions = await engine.getPredictionForFile(sampleFile);
        const top = predictions[0];

        if (top) {
            console.log(`File: ${sampleFile}`);
            console.log(`Most probable issue: ${top.errorType} (${(top.probability * 100).toFixed(0)}%)`);
        }
    }

    console.log("\n✅ Model saved to .odavl/insight/learning/model.json");
    console.log("✅ Report saved to .odavl/insight/learning/learning-report.md");
}

main().catch((err) => {
    console.error("❌ Error:", err);
    process.exit(1);
});
