#!/usr/bin/env node
import { liveAttest } from "./attest-live.js";

const filePath = process.argv[2] || ".odavl/security/lockdown.json";

console.log(`\n🔐 ODAVL Live Attestation\n`);
console.log(`Attesting file: ${filePath}`);

try {
    const hash = liveAttest(filePath);
    console.log(`\n✅ Attestation complete`);
    console.log(`Hash: sha256:${hash}`);
    console.log(`Log: .odavl/security/logs/attest.log\n`);
} catch (error) {
    console.error(`\n❌ Attestation failed:`, error);
    process.exit(1);
}
