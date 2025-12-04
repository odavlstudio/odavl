import * as fsp from "node:fs/promises";
import path from "node:path";

export async function logMetric(event: string, data: Record<string, unknown> = {}) {
    const dir = path.join(process.cwd(), ".odavl", "metrics");

    try {
        await fsp.access(dir);
    } catch {
        await fsp.mkdir(dir, { recursive: true });
    }

    const line = `${new Date().toISOString()} | ${event} | ${JSON.stringify(data)}\n`;
    await fsp.appendFile(path.join(dir, "live.log"), line, "utf8");
}
