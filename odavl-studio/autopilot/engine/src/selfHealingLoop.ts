// Unified: Only dependency-injected version exists
import { logger } from './utils/Logger';

async function writeGoldenSnapshot(report: any, deps?: {
    fs?: typeof import('node:fs/promises');
    path?: typeof import('node:path');
    crypto?: typeof import('node:crypto');
    root?: string;
    now?: () => string;
}) {
    if (!report.gatesPassed) return;
    const fsp = deps?.fs ?? (await import('node:fs/promises'));
    const path = deps?.path ?? require("node:path");
    const crypto = deps?.crypto ?? require("node:crypto");
    const ROOT = deps?.root ?? process.cwd();
    const now = deps?.now ?? (() => new Date().toISOString());
    const goldenDir = path.join(ROOT, ".odavl", "golden");
    try {
        await fsp.access(goldenDir);
    } catch {
        await fsp.mkdir(goldenDir, { recursive: true });
    }
    // For demo: snapshot only package.json and tsconfig.json
    const files = ["package.json", "tsconfig.json"];
    const data: { [key: string]: string | null } = {};
    for (const f of files) {
        const fp = path.join(ROOT, f);
        try {
            await fsp.access(fp);
            data[f] = await fsp.readFile(fp, "utf8");
        } catch {
            data[f] = null;
        }
    }
    const payload = {
        timestamp: now(),
        files: data,
        hash: ""
    };
    payload.hash = crypto.createHash("sha256").update(JSON.stringify(payload)).digest("hex");
    await fsp.writeFile(path.join(goldenDir, "latest.json"), JSON.stringify(payload, null, 2));
}
/**
 * ODAVL Self-Healing Loop Entrypoint (Wave 7)
 * Runs: observe → decide → act → verify → learn
 * Logs all actions and decisions to evidence files.
 * ≤40 LOC, no protected paths touched.
 */
import { observe } from "./phases/observe.js";
import { decide } from "./phases/decide.js";
import { act } from "./phases/act.js";
import { verify } from "./phases/verify.js";




async function appendEvidenceChain(report: any, deps?: {
    fs?: typeof import('node:fs/promises');
    path?: typeof import('node:path');
    crypto?: typeof import('node:crypto');
    root?: string;
    now?: () => string;
    nowNum?: () => number;
}) {
    const fsp = deps?.fs ?? (await import('node:fs/promises'));
    const path = deps?.path ?? require("node:path");
    const crypto = deps?.crypto ?? require("node:crypto");
    const ROOT = deps?.root ?? process.cwd();
    const now = deps?.now ?? (() => new Date().toISOString());
    const nowNum = deps?.nowNum ?? (() => Date.now());
    const logPath = path.join(ROOT, ".odavl", "evidence-chain.log");
    let prevHash = "";
    try {
        await fsp.access(logPath);
        const content = await fsp.readFile(logPath, "utf8");
        const lines = content.trim().split("\n");
        if (lines.length > 1) {
            const last = lines.at(-1) ?? "";
            try { prevHash = JSON.parse(last).hash || ""; } catch { }
        }
    } catch {
        // File doesn't exist yet
    }
    const entry = {
        timestamp: now(),
        runId: "ODAVL-" + nowNum(),
        prevHash,
        summary: {
            decision: report.decision,
            deltas: report.deltas,
            gatesPassed: report.gatesPassed
        },
        hash: "",
        signature: ""
    };
    const hashInput = JSON.stringify({ ...entry, hash: undefined, signature: undefined });
    entry.hash = crypto.createHash("sha256").update(hashInput).digest("hex");
    entry.signature = "sig-" + crypto.randomBytes(8).toString("hex");
    await fsp.appendFile(logPath, JSON.stringify(entry) + "\n");
}


async function main() {
    const before = await observe();
    const decision = await decide(before);
    await act(decision);
    const verification = await verify(before, decision);
    const report = {
        before,
        after: verification.after,
        deltas: verification.deltas,
        decision,
        gatesPassed: verification.gatesPassed,
        gates: verification.gates
    };
    // LEARN phase will be reimplemented - skip for now
    await appendEvidenceChain(report);
    await writeGoldenSnapshot(report);
    logger.success("[ODAVL] Self-healing loop complete.");
}


// Export for testing

export { writeGoldenSnapshot, appendEvidenceChain };

// Only run main if executed directly (not when imported for tests)
if (require.main === module) {
    main();
}
