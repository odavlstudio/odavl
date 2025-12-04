import fs from "node:fs";
import path from "node:path";

export function writeLoopAttestation(runId: string, ok: boolean) {
    const dir = path.join(process.cwd(), ".odavl", "attestations", "loop");
    fs.mkdirSync(dir, { recursive: true });
    const fp = path.join(dir, `loop-${runId}.md`);
    const md = `# ODAVL Loop Attestation
- Run ID: ${runId}
- Status: ${ok ? "✅ PASS" : "❌ FAIL"}
- Timestamp: ${new Date().toISOString()}
`;
    fs.writeFileSync(fp, md, "utf8");
    console.log(`[ODAVL] Loop attestation → ${fp}`);
    return fp;
}

// demo run
const runId = `demo-${Date.now()}`;
writeLoopAttestation(runId, true);
