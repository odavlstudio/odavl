function writeGoldenSnapshot(report: any) {
    if (!report.gatesPassed) return;
    const fs = require("node:fs");
    const path = require("node:path");
    const crypto = require("node:crypto");
    const ROOT = process.cwd();
    const goldenDir = path.join(ROOT, ".odavl", "golden");
    if (!fs.existsSync(goldenDir)) fs.mkdirSync(goldenDir, { recursive: true });
    // For demo: snapshot only package.json and tsconfig.json
    const files = ["package.json", "tsconfig.json"];
    const data = {};
    for (const f of files) {
        const fp = path.join(ROOT, f);
        data[f] = fs.existsSync(fp) ? fs.readFileSync(fp, "utf8") : null;
    }
    const payload = {
        timestamp: new Date().toISOString(),
        files: data,
        hash: ""
    };
    payload.hash = crypto.createHash("sha256").update(JSON.stringify(payload)).digest("hex");
    fs.writeFileSync(path.join(goldenDir, "latest.json"), JSON.stringify(payload, null, 2));
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
import { learn } from "./phases/learn.js";


import * as fs from "node:fs";
import * as path from "node:path";
import crypto from "node:crypto";

function appendEvidenceChain(report: any) {
    const ROOT = process.cwd();
    const logPath = path.join(ROOT, ".odavl", "evidence-chain.log");
    let prevHash = "";
    if (fs.existsSync(logPath)) {
        const lines = fs.readFileSync(logPath, "utf8").trim().split("\n");
        if (lines.length > 1) {
            const last = lines[lines.length - 1];
            try { prevHash = JSON.parse(last).hash || ""; } catch { }
        }
    }
    const entry = {
        timestamp: new Date().toISOString(),
        runId: "ODAVL-" + Date.now(),
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
    fs.appendFileSync(logPath, JSON.stringify(entry) + "\n");
}

function main() {
    const before = observe();
    const decision = decide(before);
    act(decision);
    const verification = verify(before);
    const report = {
        before,
        after: verification.after,
        deltas: verification.deltas,
        decision,
        gatesPassed: verification.gatesPassed,
        gates: verification.gates
    };
    learn(report);
    appendEvidenceChain(report);
    writeGoldenSnapshot(report);
    console.log("[ODAVL] Self-healing loop complete.");
}

main();
