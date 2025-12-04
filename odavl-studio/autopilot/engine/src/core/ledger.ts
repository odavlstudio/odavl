import * as fsp from "node:fs/promises";
import path from "node:path";
import { sha256 } from "./policies";

export async function writeLedger(runId: string, payload: unknown) {
    const root = process.cwd();
    const dir = path.join(root, ".odavl", "ledger");

    try {
        await fsp.access(dir);
    } catch {
        await fsp.mkdir(dir, { recursive: true });
    }

    const body = JSON.stringify(payload, null, 2);
    const sig = sha256(body);
    const out = { runId, signature: `sha256:${sig}`, payload: JSON.parse(body) };
    const fp = path.join(dir, `run-${runId}.json`);
    await fsp.writeFile(fp, JSON.stringify(out, null, 2), "utf8");
    return fp;
}
