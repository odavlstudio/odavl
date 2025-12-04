import fs from "node:fs";
import path from "node:path";
import { logger } from '../src/utils/logger';

export function writeMeshAttestation(avgTrust: number, peers: number) {
    const dir = path.join(process.cwd(), ".odavl/attestations/mesh");
    fs.mkdirSync(dir, { recursive: true });
    const fp = path.join(dir, `run-${Date.now()}.md`);
    fs.writeFileSync(fp, `# ODAVL Mesh Attestation\n- Peers: ${peers}\n- Global Trust: ${avgTrust}\n- Timestamp: ${new Date().toISOString()}\n`, "utf8");
    logger.debug(`[ODAVL] Mesh attestation → ${fp}`);
}

// Example: Create attestation with sample data
writeMeshAttestation(1.22, 3);
