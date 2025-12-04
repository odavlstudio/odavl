import fs from "node:fs";
import path from "node:path";
import { runConsensus } from "../src/lib/ConsensusProtocol";
import { writeConsensusLedger } from "../src/lib/ConsensusLedger";
import { signPacket } from "../src/lib/MeshBridge";
import { logger } from '../src/utils/logger';

export function writeConsensusAttestation(res: any) {
    const dir = path.join(process.cwd(), ".odavl/attestations/consensus");
    fs.mkdirSync(dir, { recursive: true });
    const md = `# ODAVL Consensus Attestation
- Peers: ${res.total}
- Approved: ${res.approved}
- Ratio: ${res.ratio}
- Consensus: ${res.consensus ? "✅ PASS" : "❌ FAIL"}
- Timestamp: ${new Date().toISOString()}
`;
    fs.writeFileSync(path.join(dir, `run-${Date.now()}.md`), md, "utf8");
}

// Sample test: Create 3 peers with signed packets
const key = "test-secret-key";
const peers = [
    signPacket({ trustScore: 1.1, maxFiles: 11 }, key),
    signPacket({ trustScore: 1.2, maxFiles: 12 }, key),
    signPacket({ trustScore: 1.3, maxFiles: 13 }, key),
];

const result = runConsensus(peers, key);
writeConsensusLedger(result);
writeConsensusAttestation(result);
logger.debug(`[ODAVL] Consensus ${result.consensus ? "✅ PASS" : "❌ FAIL"} (${result.approved}/${result.total})`);
