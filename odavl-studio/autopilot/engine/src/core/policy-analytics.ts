import * as fsp from "node:fs/promises";
import path from "node:path";

export async function summarizePolicyHistory() {
    const fp = path.join(process.cwd(), ".odavl", "policy-ledger", "history.json");

    try {
        await fsp.access(fp);
    } catch {
        return { count: 0, avgTrust: 1 };
    }

    const content = await fsp.readFile(fp, "utf8");
    const entries = JSON.parse(content);
    const avgTrust = entries.reduce((a: number, e: any) => a + e.trustScore, 0) / entries.length;
    const last = entries[entries.length - 1];
    return { count: entries.length, avgTrust: Number(avgTrust.toFixed(2)), last };
}
