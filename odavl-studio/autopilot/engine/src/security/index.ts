/**
 * ODAVL Security Module
 * Provides lockdown, attestation, and integrity verification
 */

export { checkLockdown, isWriteAllowed } from "./lockdown.js";
export { liveAttest, getAttestationHistory } from "./attest-live.js";
export { verifyIntegrity, computeHash } from "./hash-integrity.js";

export interface SecurityConfig {
    lockdownEnabled: boolean;
    attestationEnabled: boolean;
    integrityChecksEnabled: boolean;
}

export function getSecurityStatus(): SecurityConfig {
    const { checkLockdown } = require("./lockdown.js");
    const config = checkLockdown();

    return {
        lockdownEnabled: config.enabled,
        attestationEnabled: config.autoAttest,
        integrityChecksEnabled: true
    };
}

// CLI entry points for direct execution
if (import.meta.url === `file://${process.argv[1]}`) {
    const command = process.argv[2];

    if (command === "lockdown") {
        const { checkLockdown } = require("./lockdown.js");
        checkLockdown();
    } else if (command === "attest") {
        const { liveAttest } = require("./attest-live.js");
        const file = process.argv[3];
        if (!file) {
            console.error("Usage: tsx security/index.ts attest <file>");
            process.exit(1);
        }
        liveAttest(file);
    } else if (command === "verify") {
        const { verifyIntegrity } = require("./hash-integrity.js");
        const file = process.argv[3];
        const hash = process.argv[4];
        if (!file || !hash) {
            console.error("Usage: tsx security/index.ts verify <file> <hash>");
            process.exit(1);
        }
        const valid = verifyIntegrity(file, hash);
        process.exit(valid ? 0 : 1);
    }
}
