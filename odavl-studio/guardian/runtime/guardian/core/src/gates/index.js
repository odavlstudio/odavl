"use strict";
/**
 * ODAVL Guardian - Gates Exports
 * Phase Ω-P2: Centralized gate exports
 * Phase Ω-P6 Phase 4: Telemetry integration
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
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
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
exports.gateFileTypeRisk = exports.gateSecurity = exports.gateRegression = exports.gatePerformance = void 0;
exports.runAllGates = runAllGates;
__exportStar(require("./deployment-gates"), exports);
var performance_gate_1 = require("./performance-gate");
Object.defineProperty(exports, "gatePerformance", { enumerable: true, get: function () { return performance_gate_1.gatePerformance; } });
var regression_gate_1 = require("./regression-gate");
Object.defineProperty(exports, "gateRegression", { enumerable: true, get: function () { return regression_gate_1.gateRegression; } });
var security_gate_1 = require("./security-gate");
Object.defineProperty(exports, "gateSecurity", { enumerable: true, get: function () { return security_gate_1.gateSecurity; } });
var file_risk_gate_1 = require("./file-risk-gate");
Object.defineProperty(exports, "gateFileTypeRisk", { enumerable: true, get: function () { return file_risk_gate_1.gateFileTypeRisk; } });
var guardian_telemetry_js_1 = require("../../telemetry/guardian-telemetry.js");
/**
 * Run all deployment gates
 */
function runAllGates(input) {
    return __awaiter(this, void 0, void 0, function () {
        var gateConfidence, gatePerformance, gateRegression, gateSecurity, gateFileTypeRisk, results;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, Promise.resolve().then(function () { return __importStar(require('./deployment-gates')); })];
                case 1:
                    gateConfidence = (_a.sent()).gateConfidence;
                    return [4 /*yield*/, Promise.resolve().then(function () { return __importStar(require('./performance-gate')); })];
                case 2:
                    gatePerformance = (_a.sent()).gatePerformance;
                    return [4 /*yield*/, Promise.resolve().then(function () { return __importStar(require('./regression-gate')); })];
                case 3:
                    gateRegression = (_a.sent()).gateRegression;
                    return [4 /*yield*/, Promise.resolve().then(function () { return __importStar(require('./security-gate')); })];
                case 4:
                    gateSecurity = (_a.sent()).gateSecurity;
                    return [4 /*yield*/, Promise.resolve().then(function () { return __importStar(require('./file-risk-gate')); })];
                case 5:
                    gateFileTypeRisk = (_a.sent()).gateFileTypeRisk;
                    results = [
                        gateConfidence(input),
                        gatePerformance(input),
                        gateRegression(input),
                        gateSecurity(input),
                        gateFileTypeRisk(input),
                    ];
                    // OMEGA-P6 Phase 4: Emit telemetry after gates evaluated
                    return [4 /*yield*/, emitGuardianTelemetry(results, input)];
                case 6:
                    // OMEGA-P6 Phase 4: Emit telemetry after gates evaluated
                    _a.sent();
                    return [2 /*return*/, results];
            }
        });
    });
}
/**
 * Emit Guardian telemetry for learning and quality improvement
 */
function emitGuardianTelemetry(results, input) {
    return __awaiter(this, void 0, void 0, function () {
        var gatesPassed, gatesFailed, failedGateNames, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 2, , 3]);
                    gatesPassed = results.filter(function (r) { return r.pass; }).length;
                    gatesFailed = results.length - gatesPassed;
                    failedGateNames = results.filter(function (r) { return !r.pass; }).map(function (r) { return r.gate; });
                    return [4 /*yield*/, (0, guardian_telemetry_js_1.appendGuardianTelemetry)(process.cwd(), {
                            timestamp: new Date().toISOString(),
                            workspaceRoot: process.cwd(),
                            totalGates: results.length,
                            gatesPassed: gatesPassed,
                            gatesFailed: gatesFailed,
                            failedGateNames: failedGateNames,
                            performanceScore: input.performanceScore,
                            brainConfidence: input.brainConfidence,
                            fileRiskSummary: input.fileRiskSummary,
                        })];
                case 1:
                    _b.sent();
                    return [3 /*break*/, 3];
                case 2:
                    _a = _b.sent();
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    });
}
