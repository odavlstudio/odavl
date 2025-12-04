import * as fsp from "node:fs/promises";

const snapshotPath = ".odavl/omega/snapshots/omega-snapshot.json";
const trustPath = ".odavl/recipes-trust.json";
const lockdownPath = ".odavl/security/lockdown.json";

console.log("📝 Generating Omega Summary Report...");

// Read snapshot data
const snapshotContent = await fsp.readFile(snapshotPath, "utf8");
const snapshot = JSON.parse(snapshotContent);

// Read trust data (optional)
let avgTrust = 0;
let recipeCount = 0;
try {
    await fsp.access(trustPath);
    const trustContent = await fsp.readFile(trustPath, "utf8");
    const trustData = JSON.parse(trustContent);
    const trusts = Object.values(trustData).filter((t) => typeof t === "number");
    avgTrust = trusts.reduce((sum, t) => sum + t, 0) / trusts.length || 0;
    recipeCount = trusts.length;
} catch {
    // Trust file doesn't exist
}

// Read security status
const lockdownContent = await fsp.readFile(lockdownPath, "utf8");
const lockdown = JSON.parse(lockdownContent);

// Generate final digest
const digestFile = ".odavl/omega/attestations/omega-attest.json";
let finalDigest = "pending";
try {
    await fsp.access(digestFile);
    const attestContent = await fsp.readFile(digestFile, "utf8");
    const attest = JSON.parse(attestContent);
    finalDigest = attest.digest;
} catch {
    // Digest file doesn't exist
}

const report = `# ODAVL Ω Snapshot Report

**Final System State Capture**

---

## Metadata

- **Timestamp**: ${snapshot.timestamp}
- **Version**: ${snapshot.version}
- **Status**: ✅ SEALED

---

## Snapshot Statistics

- **Files Hashed**: ${snapshot.totalFiles}
- **Total Size**: ${snapshot.totalSize} bytes
- **Average Trust**: ${avgTrust.toFixed(2)} (${recipeCount} recipes)
- **Security Lockdown**: ${lockdown.enabled ? "✅ Active" : "⚠️ Inactive"}

---

## Subsystem Fingerprints

${snapshot.snapshot.map((s: { file: string; hash: string; size: number }) => `- \`${s.file}\`\n  - Hash: \`${s.hash}\`\n  - Size: ${s.size} bytes`).join("\n\n")}

---

## Security Status

- **Lockdown Enabled**: ${lockdown.enabled}
- **Insight Write**: ${lockdown.allowInsightWrite ? "✅ Allowed" : "🚫 Disabled"}
- **Core Write**: ${lockdown.allowCoreWrite ? "✅ Allowed" : "🚫 Disabled"}
- **External API**: ${lockdown.allowExternalApi ? "✅ Allowed" : "🚫 Disabled"}
- **Auto-Attestation**: ${lockdown.autoAttest ? "✅ Active" : "⚠️ Inactive"}

---

## Final SHA-256 Digest

\`\`\`
${finalDigest}
\`\`\`

---

**ODAVL Phase 11 — Omega Snapshot Complete** 🧩
`;

const outPath = ".odavl/omega/reports/OMEGA_SUMMARY.md";
await fsp.writeFile(outPath, report);

console.log(`✅ Summary report created: ${outPath}`);
