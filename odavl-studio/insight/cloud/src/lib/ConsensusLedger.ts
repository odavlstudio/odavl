import fs from "node:fs";
import path from "node:path";

export function writeConsensusLedger(res: any) {
    const dir = path.join(process.cwd(), ".odavl/consensus");
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, `round-${Date.now()}.json`), JSON.stringify(res, null, 2), "utf8");
}
