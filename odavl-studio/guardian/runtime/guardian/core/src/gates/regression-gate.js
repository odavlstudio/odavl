"use strict";
/**
 * ODAVL Guardian - Regression Analysis Gate
 * Phase Ω-P2: Baseline comparison and regression detection
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.gateRegression = gateRegression;
/**
 * Gate 3: Regression Analysis
 * Block if baseline comparison shows regressions above threshold
 */
function gateRegression(input) {
    var _a, _b;
    var maxRegressions = (_b = (_a = input.thresholds) === null || _a === void 0 ? void 0 : _a.maxRegressions) !== null && _b !== void 0 ? _b : 0;
    if (!input.baselineComparison) {
        return {
            pass: true,
            reason: '⚠️ No baseline comparison available',
            gate: 'regression',
        };
    }
    var _c = input.baselineComparison, regressions = _c.regressions, improvements = _c.improvements;
    if (regressions <= maxRegressions) {
        return {
            pass: true,
            reason: "\u2713 ".concat(regressions, " regressions, ").concat(improvements, " improvements (threshold: ").concat(maxRegressions, ")"),
            score: regressions,
            gate: 'regression',
        };
    }
    return {
        pass: false,
        reason: "\u274C ".concat(regressions, " regressions exceed threshold ").concat(maxRegressions),
        score: regressions,
        gate: 'regression',
    };
}
