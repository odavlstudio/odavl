#!/usr/bin/env tsx
import { InsightMemory } from "../src/lib/memory/InsightMemory";
import { PatternRecognizer } from "../src/lib/memory/PatternRecognizer";
import { MemoryManager } from "../src/lib/memory/MemoryManager";
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";

async function main() {
    const suggestionsFile = ".odavl/insight/fixes/suggestions.json";
    const memoryDir = ".odavl/insight/memory";

    if (!existsSync(suggestionsFile)) {
        console.error("❌ suggestions.json not found. Run 'pnpm insight:fix' first.");
        process.exit(1);
    }

    const manager = new MemoryManager();
    const memory = InsightMemory.getInstance();
    const recognizer = new PatternRecognizer();

    // Load existing memory
    const existingEntries = await manager.load();
    memory.loadEntries(existingEntries);

    // Load latest suggestions
    const suggestionsData = await readFile(suggestionsFile, "utf-8");
    const suggestions = JSON.parse(suggestionsData);

    let newPatterns = 0;
    let updatedPatterns = 0;

    // Record each suggestion
    for (const suggestion of suggestions) {
        const errorType = detectErrorType(suggestion.error);
        const isNew = !existingEntries.some((e) => e.errorType === errorType);

        memory.record(errorType, suggestion.confidence, suggestion.suggestion);

        if (isNew) {
            newPatterns++;
        } else {
            updatedPatterns++;
        }
    }

    // Save updated memory
    await manager.save(memory.getEntries());

    // Generate pattern report
    const patterns = recognizer.recognizePatterns(memory.getEntries());
    await recognizer.generateReport(patterns, memoryDir);

    // Print summary
    console.log("\n🧠 [Insight Memory]");
    console.log(`Learned ${newPatterns} new patterns, updated confidence for ${updatedPatterns} known types.`);
}

function detectErrorType(error: string): string {
    if (/is not defined|not found/i.test(error)) return "ReferenceError";
    if (/cannot find module|module not found/i.test(error)) return "ModuleNotFound";
    if (/cannot read property|undefined/i.test(error)) return "TypeError";
    if (/unexpected token|syntax error/i.test(error)) return "SyntaxError";
    if (/cannot import|import error/i.test(error)) return "ImportError";
    return "UnknownError";
}

main().catch((err) => {
    console.error("❌ Error:", err);
    process.exit(1);
});

