"use strict";
/**
 * OMEGA-P5: YAML File Type Definition
 * Real YAML parser with safe parsing
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
exports.YAMLFileType = void 0;
var promises_1 = require("node:fs/promises");
var node_fs_1 = require("node:fs");
/**
 * Parse YAML file and extract metadata
 * OMEGA-P5: Real implementation with line-based parsing (safe, no external deps)
 */
function parseYAMLFile(filePath) {
    return __awaiter(this, void 0, void 0, function () {
        var content, lines, topLevelKeys, nestedKeys, arrayItems, isWorkflow, isConfig, isDocker, maxDepth, _i, lines_1, line, match, indentLevel, complexity, dependencies, imageMatches, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    if (!(0, node_fs_1.existsSync)(filePath)) {
                        throw new Error("File not found: ".concat(filePath));
                    }
                    return [4 /*yield*/, (0, promises_1.readFile)(filePath, 'utf-8')];
                case 1:
                    content = _a.sent();
                    lines = content.split('\n');
                    topLevelKeys = lines.filter(function (line) {
                        return /^[a-zA-Z_][\w-]*:/.test(line.trim());
                    });
                    nestedKeys = lines.filter(function (line) {
                        return /^\s{2,}[a-zA-Z_][\w-]*:/.test(line);
                    });
                    arrayItems = lines.filter(function (line) {
                        return /^\s*-\s+/.test(line);
                    });
                    isWorkflow = filePath.includes('.github/workflows') || filePath.includes('workflow');
                    isConfig = filePath.includes('config') || filePath.endsWith('.yml') || filePath.endsWith('.yaml');
                    isDocker = filePath.includes('docker-compose');
                    maxDepth = 0;
                    for (_i = 0, lines_1 = lines; _i < lines_1.length; _i++) {
                        line = lines_1[_i];
                        match = line.match(/^(\s*)/);
                        if (match) {
                            indentLevel = Math.floor(match[1].length / 2);
                            maxDepth = Math.max(maxDepth, indentLevel);
                        }
                    }
                    complexity = Math.min(100, (topLevelKeys.length * 5) + (nestedKeys.length * 2) + (arrayItems.length) + (maxDepth * 10));
                    dependencies = [];
                    if (isDocker) {
                        imageMatches = content.match(/image:\s*([^\s]+)/g) || [];
                        dependencies.push.apply(dependencies, imageMatches.map(function (m) { return m.replace('image:', '').trim(); }));
                    }
                    return [2 /*return*/, {
                            path: filePath,
                            type: 'yaml',
                            size: content.length,
                            complexity: Math.round(complexity),
                            imports: [],
                            exports: topLevelKeys.map(function (k) { return k.split(':')[0].trim(); }),
                            functions: 0,
                            classes: 0,
                            interfaces: 0,
                            hasTests: false,
                            dependencies: dependencies,
                        }];
                case 2:
                    error_1 = _a.sent();
                    console.error("Failed to parse YAML file ".concat(filePath, ":"), error_1);
                    return [2 /*return*/, {
                            path: filePath,
                            type: 'yaml',
                            size: 0,
                            complexity: 0,
                            imports: [],
                            exports: [],
                            functions: 0,
                            classes: 0,
                            interfaces: 0,
                            hasTests: false,
                            dependencies: [],
                        }];
                case 3: return [2 /*return*/];
            }
        });
    });
}
/**
 * YAML File Type Definition
 * OMEGA-P5: High risk for infrastructure files
 */
exports.YAMLFileType = {
    id: 'yaml',
    extensions: ['.yaml', '.yml'],
    category: 'infra',
    riskWeight: 0.3, // High risk (infrastructure/CI changes)
    importance: 0.6, // Important (configuration)
    parse: parseYAMLFile,
};
