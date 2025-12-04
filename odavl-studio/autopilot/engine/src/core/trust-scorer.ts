import * as fsp from "node:fs/promises";
import path from "node:path";

export async function computeTrustScore(): Promise<number> {
    const dir = path.join(process.cwd(), ".odavl", "ledger");

    try {
        await fsp.access(dir);
    } catch {
        return 1;
    }

    const allFiles = await fsp.readdir(dir);
    const files = allFiles.filter(f => f.endsWith(".json"));
    const total = Math.min(files.length, 10);
    if (!total) return 1;

    let successes = 0;
    for (const f of files.slice(-total)) {
        const content = await fsp.readFile(path.join(dir, f), "utf8");
        const j = JSON.parse(content);
        if (j.payload?.status === "ok" || j.payload?.status === "recovered") successes++;
    }
    const score = Math.max(0.5, Math.min(1.5, 1 + (successes - total / 2) / total));
    return Number(score.toFixed(2));
}
