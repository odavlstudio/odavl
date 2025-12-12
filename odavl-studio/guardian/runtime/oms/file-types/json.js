"use strict";
/**
 * OMEGA-P5: JSON File Type Definition
 * Real JSON parser with validation
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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JSONFileType = void 0;
var promises_1 = require("node:fs/promises");
var node_fs_1 = require("node:fs");
/**
 * Parse JSON file and extract metadata
 * OMEGA-P5: Real implementation with safe JSON parsing
 */
function parseJSONFile(filePath) {
    return __awaiter(this, void 0, void 0, function () {
        var content, data, depth, keys, arrayCount, objectCount, isConfig, isPackage, complexity, dependencies, error_1;
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
                    data = JSON.parse(content);
                    depth = calculateJSONDepth(data);
                    keys = Object.keys(data);
                    arrayCount = countArrays(data);
                    objectCount = countObjects(data);
                    isConfig = filePath.includes('config') ||
                        filePath.endsWith('tsconfig.json') ||
                        filePath.endsWith('eslint.json') ||
                        filePath.endsWith('.eslintrc.json');
                    isPackage = filePath.endsWith('package.json') ||
                        filePath.endsWith('package-lock.json') ||
                        filePath.endsWith('pnpm-lock.yaml');
                    complexity = Math.min(100, (depth * 10) + (keys.length) + (arrayCount * 2) + (objectCount * 3));
                    dependencies = [];
                    if (isPackage && data.dependencies) {
                        dependencies = Object.keys(data.dependencies);
                    }
                    if (isPackage && data.devDependencies) {
                        dependencies = __spreadArray(__spreadArray([], dependencies, true), Object.keys(data.devDependencies), true);
                    }
                    return [2 /*return*/, {
                            path: filePath,
                            type: 'json',
                            size: content.length,
                            complexity: Math.round(complexity),
                            imports: [],
                            exports: keys,
                            functions: 0,
                            classes: 0,
                            interfaces: 0,
                            hasTests: false,
                            dependencies: dependencies,
                        }];
                case 2:
                    error_1 = _a.sent();
                    console.error("Failed to parse JSON file ".concat(filePath, ":"), error_1);
                    return [2 /*return*/, {
                            path: filePath,
                            type: 'json',
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
 * Calculate JSON depth (nesting level)
 */
function calculateJSONDepth(obj, currentDepth) {
    if (currentDepth === void 0) { currentDepth = 0; }
    if (typeof obj !== 'object' || obj === null) {
        return currentDepth;
    }
    var maxDepth = currentDepth;
    for (var key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            var depth = calculateJSONDepth(obj[key], currentDepth + 1);
            maxDepth = Math.max(maxDepth, depth);
        }
    }
    return maxDepth;
}
/**
 * Count arrays in JSON structure
 */
function countArrays(obj) {
    if (!obj || typeof obj !== 'object')
        return 0;
    var count = Array.isArray(obj) ? 1 : 0;
    for (var key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            count += countArrays(obj[key]);
        }
    }
    return count;
}
/**
 * Count objects in JSON structure
 */
function countObjects(obj) {
    if (!obj || typeof obj !== 'object' || Array.isArray(obj))
        return 0;
    var count = 1;
    for (var key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            count += countObjects(obj[key]);
        }
    }
    return count;
}
/**
 * JSON File Type Definition
 * OMEGA-P5: Higher risk for config files
 */
exports.JSONFileType = {
    id: 'json',
    extensions: ['.json'],
    category: 'config',
    riskWeight: 0.3, // High risk (config changes affect runtime)
    importance: 0.7, // Important (configuration)
    parse: parseJSONFile,
};
