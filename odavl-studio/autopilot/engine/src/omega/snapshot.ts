import * as fsp from "node:fs/promises";
import crypto from "node:crypto";

const timestamp = new Date().toISOString();

// Critical subsystem files to snapshot
const files = [
    ".odavl/insight/live/command-snapshot.json",
    ".odavl/insight/live/loop-decision.json",
    ".odavl/insight/live/loop-execution.json",
    ".odavl/security/lockdown.json",
    ".odavl/security/keys.json",
    ".odavl/recipes-trust.json",
    ".odavl/history.json",
    "apps/cli/src/security/index.ts",
    "apps/cli/src/omega/snapshot.ts",
];

console.log("🧾 Creating Omega Snapshot...");

const snapshotPromises = files.map(async (f) => {
    try {
        await fsp.access(f);
        const data = await fsp.readFile(f, "utf8");
        const hash = crypto.createHash("sha256").update(data).digest("hex");
        const size = Buffer.byteLength(data, "utf8");
        return { file: f, hash: `sha256:${hash}`, size };
    } catch {
        return null;
    }
});

// Use Promise.allSettled for better error handling
const snapshotResults = await Promise.allSettled(snapshotPromises);
const snapshot = snapshotResults
    .filter((result): result is PromiseFulfilledResult<{ file: string; hash: string; size: number } | null> =>
        result.status === 'fulfilled' && result.value !== null
    )
    .map(result => result.value) as { file: string; hash: string; size: number }[];

// Log any failed snapshots for debugging
const failedSnapshots = snapshotResults.filter(result => result.status === 'rejected');
if (failedSnapshots.length > 0) {
    console.warn(`⚠️  ${failedSnapshots.length} file(s) failed to snapshot`);
    for (const result of failedSnapshots) {
        if (result.status === 'rejected') {
            const resultIndex = snapshotResults.indexOf(result);
            console.warn(`   - ${files[resultIndex]}: ${result.reason}`);
        }
    }
}

const snapshotData = {
    timestamp,
    version: "1.0.0",
    snapshot,
    totalFiles: snapshot.length,
    totalSize: snapshot.reduce((sum, s) => sum + s.size, 0),
};

const outPath = ".odavl/omega/snapshots/omega-snapshot.json";
await fsp.writeFile(outPath, JSON.stringify(snapshotData, null, 2));

console.log(`✅ Omega snapshot created: ${outPath}`);
console.log(`📊 Files captured: ${snapshot.length}`);
console.log(`📦 Total size: ${snapshotData.totalSize} bytes`);
