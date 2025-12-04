#!/usr/bin/env node
import { restoreSnapshot } from "../core/snapshots";

async function main() {
    const idx = process.argv.indexOf("--snapshot");
    if (idx === -1) throw new Error("Usage: odavl undo --snapshot <id>");
    const id = process.argv[idx + 1];
    restoreSnapshot(id);
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
