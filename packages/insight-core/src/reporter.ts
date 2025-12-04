// import { LoggedError } from "./types";
// import { analyzeError } from "./analyzer";
import { memorize } from "./memory";
import { getRepoRoot } from "./utils/getRepoRoot";
import { logger } from './utils/logger';

// Temporarily remove type annotation to avoid missing types
export async function reportError(error: { message: string; file?: string; line?: number;[key: string]: unknown }) {
    const path = await import("node:path");
    const fs = await import("node:fs/promises");
    const LOG_DIR = path.default.resolve(getRepoRoot(), ".odavl/insight/logs");
    if (typeof window !== "undefined") return; // Only run on server
    const day = new Date().toISOString().slice(0, 10);
    const logFile = path.default.resolve(LOG_DIR, `${day}.json`);
    try {
        await fs.default.mkdir(LOG_DIR, { recursive: true });
        let logs: Array<Record<string, unknown>> = [];
        try {
            const content = await fs.default.readFile(logFile, "utf8");
            logs = JSON.parse(content);
        } catch { }
        // const analysis = analyzeError({
        //     message: error.message,
        //     file: error.file,
        //     line: error.line,
        // });
        const analysis = { category: "Unknown", fixHint: "-" };
        // Memory layer: check for repeats and enrich analysis
        let memoryInfo = null;
        try {
            memoryInfo = await memorize({
                message: error.message,
                category: analysis.category,
                fixHint: analysis.fixHint,
            });
        } catch { }
        const analysisWithMemory = {
            ...analysis,
            repeated: memoryInfo ? memoryInfo.count > 1 : false,
            count: memoryInfo ? memoryInfo.count : 1,
            firstSeen: memoryInfo ? memoryInfo.firstSeen : undefined,
            lastSeen: memoryInfo ? memoryInfo.lastSeen : undefined,
        };
        logs.push({ ...error, analysis: analysisWithMemory });
        await fs.default.writeFile(logFile, JSON.stringify(logs, null, 2), "utf8");
    } catch (e) {
        logger.error("Insight reporter failed:", e);
    }
}
