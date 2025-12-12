"use strict";
/**
 * ODAVL Guardian - CI/CD Integration Layer
 * Phase Ω-P2: Unified deployment decision engine
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
exports.runGuardianCI = runGuardianCI;
var gates_1 = require("../core/src/gates");
/**
 * Run complete Guardian CI/CD check
 * Merges Brain + Fusion + Gates into unified decision
 */
function runGuardianCI(input, options) {
    return __awaiter(this, void 0, void 0, function () {
        var timestamp, reasoning, gates, failedGates, allGatesPassed, brainScore, fusionScore, gatesScore, finalConfidence, canDeploy, fileRiskSummary, _a, loadOMSContext, resolveFileType_1, computeFileRiskScore_1, omsContext, risks, _b, error_1;
        var _c, _d;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0:
                    timestamp = new Date().toISOString();
                    reasoning = [];
                    _e.label = 1;
                case 1:
                    _e.trys.push([1, 9, , 10]);
                    return [4 /*yield*/, (0, gates_1.runAllGates)(input)];
                case 2:
                    gates = _e.sent();
                    failedGates = gates.filter(function (g) { return !g.pass; });
                    allGatesPassed = failedGates.length === 0;
                    brainScore = (_c = input.brainConfidence) !== null && _c !== void 0 ? _c : 0;
                    fusionScore = (_d = input.brainFusionScore) !== null && _d !== void 0 ? _d : 0;
                    gatesScore = (gates.filter(function (g) { return g.pass; }).length / gates.length) * 100;
                    finalConfidence = 0.5 * brainScore + 0.3 * fusionScore + 0.2 * gatesScore;
                    // Step 4: Add Brain reasoning if available
                    if (input.brainReasoning && input.brainReasoning.length > 0) {
                        reasoning.push('🧠 Brain Analysis:');
                        reasoning.push.apply(reasoning, input.brainReasoning);
                    }
                    // Step 5: Add gate results to reasoning
                    reasoning.push('🛡️ Guardian Gates:');
                    gates.forEach(function (gate) {
                        reasoning.push("  ".concat(gate.reason));
                    });
                    canDeploy = allGatesPassed;
                    if (options === null || options === void 0 ? void 0 : options.force) {
                        canDeploy = true;
                        reasoning.push('⚠️ Deployment forced despite gate failures');
                    }
                    // Step 7: Add final verdict
                    if (canDeploy) {
                        reasoning.push("\u2705 Deployment approved (confidence: ".concat(finalConfidence.toFixed(1), "%)"));
                    }
                    else {
                        reasoning.push("\u274C Deployment blocked (".concat(failedGates.length, " gates failed)"));
                    }
                    fileRiskSummary = void 0;
                    if (!(input.changedFiles && input.changedFiles.length > 0)) return [3 /*break*/, 8];
                    _e.label = 3;
                case 3:
                    _e.trys.push([3, 7, , 8]);
                    return [4 /*yield*/, Promise.resolve().then(function () { return __importStar(require('../../oms/oms-context.js')); })];
                case 4:
                    _a = _e.sent(), loadOMSContext = _a.loadOMSContext, resolveFileType_1 = _a.resolveFileType;
                    return [4 /*yield*/, Promise.resolve().then(function () { return __importStar(require('../../oms/risk/file-risk-index.js')); })];
                case 5:
                    computeFileRiskScore_1 = (_e.sent()).computeFileRiskScore;
                    return [4 /*yield*/, loadOMSContext()];
                case 6:
                    omsContext = _e.sent();
                    risks = input.changedFiles.map(function (f) { return computeFileRiskScore_1({ type: resolveFileType_1(f) }); });
                    fileRiskSummary = {
                        avgRisk: risks.reduce(function (s, r) { return s + r; }, 0) / risks.length,
                        criticalCount: risks.filter(function (r) { return r >= 0.7; }).length,
                        highRiskCount: risks.filter(function (r) { return r >= 0.5 && r < 0.7; }).length,
                    };
                    return [3 /*break*/, 8];
                case 7:
                    _b = _e.sent();
                    return [3 /*break*/, 8];
                case 8: return [2 /*return*/, {
                        canDeploy: canDeploy,
                        finalConfidence: finalConfidence,
                        gates: gates,
                        reasoning: reasoning,
                        brainScore: brainScore,
                        fusionScore: fusionScore,
                        fileRiskSummary: fileRiskSummary,
                        timestamp: timestamp,
                    }];
                case 9:
                    error_1 = _e.sent();
                    reasoning.push("\u274C Guardian CI error: ".concat(error_1));
                    return [2 /*return*/, {
                            canDeploy: false,
                            finalConfidence: 0,
                            gates: [],
                            reasoning: reasoning,
                            timestamp: timestamp,
                        }];
                case 10: return [2 /*return*/];
            }
        });
    });
}
