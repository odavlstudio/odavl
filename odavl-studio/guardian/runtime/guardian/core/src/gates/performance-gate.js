"use strict";
/**
 * ODAVL Guardian - Performance Gates
 * Phase Ω-P2: Lighthouse + Web Vitals enforcement
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.gatePerformance = gatePerformance;
/**
 * Gate 2: Performance Threshold
 * Block if Lighthouse or Web Vitals below thresholds
 */
function gatePerformance(input) {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    var lighthouseThreshold = (_b = (_a = input.thresholds) === null || _a === void 0 ? void 0 : _a.lighthouse) !== null && _b !== void 0 ? _b : 90;
    var lcpThreshold = (_d = (_c = input.thresholds) === null || _c === void 0 ? void 0 : _c.lcp) !== null && _d !== void 0 ? _d : 2500; // 2.5s
    var fidThreshold = (_f = (_e = input.thresholds) === null || _e === void 0 ? void 0 : _e.fid) !== null && _f !== void 0 ? _f : 100; // 100ms
    var clsThreshold = (_h = (_g = input.thresholds) === null || _g === void 0 ? void 0 : _g.cls) !== null && _h !== void 0 ? _h : 0.1;
    var issues = [];
    // Lighthouse check
    if (input.lighthouseScore !== undefined && input.lighthouseScore < lighthouseThreshold) {
        issues.push("Lighthouse ".concat(input.lighthouseScore, " < ").concat(lighthouseThreshold));
    }
    // Web Vitals checks
    if (input.webVitals) {
        if (input.webVitals.lcp && input.webVitals.lcp > lcpThreshold) {
            issues.push("LCP ".concat(input.webVitals.lcp, "ms > ").concat(lcpThreshold, "ms"));
        }
        if (input.webVitals.fid && input.webVitals.fid > fidThreshold) {
            issues.push("FID ".concat(input.webVitals.fid, "ms > ").concat(fidThreshold, "ms"));
        }
        if (input.webVitals.cls && input.webVitals.cls > clsThreshold) {
            issues.push("CLS ".concat(input.webVitals.cls.toFixed(3), " > ").concat(clsThreshold));
        }
    }
    if (issues.length === 0) {
        return {
            pass: true,
            reason: '✓ Performance metrics within thresholds',
            score: input.lighthouseScore,
            gate: 'performance',
        };
    }
    return {
        pass: false,
        reason: "\u274C Performance issues: ".concat(issues.join(', ')),
        score: input.lighthouseScore,
        gate: 'performance',
    };
}
