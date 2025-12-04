
import fs from "node:fs/promises";
import path from "node:path";
import { getRepoRoot } from "./utils/getRepoRoot";


export async function retrainInsightModel() {
    const repoRoot = getRepoRoot();
    const logsDir = path.join(repoRoot, ".odavl/insight/logs");
    const modelPath = path.join(repoRoot, ".odavl/insight/model.json");
    const files = await fs.readdir(logsDir);
    const stats: Record<string, { count: number; fixes: Record<string, number> }> = {};

    // Optimize: Process files in parallel with Promise.all + flatMap
    const jsonFiles = files.filter(file => file.endsWith(".json"));
    const fileDataArray = await Promise.all(
        jsonFiles.map(async file => {
            const content = await fs.readFile(path.join(logsDir, file), "utf8");
            return JSON.parse(content);
        })
    );

    // Single-pass aggregation (O(n) instead of O(n²))
    for (const data of fileDataArray) {
        for (const err of data) {
            const cat = err.analysis?.category || "Unknown";
            const fix = err.analysis?.autoFixHint || err.analysis?.fixHint || "NoFix";
            stats[cat] ??= { count: 0, fixes: {} };
            stats[cat].count++;
            stats[cat].fixes[fix] ??= 0;
            stats[cat].fixes[fix]++;
        }
    }

    // Memory loading reserved for future enhancements

    const model = Object.entries(stats).map(([category, data]) => ({
        category,
        total: data.count,
        commonFix: Object.entries(data.fixes).sort((a, b) => b[1] - a[1])[0][0],
    }));

    await fs.writeFile(modelPath, JSON.stringify({ updated: new Date(), model }, null, 2));
    return model;
}
