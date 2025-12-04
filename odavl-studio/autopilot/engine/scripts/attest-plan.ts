import fs from "node:fs";
import path from "node:path";

export function writePlanAttestation(planId: string, ok: boolean) {
    const root = process.cwd();
    const dir = path.join(root, ".odavl", "attestations", "plans");
    fs.mkdirSync(dir, { recursive: true });
    const fp = path.join(dir, `plan-${planId}.md`);
    const md = `# ODAVL Plan Attestation
- Plan ID: ${planId}
- Status: ${ok ? "✅ PASS" : "❌ FAIL"}
- Timestamp: ${new Date().toISOString()}
`;
    fs.writeFileSync(fp, md, "utf8");
    return fp;
}

// Demo run
const demoPlan = { id: "demo-plan", ok: true };
const fp = writePlanAttestation(demoPlan.id, demoPlan.ok);
console.log(`[ODAVL] Plan attestation → ${fp}`);
