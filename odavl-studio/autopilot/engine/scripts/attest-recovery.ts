import fs from "node:fs";
import path from "node:path";

export function writeRecoveryAttestation(
    snapshotId: string,
    ok: boolean,
    reason?: string
) {
    const root = process.cwd();
    const dir = path.join(root, ".odavl", "attestations", "recovery");
    fs.mkdirSync(dir, { recursive: true });
    const fp = path.join(dir, `recovery-${snapshotId}.md`);
    const md = `# ODAVL Recovery Attestation
- Snapshot ID: ${snapshotId}
- Status: ${ok ? "✅ Recovered" : "❌ Failed"}
- Reason: ${reason ?? "N/A"}
- Timestamp: ${new Date().toISOString()}
`;
    fs.writeFileSync(fp, md, "utf8");
    return fp;
}

// demo run
const fp = writeRecoveryAttestation("demo-snapshot", true, "Manual test OK");
console.log(`[ODAVL] Recovery attestation → ${fp}`);
