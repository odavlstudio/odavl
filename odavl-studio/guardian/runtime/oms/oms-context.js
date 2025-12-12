"use strict";
/**
 * OMEGA-P5: OMS Unified Context Layer
 * Central nervous system for ODAVL intelligence
 *
 * This is the single source of truth for:
 * - File type intelligence
 * - Risk indexing
 * - Detector activity
 * - Recipe history
 * - Guardian baselines
 * - Brain fusion weights
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
exports.loadOMSContext = loadOMSContext;
exports.resolveFileType = resolveFileType;
exports.buildOMSContextForPaths = buildOMSContextForPaths;
var promises_1 = require("node:fs/promises");
var node_fs_1 = require("node:fs");
var path = __importStar(require("node:path"));
var ts_js_1 = require("./file-types/ts.js");
var json_js_1 = require("./file-types/json.js");
var yaml_js_1 = require("./file-types/yaml.js");
var tsx_js_1 = require("./file-types/tsx.js");
var js_js_1 = require("./file-types/js.js");
var jsx_js_1 = require("./file-types/jsx.js");
var md_js_1 = require("./file-types/md.js");
var env_js_1 = require("./file-types/env.js");
var prisma_js_1 = require("./file-types/prisma.js");
var sql_js_1 = require("./file-types/sql.js");
var dockerfile_js_1 = require("./file-types/dockerfile.js");
var docker_compose_js_1 = require("./file-types/docker-compose.js");
var workflows_js_1 = require("./file-types/workflows.js");
var config_ts_js_1 = require("./file-types/config-ts.js");
var config_js_js_1 = require("./file-types/config-js.js");
var next_config_js_1 = require("./file-types/next-config.js");
var package_json_js_1 = require("./file-types/package-json.js");
var pnpm_lock_js_1 = require("./file-types/pnpm-lock.js");
var eslint_config_js_1 = require("./file-types/eslint-config.js");
var tsconfig_js_1 = require("./file-types/tsconfig.js");
var file_intelligence_matrix_js_1 = require("./matrix/file-intelligence-matrix.js");
var file_risk_index_js_1 = require("./risk/file-risk-index.js");
/**
 * Load OMS Context from disk
 * OMEGA-P5: Real implementation loading from .odavl/
 */
function loadOMSContext() {
    return __awaiter(this, arguments, void 0, function (workspaceRoot) {
        var odavlPath, fileTypes, riskIndex, detectors, recipes, guardianHistory, brainWeights, error_1;
        if (workspaceRoot === void 0) { workspaceRoot = process.cwd(); }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    odavlPath = path.join(workspaceRoot, '.odavl');
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 8, , 9]);
                    return [4 /*yield*/, loadFileTypes()];
                case 2:
                    fileTypes = _a.sent();
                    return [4 /*yield*/, loadRiskIndex(odavlPath)];
                case 3:
                    riskIndex = _a.sent();
                    return [4 /*yield*/, loadDetectorActivity(odavlPath)];
                case 4:
                    detectors = _a.sent();
                    return [4 /*yield*/, loadRecipeHistory(odavlPath)];
                case 5:
                    recipes = _a.sent();
                    return [4 /*yield*/, loadGuardianHistory(odavlPath)];
                case 6:
                    guardianHistory = _a.sent();
                    return [4 /*yield*/, loadBrainWeights(odavlPath)];
                case 7:
                    brainWeights = _a.sent();
                    return [2 /*return*/, {
                            fileTypes: fileTypes,
                            riskIndex: riskIndex,
                            detectors: detectors,
                            recipes: recipes,
                            guardianHistory: guardianHistory,
                            brainWeights: brainWeights,
                            loaded: true,
                            timestamp: new Date().toISOString(),
                        }];
                case 8:
                    error_1 = _a.sent();
                    console.error('Failed to load OMS context:', error_1);
                    return [2 /*return*/, createEmptyContext()];
                case 9: return [2 /*return*/];
            }
        });
    });
}
/**
 * Load file type definitions
 * OMEGA-P5: All 20 file types wired
 */
function loadFileTypes() {
    return __awaiter(this, void 0, void 0, function () {
        var allTypes, matrix;
        return __generator(this, function (_a) {
            allTypes = [
                ts_js_1.TypeScriptFileType, tsx_js_1.TSXFileType, js_js_1.JavaScriptFileType, jsx_js_1.JSXFileType,
                json_js_1.JSONFileType, yaml_js_1.YAMLFileType, md_js_1.MarkdownFileType,
                env_js_1.EnvFileType, prisma_js_1.PrismaFileType, sql_js_1.SQLFileType,
                dockerfile_js_1.DockerfileType, docker_compose_js_1.DockerComposeType, workflows_js_1.WorkflowsFileType,
                config_ts_js_1.ConfigTSFileType, config_js_js_1.ConfigJSFileType, next_config_js_1.NextConfigFileType,
                package_json_js_1.PackageJSONFileType, pnpm_lock_js_1.PnpmLockFileType, eslint_config_js_1.ESLintConfigFileType, tsconfig_js_1.TSConfigFileType,
            ];
            matrix = (0, file_intelligence_matrix_js_1.buildFileIntelligenceMatrix)();
            return [2 /*return*/, allTypes.map(function (type) {
                    var intel = matrix.find(function (m) { return m.typeId === type.id; });
                    return {
                        type: type.id,
                        extensions: type.extensions,
                        category: type.category,
                        riskWeight: type.riskWeight,
                        importance: type.importance,
                        dominantDetectors: (intel === null || intel === void 0 ? void 0 : intel.dominantDetectors) || [],
                        effectiveRecipes: (intel === null || intel === void 0 ? void 0 : intel.preferredRecipes) || [],
                    };
                })];
        });
    });
}
/**
 * Load risk index from disk
 */
function loadRiskIndex(odavlPath) {
    return __awaiter(this, void 0, void 0, function () {
        var riskIndexPath, content, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    riskIndexPath = path.join(odavlPath, 'risk-index.json');
                    if (!(0, node_fs_1.existsSync)(riskIndexPath)) {
                        return [2 /*return*/, {}];
                    }
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, (0, promises_1.readFile)(riskIndexPath, 'utf-8')];
                case 2:
                    content = _a.sent();
                    return [2 /*return*/, JSON.parse(content)];
                case 3:
                    error_2 = _a.sent();
                    console.error('Failed to load risk index:', error_2);
                    return [2 /*return*/, {}];
                case 4: return [2 /*return*/];
            }
        });
    });
}
/**
 * Load detector activity history
 */
function loadDetectorActivity(odavlPath) {
    return __awaiter(this, void 0, void 0, function () {
        var detectorLogPath, content, error_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    detectorLogPath = path.join(odavlPath, 'detector-activity.json');
                    if (!(0, node_fs_1.existsSync)(detectorLogPath)) {
                        return [2 /*return*/, []];
                    }
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, (0, promises_1.readFile)(detectorLogPath, 'utf-8')];
                case 2:
                    content = _a.sent();
                    return [2 /*return*/, JSON.parse(content)];
                case 3:
                    error_3 = _a.sent();
                    console.error('Failed to load detector activity:', error_3);
                    return [2 /*return*/, []];
                case 4: return [2 /*return*/];
            }
        });
    });
}
/**
 * Load recipe execution history
 */
function loadRecipeHistory(odavlPath) {
    return __awaiter(this, void 0, void 0, function () {
        var recipeTrustPath, content, trustData, error_4;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    recipeTrustPath = path.join(odavlPath, 'recipes-trust.json');
                    if (!(0, node_fs_1.existsSync)(recipeTrustPath)) {
                        return [2 /*return*/, []];
                    }
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, (0, promises_1.readFile)(recipeTrustPath, 'utf-8')];
                case 2:
                    content = _a.sent();
                    trustData = JSON.parse(content);
                    // Convert trust data to recipe history format
                    return [2 /*return*/, Object.entries(trustData).map(function (_a) {
                            var recipeId = _a[0], data = _a[1];
                            return ({
                                recipeId: recipeId,
                                fileType: 'typescript', // Default, will be enhanced
                                successRate: data.successRate || 0,
                                totalRuns: data.totalRuns || 0,
                                avgLocChanged: data.avgLocChanged || 0,
                                lastUsed: data.lastUsed || new Date().toISOString(),
                            });
                        })];
                case 3:
                    error_4 = _a.sent();
                    console.error('Failed to load recipe history:', error_4);
                    return [2 /*return*/, []];
                case 4: return [2 /*return*/];
            }
        });
    });
}
/**
 * Load Guardian gate history
 */
function loadGuardianHistory(odavlPath) {
    return __awaiter(this, void 0, void 0, function () {
        var baselinePath, content, baseline_1, gateStats, _i, _a, run, _b, _c, _d, gate, passed, error_5;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0:
                    baselinePath = path.join(odavlPath, 'baseline-history.json');
                    if (!(0, node_fs_1.existsSync)(baselinePath)) {
                        return [2 /*return*/, []];
                    }
                    _e.label = 1;
                case 1:
                    _e.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, (0, promises_1.readFile)(baselinePath, 'utf-8')];
                case 2:
                    content = _e.sent();
                    baseline_1 = JSON.parse(content);
                    if (!baseline_1.runs || !Array.isArray(baseline_1.runs)) {
                        return [2 /*return*/, []];
                    }
                    gateStats = {};
                    for (_i = 0, _a = baseline_1.runs; _i < _a.length; _i++) {
                        run = _a[_i];
                        if (run.enforcement) {
                            for (_b = 0, _c = Object.entries(run.enforcement); _b < _c.length; _b++) {
                                _d = _c[_b], gate = _d[0], passed = _d[1];
                                if (!gateStats[gate]) {
                                    gateStats[gate] = { passes: 0, total: 0, scores: [] };
                                }
                                gateStats[gate].total++;
                                if (passed)
                                    gateStats[gate].passes++;
                            }
                        }
                    }
                    return [2 /*return*/, Object.entries(gateStats).map(function (_a) {
                            var _b;
                            var gate = _a[0], stats = _a[1];
                            return ({
                                gate: gate,
                                runs: stats.total,
                                passRate: stats.total > 0 ? stats.passes / stats.total : 0,
                                avgScore: stats.scores.length > 0 ? stats.scores.reduce(function (a, b) { return a + b; }, 0) / stats.scores.length : 0,
                                lastRun: ((_b = baseline_1.runs[baseline_1.runs.length - 1]) === null || _b === void 0 ? void 0 : _b.timestamp) || new Date().toISOString(),
                            });
                        })];
                case 3:
                    error_5 = _e.sent();
                    console.error('Failed to load Guardian history:', error_5);
                    return [2 /*return*/, []];
                case 4: return [2 /*return*/];
            }
        });
    });
}
/**
 * Load Brain fusion weights
 */
function loadBrainWeights(odavlPath) {
    return __awaiter(this, void 0, void 0, function () {
        var weightsPath, content, weights, error_6;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    weightsPath = path.join(odavlPath, 'brain-history', 'fusion-weights.json');
                    if (!(0, node_fs_1.existsSync)(weightsPath)) {
                        return [2 /*return*/, {
                                nn: 0.25,
                                lstm: 0.15,
                                mtl: 0.30,
                                bayesian: 0.15,
                                heuristic: 0.15,
                                lastUpdated: new Date().toISOString(),
                            }];
                    }
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, (0, promises_1.readFile)(weightsPath, 'utf-8')];
                case 2:
                    content = _a.sent();
                    weights = JSON.parse(content);
                    return [2 /*return*/, {
                            nn: weights.nn || 0.25,
                            lstm: weights.lstm || 0.15,
                            mtl: weights.mtl || 0.30,
                            bayesian: weights.bayesian || 0.15,
                            heuristic: weights.heuristic || 0.15,
                            lastUpdated: weights.lastUpdated || new Date().toISOString(),
                        }];
                case 3:
                    error_6 = _a.sent();
                    console.error('Failed to load Brain weights:', error_6);
                    return [2 /*return*/, {
                            nn: 0.25,
                            lstm: 0.15,
                            mtl: 0.30,
                            bayesian: 0.15,
                            heuristic: 0.15,
                            lastUpdated: new Date().toISOString(),
                        }];
                case 4: return [2 /*return*/];
            }
        });
    });
}
/**
 * Create empty context (fallback)
 */
function createEmptyContext() {
    return {
        fileTypes: [],
        riskIndex: {},
        detectors: [],
        recipes: [],
        guardianHistory: [],
        brainWeights: {
            nn: 0.25,
            lstm: 0.15,
            mtl: 0.30,
            bayesian: 0.15,
            heuristic: 0.15,
            lastUpdated: new Date().toISOString(),
        },
        loaded: false,
        timestamp: new Date().toISOString(),
    };
}
/**
 * Resolve file type by path
 * OMEGA-P5: Real implementation with all 20 types
 */
function resolveFileType(filePath) {
    var allTypes = [
        ts_js_1.TypeScriptFileType, tsx_js_1.TSXFileType, js_js_1.JavaScriptFileType, jsx_js_1.JSXFileType,
        json_js_1.JSONFileType, yaml_js_1.YAMLFileType, md_js_1.MarkdownFileType,
        env_js_1.EnvFileType, prisma_js_1.PrismaFileType, sql_js_1.SQLFileType,
        dockerfile_js_1.DockerfileType, docker_compose_js_1.DockerComposeType, workflows_js_1.WorkflowsFileType,
        config_ts_js_1.ConfigTSFileType, config_js_js_1.ConfigJSFileType, next_config_js_1.NextConfigFileType,
        package_json_js_1.PackageJSONFileType, pnpm_lock_js_1.PnpmLockFileType, eslint_config_js_1.ESLintConfigFileType, tsconfig_js_1.TSConfigFileType,
    ];
    var fileName = path.basename(filePath);
    var ext = path.extname(filePath);
    for (var _i = 0, allTypes_1 = allTypes; _i < allTypes_1.length; _i++) {
        var type = allTypes_1[_i];
        for (var _a = 0, _b = type.extensions; _a < _b.length; _a++) {
            var pattern = _b[_a];
            if (pattern.startsWith('.') && ext === pattern) {
                return type;
            }
            if (fileName === pattern || fileName.includes(pattern)) {
                return type;
            }
        }
    }
    return undefined;
}
/**
 * Build OMS context for specific file paths
 * OMEGA-P5: Real implementation with risk scoring
 */
function buildOMSContextForPaths(filePaths_1) {
    return __awaiter(this, arguments, void 0, function (filePaths, workspaceRoot) {
        var context, _i, filePaths_2, filePath, fileType, metadata, riskScore, error_7;
        if (workspaceRoot === void 0) { workspaceRoot = process.cwd(); }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, loadOMSContext(workspaceRoot)];
                case 1:
                    context = _a.sent();
                    _i = 0, filePaths_2 = filePaths;
                    _a.label = 2;
                case 2:
                    if (!(_i < filePaths_2.length)) return [3 /*break*/, 7];
                    filePath = filePaths_2[_i];
                    fileType = resolveFileType(filePath);
                    if (!fileType)
                        return [3 /*break*/, 6];
                    _a.label = 3;
                case 3:
                    _a.trys.push([3, 5, , 6]);
                    return [4 /*yield*/, fileType.parse(filePath)];
                case 4:
                    metadata = _a.sent();
                    riskScore = (0, file_risk_index_js_1.computeFileRiskScore)({
                        type: fileType,
                        detectorFailureRate: 0,
                        changeFrequency: 0,
                    });
                    context.riskIndex[filePath] = riskScore;
                    return [3 /*break*/, 6];
                case 5:
                    error_7 = _a.sent();
                    console.error("Failed to parse ".concat(filePath, ":"), error_7);
                    return [3 /*break*/, 6];
                case 6:
                    _i++;
                    return [3 /*break*/, 2];
                case 7: return [2 /*return*/, context];
            }
        });
    });
}
