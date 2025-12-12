"use strict";
/**
 * OMEGA-P5: TypeScript React (TSX) File Type Definition
 * Real parser for .tsx files (TypeScript + JSX)
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
exports.TSXFileType = void 0;
var promises_1 = require("node:fs/promises");
var node_fs_1 = require("node:fs");
/**
 * Parse TSX file and extract metadata
 * OMEGA-P5: Real implementation extending TypeScript parser
 */
function parseTSXFile(filePath) {
    return __awaiter(this, void 0, void 0, function () {
        var content, lines, imports, importPaths, exports_1, exportNames, components, hooks, complexity, dependencies, error_1;
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
                    imports = content.match(/^import\s+.*\s+from\s+['"]([^'"]+)['"]/gm) || [];
                    importPaths = imports.map(function (imp) {
                        var match = imp.match(/from\s+['"]([^'"]+)['"]/);
                        return match ? match[1] : '';
                    }).filter(Boolean);
                    exports_1 = content.match(/^export\s+(default\s+)?(class|function|const|interface|type)\s+(\w+)/gm) || [];
                    exportNames = exports_1.map(function (exp) { return exp.split(/\s+/).pop() || ''; }).filter(Boolean);
                    components = (content.match(/function\s+[A-Z]\w+\s*\(/g) || []).length +
                        (content.match(/const\s+[A-Z]\w+\s*[:=]\s*\(/g) || []).length +
                        (content.match(/class\s+[A-Z]\w+\s+extends\s+(React\.)?Component/g) || []).length;
                    hooks = (content.match(/use[A-Z]\w+\(/g) || []).length;
                    complexity = Math.min(100, (components * 15) + (hooks * 5) + (lines.length / 10));
                    dependencies = importPaths.filter(function (imp) { return !imp.startsWith('.') && !imp.startsWith('/'); });
                    return [2 /*return*/, {
                            path: filePath,
                            type: 'tsx',
                            size: content.length,
                            complexity: Math.round(complexity),
                            imports: importPaths,
                            exports: exportNames,
                            functions: components,
                            classes: (content.match(/class\s+[A-Z]\w+/g) || []).length,
                            interfaces: (content.match(/interface\s+\w+/g) || []).length,
                            hasTests: filePath.includes('.test.') || filePath.includes('.spec.'),
                            dependencies: dependencies,
                        }];
                case 2:
                    error_1 = _a.sent();
                    console.error("Failed to parse TSX file ".concat(filePath, ":"), error_1);
                    return [2 /*return*/, {
                            path: filePath,
                            type: 'tsx',
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
 * TSX File Type Definition
 * OMEGA-P5: High importance for React apps
 */
exports.TSXFileType = {
    id: 'tsx',
    extensions: ['.tsx'],
    category: 'app',
    riskWeight: 0.2, // Medium risk (UI components)
    importance: 0.9, // Very high importance (app layer)
    parse: parseTSXFile,
};
