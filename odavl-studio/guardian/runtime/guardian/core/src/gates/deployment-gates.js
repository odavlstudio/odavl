"use strict";
/**
 * ODAVL Guardian - Deployment Gates
 * Phase Ω-P2: Production-grade deployment safety gates
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.gateConfidence = gateConfidence;
/**
 * Gate 1: Confidence Threshold
 * Block if Brain confidence below required threshold
 *
 * OMEGA-P8: Threshold adjusted by adaptive guardian sensitivity
 */
function gateConfidence(input) {
    var _a, _b, _c, _d;
    var threshold = (_b = (_a = input.thresholds) === null || _a === void 0 ? void 0 : _a.confidence) !== null && _b !== void 0 ? _b : 75;
    var confidence = (_c = input.brainConfidence) !== null && _c !== void 0 ? _c : 0;
    // OMEGA-P8: Apply adaptive guardian sensitivity adjustment
    try {
        var path = require('node:path');
        var fs = require('node:fs');
        var adaptiveStatePath = path.join(process.cwd(), '.odavl', 'brain-history', 'adaptive', 'state.json');
        if (fs.existsSync(adaptiveStatePath)) {
            var adaptiveContent = fs.readFileSync(adaptiveStatePath, 'utf8');
            var adaptiveState = JSON.parse(adaptiveContent);
            // Sensitivity adjustment: low→+0%, medium→+10%, high→+20%, critical→+30%
            var sensitivityAdjustment = {
                'low': 0,
                'medium': 0.10,
                'high': 0.20,
                'critical': 0.30,
            };
            var adjustment = (_d = sensitivityAdjustment[adaptiveState.guardianSensitivity]) !== null && _d !== void 0 ? _d : 0;
            threshold = threshold * (1 + adjustment);
        }
    }
    catch (_e) {
        // Use base threshold
    }
    if (confidence >= threshold) {
        return {
            pass: true,
            reason: "\u2713 Confidence ".concat(confidence.toFixed(1), "% meets threshold ").concat(threshold.toFixed(1), "%"),
            score: confidence,
            gate: 'confidence',
        };
    }
    return {
        pass: false,
        reason: "\u274C Confidence ".concat(confidence.toFixed(1), "% below threshold ").concat(threshold.toFixed(1), "%"),
        score: confidence,
        gate: 'confidence',
    };
}
