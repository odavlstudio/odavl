#!/usr/bin/env node
import { verifyIntegrity, computeHash } from "./hash-integrity.js";

const filePath = process.argv[2];
const expectedHash = process.argv[3];

if (!filePath) {
    console.error("\n❌ Usage: tsx test-integrity.ts <file> [hash]\n");
    console.log("If hash is omitted, will compute and display the hash.\n");
    process.exit(1);
}

console.log(`\n🔐 ODAVL Integrity Verification\n`);

if (!expectedHash) {
    // Just compute and display hash
    const hash = computeHash(filePath);
    console.log(`File: ${filePath}`);
    console.log(`Hash: sha256:${hash}\n`);
    process.exit(0);
}

// Verify integrity
const isValid = await verifyIntegrity(filePath, expectedHash);
console.log();
process.exit(isValid ? 0 : 1);
