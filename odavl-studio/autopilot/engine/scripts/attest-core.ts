import fs from "node:fs";
import path from "node:path";

export function writeAttestation(
    runId: string,
    ok: boolean,
    notes: Record<string, unknown> = {}
) {
    const root = process.cwd();
    const dir = path.join(root, ".odavl", "attestations", "core");
    fs.mkdirSync(dir, { recursive: true });
    const fp = path.join(dir, `run-${runId}.md`);
    const md = `# ODAVL Core Attestation
- Run ID: ${runId}
- Status: ${ok ? "✅ PASS" : "❌ FAIL"}
- Notes: ${JSON.stringify(notes)}
`;
    fs.writeFileSync(fp, md, "utf8");
    return fp;
}

// simple entry for Phase 1 demo:
const runId = `${Date.now()}`;
const fp = writeAttestation(runId, true, { phase: 1, message: "Bootstrap OK" });
console.log(`[ODAVL] Attestation → ${fp}`);
