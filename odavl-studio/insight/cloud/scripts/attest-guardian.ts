import fs from "node:fs";
import path from "node:path";
import { verifyAllAttestations } from "../src/lib/GlobalVerifier";
import { logger } from '../src/utils/logger';

export function writeGuardianAttestation() {
    const { verified, total, ratio } = verifyAllAttestations();
    const dir = path.join(process.cwd(), ".odavl/attestations/guardian");
    fs.mkdirSync(dir, { recursive: true });
    const fp = path.join(dir, `run-${Date.now()}.md`);
    fs.writeFileSync(fp, `# ODAVL Guardian Verification
- Total Attestations Checked: ${total}
- Verified: ${verified}
- Integrity Ratio: ${(ratio * 100).toFixed(1)}%
- Timestamp: ${new Date().toISOString()}
`, "utf8");
    logger.debug(`[ODAVL] Guardian attestation → ${fp}`);
}

writeGuardianAttestation();
