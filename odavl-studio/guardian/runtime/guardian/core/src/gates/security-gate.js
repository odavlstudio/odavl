"use strict";
/**
 * ODAVL Guardian - Security Gate
 * Phase Ω-P2: MTL security prediction integration from Brain
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.gateSecurity = gateSecurity;
/**
 * Gate 4: Security Analysis
 * Block if Brain's MTL security prediction indicates high risk
 */
function gateSecurity(input) {
    var securityThreshold = 0.7; // High risk = 0.7+
    if (input.mtlSecurity === undefined) {
        return {
            pass: true,
            reason: '⚠️ No MTL security prediction available',
            gate: 'security',
        };
    }
    if (input.mtlSecurity < securityThreshold) {
        return {
            pass: true,
            reason: "\u2713 MTL security risk ".concat((input.mtlSecurity * 100).toFixed(1), "% below threshold"),
            score: input.mtlSecurity,
            gate: 'security',
        };
    }
    return {
        pass: false,
        reason: "\u274C MTL security risk ".concat((input.mtlSecurity * 100).toFixed(1), "% exceeds safe threshold"),
        score: input.mtlSecurity,
        gate: 'security',
    };
}
