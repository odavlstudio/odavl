import * as fsp from "node:fs/promises";
import path from "node:path";

export async function recordLearning(runId: string, note: string) {
    const dir = path.join(process.cwd(), ".odavl", "learn");

    try {
        await fsp.access(dir);
    } catch {
        await fsp.mkdir(dir, { recursive: true });
    }

    const fp = path.join(dir, `learn-${runId}.log`);
    await fsp.appendFile(fp, `[${new Date().toISOString()}] ${note}\n`, "utf8");
}
