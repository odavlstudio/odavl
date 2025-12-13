import { signPacket, postPacket } from "./MeshBridge";
import fs from "node:fs";
import path from "node:path";
import { logger } from '../utils/logger';

export async function syncGovernance(peerUrls: string[], key: string) {
    const fp = path.join(process.cwd(), ".odavl/policy-ledger/history.json");
    if (!fs.existsSync(fp)) return;
    const data = JSON.parse(fs.readFileSync(fp, "utf8")).slice(-5);
    const packet = signPacket({ timestamp: new Date().toISOString(), data }, key);
    for (const url of peerUrls) await postPacket(url + "/api/mesh/sync", packet);
    logger.debug(`[ODAVL] Synced ${peerUrls.length} peers`);
}
