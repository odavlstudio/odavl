import fs from "node:fs";
import path from "node:path";
import { summarizePolicyHistory } from "../src/core/policy-analytics.js";

export async function writeHistoryAttestation() {
    const { count, avgTrust } = await summarizePolicyHistory();
    const dir = path.join(process.cwd(), ".odavl", "attestations", "history");
    fs.mkdirSync(dir, { recursive: true });
    const fp = path.join(dir, `history-${Date.now()}.md`);
    fs.writeFileSync(fp, `# ODAVL History Attestation\n- Records: ${count}\n- Avg Trust: ${avgTrust}\n- Timestamp: ${new Date().toISOString()}\n`, "utf8");
    console.log(`[ODAVL] History attestation → ${fp}`);
}

writeHistoryAttestation().catch(console.error);
