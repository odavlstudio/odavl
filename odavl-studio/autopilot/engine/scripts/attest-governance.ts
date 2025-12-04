import fs from "node:fs";
import path from "node:path";
import { computeTrustScore } from "../src/core/trust-scorer.js";
import { getGovernanceConfig } from "../src/core/policies.js";
import { adaptGovernance } from "../src/core/adaptive-governance.js";

function writeGovernanceAttestation(score: number, limits: Record<string, unknown>) {
    const dir = path.join(process.cwd(), ".odavl", "attestations", "governance");
    fs.mkdirSync(dir, { recursive: true });
    const fp = path.join(dir, `governance-${Date.now()}.md`);
    const md = `# ODAVL Governance Attestation
- Trust Score: ${score}
- Limits: ${JSON.stringify(limits)}
- Timestamp: ${new Date().toISOString()}
`;
    fs.writeFileSync(fp, md, "utf8");
    console.log(`[ODAVL] Governance attestation → ${fp}`);
}

async function main() {
    const base = await getGovernanceConfig();
    const adapted = await adaptGovernance(base);
    const score = await computeTrustScore();
    writeGovernanceAttestation(score, { maxFiles: adapted.maxFiles, maxLocPerFile: adapted.maxLocPerFile });
}

main().catch(console.error);
