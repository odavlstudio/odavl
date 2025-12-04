import * as fsp from "node:fs/promises";
import path from "node:path";

export interface PolicyEntry {
    timestamp: string;
    trustScore: number;
    maxFiles: number;
    maxLocPerFile: number;
}

export async function recordPolicyChange(entry: PolicyEntry) {
    const dir = path.join(process.cwd(), ".odavl", "policy-ledger");

    try {
        await fsp.access(dir);
    } catch {
        await fsp.mkdir(dir, { recursive: true });
    }

    const fp = path.join(dir, "history.json");
    let data: PolicyEntry[] = [];

    try {
        await fsp.access(fp);
        const content = await fsp.readFile(fp, "utf8");
        data = JSON.parse(content);
    } catch {
        // File doesn't exist yet
    }

    data.push(entry);
    await fsp.writeFile(fp, JSON.stringify(data, null, 2), "utf8");
}
