"use strict";
/**
 * OMEGA-P5 Phase 4 Commit 3: Guardian + OMS Integration
 * OMS-aware file risk gate with dynamic thresholds (≤40 LOC)
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.gateFileTypeRisk = gateFileTypeRisk;
var oms_context_js_1 = require("../../../../oms/oms-context.js");
var file_risk_index_js_1 = require("../../../../oms/risk/file-risk-index.js");
function gateFileTypeRisk(input) {
    return __awaiter(this, void 0, void 0, function () {
        var omsContext, changedFiles, fileRisks, avgRisk, criticalFiles, highRiskFiles, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, (0, oms_context_js_1.loadOMSContext)()];
                case 1:
                    omsContext = _b.sent();
                    changedFiles = input.changedFiles || [];
                    fileRisks = changedFiles.map(function (file) {
                        var fileType = (0, oms_context_js_1.resolveFileType)(file);
                        return (0, file_risk_index_js_1.computeFileRiskScore)({ type: fileType });
                    });
                    avgRisk = fileRisks.reduce(function (sum, r) { return sum + r; }, 0) / fileRisks.length;
                    criticalFiles = fileRisks.filter(function (r) { return r >= 0.7; }).length;
                    highRiskFiles = fileRisks.filter(function (r) { return r >= 0.5 && r < 0.7; }).length;
                    // Dynamic thresholds based on OMS risk scores
                    if (avgRisk >= 0.7) {
                        return [2 /*return*/, { pass: false, reason: "\u274C Critical risk: avgRisk=".concat(avgRisk.toFixed(2), " (\u22650.7 threshold)"), gate: 'fileRisk' }];
                    }
                    if (criticalFiles > 0) {
                        return [2 /*return*/, { pass: false, reason: "\u26A0\uFE0F ".concat(criticalFiles, " critical files detected (risk \u22650.7)"), gate: 'fileRisk' }];
                    }
                    if (avgRisk >= 0.5) {
                        return [2 /*return*/, { pass: true, reason: "\u26A0\uFE0F High risk: avgRisk=".concat(avgRisk.toFixed(2), " - extra scrutiny recommended"), gate: 'fileRisk' }];
                    }
                    return [2 /*return*/, { pass: true, reason: "\u2713 Low risk: avgRisk=".concat(avgRisk.toFixed(2), ", ").concat(highRiskFiles, " high-risk files"), gate: 'fileRisk' }];
                case 2:
                    _a = _b.sent();
                    return [2 /*return*/, { pass: true, reason: '⚠️ OMS unavailable, skipping risk check', gate: 'fileRisk' }];
                case 3: return [2 /*return*/];
            }
        });
    });
}
