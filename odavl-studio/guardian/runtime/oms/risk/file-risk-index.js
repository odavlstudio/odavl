"use strict";
/**
 * OMEGA-P5: File Risk Index
 * Real risk scoring system for files based on type + history
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.computeFileRiskScore = computeFileRiskScore;
exports.classifyRiskLevel = classifyRiskLevel;
exports.buildRiskIndex = buildRiskIndex;
/**
 * OMEGA-P5 Risk Scoring Formula:
 * score = (riskWeight * 0.5) + (importance * 0.3) + (detectorFailure * 0.15) + (changeFreq * 0.05)
 *
 * OMEGA-P8: Multiplied by adaptive OMS weighting (0.5-1.5)
 */
function computeFileRiskScore(input) {
    var _a, _b;
    var base = input.type.riskWeight * 0.5;
    var imp = input.type.importance * 0.3;
    var hist = ((_a = input.detectorFailureRate) !== null && _a !== void 0 ? _a : 0) * 0.15;
    var freq = ((_b = input.changeFrequency) !== null && _b !== void 0 ? _b : 0) * 0.05;
    var score = base + imp + hist + freq;
    // OMEGA-P8: Apply adaptive OMS weighting multiplier
    try {
        var path = require('node:path');
        var fs = require('node:fs');
        var adaptiveStatePath = path.join(process.cwd(), '.odavl', 'brain-history', 'adaptive', 'state.json');
        if (fs.existsSync(adaptiveStatePath)) {
            var adaptiveContent = fs.readFileSync(adaptiveStatePath, 'utf8');
            var adaptiveState = JSON.parse(adaptiveContent);
            if (adaptiveState.omsWeightingMultiplier) {
                score = score * adaptiveState.omsWeightingMultiplier;
            }
        }
    }
    catch (_c) {
        // Use base score without adaptive weighting
    }
    return Math.min(1, Math.max(0, score));
}
/**
 * Classify risk level based on score
 * Thresholds: <0.25 low, <0.45 medium, <0.7 high, >=0.7 critical
 */
function classifyRiskLevel(score) {
    if (score < 0.25)
        return 'low';
    if (score < 0.45)
        return 'medium';
    if (score < 0.7)
        return 'high';
    return 'critical';
}
/**
 * Build risk index for multiple files
 */
function buildRiskIndex(files) {
    var index = {};
    for (var _i = 0, files_1 = files; _i < files_1.length; _i++) {
        var file = files_1[_i];
        var score = computeFileRiskScore({
            type: file.type,
            detectorFailureRate: file.detectorFailureRate,
            changeFrequency: file.changeFrequency,
        });
        index[file.path] = {
            score: score,
            level: classifyRiskLevel(score),
        };
    }
    return index;
}
