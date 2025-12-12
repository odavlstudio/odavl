"use strict";
/**
 * OMEGA-P5: Dockerfile File Type Definition
 * Real parser for Dockerfiles
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
exports.DockerfileType = void 0;
var promises_1 = require("node:fs/promises");
var node_fs_1 = require("node:fs");
function parseDockerfile(filePath) {
    return __awaiter(this, void 0, void 0, function () {
        var content, lines, fromMatch, baseImage, instructions, layers, ports, exposedPorts, complexity, error_1;
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
                    fromMatch = content.match(/^FROM\s+([^\s]+)/m);
                    baseImage = fromMatch ? fromMatch[1] : '';
                    instructions = lines.filter(function (line) { return /^(FROM|RUN|COPY|ADD|ENV|EXPOSE|CMD|ENTRYPOINT|WORKDIR|VOLUME|USER|ARG|LABEL)/i.test(line.trim()); });
                    layers = lines.filter(function (line) { return /^(RUN|COPY|ADD)/i.test(line.trim()); }).length;
                    ports = content.match(/^EXPOSE\s+(\d+)/gm) || [];
                    exposedPorts = ports.map(function (p) { var _a; return ((_a = p.match(/\d+/)) === null || _a === void 0 ? void 0 : _a[0]) || ''; }).filter(Boolean);
                    complexity = Math.min(100, (instructions.length * 3) + (layers * 5));
                    return [2 /*return*/, {
                            path: filePath,
                            type: 'dockerfile',
                            size: content.length,
                            complexity: Math.round(complexity),
                            imports: baseImage ? [baseImage] : [],
                            exports: exposedPorts,
                            functions: 0,
                            classes: 0,
                            interfaces: 0,
                            hasTests: false,
                            dependencies: [],
                        }];
                case 2:
                    error_1 = _a.sent();
                    return [2 /*return*/, {
                            path: filePath,
                            type: 'dockerfile',
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
exports.DockerfileType = {
    id: 'dockerfile',
    extensions: ['Dockerfile', '.dockerfile'],
    category: 'infra',
    riskWeight: 0.3, // High (container config)
    importance: 0.7,
    parse: parseDockerfile,
};
