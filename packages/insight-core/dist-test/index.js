"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/detector/ts-detector.js
var require_ts_detector = __commonJS({
  "src/detector/ts-detector.js"(exports2) {
    "use strict";
    var __createBinding = exports2 && exports2.__createBinding || (Object.create ? (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    }) : (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    }));
    var __setModuleDefault = exports2 && exports2.__setModuleDefault || (Object.create ? (function(o, v) {
      Object.defineProperty(o, "default", { enumerable: true, value: v });
    }) : function(o, v) {
      o["default"] = v;
    });
    var __importStar = exports2 && exports2.__importStar || /* @__PURE__ */ (function() {
      var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function(o2) {
          var ar = [];
          for (var k in o2) if (Object.prototype.hasOwnProperty.call(o2, k)) ar[ar.length] = k;
          return ar;
        };
        return ownKeys(o);
      };
      return function(mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) {
          for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        }
        __setModuleDefault(result, mod);
        return result;
      };
    })();
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.TSDetector = void 0;
    var node_child_process_1 = require("child_process");
    var path4 = __importStar(require("path"));
    var TSDetector2 = class {
      workspaceRoot;
      constructor(workspaceRoot) {
        this.workspaceRoot = workspaceRoot;
      }
      /**
       * Detects all TypeScript errors in the specified directory
       */
      async detect(targetDir) {
        const dir = targetDir || this.workspaceRoot;
        const errors = [];
        try {
          const tsconfigPath = path4.join(dir, "tsconfig.json");
          (0, node_child_process_1.execSync)(`tsc --noEmit --project ${tsconfigPath}`, {
            cwd: dir,
            stdio: "pipe",
            encoding: "utf8"
          });
          return [];
        } catch (error) {
          const output = error.stdout?.toString() || error.stderr?.toString() || "";
          return this.parseTypeScriptOutput(output);
        }
      }
      /**
       * Parse tsc output and convert to TSError[]
       */
      parseTypeScriptOutput(output) {
        const errors = [];
        const lines = output.split("\n");
        const errorRegex = /^(.+?)\((\d+),(\d+)\): (error|warning) (TS\d+): (.+)$/;
        for (const line of lines) {
          const match = line.match(errorRegex);
          if (match) {
            const [, file, lineNum, column, severity, code, message] = match;
            const error = {
              file: path4.resolve(this.workspaceRoot, file),
              line: Number.parseInt(lineNum, 10),
              column: Number.parseInt(column, 10),
              message: message.trim(),
              code,
              severity
            };
            this.analyzeRootCause(error);
            errors.push(error);
          }
        }
        return errors;
      }
      /**
       * Analyze root cause of error and suggest solution
       */
      analyzeRootCause(error) {
        const knownPatterns = {
          "TS2307": {
            cause: "Module not found - import file does not exist or path is incorrect",
            fix: "Ensure file exists, or check tsconfig.json paths"
          },
          "TS2304": {
            cause: "Variable/Type not defined - variable or type is undefined",
            fix: "Add import for library or define variable before use"
          },
          "TS2345": {
            cause: "Type mismatch - data types do not match",
            fix: "Change variable or value type to match definition"
          },
          "TS2339": {
            cause: "Property does not exist - property not found in type",
            fix: "Add property to interface or use type assertion"
          },
          "TS2322": {
            cause: "Type assignment error - cannot assign this type",
            fix: "Ensure types match or use type casting"
          },
          "TS2554": {
            cause: "Function arguments mismatch - incorrect number of arguments",
            fix: "Check required number and types of arguments"
          },
          "TS2571": {
            cause: "Object type unknown - object type is unknown",
            fix: "Add type annotation or use type guard"
          },
          "TS1192": {
            cause: "Module has no default export",
            fix: "Use import { name } instead of import name"
          }
        };
        const pattern = knownPatterns[error.code];
        if (pattern) {
          error.rootCause = pattern.cause;
          error.suggestedFix = pattern.fix;
        } else {
          error.rootCause = "Unknown TypeScript error - refer to documentation";
          error.suggestedFix = `Search for ${error.code} in TypeScript docs`;
        }
      }
      /**
       * Format error for terminal display
       */
      formatError(error) {
        const icon = error.severity === "error" ? "\u274C" : "\u26A0\uFE0F";
        const relPath = path4.relative(this.workspaceRoot, error.file);
        return `
${icon} ${error.severity.toUpperCase()} [${error.code}]
\u{1F4C1} File: ${relPath}
\u{1F4CD} Line: ${error.line}, Column: ${error.column}
\u{1F4AC} Error: ${error.message}

\u{1F50D} Root Cause:
   ${error.rootCause}

\u2705 Suggested Fix:
   ${error.suggestedFix}
${"\u2500".repeat(60)}
`;
      }
    };
    exports2.TSDetector = TSDetector2;
  }
});

// src/detector/eslint-detector.js
var require_eslint_detector = __commonJS({
  "src/detector/eslint-detector.js"(exports2) {
    "use strict";
    var __createBinding = exports2 && exports2.__createBinding || (Object.create ? (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    }) : (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    }));
    var __setModuleDefault = exports2 && exports2.__setModuleDefault || (Object.create ? (function(o, v) {
      Object.defineProperty(o, "default", { enumerable: true, value: v });
    }) : function(o, v) {
      o["default"] = v;
    });
    var __importStar = exports2 && exports2.__importStar || /* @__PURE__ */ (function() {
      var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function(o2) {
          var ar = [];
          for (var k in o2) if (Object.prototype.hasOwnProperty.call(o2, k)) ar[ar.length] = k;
          return ar;
        };
        return ownKeys(o);
      };
      return function(mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) {
          for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        }
        __setModuleDefault(result, mod);
        return result;
      };
    })();
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.ESLintDetector = void 0;
    var node_child_process_1 = require("child_process");
    var path4 = __importStar(require("path"));
    var ESLintDetector2 = class {
      workspaceRoot;
      constructor(workspaceRoot) {
        this.workspaceRoot = workspaceRoot;
      }
      /**
       * Detects all ESLint errors in the specified directory
       */
      async detect(targetDir) {
        const dir = targetDir || this.workspaceRoot;
        try {
          const output = (0, node_child_process_1.execSync)(`eslint . --format json`, {
            cwd: dir,
            stdio: "pipe",
            encoding: "utf8"
          });
          return this.parseESLintOutput(output);
        } catch (error) {
          const output = error.stdout?.toString() || "[]";
          return this.parseESLintOutput(output);
        }
      }
      /**
       * Parse JSON output from ESLint
       */
      parseESLintOutput(output) {
        const errors = [];
        try {
          const results = JSON.parse(output);
          for (const result of results) {
            const filePath = result.filePath;
            for (const message of result.messages) {
              const error = {
                file: filePath,
                line: message.line || 0,
                column: message.column || 0,
                message: message.message,
                ruleId: message.ruleId || "unknown",
                severity: message.severity,
                fixable: message.fix !== void 0
              };
              this.analyzeRootCause(error);
              errors.push(error);
            }
          }
        } catch (parseError) {
          console.error("Failed to parse ESLint output:", parseError);
        }
        return errors;
      }
      /**
       * Analyze root cause of the error
       */
      analyzeRootCause(error) {
        const knownRules = {
          "no-unused-vars": {
            cause: "Variable declared but not used",
            fix: "Delete the variable, use it, or prefix with _ if intentional"
          },
          "no-console": {
            cause: "Using console.log in code",
            fix: "Use a custom logger or remove console.log before production"
          },
          "@typescript-eslint/no-explicit-any": {
            cause: "Using any instead of specific type",
            fix: "Specify a precise type instead of any (e.g. string, number, object)"
          },
          "import/no-unresolved": {
            cause: "Import path not found",
            fix: "Verify path correctness and file existence"
          },
          "no-debugger": {
            cause: "Using debugger statement",
            fix: "Remove debugger before committing code"
          },
          "@typescript-eslint/no-unused-vars": {
            cause: "TypeScript variable not used",
            fix: "Delete the variable or use it"
          },
          "react/prop-types": {
            cause: "Component props without PropTypes definition",
            fix: "Add PropTypes or use TypeScript interfaces"
          },
          "react-hooks/exhaustive-deps": {
            cause: "useEffect dependencies incomplete",
            fix: "Add all used variables to dependency array"
          }
        };
        const rule = knownRules[error.ruleId];
        if (rule) {
          error.rootCause = rule.cause;
          error.suggestedFix = rule.fix;
        } else {
          error.rootCause = `ESLint rule: ${error.ruleId}`;
          error.suggestedFix = `Check ESLint docs for ${error.ruleId}`;
        }
      }
      /**
       * Format error for display
       */
      formatError(error) {
        const icon = error.severity === 2 ? "\u274C" : "\u26A0\uFE0F";
        const relPath = path4.relative(this.workspaceRoot, error.file);
        const fixableTag = error.fixable ? "\u{1F527} [Auto-fixable]" : "";
        return `
${icon} ${error.severity === 2 ? "ERROR" : "WARNING"} [${error.ruleId}] ${fixableTag}
\u{1F4C1} File: ${relPath}
\u{1F4CD} Line: ${error.line}, Column: ${error.column}
\u{1F4AC} Error: ${error.message}

\u{1F50D} Root Cause:
   ${error.rootCause}

\u2705 Suggested Fix:
   ${error.suggestedFix}
${"\u2500".repeat(60)}
`;
      }
      /**
       * Apply automatic fixes
       */
      async autoFix(targetDir) {
        const dir = targetDir || this.workspaceRoot;
        try {
          (0, node_child_process_1.execSync)(`eslint . --fix`, {
            cwd: dir,
            stdio: "inherit"
          });
          return { fixed: 0, failed: 0 };
        } catch (error) {
          console.error("Auto-fix failed:", error);
          return { fixed: 0, failed: 1 };
        }
      }
    };
    exports2.ESLintDetector = ESLintDetector2;
  }
});

// src/detector/import-detector.js
var require_import_detector = __commonJS({
  "src/detector/import-detector.js"(exports2) {
    "use strict";
    var __createBinding = exports2 && exports2.__createBinding || (Object.create ? (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    }) : (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    }));
    var __setModuleDefault = exports2 && exports2.__setModuleDefault || (Object.create ? (function(o, v) {
      Object.defineProperty(o, "default", { enumerable: true, value: v });
    }) : function(o, v) {
      o["default"] = v;
    });
    var __importStar = exports2 && exports2.__importStar || /* @__PURE__ */ (function() {
      var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function(o2) {
          var ar = [];
          for (var k in o2) if (Object.prototype.hasOwnProperty.call(o2, k)) ar[ar.length] = k;
          return ar;
        };
        return ownKeys(o);
      };
      return function(mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) {
          for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        }
        __setModuleDefault(result, mod);
        return result;
      };
    })();
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.ImportDetector = void 0;
    var fs4 = __importStar(require("fs"));
    var path4 = __importStar(require("path"));
    var glob_1 = require("glob");
    var ImportDetector2 = class {
      workspaceRoot;
      constructor(workspaceRoot) {
        this.workspaceRoot = workspaceRoot;
      }
      /**
       * Detects all import/export errors
       */
      async detect(targetDir) {
        const dir = targetDir || this.workspaceRoot;
        const errors = [];
        const files = await (0, glob_1.glob)("**/*.{ts,tsx,js,jsx,mjs,cjs}", {
          cwd: dir,
          ignore: [
            "node_modules/**",
            "dist/**",
            ".next/**",
            "out/**",
            "**/*.data.ts",
            // Mock/example data files
            "**/*.mock.ts",
            // Mock files
            "**/*.fixture.ts",
            // Test fixtures
            "**/examples/**",
            // Example code
            "**/showcase/**",
            // Showcase examples
            "**/demo/**"
            // Demo code
          ]
        });
        for (const file of files) {
          const filePath = path4.join(dir, file);
          const fileErrors = await this.checkFileImports(filePath);
          errors.push(...fileErrors);
        }
        return errors;
      }
      /**
       * Check imports in a single file
       */
      async checkFileImports(filePath) {
        const errors = [];
        const content = fs4.readFileSync(filePath, "utf8");
        const lines = content.split("\n");
        const importRegex = /import\s+(?:{[^}]+}|[\w*]+)?\s*(?:,\s*{[^}]+})?\s*from\s+['"]([^'"]+)['"]/g;
        const requireRegex = /require\(['"]([^'"]+)['"]\)/g;
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          const lineNumber = i + 1;
          const trimmedLine = line.trim();
          if (trimmedLine.startsWith("//") || trimmedLine.startsWith("*") || trimmedLine.startsWith("/*")) {
            continue;
          }
          let match;
          while ((match = importRegex.exec(line)) !== null) {
            const importPath = match[1];
            const error = await this.validateImport(filePath, lineNumber, line.trim(), importPath);
            if (error)
              errors.push(error);
          }
          while ((match = requireRegex.exec(line)) !== null) {
            const importPath = match[1];
            const error = await this.validateImport(filePath, lineNumber, line.trim(), importPath);
            if (error)
              errors.push(error);
          }
        }
        return errors;
      }
      /**
       * Validate import path
       */
      async validateImport(sourceFile, line, statement, importPath) {
        if (!importPath.startsWith(".") && !importPath.startsWith("/")) {
          return null;
        }
        const sourceDir = path4.dirname(sourceFile);
        let resolvedPath = path4.resolve(sourceDir, importPath);
        const extname = path4.extname(resolvedPath);
        if (extname === ".js" || extname === ".mjs" || extname === ".cjs") {
          resolvedPath = resolvedPath.slice(0, -extname.length);
        }
        const extensions = [".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".d.ts", ""];
        let exists = false;
        for (const ext of extensions) {
          const testPath = resolvedPath + ext;
          if (fs4.existsSync(testPath) && fs4.statSync(testPath).isFile()) {
            exists = true;
            break;
          }
        }
        if (!exists) {
          for (const ext of extensions) {
            const indexPath = path4.join(resolvedPath, `index${ext}`);
            if (fs4.existsSync(indexPath)) {
              exists = true;
              break;
            }
          }
        }
        if (!exists) {
          return {
            file: sourceFile,
            line,
            importStatement: statement,
            importedModule: importPath,
            issue: "not-found",
            rootCause: `Imported file not found: ${importPath}`,
            suggestedFix: `Verify path correctness or file exists at:
   ${resolvedPath}
   Try: ls ${path4.dirname(resolvedPath)}`
          };
        }
        return null;
      }
      /**
       * Detect circular dependencies
       */
      async detectCircularDeps(targetDir) {
        return [];
      }
      /**
       * Format error for display
       */
      formatError(error) {
        const relPath = path4.relative(this.workspaceRoot, error.file);
        return `
\u{1F517} IMPORT ERROR [${error.issue}]
\u{1F4C1} File: ${relPath}
\u{1F4CD} Line: ${error.line}
\u{1F4AC} Statement: ${error.importStatement}

\u{1F50D} Root Cause:
   ${error.rootCause}

\u2705 Suggested Fix:
   ${error.suggestedFix}
${"\u2500".repeat(60)}
`;
      }
    };
    exports2.ImportDetector = ImportDetector2;
  }
});

// src/detector/package-detector.js
var require_package_detector = __commonJS({
  "src/detector/package-detector.js"(exports2) {
    "use strict";
    var __createBinding = exports2 && exports2.__createBinding || (Object.create ? (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    }) : (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    }));
    var __setModuleDefault = exports2 && exports2.__setModuleDefault || (Object.create ? (function(o, v) {
      Object.defineProperty(o, "default", { enumerable: true, value: v });
    }) : function(o, v) {
      o["default"] = v;
    });
    var __importStar = exports2 && exports2.__importStar || /* @__PURE__ */ (function() {
      var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function(o2) {
          var ar = [];
          for (var k in o2) if (Object.prototype.hasOwnProperty.call(o2, k)) ar[ar.length] = k;
          return ar;
        };
        return ownKeys(o);
      };
      return function(mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) {
          for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        }
        __setModuleDefault(result, mod);
        return result;
      };
    })();
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.PackageDetector = void 0;
    var fs4 = __importStar(require("fs"));
    var path4 = __importStar(require("path"));
    var node_child_process_1 = require("child_process");
    var PackageDetector2 = class {
      workspaceRoot;
      constructor(workspaceRoot) {
        this.workspaceRoot = workspaceRoot;
      }
      /**
       * Detects all package.json errors in the project
       */
      async detect(targetDir) {
        const dir = targetDir || this.workspaceRoot;
        const errors = [];
        const packageJsonPaths = this.findPackageJsonFiles(dir);
        for (const pkgPath of packageJsonPaths) {
          const pkgErrors = await this.checkPackageJson(pkgPath);
          errors.push(...pkgErrors);
        }
        return errors;
      }
      /**
       * Find all package.json files in monorepo
       */
      findPackageJsonFiles(dir) {
        const paths = [];
        const mainPkgPath = path4.join(dir, "package.json");
        if (fs4.existsSync(mainPkgPath)) {
          paths.push(mainPkgPath);
        }
        const workspaceDirs = ["apps", "packages", "tools"];
        for (const wsDir of workspaceDirs) {
          const wsPath = path4.join(dir, wsDir);
          if (!fs4.existsSync(wsPath))
            continue;
          const entries = fs4.readdirSync(wsPath, { withFileTypes: true });
          for (const entry of entries) {
            if (entry.isDirectory()) {
              const pkgPath = path4.join(wsPath, entry.name, "package.json");
              if (fs4.existsSync(pkgPath)) {
                paths.push(pkgPath);
              }
            }
          }
        }
        return paths;
      }
      /**
       * Check a single package.json
       */
      async checkPackageJson(pkgPath) {
        const errors = [];
        let pkgJson;
        try {
          const content = fs4.readFileSync(pkgPath, "utf8");
          pkgJson = JSON.parse(content);
        } catch (err) {
          errors.push({
            type: "invalid-json",
            file: pkgPath,
            severity: "error",
            rootCause: `JSON syntax error: ${err.message}`,
            suggestedFix: `Check file using JSON validator or VSCode`
          });
          return errors;
        }
        const missingDeps = await this.checkMissingDependencies(pkgPath, pkgJson);
        errors.push(...missingDeps);
        const versionIssues = this.checkVersionConflicts(pkgPath, pkgJson);
        errors.push(...versionIssues);
        const peerIssues = await this.checkPeerDependencies(pkgPath, pkgJson);
        errors.push(...peerIssues);
        return errors;
      }
      /**
       * Check missing dependencies (not in node_modules)
       */
      async checkMissingDependencies(pkgPath, pkgJson) {
        const errors = [];
        const packageDir = path4.dirname(pkgPath);
        const nodeModules = path4.join(packageDir, "node_modules");
        if (!fs4.existsSync(nodeModules)) {
          return [{
            type: "missing-dependency",
            file: pkgPath,
            severity: "error",
            rootCause: "node_modules directory not found - Dependencies not installed",
            suggestedFix: `cd ${path4.dirname(pkgPath)} && pnpm install`
          }];
        }
        const allDeps = {
          ...pkgJson.dependencies,
          ...pkgJson.devDependencies
        };
        for (const depName of Object.keys(allDeps)) {
          const depPath = path4.join(nodeModules, depName);
          if (!fs4.existsSync(depPath)) {
            errors.push({
              type: "missing-dependency",
              packageName: depName,
              file: pkgPath,
              severity: "error",
              rootCause: `Package ${depName} defined in package.json but not installed in node_modules`,
              suggestedFix: `cd ${path4.dirname(pkgPath)} && pnpm install ${depName}`
            });
          }
        }
        return errors;
      }
      /**
       * Check version conflicts (e.g. same package with different versions)
       */
      checkVersionConflicts(pkgPath, pkgJson) {
        const errors = [];
        const deps = pkgJson.dependencies || {};
        const devDeps = pkgJson.devDependencies || {};
        for (const depName of Object.keys(deps)) {
          if (devDeps[depName]) {
            const depVersion = deps[depName];
            const devDepVersion = devDeps[depName];
            if (depVersion !== devDepVersion) {
              errors.push({
                type: "version-mismatch",
                packageName: depName,
                file: pkgPath,
                severity: "warning",
                rootCause: `Package ${depName} exists with two different versions:
   dependencies: ${depVersion}
   devDependencies: ${devDepVersion}`,
                suggestedFix: `Choose one version and update package.json manually`
              });
            }
          }
        }
        return errors;
      }
      /**
       * Check peer dependencies (compatibility issues)
       */
      async checkPeerDependencies(pkgPath, pkgJson) {
        const errors = [];
        const packageDir = path4.dirname(pkgPath);
        try {
          (0, node_child_process_1.execSync)("pnpm install --dry-run", {
            cwd: packageDir,
            stdio: "pipe",
            encoding: "utf8"
          });
        } catch (err) {
          const output = err.stderr || err.stdout || "";
          const peerRegex = /WARN.*peer\s+dependency.*@?([\w\-@/]+).*requires\s+([\w\-@/]+)@([\d.^~>=<*]+)/gi;
          let match;
          while ((match = peerRegex.exec(output)) !== null) {
            const [, parentPkg, requiredPkg, requiredVersion] = match;
            errors.push({
              type: "peer-conflict",
              packageName: requiredPkg,
              file: pkgPath,
              severity: "warning",
              rootCause: `Package ${parentPkg} requires peer dependency:
   ${requiredPkg}@${requiredVersion}`,
              suggestedFix: `pnpm add ${requiredPkg}@${requiredVersion} -D`,
              details: match[0]
            });
          }
        }
        return errors;
      }
      /**
       * Format error for display
       */
      formatError(error) {
        const relPath = path4.relative(this.workspaceRoot, error.file);
        const emoji = error.severity === "error" ? "\u274C" : "\u26A0\uFE0F";
        const typeLabel = {
          "missing-dependency": "MISSING DEPENDENCY",
          "version-mismatch": "VERSION CONFLICT",
          "peer-conflict": "MISSING PEER DEPENDENCY",
          "invalid-json": "INVALID JSON",
          "unused-dependency": "UNUSED DEPENDENCY"
        }[error.type];
        return `
${emoji} PACKAGE ERROR [${typeLabel}]
\u{1F4E6} Package: ${error.packageName || "N/A"}
\u{1F4C1} File: ${relPath}
\u{1F50D} Root Cause:
   ${error.rootCause}

\u2705 Suggested Fix:
   ${error.suggestedFix}
${error.details ? `
\u{1F4CB} Details:
   ${error.details}` : ""}
${"\u2500".repeat(60)}
`;
      }
    };
    exports2.PackageDetector = PackageDetector2;
  }
});

// src/detector/runtime-detector.js
var require_runtime_detector = __commonJS({
  "src/detector/runtime-detector.js"(exports2) {
    "use strict";
    var __createBinding = exports2 && exports2.__createBinding || (Object.create ? (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    }) : (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    }));
    var __setModuleDefault = exports2 && exports2.__setModuleDefault || (Object.create ? (function(o, v) {
      Object.defineProperty(o, "default", { enumerable: true, value: v });
    }) : function(o, v) {
      o["default"] = v;
    });
    var __importStar = exports2 && exports2.__importStar || /* @__PURE__ */ (function() {
      var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function(o2) {
          var ar = [];
          for (var k in o2) if (Object.prototype.hasOwnProperty.call(o2, k)) ar[ar.length] = k;
          return ar;
        };
        return ownKeys(o);
      };
      return function(mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) {
          for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        }
        __setModuleDefault(result, mod);
        return result;
      };
    })();
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.RuntimeDetector = void 0;
    var fs4 = __importStar(require("fs"));
    var path4 = __importStar(require("path"));
    var glob_1 = require("glob");
    var RuntimeDetector2 = class {
      workspaceRoot;
      constructor(workspaceRoot) {
        this.workspaceRoot = workspaceRoot;
      }
      /**
       * Detects runtime errors from log files
       */
      async detect(targetDir) {
        const dir = targetDir || this.workspaceRoot;
        const errors = [];
        const logPatterns = [
          ".odavl/logs/**/*.log",
          ".next/**/*.log",
          "logs/**/*.log",
          "*.log"
        ];
        for (const pattern of logPatterns) {
          const logFiles = await (0, glob_1.glob)(pattern, {
            cwd: dir,
            ignore: ["node_modules/**", "dist/**"]
          });
          for (const logFile of logFiles) {
            const logPath = path4.join(dir, logFile);
            const logErrors = await this.parseLogFile(logPath);
            errors.push(...logErrors);
          }
        }
        const codeErrors = await this.scanCodeForRuntimeIssues(dir);
        errors.push(...codeErrors);
        const memoryLeakErrors = await this.detectMemoryLeaks(dir);
        errors.push(...memoryLeakErrors);
        const raceConditionErrors = await this.detectRaceConditions(dir);
        errors.push(...raceConditionErrors);
        const resourceErrors = await this.detectResourceCleanupIssues(dir);
        errors.push(...resourceErrors);
        return errors;
      }
      /**
       * Detect memory leaks: event listeners, intervals, timeouts without cleanup
       * Phase 3 Enhancement
       */
      async detectMemoryLeaks(dir) {
        const errors = [];
        const files = await (0, glob_1.glob)("**/*.{ts,tsx,js,jsx}", {
          cwd: dir,
          ignore: [
            "node_modules/**",
            "dist/**",
            ".next/**",
            "**/*.test.{ts,tsx,js,jsx}",
            "**/*.spec.{ts,tsx,js,jsx}",
            "**/tests/**",
            "**/__tests__/**"
          ]
        });
        for (const file of files) {
          const filePath = path4.join(dir, file);
          const content = fs4.readFileSync(filePath, "utf8");
          const lines = content.split("\n");
          for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            if (/addEventListener\s*\(/.test(line)) {
              const nextLines = lines.slice(i, Math.min(i + 30, lines.length)).join("\n");
              const hasRemove = nextLines.includes("removeEventListener");
              const hasCleanup = nextLines.includes("return () =>") || nextLines.includes("cleanup");
              if (!hasRemove && !hasCleanup) {
                errors.push({
                  timestamp: (/* @__PURE__ */ new Date()).toISOString(),
                  file: filePath,
                  line: i + 1,
                  errorType: "event-listener-leak",
                  message: "addEventListener without corresponding removeEventListener",
                  rootCause: "Event listeners not cleaned up can cause memory leaks, especially in SPAs",
                  suggestedFix: `Add cleanup in useEffect or component lifecycle:
useEffect(() => {
  const handler = () => { /* ... */ };
  element.addEventListener('event', handler);
  
  return () => {
    element.removeEventListener('event', handler);
  };
}, []);`,
                  severity: "high"
                });
              }
            }
            if (/setInterval\s*\(/.test(line)) {
              const nextLines = lines.slice(i, Math.min(i + 30, lines.length)).join("\n");
              const hasClear = nextLines.includes("clearInterval");
              const hasCleanup = nextLines.includes("return () =>");
              if (!hasClear && !hasCleanup) {
                errors.push({
                  timestamp: (/* @__PURE__ */ new Date()).toISOString(),
                  file: filePath,
                  line: i + 1,
                  errorType: "interval-leak",
                  message: "setInterval without clearInterval",
                  rootCause: "Intervals continue running even after component unmount, causing memory leaks",
                  suggestedFix: `Store interval ID and clear it:
useEffect(() => {
  const intervalId = setInterval(() => {
    // your code
  }, 1000);
  
  return () => clearInterval(intervalId);
}, []);`,
                  severity: "high"
                });
              }
            }
            if (/setTimeout\s*\(/.test(line)) {
              const timeoutMatch = /setTimeout\s*\([^,]+,\s*(\d+)/.exec(line);
              if (timeoutMatch) {
                const timeout = Number.parseInt(timeoutMatch[1], 10);
                if (timeout > 5e3) {
                  const nextLines = lines.slice(i, Math.min(i + 30, lines.length)).join("\n");
                  const hasClear = nextLines.includes("clearTimeout");
                  const hasCleanup = nextLines.includes("return () =>");
                  if (!hasClear && !hasCleanup) {
                    errors.push({
                      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
                      file: filePath,
                      line: i + 1,
                      errorType: "timeout-leak",
                      message: `Long setTimeout (${timeout}ms) without cleanup`,
                      rootCause: "Long timeouts should be cleared on unmount to prevent callbacks on unmounted components",
                      suggestedFix: `Store timeout ID and clear it:
useEffect(() => {
  const timeoutId = setTimeout(() => {
    // your code
  }, ${timeout});
  
  return () => clearTimeout(timeoutId);
}, []);`,
                      severity: "medium"
                    });
                  }
                }
              }
            }
          }
          if (content.includes("class ") && content.includes("Component")) {
            const hasWillUnmount = content.includes("componentWillUnmount");
            const hasListeners = content.includes("addEventListener") || content.includes("setInterval") || content.includes("setTimeout");
            if (hasListeners && !hasWillUnmount) {
              const classLine = lines.findIndex((line) => /class\s+\w+\s+extends/.test(line));
              if (classLine !== -1) {
                errors.push({
                  timestamp: (/* @__PURE__ */ new Date()).toISOString(),
                  file: filePath,
                  line: classLine + 1,
                  errorType: "memory-leak",
                  message: "Class component with listeners but no componentWillUnmount",
                  rootCause: "Listeners/intervals/timeouts must be cleaned up in componentWillUnmount",
                  suggestedFix: `Add componentWillUnmount lifecycle method:
componentWillUnmount() {
  // Clear all listeners, intervals, timeouts
  if (this.intervalId) clearInterval(this.intervalId);
  if (this.timeoutId) clearTimeout(this.timeoutId);
  element.removeEventListener('event', this.handler);
}`,
                  severity: "high"
                });
              }
            }
          }
        }
        return errors;
      }
      /**
       * Detect race conditions in async operations
       * Phase 3 Enhancement
       */
      async detectRaceConditions(dir) {
        const errors = [];
        const files = await (0, glob_1.glob)("**/*.{ts,tsx,js,jsx}", {
          cwd: dir,
          ignore: [
            "node_modules/**",
            "dist/**",
            ".next/**",
            "**/*.test.{ts,tsx,js,jsx}",
            "**/*.spec.{ts,tsx,js,jsx}",
            "**/tests/**",
            "**/__tests__/**"
          ]
        });
        for (const file of files) {
          const filePath = path4.join(dir, file);
          const content = fs4.readFileSync(filePath, "utf8");
          const lines = content.split("\n");
          for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            if (/setState|setIsLoading|setData|setError/.test(line)) {
              const prevLines = lines.slice(Math.max(0, i - 10), i).join("\n");
              const nextLines = lines.slice(i, Math.min(i + 5, lines.length)).join("\n");
              if (prevLines.includes("await ")) {
                const functionContent = lines.slice(Math.max(0, i - 30), Math.min(i + 10, lines.length)).join("\n");
                const hasMountedCheck = functionContent.includes("isMounted") || functionContent.includes("isSubscribed") || functionContent.includes("AbortController");
                if (!hasMountedCheck && functionContent.includes("useEffect")) {
                  errors.push({
                    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
                    file: filePath,
                    line: i + 1,
                    errorType: "race-condition",
                    message: "setState after async operation without mount check",
                    rootCause: `Component may unmount before async operation completes, causing "Can't perform state update on unmounted component" warning`,
                    suggestedFix: `Use AbortController or isMounted flag:
// Option 1: AbortController (recommended)
useEffect(() => {
  const controller = new AbortController();
  
  async function fetchData() {
    try {
      const response = await fetch(url, { signal: controller.signal });
      const data = await response.json();
      setData(data);
    } catch (error) {
      if (error.name !== 'AbortError') {
        setError(error);
      }
    }
  }
  
  fetchData();
  return () => controller.abort();
}, [url]);

// Option 2: isMounted flag
useEffect(() => {
  let isMounted = true;
  
  async function fetchData() {
    const data = await fetch(url);
    if (isMounted) {
      setData(data);
    }
  }
  
  fetchData();
  return () => { isMounted = false; };
}, [url]);`,
                    severity: "medium"
                  });
                }
              }
            }
            if (/let\s+\w+\s*=/.test(line) && lines.slice(i, Math.min(i + 20, lines.length)).join("\n").includes("await")) {
              const nextLines = lines.slice(i, Math.min(i + 20, lines.length)).join("\n");
              const hasMultipleAwaits = (nextLines.match(/await\s+/g) || []).length > 1;
              if (hasMultipleAwaits) {
                const varMatch = /let\s+(\w+)\s*=/.exec(line);
                if (varMatch) {
                  const varName = varMatch[1];
                  const varUsageCount = (nextLines.match(new RegExp(`\\b${varName}\\b`, "g")) || []).length;
                  if (varUsageCount > 2) {
                    errors.push({
                      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
                      file: filePath,
                      line: i + 1,
                      errorType: "race-condition",
                      message: `Potential race condition: variable '${varName}' modified in multiple async operations`,
                      rootCause: "Shared mutable state accessed by multiple async operations can lead to race conditions",
                      suggestedFix: `Use const for immutable state or synchronize access:
// Option 1: Immutable updates
const results = [];
const result1 = await operation1();
const result2 = await operation2();
results.push(result1, result2);

// Option 2: Sequential operations
const result1 = await operation1();
const result2 = await operation2(result1);

// Option 3: Mutex/lock (advanced)
const mutex = new Mutex();
await mutex.runExclusive(async () => {
  // synchronized access
});`,
                      severity: "low"
                    });
                  }
                }
              }
            }
          }
        }
        return errors;
      }
      /**
       * Detect resource cleanup issues
       * Phase 3 Enhancement
       */
      async detectResourceCleanupIssues(dir) {
        const errors = [];
        const files = await (0, glob_1.glob)("**/*.{ts,tsx,js,jsx}", {
          cwd: dir,
          ignore: [
            "node_modules/**",
            "dist/**",
            ".next/**",
            "**/*.test.{ts,tsx,js,jsx}",
            "**/*.spec.{ts,tsx,js,jsx}",
            "**/tests/**",
            "**/__tests__/**"
          ]
        });
        for (const file of files) {
          const filePath = path4.join(dir, file);
          const content = fs4.readFileSync(filePath, "utf8");
          const lines = content.split("\n");
          for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            if (/new\s+WebSocket\s*\(/.test(line)) {
              const nextLines = lines.slice(i, Math.min(i + 50, lines.length)).join("\n");
              const hasClose = nextLines.includes(".close()");
              const hasCleanup = nextLines.includes("return () =>");
              if (!hasClose && !hasCleanup) {
                errors.push({
                  timestamp: (/* @__PURE__ */ new Date()).toISOString(),
                  file: filePath,
                  line: i + 1,
                  errorType: "websocket-leak",
                  message: "WebSocket created without cleanup",
                  rootCause: "WebSocket connections must be closed to free resources",
                  suggestedFix: `Close WebSocket on cleanup:
useEffect(() => {
  const ws = new WebSocket(url);
  
  ws.onmessage = (event) => {
    // handle message
  };
  
  return () => {
    ws.close();
  };
}, [url]);`,
                  severity: "high"
                });
              }
            }
            if (/createConnection|connect\(|pool\.query/.test(line)) {
              const nextLines = lines.slice(i, Math.min(i + 30, lines.length)).join("\n");
              const hasClose = nextLines.includes(".close()") || nextLines.includes(".end()") || nextLines.includes(".release()");
              if (!hasClose && !nextLines.includes("finally")) {
                errors.push({
                  timestamp: (/* @__PURE__ */ new Date()).toISOString(),
                  file: filePath,
                  line: i + 1,
                  errorType: "db-connection-leak",
                  message: "Database connection without cleanup",
                  rootCause: "Database connections must be closed/released to prevent connection pool exhaustion",
                  suggestedFix: `Close connection in finally block:
let connection;
try {
  connection = await pool.connect();
  const result = await connection.query('...');
  return result;
} catch (error) {
  console.error('DB error:', error);
  throw error;
} finally {
  if (connection) {
    connection.release(); // or .close() or .end()
  }
}`,
                  severity: "critical"
                });
              }
            }
            if (/fs\.(createReadStream|createWriteStream|open)\s*\(/.test(line)) {
              const nextLines = lines.slice(i, Math.min(i + 30, lines.length)).join("\n");
              const hasClose = nextLines.includes(".close()") || nextLines.includes(".end()") || nextLines.includes(".destroy()");
              if (!hasClose && !nextLines.includes("pipeline")) {
                errors.push({
                  timestamp: (/* @__PURE__ */ new Date()).toISOString(),
                  file: filePath,
                  line: i + 1,
                  errorType: "resource-not-cleaned",
                  message: "File stream without cleanup",
                  rootCause: "File handles must be closed to prevent resource leaks",
                  suggestedFix: `Close stream or use pipeline:
// Option 1: Manual close
const stream = fs.createReadStream(path);
stream.on('end', () => stream.close());
stream.on('error', () => stream.close());

// Option 2: Use pipeline (recommended)
const { pipeline } = require('stream/promises');
await pipeline(
  fs.createReadStream(inputPath),
  transformStream,
  fs.createWriteStream(outputPath)
);`,
                  severity: "high"
                });
              }
            }
          }
        }
        return errors;
      }
      /**
       * Parse log file and extract errors
       */
      async parseLogFile(logPath) {
        const errors = [];
        if (!fs4.existsSync(logPath))
          return errors;
        const content = fs4.readFileSync(logPath, "utf8");
        const lines = content.split("\n");
        const patterns = [
          {
            regex: /UnhandledPromiseRejectionWarning:\s*(.+)/i,
            type: "unhandled-promise",
            severity: "high"
          },
          {
            regex: /Uncaught\s+(?:Error|Exception):\s*(.+)/i,
            type: "uncaught-exception",
            severity: "critical"
          },
          {
            regex: /FATAL ERROR:\s*(.+)/i,
            type: "crash",
            severity: "critical"
          },
          {
            regex: /AssertionError\s*:\s*(.+)/i,
            type: "assertion-failure",
            severity: "high"
          },
          {
            regex: /ENOMEM|Out of memory|JavaScript heap out of memory/i,
            type: "memory-error",
            severity: "critical"
          }
        ];
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          for (const pattern of patterns) {
            const match = line.match(pattern.regex);
            if (match) {
              const stackLines = [];
              for (let j = i + 1; j < Math.min(i + 10, lines.length); j++) {
                if (lines[j].trim().startsWith("at ")) {
                  stackLines.push(lines[j].trim());
                } else if (stackLines.length > 0) {
                  break;
                }
              }
              let errorFile = logPath;
              let errorLine;
              if (stackLines.length > 0) {
                const fileMatch = stackLines[0].match(/\(([^:]+):(\d+):\d+\)/);
                if (fileMatch) {
                  errorFile = fileMatch[1];
                  errorLine = parseInt(fileMatch[2], 10);
                }
              }
              const error = {
                timestamp: this.extractTimestamp(line) || (/* @__PURE__ */ new Date()).toISOString(),
                file: errorFile,
                line: errorLine,
                errorType: pattern.type,
                message: match[1] || line,
                stack: stackLines.join("\n"),
                rootCause: this.getRootCause(pattern.type, match[1] || line),
                suggestedFix: this.getSuggestedFix(pattern.type, errorFile),
                severity: pattern.severity
              };
              errors.push(error);
            }
          }
        }
        return errors;
      }
      /**
       * Extract timestamp from log line
       */
      extractTimestamp(line) {
        const isoMatch = line.match(/(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z)/);
        if (isoMatch)
          return isoMatch[1];
        const bracketMatch = line.match(/\[(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2})\]/);
        if (bracketMatch)
          return bracketMatch[1];
        return null;
      }
      /**
       * Scan code to detect potential runtime issues
       */
      async scanCodeForRuntimeIssues(dir) {
        const errors = [];
        const files = await (0, glob_1.glob)("**/*.{ts,tsx,js,jsx}", {
          cwd: dir,
          ignore: [
            "node_modules/**",
            "dist/**",
            ".next/**",
            "**/*.test.{ts,tsx,js,jsx}",
            "**/*.spec.{ts,tsx,js,jsx}",
            "**/tests/**",
            "**/__tests__/**"
          ]
        });
        for (const file of files) {
          const filePath = path4.join(dir, file);
          const content = fs4.readFileSync(filePath, "utf8");
          const criticalAsyncIssues = this.findCriticalAsyncIssues(content, filePath);
          errors.push(...criticalAsyncIssues);
        }
        return errors;
      }
      /**
       * Find critical async issues (top-level or exported async without error handling)
       */
      findCriticalAsyncIssues(content, filePath) {
        const errors = [];
        const lines = content.split("\n");
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          if (this.isInTryBlock(lines, i) || line.includes(".catch(")) {
            continue;
          }
          if (/^\s*\(async\s*\(/.test(line) || /^\s*async\s+function\s+\w+\s*\(\).*\{/.test(line)) {
            const nextLines = lines.slice(i, Math.min(i + 10, lines.length)).join("\n");
            if (!nextLines.includes("try") && !nextLines.includes(".catch(")) {
              if (filePath.includes("index.ts") || filePath.includes("main.ts")) {
                errors.push({
                  timestamp: (/* @__PURE__ */ new Date()).toISOString(),
                  file: filePath,
                  line: i + 1,
                  errorType: "unhandled-promise",
                  message: "Top-level async without error handling",
                  rootCause: "Top-level async execution without try/catch or .catch()",
                  suggestedFix: `Wrap in try/catch or add .catch():
   (async () => {
     try {
       await yourAsyncOperation();
     } catch (err) {
       console.error('Error:', err);
       process.exit(1);
     }
   })();`,
                  severity: "medium"
                });
              }
            }
          }
        }
        return errors;
      }
      /**
       * Check if a line is inside a try block
       */
      isInTryBlock(lines, lineIndex) {
        let openBraces = 0;
        let inTry = false;
        for (let i = lineIndex; i >= 0; i--) {
          const line = lines[i];
          if (line.includes("}")) {
            openBraces++;
          }
          if (line.includes("{")) {
            openBraces--;
            if (openBraces < 0 && /try\s*\{/.test(line)) {
              inTry = true;
              break;
            }
          }
        }
        return inTry;
      }
      /**
       * Check if async function is without error handling (legacy - deprecated)
       */
      hasAsyncWithoutTryCatch(content) {
        return false;
      }
      /**
       * Get root cause based on error type
       */
      getRootCause(errorType, message) {
        const causes = {
          "unhandled-promise": "Promise rejected without catch handler - async operation failed without error handling",
          "uncaught-exception": "Exception occurred without catch - programming error not handled in try/catch",
          "crash": "Application stopped abruptly - fatal error (FATAL ERROR)",
          "assertion-failure": "Assertion failed - expected value not met at runtime",
          "memory-error": "Out of memory - application consuming more memory than available",
          "memory-leak": "Memory leak detected - resources not properly cleaned up",
          "event-listener-leak": "Event listener not removed - causing memory leak",
          "interval-leak": "setInterval without clearInterval - timer keeps running",
          "timeout-leak": "setTimeout without clearTimeout - delayed callback on unmounted component",
          "race-condition": "Race condition - async operations not synchronized",
          "resource-not-cleaned": "Resource (file/stream) not properly closed",
          "websocket-leak": "WebSocket connection not closed",
          "db-connection-leak": "Database connection not released back to pool"
        };
        return causes[errorType] || message;
      }
      /**
       * Suggest fix based on error type
       */
      getSuggestedFix(errorType, file) {
        const fixes = {
          "unhandled-promise": `Add .catch() handler or use try/catch:
   await somePromise().catch(err => console.error(err));
   Or check file: ${file}`,
          "uncaught-exception": `Add try/catch block around the code:
   try {
     // your code
   } catch (err) {
     console.error('Error:', err);
   }`,
          "crash": `Check logs in detail to determine cause - could be:
   - type error
   - null/undefined access
   - infinite recursion`,
          "assertion-failure": `Check assertions in code - unexpected value:
   Check file: ${file}`,
          "memory-error": `Reduce memory consumption:
   - Check for memory leaks (closures, event listeners)
   - Increase heap size: node --max-old-space-size=4096
   - Use streaming instead of loading all data`,
          "memory-leak": `Review resource cleanup in ${file} - add proper cleanup in useEffect return or componentWillUnmount`,
          "event-listener-leak": `Add removeEventListener in cleanup function`,
          "interval-leak": `Store interval ID and call clearInterval in cleanup`,
          "timeout-leak": `Store timeout ID and call clearTimeout in cleanup`,
          "race-condition": `Use AbortController or isMounted flag to prevent state updates after unmount`,
          "resource-not-cleaned": `Close file streams/handles in finally block or use pipeline`,
          "websocket-leak": `Call ws.close() in useEffect cleanup function`,
          "db-connection-leak": `Release connection in finally block: connection.release()`
        };
        return fixes[errorType] || "Check code and logs";
      }
      /**
       * Format error for display
       */
      formatError(error) {
        const relPath = path4.relative(this.workspaceRoot, error.file);
        let emoji = "\u26A0\uFE0F";
        if (error.severity === "critical")
          emoji = "\u{1F4A5}";
        else if (error.severity === "high")
          emoji = "\u{1F525}";
        else if (error.severity === "low")
          emoji = "\u2139\uFE0F";
        return `
${emoji} RUNTIME ERROR [${error.errorType}] [${error.severity.toUpperCase()}]
\u23F0 Time: ${error.timestamp}
\u{1F4C1} File: ${relPath}
${error.line ? `\u{1F4CD} Line: ${error.line}` : ""}
\u{1F4AC} Message: ${error.message}

\u{1F50D} Root Cause:
   ${error.rootCause}

\u2705 Suggested Fix:
   ${error.suggestedFix}
${error.stack ? `
\u{1F4CB} Stack Trace:
${error.stack}` : ""}
${"\u2500".repeat(60)}
`;
      }
    };
    exports2.RuntimeDetector = RuntimeDetector2;
  }
});

// src/detector/build-detector.js
var require_build_detector = __commonJS({
  "src/detector/build-detector.js"(exports2) {
    "use strict";
    var __createBinding = exports2 && exports2.__createBinding || (Object.create ? (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    }) : (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    }));
    var __setModuleDefault = exports2 && exports2.__setModuleDefault || (Object.create ? (function(o, v) {
      Object.defineProperty(o, "default", { enumerable: true, value: v });
    }) : function(o, v) {
      o["default"] = v;
    });
    var __importStar = exports2 && exports2.__importStar || /* @__PURE__ */ (function() {
      var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function(o2) {
          var ar = [];
          for (var k in o2) if (Object.prototype.hasOwnProperty.call(o2, k)) ar[ar.length] = k;
          return ar;
        };
        return ownKeys(o);
      };
      return function(mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) {
          for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        }
        __setModuleDefault(result, mod);
        return result;
      };
    })();
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.BuildDetector = void 0;
    var fs4 = __importStar(require("fs"));
    var path4 = __importStar(require("path"));
    var node_child_process_1 = require("child_process");
    var BuildDetector2 = class {
      workspaceRoot;
      constructor(workspaceRoot) {
        this.workspaceRoot = workspaceRoot;
      }
      /**
       * Detects build errors
       */
      async detect(targetDir) {
        const dir = targetDir || this.workspaceRoot;
        const errors = [];
        const pkgPath = path4.join(dir, "package.json");
        if (!fs4.existsSync(pkgPath)) {
          return [{
            type: "generic",
            message: "package.json not found",
            rootCause: "No package.json file found in directory",
            suggestedFix: "Ensure you are in the correct project directory",
            severity: "error"
          }];
        }
        const pkgJson = JSON.parse(fs4.readFileSync(pkgPath, "utf8"));
        const buildTool = this.detectBuildTool(pkgJson);
        try {
          const buildOutput = await this.runBuild(dir, buildTool);
          const buildErrors = this.parseBuildOutput(buildOutput, buildTool, false);
          errors.push(...buildErrors);
        } catch (err) {
          const output = err.stderr || err.stdout || err.message || "";
          const buildErrors = this.parseBuildOutput(output, buildTool, true);
          errors.push(...buildErrors);
        }
        return errors;
      }
      /**
       * Detect build tool from package.json
       */
      detectBuildTool(pkgJson) {
        const scripts = pkgJson.scripts || {};
        const deps = { ...pkgJson.dependencies, ...pkgJson.devDependencies };
        if (deps.next || scripts.build?.includes("next"))
          return "next";
        if (deps.vite || scripts.build?.includes("vite"))
          return "vite";
        if (deps.webpack || scripts.build?.includes("webpack"))
          return "webpack";
        if (deps.rollup || scripts.build?.includes("rollup"))
          return "rollup";
        if (deps.esbuild || scripts.build?.includes("esbuild"))
          return "esbuild";
        if (scripts.build?.includes("tsc"))
          return "tsc";
        return "generic";
      }
      /**
       * Run build command
       */
      async runBuild(dir, buildTool) {
        const commands = {
          next: "pnpm run build",
          vite: "pnpm run build",
          webpack: "pnpm run build",
          rollup: "pnpm run build",
          esbuild: "pnpm run build",
          tsc: "pnpm exec tsc --noEmit",
          generic: "pnpm run build"
        };
        const cmd = commands[buildTool];
        try {
          const output = (0, node_child_process_1.execSync)(cmd, {
            cwd: dir,
            stdio: "pipe",
            encoding: "utf8",
            timeout: 6e4
            // 1 minute timeout
          });
          return output;
        } catch (err) {
          throw err;
        }
      }
      /**
       * Parse build output and extract errors
       * @param output - Build command output
       * @param buildTool - Detected build tool type
       * @param buildFailed - Whether the build command failed (exited with error)
       */
      parseBuildOutput(output, buildTool, buildFailed) {
        const errors = [];
        const patterns = [
          // Webpack errors
          {
            regex: /ERROR in (.+)\n\s*Module not found: Error: Can't resolve '(.+)'/g,
            type: "webpack",
            extract: (match) => ({
              file: match[1],
              message: `Module not found: ${match[2]}`,
              rootCause: `Webpack couldn't find module: ${match[2]}`,
              suggestedFix: `Verify file exists or install package:
   pnpm add ${match[2]}`
            })
          },
          // Vite errors
          {
            regex: /(\[vite\]|×) (.+?)\n.*?at (.+):(\d+):\d+/gs,
            type: "vite",
            extract: (match) => ({
              file: match[3],
              line: Number.parseInt(match[4], 10),
              message: match[2],
              rootCause: `Vite error: ${match[2]}`,
              suggestedFix: `Check file ${match[3]} line ${match[4]}`
            })
          },
          // Next.js errors
          {
            regex: /Error: (.+?)\n.*?> (\d+) \| (.+)/gs,
            type: "next",
            extract: (match) => ({
              line: Number.parseInt(match[2], 10),
              message: match[1],
              rootCause: `Next.js build error: ${match[1]}`,
              suggestedFix: "Check Next.js documentation"
            })
          },
          // Generic module errors
          {
            regex: /Cannot find module ['"](.+?)['"]/g,
            type: buildTool,
            extract: (match) => ({
              message: `Cannot find module: ${match[1]}`,
              rootCause: `Module not found: ${match[1]}`,
              suggestedFix: `pnpm add ${match[1]}`
            })
          },
          // Syntax errors
          {
            regex: /SyntaxError: (.+)\n.*?at (.+):(\d+):(\d+)/g,
            type: buildTool,
            extract: (match) => ({
              file: match[2],
              line: Number.parseInt(match[3], 10),
              message: `SyntaxError: ${match[1]}`,
              rootCause: `Syntax error: ${match[1]}`,
              suggestedFix: `Check file ${match[2]} line ${match[3]}`
            })
          }
        ];
        for (const pattern of patterns) {
          let match;
          while ((match = pattern.regex.exec(output)) !== null) {
            const extracted = pattern.extract(match);
            errors.push({
              type: pattern.type,
              file: extracted.file,
              line: extracted.line,
              message: extracted.message || "Unknown error",
              rootCause: extracted.rootCause || "Unknown cause",
              suggestedFix: extracted.suggestedFix || "No suggestion available",
              severity: "error"
            });
          }
        }
        if (buildFailed && errors.length === 0 && output.toLowerCase().includes("error")) {
          errors.push({
            type: buildTool,
            message: "Build failed",
            rootCause: "Build failed - review full output",
            suggestedFix: "Run build command manually and review details:\n   pnpm run build",
            severity: "error"
          });
        }
        return errors;
      }
      /**
       * Format error for display
       */
      formatError(error) {
        const relPath = error.file ? path4.relative(this.workspaceRoot, error.file) : "N/A";
        return `
\u{1F3D7}\uFE0F  BUILD ERROR [${error.type.toUpperCase()}]
\u{1F4C1} File: ${relPath}
${error.line ? `\u{1F4CD} Line: ${error.line}` : ""}
\u{1F4AC} Message: ${error.message}

\u{1F50D} Root Cause:
   ${error.rootCause}

\u2705 Suggested Fix:
   ${error.suggestedFix}
${"\u2500".repeat(60)}
`;
      }
    };
    exports2.BuildDetector = BuildDetector2;
  }
});

// src/detector/security-detector.js
var require_security_detector = __commonJS({
  "src/detector/security-detector.js"(exports2) {
    "use strict";
    var __createBinding = exports2 && exports2.__createBinding || (Object.create ? (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    }) : (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    }));
    var __setModuleDefault = exports2 && exports2.__setModuleDefault || (Object.create ? (function(o, v) {
      Object.defineProperty(o, "default", { enumerable: true, value: v });
    }) : function(o, v) {
      o["default"] = v;
    });
    var __importStar = exports2 && exports2.__importStar || /* @__PURE__ */ (function() {
      var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function(o2) {
          var ar = [];
          for (var k in o2) if (Object.prototype.hasOwnProperty.call(o2, k)) ar[ar.length] = k;
          return ar;
        };
        return ownKeys(o);
      };
      return function(mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) {
          for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        }
        __setModuleDefault(result, mod);
        return result;
      };
    })();
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.SecurityDetector = exports2.SecurityErrorType = void 0;
    var node_child_process_1 = require("child_process");
    var fs4 = __importStar(require("fs"));
    var path4 = __importStar(require("path"));
    var glob_1 = require("glob");
    var SecurityErrorType;
    (function(SecurityErrorType2) {
      SecurityErrorType2["CVE"] = "CVE";
      SecurityErrorType2["OUTDATED_DEPENDENCY"] = "OUTDATED_DEPENDENCY";
      SecurityErrorType2["HARDCODED_SECRET"] = "HARDCODED_SECRET";
      SecurityErrorType2["HARDCODED_PASSWORD"] = "HARDCODED_PASSWORD";
      SecurityErrorType2["API_KEY_EXPOSED"] = "API_KEY_EXPOSED";
      SecurityErrorType2["JWT_TOKEN_EXPOSED"] = "JWT_TOKEN_EXPOSED";
      SecurityErrorType2["PRIVATE_KEY_EXPOSED"] = "PRIVATE_KEY_EXPOSED";
      SecurityErrorType2["SQL_INJECTION"] = "SQL_INJECTION";
      SecurityErrorType2["COMMAND_INJECTION"] = "COMMAND_INJECTION";
      SecurityErrorType2["CODE_INJECTION"] = "CODE_INJECTION";
      SecurityErrorType2["XSS_VULNERABILITY"] = "XSS_VULNERABILITY";
      SecurityErrorType2["PATH_TRAVERSAL"] = "PATH_TRAVERSAL";
      SecurityErrorType2["WEAK_CRYPTO"] = "WEAK_CRYPTO";
      SecurityErrorType2["INSECURE_RANDOM"] = "INSECURE_RANDOM";
      SecurityErrorType2["WEAK_HASH"] = "WEAK_HASH";
      SecurityErrorType2["UNSAFE_EVAL"] = "UNSAFE_EVAL";
      SecurityErrorType2["INSECURE_DESERIALIZATION"] = "INSECURE_DESERIALIZATION";
      SecurityErrorType2["MISSING_CSRF_PROTECTION"] = "MISSING_CSRF_PROTECTION";
      SecurityErrorType2["CORS_MISCONFIGURATION"] = "CORS_MISCONFIGURATION";
      SecurityErrorType2["SENSITIVE_DATA_EXPOSURE"] = "SENSITIVE_DATA_EXPOSURE";
      SecurityErrorType2["DEBUG_INFO_LEAK"] = "DEBUG_INFO_LEAK";
    })(SecurityErrorType || (exports2.SecurityErrorType = SecurityErrorType = {}));
    var SecurityDetector2 = class {
      workspaceRoot;
      ignorePatterns;
      constructor(workspaceRoot) {
        this.workspaceRoot = workspaceRoot;
        this.ignorePatterns = [
          "node_modules/**",
          "dist/**",
          ".next/**",
          "out/**",
          "build/**",
          "**/*.test.*",
          "**/*.spec.*",
          "**/*.example.*",
          "**/*.mock.*",
          "**/__tests__/**",
          "**/__mocks__/**",
          // Lock files (generated, not source code)
          "**/package-lock.json",
          "**/pnpm-lock.yaml",
          "**/yarn.lock",
          // Config files (often have long strings that aren't secrets)
          "**/tsconfig*.json",
          "**/jest.config.*",
          "**/vite.config.*"
        ];
      }
      /**
       * Run all security checks
       */
      async detect(targetDir) {
        const dir = targetDir || this.workspaceRoot;
        const errors = [];
        const cveErrors = await this.detectCVEs(dir);
        errors.push(...cveErrors);
        const secretErrors = await this.detectHardcodedSecrets(dir);
        errors.push(...secretErrors);
        const injectionErrors = await this.detectInjectionVulnerabilities(dir);
        errors.push(...injectionErrors);
        const cryptoErrors = await this.detectWeakCryptography(dir);
        errors.push(...cryptoErrors);
        const unsafeErrors = await this.detectUnsafePatterns(dir);
        errors.push(...unsafeErrors);
        return errors;
      }
      /**
       * Detect CVEs in dependencies using npm audit
       */
      async detectCVEs(dir) {
        const errors = [];
        try {
          const packageJsonPath = path4.join(dir, "package.json");
          if (!fs4.existsSync(packageJsonPath)) {
            return errors;
          }
          const auditOutput = (0, node_child_process_1.execSync)("npm audit --json", {
            cwd: dir,
            encoding: "utf8",
            stdio: "pipe"
          });
          const auditData = JSON.parse(auditOutput);
          if (auditData.vulnerabilities) {
            for (const [pkgName, vuln] of Object.entries(auditData.vulnerabilities)) {
              const v = vuln;
              const severity = this.mapNpmSeverity(v.severity);
              errors.push({
                file: packageJsonPath,
                type: SecurityErrorType.CVE,
                severity,
                message: `${pkgName}: ${v.via?.[0]?.title || "Security vulnerability detected"}`,
                code: v.via?.[0]?.cve || v.via?.[0]?.cwe?.[0],
                details: v.via?.[0]?.url,
                affectedPackage: pkgName,
                vulnerableVersions: v.range,
                patchedVersions: v.fixAvailable ? "Available" : "None",
                suggestedFix: v.fixAvailable ? `Run: npm audit fix or update to ${v.fixAvailable.version || "latest version"}` : "No automated fix available. Check package documentation."
              });
            }
          }
        } catch (error) {
          if (error.stdout) {
            try {
              const auditData = JSON.parse(error.stdout);
              if (auditData.vulnerabilities) {
                return this.detectCVEs(dir);
              }
            } catch {
            }
          }
        }
        return errors;
      }
      /**
       * Detect hardcoded secrets in source files
       */
      async detectHardcodedSecrets(dir) {
        const errors = [];
        const files = await (0, glob_1.glob)("**/*.{ts,tsx,js,jsx,mjs,cjs,json,yaml,yml,env}", {
          cwd: dir,
          absolute: true,
          ignore: this.ignorePatterns
        });
        const secretPatterns = [
          // API Keys
          {
            regex: /['"`]([A-Za-z0-9_-]{20,})['"` ]/g,
            type: SecurityErrorType.API_KEY_EXPOSED,
            name: "Potential API Key",
            severity: "high"
          },
          // AWS Keys
          {
            regex: /AKIA[0-9A-Z]{16}/g,
            type: SecurityErrorType.HARDCODED_SECRET,
            name: "AWS Access Key",
            severity: "critical"
          },
          // GitHub Tokens
          {
            regex: /ghp_[0-9a-zA-Z]{36}/g,
            type: SecurityErrorType.API_KEY_EXPOSED,
            name: "GitHub Personal Access Token",
            severity: "critical"
          },
          // Generic secrets in variable names
          {
            regex: /(password|passwd|pwd|secret|token|apikey|api_key)\s*[=:]\s*['"`]([^'"`\s]{8,})['"`]/gi,
            type: SecurityErrorType.HARDCODED_PASSWORD,
            name: "Hardcoded Credential",
            severity: "critical"
          },
          // JWT tokens
          {
            regex: /eyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g,
            type: SecurityErrorType.JWT_TOKEN_EXPOSED,
            name: "JWT Token",
            severity: "high"
          },
          // Private keys
          {
            regex: /-----BEGIN (RSA |EC )?PRIVATE KEY-----/g,
            type: SecurityErrorType.PRIVATE_KEY_EXPOSED,
            name: "Private Key",
            severity: "critical"
          },
          // Database connection strings
          {
            regex: /(mongodb|postgres|mysql):\/\/[^\s]+:[^\s]+@/gi,
            type: SecurityErrorType.HARDCODED_PASSWORD,
            name: "Database Connection String with Credentials",
            severity: "critical"
          }
        ];
        for (const file of files) {
          if (file.includes(".example") || file.includes(".sample")) {
            continue;
          }
          const content = fs4.readFileSync(file, "utf8");
          const lines = content.split("\n");
          for (const pattern of secretPatterns) {
            for (let index = 0; index < lines.length; index++) {
              const line = lines[index];
              if (line.trim().startsWith("//") || line.trim().startsWith("#") || line.trim().startsWith("*")) {
                continue;
              }
              const matches = line.matchAll(pattern.regex);
              for (const match of matches) {
                if (this.isLikelyFalsePositive(match[0])) {
                  continue;
                }
                errors.push({
                  file: path4.relative(this.workspaceRoot, file),
                  line: index + 1,
                  column: match.index,
                  type: pattern.type,
                  severity: pattern.severity,
                  message: `${pattern.name} detected: ${match[0].substring(0, 30)}...`,
                  suggestedFix: "Move sensitive data to environment variables (.env) and use process.env"
                });
              }
            }
          }
        }
        return errors;
      }
      /**
       * Detect injection vulnerabilities
       */
      async detectInjectionVulnerabilities(dir) {
        const errors = [];
        const files = await (0, glob_1.glob)("**/*.{ts,tsx,js,jsx}", {
          cwd: dir,
          absolute: true,
          ignore: this.ignorePatterns
        });
        for (const file of files) {
          const content = fs4.readFileSync(file, "utf8");
          const lines = content.split("\n");
          for (let index = 0; index < lines.length; index++) {
            const line = lines[index];
            if (/execute\s*\(\s*['"`][^'"`]*\$\{|query\s*\(\s*['"`][^'"`]*\$\{/gi.test(line)) {
              errors.push({
                file: path4.relative(this.workspaceRoot, file),
                line: index + 1,
                type: SecurityErrorType.SQL_INJECTION,
                severity: "critical",
                message: "Potential SQL injection: String interpolation in SQL query",
                suggestedFix: "Use parameterized queries or prepared statements"
              });
            }
            if (/(exec|spawn|execSync|spawnSync)\s*\([^)]*\$\{/gi.test(line)) {
              errors.push({
                file: path4.relative(this.workspaceRoot, file),
                line: index + 1,
                type: SecurityErrorType.COMMAND_INJECTION,
                severity: "critical",
                message: "Potential command injection: Unsanitized input in command execution",
                suggestedFix: "Sanitize inputs and use command arrays instead of string interpolation"
              });
            }
            if (/dangerouslySetInnerHTML\s*=\s*\{\{/gi.test(line)) {
              errors.push({
                file: path4.relative(this.workspaceRoot, file),
                line: index + 1,
                type: SecurityErrorType.XSS_VULNERABILITY,
                severity: "high",
                message: "Potential XSS: Using dangerouslySetInnerHTML",
                suggestedFix: "Sanitize HTML content using DOMPurify or avoid dangerouslySetInnerHTML"
              });
            }
            const hasFileOp = /readFile.*\$\{|writeFile.*\$\{|unlink.*\$\{/gi.test(line);
            const hasPathSanitization = /path\.join|path\.resolve/gi.test(line);
            const hasPrevLineSanitization = index > 0 && /path\.join|path\.resolve/gi.test(lines[index - 1]);
            if (hasFileOp && !hasPathSanitization && !hasPrevLineSanitization) {
              errors.push({
                file: path4.relative(this.workspaceRoot, file),
                line: index + 1,
                type: SecurityErrorType.PATH_TRAVERSAL,
                severity: "high",
                message: "Potential path traversal: Unsanitized file path",
                suggestedFix: "Use path.join() or path.resolve() and validate paths"
              });
            }
          }
        }
        return errors;
      }
      /**
       * Detect weak cryptography
       */
      async detectWeakCryptography(dir) {
        const errors = [];
        const files = await (0, glob_1.glob)("**/*.{ts,tsx,js,jsx}", {
          cwd: dir,
          absolute: true,
          ignore: this.ignorePatterns
        });
        for (const file of files) {
          const content = fs4.readFileSync(file, "utf8");
          const lines = content.split("\n");
          for (let index = 0; index < lines.length; index++) {
            const line = lines[index];
            if (/createHash\s*\(\s*['"`](md5|sha1)['"`]\)/gi.test(line)) {
              errors.push({
                file: path4.relative(this.workspaceRoot, file),
                line: index + 1,
                type: SecurityErrorType.WEAK_HASH,
                severity: "medium",
                message: "Weak hash algorithm detected (MD5/SHA1)",
                suggestedFix: 'Use SHA-256 or stronger: crypto.createHash("sha256")'
              });
            }
            if (/Math\.random\(\)/.test(line) && /(token|secret|key|password|salt)/gi.test(line)) {
              errors.push({
                file: path4.relative(this.workspaceRoot, file),
                line: index + 1,
                type: SecurityErrorType.INSECURE_RANDOM,
                severity: "high",
                message: "Insecure random number generation for security-sensitive operation",
                suggestedFix: "Use crypto.randomBytes() for cryptographic purposes"
              });
            }
            if (/(DES|RC4|Blowfish)/.test(line)) {
              errors.push({
                file: path4.relative(this.workspaceRoot, file),
                line: index + 1,
                type: SecurityErrorType.WEAK_CRYPTO,
                severity: "high",
                message: "Weak encryption algorithm detected",
                suggestedFix: "Use AES-256-GCM or ChaCha20-Poly1305"
              });
            }
          }
        }
        return errors;
      }
      /**
       * Detect unsafe patterns
       */
      async detectUnsafePatterns(dir) {
        const errors = [];
        const files = await (0, glob_1.glob)("**/*.{ts,tsx,js,jsx}", {
          cwd: dir,
          absolute: true,
          ignore: this.ignorePatterns
        });
        for (const file of files) {
          const content = fs4.readFileSync(file, "utf8");
          const lines = content.split("\n");
          for (let index = 0; index < lines.length; index++) {
            const line = lines[index];
            if (/\beval\s*\(/gi.test(line)) {
              errors.push({
                file: path4.relative(this.workspaceRoot, file),
                line: index + 1,
                type: SecurityErrorType.UNSAFE_EVAL,
                severity: "critical",
                message: "Unsafe eval() usage detected",
                suggestedFix: "Avoid eval(). Use safer alternatives like JSON.parse() or Function()"
              });
            }
            if (/JSON\.parse\s*\([^)]*req\.|JSON\.parse\s*\([^)]*request\./gi.test(line)) {
              errors.push({
                file: path4.relative(this.workspaceRoot, file),
                line: index + 1,
                type: SecurityErrorType.INSECURE_DESERIALIZATION,
                severity: "medium",
                message: "Potential insecure deserialization of user input",
                suggestedFix: "Validate and sanitize input before parsing JSON"
              });
            }
            if (/cors\s*\(\s*\{\s*origin\s*:\s*['"`]\*['"`]/gi.test(line)) {
              errors.push({
                file: path4.relative(this.workspaceRoot, file),
                line: index + 1,
                type: SecurityErrorType.CORS_MISCONFIGURATION,
                severity: "medium",
                message: "CORS configured with wildcard (*) origin",
                suggestedFix: "Specify allowed origins explicitly instead of using wildcard"
              });
            }
            if (/(console\.log|console\.error|console\.debug)\s*\([^)]*password|token|secret|key/gi.test(line)) {
              errors.push({
                file: path4.relative(this.workspaceRoot, file),
                line: index + 1,
                type: SecurityErrorType.DEBUG_INFO_LEAK,
                severity: "medium",
                message: "Sensitive data logged to console",
                suggestedFix: "Remove console logs with sensitive data or use proper logging library"
              });
            }
          }
        }
        return errors;
      }
      /**
       * Check if a match is likely a false positive
       */
      isLikelyFalsePositive(text) {
        const falsePositives = [
          "example",
          "test",
          "demo",
          "sample",
          "placeholder",
          "your-api-key",
          "your_api_key",
          "YOUR_API_KEY",
          "xxx",
          "***",
          "...",
          "undefined",
          "null",
          "process.env",
          // Package-lock.json common fields
          "peerDependenciesMeta",
          "optionalDependencies",
          "peerDependencies",
          "devDependencies",
          "dependencies",
          // TypeScript config fields
          "noFallthroughCasesInSwitch",
          "noImplicitReturns",
          "noUnusedLocals",
          "noUnusedParameters",
          // Common npm package names (lowercase matches)
          "package-json",
          "is-fullwidth",
          "ts-interface",
          "fix-dts-default"
        ];
        const lowerText = text.toLowerCase();
        return falsePositives.some((fp) => lowerText.includes(fp.toLowerCase()));
      }
      /**
       * Map npm audit severity to our severity levels
       */
      mapNpmSeverity(npmSeverity) {
        switch (npmSeverity.toLowerCase()) {
          case "critical":
            return "critical";
          case "high":
            return "high";
          case "moderate":
            return "medium";
          case "low":
            return "low";
          default:
            return "info";
        }
      }
      /**
       * Get statistics about security issues
       */
      getStatistics(errors) {
        const stats = {
          total: errors.length,
          bySeverity: {},
          byType: {}
        };
        for (const error of errors) {
          stats.bySeverity[error.severity] = (stats.bySeverity[error.severity] || 0) + 1;
          stats.byType[error.type] = (stats.byType[error.type] || 0) + 1;
        }
        return stats;
      }
    };
    exports2.SecurityDetector = SecurityDetector2;
  }
});

// src/detector/circular-detector.js
var require_circular_detector = __commonJS({
  "src/detector/circular-detector.js"(exports2) {
    "use strict";
    var __createBinding = exports2 && exports2.__createBinding || (Object.create ? (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    }) : (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    }));
    var __setModuleDefault = exports2 && exports2.__setModuleDefault || (Object.create ? (function(o, v) {
      Object.defineProperty(o, "default", { enumerable: true, value: v });
    }) : function(o, v) {
      o["default"] = v;
    });
    var __importStar = exports2 && exports2.__importStar || /* @__PURE__ */ (function() {
      var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function(o2) {
          var ar = [];
          for (var k in o2) if (Object.prototype.hasOwnProperty.call(o2, k)) ar[ar.length] = k;
          return ar;
        };
        return ownKeys(o);
      };
      return function(mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) {
          for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        }
        __setModuleDefault(result, mod);
        return result;
      };
    })();
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.CircularDependencyDetector = void 0;
    var fs4 = __importStar(require("fs"));
    var path4 = __importStar(require("path"));
    var glob_1 = require("glob");
    var CircularDependencyDetector2 = class {
      workspaceRoot;
      graph = {};
      visited = /* @__PURE__ */ new Set();
      recursionStack = /* @__PURE__ */ new Set();
      currentPath = [];
      constructor(workspaceRoot) {
        this.workspaceRoot = workspaceRoot;
      }
      /**
       * Detect all circular dependencies
       */
      async detect(targetDir) {
        const dir = targetDir || this.workspaceRoot;
        await this.buildDependencyGraph(dir);
        const cycles = this.detectCycles();
        return cycles;
      }
      /**
       * Build dependency graph from file imports
       */
      async buildDependencyGraph(dir) {
        const files = await (0, glob_1.glob)("**/*.{ts,tsx,js,jsx,mjs,cjs}", {
          cwd: dir,
          ignore: [
            "node_modules/**",
            "dist/**",
            ".next/**",
            "out/**",
            "**/*.test.ts",
            // Test files (intentional cycles in mocks)
            "**/*.test.tsx",
            "**/*.spec.ts",
            "**/*.spec.tsx",
            "**/*.data.ts",
            // Mock data files
            "**/*.mock.ts",
            // Mock implementations
            "**/*.fixture.ts",
            // Test fixtures
            "**/examples/**",
            // Example code
            "**/showcase/**",
            // Showcase examples
            "**/demo/**"
            // Demo code
          ]
        });
        for (const file of files) {
          const fullPath = path4.join(dir, file);
          const imports = this.extractImports(fullPath);
          const resolvedImports = imports.map((imp) => this.resolveImport(fullPath, imp)).filter((imp) => imp !== null);
          this.graph[fullPath] = resolvedImports;
        }
      }
      /**
       * Extract import statements from a file
       */
      extractImports(filePath) {
        try {
          const content = fs4.readFileSync(filePath, "utf-8");
          const imports = [];
          const importRegex = /import\s+(?:(?:[\w*\s{},]*)\s+from\s+)?['"]([^'"]+)['"]/g;
          let match;
          while ((match = importRegex.exec(content)) !== null) {
            const importPath = match[1];
            if (!importPath.startsWith(".") && !importPath.startsWith("/")) {
              continue;
            }
            imports.push(importPath);
          }
          const dynamicImportRegex = /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
          while ((match = dynamicImportRegex.exec(content)) !== null) {
            const importPath = match[1];
            if (!importPath.startsWith(".") && !importPath.startsWith("/")) {
              continue;
            }
            imports.push(importPath);
          }
          const exportFromRegex = /export\s+(?:(?:[\w*\s{},]*)\s+from\s+)['"]([^'"]+)['"]/g;
          while ((match = exportFromRegex.exec(content)) !== null) {
            const importPath = match[1];
            if (!importPath.startsWith(".") && !importPath.startsWith("/")) {
              continue;
            }
            imports.push(importPath);
          }
          const requireRegex = /require\s*\(['"]([^'"]+)['"]\)/g;
          while ((match = requireRegex.exec(content)) !== null) {
            const importPath = match[1];
            if (!importPath.startsWith(".") && !importPath.startsWith("/")) {
              continue;
            }
            imports.push(importPath);
          }
          return imports;
        } catch (error) {
          return [];
        }
      }
      /**
       * Resolve relative import path to absolute file path
       */
      resolveImport(fromFile, importPath) {
        const dir = path4.dirname(fromFile);
        if (importPath.startsWith(".")) {
          let resolved = path4.resolve(dir, importPath);
          const extensions = [".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".d.ts", ""];
          for (const ext of extensions) {
            const withExt = resolved + ext;
            if (fs4.existsSync(withExt) && fs4.statSync(withExt).isFile()) {
              return withExt;
            }
            const indexPath = path4.join(resolved, `index${ext}`);
            if (fs4.existsSync(indexPath) && fs4.statSync(indexPath).isFile()) {
              return indexPath;
            }
          }
        }
        return null;
      }
      /**
       * Detect cycles using DFS with path tracking
       */
      detectCycles() {
        const cycles = [];
        const seenCycles = /* @__PURE__ */ new Set();
        this.visited = /* @__PURE__ */ new Set();
        this.recursionStack = /* @__PURE__ */ new Set();
        for (const node of Object.keys(this.graph)) {
          if (!this.visited.has(node)) {
            this.currentPath = [];
            this.dfs(node, cycles, seenCycles);
          }
        }
        return cycles;
      }
      /**
       * Depth-first search to find cycles
       */
      dfs(node, cycles, seenCycles) {
        this.visited.add(node);
        this.recursionStack.add(node);
        this.currentPath.push(node);
        const neighbors = this.graph[node] || [];
        for (const neighbor of neighbors) {
          if (!this.visited.has(neighbor)) {
            this.dfs(neighbor, cycles, seenCycles);
          } else if (this.recursionStack.has(neighbor)) {
            const cycleStart = this.currentPath.indexOf(neighbor);
            if (cycleStart !== -1) {
              const cycle = this.currentPath.slice(cycleStart);
              const sortedCycle = [...cycle].sort((a, b) => a.localeCompare(b));
              const cycleKey = sortedCycle.join("|");
              if (!seenCycles.has(cycleKey)) {
                seenCycles.add(cycleKey);
                const relativeCycle = cycle.map((f) => path4.relative(this.workspaceRoot, f));
                const depth = cycle.length;
                const severity = this.calculateSeverity(depth);
                cycles.push({
                  cycle: relativeCycle,
                  depth,
                  severity,
                  message: `Circular dependency detected: ${relativeCycle.length} files`,
                  suggestedFix: this.generateSuggestion(relativeCycle, depth)
                });
              }
            }
          }
        }
        this.currentPath.pop();
        this.recursionStack.delete(node);
      }
      /**
       * Calculate severity based on cycle depth
       */
      calculateSeverity(depth) {
        if (depth === 2)
          return "high";
        if (depth <= 4)
          return "medium";
        return "low";
      }
      /**
       * Generate refactoring suggestion based on cycle complexity
       */
      generateSuggestion(cycle, depth) {
        if (depth === 2) {
          return `Direct circular dependency. Solutions:
   1. Extract common code to a shared module
   2. Use dependency injection pattern
   3. Move one import to be lazy (dynamic import)`;
        }
        if (depth <= 4) {
          return `Medium complexity cycle. Solutions:
   1. Identify common interfaces and extract to separate file
   2. Use dependency injection container
   3. Restructure code to follow dependency flow (top \u2192 bottom)`;
        }
        return `Complex circular dependency chain. Solutions:
   1. Refactor architecture - consider layered design
   2. Use event-driven communication instead of direct imports
   3. Extract shared types/interfaces to common module
   4. Consider breaking into smaller, independent modules`;
      }
      /**
       * Get statistics about circular dependencies
       */
      getStatistics(cycles) {
        const stats = {
          totalCycles: cycles.length,
          bySeverity: {
            high: 0,
            medium: 0,
            low: 0
          },
          byDepth: {},
          affectedFiles: /* @__PURE__ */ new Set()
        };
        for (const cycle of cycles) {
          stats.bySeverity[cycle.severity]++;
          stats.byDepth[cycle.depth] = (stats.byDepth[cycle.depth] || 0) + 1;
          cycle.cycle.forEach((file) => stats.affectedFiles.add(file));
        }
        return stats;
      }
      /**
       * Format error for display
       */
      formatError(circular) {
        const severityEmoji = {
          high: "\u{1F534}",
          medium: "\u{1F7E1}",
          low: "\u{1F7E2}"
        };
        const cycleVisualization = circular.cycle.map((file, index) => {
          if (index === circular.cycle.length - 1) {
            return `   \u2514\u2500\u27A4 ${file} (back to start)`;
          }
          return `   ${index === 0 ? "\u250C\u2500\u27A4" : "\u251C\u2500\u27A4"} ${file}`;
        }).join("\n");
        return `
${severityEmoji[circular.severity]} CIRCULAR DEPENDENCY [${circular.severity.toUpperCase()}]
\u{1F4CA} Depth: ${circular.depth} files
\u{1F4AC} ${circular.message}

\u{1F504} Cycle Path:
${cycleVisualization}

\u{1F50D} Impact:
   This creates tight coupling and makes code harder to:
   - Test in isolation
   - Refactor safely
   - Understand data flow

\u2705 Suggested Fix:
   ${circular.suggestedFix}
${"\u2500".repeat(60)}
`;
      }
    };
    exports2.CircularDependencyDetector = CircularDependencyDetector2;
  }
});

// ../../node_modules/.pnpm/braces@3.0.3/node_modules/braces/lib/utils.js
var require_utils = __commonJS({
  "../../node_modules/.pnpm/braces@3.0.3/node_modules/braces/lib/utils.js"(exports2) {
    "use strict";
    exports2.isInteger = (num) => {
      if (typeof num === "number") {
        return Number.isInteger(num);
      }
      if (typeof num === "string" && num.trim() !== "") {
        return Number.isInteger(Number(num));
      }
      return false;
    };
    exports2.find = (node, type) => node.nodes.find((node2) => node2.type === type);
    exports2.exceedsLimit = (min, max, step = 1, limit) => {
      if (limit === false) return false;
      if (!exports2.isInteger(min) || !exports2.isInteger(max)) return false;
      return (Number(max) - Number(min)) / Number(step) >= limit;
    };
    exports2.escapeNode = (block, n = 0, type) => {
      const node = block.nodes[n];
      if (!node) return;
      if (type && node.type === type || node.type === "open" || node.type === "close") {
        if (node.escaped !== true) {
          node.value = "\\" + node.value;
          node.escaped = true;
        }
      }
    };
    exports2.encloseBrace = (node) => {
      if (node.type !== "brace") return false;
      if (node.commas >> 0 + node.ranges >> 0 === 0) {
        node.invalid = true;
        return true;
      }
      return false;
    };
    exports2.isInvalidBrace = (block) => {
      if (block.type !== "brace") return false;
      if (block.invalid === true || block.dollar) return true;
      if (block.commas >> 0 + block.ranges >> 0 === 0) {
        block.invalid = true;
        return true;
      }
      if (block.open !== true || block.close !== true) {
        block.invalid = true;
        return true;
      }
      return false;
    };
    exports2.isOpenOrClose = (node) => {
      if (node.type === "open" || node.type === "close") {
        return true;
      }
      return node.open === true || node.close === true;
    };
    exports2.reduce = (nodes) => nodes.reduce((acc, node) => {
      if (node.type === "text") acc.push(node.value);
      if (node.type === "range") node.type = "text";
      return acc;
    }, []);
    exports2.flatten = (...args) => {
      const result = [];
      const flat = (arr) => {
        for (let i = 0; i < arr.length; i++) {
          const ele = arr[i];
          if (Array.isArray(ele)) {
            flat(ele);
            continue;
          }
          if (ele !== void 0) {
            result.push(ele);
          }
        }
        return result;
      };
      flat(args);
      return result;
    };
  }
});

// ../../node_modules/.pnpm/braces@3.0.3/node_modules/braces/lib/stringify.js
var require_stringify = __commonJS({
  "../../node_modules/.pnpm/braces@3.0.3/node_modules/braces/lib/stringify.js"(exports2, module2) {
    "use strict";
    var utils = require_utils();
    module2.exports = (ast, options = {}) => {
      const stringify = (node, parent = {}) => {
        const invalidBlock = options.escapeInvalid && utils.isInvalidBrace(parent);
        const invalidNode = node.invalid === true && options.escapeInvalid === true;
        let output = "";
        if (node.value) {
          if ((invalidBlock || invalidNode) && utils.isOpenOrClose(node)) {
            return "\\" + node.value;
          }
          return node.value;
        }
        if (node.value) {
          return node.value;
        }
        if (node.nodes) {
          for (const child of node.nodes) {
            output += stringify(child);
          }
        }
        return output;
      };
      return stringify(ast);
    };
  }
});

// ../../node_modules/.pnpm/is-number@7.0.0/node_modules/is-number/index.js
var require_is_number = __commonJS({
  "../../node_modules/.pnpm/is-number@7.0.0/node_modules/is-number/index.js"(exports2, module2) {
    "use strict";
    module2.exports = function(num) {
      if (typeof num === "number") {
        return num - num === 0;
      }
      if (typeof num === "string" && num.trim() !== "") {
        return Number.isFinite ? Number.isFinite(+num) : isFinite(+num);
      }
      return false;
    };
  }
});

// ../../node_modules/.pnpm/to-regex-range@5.0.1/node_modules/to-regex-range/index.js
var require_to_regex_range = __commonJS({
  "../../node_modules/.pnpm/to-regex-range@5.0.1/node_modules/to-regex-range/index.js"(exports2, module2) {
    "use strict";
    var isNumber = require_is_number();
    var toRegexRange = (min, max, options) => {
      if (isNumber(min) === false) {
        throw new TypeError("toRegexRange: expected the first argument to be a number");
      }
      if (max === void 0 || min === max) {
        return String(min);
      }
      if (isNumber(max) === false) {
        throw new TypeError("toRegexRange: expected the second argument to be a number.");
      }
      let opts = { relaxZeros: true, ...options };
      if (typeof opts.strictZeros === "boolean") {
        opts.relaxZeros = opts.strictZeros === false;
      }
      let relax = String(opts.relaxZeros);
      let shorthand = String(opts.shorthand);
      let capture = String(opts.capture);
      let wrap = String(opts.wrap);
      let cacheKey = min + ":" + max + "=" + relax + shorthand + capture + wrap;
      if (toRegexRange.cache.hasOwnProperty(cacheKey)) {
        return toRegexRange.cache[cacheKey].result;
      }
      let a = Math.min(min, max);
      let b = Math.max(min, max);
      if (Math.abs(a - b) === 1) {
        let result = min + "|" + max;
        if (opts.capture) {
          return `(${result})`;
        }
        if (opts.wrap === false) {
          return result;
        }
        return `(?:${result})`;
      }
      let isPadded = hasPadding(min) || hasPadding(max);
      let state = { min, max, a, b };
      let positives = [];
      let negatives = [];
      if (isPadded) {
        state.isPadded = isPadded;
        state.maxLen = String(state.max).length;
      }
      if (a < 0) {
        let newMin = b < 0 ? Math.abs(b) : 1;
        negatives = splitToPatterns(newMin, Math.abs(a), state, opts);
        a = state.a = 0;
      }
      if (b >= 0) {
        positives = splitToPatterns(a, b, state, opts);
      }
      state.negatives = negatives;
      state.positives = positives;
      state.result = collatePatterns(negatives, positives, opts);
      if (opts.capture === true) {
        state.result = `(${state.result})`;
      } else if (opts.wrap !== false && positives.length + negatives.length > 1) {
        state.result = `(?:${state.result})`;
      }
      toRegexRange.cache[cacheKey] = state;
      return state.result;
    };
    function collatePatterns(neg, pos, options) {
      let onlyNegative = filterPatterns(neg, pos, "-", false, options) || [];
      let onlyPositive = filterPatterns(pos, neg, "", false, options) || [];
      let intersected = filterPatterns(neg, pos, "-?", true, options) || [];
      let subpatterns = onlyNegative.concat(intersected).concat(onlyPositive);
      return subpatterns.join("|");
    }
    function splitToRanges(min, max) {
      let nines = 1;
      let zeros = 1;
      let stop = countNines(min, nines);
      let stops = /* @__PURE__ */ new Set([max]);
      while (min <= stop && stop <= max) {
        stops.add(stop);
        nines += 1;
        stop = countNines(min, nines);
      }
      stop = countZeros(max + 1, zeros) - 1;
      while (min < stop && stop <= max) {
        stops.add(stop);
        zeros += 1;
        stop = countZeros(max + 1, zeros) - 1;
      }
      stops = [...stops];
      stops.sort(compare);
      return stops;
    }
    function rangeToPattern(start, stop, options) {
      if (start === stop) {
        return { pattern: start, count: [], digits: 0 };
      }
      let zipped = zip(start, stop);
      let digits = zipped.length;
      let pattern = "";
      let count = 0;
      for (let i = 0; i < digits; i++) {
        let [startDigit, stopDigit] = zipped[i];
        if (startDigit === stopDigit) {
          pattern += startDigit;
        } else if (startDigit !== "0" || stopDigit !== "9") {
          pattern += toCharacterClass(startDigit, stopDigit, options);
        } else {
          count++;
        }
      }
      if (count) {
        pattern += options.shorthand === true ? "\\d" : "[0-9]";
      }
      return { pattern, count: [count], digits };
    }
    function splitToPatterns(min, max, tok, options) {
      let ranges = splitToRanges(min, max);
      let tokens = [];
      let start = min;
      let prev;
      for (let i = 0; i < ranges.length; i++) {
        let max2 = ranges[i];
        let obj = rangeToPattern(String(start), String(max2), options);
        let zeros = "";
        if (!tok.isPadded && prev && prev.pattern === obj.pattern) {
          if (prev.count.length > 1) {
            prev.count.pop();
          }
          prev.count.push(obj.count[0]);
          prev.string = prev.pattern + toQuantifier(prev.count);
          start = max2 + 1;
          continue;
        }
        if (tok.isPadded) {
          zeros = padZeros(max2, tok, options);
        }
        obj.string = zeros + obj.pattern + toQuantifier(obj.count);
        tokens.push(obj);
        start = max2 + 1;
        prev = obj;
      }
      return tokens;
    }
    function filterPatterns(arr, comparison, prefix, intersection, options) {
      let result = [];
      for (let ele of arr) {
        let { string } = ele;
        if (!intersection && !contains(comparison, "string", string)) {
          result.push(prefix + string);
        }
        if (intersection && contains(comparison, "string", string)) {
          result.push(prefix + string);
        }
      }
      return result;
    }
    function zip(a, b) {
      let arr = [];
      for (let i = 0; i < a.length; i++) arr.push([a[i], b[i]]);
      return arr;
    }
    function compare(a, b) {
      return a > b ? 1 : b > a ? -1 : 0;
    }
    function contains(arr, key, val) {
      return arr.some((ele) => ele[key] === val);
    }
    function countNines(min, len) {
      return Number(String(min).slice(0, -len) + "9".repeat(len));
    }
    function countZeros(integer, zeros) {
      return integer - integer % Math.pow(10, zeros);
    }
    function toQuantifier(digits) {
      let [start = 0, stop = ""] = digits;
      if (stop || start > 1) {
        return `{${start + (stop ? "," + stop : "")}}`;
      }
      return "";
    }
    function toCharacterClass(a, b, options) {
      return `[${a}${b - a === 1 ? "" : "-"}${b}]`;
    }
    function hasPadding(str) {
      return /^-?(0+)\d/.test(str);
    }
    function padZeros(value, tok, options) {
      if (!tok.isPadded) {
        return value;
      }
      let diff = Math.abs(tok.maxLen - String(value).length);
      let relax = options.relaxZeros !== false;
      switch (diff) {
        case 0:
          return "";
        case 1:
          return relax ? "0?" : "0";
        case 2:
          return relax ? "0{0,2}" : "00";
        default: {
          return relax ? `0{0,${diff}}` : `0{${diff}}`;
        }
      }
    }
    toRegexRange.cache = {};
    toRegexRange.clearCache = () => toRegexRange.cache = {};
    module2.exports = toRegexRange;
  }
});

// ../../node_modules/.pnpm/fill-range@7.1.1/node_modules/fill-range/index.js
var require_fill_range = __commonJS({
  "../../node_modules/.pnpm/fill-range@7.1.1/node_modules/fill-range/index.js"(exports2, module2) {
    "use strict";
    var util = require("util");
    var toRegexRange = require_to_regex_range();
    var isObject = (val) => val !== null && typeof val === "object" && !Array.isArray(val);
    var transform = (toNumber) => {
      return (value) => toNumber === true ? Number(value) : String(value);
    };
    var isValidValue = (value) => {
      return typeof value === "number" || typeof value === "string" && value !== "";
    };
    var isNumber = (num) => Number.isInteger(+num);
    var zeros = (input) => {
      let value = `${input}`;
      let index = -1;
      if (value[0] === "-") value = value.slice(1);
      if (value === "0") return false;
      while (value[++index] === "0") ;
      return index > 0;
    };
    var stringify = (start, end, options) => {
      if (typeof start === "string" || typeof end === "string") {
        return true;
      }
      return options.stringify === true;
    };
    var pad = (input, maxLength, toNumber) => {
      if (maxLength > 0) {
        let dash = input[0] === "-" ? "-" : "";
        if (dash) input = input.slice(1);
        input = dash + input.padStart(dash ? maxLength - 1 : maxLength, "0");
      }
      if (toNumber === false) {
        return String(input);
      }
      return input;
    };
    var toMaxLen = (input, maxLength) => {
      let negative = input[0] === "-" ? "-" : "";
      if (negative) {
        input = input.slice(1);
        maxLength--;
      }
      while (input.length < maxLength) input = "0" + input;
      return negative ? "-" + input : input;
    };
    var toSequence = (parts, options, maxLen) => {
      parts.negatives.sort((a, b) => a < b ? -1 : a > b ? 1 : 0);
      parts.positives.sort((a, b) => a < b ? -1 : a > b ? 1 : 0);
      let prefix = options.capture ? "" : "?:";
      let positives = "";
      let negatives = "";
      let result;
      if (parts.positives.length) {
        positives = parts.positives.map((v) => toMaxLen(String(v), maxLen)).join("|");
      }
      if (parts.negatives.length) {
        negatives = `-(${prefix}${parts.negatives.map((v) => toMaxLen(String(v), maxLen)).join("|")})`;
      }
      if (positives && negatives) {
        result = `${positives}|${negatives}`;
      } else {
        result = positives || negatives;
      }
      if (options.wrap) {
        return `(${prefix}${result})`;
      }
      return result;
    };
    var toRange = (a, b, isNumbers, options) => {
      if (isNumbers) {
        return toRegexRange(a, b, { wrap: false, ...options });
      }
      let start = String.fromCharCode(a);
      if (a === b) return start;
      let stop = String.fromCharCode(b);
      return `[${start}-${stop}]`;
    };
    var toRegex = (start, end, options) => {
      if (Array.isArray(start)) {
        let wrap = options.wrap === true;
        let prefix = options.capture ? "" : "?:";
        return wrap ? `(${prefix}${start.join("|")})` : start.join("|");
      }
      return toRegexRange(start, end, options);
    };
    var rangeError = (...args) => {
      return new RangeError("Invalid range arguments: " + util.inspect(...args));
    };
    var invalidRange = (start, end, options) => {
      if (options.strictRanges === true) throw rangeError([start, end]);
      return [];
    };
    var invalidStep = (step, options) => {
      if (options.strictRanges === true) {
        throw new TypeError(`Expected step "${step}" to be a number`);
      }
      return [];
    };
    var fillNumbers = (start, end, step = 1, options = {}) => {
      let a = Number(start);
      let b = Number(end);
      if (!Number.isInteger(a) || !Number.isInteger(b)) {
        if (options.strictRanges === true) throw rangeError([start, end]);
        return [];
      }
      if (a === 0) a = 0;
      if (b === 0) b = 0;
      let descending = a > b;
      let startString = String(start);
      let endString = String(end);
      let stepString = String(step);
      step = Math.max(Math.abs(step), 1);
      let padded = zeros(startString) || zeros(endString) || zeros(stepString);
      let maxLen = padded ? Math.max(startString.length, endString.length, stepString.length) : 0;
      let toNumber = padded === false && stringify(start, end, options) === false;
      let format = options.transform || transform(toNumber);
      if (options.toRegex && step === 1) {
        return toRange(toMaxLen(start, maxLen), toMaxLen(end, maxLen), true, options);
      }
      let parts = { negatives: [], positives: [] };
      let push = (num) => parts[num < 0 ? "negatives" : "positives"].push(Math.abs(num));
      let range = [];
      let index = 0;
      while (descending ? a >= b : a <= b) {
        if (options.toRegex === true && step > 1) {
          push(a);
        } else {
          range.push(pad(format(a, index), maxLen, toNumber));
        }
        a = descending ? a - step : a + step;
        index++;
      }
      if (options.toRegex === true) {
        return step > 1 ? toSequence(parts, options, maxLen) : toRegex(range, null, { wrap: false, ...options });
      }
      return range;
    };
    var fillLetters = (start, end, step = 1, options = {}) => {
      if (!isNumber(start) && start.length > 1 || !isNumber(end) && end.length > 1) {
        return invalidRange(start, end, options);
      }
      let format = options.transform || ((val) => String.fromCharCode(val));
      let a = `${start}`.charCodeAt(0);
      let b = `${end}`.charCodeAt(0);
      let descending = a > b;
      let min = Math.min(a, b);
      let max = Math.max(a, b);
      if (options.toRegex && step === 1) {
        return toRange(min, max, false, options);
      }
      let range = [];
      let index = 0;
      while (descending ? a >= b : a <= b) {
        range.push(format(a, index));
        a = descending ? a - step : a + step;
        index++;
      }
      if (options.toRegex === true) {
        return toRegex(range, null, { wrap: false, options });
      }
      return range;
    };
    var fill = (start, end, step, options = {}) => {
      if (end == null && isValidValue(start)) {
        return [start];
      }
      if (!isValidValue(start) || !isValidValue(end)) {
        return invalidRange(start, end, options);
      }
      if (typeof step === "function") {
        return fill(start, end, 1, { transform: step });
      }
      if (isObject(step)) {
        return fill(start, end, 0, step);
      }
      let opts = { ...options };
      if (opts.capture === true) opts.wrap = true;
      step = step || opts.step || 1;
      if (!isNumber(step)) {
        if (step != null && !isObject(step)) return invalidStep(step, opts);
        return fill(start, end, 1, step);
      }
      if (isNumber(start) && isNumber(end)) {
        return fillNumbers(start, end, step, opts);
      }
      return fillLetters(start, end, Math.max(Math.abs(step), 1), opts);
    };
    module2.exports = fill;
  }
});

// ../../node_modules/.pnpm/braces@3.0.3/node_modules/braces/lib/compile.js
var require_compile = __commonJS({
  "../../node_modules/.pnpm/braces@3.0.3/node_modules/braces/lib/compile.js"(exports2, module2) {
    "use strict";
    var fill = require_fill_range();
    var utils = require_utils();
    var compile = (ast, options = {}) => {
      const walk = (node, parent = {}) => {
        const invalidBlock = utils.isInvalidBrace(parent);
        const invalidNode = node.invalid === true && options.escapeInvalid === true;
        const invalid = invalidBlock === true || invalidNode === true;
        const prefix = options.escapeInvalid === true ? "\\" : "";
        let output = "";
        if (node.isOpen === true) {
          return prefix + node.value;
        }
        if (node.isClose === true) {
          console.log("node.isClose", prefix, node.value);
          return prefix + node.value;
        }
        if (node.type === "open") {
          return invalid ? prefix + node.value : "(";
        }
        if (node.type === "close") {
          return invalid ? prefix + node.value : ")";
        }
        if (node.type === "comma") {
          return node.prev.type === "comma" ? "" : invalid ? node.value : "|";
        }
        if (node.value) {
          return node.value;
        }
        if (node.nodes && node.ranges > 0) {
          const args = utils.reduce(node.nodes);
          const range = fill(...args, { ...options, wrap: false, toRegex: true, strictZeros: true });
          if (range.length !== 0) {
            return args.length > 1 && range.length > 1 ? `(${range})` : range;
          }
        }
        if (node.nodes) {
          for (const child of node.nodes) {
            output += walk(child, node);
          }
        }
        return output;
      };
      return walk(ast);
    };
    module2.exports = compile;
  }
});

// ../../node_modules/.pnpm/braces@3.0.3/node_modules/braces/lib/expand.js
var require_expand = __commonJS({
  "../../node_modules/.pnpm/braces@3.0.3/node_modules/braces/lib/expand.js"(exports2, module2) {
    "use strict";
    var fill = require_fill_range();
    var stringify = require_stringify();
    var utils = require_utils();
    var append = (queue = "", stash = "", enclose = false) => {
      const result = [];
      queue = [].concat(queue);
      stash = [].concat(stash);
      if (!stash.length) return queue;
      if (!queue.length) {
        return enclose ? utils.flatten(stash).map((ele) => `{${ele}}`) : stash;
      }
      for (const item of queue) {
        if (Array.isArray(item)) {
          for (const value of item) {
            result.push(append(value, stash, enclose));
          }
        } else {
          for (let ele of stash) {
            if (enclose === true && typeof ele === "string") ele = `{${ele}}`;
            result.push(Array.isArray(ele) ? append(item, ele, enclose) : item + ele);
          }
        }
      }
      return utils.flatten(result);
    };
    var expand = (ast, options = {}) => {
      const rangeLimit = options.rangeLimit === void 0 ? 1e3 : options.rangeLimit;
      const walk = (node, parent = {}) => {
        node.queue = [];
        let p = parent;
        let q = parent.queue;
        while (p.type !== "brace" && p.type !== "root" && p.parent) {
          p = p.parent;
          q = p.queue;
        }
        if (node.invalid || node.dollar) {
          q.push(append(q.pop(), stringify(node, options)));
          return;
        }
        if (node.type === "brace" && node.invalid !== true && node.nodes.length === 2) {
          q.push(append(q.pop(), ["{}"]));
          return;
        }
        if (node.nodes && node.ranges > 0) {
          const args = utils.reduce(node.nodes);
          if (utils.exceedsLimit(...args, options.step, rangeLimit)) {
            throw new RangeError("expanded array length exceeds range limit. Use options.rangeLimit to increase or disable the limit.");
          }
          let range = fill(...args, options);
          if (range.length === 0) {
            range = stringify(node, options);
          }
          q.push(append(q.pop(), range));
          node.nodes = [];
          return;
        }
        const enclose = utils.encloseBrace(node);
        let queue = node.queue;
        let block = node;
        while (block.type !== "brace" && block.type !== "root" && block.parent) {
          block = block.parent;
          queue = block.queue;
        }
        for (let i = 0; i < node.nodes.length; i++) {
          const child = node.nodes[i];
          if (child.type === "comma" && node.type === "brace") {
            if (i === 1) queue.push("");
            queue.push("");
            continue;
          }
          if (child.type === "close") {
            q.push(append(q.pop(), queue, enclose));
            continue;
          }
          if (child.value && child.type !== "open") {
            queue.push(append(queue.pop(), child.value));
            continue;
          }
          if (child.nodes) {
            walk(child, node);
          }
        }
        return queue;
      };
      return utils.flatten(walk(ast));
    };
    module2.exports = expand;
  }
});

// ../../node_modules/.pnpm/braces@3.0.3/node_modules/braces/lib/constants.js
var require_constants = __commonJS({
  "../../node_modules/.pnpm/braces@3.0.3/node_modules/braces/lib/constants.js"(exports2, module2) {
    "use strict";
    module2.exports = {
      MAX_LENGTH: 1e4,
      // Digits
      CHAR_0: "0",
      /* 0 */
      CHAR_9: "9",
      /* 9 */
      // Alphabet chars.
      CHAR_UPPERCASE_A: "A",
      /* A */
      CHAR_LOWERCASE_A: "a",
      /* a */
      CHAR_UPPERCASE_Z: "Z",
      /* Z */
      CHAR_LOWERCASE_Z: "z",
      /* z */
      CHAR_LEFT_PARENTHESES: "(",
      /* ( */
      CHAR_RIGHT_PARENTHESES: ")",
      /* ) */
      CHAR_ASTERISK: "*",
      /* * */
      // Non-alphabetic chars.
      CHAR_AMPERSAND: "&",
      /* & */
      CHAR_AT: "@",
      /* @ */
      CHAR_BACKSLASH: "\\",
      /* \ */
      CHAR_BACKTICK: "`",
      /* ` */
      CHAR_CARRIAGE_RETURN: "\r",
      /* \r */
      CHAR_CIRCUMFLEX_ACCENT: "^",
      /* ^ */
      CHAR_COLON: ":",
      /* : */
      CHAR_COMMA: ",",
      /* , */
      CHAR_DOLLAR: "$",
      /* . */
      CHAR_DOT: ".",
      /* . */
      CHAR_DOUBLE_QUOTE: '"',
      /* " */
      CHAR_EQUAL: "=",
      /* = */
      CHAR_EXCLAMATION_MARK: "!",
      /* ! */
      CHAR_FORM_FEED: "\f",
      /* \f */
      CHAR_FORWARD_SLASH: "/",
      /* / */
      CHAR_HASH: "#",
      /* # */
      CHAR_HYPHEN_MINUS: "-",
      /* - */
      CHAR_LEFT_ANGLE_BRACKET: "<",
      /* < */
      CHAR_LEFT_CURLY_BRACE: "{",
      /* { */
      CHAR_LEFT_SQUARE_BRACKET: "[",
      /* [ */
      CHAR_LINE_FEED: "\n",
      /* \n */
      CHAR_NO_BREAK_SPACE: "\xA0",
      /* \u00A0 */
      CHAR_PERCENT: "%",
      /* % */
      CHAR_PLUS: "+",
      /* + */
      CHAR_QUESTION_MARK: "?",
      /* ? */
      CHAR_RIGHT_ANGLE_BRACKET: ">",
      /* > */
      CHAR_RIGHT_CURLY_BRACE: "}",
      /* } */
      CHAR_RIGHT_SQUARE_BRACKET: "]",
      /* ] */
      CHAR_SEMICOLON: ";",
      /* ; */
      CHAR_SINGLE_QUOTE: "'",
      /* ' */
      CHAR_SPACE: " ",
      /*   */
      CHAR_TAB: "	",
      /* \t */
      CHAR_UNDERSCORE: "_",
      /* _ */
      CHAR_VERTICAL_LINE: "|",
      /* | */
      CHAR_ZERO_WIDTH_NOBREAK_SPACE: "\uFEFF"
      /* \uFEFF */
    };
  }
});

// ../../node_modules/.pnpm/braces@3.0.3/node_modules/braces/lib/parse.js
var require_parse = __commonJS({
  "../../node_modules/.pnpm/braces@3.0.3/node_modules/braces/lib/parse.js"(exports2, module2) {
    "use strict";
    var stringify = require_stringify();
    var {
      MAX_LENGTH,
      CHAR_BACKSLASH,
      /* \ */
      CHAR_BACKTICK,
      /* ` */
      CHAR_COMMA,
      /* , */
      CHAR_DOT,
      /* . */
      CHAR_LEFT_PARENTHESES,
      /* ( */
      CHAR_RIGHT_PARENTHESES,
      /* ) */
      CHAR_LEFT_CURLY_BRACE,
      /* { */
      CHAR_RIGHT_CURLY_BRACE,
      /* } */
      CHAR_LEFT_SQUARE_BRACKET,
      /* [ */
      CHAR_RIGHT_SQUARE_BRACKET,
      /* ] */
      CHAR_DOUBLE_QUOTE,
      /* " */
      CHAR_SINGLE_QUOTE,
      /* ' */
      CHAR_NO_BREAK_SPACE,
      CHAR_ZERO_WIDTH_NOBREAK_SPACE
    } = require_constants();
    var parse = (input, options = {}) => {
      if (typeof input !== "string") {
        throw new TypeError("Expected a string");
      }
      const opts = options || {};
      const max = typeof opts.maxLength === "number" ? Math.min(MAX_LENGTH, opts.maxLength) : MAX_LENGTH;
      if (input.length > max) {
        throw new SyntaxError(`Input length (${input.length}), exceeds max characters (${max})`);
      }
      const ast = { type: "root", input, nodes: [] };
      const stack = [ast];
      let block = ast;
      let prev = ast;
      let brackets = 0;
      const length = input.length;
      let index = 0;
      let depth = 0;
      let value;
      const advance = () => input[index++];
      const push = (node) => {
        if (node.type === "text" && prev.type === "dot") {
          prev.type = "text";
        }
        if (prev && prev.type === "text" && node.type === "text") {
          prev.value += node.value;
          return;
        }
        block.nodes.push(node);
        node.parent = block;
        node.prev = prev;
        prev = node;
        return node;
      };
      push({ type: "bos" });
      while (index < length) {
        block = stack[stack.length - 1];
        value = advance();
        if (value === CHAR_ZERO_WIDTH_NOBREAK_SPACE || value === CHAR_NO_BREAK_SPACE) {
          continue;
        }
        if (value === CHAR_BACKSLASH) {
          push({ type: "text", value: (options.keepEscaping ? value : "") + advance() });
          continue;
        }
        if (value === CHAR_RIGHT_SQUARE_BRACKET) {
          push({ type: "text", value: "\\" + value });
          continue;
        }
        if (value === CHAR_LEFT_SQUARE_BRACKET) {
          brackets++;
          let next;
          while (index < length && (next = advance())) {
            value += next;
            if (next === CHAR_LEFT_SQUARE_BRACKET) {
              brackets++;
              continue;
            }
            if (next === CHAR_BACKSLASH) {
              value += advance();
              continue;
            }
            if (next === CHAR_RIGHT_SQUARE_BRACKET) {
              brackets--;
              if (brackets === 0) {
                break;
              }
            }
          }
          push({ type: "text", value });
          continue;
        }
        if (value === CHAR_LEFT_PARENTHESES) {
          block = push({ type: "paren", nodes: [] });
          stack.push(block);
          push({ type: "text", value });
          continue;
        }
        if (value === CHAR_RIGHT_PARENTHESES) {
          if (block.type !== "paren") {
            push({ type: "text", value });
            continue;
          }
          block = stack.pop();
          push({ type: "text", value });
          block = stack[stack.length - 1];
          continue;
        }
        if (value === CHAR_DOUBLE_QUOTE || value === CHAR_SINGLE_QUOTE || value === CHAR_BACKTICK) {
          const open = value;
          let next;
          if (options.keepQuotes !== true) {
            value = "";
          }
          while (index < length && (next = advance())) {
            if (next === CHAR_BACKSLASH) {
              value += next + advance();
              continue;
            }
            if (next === open) {
              if (options.keepQuotes === true) value += next;
              break;
            }
            value += next;
          }
          push({ type: "text", value });
          continue;
        }
        if (value === CHAR_LEFT_CURLY_BRACE) {
          depth++;
          const dollar = prev.value && prev.value.slice(-1) === "$" || block.dollar === true;
          const brace = {
            type: "brace",
            open: true,
            close: false,
            dollar,
            depth,
            commas: 0,
            ranges: 0,
            nodes: []
          };
          block = push(brace);
          stack.push(block);
          push({ type: "open", value });
          continue;
        }
        if (value === CHAR_RIGHT_CURLY_BRACE) {
          if (block.type !== "brace") {
            push({ type: "text", value });
            continue;
          }
          const type = "close";
          block = stack.pop();
          block.close = true;
          push({ type, value });
          depth--;
          block = stack[stack.length - 1];
          continue;
        }
        if (value === CHAR_COMMA && depth > 0) {
          if (block.ranges > 0) {
            block.ranges = 0;
            const open = block.nodes.shift();
            block.nodes = [open, { type: "text", value: stringify(block) }];
          }
          push({ type: "comma", value });
          block.commas++;
          continue;
        }
        if (value === CHAR_DOT && depth > 0 && block.commas === 0) {
          const siblings = block.nodes;
          if (depth === 0 || siblings.length === 0) {
            push({ type: "text", value });
            continue;
          }
          if (prev.type === "dot") {
            block.range = [];
            prev.value += value;
            prev.type = "range";
            if (block.nodes.length !== 3 && block.nodes.length !== 5) {
              block.invalid = true;
              block.ranges = 0;
              prev.type = "text";
              continue;
            }
            block.ranges++;
            block.args = [];
            continue;
          }
          if (prev.type === "range") {
            siblings.pop();
            const before = siblings[siblings.length - 1];
            before.value += prev.value + value;
            prev = before;
            block.ranges--;
            continue;
          }
          push({ type: "dot", value });
          continue;
        }
        push({ type: "text", value });
      }
      do {
        block = stack.pop();
        if (block.type !== "root") {
          block.nodes.forEach((node) => {
            if (!node.nodes) {
              if (node.type === "open") node.isOpen = true;
              if (node.type === "close") node.isClose = true;
              if (!node.nodes) node.type = "text";
              node.invalid = true;
            }
          });
          const parent = stack[stack.length - 1];
          const index2 = parent.nodes.indexOf(block);
          parent.nodes.splice(index2, 1, ...block.nodes);
        }
      } while (stack.length > 0);
      push({ type: "eos" });
      return ast;
    };
    module2.exports = parse;
  }
});

// ../../node_modules/.pnpm/braces@3.0.3/node_modules/braces/index.js
var require_braces = __commonJS({
  "../../node_modules/.pnpm/braces@3.0.3/node_modules/braces/index.js"(exports2, module2) {
    "use strict";
    var stringify = require_stringify();
    var compile = require_compile();
    var expand = require_expand();
    var parse = require_parse();
    var braces = (input, options = {}) => {
      let output = [];
      if (Array.isArray(input)) {
        for (const pattern of input) {
          const result = braces.create(pattern, options);
          if (Array.isArray(result)) {
            output.push(...result);
          } else {
            output.push(result);
          }
        }
      } else {
        output = [].concat(braces.create(input, options));
      }
      if (options && options.expand === true && options.nodupes === true) {
        output = [...new Set(output)];
      }
      return output;
    };
    braces.parse = (input, options = {}) => parse(input, options);
    braces.stringify = (input, options = {}) => {
      if (typeof input === "string") {
        return stringify(braces.parse(input, options), options);
      }
      return stringify(input, options);
    };
    braces.compile = (input, options = {}) => {
      if (typeof input === "string") {
        input = braces.parse(input, options);
      }
      return compile(input, options);
    };
    braces.expand = (input, options = {}) => {
      if (typeof input === "string") {
        input = braces.parse(input, options);
      }
      let result = expand(input, options);
      if (options.noempty === true) {
        result = result.filter(Boolean);
      }
      if (options.nodupes === true) {
        result = [...new Set(result)];
      }
      return result;
    };
    braces.create = (input, options = {}) => {
      if (input === "" || input.length < 3) {
        return [input];
      }
      return options.expand !== true ? braces.compile(input, options) : braces.expand(input, options);
    };
    module2.exports = braces;
  }
});

// ../../node_modules/.pnpm/picomatch@2.3.1/node_modules/picomatch/lib/constants.js
var require_constants2 = __commonJS({
  "../../node_modules/.pnpm/picomatch@2.3.1/node_modules/picomatch/lib/constants.js"(exports2, module2) {
    "use strict";
    var path4 = require("path");
    var WIN_SLASH = "\\\\/";
    var WIN_NO_SLASH = `[^${WIN_SLASH}]`;
    var DOT_LITERAL = "\\.";
    var PLUS_LITERAL = "\\+";
    var QMARK_LITERAL = "\\?";
    var SLASH_LITERAL = "\\/";
    var ONE_CHAR = "(?=.)";
    var QMARK = "[^/]";
    var END_ANCHOR = `(?:${SLASH_LITERAL}|$)`;
    var START_ANCHOR = `(?:^|${SLASH_LITERAL})`;
    var DOTS_SLASH = `${DOT_LITERAL}{1,2}${END_ANCHOR}`;
    var NO_DOT = `(?!${DOT_LITERAL})`;
    var NO_DOTS = `(?!${START_ANCHOR}${DOTS_SLASH})`;
    var NO_DOT_SLASH = `(?!${DOT_LITERAL}{0,1}${END_ANCHOR})`;
    var NO_DOTS_SLASH = `(?!${DOTS_SLASH})`;
    var QMARK_NO_DOT = `[^.${SLASH_LITERAL}]`;
    var STAR = `${QMARK}*?`;
    var POSIX_CHARS = {
      DOT_LITERAL,
      PLUS_LITERAL,
      QMARK_LITERAL,
      SLASH_LITERAL,
      ONE_CHAR,
      QMARK,
      END_ANCHOR,
      DOTS_SLASH,
      NO_DOT,
      NO_DOTS,
      NO_DOT_SLASH,
      NO_DOTS_SLASH,
      QMARK_NO_DOT,
      STAR,
      START_ANCHOR
    };
    var WINDOWS_CHARS = {
      ...POSIX_CHARS,
      SLASH_LITERAL: `[${WIN_SLASH}]`,
      QMARK: WIN_NO_SLASH,
      STAR: `${WIN_NO_SLASH}*?`,
      DOTS_SLASH: `${DOT_LITERAL}{1,2}(?:[${WIN_SLASH}]|$)`,
      NO_DOT: `(?!${DOT_LITERAL})`,
      NO_DOTS: `(?!(?:^|[${WIN_SLASH}])${DOT_LITERAL}{1,2}(?:[${WIN_SLASH}]|$))`,
      NO_DOT_SLASH: `(?!${DOT_LITERAL}{0,1}(?:[${WIN_SLASH}]|$))`,
      NO_DOTS_SLASH: `(?!${DOT_LITERAL}{1,2}(?:[${WIN_SLASH}]|$))`,
      QMARK_NO_DOT: `[^.${WIN_SLASH}]`,
      START_ANCHOR: `(?:^|[${WIN_SLASH}])`,
      END_ANCHOR: `(?:[${WIN_SLASH}]|$)`
    };
    var POSIX_REGEX_SOURCE = {
      alnum: "a-zA-Z0-9",
      alpha: "a-zA-Z",
      ascii: "\\x00-\\x7F",
      blank: " \\t",
      cntrl: "\\x00-\\x1F\\x7F",
      digit: "0-9",
      graph: "\\x21-\\x7E",
      lower: "a-z",
      print: "\\x20-\\x7E ",
      punct: "\\-!\"#$%&'()\\*+,./:;<=>?@[\\]^_`{|}~",
      space: " \\t\\r\\n\\v\\f",
      upper: "A-Z",
      word: "A-Za-z0-9_",
      xdigit: "A-Fa-f0-9"
    };
    module2.exports = {
      MAX_LENGTH: 1024 * 64,
      POSIX_REGEX_SOURCE,
      // regular expressions
      REGEX_BACKSLASH: /\\(?![*+?^${}(|)[\]])/g,
      REGEX_NON_SPECIAL_CHARS: /^[^@![\].,$*+?^{}()|\\/]+/,
      REGEX_SPECIAL_CHARS: /[-*+?.^${}(|)[\]]/,
      REGEX_SPECIAL_CHARS_BACKREF: /(\\?)((\W)(\3*))/g,
      REGEX_SPECIAL_CHARS_GLOBAL: /([-*+?.^${}(|)[\]])/g,
      REGEX_REMOVE_BACKSLASH: /(?:\[.*?[^\\]\]|\\(?=.))/g,
      // Replace globs with equivalent patterns to reduce parsing time.
      REPLACEMENTS: {
        "***": "*",
        "**/**": "**",
        "**/**/**": "**"
      },
      // Digits
      CHAR_0: 48,
      /* 0 */
      CHAR_9: 57,
      /* 9 */
      // Alphabet chars.
      CHAR_UPPERCASE_A: 65,
      /* A */
      CHAR_LOWERCASE_A: 97,
      /* a */
      CHAR_UPPERCASE_Z: 90,
      /* Z */
      CHAR_LOWERCASE_Z: 122,
      /* z */
      CHAR_LEFT_PARENTHESES: 40,
      /* ( */
      CHAR_RIGHT_PARENTHESES: 41,
      /* ) */
      CHAR_ASTERISK: 42,
      /* * */
      // Non-alphabetic chars.
      CHAR_AMPERSAND: 38,
      /* & */
      CHAR_AT: 64,
      /* @ */
      CHAR_BACKWARD_SLASH: 92,
      /* \ */
      CHAR_CARRIAGE_RETURN: 13,
      /* \r */
      CHAR_CIRCUMFLEX_ACCENT: 94,
      /* ^ */
      CHAR_COLON: 58,
      /* : */
      CHAR_COMMA: 44,
      /* , */
      CHAR_DOT: 46,
      /* . */
      CHAR_DOUBLE_QUOTE: 34,
      /* " */
      CHAR_EQUAL: 61,
      /* = */
      CHAR_EXCLAMATION_MARK: 33,
      /* ! */
      CHAR_FORM_FEED: 12,
      /* \f */
      CHAR_FORWARD_SLASH: 47,
      /* / */
      CHAR_GRAVE_ACCENT: 96,
      /* ` */
      CHAR_HASH: 35,
      /* # */
      CHAR_HYPHEN_MINUS: 45,
      /* - */
      CHAR_LEFT_ANGLE_BRACKET: 60,
      /* < */
      CHAR_LEFT_CURLY_BRACE: 123,
      /* { */
      CHAR_LEFT_SQUARE_BRACKET: 91,
      /* [ */
      CHAR_LINE_FEED: 10,
      /* \n */
      CHAR_NO_BREAK_SPACE: 160,
      /* \u00A0 */
      CHAR_PERCENT: 37,
      /* % */
      CHAR_PLUS: 43,
      /* + */
      CHAR_QUESTION_MARK: 63,
      /* ? */
      CHAR_RIGHT_ANGLE_BRACKET: 62,
      /* > */
      CHAR_RIGHT_CURLY_BRACE: 125,
      /* } */
      CHAR_RIGHT_SQUARE_BRACKET: 93,
      /* ] */
      CHAR_SEMICOLON: 59,
      /* ; */
      CHAR_SINGLE_QUOTE: 39,
      /* ' */
      CHAR_SPACE: 32,
      /*   */
      CHAR_TAB: 9,
      /* \t */
      CHAR_UNDERSCORE: 95,
      /* _ */
      CHAR_VERTICAL_LINE: 124,
      /* | */
      CHAR_ZERO_WIDTH_NOBREAK_SPACE: 65279,
      /* \uFEFF */
      SEP: path4.sep,
      /**
       * Create EXTGLOB_CHARS
       */
      extglobChars(chars) {
        return {
          "!": { type: "negate", open: "(?:(?!(?:", close: `))${chars.STAR})` },
          "?": { type: "qmark", open: "(?:", close: ")?" },
          "+": { type: "plus", open: "(?:", close: ")+" },
          "*": { type: "star", open: "(?:", close: ")*" },
          "@": { type: "at", open: "(?:", close: ")" }
        };
      },
      /**
       * Create GLOB_CHARS
       */
      globChars(win32) {
        return win32 === true ? WINDOWS_CHARS : POSIX_CHARS;
      }
    };
  }
});

// ../../node_modules/.pnpm/picomatch@2.3.1/node_modules/picomatch/lib/utils.js
var require_utils2 = __commonJS({
  "../../node_modules/.pnpm/picomatch@2.3.1/node_modules/picomatch/lib/utils.js"(exports2) {
    "use strict";
    var path4 = require("path");
    var win32 = process.platform === "win32";
    var {
      REGEX_BACKSLASH,
      REGEX_REMOVE_BACKSLASH,
      REGEX_SPECIAL_CHARS,
      REGEX_SPECIAL_CHARS_GLOBAL
    } = require_constants2();
    exports2.isObject = (val) => val !== null && typeof val === "object" && !Array.isArray(val);
    exports2.hasRegexChars = (str) => REGEX_SPECIAL_CHARS.test(str);
    exports2.isRegexChar = (str) => str.length === 1 && exports2.hasRegexChars(str);
    exports2.escapeRegex = (str) => str.replace(REGEX_SPECIAL_CHARS_GLOBAL, "\\$1");
    exports2.toPosixSlashes = (str) => str.replace(REGEX_BACKSLASH, "/");
    exports2.removeBackslashes = (str) => {
      return str.replace(REGEX_REMOVE_BACKSLASH, (match) => {
        return match === "\\" ? "" : match;
      });
    };
    exports2.supportsLookbehinds = () => {
      const segs = process.version.slice(1).split(".").map(Number);
      if (segs.length === 3 && segs[0] >= 9 || segs[0] === 8 && segs[1] >= 10) {
        return true;
      }
      return false;
    };
    exports2.isWindows = (options) => {
      if (options && typeof options.windows === "boolean") {
        return options.windows;
      }
      return win32 === true || path4.sep === "\\";
    };
    exports2.escapeLast = (input, char, lastIdx) => {
      const idx = input.lastIndexOf(char, lastIdx);
      if (idx === -1) return input;
      if (input[idx - 1] === "\\") return exports2.escapeLast(input, char, idx - 1);
      return `${input.slice(0, idx)}\\${input.slice(idx)}`;
    };
    exports2.removePrefix = (input, state = {}) => {
      let output = input;
      if (output.startsWith("./")) {
        output = output.slice(2);
        state.prefix = "./";
      }
      return output;
    };
    exports2.wrapOutput = (input, state = {}, options = {}) => {
      const prepend = options.contains ? "" : "^";
      const append = options.contains ? "" : "$";
      let output = `${prepend}(?:${input})${append}`;
      if (state.negated === true) {
        output = `(?:^(?!${output}).*$)`;
      }
      return output;
    };
  }
});

// ../../node_modules/.pnpm/picomatch@2.3.1/node_modules/picomatch/lib/scan.js
var require_scan = __commonJS({
  "../../node_modules/.pnpm/picomatch@2.3.1/node_modules/picomatch/lib/scan.js"(exports2, module2) {
    "use strict";
    var utils = require_utils2();
    var {
      CHAR_ASTERISK,
      /* * */
      CHAR_AT,
      /* @ */
      CHAR_BACKWARD_SLASH,
      /* \ */
      CHAR_COMMA,
      /* , */
      CHAR_DOT,
      /* . */
      CHAR_EXCLAMATION_MARK,
      /* ! */
      CHAR_FORWARD_SLASH,
      /* / */
      CHAR_LEFT_CURLY_BRACE,
      /* { */
      CHAR_LEFT_PARENTHESES,
      /* ( */
      CHAR_LEFT_SQUARE_BRACKET,
      /* [ */
      CHAR_PLUS,
      /* + */
      CHAR_QUESTION_MARK,
      /* ? */
      CHAR_RIGHT_CURLY_BRACE,
      /* } */
      CHAR_RIGHT_PARENTHESES,
      /* ) */
      CHAR_RIGHT_SQUARE_BRACKET
      /* ] */
    } = require_constants2();
    var isPathSeparator = (code) => {
      return code === CHAR_FORWARD_SLASH || code === CHAR_BACKWARD_SLASH;
    };
    var depth = (token) => {
      if (token.isPrefix !== true) {
        token.depth = token.isGlobstar ? Infinity : 1;
      }
    };
    var scan = (input, options) => {
      const opts = options || {};
      const length = input.length - 1;
      const scanToEnd = opts.parts === true || opts.scanToEnd === true;
      const slashes = [];
      const tokens = [];
      const parts = [];
      let str = input;
      let index = -1;
      let start = 0;
      let lastIndex = 0;
      let isBrace = false;
      let isBracket = false;
      let isGlob = false;
      let isExtglob = false;
      let isGlobstar = false;
      let braceEscaped = false;
      let backslashes = false;
      let negated = false;
      let negatedExtglob = false;
      let finished = false;
      let braces = 0;
      let prev;
      let code;
      let token = { value: "", depth: 0, isGlob: false };
      const eos = () => index >= length;
      const peek = () => str.charCodeAt(index + 1);
      const advance = () => {
        prev = code;
        return str.charCodeAt(++index);
      };
      while (index < length) {
        code = advance();
        let next;
        if (code === CHAR_BACKWARD_SLASH) {
          backslashes = token.backslashes = true;
          code = advance();
          if (code === CHAR_LEFT_CURLY_BRACE) {
            braceEscaped = true;
          }
          continue;
        }
        if (braceEscaped === true || code === CHAR_LEFT_CURLY_BRACE) {
          braces++;
          while (eos() !== true && (code = advance())) {
            if (code === CHAR_BACKWARD_SLASH) {
              backslashes = token.backslashes = true;
              advance();
              continue;
            }
            if (code === CHAR_LEFT_CURLY_BRACE) {
              braces++;
              continue;
            }
            if (braceEscaped !== true && code === CHAR_DOT && (code = advance()) === CHAR_DOT) {
              isBrace = token.isBrace = true;
              isGlob = token.isGlob = true;
              finished = true;
              if (scanToEnd === true) {
                continue;
              }
              break;
            }
            if (braceEscaped !== true && code === CHAR_COMMA) {
              isBrace = token.isBrace = true;
              isGlob = token.isGlob = true;
              finished = true;
              if (scanToEnd === true) {
                continue;
              }
              break;
            }
            if (code === CHAR_RIGHT_CURLY_BRACE) {
              braces--;
              if (braces === 0) {
                braceEscaped = false;
                isBrace = token.isBrace = true;
                finished = true;
                break;
              }
            }
          }
          if (scanToEnd === true) {
            continue;
          }
          break;
        }
        if (code === CHAR_FORWARD_SLASH) {
          slashes.push(index);
          tokens.push(token);
          token = { value: "", depth: 0, isGlob: false };
          if (finished === true) continue;
          if (prev === CHAR_DOT && index === start + 1) {
            start += 2;
            continue;
          }
          lastIndex = index + 1;
          continue;
        }
        if (opts.noext !== true) {
          const isExtglobChar = code === CHAR_PLUS || code === CHAR_AT || code === CHAR_ASTERISK || code === CHAR_QUESTION_MARK || code === CHAR_EXCLAMATION_MARK;
          if (isExtglobChar === true && peek() === CHAR_LEFT_PARENTHESES) {
            isGlob = token.isGlob = true;
            isExtglob = token.isExtglob = true;
            finished = true;
            if (code === CHAR_EXCLAMATION_MARK && index === start) {
              negatedExtglob = true;
            }
            if (scanToEnd === true) {
              while (eos() !== true && (code = advance())) {
                if (code === CHAR_BACKWARD_SLASH) {
                  backslashes = token.backslashes = true;
                  code = advance();
                  continue;
                }
                if (code === CHAR_RIGHT_PARENTHESES) {
                  isGlob = token.isGlob = true;
                  finished = true;
                  break;
                }
              }
              continue;
            }
            break;
          }
        }
        if (code === CHAR_ASTERISK) {
          if (prev === CHAR_ASTERISK) isGlobstar = token.isGlobstar = true;
          isGlob = token.isGlob = true;
          finished = true;
          if (scanToEnd === true) {
            continue;
          }
          break;
        }
        if (code === CHAR_QUESTION_MARK) {
          isGlob = token.isGlob = true;
          finished = true;
          if (scanToEnd === true) {
            continue;
          }
          break;
        }
        if (code === CHAR_LEFT_SQUARE_BRACKET) {
          while (eos() !== true && (next = advance())) {
            if (next === CHAR_BACKWARD_SLASH) {
              backslashes = token.backslashes = true;
              advance();
              continue;
            }
            if (next === CHAR_RIGHT_SQUARE_BRACKET) {
              isBracket = token.isBracket = true;
              isGlob = token.isGlob = true;
              finished = true;
              break;
            }
          }
          if (scanToEnd === true) {
            continue;
          }
          break;
        }
        if (opts.nonegate !== true && code === CHAR_EXCLAMATION_MARK && index === start) {
          negated = token.negated = true;
          start++;
          continue;
        }
        if (opts.noparen !== true && code === CHAR_LEFT_PARENTHESES) {
          isGlob = token.isGlob = true;
          if (scanToEnd === true) {
            while (eos() !== true && (code = advance())) {
              if (code === CHAR_LEFT_PARENTHESES) {
                backslashes = token.backslashes = true;
                code = advance();
                continue;
              }
              if (code === CHAR_RIGHT_PARENTHESES) {
                finished = true;
                break;
              }
            }
            continue;
          }
          break;
        }
        if (isGlob === true) {
          finished = true;
          if (scanToEnd === true) {
            continue;
          }
          break;
        }
      }
      if (opts.noext === true) {
        isExtglob = false;
        isGlob = false;
      }
      let base = str;
      let prefix = "";
      let glob4 = "";
      if (start > 0) {
        prefix = str.slice(0, start);
        str = str.slice(start);
        lastIndex -= start;
      }
      if (base && isGlob === true && lastIndex > 0) {
        base = str.slice(0, lastIndex);
        glob4 = str.slice(lastIndex);
      } else if (isGlob === true) {
        base = "";
        glob4 = str;
      } else {
        base = str;
      }
      if (base && base !== "" && base !== "/" && base !== str) {
        if (isPathSeparator(base.charCodeAt(base.length - 1))) {
          base = base.slice(0, -1);
        }
      }
      if (opts.unescape === true) {
        if (glob4) glob4 = utils.removeBackslashes(glob4);
        if (base && backslashes === true) {
          base = utils.removeBackslashes(base);
        }
      }
      const state = {
        prefix,
        input,
        start,
        base,
        glob: glob4,
        isBrace,
        isBracket,
        isGlob,
        isExtglob,
        isGlobstar,
        negated,
        negatedExtglob
      };
      if (opts.tokens === true) {
        state.maxDepth = 0;
        if (!isPathSeparator(code)) {
          tokens.push(token);
        }
        state.tokens = tokens;
      }
      if (opts.parts === true || opts.tokens === true) {
        let prevIndex;
        for (let idx = 0; idx < slashes.length; idx++) {
          const n = prevIndex ? prevIndex + 1 : start;
          const i = slashes[idx];
          const value = input.slice(n, i);
          if (opts.tokens) {
            if (idx === 0 && start !== 0) {
              tokens[idx].isPrefix = true;
              tokens[idx].value = prefix;
            } else {
              tokens[idx].value = value;
            }
            depth(tokens[idx]);
            state.maxDepth += tokens[idx].depth;
          }
          if (idx !== 0 || value !== "") {
            parts.push(value);
          }
          prevIndex = i;
        }
        if (prevIndex && prevIndex + 1 < input.length) {
          const value = input.slice(prevIndex + 1);
          parts.push(value);
          if (opts.tokens) {
            tokens[tokens.length - 1].value = value;
            depth(tokens[tokens.length - 1]);
            state.maxDepth += tokens[tokens.length - 1].depth;
          }
        }
        state.slashes = slashes;
        state.parts = parts;
      }
      return state;
    };
    module2.exports = scan;
  }
});

// ../../node_modules/.pnpm/picomatch@2.3.1/node_modules/picomatch/lib/parse.js
var require_parse2 = __commonJS({
  "../../node_modules/.pnpm/picomatch@2.3.1/node_modules/picomatch/lib/parse.js"(exports2, module2) {
    "use strict";
    var constants = require_constants2();
    var utils = require_utils2();
    var {
      MAX_LENGTH,
      POSIX_REGEX_SOURCE,
      REGEX_NON_SPECIAL_CHARS,
      REGEX_SPECIAL_CHARS_BACKREF,
      REPLACEMENTS
    } = constants;
    var expandRange = (args, options) => {
      if (typeof options.expandRange === "function") {
        return options.expandRange(...args, options);
      }
      args.sort();
      const value = `[${args.join("-")}]`;
      try {
        new RegExp(value);
      } catch (ex) {
        return args.map((v) => utils.escapeRegex(v)).join("..");
      }
      return value;
    };
    var syntaxError = (type, char) => {
      return `Missing ${type}: "${char}" - use "\\\\${char}" to match literal characters`;
    };
    var parse = (input, options) => {
      if (typeof input !== "string") {
        throw new TypeError("Expected a string");
      }
      input = REPLACEMENTS[input] || input;
      const opts = { ...options };
      const max = typeof opts.maxLength === "number" ? Math.min(MAX_LENGTH, opts.maxLength) : MAX_LENGTH;
      let len = input.length;
      if (len > max) {
        throw new SyntaxError(`Input length: ${len}, exceeds maximum allowed length: ${max}`);
      }
      const bos = { type: "bos", value: "", output: opts.prepend || "" };
      const tokens = [bos];
      const capture = opts.capture ? "" : "?:";
      const win32 = utils.isWindows(options);
      const PLATFORM_CHARS = constants.globChars(win32);
      const EXTGLOB_CHARS = constants.extglobChars(PLATFORM_CHARS);
      const {
        DOT_LITERAL,
        PLUS_LITERAL,
        SLASH_LITERAL,
        ONE_CHAR,
        DOTS_SLASH,
        NO_DOT,
        NO_DOT_SLASH,
        NO_DOTS_SLASH,
        QMARK,
        QMARK_NO_DOT,
        STAR,
        START_ANCHOR
      } = PLATFORM_CHARS;
      const globstar = (opts2) => {
        return `(${capture}(?:(?!${START_ANCHOR}${opts2.dot ? DOTS_SLASH : DOT_LITERAL}).)*?)`;
      };
      const nodot = opts.dot ? "" : NO_DOT;
      const qmarkNoDot = opts.dot ? QMARK : QMARK_NO_DOT;
      let star = opts.bash === true ? globstar(opts) : STAR;
      if (opts.capture) {
        star = `(${star})`;
      }
      if (typeof opts.noext === "boolean") {
        opts.noextglob = opts.noext;
      }
      const state = {
        input,
        index: -1,
        start: 0,
        dot: opts.dot === true,
        consumed: "",
        output: "",
        prefix: "",
        backtrack: false,
        negated: false,
        brackets: 0,
        braces: 0,
        parens: 0,
        quotes: 0,
        globstar: false,
        tokens
      };
      input = utils.removePrefix(input, state);
      len = input.length;
      const extglobs = [];
      const braces = [];
      const stack = [];
      let prev = bos;
      let value;
      const eos = () => state.index === len - 1;
      const peek = state.peek = (n = 1) => input[state.index + n];
      const advance = state.advance = () => input[++state.index] || "";
      const remaining = () => input.slice(state.index + 1);
      const consume = (value2 = "", num = 0) => {
        state.consumed += value2;
        state.index += num;
      };
      const append = (token) => {
        state.output += token.output != null ? token.output : token.value;
        consume(token.value);
      };
      const negate = () => {
        let count = 1;
        while (peek() === "!" && (peek(2) !== "(" || peek(3) === "?")) {
          advance();
          state.start++;
          count++;
        }
        if (count % 2 === 0) {
          return false;
        }
        state.negated = true;
        state.start++;
        return true;
      };
      const increment = (type) => {
        state[type]++;
        stack.push(type);
      };
      const decrement = (type) => {
        state[type]--;
        stack.pop();
      };
      const push = (tok) => {
        if (prev.type === "globstar") {
          const isBrace = state.braces > 0 && (tok.type === "comma" || tok.type === "brace");
          const isExtglob = tok.extglob === true || extglobs.length && (tok.type === "pipe" || tok.type === "paren");
          if (tok.type !== "slash" && tok.type !== "paren" && !isBrace && !isExtglob) {
            state.output = state.output.slice(0, -prev.output.length);
            prev.type = "star";
            prev.value = "*";
            prev.output = star;
            state.output += prev.output;
          }
        }
        if (extglobs.length && tok.type !== "paren") {
          extglobs[extglobs.length - 1].inner += tok.value;
        }
        if (tok.value || tok.output) append(tok);
        if (prev && prev.type === "text" && tok.type === "text") {
          prev.value += tok.value;
          prev.output = (prev.output || "") + tok.value;
          return;
        }
        tok.prev = prev;
        tokens.push(tok);
        prev = tok;
      };
      const extglobOpen = (type, value2) => {
        const token = { ...EXTGLOB_CHARS[value2], conditions: 1, inner: "" };
        token.prev = prev;
        token.parens = state.parens;
        token.output = state.output;
        const output = (opts.capture ? "(" : "") + token.open;
        increment("parens");
        push({ type, value: value2, output: state.output ? "" : ONE_CHAR });
        push({ type: "paren", extglob: true, value: advance(), output });
        extglobs.push(token);
      };
      const extglobClose = (token) => {
        let output = token.close + (opts.capture ? ")" : "");
        let rest;
        if (token.type === "negate") {
          let extglobStar = star;
          if (token.inner && token.inner.length > 1 && token.inner.includes("/")) {
            extglobStar = globstar(opts);
          }
          if (extglobStar !== star || eos() || /^\)+$/.test(remaining())) {
            output = token.close = `)$))${extglobStar}`;
          }
          if (token.inner.includes("*") && (rest = remaining()) && /^\.[^\\/.]+$/.test(rest)) {
            const expression = parse(rest, { ...options, fastpaths: false }).output;
            output = token.close = `)${expression})${extglobStar})`;
          }
          if (token.prev.type === "bos") {
            state.negatedExtglob = true;
          }
        }
        push({ type: "paren", extglob: true, value, output });
        decrement("parens");
      };
      if (opts.fastpaths !== false && !/(^[*!]|[/()[\]{}"])/.test(input)) {
        let backslashes = false;
        let output = input.replace(REGEX_SPECIAL_CHARS_BACKREF, (m, esc, chars, first, rest, index) => {
          if (first === "\\") {
            backslashes = true;
            return m;
          }
          if (first === "?") {
            if (esc) {
              return esc + first + (rest ? QMARK.repeat(rest.length) : "");
            }
            if (index === 0) {
              return qmarkNoDot + (rest ? QMARK.repeat(rest.length) : "");
            }
            return QMARK.repeat(chars.length);
          }
          if (first === ".") {
            return DOT_LITERAL.repeat(chars.length);
          }
          if (first === "*") {
            if (esc) {
              return esc + first + (rest ? star : "");
            }
            return star;
          }
          return esc ? m : `\\${m}`;
        });
        if (backslashes === true) {
          if (opts.unescape === true) {
            output = output.replace(/\\/g, "");
          } else {
            output = output.replace(/\\+/g, (m) => {
              return m.length % 2 === 0 ? "\\\\" : m ? "\\" : "";
            });
          }
        }
        if (output === input && opts.contains === true) {
          state.output = input;
          return state;
        }
        state.output = utils.wrapOutput(output, state, options);
        return state;
      }
      while (!eos()) {
        value = advance();
        if (value === "\0") {
          continue;
        }
        if (value === "\\") {
          const next = peek();
          if (next === "/" && opts.bash !== true) {
            continue;
          }
          if (next === "." || next === ";") {
            continue;
          }
          if (!next) {
            value += "\\";
            push({ type: "text", value });
            continue;
          }
          const match = /^\\+/.exec(remaining());
          let slashes = 0;
          if (match && match[0].length > 2) {
            slashes = match[0].length;
            state.index += slashes;
            if (slashes % 2 !== 0) {
              value += "\\";
            }
          }
          if (opts.unescape === true) {
            value = advance();
          } else {
            value += advance();
          }
          if (state.brackets === 0) {
            push({ type: "text", value });
            continue;
          }
        }
        if (state.brackets > 0 && (value !== "]" || prev.value === "[" || prev.value === "[^")) {
          if (opts.posix !== false && value === ":") {
            const inner = prev.value.slice(1);
            if (inner.includes("[")) {
              prev.posix = true;
              if (inner.includes(":")) {
                const idx = prev.value.lastIndexOf("[");
                const pre = prev.value.slice(0, idx);
                const rest2 = prev.value.slice(idx + 2);
                const posix = POSIX_REGEX_SOURCE[rest2];
                if (posix) {
                  prev.value = pre + posix;
                  state.backtrack = true;
                  advance();
                  if (!bos.output && tokens.indexOf(prev) === 1) {
                    bos.output = ONE_CHAR;
                  }
                  continue;
                }
              }
            }
          }
          if (value === "[" && peek() !== ":" || value === "-" && peek() === "]") {
            value = `\\${value}`;
          }
          if (value === "]" && (prev.value === "[" || prev.value === "[^")) {
            value = `\\${value}`;
          }
          if (opts.posix === true && value === "!" && prev.value === "[") {
            value = "^";
          }
          prev.value += value;
          append({ value });
          continue;
        }
        if (state.quotes === 1 && value !== '"') {
          value = utils.escapeRegex(value);
          prev.value += value;
          append({ value });
          continue;
        }
        if (value === '"') {
          state.quotes = state.quotes === 1 ? 0 : 1;
          if (opts.keepQuotes === true) {
            push({ type: "text", value });
          }
          continue;
        }
        if (value === "(") {
          increment("parens");
          push({ type: "paren", value });
          continue;
        }
        if (value === ")") {
          if (state.parens === 0 && opts.strictBrackets === true) {
            throw new SyntaxError(syntaxError("opening", "("));
          }
          const extglob = extglobs[extglobs.length - 1];
          if (extglob && state.parens === extglob.parens + 1) {
            extglobClose(extglobs.pop());
            continue;
          }
          push({ type: "paren", value, output: state.parens ? ")" : "\\)" });
          decrement("parens");
          continue;
        }
        if (value === "[") {
          if (opts.nobracket === true || !remaining().includes("]")) {
            if (opts.nobracket !== true && opts.strictBrackets === true) {
              throw new SyntaxError(syntaxError("closing", "]"));
            }
            value = `\\${value}`;
          } else {
            increment("brackets");
          }
          push({ type: "bracket", value });
          continue;
        }
        if (value === "]") {
          if (opts.nobracket === true || prev && prev.type === "bracket" && prev.value.length === 1) {
            push({ type: "text", value, output: `\\${value}` });
            continue;
          }
          if (state.brackets === 0) {
            if (opts.strictBrackets === true) {
              throw new SyntaxError(syntaxError("opening", "["));
            }
            push({ type: "text", value, output: `\\${value}` });
            continue;
          }
          decrement("brackets");
          const prevValue = prev.value.slice(1);
          if (prev.posix !== true && prevValue[0] === "^" && !prevValue.includes("/")) {
            value = `/${value}`;
          }
          prev.value += value;
          append({ value });
          if (opts.literalBrackets === false || utils.hasRegexChars(prevValue)) {
            continue;
          }
          const escaped = utils.escapeRegex(prev.value);
          state.output = state.output.slice(0, -prev.value.length);
          if (opts.literalBrackets === true) {
            state.output += escaped;
            prev.value = escaped;
            continue;
          }
          prev.value = `(${capture}${escaped}|${prev.value})`;
          state.output += prev.value;
          continue;
        }
        if (value === "{" && opts.nobrace !== true) {
          increment("braces");
          const open = {
            type: "brace",
            value,
            output: "(",
            outputIndex: state.output.length,
            tokensIndex: state.tokens.length
          };
          braces.push(open);
          push(open);
          continue;
        }
        if (value === "}") {
          const brace = braces[braces.length - 1];
          if (opts.nobrace === true || !brace) {
            push({ type: "text", value, output: value });
            continue;
          }
          let output = ")";
          if (brace.dots === true) {
            const arr = tokens.slice();
            const range = [];
            for (let i = arr.length - 1; i >= 0; i--) {
              tokens.pop();
              if (arr[i].type === "brace") {
                break;
              }
              if (arr[i].type !== "dots") {
                range.unshift(arr[i].value);
              }
            }
            output = expandRange(range, opts);
            state.backtrack = true;
          }
          if (brace.comma !== true && brace.dots !== true) {
            const out = state.output.slice(0, brace.outputIndex);
            const toks = state.tokens.slice(brace.tokensIndex);
            brace.value = brace.output = "\\{";
            value = output = "\\}";
            state.output = out;
            for (const t of toks) {
              state.output += t.output || t.value;
            }
          }
          push({ type: "brace", value, output });
          decrement("braces");
          braces.pop();
          continue;
        }
        if (value === "|") {
          if (extglobs.length > 0) {
            extglobs[extglobs.length - 1].conditions++;
          }
          push({ type: "text", value });
          continue;
        }
        if (value === ",") {
          let output = value;
          const brace = braces[braces.length - 1];
          if (brace && stack[stack.length - 1] === "braces") {
            brace.comma = true;
            output = "|";
          }
          push({ type: "comma", value, output });
          continue;
        }
        if (value === "/") {
          if (prev.type === "dot" && state.index === state.start + 1) {
            state.start = state.index + 1;
            state.consumed = "";
            state.output = "";
            tokens.pop();
            prev = bos;
            continue;
          }
          push({ type: "slash", value, output: SLASH_LITERAL });
          continue;
        }
        if (value === ".") {
          if (state.braces > 0 && prev.type === "dot") {
            if (prev.value === ".") prev.output = DOT_LITERAL;
            const brace = braces[braces.length - 1];
            prev.type = "dots";
            prev.output += value;
            prev.value += value;
            brace.dots = true;
            continue;
          }
          if (state.braces + state.parens === 0 && prev.type !== "bos" && prev.type !== "slash") {
            push({ type: "text", value, output: DOT_LITERAL });
            continue;
          }
          push({ type: "dot", value, output: DOT_LITERAL });
          continue;
        }
        if (value === "?") {
          const isGroup = prev && prev.value === "(";
          if (!isGroup && opts.noextglob !== true && peek() === "(" && peek(2) !== "?") {
            extglobOpen("qmark", value);
            continue;
          }
          if (prev && prev.type === "paren") {
            const next = peek();
            let output = value;
            if (next === "<" && !utils.supportsLookbehinds()) {
              throw new Error("Node.js v10 or higher is required for regex lookbehinds");
            }
            if (prev.value === "(" && !/[!=<:]/.test(next) || next === "<" && !/<([!=]|\w+>)/.test(remaining())) {
              output = `\\${value}`;
            }
            push({ type: "text", value, output });
            continue;
          }
          if (opts.dot !== true && (prev.type === "slash" || prev.type === "bos")) {
            push({ type: "qmark", value, output: QMARK_NO_DOT });
            continue;
          }
          push({ type: "qmark", value, output: QMARK });
          continue;
        }
        if (value === "!") {
          if (opts.noextglob !== true && peek() === "(") {
            if (peek(2) !== "?" || !/[!=<:]/.test(peek(3))) {
              extglobOpen("negate", value);
              continue;
            }
          }
          if (opts.nonegate !== true && state.index === 0) {
            negate();
            continue;
          }
        }
        if (value === "+") {
          if (opts.noextglob !== true && peek() === "(" && peek(2) !== "?") {
            extglobOpen("plus", value);
            continue;
          }
          if (prev && prev.value === "(" || opts.regex === false) {
            push({ type: "plus", value, output: PLUS_LITERAL });
            continue;
          }
          if (prev && (prev.type === "bracket" || prev.type === "paren" || prev.type === "brace") || state.parens > 0) {
            push({ type: "plus", value });
            continue;
          }
          push({ type: "plus", value: PLUS_LITERAL });
          continue;
        }
        if (value === "@") {
          if (opts.noextglob !== true && peek() === "(" && peek(2) !== "?") {
            push({ type: "at", extglob: true, value, output: "" });
            continue;
          }
          push({ type: "text", value });
          continue;
        }
        if (value !== "*") {
          if (value === "$" || value === "^") {
            value = `\\${value}`;
          }
          const match = REGEX_NON_SPECIAL_CHARS.exec(remaining());
          if (match) {
            value += match[0];
            state.index += match[0].length;
          }
          push({ type: "text", value });
          continue;
        }
        if (prev && (prev.type === "globstar" || prev.star === true)) {
          prev.type = "star";
          prev.star = true;
          prev.value += value;
          prev.output = star;
          state.backtrack = true;
          state.globstar = true;
          consume(value);
          continue;
        }
        let rest = remaining();
        if (opts.noextglob !== true && /^\([^?]/.test(rest)) {
          extglobOpen("star", value);
          continue;
        }
        if (prev.type === "star") {
          if (opts.noglobstar === true) {
            consume(value);
            continue;
          }
          const prior = prev.prev;
          const before = prior.prev;
          const isStart = prior.type === "slash" || prior.type === "bos";
          const afterStar = before && (before.type === "star" || before.type === "globstar");
          if (opts.bash === true && (!isStart || rest[0] && rest[0] !== "/")) {
            push({ type: "star", value, output: "" });
            continue;
          }
          const isBrace = state.braces > 0 && (prior.type === "comma" || prior.type === "brace");
          const isExtglob = extglobs.length && (prior.type === "pipe" || prior.type === "paren");
          if (!isStart && prior.type !== "paren" && !isBrace && !isExtglob) {
            push({ type: "star", value, output: "" });
            continue;
          }
          while (rest.slice(0, 3) === "/**") {
            const after = input[state.index + 4];
            if (after && after !== "/") {
              break;
            }
            rest = rest.slice(3);
            consume("/**", 3);
          }
          if (prior.type === "bos" && eos()) {
            prev.type = "globstar";
            prev.value += value;
            prev.output = globstar(opts);
            state.output = prev.output;
            state.globstar = true;
            consume(value);
            continue;
          }
          if (prior.type === "slash" && prior.prev.type !== "bos" && !afterStar && eos()) {
            state.output = state.output.slice(0, -(prior.output + prev.output).length);
            prior.output = `(?:${prior.output}`;
            prev.type = "globstar";
            prev.output = globstar(opts) + (opts.strictSlashes ? ")" : "|$)");
            prev.value += value;
            state.globstar = true;
            state.output += prior.output + prev.output;
            consume(value);
            continue;
          }
          if (prior.type === "slash" && prior.prev.type !== "bos" && rest[0] === "/") {
            const end = rest[1] !== void 0 ? "|$" : "";
            state.output = state.output.slice(0, -(prior.output + prev.output).length);
            prior.output = `(?:${prior.output}`;
            prev.type = "globstar";
            prev.output = `${globstar(opts)}${SLASH_LITERAL}|${SLASH_LITERAL}${end})`;
            prev.value += value;
            state.output += prior.output + prev.output;
            state.globstar = true;
            consume(value + advance());
            push({ type: "slash", value: "/", output: "" });
            continue;
          }
          if (prior.type === "bos" && rest[0] === "/") {
            prev.type = "globstar";
            prev.value += value;
            prev.output = `(?:^|${SLASH_LITERAL}|${globstar(opts)}${SLASH_LITERAL})`;
            state.output = prev.output;
            state.globstar = true;
            consume(value + advance());
            push({ type: "slash", value: "/", output: "" });
            continue;
          }
          state.output = state.output.slice(0, -prev.output.length);
          prev.type = "globstar";
          prev.output = globstar(opts);
          prev.value += value;
          state.output += prev.output;
          state.globstar = true;
          consume(value);
          continue;
        }
        const token = { type: "star", value, output: star };
        if (opts.bash === true) {
          token.output = ".*?";
          if (prev.type === "bos" || prev.type === "slash") {
            token.output = nodot + token.output;
          }
          push(token);
          continue;
        }
        if (prev && (prev.type === "bracket" || prev.type === "paren") && opts.regex === true) {
          token.output = value;
          push(token);
          continue;
        }
        if (state.index === state.start || prev.type === "slash" || prev.type === "dot") {
          if (prev.type === "dot") {
            state.output += NO_DOT_SLASH;
            prev.output += NO_DOT_SLASH;
          } else if (opts.dot === true) {
            state.output += NO_DOTS_SLASH;
            prev.output += NO_DOTS_SLASH;
          } else {
            state.output += nodot;
            prev.output += nodot;
          }
          if (peek() !== "*") {
            state.output += ONE_CHAR;
            prev.output += ONE_CHAR;
          }
        }
        push(token);
      }
      while (state.brackets > 0) {
        if (opts.strictBrackets === true) throw new SyntaxError(syntaxError("closing", "]"));
        state.output = utils.escapeLast(state.output, "[");
        decrement("brackets");
      }
      while (state.parens > 0) {
        if (opts.strictBrackets === true) throw new SyntaxError(syntaxError("closing", ")"));
        state.output = utils.escapeLast(state.output, "(");
        decrement("parens");
      }
      while (state.braces > 0) {
        if (opts.strictBrackets === true) throw new SyntaxError(syntaxError("closing", "}"));
        state.output = utils.escapeLast(state.output, "{");
        decrement("braces");
      }
      if (opts.strictSlashes !== true && (prev.type === "star" || prev.type === "bracket")) {
        push({ type: "maybe_slash", value: "", output: `${SLASH_LITERAL}?` });
      }
      if (state.backtrack === true) {
        state.output = "";
        for (const token of state.tokens) {
          state.output += token.output != null ? token.output : token.value;
          if (token.suffix) {
            state.output += token.suffix;
          }
        }
      }
      return state;
    };
    parse.fastpaths = (input, options) => {
      const opts = { ...options };
      const max = typeof opts.maxLength === "number" ? Math.min(MAX_LENGTH, opts.maxLength) : MAX_LENGTH;
      const len = input.length;
      if (len > max) {
        throw new SyntaxError(`Input length: ${len}, exceeds maximum allowed length: ${max}`);
      }
      input = REPLACEMENTS[input] || input;
      const win32 = utils.isWindows(options);
      const {
        DOT_LITERAL,
        SLASH_LITERAL,
        ONE_CHAR,
        DOTS_SLASH,
        NO_DOT,
        NO_DOTS,
        NO_DOTS_SLASH,
        STAR,
        START_ANCHOR
      } = constants.globChars(win32);
      const nodot = opts.dot ? NO_DOTS : NO_DOT;
      const slashDot = opts.dot ? NO_DOTS_SLASH : NO_DOT;
      const capture = opts.capture ? "" : "?:";
      const state = { negated: false, prefix: "" };
      let star = opts.bash === true ? ".*?" : STAR;
      if (opts.capture) {
        star = `(${star})`;
      }
      const globstar = (opts2) => {
        if (opts2.noglobstar === true) return star;
        return `(${capture}(?:(?!${START_ANCHOR}${opts2.dot ? DOTS_SLASH : DOT_LITERAL}).)*?)`;
      };
      const create = (str) => {
        switch (str) {
          case "*":
            return `${nodot}${ONE_CHAR}${star}`;
          case ".*":
            return `${DOT_LITERAL}${ONE_CHAR}${star}`;
          case "*.*":
            return `${nodot}${star}${DOT_LITERAL}${ONE_CHAR}${star}`;
          case "*/*":
            return `${nodot}${star}${SLASH_LITERAL}${ONE_CHAR}${slashDot}${star}`;
          case "**":
            return nodot + globstar(opts);
          case "**/*":
            return `(?:${nodot}${globstar(opts)}${SLASH_LITERAL})?${slashDot}${ONE_CHAR}${star}`;
          case "**/*.*":
            return `(?:${nodot}${globstar(opts)}${SLASH_LITERAL})?${slashDot}${star}${DOT_LITERAL}${ONE_CHAR}${star}`;
          case "**/.*":
            return `(?:${nodot}${globstar(opts)}${SLASH_LITERAL})?${DOT_LITERAL}${ONE_CHAR}${star}`;
          default: {
            const match = /^(.*?)\.(\w+)$/.exec(str);
            if (!match) return;
            const source2 = create(match[1]);
            if (!source2) return;
            return source2 + DOT_LITERAL + match[2];
          }
        }
      };
      const output = utils.removePrefix(input, state);
      let source = create(output);
      if (source && opts.strictSlashes !== true) {
        source += `${SLASH_LITERAL}?`;
      }
      return source;
    };
    module2.exports = parse;
  }
});

// ../../node_modules/.pnpm/picomatch@2.3.1/node_modules/picomatch/lib/picomatch.js
var require_picomatch = __commonJS({
  "../../node_modules/.pnpm/picomatch@2.3.1/node_modules/picomatch/lib/picomatch.js"(exports2, module2) {
    "use strict";
    var path4 = require("path");
    var scan = require_scan();
    var parse = require_parse2();
    var utils = require_utils2();
    var constants = require_constants2();
    var isObject = (val) => val && typeof val === "object" && !Array.isArray(val);
    var picomatch = (glob4, options, returnState = false) => {
      if (Array.isArray(glob4)) {
        const fns = glob4.map((input) => picomatch(input, options, returnState));
        const arrayMatcher = (str) => {
          for (const isMatch of fns) {
            const state2 = isMatch(str);
            if (state2) return state2;
          }
          return false;
        };
        return arrayMatcher;
      }
      const isState = isObject(glob4) && glob4.tokens && glob4.input;
      if (glob4 === "" || typeof glob4 !== "string" && !isState) {
        throw new TypeError("Expected pattern to be a non-empty string");
      }
      const opts = options || {};
      const posix = utils.isWindows(options);
      const regex = isState ? picomatch.compileRe(glob4, options) : picomatch.makeRe(glob4, options, false, true);
      const state = regex.state;
      delete regex.state;
      let isIgnored = () => false;
      if (opts.ignore) {
        const ignoreOpts = { ...options, ignore: null, onMatch: null, onResult: null };
        isIgnored = picomatch(opts.ignore, ignoreOpts, returnState);
      }
      const matcher = (input, returnObject = false) => {
        const { isMatch, match, output } = picomatch.test(input, regex, options, { glob: glob4, posix });
        const result = { glob: glob4, state, regex, posix, input, output, match, isMatch };
        if (typeof opts.onResult === "function") {
          opts.onResult(result);
        }
        if (isMatch === false) {
          result.isMatch = false;
          return returnObject ? result : false;
        }
        if (isIgnored(input)) {
          if (typeof opts.onIgnore === "function") {
            opts.onIgnore(result);
          }
          result.isMatch = false;
          return returnObject ? result : false;
        }
        if (typeof opts.onMatch === "function") {
          opts.onMatch(result);
        }
        return returnObject ? result : true;
      };
      if (returnState) {
        matcher.state = state;
      }
      return matcher;
    };
    picomatch.test = (input, regex, options, { glob: glob4, posix } = {}) => {
      if (typeof input !== "string") {
        throw new TypeError("Expected input to be a string");
      }
      if (input === "") {
        return { isMatch: false, output: "" };
      }
      const opts = options || {};
      const format = opts.format || (posix ? utils.toPosixSlashes : null);
      let match = input === glob4;
      let output = match && format ? format(input) : input;
      if (match === false) {
        output = format ? format(input) : input;
        match = output === glob4;
      }
      if (match === false || opts.capture === true) {
        if (opts.matchBase === true || opts.basename === true) {
          match = picomatch.matchBase(input, regex, options, posix);
        } else {
          match = regex.exec(output);
        }
      }
      return { isMatch: Boolean(match), match, output };
    };
    picomatch.matchBase = (input, glob4, options, posix = utils.isWindows(options)) => {
      const regex = glob4 instanceof RegExp ? glob4 : picomatch.makeRe(glob4, options);
      return regex.test(path4.basename(input));
    };
    picomatch.isMatch = (str, patterns, options) => picomatch(patterns, options)(str);
    picomatch.parse = (pattern, options) => {
      if (Array.isArray(pattern)) return pattern.map((p) => picomatch.parse(p, options));
      return parse(pattern, { ...options, fastpaths: false });
    };
    picomatch.scan = (input, options) => scan(input, options);
    picomatch.compileRe = (state, options, returnOutput = false, returnState = false) => {
      if (returnOutput === true) {
        return state.output;
      }
      const opts = options || {};
      const prepend = opts.contains ? "" : "^";
      const append = opts.contains ? "" : "$";
      let source = `${prepend}(?:${state.output})${append}`;
      if (state && state.negated === true) {
        source = `^(?!${source}).*$`;
      }
      const regex = picomatch.toRegex(source, options);
      if (returnState === true) {
        regex.state = state;
      }
      return regex;
    };
    picomatch.makeRe = (input, options = {}, returnOutput = false, returnState = false) => {
      if (!input || typeof input !== "string") {
        throw new TypeError("Expected a non-empty string");
      }
      let parsed = { negated: false, fastpaths: true };
      if (options.fastpaths !== false && (input[0] === "." || input[0] === "*")) {
        parsed.output = parse.fastpaths(input, options);
      }
      if (!parsed.output) {
        parsed = parse(input, options);
      }
      return picomatch.compileRe(parsed, options, returnOutput, returnState);
    };
    picomatch.toRegex = (source, options) => {
      try {
        const opts = options || {};
        return new RegExp(source, opts.flags || (opts.nocase ? "i" : ""));
      } catch (err) {
        if (options && options.debug === true) throw err;
        return /$^/;
      }
    };
    picomatch.constants = constants;
    module2.exports = picomatch;
  }
});

// ../../node_modules/.pnpm/picomatch@2.3.1/node_modules/picomatch/index.js
var require_picomatch2 = __commonJS({
  "../../node_modules/.pnpm/picomatch@2.3.1/node_modules/picomatch/index.js"(exports2, module2) {
    "use strict";
    module2.exports = require_picomatch();
  }
});

// ../../node_modules/.pnpm/micromatch@4.0.8/node_modules/micromatch/index.js
var require_micromatch = __commonJS({
  "../../node_modules/.pnpm/micromatch@4.0.8/node_modules/micromatch/index.js"(exports2, module2) {
    "use strict";
    var util = require("util");
    var braces = require_braces();
    var picomatch = require_picomatch2();
    var utils = require_utils2();
    var isEmptyString = (v) => v === "" || v === "./";
    var hasBraces = (v) => {
      const index = v.indexOf("{");
      return index > -1 && v.indexOf("}", index) > -1;
    };
    var micromatch = (list, patterns, options) => {
      patterns = [].concat(patterns);
      list = [].concat(list);
      let omit = /* @__PURE__ */ new Set();
      let keep = /* @__PURE__ */ new Set();
      let items = /* @__PURE__ */ new Set();
      let negatives = 0;
      let onResult = (state) => {
        items.add(state.output);
        if (options && options.onResult) {
          options.onResult(state);
        }
      };
      for (let i = 0; i < patterns.length; i++) {
        let isMatch = picomatch(String(patterns[i]), { ...options, onResult }, true);
        let negated = isMatch.state.negated || isMatch.state.negatedExtglob;
        if (negated) negatives++;
        for (let item of list) {
          let matched = isMatch(item, true);
          let match = negated ? !matched.isMatch : matched.isMatch;
          if (!match) continue;
          if (negated) {
            omit.add(matched.output);
          } else {
            omit.delete(matched.output);
            keep.add(matched.output);
          }
        }
      }
      let result = negatives === patterns.length ? [...items] : [...keep];
      let matches = result.filter((item) => !omit.has(item));
      if (options && matches.length === 0) {
        if (options.failglob === true) {
          throw new Error(`No matches found for "${patterns.join(", ")}"`);
        }
        if (options.nonull === true || options.nullglob === true) {
          return options.unescape ? patterns.map((p) => p.replace(/\\/g, "")) : patterns;
        }
      }
      return matches;
    };
    micromatch.match = micromatch;
    micromatch.matcher = (pattern, options) => picomatch(pattern, options);
    micromatch.isMatch = (str, patterns, options) => picomatch(patterns, options)(str);
    micromatch.any = micromatch.isMatch;
    micromatch.not = (list, patterns, options = {}) => {
      patterns = [].concat(patterns).map(String);
      let result = /* @__PURE__ */ new Set();
      let items = [];
      let onResult = (state) => {
        if (options.onResult) options.onResult(state);
        items.push(state.output);
      };
      let matches = new Set(micromatch(list, patterns, { ...options, onResult }));
      for (let item of items) {
        if (!matches.has(item)) {
          result.add(item);
        }
      }
      return [...result];
    };
    micromatch.contains = (str, pattern, options) => {
      if (typeof str !== "string") {
        throw new TypeError(`Expected a string: "${util.inspect(str)}"`);
      }
      if (Array.isArray(pattern)) {
        return pattern.some((p) => micromatch.contains(str, p, options));
      }
      if (typeof pattern === "string") {
        if (isEmptyString(str) || isEmptyString(pattern)) {
          return false;
        }
        if (str.includes(pattern) || str.startsWith("./") && str.slice(2).includes(pattern)) {
          return true;
        }
      }
      return micromatch.isMatch(str, pattern, { ...options, contains: true });
    };
    micromatch.matchKeys = (obj, patterns, options) => {
      if (!utils.isObject(obj)) {
        throw new TypeError("Expected the first argument to be an object");
      }
      let keys = micromatch(Object.keys(obj), patterns, options);
      let res = {};
      for (let key of keys) res[key] = obj[key];
      return res;
    };
    micromatch.some = (list, patterns, options) => {
      let items = [].concat(list);
      for (let pattern of [].concat(patterns)) {
        let isMatch = picomatch(String(pattern), options);
        if (items.some((item) => isMatch(item))) {
          return true;
        }
      }
      return false;
    };
    micromatch.every = (list, patterns, options) => {
      let items = [].concat(list);
      for (let pattern of [].concat(patterns)) {
        let isMatch = picomatch(String(pattern), options);
        if (!items.every((item) => isMatch(item))) {
          return false;
        }
      }
      return true;
    };
    micromatch.all = (str, patterns, options) => {
      if (typeof str !== "string") {
        throw new TypeError(`Expected a string: "${util.inspect(str)}"`);
      }
      return [].concat(patterns).every((p) => picomatch(p, options)(str));
    };
    micromatch.capture = (glob4, input, options) => {
      let posix = utils.isWindows(options);
      let regex = picomatch.makeRe(String(glob4), { ...options, capture: true });
      let match = regex.exec(posix ? utils.toPosixSlashes(input) : input);
      if (match) {
        return match.slice(1).map((v) => v === void 0 ? "" : v);
      }
    };
    micromatch.makeRe = (...args) => picomatch.makeRe(...args);
    micromatch.scan = (...args) => picomatch.scan(...args);
    micromatch.parse = (patterns, options) => {
      let res = [];
      for (let pattern of [].concat(patterns || [])) {
        for (let str of braces(String(pattern), options)) {
          res.push(picomatch.parse(str, options));
        }
      }
      return res;
    };
    micromatch.braces = (pattern, options) => {
      if (typeof pattern !== "string") throw new TypeError("Expected a string");
      if (options && options.nobrace === true || !hasBraces(pattern)) {
        return [pattern];
      }
      return braces(pattern, options);
    };
    micromatch.braceExpand = (pattern, options) => {
      if (typeof pattern !== "string") throw new TypeError("Expected a string");
      return micromatch.braces(pattern, { ...options, expand: true });
    };
    micromatch.hasBraces = hasBraces;
    module2.exports = micromatch;
  }
});

// src/detector/isolation-detector.js
var require_isolation_detector = __commonJS({
  "src/detector/isolation-detector.js"(exports2) {
    "use strict";
    var __createBinding = exports2 && exports2.__createBinding || (Object.create ? (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    }) : (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    }));
    var __setModuleDefault = exports2 && exports2.__setModuleDefault || (Object.create ? (function(o, v) {
      Object.defineProperty(o, "default", { enumerable: true, value: v });
    }) : function(o, v) {
      o["default"] = v;
    });
    var __importStar = exports2 && exports2.__importStar || /* @__PURE__ */ (function() {
      var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function(o2) {
          var ar = [];
          for (var k in o2) if (Object.prototype.hasOwnProperty.call(o2, k)) ar[ar.length] = k;
          return ar;
        };
        return ownKeys(o);
      };
      return function(mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) {
          for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        }
        __setModuleDefault(result, mod);
        return result;
      };
    })();
    var __importDefault = exports2 && exports2.__importDefault || function(mod) {
      return mod && mod.__esModule ? mod : { "default": mod };
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.ComponentIsolationDetector = void 0;
    var fs4 = __importStar(require("fs"));
    var path4 = __importStar(require("path"));
    var glob_1 = require("glob");
    var micromatch_1 = __importDefault(require_micromatch());
    var ComponentIsolationDetector2 = class {
      workspaceRoot;
      components = /* @__PURE__ */ new Map();
      dependencyGraph = /* @__PURE__ */ new Map();
      reverseDependencyGraph = /* @__PURE__ */ new Map();
      // Thresholds for detection
      THRESHOLDS = {
        maxCoupling: 7,
        // Max outgoing dependencies
        minCohesion: 0.6,
        // Min cohesion score (0-1)
        maxFanIn: 10,
        // Max files depending on this
        maxFanOut: 10,
        // Max files this depends on
        maxResponsibilities: 3,
        // Max distinct responsibilities
        maxLinesOfCode: 300
        // Max LOC for single component
      };
      // Architectural layers for boundary detection
      LAYERS = {
        presentation: ["**/components/**", "**/pages/**", "**/views/**", "**/ui/**"],
        application: ["**/services/**", "**/controllers/**", "**/handlers/**"],
        domain: ["**/models/**", "**/entities/**", "**/domain/**", "**/core/**"],
        infrastructure: ["**/lib/**", "**/utils/**", "**/helpers/**", "**/adapters/**"]
      };
      // Exclusion patterns (same as circular detector)
      EXCLUDE_PATTERNS = [
        "**/node_modules/**",
        "**/dist/**",
        "**/.next/**",
        "**/out/**",
        "**/*.test.ts",
        "**/*.spec.ts",
        "**/*.mock.ts",
        "**/*.fixture.ts",
        "**/*.data.ts",
        "**/examples/**",
        "**/showcase/**",
        "**/demo/**"
      ];
      constructor(workspaceRoot) {
        this.workspaceRoot = workspaceRoot;
      }
      /**
       * Main detection method
       */
      async detect(targetDir) {
        const absoluteDir = path4.isAbsolute(targetDir) ? targetDir : path4.join(this.workspaceRoot, targetDir);
        const pattern = path4.join(absoluteDir, "**/*.{ts,tsx,js,jsx}").replace(/\\/g, "/");
        const files = await (0, glob_1.glob)(pattern, {
          ignore: this.EXCLUDE_PATTERNS,
          absolute: true
        });
        if (files.length === 0) {
          return [];
        }
        await this.buildComponentMetadata(files);
        this.buildDependencyGraphs();
        const issues = [];
        for (const [filePath, metadata] of this.components) {
          const couplingIssue = this.detectTightCoupling(filePath, metadata);
          if (couplingIssue)
            issues.push(couplingIssue);
          const cohesionIssue = this.detectLowCohesion(filePath, metadata);
          if (cohesionIssue)
            issues.push(cohesionIssue);
          const fanInIssue = this.detectHighFanIn(filePath, metadata);
          if (fanInIssue)
            issues.push(fanInIssue);
          const fanOutIssue = this.detectHighFanOut(filePath, metadata);
          if (fanOutIssue)
            issues.push(fanOutIssue);
          const boundaryIssue = this.detectBoundaryViolation(filePath, metadata);
          if (boundaryIssue)
            issues.push(boundaryIssue);
          const godComponentIssue = this.detectGodComponent(filePath, metadata);
          if (godComponentIssue)
            issues.push(godComponentIssue);
        }
        return issues;
      }
      /**
       * Build metadata for all components
       */
      async buildComponentMetadata(files) {
        for (const filePath of files) {
          try {
            const content = fs4.readFileSync(filePath, "utf-8");
            const metadata = {
              filePath,
              imports: this.extractImports(filePath, content),
              exports: this.extractExports(content),
              importedBy: [],
              linesOfCode: content.split("\n").filter((line) => line.trim().length > 0).length,
              publicSymbols: this.countPublicSymbols(content),
              responsibilities: this.detectResponsibilities(content)
            };
            this.components.set(filePath, metadata);
          } catch (error) {
            continue;
          }
        }
      }
      /**
       * Extract import statements (reuse circular detector logic)
       */
      extractImports(filePath, content) {
        const imports = [];
        const dir = path4.dirname(filePath);
        const importRegex = /import\s+(?:(?:[\w*\s{},]*)\s+from\s+)?['"]([^'"]+)['"]/g;
        let match;
        while ((match = importRegex.exec(content)) !== null) {
          const importPath = match[1];
          if (!importPath.startsWith(".") && !importPath.startsWith("/"))
            continue;
          const resolved = this.resolveImport(dir, importPath);
          if (resolved)
            imports.push(resolved);
        }
        const dynamicImportRegex = /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
        while ((match = dynamicImportRegex.exec(content)) !== null) {
          const importPath = match[1];
          if (!importPath.startsWith(".") && !importPath.startsWith("/"))
            continue;
          const resolved = this.resolveImport(dir, importPath);
          if (resolved)
            imports.push(resolved);
        }
        const exportFromRegex = /export\s+(?:(?:[\w*\s{},]*)\s+from\s+)['"]([^'"]+)['"]/g;
        while ((match = exportFromRegex.exec(content)) !== null) {
          const importPath = match[1];
          if (!importPath.startsWith(".") && !importPath.startsWith("/"))
            continue;
          const resolved = this.resolveImport(dir, importPath);
          if (resolved)
            imports.push(resolved);
        }
        const requireRegex = /require\s*\(['"]([^'"]+)['"]\)/g;
        while ((match = requireRegex.exec(content)) !== null) {
          const importPath = match[1];
          if (!importPath.startsWith(".") && !importPath.startsWith("/"))
            continue;
          const resolved = this.resolveImport(dir, importPath);
          if (resolved)
            imports.push(resolved);
        }
        return [...new Set(imports)];
      }
      /**
       * Resolve import path to absolute file path
       */
      resolveImport(fromDir, importPath) {
        const extensions = [".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".d.ts", ""];
        for (const ext of extensions) {
          const fullPath = path4.resolve(fromDir, importPath + ext);
          if (fs4.existsSync(fullPath) && fs4.statSync(fullPath).isFile()) {
            return fullPath;
          }
        }
        for (const ext of extensions) {
          const indexPath = path4.resolve(fromDir, importPath, `index${ext}`);
          if (fs4.existsSync(indexPath) && fs4.statSync(indexPath).isFile()) {
            return indexPath;
          }
        }
        return null;
      }
      /**
       * Extract exported symbols
       */
      extractExports(content) {
        const exports3 = [];
        const namedExportRegex = /export\s+(?:const|function|class|interface|type|enum)\s+(\w+)/g;
        let match;
        while ((match = namedExportRegex.exec(content)) !== null) {
          exports3.push(match[1]);
        }
        if (/export\s+default\s+/g.test(content)) {
          exports3.push("default");
        }
        return exports3;
      }
      /**
       * Count public symbols (exports)
       */
      countPublicSymbols(content) {
        return this.extractExports(content).length;
      }
      /**
       * Detect component responsibilities based on code patterns
       */
      detectResponsibilities(content) {
        const responsibilities = [];
        if (/React\.Component|useState|useEffect|return\s*\(/g.test(content)) {
          responsibilities.push("UI rendering");
        }
        if (/fetch\(|axios\.|http\.|api\./gi.test(content)) {
          responsibilities.push("Data fetching");
        }
        if (/useState|useReducer|redux|zustand|setState/gi.test(content)) {
          responsibilities.push("State management");
        }
        if (/calculate|validate|process|transform|compute/gi.test(content)) {
          responsibilities.push("Business logic");
        }
        if (/localStorage|sessionStorage|database|prisma|mongoose/gi.test(content)) {
          responsibilities.push("Data persistence");
        }
        if (/addEventListener|onClick|onSubmit|on[A-Z]\w+=/g.test(content)) {
          responsibilities.push("Event handling");
        }
        return [...new Set(responsibilities)];
      }
      /**
       * Build dependency graphs (forward and reverse)
       */
      buildDependencyGraphs() {
        for (const [filePath, metadata] of this.components) {
          this.dependencyGraph.set(filePath, new Set(metadata.imports));
          for (const importedFile of metadata.imports) {
            if (!this.reverseDependencyGraph.has(importedFile)) {
              this.reverseDependencyGraph.set(importedFile, /* @__PURE__ */ new Set());
            }
            this.reverseDependencyGraph.get(importedFile).add(filePath);
            const importedMetadata = this.components.get(importedFile);
            if (importedMetadata) {
              importedMetadata.importedBy.push(filePath);
            }
          }
        }
      }
      /**
       * Detect tight coupling (too many outgoing dependencies)
       */
      detectTightCoupling(filePath, metadata) {
        const coupling = metadata.imports.length;
        if (coupling > this.THRESHOLDS.maxCoupling) {
          const severity = this.calculateCouplingIssue(coupling);
          return {
            file: path4.relative(this.workspaceRoot, filePath),
            type: "tight-coupling",
            severity,
            metric: "coupling",
            value: coupling,
            threshold: this.THRESHOLDS.maxCoupling,
            message: `Component has ${coupling} dependencies (threshold: ${this.THRESHOLDS.maxCoupling})`,
            affectedFiles: metadata.imports.map((f) => path4.relative(this.workspaceRoot, f)),
            suggestedFix: this.getSuggestionForCoupling(coupling)
          };
        }
        return null;
      }
      /**
       * Calculate severity for coupling issues
       */
      calculateCouplingIssue(coupling) {
        if (coupling > this.THRESHOLDS.maxCoupling * 2)
          return "high";
        if (coupling > this.THRESHOLDS.maxCoupling * 1.5)
          return "medium";
        return "low";
      }
      /**
       * Detect low cohesion (unrelated responsibilities)
       */
      detectLowCohesion(filePath, metadata) {
        if (metadata.responsibilities.length > this.THRESHOLDS.maxResponsibilities) {
          return {
            file: path4.relative(this.workspaceRoot, filePath),
            type: "low-cohesion",
            severity: "medium",
            metric: "cohesion",
            value: metadata.responsibilities.length,
            threshold: this.THRESHOLDS.maxResponsibilities,
            message: `Component has ${metadata.responsibilities.length} distinct responsibilities: ${metadata.responsibilities.join(", ")}`,
            affectedFiles: [],
            suggestedFix: "Split component into smaller, focused components with single responsibilities (SRP)"
          };
        }
        return null;
      }
      /**
       * Detect high fan-in (too many files depend on this)
       */
      detectHighFanIn(filePath, metadata) {
        const fanIn = metadata.importedBy.length;
        if (fanIn > this.THRESHOLDS.maxFanIn) {
          return {
            file: path4.relative(this.workspaceRoot, filePath),
            type: "high-fan-in",
            severity: "low",
            metric: "fan-in",
            value: fanIn,
            threshold: this.THRESHOLDS.maxFanIn,
            message: `Component is imported by ${fanIn} files (threshold: ${this.THRESHOLDS.maxFanIn})`,
            affectedFiles: metadata.importedBy.map((f) => path4.relative(this.workspaceRoot, f)),
            suggestedFix: "This might be a utility/shared component. Consider if interface is stable and well-documented."
          };
        }
        return null;
      }
      /**
       * Detect high fan-out (depends on too many files)
       */
      detectHighFanOut(filePath, metadata) {
        const fanOut = metadata.imports.length;
        if (fanOut > this.THRESHOLDS.maxFanOut) {
          return {
            file: path4.relative(this.workspaceRoot, filePath),
            type: "high-fan-out",
            severity: "medium",
            metric: "fan-out",
            value: fanOut,
            threshold: this.THRESHOLDS.maxFanOut,
            message: `Component depends on ${fanOut} files (threshold: ${this.THRESHOLDS.maxFanOut})`,
            affectedFiles: metadata.imports.map((f) => path4.relative(this.workspaceRoot, f)),
            suggestedFix: "Group related dependencies into facade/aggregate modules to reduce fan-out"
          };
        }
        return null;
      }
      /**
       * Detect boundary violations (cross-layer dependencies)
       */
      detectBoundaryViolation(filePath, metadata) {
        const currentLayer = this.getComponentLayer(filePath);
        if (!currentLayer)
          return null;
        const violations = [];
        for (const importedFile of metadata.imports) {
          const importedLayer = this.getComponentLayer(importedFile);
          if (!importedLayer || importedLayer === currentLayer)
            continue;
          if (this.isInvalidLayerDependency(currentLayer, importedLayer)) {
            violations.push(importedFile);
          }
        }
        if (violations.length > 0) {
          return {
            file: path4.relative(this.workspaceRoot, filePath),
            type: "boundary-violation",
            severity: "high",
            metric: "boundary-violation",
            value: violations.length,
            threshold: 0,
            message: `${currentLayer} layer component depends on ${violations.length} files from invalid layers`,
            affectedFiles: violations.map((f) => path4.relative(this.workspaceRoot, f)),
            suggestedFix: `Follow layered architecture: presentation \u2192 application \u2192 domain \u2192 infrastructure. Extract interfaces or use dependency inversion.`
          };
        }
        return null;
      }
      /**
       * Get component's architectural layer
       */
      getComponentLayer(filePath) {
        const relativePath = path4.relative(this.workspaceRoot, filePath);
        for (const [layer, patterns] of Object.entries(this.LAYERS)) {
          if (micromatch_1.default.isMatch(relativePath, patterns)) {
            return layer;
          }
        }
        return null;
      }
      /**
       * Check if layer dependency is invalid
       */
      isInvalidLayerDependency(from, to) {
        const layerHierarchy = {
          presentation: ["application", "domain", "infrastructure"],
          application: ["domain", "infrastructure"],
          domain: [],
          infrastructure: []
        };
        const allowedDeps = layerHierarchy[from] || [];
        return !allowedDeps.includes(to);
      }
      /**
       * Detect god components (too many responsibilities/LOC)
       */
      detectGodComponent(filePath, metadata) {
        const isGod = metadata.linesOfCode > this.THRESHOLDS.maxLinesOfCode || metadata.responsibilities.length > this.THRESHOLDS.maxResponsibilities * 1.5;
        if (isGod) {
          return {
            file: path4.relative(this.workspaceRoot, filePath),
            type: "god-component",
            severity: "high",
            metric: "complexity",
            value: metadata.linesOfCode,
            threshold: this.THRESHOLDS.maxLinesOfCode,
            message: `Component has ${metadata.linesOfCode} LOC and ${metadata.responsibilities.length} responsibilities (god component anti-pattern)`,
            affectedFiles: [],
            suggestedFix: "Break down into smaller components following Single Responsibility Principle (SRP)"
          };
        }
        return null;
      }
      /**
       * Get suggestion for coupling issues
       */
      getSuggestionForCoupling(coupling) {
        if (coupling > 15) {
          return "Extreme coupling detected. Consider architectural refactor: introduce facades, aggregate modules, or dependency injection.";
        } else if (coupling > 10) {
          return "High coupling. Group related dependencies into modules, use facade pattern, or introduce service layer.";
        }
        return "Moderate coupling. Review if all dependencies are necessary. Consider dependency injection or inversion of control.";
      }
      /**
       * Calculate isolation statistics
       */
      getStatistics(issues) {
        const stats = {
          totalFiles: this.components.size,
          totalIssues: issues.length,
          bySeverity: { high: 0, medium: 0, low: 0 },
          byType: {
            "tight-coupling": 0,
            "low-cohesion": 0,
            "high-fan-in": 0,
            "high-fan-out": 0,
            "boundary-violation": 0,
            "god-component": 0,
            "unstable-interface": 0
          },
          averageCoupling: 0,
          averageCohesion: 0,
          wellIsolatedComponents: 0
        };
        for (const issue of issues) {
          stats.bySeverity[issue.severity]++;
          stats.byType[issue.type]++;
        }
        let totalCoupling = 0;
        let totalCohesion = 0;
        for (const metadata of this.components.values()) {
          totalCoupling += metadata.imports.length;
          const cohesion = metadata.responsibilities.length > 0 ? 1 / metadata.responsibilities.length : 1;
          totalCohesion += cohesion;
        }
        stats.averageCoupling = totalCoupling / this.components.size;
        stats.averageCohesion = totalCohesion / this.components.size;
        const filesWithIssues = new Set(issues.map((i) => i.file));
        stats.wellIsolatedComponents = this.components.size - filesWithIssues.size;
        return stats;
      }
      /**
       * Format issue for console output
       */
      formatError(issue) {
        const severityEmoji = {
          high: "\u{1F534}",
          medium: "\u{1F7E1}",
          low: "\u{1F7E2}"
        };
        const typeEmoji = {
          "tight-coupling": "\u{1F517}",
          "low-cohesion": "\u{1F9E9}",
          "high-fan-in": "\u{1F4E5}",
          "high-fan-out": "\u{1F4E4}",
          "boundary-violation": "\u{1F6A7}",
          "god-component": "\u{1F451}",
          "unstable-interface": "\u26A1"
        };
        let output = `
${severityEmoji[issue.severity]} ISOLATION ISSUE [${issue.severity.toUpperCase()}]
`;
        output += `${typeEmoji[issue.type]} Type: ${issue.type}
`;
        output += `\u{1F4C1} File: ${issue.file}
`;
        output += `\u{1F4CA} Metric: ${issue.metric} = ${issue.value} (threshold: ${issue.threshold})
`;
        output += `\u{1F4AC} ${issue.message}
`;
        if (issue.affectedFiles.length > 0 && issue.affectedFiles.length <= 5) {
          output += `\u{1F4C2} Affected files:
`;
          for (const file of issue.affectedFiles) {
            output += `   - ${file}
`;
          }
        } else if (issue.affectedFiles.length > 5) {
          output += `\u{1F4C2} Affected files: ${issue.affectedFiles.length} files (showing first 5)
`;
          for (const file of issue.affectedFiles.slice(0, 5)) {
            output += `   - ${file}
`;
          }
        }
        output += `
\u2705 Suggested Fix:
   ${issue.suggestedFix}
`;
        return output;
      }
    };
    exports2.ComponentIsolationDetector = ComponentIsolationDetector2;
  }
});

// src/detector/performance-detector.js
var require_performance_detector = __commonJS({
  "src/detector/performance-detector.js"(exports2) {
    "use strict";
    var __createBinding = exports2 && exports2.__createBinding || (Object.create ? (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    }) : (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    }));
    var __setModuleDefault = exports2 && exports2.__setModuleDefault || (Object.create ? (function(o, v) {
      Object.defineProperty(o, "default", { enumerable: true, value: v });
    }) : function(o, v) {
      o["default"] = v;
    });
    var __importStar = exports2 && exports2.__importStar || /* @__PURE__ */ (function() {
      var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function(o2) {
          var ar = [];
          for (var k in o2) if (Object.prototype.hasOwnProperty.call(o2, k)) ar[ar.length] = k;
          return ar;
        };
        return ownKeys(o);
      };
      return function(mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) {
          for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        }
        __setModuleDefault(result, mod);
        return result;
      };
    })();
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.PerformanceDetector = exports2.PerformanceErrorType = void 0;
    var fs4 = __importStar(require("fs"));
    var path4 = __importStar(require("path"));
    var glob_1 = require("glob");
    var PerformanceErrorType2;
    (function(PerformanceErrorType3) {
      PerformanceErrorType3["BUNDLE_TOO_LARGE"] = "BUNDLE_TOO_LARGE";
      PerformanceErrorType3["LARGE_MODULE_IMPORT"] = "LARGE_MODULE_IMPORT";
      PerformanceErrorType3["MISSING_CODE_SPLITTING"] = "MISSING_CODE_SPLITTING";
      PerformanceErrorType3["NO_TREE_SHAKING"] = "NO_TREE_SHAKING";
      PerformanceErrorType3["DUPLICATE_DEPENDENCIES"] = "DUPLICATE_DEPENDENCIES";
      PerformanceErrorType3["UNNECESSARY_RENDER"] = "UNNECESSARY_RENDER";
      PerformanceErrorType3["MISSING_MEMO"] = "MISSING_MEMO";
      PerformanceErrorType3["MISSING_USE_CALLBACK"] = "MISSING_USE_CALLBACK";
      PerformanceErrorType3["INLINE_FUNCTION_IN_JSX"] = "INLINE_FUNCTION_IN_JSX";
      PerformanceErrorType3["INLINE_OBJECT_IN_JSX"] = "INLINE_OBJECT_IN_JSX";
      PerformanceErrorType3["MISSING_KEY_PROP"] = "MISSING_KEY_PROP";
      PerformanceErrorType3["NESTED_LOOP_O_N_SQUARED"] = "NESTED_LOOP_O_N_SQUARED";
      PerformanceErrorType3["LOOP_WITH_DOM_ACCESS"] = "LOOP_WITH_DOM_ACCESS";
      PerformanceErrorType3["UNOPTIMIZED_ARRAY_METHOD"] = "UNOPTIMIZED_ARRAY_METHOD";
      PerformanceErrorType3["LOOP_CREATING_CLOSURES"] = "LOOP_CREATING_CLOSURES";
      PerformanceErrorType3["INEFFICIENT_LOOP"] = "INEFFICIENT_LOOP";
      PerformanceErrorType3["N_PLUS_ONE_QUERY"] = "N_PLUS_ONE_QUERY";
      PerformanceErrorType3["LARGE_IMAGE_WITHOUT_OPTIMIZATION"] = "LARGE_IMAGE_WITHOUT_OPTIMIZATION";
      PerformanceErrorType3["MISSING_LAZY_LOADING"] = "MISSING_LAZY_LOADING";
      PerformanceErrorType3["UNCOMPRESSED_ASSET"] = "UNCOMPRESSED_ASSET";
      PerformanceErrorType3["SYNC_FILE_OPERATION"] = "SYNC_FILE_OPERATION";
      PerformanceErrorType3["BLOCKING_COMPUTATION"] = "BLOCKING_COMPUTATION";
      PerformanceErrorType3["LONG_RUNNING_FUNCTION"] = "LONG_RUNNING_FUNCTION";
      PerformanceErrorType3["HEAVY_COMPUTATION_IN_RENDER"] = "HEAVY_COMPUTATION_IN_RENDER";
      PerformanceErrorType3["MISSING_CLEANUP_LOGIC"] = "MISSING_CLEANUP_LOGIC";
      PerformanceErrorType3["SLOW_FUNCTION"] = "SLOW_FUNCTION";
    })(PerformanceErrorType2 || (exports2.PerformanceErrorType = PerformanceErrorType2 = {}));
    var PerformanceDetector2 = class {
      options;
      errors = [];
      constructor(optionsOrPath) {
        const options = typeof optionsOrPath === "string" ? { workspaceRoot: optionsOrPath } : optionsOrPath;
        this.options = {
          includePatterns: ["**/*.{ts,tsx,js,jsx}"],
          excludePatterns: [
            "**/node_modules/**",
            "**/dist/**",
            "**/build/**",
            "**/.next/**",
            "**/coverage/**",
            "**/*.test.*",
            "**/*.spec.*"
          ],
          bundleSizeThresholdKB: 500,
          assetSizeThresholdKB: 200,
          maxFunctionLines: 100,
          verbose: false,
          ...options
        };
      }
      async analyze() {
        this.errors = [];
        const files = await this.getFiles();
        if (this.options.verbose) {
          console.log(`[PerformanceDetector] Found ${files.length} files in ${this.options.workspaceRoot}`);
          console.log(`[PerformanceDetector] Patterns: ${this.options.includePatterns.join(", ")}`);
          if (files.length > 0)
            console.log(`[PerformanceDetector] First file: ${files[0]}`);
        }
        for (const file of files) {
          const stats = fs4.statSync(file);
          const sizeKB = stats.size / 1024;
          if (sizeKB > 500) {
            let severity = "medium";
            if (sizeKB > 1024)
              severity = "critical";
            else if (sizeKB > 750)
              severity = "high";
            const loadTime3G = (sizeKB / 50).toFixed(1);
            const loadTime4G = (sizeKB / 150).toFixed(1);
            this.errors.push({
              file,
              line: 1,
              type: PerformanceErrorType2.BUNDLE_TOO_LARGE,
              severity,
              message: `Large file (${Math.round(sizeKB)}KB)`,
              pattern: path4.basename(file),
              suggestedFix: "Split file, enable code splitting, or lazy load",
              details: `File size: ${Math.round(sizeKB)}KB (threshold: 500KB)`,
              metrics: {
                size: Math.round(sizeKB),
                threshold: 500,
                impact: `Estimated load time: ${loadTime3G}s (3G), ${loadTime4G}s (4G)`
              }
            });
          }
          const content = fs4.readFileSync(file, "utf-8");
          this.detectBundleSizeIssues(file, content);
          this.detectReactRenders(file, content);
          this.detectIneffLoops(file, content);
          this.detectLargeAssets(file, content);
          this.detectSlowFunctions(file, content);
          this.detectBlockingOps(file, content);
          this.detectNPlusOneQueries(file, content);
        }
        const statistics = this.calculateStatistics();
        return { errors: this.errors, statistics };
      }
      detectBundleSizeIssues(file, content) {
        const lines = content.split("\n");
        lines.forEach((line, index) => {
          const lineNum = index + 1;
          if (/import\s+\*\s+as\s+\w+\s+from\s+['"](?:lodash|moment|rxjs|@material-ui\/core)['"]/.test(line)) {
            this.errors.push({
              file,
              line: lineNum,
              type: PerformanceErrorType2.LARGE_MODULE_IMPORT,
              severity: "high",
              message: "Importing entire large library",
              pattern: line.trim(),
              suggestedFix: 'import { debounce } from "lodash"',
              details: "Tree-shakeable imports reduce bundle size"
            });
          }
          if (/import\s+_\s+from\s+['"]lodash['"]/.test(line)) {
            this.errors.push({
              file,
              line: lineNum,
              type: PerformanceErrorType2.LARGE_MODULE_IMPORT,
              severity: "high",
              message: "Full lodash import (72KB+ gzipped)",
              pattern: line.trim(),
              suggestedFix: 'import debounce from "lodash/debounce"',
              details: "Use per-method imports",
              metrics: { size: 72, threshold: 10 }
            });
          }
          if (/import\s+.*\s+from\s+['"]moment['"]/.test(line)) {
            this.errors.push({
              file,
              line: lineNum,
              type: PerformanceErrorType2.LARGE_MODULE_IMPORT,
              severity: "high",
              message: "Moment.js is large (67KB+)",
              pattern: line.trim(),
              suggestedFix: "Consider date-fns or dayjs",
              details: "Modern alternatives are smaller",
              metrics: { size: 67, threshold: 12 }
            });
          }
        });
      }
      detectReactRenders(file, content) {
        if (!/\.(tsx|jsx)$/.test(file))
          return;
        const lines = content.split("\n");
        lines.forEach((line, index) => {
          const lineNum = index + 1;
          if (/<\w+[^>]*\s+(?:onClick|onChange|onSubmit)=\{[^}]*=>/.test(line)) {
            this.errors.push({
              file,
              line: lineNum,
              type: PerformanceErrorType2.INLINE_FUNCTION_IN_JSX,
              severity: "medium",
              message: "Inline arrow function causes re-renders",
              pattern: line.trim(),
              suggestedFix: "Use useCallback",
              details: "New function on every render"
            });
          }
          if (/<\w+[^>]*\s+style=\{\{/.test(line)) {
            this.errors.push({
              file,
              line: lineNum,
              type: PerformanceErrorType2.INLINE_OBJECT_IN_JSX,
              severity: "medium",
              message: "Inline object causes re-renders",
              pattern: line.trim(),
              suggestedFix: "Extract to useMemo",
              details: "New object reference on every render"
            });
          }
          if (/\.map\([^)]*=>\s*</.test(line) && !line.includes("key=")) {
            this.errors.push({
              file,
              line: lineNum,
              type: PerformanceErrorType2.MISSING_KEY_PROP,
              severity: "high",
              message: "Missing key prop in list",
              pattern: line.trim(),
              suggestedFix: "<Component key={item.id} />",
              details: "Forces React to re-create DOM nodes"
            });
          }
        });
      }
      detectIneffLoops(file, content) {
        const lines = content.split("\n");
        let loopDepth = 0;
        lines.forEach((line, index) => {
          const lineNum = index + 1;
          const forMatch = line.match(/\bfor\s*\(/g);
          if (forMatch) {
            loopDepth += forMatch.length;
            if (loopDepth >= 3) {
              this.errors.push({
                file,
                line: lineNum,
                type: PerformanceErrorType2.INEFFICIENT_LOOP,
                severity: "critical",
                message: "Triple nested loop (O(n\xB3) complexity)",
                pattern: line.trim(),
                suggestedFix: "Refactor to reduce nesting, use more efficient algorithm",
                details: "Cubic time complexity - extremely slow for large inputs"
              });
            } else if (loopDepth === 2) {
              this.errors.push({
                file,
                line: lineNum,
                type: PerformanceErrorType2.INEFFICIENT_LOOP,
                severity: "high",
                message: "nested loop detected (O(n\xB2) complexity)",
                pattern: line.trim(),
                suggestedFix: "Use Map/Set lookup or optimize with hash table",
                details: "Quadratic time complexity - performance degrades rapidly with input size"
              });
            }
          }
          if (line.includes("}")) {
            const braceCount = (line.match(/}/g) || []).length;
            loopDepth = Math.max(0, loopDepth - braceCount);
          }
          if (/\.push\s*\(/.test(line) && loopDepth > 0) {
            this.errors.push({
              file,
              line: lineNum,
              type: PerformanceErrorType2.INEFFICIENT_LOOP,
              severity: "medium",
              message: "Array.push in loop can cause multiple reallocations",
              pattern: line.trim(),
              suggestedFix: "Pre-allocate array size or use Array.from with map",
              details: "Each push may trigger array resizing"
            });
          }
          const largeArrayMatch = line.match(/(?:new\s+Array|Array)\s*\(\s*(\d+)\s*\)/);
          if (largeArrayMatch) {
            const size = parseInt(largeArrayMatch[1]);
            if (size >= 1e4) {
              let severity = "medium";
              if (size >= 1e5)
                severity = "critical";
              else if (size >= 5e4)
                severity = "high";
              this.errors.push({
                file,
                line: lineNum,
                type: PerformanceErrorType2.INEFFICIENT_LOOP,
                severity,
                message: `Large array allocation (${size.toLocaleString()} elements)`,
                pattern: line.trim(),
                suggestedFix: "Use iterators, generators, or stream processing for large datasets",
                details: `Memory allocation: ~${Math.round(size * 8 / 1024)}KB (assuming 8 bytes/element)`,
                metrics: { size, threshold: 1e4 }
              });
            }
          }
          if (/for\s*\([^)]*\)\s*\{[^}]*document\./.test(line)) {
            this.errors.push({
              file,
              line: lineNum,
              type: PerformanceErrorType2.LOOP_WITH_DOM_ACCESS,
              severity: "high",
              message: "DOM access in loop",
              pattern: line.trim(),
              suggestedFix: "Cache DOM references",
              details: "Triggers reflow/repaint"
            });
          }
        });
      }
      detectLargeAssets(file, content) {
        const lines = content.split("\n");
        lines.forEach((line, index) => {
          const lineNum = index + 1;
          if (/import\s+.*\s+from\s+['"][^'"]*\.(jpg|png|webp)['"]/.test(line)) {
            const match = line.match(/['"]([^'"]*\.(jpg|png|webp))['"]/);
            if (match) {
              const assetPath = path4.resolve(path4.dirname(file), match[1]);
              if (fs4.existsSync(assetPath)) {
                const stats = fs4.statSync(assetPath);
                const sizeKB = stats.size / 1024;
                if (sizeKB > this.options.assetSizeThresholdKB) {
                  this.errors.push({
                    file,
                    line: lineNum,
                    type: PerformanceErrorType2.LARGE_IMAGE_WITHOUT_OPTIMIZATION,
                    severity: "high",
                    message: `Large image (${Math.round(sizeKB)}KB)`,
                    pattern: line.trim(),
                    suggestedFix: "Use next/image or compress",
                    details: `>${this.options.assetSizeThresholdKB}KB`,
                    metrics: { size: Math.round(sizeKB), threshold: this.options.assetSizeThresholdKB }
                  });
                }
              }
            }
          }
          if (/<img\s+[^>]*src=/.test(line) && !line.includes('loading="lazy"')) {
            this.errors.push({
              file,
              line: lineNum,
              type: PerformanceErrorType2.MISSING_LAZY_LOADING,
              severity: "medium",
              message: "Image without lazy loading",
              pattern: line.trim(),
              suggestedFix: 'loading="lazy"',
              details: "Improves initial load"
            });
          }
        });
      }
      detectSlowFunctions(file, content) {
        const functionRegex = /function\s+(\w+)\s*\([^)]*\)\s*{/g;
        let match;
        while ((match = functionRegex.exec(content)) !== null) {
          const functionName = match[1];
          const startPos = match.index;
          const startLine = content.substring(0, startPos).split("\n").length;
          const remainingContent = content.substring(startPos);
          let braceCount = 0;
          let functionBody = "";
          let i = 0;
          for (; i < remainingContent.length; i++) {
            const char = remainingContent[i];
            functionBody += char;
            if (char === "{")
              braceCount++;
            if (char === "}") {
              braceCount--;
              if (braceCount === 0)
                break;
            }
          }
          const lineCount = functionBody.split("\n").length;
          let complexity = 1;
          complexity += (functionBody.match(/\bif\s*\(/g) || []).length;
          complexity += (functionBody.match(/\belse\b/g) || []).length;
          complexity += (functionBody.match(/\bfor\s*\(/g) || []).length * 2;
          complexity += (functionBody.match(/\bwhile\s*\(/g) || []).length * 2;
          complexity += (functionBody.match(/\bswitch\s*\(/g) || []).length;
          complexity += (functionBody.match(/\bcase\s+/g) || []).length;
          complexity += (functionBody.match(/&&|\|\|/g) || []).length;
          complexity += (functionBody.match(/\?[^:]*:/g) || []).length;
          if (complexity > 15) {
            this.errors.push({
              file,
              line: startLine,
              type: PerformanceErrorType2.SLOW_FUNCTION,
              severity: complexity > 25 ? "critical" : "high",
              message: `High cyclomatic complexity (${complexity})`,
              pattern: `function ${functionName}`,
              suggestedFix: "Refactor into smaller functions",
              details: `Complexity: ${complexity}, Lines: ${lineCount}`,
              metrics: { complexity, lines: lineCount }
            });
          }
          if (lineCount > 100) {
            this.errors.push({
              file,
              line: startLine,
              type: PerformanceErrorType2.SLOW_FUNCTION,
              severity: lineCount > 200 ? "critical" : "high",
              message: `Long function (${lineCount} lines)`,
              pattern: `function ${functionName}`,
              suggestedFix: "Split into smaller functions",
              details: `Function spans ${lineCount} lines`,
              metrics: { lines: lineCount }
            });
          }
        }
      }
      detectBlockingOps(file, content) {
        const lines = content.split("\n");
        let setTimeoutCount = 0;
        const hasCleanup = {
          removeEventListener: /\bremoveEventListener\s*\(/.test(content),
          clearInterval: /\bclearInterval\s*\(/.test(content),
          clearTimeout: /\bclearTimeout\s*\(/.test(content)
        };
        for (let index = 0; index < lines.length; index++) {
          const line = lines[index];
          const lineNum = index + 1;
          if (/\.addEventListener\(/.test(line) && !hasCleanup.removeEventListener) {
            this.errors.push({
              file,
              line: lineNum,
              type: PerformanceErrorType2.MISSING_CLEANUP_LOGIC,
              severity: "high",
              message: "addEventListener without removeEventListener",
              pattern: line.trim(),
              suggestedFix: "Add cleanup logic with removeEventListener",
              details: "Memory leak risk"
            });
          }
          if (/setInterval\(/.test(line) && !hasCleanup.clearInterval) {
            this.errors.push({
              file,
              line: lineNum,
              type: PerformanceErrorType2.MISSING_CLEANUP_LOGIC,
              severity: "critical",
              message: "setInterval without clearInterval",
              pattern: line.trim(),
              suggestedFix: "Store interval ID and call clearInterval",
              details: "Memory leak risk - interval runs forever"
            });
          }
          if (/setTimeout\(/.test(line)) {
            setTimeoutCount++;
          }
          const syncFsMatch = line.match(/\b(readFileSync|writeFileSync|readdirSync|existsSync|statSync|unlinkSync|mkdirSync|rmdirSync)\(/);
          if (syncFsMatch) {
            const funcName = syncFsMatch[1];
            this.errors.push({
              file,
              line: lineNum,
              type: PerformanceErrorType2.SYNC_FILE_OPERATION,
              severity: "high",
              message: `Sync file operation (${funcName}) blocks event loop`,
              pattern: line.trim(),
              suggestedFix: "Use fs.promises or async versions",
              details: "Blocks Node.js event loop"
            });
          }
          if (/\b(?:pbkdf2Sync|scryptSync|randomBytesSync|randomFillSync|pbkdf2|scrypt)\s*\(/.test(line)) {
            const isSyncCrypto = /\b(?:pbkdf2Sync|scryptSync|randomBytesSync|randomFillSync)\s*\(/.test(line);
            let estimatedTime = "Unknown";
            if (line.includes("pbkdf2Sync")) {
              const iterMatch = line.match(/pbkdf2Sync\([^,]+,[^,]+,\s*(\d+)/);
              const iterations = iterMatch ? parseInt(iterMatch[1]) : 1e5;
              estimatedTime = `~${Math.round(iterations / 1e4)}00ms`;
            } else if (line.includes("scryptSync")) {
              estimatedTime = "~50-200ms";
            }
            this.errors.push({
              file,
              line: lineNum,
              type: PerformanceErrorType2.BLOCKING_COMPUTATION,
              severity: "critical",
              message: "Sync crypto operation blocks event loop",
              pattern: line.trim(),
              suggestedFix: "Use async crypto.pbkdf2, crypto.scrypt instead",
              details: "Cryptographic operations are CPU-intensive",
              metrics: { impact: `Estimated blocking time: ${estimatedTime}` }
            });
          }
          if (/\bexecSync\s*\(/.test(line)) {
            this.errors.push({
              file,
              line: lineNum,
              type: PerformanceErrorType2.BLOCKING_COMPUTATION,
              severity: "critical",
              message: "execSync blocks event loop",
              pattern: line.trim(),
              suggestedFix: "Use child_process.exec with promises",
              details: "Command execution can take seconds",
              metrics: { impact: "Estimated blocking time: 100-5000ms depending on command" }
            });
          }
          if (/^(?:export\s+)?(?:async\s+)?function\s+\w+/.test(line)) {
            let braceCount = 0;
            let functionLines = 0;
            for (let i = index; i < lines.length; i++) {
              functionLines++;
              braceCount += (lines[i].match(/\{/g) || []).length;
              braceCount -= (lines[i].match(/\}/g) || []).length;
              if (braceCount === 0)
                break;
              if (functionLines > this.options.maxFunctionLines) {
                this.errors.push({
                  file,
                  line: lineNum,
                  type: PerformanceErrorType2.LONG_RUNNING_FUNCTION,
                  severity: "medium",
                  message: `Function exceeds ${this.options.maxFunctionLines} lines`,
                  pattern: line.trim(),
                  suggestedFix: "Split into smaller functions",
                  details: `${functionLines}+ lines`,
                  metrics: { size: functionLines, threshold: this.options.maxFunctionLines }
                });
                break;
              }
            }
          }
        }
        if (setTimeoutCount > 5 && !hasCleanup.clearTimeout) {
          this.errors.push({
            file,
            line: 1,
            type: PerformanceErrorType2.MISSING_CLEANUP_LOGIC,
            severity: "medium",
            message: `${setTimeoutCount} setTimeout calls without cleanup`,
            suggestedFix: "Store timeout IDs and call clearTimeout",
            details: "Potential memory leak with multiple timeouts"
          });
        }
      }
      detectNPlusOneQueries(file, content) {
        const lines = content.split("\n");
        let loopDepth = 0;
        for (let index = 0; index < lines.length; index++) {
          const line = lines[index];
          const lineNum = index + 1;
          const forLoopMatch = /\bfor\s*(\(|await\s+\(|\(const\s+|\(let\s+|\(var\s+)/.test(line) || /\bfor\s+(const|let|var)\s+/.test(line);
          const whileLoopMatch = /\bwhile\s*\(/.test(line);
          const arrayMethodMatch = /\.(forEach|map)\s*\(/.test(line);
          if (forLoopMatch || whileLoopMatch || arrayMethodMatch) {
            loopDepth++;
          }
          const openBraceCount = (line.match(/\{/g) || []).length;
          const closeBraceCount = (line.match(/\}/g) || []).length;
          const netBraces = openBraceCount - closeBraceCount;
          if (netBraces !== 0 && loopDepth > 0) {
            loopDepth += netBraces;
            if (loopDepth < 0)
              loopDepth = 0;
          }
          if (loopDepth === 0)
            continue;
          if (/\bprisma\.\w+\.(findUnique|findFirst|findMany|create|update|delete|upsert)\s*\(/.test(line)) {
            this.errors.push({
              file,
              line: lineNum,
              type: PerformanceErrorType2.N_PLUS_ONE_QUERY,
              severity: "critical",
              message: "Prisma query inside loop (N+1 problem)",
              pattern: line.trim(),
              suggestedFix: 'Use Prisma batch operations: findMany with "in" filter, createMany, updateMany',
              details: "Each iteration triggers a separate database query",
              metrics: { impact: "N database queries instead of 1 batch query" }
            });
          }
          if (/\bfetch\s*\(/.test(line) && /await/.test(line)) {
            this.errors.push({
              file,
              line: lineNum,
              type: PerformanceErrorType2.N_PLUS_ONE_QUERY,
              severity: "high",
              message: "fetch call inside loop (N+1 HTTP requests)",
              pattern: line.trim(),
              suggestedFix: "Batch requests: collect IDs, make single request with all IDs",
              details: "Each iteration makes a separate HTTP request",
              metrics: { impact: "N HTTP requests instead of 1 batch request" }
            });
          }
          if (/\baxios\.(get|post|put|delete|patch)\s*\(/.test(line)) {
            this.errors.push({
              file,
              line: lineNum,
              type: PerformanceErrorType2.N_PLUS_ONE_QUERY,
              severity: "high",
              message: "axios call inside loop (N+1 HTTP requests)",
              pattern: line.trim(),
              suggestedFix: "Use Promise.all with batch endpoint or collect data first",
              details: "Sequential HTTP requests block each iteration",
              metrics: { impact: "Consider using Promise.all for parallel requests" }
            });
          }
          if (/(?:client\.query|apolloClient\.query|query\()\s*\(/.test(line) && /await/.test(line)) {
            this.errors.push({
              file,
              line: lineNum,
              type: PerformanceErrorType2.N_PLUS_ONE_QUERY,
              severity: "critical",
              message: "GraphQL query inside loop (N+1 problem)",
              pattern: line.trim(),
              suggestedFix: "Use GraphQL batching or DataLoader pattern",
              details: "Multiple queries instead of single batched query"
            });
          }
        }
      }
      calculateStatistics() {
        const stats = {
          totalIssues: this.errors.length,
          criticalIssues: this.errors.filter((e) => e.severity === "critical").length,
          highIssues: this.errors.filter((e) => e.severity === "high").length,
          mediumIssues: this.errors.filter((e) => e.severity === "medium").length,
          lowIssues: this.errors.filter((e) => e.severity === "low").length,
          issuesByType: {},
          filesScanned: new Set(this.errors.map((e) => e.file)).size,
          bundleSizeIssues: 0,
          renderIssues: 0,
          loopIssues: 0,
          assetIssues: 0,
          blockingIssues: 0
        };
        for (const error of this.errors) {
          stats.issuesByType[error.type] = (stats.issuesByType[error.type] || 0) + 1;
          if ([
            PerformanceErrorType2.BUNDLE_TOO_LARGE,
            PerformanceErrorType2.LARGE_MODULE_IMPORT,
            PerformanceErrorType2.MISSING_CODE_SPLITTING,
            PerformanceErrorType2.NO_TREE_SHAKING,
            PerformanceErrorType2.DUPLICATE_DEPENDENCIES
          ].includes(error.type)) {
            stats.bundleSizeIssues++;
          } else if ([
            PerformanceErrorType2.UNNECESSARY_RENDER,
            PerformanceErrorType2.MISSING_MEMO,
            PerformanceErrorType2.MISSING_USE_CALLBACK,
            PerformanceErrorType2.INLINE_FUNCTION_IN_JSX,
            PerformanceErrorType2.INLINE_OBJECT_IN_JSX,
            PerformanceErrorType2.MISSING_KEY_PROP
          ].includes(error.type)) {
            stats.renderIssues++;
          } else if ([
            PerformanceErrorType2.NESTED_LOOP_O_N_SQUARED,
            PerformanceErrorType2.LOOP_WITH_DOM_ACCESS,
            PerformanceErrorType2.UNOPTIMIZED_ARRAY_METHOD,
            PerformanceErrorType2.LOOP_CREATING_CLOSURES
          ].includes(error.type)) {
            stats.loopIssues++;
          } else if ([
            PerformanceErrorType2.LARGE_IMAGE_WITHOUT_OPTIMIZATION,
            PerformanceErrorType2.MISSING_LAZY_LOADING,
            PerformanceErrorType2.UNCOMPRESSED_ASSET
          ].includes(error.type)) {
            stats.assetIssues++;
          } else if ([
            PerformanceErrorType2.SYNC_FILE_OPERATION,
            PerformanceErrorType2.BLOCKING_COMPUTATION,
            PerformanceErrorType2.LONG_RUNNING_FUNCTION,
            PerformanceErrorType2.HEAVY_COMPUTATION_IN_RENDER
          ].includes(error.type)) {
            stats.blockingIssues++;
          }
        }
        const bundleSavings = this.errors.filter((e) => e.metrics?.size).reduce((sum, e) => sum + e.metrics.size * 0.7, 0);
        stats.estimatedImpact = {
          bundleSizeReduction: bundleSavings > 0 ? `~${Math.round(bundleSavings)}KB` : "N/A",
          renderPerformance: stats.renderIssues > 0 ? `${stats.renderIssues} optimizations` : "N/A",
          computationTime: stats.loopIssues > 0 ? `O(n\xB2) \u2192 O(n) possible` : "N/A"
        };
        return stats;
      }
      async getFiles() {
        const allFiles = [];
        for (const pattern of this.options.includePatterns) {
          const files = await (0, glob_1.glob)(pattern, {
            cwd: this.options.workspaceRoot,
            absolute: true,
            ignore: this.options.excludePatterns
          });
          allFiles.push(...files);
        }
        return [...new Set(allFiles)];
      }
      getErrors() {
        return this.errors;
      }
      clearErrors() {
        this.errors = [];
      }
      /**
       * Backwards compatibility API for old tests
       * Maps new Phase 4 structure to old test expectations
       */
      async detect(directory) {
        const originalRoot = this.options.workspaceRoot;
        const originalPatterns = this.options.includePatterns;
        this.options.workspaceRoot = directory;
        this.options.includePatterns = ["**/*.{ts,tsx,js,jsx}"];
        const { errors } = await this.analyze();
        this.options.workspaceRoot = originalRoot;
        this.options.includePatterns = originalPatterns;
        return errors.map((error) => this.mapToOldIssue(error));
      }
      mapToOldIssue(error) {
        const typeMap = {
          [PerformanceErrorType2.SYNC_FILE_OPERATION]: "blocking-operation",
          [PerformanceErrorType2.BLOCKING_COMPUTATION]: "blocking-operation",
          [PerformanceErrorType2.LONG_RUNNING_FUNCTION]: "slow-function",
          [PerformanceErrorType2.HEAVY_COMPUTATION_IN_RENDER]: "blocking-operation",
          [PerformanceErrorType2.BUNDLE_TOO_LARGE]: "large-bundle",
          [PerformanceErrorType2.LARGE_MODULE_IMPORT]: "large-bundle",
          [PerformanceErrorType2.NESTED_LOOP_O_N_SQUARED]: "inefficient-loop",
          [PerformanceErrorType2.LOOP_WITH_DOM_ACCESS]: "inefficient-loop",
          [PerformanceErrorType2.UNOPTIMIZED_ARRAY_METHOD]: "inefficient-loop",
          [PerformanceErrorType2.LOOP_CREATING_CLOSURES]: "inefficient-loop",
          [PerformanceErrorType2.INEFFICIENT_LOOP]: "inefficient-loop",
          [PerformanceErrorType2.N_PLUS_ONE_QUERY]: "n-plus-one-query",
          [PerformanceErrorType2.UNNECESSARY_RENDER]: "memory-leak",
          [PerformanceErrorType2.MISSING_MEMO]: "memory-leak",
          [PerformanceErrorType2.MISSING_USE_CALLBACK]: "memory-leak",
          [PerformanceErrorType2.INLINE_FUNCTION_IN_JSX]: "memory-leak",
          [PerformanceErrorType2.INLINE_OBJECT_IN_JSX]: "memory-leak",
          [PerformanceErrorType2.MISSING_KEY_PROP]: "memory-leak",
          [PerformanceErrorType2.LARGE_IMAGE_WITHOUT_OPTIMIZATION]: "large-bundle",
          [PerformanceErrorType2.MISSING_LAZY_LOADING]: "large-bundle",
          [PerformanceErrorType2.UNCOMPRESSED_ASSET]: "large-bundle",
          [PerformanceErrorType2.MISSING_CODE_SPLITTING]: "large-bundle",
          [PerformanceErrorType2.NO_TREE_SHAKING]: "large-bundle",
          [PerformanceErrorType2.DUPLICATE_DEPENDENCIES]: "large-bundle",
          [PerformanceErrorType2.MISSING_CLEANUP_LOGIC]: "memory-leak",
          [PerformanceErrorType2.SLOW_FUNCTION]: "slow-function"
        };
        return {
          type: typeMap[error.type] || "slow-function",
          severity: error.severity,
          message: error.message,
          filePath: error.filePath || error.file,
          line: error.line || 1,
          column: error.column || 1,
          impact: error.metrics?.impact || error.suggestedFix || "Performance impact detected"
        };
      }
      /**
       * Old API: Format error (for backwards compatibility)
       */
      formatError(issue) {
        const severityIcons = {
          critical: "\u{1F525}",
          high: "\u26A0\uFE0F",
          medium: "\u26A1",
          low: "\u{1F4A1}"
        };
        const typeIcons = {
          "blocking-operation": "\u23F8\uFE0F",
          "slow-function": "\u{1F40C}",
          "large-bundle": "\u{1F4E6}",
          "inefficient-loop": "\u{1F504}",
          "memory-leak": "\u{1F4A7}",
          "n-plus-one-query": "\u{1F501}"
        };
        const icon = severityIcons[issue.severity] || "\u2753";
        const typeIcon = typeIcons[issue.type] || "\u{1F50D}";
        let formatted = `${icon} ${typeIcon} [${issue.severity.toUpperCase()}] ${issue.type}
`;
        formatted += `\u{1F4C4} ${issue.filePath}:${issue.line}:${issue.column}
`;
        formatted += `\u{1F4AC} ${issue.message}
`;
        if (issue.impact) {
          formatted += `
\u{1F4CA} Impact: ${issue.impact}
`;
        }
        if (issue.message.includes("lodash")) {
          formatted += `
\u2705 Fix: Use specific imports like "import debounce from 'lodash/debounce'"
`;
        } else if (issue.type === "n-plus-one-query") {
          formatted += `
\u2705 Fix: Use batch loading (e.g., Prisma findMany, Promise.all with batching)
`;
        } else if (issue.type === "blocking-operation") {
          formatted += `
\u2705 Fix: Use async alternatives (readFile, pbkdf2, exec instead of sync versions)
`;
        }
        return formatted;
      }
      /**
       * Old API: Get statistics (for backwards compatibility)
       */
      getStatistics(issues) {
        const stats = {
          totalFiles: new Set(issues.map((i) => i.filePath)).size,
          averageFileSize: 0,
          largestFiles: [],
          bySeverity: { critical: 0, high: 0, medium: 0, low: 0 },
          byType: {}
        };
        for (const issue of issues) {
          stats.bySeverity[issue.severity]++;
          stats.byType[issue.type] = (stats.byType[issue.type] || 0) + 1;
        }
        const fileSizes = /* @__PURE__ */ new Map();
        for (const issue of issues) {
          if (!fileSizes.has(issue.filePath)) {
            try {
              const content = fs4.readFileSync(issue.filePath, "utf-8");
              fileSizes.set(issue.filePath, content.length);
            } catch {
              fileSizes.set(issue.filePath, 0);
            }
          }
        }
        const sizes = Array.from(fileSizes.values());
        stats.averageFileSize = sizes.length > 0 ? sizes.reduce((a, b) => a + b, 0) / sizes.length : 0;
        stats.largestFiles = Array.from(fileSizes.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([path5, size]) => ({ path: path5, size }));
        return stats;
      }
    };
    exports2.PerformanceDetector = PerformanceDetector2;
  }
});

// src/detector/network-detector.js
var require_network_detector = __commonJS({
  "src/detector/network-detector.js"(exports2) {
    "use strict";
    var __createBinding = exports2 && exports2.__createBinding || (Object.create ? (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    }) : (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    }));
    var __setModuleDefault = exports2 && exports2.__setModuleDefault || (Object.create ? (function(o, v) {
      Object.defineProperty(o, "default", { enumerable: true, value: v });
    }) : function(o, v) {
      o["default"] = v;
    });
    var __importStar = exports2 && exports2.__importStar || /* @__PURE__ */ (function() {
      var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function(o2) {
          var ar = [];
          for (var k in o2) if (Object.prototype.hasOwnProperty.call(o2, k)) ar[ar.length] = k;
          return ar;
        };
        return ownKeys(o);
      };
      return function(mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) {
          for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        }
        __setModuleDefault(result, mod);
        return result;
      };
    })();
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.NetworkDetector = exports2.NetworkErrorType = void 0;
    var fs4 = __importStar(require("fs"));
    var path4 = __importStar(require("path"));
    var glob_1 = require("glob");
    var NetworkErrorType;
    (function(NetworkErrorType2) {
      NetworkErrorType2["FETCH_WITHOUT_ERROR_HANDLING"] = "FETCH_WITHOUT_ERROR_HANDLING";
      NetworkErrorType2["AXIOS_WITHOUT_INTERCEPTOR"] = "AXIOS_WITHOUT_INTERCEPTOR";
      NetworkErrorType2["MISSING_TIMEOUT"] = "MISSING_TIMEOUT";
      NetworkErrorType2["HARDCODED_URL"] = "HARDCODED_URL";
      NetworkErrorType2["NO_REQUEST_TIMEOUT"] = "NO_REQUEST_TIMEOUT";
      NetworkErrorType2["EXCESSIVE_TIMEOUT"] = "EXCESSIVE_TIMEOUT";
      NetworkErrorType2["MISSING_ABORT_CONTROLLER"] = "MISSING_ABORT_CONTROLLER";
      NetworkErrorType2["MISSING_RETRY_LOGIC"] = "MISSING_RETRY_LOGIC";
      NetworkErrorType2["NO_FALLBACK_MECHANISM"] = "NO_FALLBACK_MECHANISM";
      NetworkErrorType2["UNHANDLED_NETWORK_ERROR"] = "UNHANDLED_NETWORK_ERROR";
      NetworkErrorType2["CONCURRENT_REQUESTS_WITHOUT_LIMIT"] = "CONCURRENT_REQUESTS_WITHOUT_LIMIT";
      NetworkErrorType2["RACE_CONDITION_RISK"] = "RACE_CONDITION_RISK";
      NetworkErrorType2["PROMISE_ALL_WITHOUT_ERROR_HANDLING"] = "PROMISE_ALL_WITHOUT_ERROR_HANDLING";
    })(NetworkErrorType || (exports2.NetworkErrorType = NetworkErrorType = {}));
    var NetworkDetector2 = class {
      workspaceRoot;
      ignorePatterns;
      constructor(workspaceRoot) {
        this.workspaceRoot = workspaceRoot;
        this.ignorePatterns = [
          "node_modules/**",
          "dist/**",
          ".next/**",
          "out/**",
          "build/**",
          "**/*.test.*",
          "**/*.spec.*",
          "**/*.mock.*",
          "**/tests/**",
          "**/__tests__/**",
          "**/fixtures/**",
          "**/examples/**",
          "**/demo/**"
        ];
      }
      /**
       * Main detection method
       */
      async detect(targetDir) {
        const dir = targetDir || this.workspaceRoot;
        const errors = [];
        const files = await (0, glob_1.glob)("**/*.{ts,tsx,js,jsx}", {
          cwd: dir,
          ignore: this.ignorePatterns
        });
        for (const file of files) {
          const filePath = path4.join(dir, file);
          const content = fs4.readFileSync(filePath, "utf8");
          if (this.shouldExclude(filePath, content)) {
            continue;
          }
          errors.push(...this.detectFetchIssues(content, filePath));
          errors.push(...this.detectAxiosIssues(content, filePath));
          errors.push(...this.detectTimeoutIssues(content, filePath));
          errors.push(...this.detectErrorHandlingIssues(content, filePath));
          errors.push(...this.detectConcurrencyIssues(content, filePath));
        }
        return errors;
      }
      /**
       * Detect fetch patterns without proper error handling
       */
      detectFetchIssues(content, filePath) {
        const errors = [];
        const lines = content.split("\n");
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          if (/\bfetch\s*\(/.test(line)) {
            const nextLines = lines.slice(i, Math.min(i + 10, lines.length)).join("\n");
            const hasTryCatch = this.isInTryBlock(lines, i);
            const hasCatchHandler = nextLines.includes(".catch(") || nextLines.includes(".catch (");
            const hasAwaitInTry = /await\s+fetch/.test(line) && hasTryCatch;
            if (!hasTryCatch && !hasCatchHandler && !hasAwaitInTry) {
              errors.push({
                file: filePath,
                line: i + 1,
                type: NetworkErrorType.FETCH_WITHOUT_ERROR_HANDLING,
                severity: "high",
                message: "fetch() call without error handling",
                pattern: line.trim(),
                suggestedFix: `Add error handling:
try {
  const response = await fetch(url);
  if (!response.ok) throw new Error(\`HTTP \${response.status}\`);
  const data = await response.json();
} catch (error) {
  console.error('Fetch error:', error);
  // Handle error appropriately
}

Or use .catch():
fetch(url)
  .then(res => res.json())
  .catch(err => console.error(err));`,
                details: "Unhandled fetch errors can cause silent failures and poor user experience"
              });
            }
            const hasTimeout = nextLines.includes("signal:") || nextLines.includes("AbortController");
            if (!hasTimeout) {
              errors.push({
                file: filePath,
                line: i + 1,
                type: NetworkErrorType.MISSING_TIMEOUT,
                severity: "medium",
                message: "fetch() without timeout configuration",
                pattern: line.trim(),
                suggestedFix: `Add timeout using AbortController:
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 5000);

try {
  const response = await fetch(url, { signal: controller.signal });
  clearTimeout(timeoutId);
} catch (error) {
  if (error.name === 'AbortError') {
    console.error('Request timeout');
  }
}`,
                details: "Requests without timeouts can hang indefinitely"
              });
            }
          }
          const urlMatch = line.match(/fetch\s*\(\s*['"`](https?:\/\/[^'"`]+)['"`]/);
          if (urlMatch) {
            const url = urlMatch[1];
            if (!url.includes("localhost") && !url.includes("127.0.0.1") && !url.includes("example.com")) {
              errors.push({
                file: filePath,
                line: i + 1,
                type: NetworkErrorType.HARDCODED_URL,
                severity: "medium",
                message: `Hardcoded URL in fetch: ${url}`,
                pattern: line.trim(),
                suggestedFix: `Move URL to environment variable or config:
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'fallback-url';
fetch(\`\${API_URL}/endpoint\`)`,
                details: "Hardcoded URLs make it difficult to change environments (dev/staging/prod)"
              });
            }
          }
        }
        return errors;
      }
      /**
       * Detect axios patterns without proper configuration
       */
      detectAxiosIssues(content, filePath) {
        const errors = [];
        const lines = content.split("\n");
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          if (/\baxios\.(get|post|put|delete|patch|request)\s*\(/.test(line)) {
            const nextLines = lines.slice(i, Math.min(i + 10, lines.length)).join("\n");
            const hasTryCatch = this.isInTryBlock(lines, i);
            const hasCatchHandler = nextLines.includes(".catch(") || nextLines.includes(".catch (");
            if (!hasTryCatch && !hasCatchHandler) {
              errors.push({
                file: filePath,
                line: i + 1,
                type: NetworkErrorType.FETCH_WITHOUT_ERROR_HANDLING,
                severity: "high",
                message: "axios call without error handling",
                pattern: line.trim(),
                suggestedFix: `Add error handling:
try {
  const response = await axios.get(url);
  // Handle response
} catch (error) {
  if (axios.isAxiosError(error)) {
    console.error('API Error:', error.response?.status, error.message);
  }
}`,
                details: "Axios errors contain response data that should be handled"
              });
            }
            const hasTimeout = nextLines.includes("timeout:") || content.includes("axios.create");
            if (!hasTimeout) {
              errors.push({
                file: filePath,
                line: i + 1,
                type: NetworkErrorType.NO_REQUEST_TIMEOUT,
                severity: "medium",
                message: "axios call without timeout",
                pattern: line.trim(),
                suggestedFix: `Add timeout configuration:
axios.get(url, { timeout: 5000 })

Or configure axios instance:
const api = axios.create({
  baseURL: process.env.API_URL,
  timeout: 5000,
});`,
                details: "Default axios timeout is 0 (no timeout)"
              });
            }
          }
          if (/axios\.create\s*\(/.test(line)) {
            const fileContent = content;
            const hasInterceptor = fileContent.includes("interceptors.request") || fileContent.includes("interceptors.response");
            if (!hasInterceptor) {
              errors.push({
                file: filePath,
                line: i + 1,
                type: NetworkErrorType.AXIOS_WITHOUT_INTERCEPTOR,
                severity: "low",
                message: "axios instance without interceptors for error handling",
                pattern: line.trim(),
                suggestedFix: `Add interceptors for global error handling:
api.interceptors.response.use(
  response => response,
  error => {
    // Global error handling
    console.error('API Error:', error.response?.status);
    return Promise.reject(error);
  }
);`,
                details: "Interceptors provide centralized error handling and logging"
              });
            }
          }
        }
        return errors;
      }
      /**
       * Detect timeout-related issues
       */
      detectTimeoutIssues(content, filePath) {
        const errors = [];
        const lines = content.split("\n");
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          if (line.includes("setTimeout")) {
            const block = lines.slice(i, Math.min(i + 6, lines.length)).join("\n");
            const timeoutMatch = block.match(/setTimeout\s*\([\s\S]*?,\s*(\d+)\s*\)/);
            if (timeoutMatch) {
              const timeout = parseInt(timeoutMatch[1], 10);
              if (timeout > 3e4) {
                errors.push({
                  file: filePath,
                  line: i + 1,
                  type: NetworkErrorType.EXCESSIVE_TIMEOUT,
                  severity: "low",
                  message: `Excessive timeout: ${timeout}ms (${timeout / 1e3}s)`,
                  pattern: line.trim(),
                  suggestedFix: `Consider reducing timeout or using a more appropriate mechanism:
- For network requests: 5-10 seconds is usually sufficient
- For polling: Use setInterval with reasonable intervals
- For long operations: Consider WebSocket or Server-Sent Events`,
                  details: "Very long timeouts can indicate architectural issues"
                });
              }
            }
          }
          if (/Promise\.race\s*\(/.test(line)) {
            const nextLines = lines.slice(i, Math.min(i + 5, lines.length)).join("\n");
            if (nextLines.includes("setTimeout") || nextLines.includes("timeout")) {
            }
          }
        }
        return errors;
      }
      /**
       * Detect error handling issues in network code
       */
      detectErrorHandlingIssues(content, filePath) {
        const errors = [];
        const lines = content.split("\n");
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          if (/\.then\s*\(/.test(line)) {
            const lookback = Math.max(0, i - 5);
            const prevLines = lines.slice(lookback, i + 1).join("\n");
            const isNetworkCall = prevLines.includes("fetch") || prevLines.includes("axios") || prevLines.includes("http.get") || prevLines.includes("http.post") || prevLines.includes("request(");
            const nextLines = lines.slice(i, Math.min(i + 10, lines.length)).join("\n");
            const hasCatch = nextLines.includes(".catch(") || nextLines.includes(".catch (");
            if (isNetworkCall && !hasCatch) {
              errors.push({
                file: filePath,
                line: i + 1,
                type: NetworkErrorType.UNHANDLED_NETWORK_ERROR,
                severity: "high",
                message: ".then() without .catch() handler",
                pattern: line.trim(),
                suggestedFix: `Add .catch() handler:
fetch(url)
  .then(res => res.json())
  .then(data => console.log(data))
  .catch(error => {
    console.error('Network error:', error);
    // Handle error appropriately
  });`,
                details: "Unhandled promise rejections can crash Node.js applications"
              });
            }
          }
          if (/const\s+response\s*=\s*await\s+fetch/.test(line)) {
            const nextLines = lines.slice(i, Math.min(i + 5, lines.length)).join("\n");
            const hasOkCheck = nextLines.includes("response.ok") || nextLines.includes("response.status") || nextLines.includes("!response.ok");
            if (!hasOkCheck) {
              errors.push({
                file: filePath,
                line: i + 1,
                type: NetworkErrorType.UNHANDLED_NETWORK_ERROR,
                severity: "medium",
                message: "fetch response without status check",
                pattern: line.trim(),
                suggestedFix: `Check response status:
const response = await fetch(url);
if (!response.ok) {
  throw new Error(\`HTTP error! status: \${response.status}\`);
}
const data = await response.json();`,
                details: "fetch() does not reject on HTTP errors (404, 500, etc.)"
              });
            }
          }
        }
        return errors;
      }
      /**
       * Detect concurrency and race condition issues
       */
      detectConcurrencyIssues(content, filePath) {
        const errors = [];
        const lines = content.split("\n");
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          if (/Promise\.all\s*\(/.test(line)) {
            const nextLines = lines.slice(i, Math.min(i + 10, lines.length)).join("\n");
            const hasCatch = nextLines.includes(".catch(") || this.isInTryBlock(lines, i);
            if (!hasCatch) {
              errors.push({
                file: filePath,
                line: i + 1,
                type: NetworkErrorType.PROMISE_ALL_WITHOUT_ERROR_HANDLING,
                severity: "high",
                message: "Promise.all() without error handling",
                pattern: line.trim(),
                suggestedFix: `Add error handling and consider Promise.allSettled:
// Option 1: Handle errors
try {
  const results = await Promise.all(promises);
} catch (error) {
  console.error('One or more promises failed:', error);
}

// Option 2: Use Promise.allSettled (continues even if some fail)
const results = await Promise.allSettled(promises);
results.forEach((result, index) => {
  if (result.status === 'rejected') {
    console.error(\`Promise \${index} failed:\`, result.reason);
  }
});`,
                details: "Promise.all() rejects immediately if any promise rejects"
              });
            }
            const nextFewLines = lines.slice(i, Math.min(i + 3, lines.length)).join("\n");
            const hasInlineMap = /.map\(.*=>/s.test(nextFewLines) && (nextFewLines.includes("fetch") || nextFewLines.includes("axios"));
            const prevLines = lines.slice(Math.max(0, i - 5), i + 1).join("\n");
            const hasPreviousMap = /\.map\s*\([^)]*=>\s*(fetch|axios)/s.test(prevLines);
            if (hasInlineMap || hasPreviousMap) {
              errors.push({
                file: filePath,
                line: i + 1,
                type: NetworkErrorType.CONCURRENT_REQUESTS_WITHOUT_LIMIT,
                severity: "medium",
                message: "Unlimited concurrent requests detected",
                pattern: line.trim(),
                suggestedFix: `Limit concurrent requests using p-limit or similar:
import pLimit from 'p-limit';

const limit = pLimit(5); // Max 5 concurrent requests
const promises = items.map(item => 
  limit(() => fetch(\`/api/\${item}\`))
);
const results = await Promise.all(promises);

Or implement batching:
async function batchRequests<T>(items: T[], batchSize: number, fn: (item: T) => Promise<any>) {
  const results = [];
  for (let i = 0; i < items.length; i += batchSize) {
  const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(fn));
    results.push(...batchResults);
  }
  return results;
}`,
                details: "Too many concurrent requests can overwhelm servers and cause rate limiting"
              });
            }
          }
          if (/setState|setIsLoading|setData/.test(line)) {
            const prevLines = lines.slice(Math.max(0, i - 10), i + 1).join("\n");
            const hasAwait = /await\s+(fetch|axios|response\.json)/.test(prevLines);
            if (hasAwait) {
              const functionLines = lines.slice(Math.max(0, i - 40), Math.min(i + 15, lines.length)).join("\n");
              const hasUseEffect = functionLines.includes("useEffect");
              const hasAbortController = /AbortController|controller\s*=\s*new\s+AbortController/.test(functionLines);
              const hasCleanupReturn = /return\s*\(\s*\)\s*=>/.test(functionLines);
              const hasCleanup = hasUseEffect && hasAbortController && hasCleanupReturn;
              if (!hasCleanup && hasUseEffect) {
                errors.push({
                  file: filePath,
                  line: i + 1,
                  type: NetworkErrorType.RACE_CONDITION_RISK,
                  severity: "medium",
                  message: "Potential race condition: setState after async operation without cleanup",
                  pattern: line.trim(),
                  suggestedFix: `Add cleanup in useEffect to prevent race conditions:
useEffect(() => {
  const controller = new AbortController();
  
  async function fetchData() {
    try {
      const response = await fetch(url, { signal: controller.signal });
      const data = await response.json();
      setData(data); // Safe: request was not aborted
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error(error);
      }
    }
  }
  
  fetchData();
  
  return () => {
    controller.abort(); // Cancel request on unmount
  };
}, [url]);`,
                  details: "Race conditions occur when component unmounts before async operation completes"
                });
              }
            }
          }
        }
        return errors;
      }
      /**
       * Check if line is in try block
       */
      isInTryBlock(lines, lineIndex) {
        let braceCount = 0;
        for (let i = lineIndex; i >= 0; i--) {
          const line = lines[i];
          for (const char of line) {
            if (char === "}")
              braceCount++;
            if (char === "{")
              braceCount--;
          }
          if (braceCount < 0 && /try\s*\{/.test(line)) {
            return true;
          }
          if (braceCount > 0) {
            return false;
          }
        }
        return false;
      }
      /**
       * Check if file should be excluded
       */
      shouldExclude(filePath, content) {
        if (filePath.includes("config") && (filePath.endsWith(".config.ts") || filePath.endsWith(".config.js"))) {
          return true;
        }
        if (filePath.endsWith(".d.ts")) {
          return true;
        }
        const lines = content.split("\n");
        const typeLines = lines.filter((line) => /^\s*(export\s+)?(interface|type|enum)\s+/.test(line)).length;
        if (typeLines > lines.length * 0.3) {
          return true;
        }
        return false;
      }
      /**
       * Get statistics about detected issues
       */
      getStatistics(errors) {
        const stats = {
          totalIssues: errors.length,
          bySeverity: { critical: 0, high: 0, medium: 0, low: 0 },
          byType: {},
          affectedFiles: new Set(errors.map((e) => e.file)).size,
          apiCallsDetected: 0,
          timeoutIssues: 0,
          errorHandlingIssues: 0,
          concurrencyIssues: 0
        };
        for (const type of Object.values(NetworkErrorType)) {
          stats.byType[type] = 0;
        }
        for (const error of errors) {
          stats.bySeverity[error.severity]++;
          stats.byType[error.type]++;
          if ([
            NetworkErrorType.FETCH_WITHOUT_ERROR_HANDLING,
            NetworkErrorType.AXIOS_WITHOUT_INTERCEPTOR,
            NetworkErrorType.HARDCODED_URL
          ].includes(error.type)) {
            stats.apiCallsDetected++;
          }
          if ([
            NetworkErrorType.MISSING_TIMEOUT,
            NetworkErrorType.NO_REQUEST_TIMEOUT,
            NetworkErrorType.EXCESSIVE_TIMEOUT,
            NetworkErrorType.MISSING_ABORT_CONTROLLER
          ].includes(error.type)) {
            stats.timeoutIssues++;
          }
          if ([
            NetworkErrorType.UNHANDLED_NETWORK_ERROR,
            NetworkErrorType.MISSING_RETRY_LOGIC,
            NetworkErrorType.NO_FALLBACK_MECHANISM
          ].includes(error.type)) {
            stats.errorHandlingIssues++;
          }
          if ([
            NetworkErrorType.CONCURRENT_REQUESTS_WITHOUT_LIMIT,
            NetworkErrorType.RACE_CONDITION_RISK,
            NetworkErrorType.PROMISE_ALL_WITHOUT_ERROR_HANDLING
          ].includes(error.type)) {
            stats.concurrencyIssues++;
          }
        }
        return stats;
      }
      /**
       * Format error for display
       */
      formatError(error) {
        const relPath = path4.relative(this.workspaceRoot, error.file);
        const emoji = this.getSeverityEmoji(error.severity);
        const typeEmoji = this.getTypeEmoji(error.type);
        return `
${emoji} ${typeEmoji} NETWORK ISSUE [${error.type}] [${error.severity.toUpperCase()}]
\u{1F4C1} File: ${relPath}${error.line ? `:${error.line}` : ""}
\u{1F4AC} ${error.message}
${error.pattern ? `
\u{1F4CB} Pattern: ${error.pattern}` : ""}

\u2705 Suggested Fix:
${error.suggestedFix}
${error.details ? `
\u{1F50D} Details: ${error.details}` : ""}
${"\u2500".repeat(60)}
`;
      }
      /**
       * Get emoji for severity
       */
      getSeverityEmoji(severity) {
        const emojis = {
          critical: "\u{1F4A5}",
          high: "\u{1F525}",
          medium: "\u26A0\uFE0F",
          low: "\u2139\uFE0F"
        };
        return emojis[severity] || "\u2753";
      }
      /**
       * Get emoji for error type
       */
      getTypeEmoji(type) {
        const categoryEmojis = {
          FETCH: "\u{1F310}",
          AXIOS: "\u{1F4E1}",
          TIMEOUT: "\u23F1\uFE0F",
          ERROR: "\u274C",
          CONCURRENCY: "\u{1F500}",
          URL: "\u{1F517}"
        };
        for (const [key, emoji] of Object.entries(categoryEmojis)) {
          if (type.includes(key)) {
            return emoji;
          }
        }
        return "\u{1F50D}";
      }
    };
    exports2.NetworkDetector = NetworkDetector2;
  }
});

// src/detector/complexity-detector.js
var require_complexity_detector = __commonJS({
  "src/detector/complexity-detector.js"(exports2) {
    "use strict";
    var __createBinding = exports2 && exports2.__createBinding || (Object.create ? (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    }) : (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    }));
    var __setModuleDefault = exports2 && exports2.__setModuleDefault || (Object.create ? (function(o, v) {
      Object.defineProperty(o, "default", { enumerable: true, value: v });
    }) : function(o, v) {
      o["default"] = v;
    });
    var __importStar = exports2 && exports2.__importStar || /* @__PURE__ */ (function() {
      var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function(o2) {
          var ar = [];
          for (var k in o2) if (Object.prototype.hasOwnProperty.call(o2, k)) ar[ar.length] = k;
          return ar;
        };
        return ownKeys(o);
      };
      return function(mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) {
          for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        }
        __setModuleDefault(result, mod);
        return result;
      };
    })();
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.ComplexityDetector = exports2.ComplexityErrorType = void 0;
    var ComplexityErrorType2;
    (function(ComplexityErrorType3) {
      ComplexityErrorType3["HIGH_COGNITIVE_COMPLEXITY"] = "HIGH_COGNITIVE_COMPLEXITY";
      ComplexityErrorType3["HIGH_CYCLOMATIC_COMPLEXITY"] = "HIGH_CYCLOMATIC_COMPLEXITY";
      ComplexityErrorType3["EXCESSIVE_FUNCTION_LENGTH"] = "EXCESSIVE_FUNCTION_LENGTH";
      ComplexityErrorType3["EXCESSIVE_NESTING_DEPTH"] = "EXCESSIVE_NESTING_DEPTH";
      ComplexityErrorType3["CODE_DUPLICATION"] = "CODE_DUPLICATION";
    })(ComplexityErrorType2 || (exports2.ComplexityErrorType = ComplexityErrorType2 = {}));
    var ComplexityDetector2 = class {
      errors = [];
      processedFiles = 0;
      totalLines = 0;
      /**
       * Main detection entry point
       */
      async detect(directory) {
        const fs4 = await Promise.resolve().then(() => __importStar(require("fs")));
        const path4 = await Promise.resolve().then(() => __importStar(require("path")));
        this.errors = [];
        this.processedFiles = 0;
        this.totalLines = 0;
        const scanDir = (dir) => {
          if (!fs4.existsSync(dir))
            return;
          const entries = fs4.readdirSync(dir, { withFileTypes: true });
          for (const entry of entries) {
            const fullPath = path4.join(dir, entry.name);
            if (entry.name === "node_modules" || entry.name === "dist" || entry.name === ".git" || entry.name === "coverage" || entry.name === ".next") {
              continue;
            }
            if (entry.isDirectory()) {
              scanDir(fullPath);
            } else if (this.shouldAnalyze(entry.name)) {
              const content = fs4.readFileSync(fullPath, "utf-8");
              this.analyzeFile(fullPath, content);
              this.processedFiles++;
            }
          }
        };
        scanDir(directory);
        return this.errors;
      }
      /**
       * Check if file should be analyzed
       */
      shouldAnalyze(filename) {
        const extensions = [".ts", ".tsx", ".js", ".jsx"];
        if (filename.includes(".test.") || filename.includes(".spec.")) {
          return false;
        }
        return extensions.some((ext) => filename.endsWith(ext));
      }
      /**
       * Analyze a single file for complexity issues
       */
      analyzeFile(file, content) {
        const lines = content.split("\n");
        this.totalLines += lines.length;
        this.detectCognitiveComplexity(file, content);
        this.detectCyclomaticComplexity(file, content);
        this.detectExcessiveFunctionLength(file, content);
        this.detectExcessiveNesting(file, content);
        this.detectCodeDuplication(file, content);
      }
      /**
       * 1. Cognitive Complexity Detection
       *
       * Measures how difficult code is to understand:
       * - Nested structures increase complexity non-linearly
       * - Breaks in linear flow (if/else/loops) increase complexity
       * - Logical operators (&&, ||) in conditions increase complexity
       *
       * Thresholds:
       * - >15: Medium (harder to understand)
       * - >25: High (refactoring recommended)
       * - >40: Critical (urgent refactoring needed)
       */
      detectCognitiveComplexity(file, content) {
        const lines = content.split("\n");
        let inFunction = false;
        let functionName = "";
        let functionStartLine = 0;
        let braceDepth = 0;
        let functionBraceDepth = 0;
        let cognitiveScore = 0;
        let nestingLevel = 0;
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          const trimmed = line.trim();
          if (trimmed.startsWith("//") || trimmed.startsWith("/*") || trimmed === "") {
            continue;
          }
          const openBraces = (line.match(/\{/g) || []).length;
          const closeBraces = (line.match(/\}/g) || []).length;
          braceDepth += openBraces - closeBraces;
          let isFunctionStart = false;
          let funcName = "anonymous";
          if (/function\s+(\w+)/.test(line)) {
            isFunctionStart = true;
            const match = line.match(/function\s+(\w+)/);
            funcName = match?.[1] || "anonymous";
          } else if (/async\s+function\s+(\w+)/.test(line)) {
            isFunctionStart = true;
            const match = line.match(/async\s+function\s+(\w+)/);
            funcName = match?.[1] || "anonymous";
          } else if (/const\s+(\w+)\s*=\s*(?:async\s+)?\([^)]*\)\s*=>/.test(line)) {
            isFunctionStart = true;
            const match = line.match(/const\s+(\w+)\s*=/);
            funcName = match?.[1] || "anonymous";
          } else if (/(\w+)\s*[:=]\s*(?:async\s+)?function/.test(line)) {
            isFunctionStart = true;
            const match = line.match(/(\w+)\s*[:=]/);
            funcName = match?.[1] || "anonymous";
          }
          if (isFunctionStart) {
            inFunction = true;
            functionName = funcName;
            functionStartLine = i + 1;
            functionBraceDepth = braceDepth;
            cognitiveScore = 0;
            nestingLevel = 0;
          }
          if (inFunction) {
            if (/\bif\s*\(/.test(trimmed)) {
              cognitiveScore += 1 + nestingLevel;
              nestingLevel++;
            } else if (/\belse\b/.test(trimmed)) {
              cognitiveScore += 1;
            }
            if (/\b(for|while|do)\s*\(/.test(trimmed) || /\.(forEach|map|filter|reduce)\s*\(/.test(trimmed)) {
              cognitiveScore += 1 + nestingLevel;
              nestingLevel++;
            }
            if (/\bswitch\s*\(/.test(trimmed)) {
              cognitiveScore += 1 + nestingLevel;
              nestingLevel++;
            }
            if (/\bcase\b/.test(trimmed)) {
              cognitiveScore += 1;
            }
            const logicalOps = (trimmed.match(/&&|\|\|/g) || []).length;
            cognitiveScore += logicalOps;
            if (functionName && new RegExp(`\\b${functionName}\\s*\\(`).test(trimmed)) {
              cognitiveScore += 1;
            }
            if (/\?.*:/.test(trimmed)) {
              cognitiveScore += 1 + nestingLevel;
            }
            if (closeBraces > 0 && nestingLevel > 0) {
              nestingLevel = Math.max(0, nestingLevel - closeBraces);
            }
            if (braceDepth <= functionBraceDepth && closeBraces > 0 && i > functionStartLine) {
              if (cognitiveScore > 15) {
                const severity = cognitiveScore > 40 ? "critical" : cognitiveScore > 25 ? "high" : "medium";
                this.errors.push({
                  file,
                  line: functionStartLine,
                  type: ComplexityErrorType2.HIGH_COGNITIVE_COMPLEXITY,
                  severity,
                  message: `Function '${functionName}' has high cognitive complexity (${cognitiveScore})`,
                  pattern: lines[functionStartLine - 1].trim(),
                  suggestedFix: "Break down into smaller functions, reduce nesting, extract complex conditions",
                  details: `Cognitive complexity: ${cognitiveScore} (threshold: 15)`,
                  metrics: { complexity: cognitiveScore, threshold: 15 }
                });
              }
              inFunction = false;
            }
          }
        }
      }
      /**
       * 2. Cyclomatic Complexity Detection
       *
       * Measures the number of linearly independent paths through code:
       * - Each decision point (if, while, for, case, &&, ||) adds 1
       * - Higher complexity = harder to test
       *
       * Thresholds:
       * - >10: Medium (consider refactoring)
       * - >15: High (hard to test)
       * - >20: Critical (very hard to test)
       */
      detectCyclomaticComplexity(file, content) {
        const lines = content.split("\n");
        let inFunction = false;
        let functionName = "";
        let functionStartLine = 0;
        let braceDepth = 0;
        let functionBraceDepth = 0;
        let cyclomaticScore = 1;
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          const trimmed = line.trim();
          if (trimmed.startsWith("//") || trimmed.startsWith("/*") || trimmed === "") {
            continue;
          }
          const openBraces = (line.match(/\{/g) || []).length;
          const closeBraces = (line.match(/\}/g) || []).length;
          braceDepth += openBraces - closeBraces;
          let isFunctionStart = false;
          let funcName = "anonymous";
          if (/function\s+(\w+)/.test(line)) {
            isFunctionStart = true;
            const match = line.match(/function\s+(\w+)/);
            funcName = match?.[1] || "anonymous";
          } else if (/async\s+function\s+(\w+)/.test(line)) {
            isFunctionStart = true;
            const match = line.match(/async\s+function\s+(\w+)/);
            funcName = match?.[1] || "anonymous";
          } else if (/const\s+(\w+)\s*=\s*(?:async\s+)?\([^)]*\)\s*=>/.test(line)) {
            isFunctionStart = true;
            const match = line.match(/const\s+(\w+)\s*=/);
            funcName = match?.[1] || "anonymous";
          } else if (/(\w+)\s*[:=]\s*(?:async\s+)?function/.test(line)) {
            isFunctionStart = true;
            const match = line.match(/(\w+)\s*[:=]/);
            funcName = match?.[1] || "anonymous";
          }
          if (isFunctionStart) {
            inFunction = true;
            functionName = funcName;
            functionStartLine = i + 1;
            functionBraceDepth = braceDepth;
            cyclomaticScore = 1;
          }
          if (inFunction) {
            cyclomaticScore += (trimmed.match(/\bif\s*\(/g) || []).length;
            cyclomaticScore += (trimmed.match(/\belse\s+if\s*\(/g) || []).length;
            cyclomaticScore += (trimmed.match(/\b(for|while|do)\s*\(/g) || []).length;
            cyclomaticScore += (trimmed.match(/\bcase\b/g) || []).length;
            cyclomaticScore += (trimmed.match(/&&|\|\|/g) || []).length;
            cyclomaticScore += (trimmed.match(/\?/g) || []).length;
            cyclomaticScore += (trimmed.match(/\bcatch\s*\(/g) || []).length;
            if (braceDepth <= functionBraceDepth && closeBraces > 0 && i > functionStartLine) {
              if (cyclomaticScore > 10) {
                const severity = cyclomaticScore > 20 ? "critical" : cyclomaticScore > 15 ? "high" : "medium";
                this.errors.push({
                  file,
                  line: functionStartLine,
                  type: ComplexityErrorType2.HIGH_CYCLOMATIC_COMPLEXITY,
                  severity,
                  message: `Function '${functionName}' has high cyclomatic complexity (${cyclomaticScore})`,
                  pattern: lines[functionStartLine - 1].trim(),
                  suggestedFix: "Split into smaller functions, use early returns, extract conditions to named functions",
                  details: `Cyclomatic complexity: ${cyclomaticScore} (threshold: 10)`,
                  metrics: { complexity: cyclomaticScore, threshold: 10 }
                });
              }
              inFunction = false;
            }
          }
        }
      }
      /**
       * 3. Function Length Detection
       *
       * Long functions are harder to understand and maintain:
       * - >100 lines: Medium (consider splitting)
       * - >200 lines: High (definitely split)
       * - >300 lines: Critical (urgent refactoring)
       */
      detectExcessiveFunctionLength(file, content) {
        const lines = content.split("\n");
        let inFunction = false;
        let functionName = "";
        let functionStartLine = 0;
        let braceDepth = 0;
        let functionBraceDepth = 0;
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          const trimmed = line.trim();
          const openBraces = (line.match(/\{/g) || []).length;
          const closeBraces = (line.match(/\}/g) || []).length;
          braceDepth += openBraces - closeBraces;
          const funcMatch = /(?:function\s+(\w+)|(\w+)\s*[:=]\s*(?:async\s+)?(?:function|\([^)]*\)\s*=>)|const\s+(\w+)\s*=\s*(?:async\s+)?\([^)]*\)\s*=>|const\s+(\w+)\s*=\s*\(\)\s*=>)/;
          if (funcMatch.test(line)) {
            inFunction = true;
            const match = line.match(/(?:function\s+(\w+)|(\w+)\s*[:=]|const\s+(\w+)\s*=)/);
            functionName = match?.[1] || match?.[2] || match?.[3] || "anonymous";
            functionStartLine = i + 1;
            functionBraceDepth = braceDepth;
          }
          if (inFunction) {
            if (braceDepth <= functionBraceDepth && closeBraces > 0 && i > functionStartLine) {
              const functionLength = i - functionStartLine + 1;
              if (functionLength > 100) {
                const severity = functionLength > 300 ? "critical" : functionLength > 200 ? "high" : "medium";
                this.errors.push({
                  file,
                  line: functionStartLine,
                  type: ComplexityErrorType2.EXCESSIVE_FUNCTION_LENGTH,
                  severity,
                  message: `Function '${functionName}' is too long (${functionLength} lines)`,
                  pattern: lines[functionStartLine - 1].trim(),
                  suggestedFix: "Break down into smaller, focused functions. Extract logical sections",
                  details: `Function length: ${functionLength} lines (threshold: 100)`,
                  metrics: { length: functionLength, threshold: 100 }
                });
              }
              inFunction = false;
            }
          }
        }
      }
      /**
       * 4. Nesting Depth Detection
       *
       * Deep nesting makes code hard to follow:
       * - >4 levels: Medium (getting complex)
       * - >6 levels: High (refactor recommended)
       * - >8 levels: Critical (urgent refactoring)
       */
      detectExcessiveNesting(file, content) {
        const lines = content.split("\n");
        let currentDepth = 0;
        let maxDepthInFunction = 0;
        let maxDepthLine = 0;
        let inFunction = false;
        let functionName = "";
        let functionStartLine = 0;
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          const trimmed = line.trim();
          if (trimmed.startsWith("//") || trimmed.startsWith("/*") || trimmed === "") {
            continue;
          }
          let isFunctionStart = false;
          let funcName = "anonymous";
          if (/function\s+(\w+)/.test(line)) {
            isFunctionStart = true;
            const match = line.match(/function\s+(\w+)/);
            funcName = match?.[1] || "anonymous";
          } else if (/async\s+function\s+(\w+)/.test(line)) {
            isFunctionStart = true;
            const match = line.match(/async\s+function\s+(\w+)/);
            funcName = match?.[1] || "anonymous";
          } else if (/const\s+(\w+)\s*=\s*(?:async\s+)?\([^)]*\)\s*=>/.test(line)) {
            isFunctionStart = true;
            const match = line.match(/const\s+(\w+)\s*=/);
            funcName = match?.[1] || "anonymous";
          } else if (/(\w+)\s*[:=]\s*(?:async\s+)?function/.test(line)) {
            isFunctionStart = true;
            const match = line.match(/(\w+)\s*[:=]/);
            funcName = match?.[1] || "anonymous";
          }
          if (isFunctionStart) {
            if (inFunction && maxDepthInFunction > 4) {
              const severity = maxDepthInFunction > 8 ? "critical" : maxDepthInFunction > 6 ? "high" : "medium";
              this.errors.push({
                file,
                line: maxDepthLine,
                type: ComplexityErrorType2.EXCESSIVE_NESTING_DEPTH,
                severity,
                message: `Excessive nesting depth (${maxDepthInFunction} levels) in function '${functionName}'`,
                pattern: lines[maxDepthLine - 1].trim(),
                suggestedFix: "Use early returns, extract nested logic to separate functions, flatten structure",
                details: `Nesting depth: ${maxDepthInFunction} levels (threshold: 4)`,
                metrics: { nestingDepth: maxDepthInFunction, threshold: 4 }
              });
            }
            inFunction = true;
            functionName = funcName;
            functionStartLine = i + 1;
            currentDepth = 0;
            maxDepthInFunction = 0;
          }
          if (inFunction) {
            const controlFlowPattern = /\b(if|for|while|switch|try|catch)\s*\(/;
            const elsePattern = /\belse\b/;
            const controlFlowMatches = (trimmed.match(/\b(if|for|while|switch|try|catch)\s*\(/g) || []).length;
            const elseMatches = (trimmed.match(/\belse\b/g) || []).length;
            currentDepth += controlFlowMatches + elseMatches;
            const openBraces = (line.match(/\{/g) || []).length;
            const closeBraces = (line.match(/\}/g) || []).length;
            const netCloseBraces = closeBraces - openBraces;
            if (netCloseBraces > 0) {
              currentDepth = Math.max(0, currentDepth - netCloseBraces);
            }
            if (currentDepth > maxDepthInFunction) {
              maxDepthInFunction = currentDepth;
              maxDepthLine = i + 1;
            }
          }
        }
        if (inFunction && maxDepthInFunction > 4) {
          const severity = maxDepthInFunction > 8 ? "critical" : maxDepthInFunction > 6 ? "high" : "medium";
          this.errors.push({
            file,
            line: maxDepthLine,
            type: ComplexityErrorType2.EXCESSIVE_NESTING_DEPTH,
            severity,
            message: `Excessive nesting depth (${maxDepthInFunction} levels) in function '${functionName}'`,
            pattern: lines[maxDepthLine - 1].trim(),
            suggestedFix: "Use early returns, extract nested logic to separate functions, flatten structure",
            details: `Nesting depth: ${maxDepthInFunction} levels (threshold: 4)`,
            metrics: { nestingDepth: maxDepthInFunction, threshold: 4 }
          });
        }
      }
      /**
       * 5. Code Duplication Detection
       *
       * Detects duplicate code blocks (violates DRY principle):
       * - Exact match of 10+ lines
       * - Similar patterns (80%+ similarity)
       *
       * Severity based on duplication size:
       * - 10-20 lines: Medium
       * - 20-50 lines: High
       * - >50 lines: Critical
       */
      detectCodeDuplication(file, content) {
        const lines = content.split("\n");
        const minDuplicateLines = 10;
        const lineHashes = /* @__PURE__ */ new Map();
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trim();
          if (line === "" || line.startsWith("//") || line.startsWith("/*") || line.startsWith("*")) {
            continue;
          }
          const normalized = line.replace(/\s+/g, " ");
          if (!lineHashes.has(normalized)) {
            lineHashes.set(normalized, []);
          }
          lineHashes.get(normalized).push(i);
        }
        const processedRanges = /* @__PURE__ */ new Set();
        for (const [hash, positions] of lineHashes) {
          if (positions.length < 2)
            continue;
          for (let i = 0; i < positions.length; i++) {
            for (let j = i + 1; j < positions.length; j++) {
              const start1 = positions[i];
              const start2 = positions[j];
              let matchCount = 0;
              while (start1 + matchCount < lines.length && start2 + matchCount < lines.length && this.normalizeCode(lines[start1 + matchCount]) === this.normalizeCode(lines[start2 + matchCount])) {
                matchCount++;
              }
              if (matchCount >= minDuplicateLines) {
                const rangeKey = `${start1}-${start2}-${matchCount}`;
                if (processedRanges.has(rangeKey))
                  continue;
                processedRanges.add(rangeKey);
                const severity = matchCount > 50 ? "critical" : matchCount > 20 ? "high" : "medium";
                this.errors.push({
                  file,
                  line: start1 + 1,
                  type: ComplexityErrorType2.CODE_DUPLICATION,
                  severity,
                  message: `Duplicate code block detected (${matchCount} lines, also at line ${start2 + 1})`,
                  pattern: lines[start1].trim(),
                  suggestedFix: "Extract to shared function, create reusable utility, apply DRY principle",
                  details: `Duplicate: lines ${start1 + 1}-${start1 + matchCount} match lines ${start2 + 1}-${start2 + matchCount}`,
                  metrics: { duplicateLines: matchCount, threshold: minDuplicateLines }
                });
              }
            }
          }
        }
      }
      /**
       * Normalize code for comparison (remove whitespace, standardize formatting)
       */
      normalizeCode(line) {
        return line.trim().replace(/\s+/g, " ").replace(/\s*([{}()[\];,])\s*/g, "$1");
      }
      /**
       * Calculate aggregate statistics
       */
      calculateStatistics() {
        const stats = {
          totalErrors: this.errors.length,
          bySeverity: { low: 0, medium: 0, high: 0, critical: 0 },
          byType: {},
          averageComplexity: 0,
          averageFunctionLength: 0,
          maxNestingDepth: 0,
          duplicationPercentage: 0
        };
        let totalComplexity = 0;
        let complexityCount = 0;
        let totalFunctionLength = 0;
        let lengthCount = 0;
        let totalDuplicateLines = 0;
        for (const error of this.errors) {
          stats.bySeverity[error.severity]++;
          stats.byType[error.type] = (stats.byType[error.type] || 0) + 1;
          if (error.metrics?.complexity) {
            totalComplexity += error.metrics.complexity;
            complexityCount++;
          }
          if (error.metrics?.length) {
            totalFunctionLength += error.metrics.length;
            lengthCount++;
          }
          if (error.metrics?.nestingDepth && error.metrics.nestingDepth > stats.maxNestingDepth) {
            stats.maxNestingDepth = error.metrics.nestingDepth;
          }
          if (error.metrics?.duplicateLines) {
            totalDuplicateLines += error.metrics.duplicateLines;
          }
        }
        stats.averageComplexity = complexityCount > 0 ? Math.round(totalComplexity / complexityCount) : 0;
        stats.averageFunctionLength = lengthCount > 0 ? Math.round(totalFunctionLength / lengthCount) : 0;
        stats.duplicationPercentage = this.totalLines > 0 ? Math.round(totalDuplicateLines / this.totalLines * 100) : 0;
        return stats;
      }
      /**
       * Format error for display
       */
      formatError(error) {
        const icon = {
          low: "\u{1F4D8}",
          medium: "\u{1F4D9}",
          high: "\u{1F4D5}",
          critical: "\u{1F525}"
        }[error.severity];
        let output = `${icon} ${error.message}
`;
        output += `   File: ${error.file}:${error.line}
`;
        output += `   Pattern: ${error.pattern}
`;
        output += `   Fix: ${error.suggestedFix}
`;
        if (error.details) {
          output += `   Details: ${error.details}
`;
        }
        return output;
      }
    };
    exports2.ComplexityDetector = ComplexityDetector2;
  }
});

// src/learning/pattern-learning-schema.ts
var DEFAULT_LEARNING_CONFIG;
var init_pattern_learning_schema = __esm({
  "src/learning/pattern-learning-schema.ts"() {
    "use strict";
    DEFAULT_LEARNING_CONFIG = {
      enabled: true,
      minDetectionsForStability: 10,
      deprecateAfterDays: 90,
      autoSkipThreshold: 0.7,
      // Skip if >70% false positive rate
      confidenceBoost: 0.15,
      // +15% confidence for high performers
      confidencePenalty: 0.25,
      // -25% confidence for low performers
      enableAutoFixSuggestions: true,
      autoFixMinConfidence: 85,
      databasePath: ".odavl/learning/patterns.json"
    };
  }
});

// src/learning/pattern-memory.ts
var pattern_memory_exports = {};
__export(pattern_memory_exports, {
  PatternMemory: () => PatternMemory,
  getPatternMemory: () => getPatternMemory,
  resetPatternMemory: () => resetPatternMemory
});
function getPatternMemory(config) {
  if (!globalInstance) {
    globalInstance = new PatternMemory(config);
  }
  return globalInstance;
}
function resetPatternMemory() {
  globalInstance = null;
}
var import_node_fs, import_node_path, import_node_crypto, PatternMemory, globalInstance;
var init_pattern_memory = __esm({
  "src/learning/pattern-memory.ts"() {
    "use strict";
    import_node_fs = require("fs");
    import_node_path = require("path");
    import_node_crypto = require("crypto");
    init_pattern_learning_schema();
    PatternMemory = class {
      database;
      config;
      dirty = false;
      // Track if database needs saving
      constructor(config = {}) {
        this.config = { ...DEFAULT_LEARNING_CONFIG, ...config };
        this.database = this.loadDatabase();
      }
      /**
       * Load pattern database from disk
       */
      loadDatabase() {
        const dbPath = this.config.databasePath;
        if (!(0, import_node_fs.existsSync)(dbPath)) {
          return this.createEmptyDatabase();
        }
        try {
          const content = (0, import_node_fs.readFileSync)(dbPath, "utf-8");
          return JSON.parse(content);
        } catch (error) {
          console.warn(`[PatternMemory] Failed to load database, creating new one:`, error);
          return this.createEmptyDatabase();
        }
      }
      /**
       * Create empty pattern database
       */
      createEmptyDatabase() {
        return {
          version: "3.0.0",
          created: (/* @__PURE__ */ new Date()).toISOString(),
          lastUpdated: (/* @__PURE__ */ new Date()).toISOString(),
          patterns: {},
          globalStats: {
            totalPatterns: 0,
            activePatterns: 0,
            deprecatedPatterns: 0,
            totalDetections: 0,
            totalCorrections: 0,
            overallSuccessRate: 0,
            overallFalsePositiveRate: 0
          },
          detectorStats: {}
        };
      }
      /**
       * Save database to disk
       */
      saveDatabase() {
        if (!this.dirty) return;
        const dbPath = this.config.databasePath;
        const dbDir = (0, import_node_path.dirname)(dbPath);
        if (!(0, import_node_fs.existsSync)(dbDir)) {
          (0, import_node_fs.mkdirSync)(dbDir, { recursive: true });
        }
        this.database.lastUpdated = (/* @__PURE__ */ new Date()).toISOString();
        (0, import_node_fs.writeFileSync)(dbPath, JSON.stringify(this.database, null, 2), "utf-8");
        this.dirty = false;
      }
      /**
       * Generate unique pattern ID from signature
       */
      generatePatternId(signature) {
        const hash = (0, import_node_crypto.createHash)("sha256").update(`${signature.detector}:${signature.patternType}:${signature.filePath}:${signature.line}`).digest("hex").slice(0, 16);
        return `${signature.detector}-${signature.patternType}-${hash}`;
      }
      /**
       * Generate signature hash for pattern matching
       */
      generateSignatureHash(signature) {
        return (0, import_node_crypto.createHash)("sha256").update(JSON.stringify({
          detector: signature.detector,
          patternType: signature.patternType,
          filePath: signature.filePath,
          line: signature.line
        })).digest("hex");
      }
      /**
       * Record a successful detection (true positive)
       */
      recordSuccess(signature, confidence, context) {
        const patternId = this.generatePatternId(signature);
        const pattern = this.getOrCreatePattern(patternId, signature, context);
        pattern.performance.detectionCount++;
        pattern.performance.successCount++;
        pattern.performance.avgConfidence = (pattern.performance.avgConfidence * (pattern.performance.detectionCount - 1) + confidence) / pattern.performance.detectionCount;
        pattern.performance.avgSuccessConfidence = (pattern.performance.avgSuccessConfidence * (pattern.performance.successCount - 1) + confidence) / pattern.performance.successCount;
        this.updatePerformanceMetrics(pattern);
        pattern.lastSeen = (/* @__PURE__ */ new Date()).toISOString();
        pattern.lastUpdated = (/* @__PURE__ */ new Date()).toISOString();
        this.updateGlobalStats();
        this.dirty = true;
        this.saveDatabase();
      }
      /**
       * Record a failed detection (false positive)
       */
      recordFailure(signature, confidence, context) {
        const patternId = this.generatePatternId(signature);
        const pattern = this.getOrCreatePattern(patternId, signature, context);
        pattern.performance.detectionCount++;
        pattern.performance.failureCount++;
        pattern.performance.avgConfidence = (pattern.performance.avgConfidence * (pattern.performance.detectionCount - 1) + confidence) / pattern.performance.detectionCount;
        pattern.performance.avgFailureConfidence = (pattern.performance.avgFailureConfidence * (pattern.performance.failureCount - 1) + confidence) / pattern.performance.failureCount;
        this.updatePerformanceMetrics(pattern);
        pattern.lastSeen = (/* @__PURE__ */ new Date()).toISOString();
        pattern.lastUpdated = (/* @__PURE__ */ new Date()).toISOString();
        if (pattern.performance.falsePositiveRate > this.config.autoSkipThreshold && pattern.performance.detectionCount >= this.config.minDetectionsForStability) {
          pattern.skipInFuture = true;
          pattern.notes = `Auto-skipped: FP rate ${(pattern.performance.falsePositiveRate * 100).toFixed(1)}% exceeds threshold`;
        }
        this.updateGlobalStats();
        this.dirty = true;
        this.saveDatabase();
      }
      /**
       * Record user correction feedback
       */
      learnFromCorrection(signature, isValid, detectedConfidence, reason, userId) {
        const patternId = this.generatePatternId(signature);
        const pattern = this.database.patterns[patternId];
        if (!pattern) {
          console.warn(`[PatternMemory] Cannot add correction: pattern not found`);
          return;
        }
        const correction = {
          timestamp: (/* @__PURE__ */ new Date()).toISOString(),
          isValid,
          reason,
          userId,
          detectedConfidence
        };
        pattern.corrections.push(correction);
        if (isValid) {
          pattern.performance.successCount++;
        } else {
          pattern.performance.failureCount++;
        }
        this.updatePerformanceMetrics(pattern);
        pattern.lastUpdated = (/* @__PURE__ */ new Date()).toISOString();
        this.updateGlobalStats();
        this.dirty = true;
        this.saveDatabase();
      }
      /**
       * Get pattern accuracy (0-1)
       */
      getPatternAccuracy(signature) {
        const patternId = this.generatePatternId(signature);
        const pattern = this.database.patterns[patternId];
        if (!pattern || pattern.performance.detectionCount === 0) {
          const detector = signature.detector;
          const detectorStats = this.database.detectorStats[detector];
          return detectorStats?.successRate ?? 0.75;
        }
        return pattern.performance.successRate;
      }
      /**
       * Adjust confidence based on pattern history
       */
      adjustConfidence(signature, baseConfidence) {
        if (!this.config.enabled) return baseConfidence;
        const patternId = this.generatePatternId(signature);
        const pattern = this.database.patterns[patternId];
        if (!pattern || pattern.performance.detectionCount < this.config.minDetectionsForStability) {
          return baseConfidence;
        }
        if (pattern.skipInFuture) {
          return 0;
        }
        const successRate = pattern.performance.successRate;
        const falsePositiveRate = pattern.performance.falsePositiveRate;
        if (successRate >= 0.9 && pattern.performance.detectionCount >= 20) {
          return Math.min(100, baseConfidence + this.config.confidenceBoost * 100);
        }
        if (falsePositiveRate >= 0.5 && pattern.performance.detectionCount >= 10) {
          return Math.max(0, baseConfidence - this.config.confidencePenalty * 100);
        }
        const adjustment = (successRate - 0.75) * 20;
        return Math.max(0, Math.min(100, baseConfidence + adjustment));
      }
      /**
       * Get or create pattern entry
       */
      getOrCreatePattern(patternId, signature, context) {
        if (this.database.patterns[patternId]) {
          return this.database.patterns[patternId];
        }
        const now = (/* @__PURE__ */ new Date()).toISOString();
        const newPattern = {
          id: patternId,
          signature: {
            ...signature,
            signatureHash: this.generateSignatureHash(signature)
          },
          performance: {
            detectionCount: 0,
            successCount: 0,
            failureCount: 0,
            autoFixSuccessCount: 0,
            autoFixFailureCount: 0,
            successRate: 0,
            falsePositiveRate: 0,
            avgConfidence: 0,
            avgSuccessConfidence: 0,
            avgFailureConfidence: 0
          },
          context,
          corrections: [],
          firstDetected: now,
          lastUpdated: now,
          lastSeen: now,
          active: true,
          skipInFuture: false
        };
        this.database.patterns[patternId] = newPattern;
        this.database.globalStats.totalPatterns++;
        this.database.globalStats.activePatterns++;
        if (!this.database.detectorStats[signature.detector]) {
          this.database.detectorStats[signature.detector] = {
            patternCount: 0,
            successRate: 0,
            falsePositiveRate: 0,
            avgConfidence: 0
          };
        }
        this.database.detectorStats[signature.detector].patternCount++;
        return newPattern;
      }
      /**
       * Update pattern performance metrics
       */
      updatePerformanceMetrics(pattern) {
        const total = pattern.performance.detectionCount;
        if (total === 0) return;
        pattern.performance.successRate = pattern.performance.successCount / total;
        pattern.performance.falsePositiveRate = pattern.performance.failureCount / total;
      }
      /**
       * Update global statistics
       */
      updateGlobalStats() {
        const patterns = Object.values(this.database.patterns);
        const activePatterns = patterns.filter((p) => p.active);
        let totalDetections = 0;
        let totalSuccesses = 0;
        let totalFailures = 0;
        let totalCorrections = 0;
        for (const pattern of patterns) {
          totalDetections += pattern.performance.detectionCount;
          totalSuccesses += pattern.performance.successCount;
          totalFailures += pattern.performance.failureCount;
          totalCorrections += pattern.corrections.length;
        }
        this.database.globalStats = {
          totalPatterns: patterns.length,
          activePatterns: activePatterns.length,
          deprecatedPatterns: patterns.length - activePatterns.length,
          totalDetections,
          totalCorrections,
          overallSuccessRate: totalDetections > 0 ? totalSuccesses / totalDetections : 0,
          overallFalsePositiveRate: totalDetections > 0 ? totalFailures / totalDetections : 0
        };
        const detectorGroups = /* @__PURE__ */ new Map();
        for (const pattern of patterns) {
          const detector = pattern.signature.detector;
          if (!detectorGroups.has(detector)) {
            detectorGroups.set(detector, []);
          }
          detectorGroups.get(detector).push(pattern);
        }
        for (const [detector, detectorPatterns] of detectorGroups) {
          let detectorDetections = 0;
          let detectorSuccesses = 0;
          let detectorFailures = 0;
          let detectorConfidenceSum = 0;
          for (const pattern of detectorPatterns) {
            detectorDetections += pattern.performance.detectionCount;
            detectorSuccesses += pattern.performance.successCount;
            detectorFailures += pattern.performance.failureCount;
            detectorConfidenceSum += pattern.performance.avgConfidence * pattern.performance.detectionCount;
          }
          this.database.detectorStats[detector] = {
            patternCount: detectorPatterns.length,
            successRate: detectorDetections > 0 ? detectorSuccesses / detectorDetections : 0,
            falsePositiveRate: detectorDetections > 0 ? detectorFailures / detectorDetections : 0,
            avgConfidence: detectorDetections > 0 ? detectorConfidenceSum / detectorDetections : 0
          };
        }
      }
      /**
       * Query patterns by criteria
       */
      queryPatterns(query) {
        let results = Object.values(this.database.patterns);
        if (query.detector) {
          results = results.filter((p) => p.signature.detector === query.detector);
        }
        if (query.patternType) {
          results = results.filter((p) => p.signature.patternType === query.patternType);
        }
        if (query.filePath) {
          results = results.filter((p) => p.signature.filePath.includes(query.filePath));
        }
        if (query.framework) {
          results = results.filter((p) => p.context.framework === query.framework);
        }
        if (query.minSuccessRate !== void 0) {
          results = results.filter((p) => p.performance.successRate >= query.minSuccessRate);
        }
        if (query.maxFalsePositiveRate !== void 0) {
          results = results.filter((p) => p.performance.falsePositiveRate <= query.maxFalsePositiveRate);
        }
        if (query.activeOnly) {
          results = results.filter((p) => p.active && !p.skipInFuture);
        }
        if (query.sortBy) {
          results.sort((a, b) => {
            let aVal, bVal;
            switch (query.sortBy) {
              case "successRate":
                aVal = a.performance.successRate;
                bVal = b.performance.successRate;
                break;
              case "detectionCount":
                aVal = a.performance.detectionCount;
                bVal = b.performance.detectionCount;
                break;
              case "confidence":
                aVal = a.performance.avgConfidence;
                bVal = b.performance.avgConfidence;
                break;
              case "lastSeen":
                aVal = new Date(a.lastSeen).getTime();
                bVal = new Date(b.lastSeen).getTime();
                break;
              default:
                return 0;
            }
            return query.sortOrder === "desc" ? bVal - aVal : aVal - bVal;
          });
        }
        if (query.limit) {
          results = results.slice(0, query.limit);
        }
        return results;
      }
      /**
       * Update pattern with new data
       */
      updatePattern(update) {
        const pattern = this.database.patterns[update.patternId];
        if (!pattern) {
          console.warn(`[PatternMemory] Cannot update: pattern not found`);
          return;
        }
        if (update.recordDetection) {
          pattern.performance.detectionCount++;
          pattern.lastSeen = (/* @__PURE__ */ new Date()).toISOString();
        }
        if (update.recordSuccess) {
          pattern.performance.successCount++;
        }
        if (update.recordFailure) {
          pattern.performance.failureCount++;
        }
        if (update.addCorrection) {
          pattern.corrections.push(update.addCorrection);
          this.database.globalStats.totalCorrections++;
        }
        if (update.updateFix) {
          pattern.suggestedFix = update.updateFix;
        }
        if (update.deprecate) {
          pattern.active = false;
          this.database.globalStats.activePatterns--;
          this.database.globalStats.deprecatedPatterns++;
        }
        if (update.skipInFuture !== void 0) {
          pattern.skipInFuture = update.skipInFuture;
        }
        if (update.notes) {
          pattern.notes = update.notes;
        }
        this.updatePerformanceMetrics(pattern);
        pattern.lastUpdated = (/* @__PURE__ */ new Date()).toISOString();
        this.updateGlobalStats();
        this.dirty = true;
        this.saveDatabase();
      }
      /**
       * Get detector-level statistics
       */
      getDetectorStats(detector) {
        return this.database.detectorStats[detector] || null;
      }
      /**
       * Get global statistics
       */
      getGlobalStats() {
        return this.database.globalStats;
      }
      /**
       * Get database snapshot (for inspection/debugging)
       */
      getDatabaseSnapshot() {
        return JSON.parse(JSON.stringify(this.database));
      }
      /**
       * Force save database
       */
      flush() {
        this.dirty = true;
        this.saveDatabase();
      }
      /**
       * Clean up deprecated patterns (run periodically)
       */
      cleanupDeprecatedPatterns() {
        const now = /* @__PURE__ */ new Date();
        const cutoffDate = new Date(now.getTime() - this.config.deprecateAfterDays * 24 * 60 * 60 * 1e3);
        let removedCount = 0;
        for (const [patternId, pattern] of Object.entries(this.database.patterns)) {
          const lastSeen = new Date(pattern.lastSeen);
          if (!pattern.active && lastSeen < cutoffDate) {
            delete this.database.patterns[patternId];
            removedCount++;
          }
        }
        if (removedCount > 0) {
          this.updateGlobalStats();
          this.dirty = true;
          this.saveDatabase();
        }
        return removedCount;
      }
    };
    globalInstance = null;
  }
});

// src/detector/confidence-scoring.ts
function calculateConfidence(factors) {
  const normalizedPattern = clamp(factors.patternMatchStrength, 0, 100);
  const normalizedContext = clamp(factors.contextAppropriate, 0, 100);
  const normalizedStructure = clamp(factors.codeStructure, 0, 100);
  const normalizedHistorical = clamp(factors.historicalAccuracy ?? 75, 0, 100);
  const patternComponent = normalizedPattern * 0.4;
  const contextComponent = normalizedContext * 0.3;
  const structureComponent = normalizedStructure * 0.2;
  const historicalComponent = normalizedHistorical * 0.1;
  const finalScore = Math.round(
    patternComponent + contextComponent + structureComponent + historicalComponent
  );
  const level = getConfidenceLevel(finalScore);
  const explanation = generateExplanation(factors, finalScore);
  return {
    score: finalScore,
    level,
    breakdown: {
      patternMatch: Math.round(patternComponent),
      context: Math.round(contextComponent),
      structure: Math.round(structureComponent),
      historical: Math.round(historicalComponent)
    },
    explanation
  };
}
function getConfidenceLevel(score) {
  if (score >= 90) return "very-high";
  if (score >= 75) return "high";
  if (score >= 50) return "medium";
  if (score >= 30) return "low";
  return "very-low";
}
function generateExplanation(factors, finalScore) {
  const parts = [];
  if (factors.patternMatchStrength >= 90) {
    parts.push("exact pattern match");
  } else if (factors.patternMatchStrength >= 70) {
    parts.push("strong pattern match");
  } else if (factors.patternMatchStrength >= 50) {
    parts.push("moderate pattern match");
  } else {
    parts.push("weak pattern match");
  }
  if (factors.contextAppropriate >= 80) {
    parts.push("highly appropriate context");
  } else if (factors.contextAppropriate >= 60) {
    parts.push("appropriate context");
  } else if (factors.contextAppropriate >= 40) {
    parts.push("somewhat appropriate context");
  } else {
    parts.push("questionable context");
  }
  if (factors.codeStructure >= 70) {
    parts.push("good code structure");
  } else if (factors.codeStructure >= 50) {
    parts.push("acceptable structure");
  } else {
    parts.push("poor code structure");
  }
  if (factors.historicalAccuracy !== void 0) {
    if (factors.historicalAccuracy >= 85) {
      parts.push("excellent historical accuracy");
    } else if (factors.historicalAccuracy >= 70) {
      parts.push("good historical accuracy");
    } else if (factors.historicalAccuracy >= 50) {
      parts.push("moderate historical accuracy");
    } else {
      parts.push("low historical accuracy");
    }
  }
  return `${finalScore}% confidence: ${parts.join(", ")}`;
}
function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}
async function calculateAdaptiveConfidence(baseFactors, signature) {
  let adjustedFactors = { ...baseFactors };
  try {
    const { getPatternMemory: getPatternMemory2 } = await Promise.resolve().then(() => (init_pattern_memory(), pattern_memory_exports));
    const memory = getPatternMemory2();
    const patternAccuracy = memory.getPatternAccuracy(signature);
    if (patternAccuracy > 0) {
      adjustedFactors.historicalAccuracy = patternAccuracy * 100;
    }
    const baseScore = calculateConfidence(adjustedFactors);
    const adjustedScore = memory.adjustConfidence(signature, baseScore.score);
    let learningNote = "";
    if (adjustedScore !== baseScore.score) {
      const adjustmentSign = adjustedScore > baseScore.score ? "+" : "";
      const adjustmentAmount = (adjustedScore - baseScore.score).toFixed(0);
      const accuracyPercent = Math.round(patternAccuracy * 100);
      learningNote = ` (adjusted ${adjustmentSign}${adjustmentAmount}% based on ${accuracyPercent}% historical accuracy)`;
    }
    return {
      score: Math.round(adjustedScore),
      level: baseScore.level,
      // Reuse level from base score
      breakdown: baseScore.breakdown,
      explanation: baseScore.explanation + learningNote
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Unknown error";
    console.debug(`[AdaptiveConfidence] Pattern memory not available: ${errorMsg}, using base confidence`);
    return calculateConfidence(adjustedFactors);
  }
}
var PatternStrength, ContextScore, StructureScore, HistoricalAccuracy;
var init_confidence_scoring = __esm({
  "src/detector/confidence-scoring.ts"() {
    "use strict";
    PatternStrength = {
      /**
       * Exact string match
       */
      exact() {
        return 100;
      },
      /**
       * Regex match with high specificity
       */
      strongRegex() {
        return 90;
      },
      /**
       * Regex match with moderate specificity
       */
      moderateRegex() {
        return 70;
      },
      /**
       * Weak pattern (substring, partial match)
       */
      weak() {
        return 50;
      },
      /**
       * Variable name match (heuristic)
       */
      variableName(name, sensitiveKeywords) {
        const nameLower = name.toLowerCase();
        const exactMatch = sensitiveKeywords.some((kw) => nameLower === kw.toLowerCase());
        const partialMatch = sensitiveKeywords.some((kw) => nameLower.includes(kw.toLowerCase()));
        if (exactMatch) return 100;
        if (partialMatch) return 70;
        return 30;
      }
    };
    ContextScore = {
      /**
       * API route context (high severity for blocking ops)
       */
      apiRoute() {
        return 95;
      },
      /**
       * Server context (high severity)
       */
      server() {
        return 90;
      },
      /**
       * Component/UI context (medium severity)
       */
      component() {
        return 70;
      },
      /**
       * Test file (low severity, often acceptable)
       */
      testFile() {
        return 30;
      },
      /**
       * Build script (very low severity, sync ops expected)
       */
      buildScript() {
        return 20;
      },
      /**
       * CLI script (low severity, sync ops acceptable)
       */
      cliScript() {
        return 25;
      },
      /**
       * Configuration file (very low severity)
       */
      config() {
        return 15;
      }
    };
    StructureScore = {
      /**
       * Has proper error handling
       */
      hasErrorHandling(code) {
        const patterns = [
          /try\s*\{[\s\S]*?\}\s*catch/,
          /\.catch\s*\(/,
          /\.on\s*\(\s*['"]error['"]/
        ];
        const hasAny = patterns.some((p) => p.test(code));
        return hasAny ? 30 : 0;
      },
      /**
       * Has cleanup/finally block
       */
      hasCleanup(code) {
        const patterns = [
          /finally\s*\{/,
          /\.finally\s*\(/,
          /return\s*\(\s*\)\s*=>\s*\{/
          // React cleanup
        ];
        const hasAny = patterns.some((p) => p.test(code));
        return hasAny ? 40 : 0;
      },
      /**
       * Has TypeScript type annotations
       */
      hasTypeAnnotations(code) {
        const hasTypes = /:\s*\w+(\[\]|\<.*?\>)?/.test(code);
        return hasTypes ? 20 : 0;
      },
      /**
       * Has documentation comments
       */
      hasDocumentation(code) {
        const hasJSDoc = /\/\*\*[\s\S]*?\*\//.test(code);
        return hasJSDoc ? 10 : 0;
      },
      /**
       * Calculate total structure score
       */
      calculate(code) {
        return Math.min(
          100,
          this.hasErrorHandling(code) + this.hasCleanup(code) + this.hasTypeAnnotations(code) + this.hasDocumentation(code)
        );
      }
    };
    HistoricalAccuracy = {
      /**
       * Get default accuracy for detector type
       */
      getDefault(detectorType) {
        const defaults = {
          database: 85,
          // Enhanced DB detector is quite accurate
          security: 75,
          // Security can have false positives
          performance: 70,
          // Performance depends heavily on context
          runtime: 65
          // Runtime errors are harder to predict
        };
        return defaults[detectorType] ?? 70;
      }
    };
  }
});

// src/detector/enhanced-db-detector.ts
var enhanced_db_detector_exports = {};
__export(enhanced_db_detector_exports, {
  CLEANUP_PATTERNS: () => CLEANUP_PATTERNS,
  DB_PATTERNS: () => DB_PATTERNS,
  EnhancedDBDetector: () => EnhancedDBDetector
});
var fs, path, import_glob, CLEANUP_PATTERNS, DB_PATTERNS, EnhancedDBDetector;
var init_enhanced_db_detector = __esm({
  "src/detector/enhanced-db-detector.ts"() {
    "use strict";
    fs = __toESM(require("fs"));
    path = __toESM(require("path"));
    import_glob = require("glob");
    init_confidence_scoring();
    CLEANUP_PATTERNS = [
      {
        type: "try-finally",
        pattern: /try\s*\{[\s\S]*?\}\s*finally\s*\{/,
        description: "try-finally block for cleanup",
        confidence: 40
      },
      {
        type: "process-event",
        pattern: /process\.on\s*\(\s*['"](?:beforeExit|SIGTERM|SIGINT|exit)['"]/,
        description: "Process exit handler for cleanup",
        confidence: 30
      },
      {
        type: "lifecycle-method",
        pattern: /(?:async\s+)?(?:stop|destroy|dispose|shutdown|cleanup|teardown)\s*\(/,
        description: "Lifecycle cleanup method",
        confidence: 25
      },
      {
        type: "error-handler",
        pattern: /\.catch\s*\(|\.on\s*\(\s*['"]error['"]/,
        description: "Error handler that may cleanup",
        confidence: 15
      }
    ];
    DB_PATTERNS = [
      {
        type: "prisma",
        displayName: "Prisma",
        patterns: {
          imports: ["@prisma/client", "PrismaClient"],
          connectionMethods: ["new PrismaClient(", "prisma.$connect("],
          cleanupMethods: ["$disconnect(", "prisma.$disconnect()"]
        }
      },
      {
        type: "mongoose",
        displayName: "Mongoose",
        patterns: {
          imports: ["mongoose"],
          connectionMethods: ["mongoose.connect(", "mongoose.createConnection(", "createConnection("],
          cleanupMethods: ["mongoose.disconnect(", "connection.close(", ".disconnect(", ".close()"]
        }
      },
      {
        type: "pg",
        displayName: "PostgreSQL (pg)",
        patterns: {
          imports: ["pg", "Pool", "Client", "from 'pg'", 'from "pg"'],
          connectionMethods: ["new Pool(", "new Client(", "pool.connect(", "client.connect("],
          cleanupMethods: ["connection.release(", "client.release(", "pool.end(", "client.end("]
        }
      },
      {
        type: "mysql",
        displayName: "MySQL",
        patterns: {
          imports: ["mysql", "createConnection", "createPool"],
          connectionMethods: ["mysql.createConnection(", "mysql.createPool(", "createConnection("],
          cleanupMethods: ["connection.end(", "connection.destroy(", "pool.end("]
        }
      },
      {
        type: "mysql2",
        displayName: "MySQL2",
        patterns: {
          imports: ["mysql2", "mysql2/promise"],
          connectionMethods: ["mysql2.createConnection(", "mysql2.createPool(", "createConnection("],
          cleanupMethods: ["connection.end(", "connection.destroy(", "pool.end("]
        }
      },
      {
        type: "mongodb",
        displayName: "MongoDB Native Driver",
        patterns: {
          imports: ["mongodb", "MongoClient"],
          connectionMethods: ["new MongoClient(", "MongoClient.connect(", "client.connect("],
          cleanupMethods: ["client.close(", ".close()"]
        }
      },
      {
        type: "redis",
        displayName: "Redis",
        patterns: {
          imports: ["redis", "createClient", "ioredis"],
          connectionMethods: ["redis.createClient(", "new Redis(", "createClient("],
          cleanupMethods: ["client.quit(", "client.disconnect(", ".quit(", ".disconnect()"]
        }
      },
      {
        type: "mssql",
        displayName: "MS SQL Server",
        patterns: {
          imports: ["mssql"],
          connectionMethods: ["sql.connect(", "new sql.ConnectionPool("],
          cleanupMethods: ["pool.close(", "connection.close(", ".close()"]
        }
      },
      {
        type: "sqlite",
        displayName: "SQLite",
        patterns: {
          imports: ["sqlite3", "better-sqlite3"],
          connectionMethods: ["new sqlite3.Database(", "new Database("],
          cleanupMethods: ["db.close(", ".close()"]
        }
      }
    ];
    EnhancedDBDetector = class {
      workspaceRoot;
      fileImports = /* @__PURE__ */ new Map();
      fileDBLibrary = /* @__PURE__ */ new Map();
      constructor(workspaceRoot) {
        this.workspaceRoot = workspaceRoot;
      }
      /**
       * Main detection method - scans workspace for DB connection leaks
       */
      async detect(targetDir) {
        const dir = targetDir || this.workspaceRoot;
        const issues = [];
        const files = await (0, import_glob.glob)("**/*.{ts,tsx,js,jsx}", {
          cwd: dir,
          ignore: [
            "node_modules/**",
            "dist/**",
            ".next/**",
            "out/**",
            "build/**",
            "**/*.test.*",
            "**/*.spec.*",
            "**/__tests__/**",
            "**/__mocks__/**",
            "**/test/**",
            "**/tests/**"
          ]
        });
        for (const file of files) {
          const filePath = path.join(dir, file);
          await this.analyzeFileImports(filePath);
        }
        for (const file of files) {
          const filePath = path.join(dir, file);
          if (!this.fileDBLibrary.has(filePath)) {
            continue;
          }
          const fileIssues = await this.analyzeConnectionLeaks(filePath);
          issues.push(...fileIssues);
        }
        return issues;
      }
      /**
       * Phase 1: Analyze imports to determine if file uses database libraries
       */
      async analyzeFileImports(filePath) {
        const content = fs.readFileSync(filePath, "utf8");
        const imports = /* @__PURE__ */ new Set();
        const importPatterns = [
          /import\s+.*?\s+from\s+['"](.+?)['"]/g,
          // import x from 'y'
          /import\s+['"](.+?)['"]/g,
          // import 'y'
          /require\s*\(\s*['"](.+?)['"]\s*\)/g,
          // require('y')
          /from\s+['"](.+?)['"]/g
          // from 'y'
        ];
        for (const pattern of importPatterns) {
          let match;
          while ((match = pattern.exec(content)) !== null) {
            imports.add(match[1]);
          }
        }
        this.fileImports.set(filePath, imports);
        for (const dbPattern of DB_PATTERNS) {
          const hasDBImport = dbPattern.patterns.imports.some((importPattern) => {
            return Array.from(imports).some(
              (fileImport) => fileImport.includes(importPattern) || content.includes(importPattern)
            );
          });
          if (hasDBImport) {
            this.fileDBLibrary.set(filePath, dbPattern);
            break;
          }
        }
      }
      /**
       * Phase 2: Analyze connection leaks in files that actually use DB libraries
       */
      async analyzeConnectionLeaks(filePath) {
        const issues = [];
        const dbLibrary = this.fileDBLibrary.get(filePath);
        if (!dbLibrary) {
          return issues;
        }
        const content = fs.readFileSync(filePath, "utf8");
        const lines = content.split("\n");
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          const connectionMethod = dbLibrary.patterns.connectionMethods.find(
            (method) => line.includes(method)
          );
          if (!connectionMethod) {
            continue;
          }
          const contextLines = lines.slice(i, Math.min(i + 50, lines.length));
          const context = contextLines.join("\n");
          const hasCleanup = this.hasCleanupInContext(context, dbLibrary);
          if (!hasCleanup) {
            const hasTryFinally = this.isInTryFinallyBlock(lines, i);
            if (!hasTryFinally) {
              const missingCleanup = dbLibrary.patterns.cleanupMethods;
              const signature = {
                detector: "enhanced-db",
                patternType: "missing-connection-cleanup",
                signatureHash: `${dbLibrary.type}-${connectionMethod}`.slice(0, 16),
                filePath,
                line: i + 1
              };
              const confidenceScore = await calculateAdaptiveConfidence(
                {
                  patternMatchStrength: PatternStrength.exact(),
                  // 100 - exact connection method match
                  contextAppropriate: this.getContextScore(filePath),
                  // Context-based scoring
                  codeStructure: StructureScore.calculate(context),
                  // Check error handling, cleanup, types
                  historicalAccuracy: HistoricalAccuracy.getDefault("database")
                  // 85% default for DB
                },
                signature
              );
              issues.push({
                file: filePath,
                line: i + 1,
                type: "db-connection-leak",
                severity: "critical",
                message: `${dbLibrary.displayName} connection without cleanup (${confidenceScore.level} confidence)`,
                dbLibrary: dbLibrary.displayName,
                rootCause: `${dbLibrary.displayName} connections must be closed/released to prevent connection pool exhaustion and resource leaks. ${confidenceScore.explanation}`,
                suggestedFix: this.generateCleanupFix(dbLibrary, connectionMethod),
                confidence: confidenceScore.score,
                context: {
                  hasDBImport: true,
                  connectionMethod,
                  missingCleanup
                }
              });
            }
          }
        }
        return issues;
      }
      /**
       * Phase 2.2: Determine context score based on file type
       */
      getContextScore(filePath) {
        const fileName = path.basename(filePath).toLowerCase();
        const fileContent = filePath.toLowerCase();
        if (fileContent.includes("/api/") || fileContent.includes("\\api\\") || fileName.includes("route.") || fileName.includes("handler.")) {
          return ContextScore.apiRoute();
        }
        if (fileName.includes("server.") || fileName.includes("index.") || fileContent.includes("/server/") || fileContent.includes("\\server\\")) {
          return ContextScore.server();
        }
        if (fileName.includes(".test.") || fileName.includes(".spec.") || fileContent.includes("/__tests__/") || fileContent.includes("\\__tests__\\")) {
          return ContextScore.testFile();
        }
        if (fileName.includes("build.") || fileName.includes("config.") || fileContent.includes("/scripts/") || fileContent.includes("\\scripts\\")) {
          return ContextScore.buildScript();
        }
        return ContextScore.component();
      }
      /**
       * Phase 2.1: Enhanced cleanup detection with multiple patterns
       * Checks for: try-finally, process events, lifecycle methods, error handlers
       */
      hasCleanupInContext(context, dbLibrary) {
        const hasCleanupMethod = dbLibrary.patterns.cleanupMethods.some(
          (method) => context.includes(method)
        );
        if (hasCleanupMethod) {
          return true;
        }
        let cleanupConfidence = 0;
        for (const pattern of CLEANUP_PATTERNS) {
          if (pattern.pattern.test(context)) {
            cleanupConfidence += pattern.confidence;
          }
        }
        if (cleanupConfidence >= 40) {
          return true;
        }
        const frameworkCleanupPatterns = [
          "return () => {",
          // React useEffect cleanup
          "return function cleanup",
          // Named cleanup function
          "componentWillUnmount",
          // React class cleanup
          "onDestroy(",
          // Angular
          "beforeDestroy(",
          // Vue
          "$destroy("
          // Svelte
        ];
        return frameworkCleanupPatterns.some((pattern) => context.includes(pattern));
      }
      /**
       * Check if line is inside a try-finally block
       */
      isInTryFinallyBlock(lines, lineIndex) {
        let tryIndex = -1;
        let finallyIndex = -1;
        let braceLevel = 0;
        for (let i = lineIndex; i >= Math.max(0, lineIndex - 50); i--) {
          const line = lines[i].trim();
          if (line.includes("finally")) {
            finallyIndex = i;
          }
          if (line.includes("try")) {
            tryIndex = i;
            break;
          }
        }
        if (tryIndex !== -1 && finallyIndex === -1) {
          for (let i = lineIndex; i < Math.min(lines.length, lineIndex + 50); i++) {
            if (lines[i].includes("finally")) {
              finallyIndex = i;
              break;
            }
          }
        }
        return tryIndex !== -1 && finallyIndex !== -1 && tryIndex < lineIndex && finallyIndex > lineIndex;
      }
      /**
       * Generate appropriate cleanup fix for the DB library
       */
      generateCleanupFix(dbLibrary, connectionMethod) {
        const fixes = {
          "Prisma": `
// \u2705 Correct: Always disconnect Prisma client
const prisma = new PrismaClient();

try {
  const users = await prisma.user.findMany();
  return users;
} catch (error) {
  console.error('Database error:', error);
  throw error;
} finally {
  await prisma.$disconnect();
}

// OR: Use singleton pattern for long-lived connections
// lib/prisma.ts
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };
export const prisma = globalForPrisma.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;`,
          "Mongoose": `
// \u2705 Correct: Close Mongoose connection
try {
  await mongoose.connect(MONGODB_URI);
  const users = await User.find();
  return users;
} catch (error) {
  console.error('MongoDB error:', error);
  throw error;
} finally {
  await mongoose.disconnect();
}

// OR: For application-level connection (don't close after every query)
// Use connection pooling and close only on app shutdown
process.on('SIGINT', async () => {
  await mongoose.disconnect();
  process.exit(0);
});`,
          "PostgreSQL (pg)": `
// \u2705 Correct: Release connection back to pool
let connection;
try {
  connection = await pool.connect();
  const result = await connection.query('SELECT * FROM users');
  return result.rows;
} catch (error) {
  console.error('Database error:', error);
  throw error;
} finally {
  if (connection) {
    connection.release(); // Important: Return to pool
  }
}`,
          "MySQL": `
// \u2705 Correct: Close MySQL connection
let connection;
try {
  connection = await mysql.createConnection(config);
  const [rows] = await connection.query('SELECT * FROM users');
  return rows;
} catch (error) {
  console.error('Database error:', error);
  throw error;
} finally {
  if (connection) {
    await connection.end();
  }
}`,
          "MySQL2": `
// \u2705 Correct: Close MySQL2 connection
let connection;
try {
  connection = await mysql2.createConnection(config);
  const [rows] = await connection.execute('SELECT * FROM users');
  return rows;
} catch (error) {
  console.error('Database error:', error);
  throw error;
} finally {
  if (connection) {
    await connection.end();
  }
}`,
          "MongoDB Native Driver": `
// \u2705 Correct: Close MongoDB client
const client = new MongoClient(uri);
try {
  await client.connect();
  const db = client.db('mydb');
  const users = await db.collection('users').find().toArray();
  return users;
} catch (error) {
  console.error('MongoDB error:', error);
  throw error;
} finally {
  await client.close();
}`,
          "Redis": `
// \u2705 Correct: Quit Redis client
const client = redis.createClient();
try {
  await client.connect();
  const value = await client.get('key');
  return value;
} catch (error) {
  console.error('Redis error:', error);
  throw error;
} finally {
  await client.quit();
}`,
          "MS SQL Server": `
// \u2705 Correct: Close SQL Server connection
try {
  const pool = await sql.connect(config);
  const result = await pool.request().query('SELECT * FROM users');
  return result.recordset;
} catch (error) {
  console.error('Database error:', error);
  throw error;
} finally {
  await sql.close();
}`,
          "SQLite": `
// \u2705 Correct: Close SQLite database
const db = new sqlite3.Database('./mydb.sqlite');
try {
  const rows = await new Promise((resolve, reject) => {
    db.all('SELECT * FROM users', (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
  return rows;
} catch (error) {
  console.error('Database error:', error);
  throw error;
} finally {
  db.close();
}`
        };
        return fixes[dbLibrary.displayName] || `
// \u2705 Correct: Always cleanup database connections
try {
  // Your database operation
} finally {
  // Add appropriate cleanup method for ${dbLibrary.displayName}
  // See: ${dbLibrary.patterns.cleanupMethods.join(", ")}
}`;
      }
      /**
       * Export detection summary for reporting
       */
      getSummary() {
        const dbLibraries = /* @__PURE__ */ new Set();
        for (const dbLibrary of this.fileDBLibrary.values()) {
          dbLibraries.add(dbLibrary.displayName);
        }
        return {
          totalFiles: this.fileImports.size,
          filesWithDBImports: this.fileDBLibrary.size,
          dbLibrariesDetected: Array.from(dbLibraries)
        };
      }
    };
  }
});

// src/detector/smart-security-scanner.ts
var smart_security_scanner_exports = {};
__export(smart_security_scanner_exports, {
  SENSITIVE_PATTERNS: () => SENSITIVE_PATTERNS,
  SmartSecurityScanner: () => SmartSecurityScanner
});
var fs2, path2, import_glob2, SENSITIVE_PATTERNS, SmartSecurityScanner;
var init_smart_security_scanner = __esm({
  "src/detector/smart-security-scanner.ts"() {
    "use strict";
    fs2 = __toESM(require("fs"));
    path2 = __toESM(require("path"));
    import_glob2 = require("glob");
    init_confidence_scoring();
    SENSITIVE_PATTERNS = [
      {
        name: "Password",
        category: "credential",
        patterns: [
          /\bpassword\b/i,
          /\bpwd\b(?![\w])/i,
          // pwd but not pwdHash
          /\bpasswd\b/i,
          /\bpass\b(?!ed|ing|word|age|enger)/i,
          // pass but not passed, passing, etc.
          /\buserPassword\b/i,
          /\bcurrentPassword\b/i,
          /\bnewPassword\b/i,
          /\boldPassword\b/i
        ],
        severity: "critical",
        description: "Password exposed in logs",
        examples: ["password", "userPassword", "pwd", "currentPassword"]
      },
      {
        name: "API Key",
        category: "key",
        patterns: [
          /\bapiKey\b/i,
          /\bapi_key\b/i,
          /\bsecretKey\b/i,
          /\bsecret_key\b/i,
          /\baccessKey\b/i,
          /\baccess_key\b/i,
          /\bprivateKey\b/i,
          /\bprivate_key\b/i,
          /\bappKey\b/i,
          /\bapp_key\b/i
        ],
        severity: "critical",
        description: "API key exposed in logs",
        examples: ["apiKey", "secretKey", "accessKey", "privateKey"]
      },
      {
        name: "Authentication Token",
        category: "token",
        patterns: [
          /\btoken\b/i,
          /\baccessToken\b/i,
          /\brefreshToken\b/i,
          /\bidToken\b/i,
          /\bjwt\b(?!Decode|Verify|Parse)/i,
          // jwt but not jwtDecode
          /\bauthToken\b/i,
          /\bauth_token\b/i,
          /\bbearerToken\b/i,
          /\bbearer_token\b/i,
          /\bsessionToken\b/i,
          /\bsession_token\b/i
        ],
        severity: "critical",
        description: "Authentication token exposed in logs",
        examples: ["token", "accessToken", "refreshToken", "jwt", "authToken"]
      },
      {
        name: "Private Key",
        category: "key",
        patterns: [
          /-----BEGIN (RSA )?PRIVATE KEY-----/,
          /\bprivateKey\b/i,
          /\bprivate_key\b/i,
          /\bencryptionKey\b/i,
          /\bsigningKey\b/i
        ],
        severity: "critical",
        description: "Private cryptographic key exposed in logs",
        examples: ["privateKey", "encryptionKey", "-----BEGIN PRIVATE KEY-----"]
      },
      {
        name: "Credit Card",
        category: "financial",
        patterns: [
          /\bcreditCard\b/i,
          /\bcredit_card\b/i,
          /\bcardNumber\b/i,
          /\bcard_number\b/i,
          /\bcvv\b/i,
          /\bcvc\b/i,
          /\bccn\b/i
        ],
        severity: "critical",
        description: "Credit card information exposed in logs",
        examples: ["creditCard", "cardNumber", "cvv", "cvc"]
      },
      {
        name: "Social Security Number",
        category: "pii",
        patterns: [
          /\bssn\b/i,
          /\bsocial_security\b/i,
          /\bsocialSecurityNumber\b/i
        ],
        severity: "critical",
        description: "Social Security Number exposed in logs",
        examples: ["ssn", "socialSecurityNumber"]
      },
      {
        name: "OAuth Secret",
        category: "credential",
        patterns: [
          /\bclientSecret\b/i,
          /\bclient_secret\b/i,
          /\boauthSecret\b/i,
          /\boauth_secret\b/i,
          /\bappSecret\b/i,
          /\bapp_secret\b/i
        ],
        severity: "critical",
        description: "OAuth client secret exposed in logs",
        examples: ["clientSecret", "oauthSecret", "appSecret"]
      },
      {
        name: "Database Credentials",
        category: "credential",
        patterns: [
          /\bdbPassword\b/i,
          /\bdb_password\b/i,
          /\bdatabasePassword\b/i,
          /\bdatabase_password\b/i,
          /\bconnectionString\b/i,
          /\bconnection_string\b/i
        ],
        severity: "high",
        description: "Database credentials exposed in logs",
        examples: ["dbPassword", "connectionString", "databasePassword"]
      },
      {
        name: "Email Address (in sensitive context)",
        category: "pii",
        patterns: [
          /\buserEmail\b/i,
          /\buser_email\b/i,
          /\bpersonalEmail\b/i
        ],
        severity: "medium",
        description: "Email address exposed in logs",
        examples: ["userEmail", "personalEmail"]
      }
    ];
    SmartSecurityScanner = class {
      workspaceRoot;
      allowedLogPatterns = [
        // Safe debug messages
        /^['"]Starting/i,
        /^['"]Stopping/i,
        /^['"]Server running/i,
        /^['"]Connected to/i,
        /^['"]Disconnected/i,
        /^['"]\w+ initialized/i,
        /^['"]\w+ completed/i,
        // Generic status messages
        /^['"]Success/i,
        /^['"]Error:/i,
        /^['"]Warning:/i,
        /^['"]Info:/i
      ];
      constructor(workspaceRoot) {
        this.workspaceRoot = workspaceRoot;
      }
      /**
       * Main detection method
       */
      async detect(targetDir) {
        const dir = targetDir || this.workspaceRoot;
        const issues = [];
        const files = await (0, import_glob2.glob)("**/*.{ts,tsx,js,jsx}", {
          cwd: dir,
          ignore: [
            "node_modules/**",
            "dist/**",
            ".next/**",
            "out/**",
            "build/**",
            "**/*.test.*",
            "**/*.spec.*",
            "**/__tests__/**",
            "**/__mocks__/**",
            "**/test/**",
            "**/tests/**",
            // Ignore config files with security headers
            "**/middleware.ts",
            "**/vercel.json",
            "**/next.config.*"
          ]
        });
        for (const file of files) {
          const filePath = path2.join(dir, file);
          const fileIssues = await this.analyzeFile(filePath);
          issues.push(...fileIssues);
        }
        return issues;
      }
      /**
       * Analyze a single file for sensitive data leaks
       */
      async analyzeFile(filePath) {
        const issues = [];
        const content = fs2.readFileSync(filePath, "utf8");
        const lines = content.split("\n");
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          if (this.isLoggingStatement(line)) {
            const issue = await this.analyzeLoggingStatement(line, filePath, i + 1);
            if (issue) {
              issues.push(issue);
            }
          }
          if (this.isFileWriteStatement(line)) {
            const issue = await this.analyzeFileWriteStatement(line, filePath, i + 1);
            if (issue) {
              issues.push(issue);
            }
          }
        }
        return issues;
      }
      /**
       * Check if line contains logging statement
       */
      isLoggingStatement(line) {
        return /console\.(log|error|warn|info|debug)/.test(line) || /logger\.(log|error|warn|info|debug)/.test(line);
      }
      /**
       * Check if line contains file write statement
       */
      isFileWriteStatement(line) {
        return /fs\.writeFile|writeFileSync|appendFile|appendFileSync/.test(line);
      }
      /**
       * Analyze logging statement for sensitive data
       */
      /**
       * Phase 2.2: Analyze logging statement for sensitive data exposure
       */
      async analyzeLoggingStatement(line, filePath, lineNumber) {
        const variables = this.extractVariables(line);
        if (this.isSafeDebugMessage(line)) {
          return null;
        }
        for (const variable of variables) {
          const sensitiveMatch = this.isSensitiveVariable(variable);
          if (sensitiveMatch) {
            const signature = {
              detector: "smart-security",
              patternType: `sensitive-${sensitiveMatch.category}`,
              signatureHash: `${variable}-${sensitiveMatch.name}`.slice(0, 16),
              filePath,
              line: lineNumber
            };
            const confidenceScore = await calculateAdaptiveConfidence(
              {
                patternMatchStrength: PatternStrength.variableName(
                  variable,
                  sensitiveMatch.examples.map((ex) => ex.toLowerCase())
                ),
                contextAppropriate: this.getContextScore(filePath),
                codeStructure: StructureScore.calculate(line),
                historicalAccuracy: HistoricalAccuracy.getDefault("security")
              },
              signature
            );
            const isDevelopmentSafe = this.isDevelopmentContext(line, filePath);
            const finalConfidence = isDevelopmentSafe ? 25 : confidenceScore.score;
            return {
              file: filePath,
              line: lineNumber,
              type: "sensitive-data-leak",
              severity: sensitiveMatch.severity,
              category: sensitiveMatch.category,
              message: `${sensitiveMatch.description}: ${variable} (${confidenceScore.level} confidence)`,
              sensitiveVariable: variable,
              rootCause: `Logging sensitive data (${sensitiveMatch.name}) can expose it in log files, monitoring systems, or error tracking platforms. ${confidenceScore.explanation}`,
              suggestedFix: this.generateSecurityFix(variable, sensitiveMatch),
              confidence: finalConfidence,
              context: {
                statementType: this.getStatementType(line),
                fullStatement: line.trim()
              }
            };
          }
        }
        return null;
      }
      /**
       * Analyze file write statement for sensitive data
       */
      async analyzeFileWriteStatement(line, filePath, lineNumber) {
        const variables = this.extractVariables(line);
        for (const variable of variables) {
          const sensitiveMatch = this.isSensitiveVariable(variable);
          if (sensitiveMatch) {
            const signature = {
              detector: "smart-security",
              patternType: `file-write-${sensitiveMatch.category}`,
              signatureHash: `${variable}-file`.slice(0, 16),
              filePath,
              line: lineNumber
            };
            const confidenceScore = await calculateAdaptiveConfidence(
              {
                patternMatchStrength: 90,
                contextAppropriate: this.getContextScore(filePath),
                codeStructure: StructureScore.calculate(line),
                historicalAccuracy: HistoricalAccuracy.getDefault("security")
              },
              signature
            );
            return {
              file: filePath,
              line: lineNumber,
              type: "sensitive-data-leak",
              severity: "critical",
              category: sensitiveMatch.category,
              message: `Writing sensitive data to file: ${variable} (${confidenceScore.level} confidence)`,
              sensitiveVariable: variable,
              rootCause: `Writing sensitive data to files without encryption can expose it to unauthorized access. ${confidenceScore.explanation}`,
              suggestedFix: `Encrypt sensitive data before writing to file or use secure storage`,
              confidence: confidenceScore.score,
              context: {
                statementType: "file-write",
                fullStatement: line.trim()
              }
            };
          }
        }
        return null;
      }
      /**
       * Extract variables from logging/write statement
       */
      extractVariables(statement) {
        const variables = [];
        const templateRegex = /\$\{([^}]+)\}/g;
        let match;
        while ((match = templateRegex.exec(statement)) !== null) {
          const expr = match[1].trim();
          const varMatch = expr.match(/^([\w.]+)/);
          if (varMatch) {
            variables.push(varMatch[1]);
          }
        }
        const directRegex = /console\.\w+\(([\w.]+)/;
        const directMatch = statement.match(directRegex);
        if (directMatch && !statement.includes("`") && !statement.includes("'")) {
          variables.push(directMatch[1]);
        }
        const objectRegex = /\{\s*(\w+)\s*:/g;
        while ((match = objectRegex.exec(statement)) !== null) {
          variables.push(match[1]);
        }
        const commaMatch = statement.match(/console\.\w+\((.*)\)/);
        if (commaMatch && !statement.includes("`")) {
          const args = commaMatch[1].split(",");
          for (const arg of args) {
            const trimmed = arg.trim();
            const varMatch = trimmed.match(/^([\w.]+)/);
            if (varMatch && !trimmed.includes("'") && !trimmed.includes('"')) {
              variables.push(varMatch[1]);
            }
          }
        }
        return [...new Set(variables)];
      }
      /**
       * Check if message is a safe debug message
       */
      isSafeDebugMessage(statement) {
        const stringMatch = statement.match(/['"`]([^'"`]+)['"`]/);
        if (stringMatch) {
          const message = stringMatch[1];
          return this.allowedLogPatterns.some((pattern) => pattern.test(message));
        }
        return false;
      }
      /**
       * Check if variable name indicates sensitive data
       */
      isSensitiveVariable(variable) {
        for (const pattern of SENSITIVE_PATTERNS) {
          for (const regex of pattern.patterns) {
            if (regex.test(variable)) {
              return pattern;
            }
          }
        }
        return null;
      }
      /**
       * Check if logging is in development-safe context (Phase 2.3 framework rule)
       */
      isDevelopmentContext(statement, filePath) {
        const content = fs2.readFileSync(filePath, "utf8");
        const lines = content.split("\n");
        const statementIndex = lines.findIndex((line) => line.includes(statement.trim()));
        if (statementIndex === -1) return false;
        const contextStart = Math.max(0, statementIndex - 5);
        const contextEnd = Math.min(lines.length, statementIndex + 5);
        const context = lines.slice(contextStart, contextEnd).join("\n");
        const developmentPatterns = [
          /if\s*\(\s*process\.env\.NODE_ENV\s*===\s*['"]development['"]/,
          /if\s*\(\s*DEBUG\s*\)/,
          /if\s*\(\s*__DEV__\s*\)/,
          // React Native
          /if\s*\(\s*isDevelopment\s*\)/,
          /\/\*\s*DEV\s*ONLY\s*\*\//,
          /import.*?['"]debug['"]/
          // debug module
        ];
        return developmentPatterns.some((pattern) => pattern.test(context));
      }
      /**
       * Get context score based on file type (Phase 2.2)
       */
      getContextScore(filePath) {
        if (/\/api\/|\\api\\|route\.|handler\./.test(filePath)) {
          return ContextScore.apiRoute();
        }
        if (/server\.|index\.|\/server\//.test(filePath)) {
          return ContextScore.server();
        }
        if (/\.test\.|\.spec\.|__tests__|\/tests?\//.test(filePath)) {
          return ContextScore.testFile();
        }
        if (/config\.|\.config\./.test(filePath)) {
          return ContextScore.config();
        }
        return ContextScore.component();
      }
      /**
       * Get statement type from line
       */
      getStatementType(line) {
        if (line.includes("console.log")) return "console.log";
        if (line.includes("console.error")) return "console.error";
        if (line.includes("console.warn")) return "console.warn";
        if (line.includes("logger.")) return "logger";
        return "console.log";
      }
      /**
       * Generate fix suggestion
       */
      generateSecurityFix(variable, pattern) {
        const examples = {
          "Password": `
// \u274C BAD: Exposes password
console.log(\`User password: \${${variable}}\`);

// \u2705 GOOD: Remove completely
// (Remove this log statement)

// \u2705 GOOD: Log only non-sensitive info
console.log('User authenticated successfully');

// \u2705 GOOD: Use proper logger with redaction
logger.info({ userId: user.id, action: 'login' }); // No password`,
          "API Key": `
// \u274C BAD: Exposes API key
console.log(\`API Key: \${${variable}}\`);

// \u2705 GOOD: Remove or mask
console.log('API configured successfully');

// \u2705 GOOD: Show only last 4 characters
console.log(\`API Key: ....\${${variable}.slice(-4)}\`);`,
          "Authentication Token": `
// \u274C BAD: Exposes token
console.log(\`Token: \${${variable}}\`);

// \u2705 GOOD: Remove completely
// (Remove this log statement)

// \u2705 GOOD: Log only token metadata
console.log(\`Token type: Bearer, expires: \${expiresAt}\`);`,
          "Credit Card": `
// \u274C BAD: Exposes credit card
console.log(\`Card: \${${variable}}\`);

// \u2705 GOOD: Mask all but last 4 digits
const masked = \`****-****-****-\${${variable}.slice(-4)}\`;
console.log(\`Card: \${masked}\`);`,
          "Private Key": `
// \u274C BAD: Exposes private key
console.log(\`Private key: \${${variable}}\`);

// \u2705 GOOD: Never log private keys
// (Remove this log statement completely)

// \u2705 GOOD: Log only key metadata
console.log('Private key loaded successfully');`
        };
        return examples[pattern.name] || `
// \u274C BAD: Logs sensitive data
console.log(\`${pattern.name}: \${${variable}}\`);

// \u2705 GOOD: Remove or sanitize
// Option 1: Remove completely
// (Remove this log statement)

// Option 2: Log only in development
if (process.env.NODE_ENV === 'development') {
  console.log('${pattern.name} configured');
}

// Option 3: Use proper logger with redaction
logger.info({ action: 'operation', status: 'success' }); // No ${pattern.name}`;
      }
      /**
       * Get detection statistics
       */
      getStatistics(issues) {
        const byCategory = {};
        const bySeverity = {};
        let totalConfidence = 0;
        for (const issue of issues) {
          byCategory[issue.category] = (byCategory[issue.category] || 0) + 1;
          bySeverity[issue.severity] = (bySeverity[issue.severity] || 0) + 1;
          totalConfidence += issue.confidence;
        }
        return {
          totalIssues: issues.length,
          byCategory,
          bySeverity,
          averageConfidence: issues.length > 0 ? totalConfidence / issues.length : 0
        };
      }
    };
  }
});

// src/detector/context-aware-performance.ts
var context_aware_performance_exports = {};
__export(context_aware_performance_exports, {
  ContextAwarePerformanceDetector: () => ContextAwarePerformanceDetector,
  FileContext: () => FileContext
});
var fs3, path3, import_glob3, FileContext, BLOCKING_OPERATIONS, ContextAwarePerformanceDetector;
var init_context_aware_performance = __esm({
  "src/detector/context-aware-performance.ts"() {
    "use strict";
    fs3 = __toESM(require("fs"));
    path3 = __toESM(require("path"));
    import_glob3 = require("glob");
    init_confidence_scoring();
    FileContext = /* @__PURE__ */ ((FileContext2) => {
      FileContext2["BUILD_SCRIPT"] = "build-script";
      FileContext2["DEPLOYMENT"] = "deployment";
      FileContext2["CLI_COMMAND"] = "cli-command";
      FileContext2["MIGRATION"] = "migration";
      FileContext2["TEST"] = "test";
      FileContext2["SERVER"] = "server";
      FileContext2["API_ROUTE"] = "api-route";
      FileContext2["MIDDLEWARE"] = "middleware";
      FileContext2["REALTIME"] = "realtime";
      FileContext2["WORKER"] = "worker";
      FileContext2["GENERAL"] = "general";
      return FileContext2;
    })(FileContext || {});
    BLOCKING_OPERATIONS = {
      fs: [
        "readFileSync",
        "writeFileSync",
        "appendFileSync",
        "readdirSync",
        "statSync",
        "lstatSync",
        "existsSync",
        "mkdirSync",
        "rmdirSync",
        "unlinkSync",
        "copyFileSync",
        "renameSync"
      ],
      crypto: [
        "pbkdf2Sync",
        "scryptSync",
        "randomFillSync",
        "randomBytesSync"
      ],
      exec: [
        "execSync",
        "execFileSync",
        "spawnSync"
      ],
      compression: [
        "gzipSync",
        "gunzipSync",
        "deflateSync",
        "inflateSync",
        "brotliCompressSync",
        "brotliDecompressSync"
      ],
      parsing: [
        "JSON.parse"
        // Only when processing large files
      ]
    };
    ContextAwarePerformanceDetector = class {
      workspaceRoot;
      constructor(workspaceRoot) {
        this.workspaceRoot = workspaceRoot;
      }
      /**
       * Main detection method
       */
      async detect(targetDir) {
        const dir = targetDir || this.workspaceRoot;
        const issues = [];
        const files = await (0, import_glob3.glob)("**/*.{ts,tsx,js,jsx}", {
          cwd: dir,
          ignore: [
            "node_modules/**",
            "dist/**",
            ".next/**",
            "out/**",
            "build/**",
            "**/*.test.*",
            "**/*.spec.*",
            "**/__tests__/**",
            "**/__mocks__/**"
          ]
        });
        for (const file of files) {
          const filePath = path3.join(dir, file);
          const fileIssues = await this.analyzeFile(filePath);
          issues.push(...fileIssues);
        }
        return issues;
      }
      /**
       * Analyze a single file for blocking operations
       */
      async analyzeFile(filePath) {
        const issues = [];
        const content = fs3.readFileSync(filePath, "utf8");
        const lines = content.split("\n");
        const fileContext = this.detectFileContext(filePath, content);
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          for (const [opType, operations] of Object.entries(BLOCKING_OPERATIONS)) {
            for (const operation of operations) {
              if (line.includes(operation)) {
                const issue = await this.analyzeBlockingOperation(
                  operation,
                  opType,
                  fileContext,
                  filePath,
                  i + 1,
                  line,
                  content
                  // Pass full source code for context analysis
                );
                if (issue) {
                  issues.push(issue);
                }
              }
            }
          }
        }
        return issues;
      }
      /**
       * Detect file context based on path and content
       */
      detectFileContext(filePath, sourceCode) {
        const normalizedPath = filePath.toLowerCase().replace(/\\/g, "/");
        if (normalizedPath.includes("/scripts/") || normalizedPath.includes("/tools/") || normalizedPath.includes(".script.")) {
          return "build-script" /* BUILD_SCRIPT */;
        }
        if (normalizedPath.includes("/migrations/") || normalizedPath.includes("/migrate/") || normalizedPath.includes(".migration.")) {
          return "deployment" /* DEPLOYMENT */;
        }
        if (normalizedPath.includes("/test/") || normalizedPath.includes("/tests/") || normalizedPath.includes("/__tests__/") || normalizedPath.match(/\.(test|spec)\./)) {
          return "test" /* TEST */;
        }
        if (normalizedPath.includes("/workers/") || normalizedPath.includes("/background/") || normalizedPath.includes(".worker.")) {
          return "worker" /* WORKER */;
        }
        if (sourceCode.includes("#!/usr/bin/env node") || sourceCode.match(/process\.argv/) || sourceCode.includes("commander") && sourceCode.includes(".command(") || sourceCode.includes("yargs") && sourceCode.includes(".argv")) {
          return "cli-command" /* CLI_COMMAND */;
        }
        if (sourceCode.match(/express\(\)/) || sourceCode.match(/fastify\(\)/) || sourceCode.match(/createServer\s*\(/) || sourceCode.includes("http.createServer") || sourceCode.includes("https.createServer") || sourceCode.includes("new Hono(")) {
          return "server" /* SERVER */;
        }
        if (sourceCode.match(/export\s+(async\s+)?function\s+(GET|POST|PUT|DELETE|PATCH)/)) {
          return "api-route" /* API_ROUTE */;
        }
        if (sourceCode.match(/\(req.*res.*next\)/) || sourceCode.includes("NextRequest") || sourceCode.includes("NextResponse") || normalizedPath.includes("middleware")) {
          return "middleware" /* MIDDLEWARE */;
        }
        if (sourceCode.includes("WebSocket") || sourceCode.includes("Socket.IO") || sourceCode.includes("ws.Server") || sourceCode.includes("setInterval") && sourceCode.includes("EventEmitter") || sourceCode.includes("ServerSentEvents")) {
          return "realtime" /* REALTIME */;
        }
        return "general" /* GENERAL */;
      }
      /**
       * Analyze a blocking operation in context
       */
      async analyzeBlockingOperation(operation, operationType, fileContext, filePath, lineNumber, line, sourceCode) {
        const rule = this.getContextRule(fileContext, operationType);
        if (rule.allowed) {
          return null;
        }
        const signature = {
          detector: "context-aware-performance",
          patternType: `blocking-${operationType}`,
          signatureHash: `${operation}-${fileContext}`.slice(0, 16),
          filePath,
          line: lineNumber
        };
        const confidenceScore = await calculateAdaptiveConfidence(
          {
            patternMatchStrength: PatternStrength.exact(),
            // 100 - exact sync operation match
            contextAppropriate: this.getContextScoreForFile(fileContext, sourceCode),
            codeStructure: StructureScore.calculate(sourceCode),
            historicalAccuracy: HistoricalAccuracy.getDefault("performance")
          },
          signature
        );
        const isNextSSR = sourceCode.includes("getServerSideProps") || sourceCode.includes("getStaticProps");
        const severity = isNextSSR ? "critical" : rule.severity || "high";
        return {
          file: filePath,
          line: lineNumber,
          type: "blocking-operation",
          severity,
          message: `Sync ${operationType} operation (${operation}): ${rule.reason} (${confidenceScore.level} confidence)`,
          operationType,
          operation,
          context: fileContext,
          rootCause: `${this.getRootCause(fileContext, operationType)} ${confidenceScore.explanation}`,
          suggestedFix: this.generateAsyncFix(operationType, operation, line),
          confidence: confidenceScore.score,
          additionalInfo: {
            allowedInContext: rule.allowed,
            performanceImpact: isNextSSR ? "high" : rule.performanceImpact
          }
        };
      }
      /**
       * Get context score for file (Phase 2.2 helper)
       */
      getContextScoreForFile(context, sourceCode) {
        const isNextSSR = sourceCode.includes("getServerSideProps") || sourceCode.includes("getStaticProps");
        if (isNextSSR) {
          return ContextScore.apiRoute();
        }
        const contextScoreMap = {
          ["api-route" /* API_ROUTE */]: ContextScore.apiRoute(),
          // 95 - critical
          ["server" /* SERVER */]: ContextScore.server(),
          // 90 - high priority
          ["middleware" /* MIDDLEWARE */]: ContextScore.component(),
          // 70 - medium-high
          ["realtime" /* REALTIME */]: ContextScore.apiRoute(),
          // 95 - critical
          ["worker" /* WORKER */]: 50,
          // medium
          ["general" /* GENERAL */]: ContextScore.component(),
          // 70 - default
          ["build-script" /* BUILD_SCRIPT */]: ContextScore.buildScript(),
          // 20 - allowed
          ["deployment" /* DEPLOYMENT */]: ContextScore.buildScript(),
          // 20 - allowed
          ["cli-command" /* CLI_COMMAND */]: ContextScore.cliScript(),
          // 25 - allowed
          ["migration" /* MIGRATION */]: ContextScore.buildScript(),
          // 20 - allowed
          ["test" /* TEST */]: ContextScore.testFile()
          // 30 - allowed
        };
        return contextScoreMap[context];
      }
      /**
       * Get rules for operation in specific context
       */
      getContextRule(context, operationType) {
        const rules = {
          ["build-script" /* BUILD_SCRIPT */]: {
            allowed: true,
            reason: "Sync operations are acceptable in build scripts (one-time execution)",
            performanceImpact: "low"
          },
          ["deployment" /* DEPLOYMENT */]: {
            allowed: true,
            reason: "Sync operations are acceptable in deployment scripts (one-time execution)",
            performanceImpact: "low"
          },
          ["cli-command" /* CLI_COMMAND */]: {
            allowed: true,
            reason: "Sync operations are acceptable in CLI commands (single-user, one-time)",
            performanceImpact: "low"
          },
          ["migration" /* MIGRATION */]: {
            allowed: true,
            reason: "Sync operations are acceptable in database migrations (one-time execution)",
            performanceImpact: "low"
          },
          ["test" /* TEST */]: {
            allowed: true,
            reason: "Sync operations are acceptable in tests (isolated execution)",
            performanceImpact: "low"
          },
          ["server" /* SERVER */]: {
            allowed: false,
            severity: "critical",
            reason: "Sync operations block the event loop, affecting all concurrent requests",
            performanceImpact: "high"
          },
          ["api-route" /* API_ROUTE */]: {
            allowed: false,
            severity: "critical",
            reason: "Sync operations cause request delays and poor API response times",
            performanceImpact: "high"
          },
          ["middleware" /* MIDDLEWARE */]: {
            allowed: false,
            severity: "high",
            reason: "Sync operations in middleware affect every request passing through",
            performanceImpact: "high"
          },
          ["realtime" /* REALTIME */]: {
            allowed: false,
            severity: "critical",
            reason: "Sync operations break real-time responsiveness and cause lag",
            performanceImpact: "high"
          },
          ["worker" /* WORKER */]: {
            allowed: false,
            severity: "medium",
            reason: "Sync operations may block worker thread, consider async for better throughput",
            performanceImpact: "medium"
          },
          ["general" /* GENERAL */]: {
            allowed: false,
            severity: "medium",
            reason: "Consider async for better performance and non-blocking execution",
            performanceImpact: "medium"
          }
        };
        return rules[context];
      }
      /**
       * Get root cause explanation
       */
      getRootCause(context, operationType) {
        const causes = {
          ["server" /* SERVER */]: `In server context, synchronous ${operationType} operations block the Node.js event loop, preventing the server from processing other requests. This causes poor performance under load.`,
          ["api-route" /* API_ROUTE */]: `In API routes, synchronous ${operationType} operations block request handling, causing high latency and poor user experience. Each request must wait for the sync operation to complete.`,
          ["middleware" /* MIDDLEWARE */]: `In middleware, synchronous ${operationType} operations affect every request that passes through, multiplying the performance impact across all routes.`,
          ["realtime" /* REALTIME */]: `In real-time systems, synchronous ${operationType} operations cause lag and missed events, breaking the real-time guarantee that users expect.`,
          ["worker" /* WORKER */]: `In workers, synchronous ${operationType} operations reduce throughput by preventing the worker from processing other tasks concurrently.`,
          ["general" /* GENERAL */]: `Synchronous ${operationType} operations block the event loop, preventing other operations from executing. Async alternatives provide better performance.`,
          ["build-script" /* BUILD_SCRIPT */]: "",
          // Not used (allowed)
          ["deployment" /* DEPLOYMENT */]: "",
          // Not used (allowed)
          ["cli-command" /* CLI_COMMAND */]: "",
          // Not used (allowed)
          ["migration" /* MIGRATION */]: "",
          // Not used (allowed)
          ["test" /* TEST */]: ""
          // Not used (allowed)
        };
        return causes[context];
      }
      /**
       * Generate async fix suggestion
       */
      generateAsyncFix(operationType, operation, line) {
        const fixes = {
          fs: `
// \u274C BAD: Blocking file system operation
const data = readFileSync('file.txt', 'utf8');

// \u2705 GOOD: Non-blocking async alternative
const data = await readFile('file.txt', 'utf8');
// Import: import { readFile } from 'node:fs/promises';

// OR: Callback style
import { readFile } from 'node:fs';
readFile('file.txt', 'utf8', (err, data) => {
  if (err) throw err;
  console.log(data);
});`,
          crypto: `
// \u274C BAD: Blocking cryptographic operation
const hash = pbkdf2Sync(password, salt, 100000, 64, 'sha512');

// \u2705 GOOD: Non-blocking async alternative
const hash = await new Promise((resolve, reject) => {
  pbkdf2(password, salt, 100000, 64, 'sha512', (err, derivedKey) => {
    if (err) reject(err);
    else resolve(derivedKey);
  });
});

// OR: Use crypto/promises (Node 15+)
import { pbkdf2 } from 'node:crypto/promises';
const hash = await pbkdf2(password, salt, 100000, 64, 'sha512');`,
          exec: `
// \u274C BAD: Blocking process execution
const output = execSync('git status').toString();

// \u2705 GOOD: Non-blocking async alternative
import { exec } from 'node:child_process';
import { promisify } from 'node:util';
const execAsync = promisify(exec);

const { stdout, stderr } = await execAsync('git status');
const output = stdout;

// OR: Use execa library (recommended)
import { execa } from 'execa';
const { stdout } = await execa('git', ['status']);`,
          compression: `
// \u274C BAD: Blocking compression
const compressed = gzipSync(buffer);

// \u2705 GOOD: Non-blocking async alternative
import { gzip } from 'node:zlib';
import { promisify } from 'node:util';
const gzipAsync = promisify(gzip);

const compressed = await gzipAsync(buffer);

// OR: Use streams for large data
import { createGzip } from 'node:zlib';
import { pipeline } from 'node:stream/promises';

await pipeline(
  sourceStream,
  createGzip(),
  destinationStream
);`,
          parsing: `
// \u274C BAD: Sync parsing of large data (if in request handler)
const data = JSON.parse(largeString);

// \u2705 GOOD: For large JSON, use streaming parser
import { parser } from 'stream-json';
import { streamArray } from 'stream-json/streamers/StreamArray';

const stream = fs.createReadStream('large-file.json')
  .pipe(parser())
  .pipe(streamArray());

for await (const { value } of stream) {
  // Process each item
}

// OR: Move to worker thread for CPU-intensive parsing
import { Worker } from 'node:worker_threads';

const worker = new Worker('./parser-worker.js');
worker.postMessage(largeString);
const data = await new Promise(resolve => {
  worker.on('message', resolve);
});`
        };
        return fixes[operationType] || `Use async alternative for ${operation}`;
      }
      /**
       * Get detection statistics
       */
      getStatistics(issues) {
        const byContext = {};
        const byOperationType = {};
        const bySeverity = {};
        let totalConfidence = 0;
        for (const issue of issues) {
          byContext[issue.context] = (byContext[issue.context] || 0) + 1;
          byOperationType[issue.operationType] = (byOperationType[issue.operationType] || 0) + 1;
          bySeverity[issue.severity] = (bySeverity[issue.severity] || 0) + 1;
          totalConfidence += issue.confidence;
        }
        return {
          totalIssues: issues.length,
          byContext,
          byOperationType,
          bySeverity,
          averageConfidence: issues.length > 0 ? totalConfidence / issues.length : 0
        };
      }
    };
  }
});

// src/analyzer/bundle-analyzer.js
var require_bundle_analyzer = __commonJS({
  "src/analyzer/bundle-analyzer.js"(exports2) {
    "use strict";
    var __createBinding = exports2 && exports2.__createBinding || (Object.create ? (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    }) : (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    }));
    var __setModuleDefault = exports2 && exports2.__setModuleDefault || (Object.create ? (function(o, v) {
      Object.defineProperty(o, "default", { enumerable: true, value: v });
    }) : function(o, v) {
      o["default"] = v;
    });
    var __importStar = exports2 && exports2.__importStar || /* @__PURE__ */ (function() {
      var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function(o2) {
          var ar = [];
          for (var k in o2) if (Object.prototype.hasOwnProperty.call(o2, k)) ar[ar.length] = k;
          return ar;
        };
        return ownKeys(o);
      };
      return function(mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) {
          for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        }
        __setModuleDefault(result, mod);
        return result;
      };
    })();
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.BundleAnalyzer = void 0;
    var fs4 = __importStar(require("fs"));
    var path4 = __importStar(require("path"));
    var BundleAnalyzer2 = class {
      workspaceRoot;
      constructor(workspaceRoot) {
        this.workspaceRoot = workspaceRoot;
      }
      /**
       * Analyze bundle configuration and output
       */
      async analyzeBundleSize() {
        const config = this.detectBundlerConfig();
        const modules = await this.detectLargeModules();
        const treeShakingScore = this.calculateTreeShakingScore(config);
        const totalSize = modules.reduce((sum, m) => sum + m.size, 0);
        const largeModules = modules.filter((m) => m.size > 100 * 1024);
        const recommendations = [];
        if (!config.hasTreeShaking) {
          recommendations.push("Enable tree-shaking in bundler config");
        }
        if (!config.hasCodeSplitting) {
          recommendations.push("Enable code-splitting for better performance");
        }
        if (largeModules.length > 0) {
          recommendations.push(`Optimize ${largeModules.length} large modules (>100KB each)`);
        }
        return {
          totalSize,
          modules,
          largeModules,
          treeShakingScore,
          recommendations
        };
      }
      /**
       * Detect bundler configuration
       */
      detectBundlerConfig() {
        const webpackPath = path4.join(this.workspaceRoot, "webpack.config.js");
        const vitePath = path4.join(this.workspaceRoot, "vite.config.ts");
        const rollupPath = path4.join(this.workspaceRoot, "rollup.config.js");
        if (fs4.existsSync(webpackPath)) {
          const content = fs4.readFileSync(webpackPath, "utf-8");
          return {
            type: "webpack",
            configPath: webpackPath,
            hasTreeShaking: /mode:\s*['"]production['"]/.test(content),
            hasCodeSplitting: /splitChunks/.test(content)
          };
        }
        if (fs4.existsSync(vitePath)) {
          const content = fs4.readFileSync(vitePath, "utf-8");
          return {
            type: "vite",
            configPath: vitePath,
            hasTreeShaking: true,
            // Vite has tree-shaking by default
            hasCodeSplitting: /rollupOptions/.test(content)
          };
        }
        if (fs4.existsSync(rollupPath)) {
          const content = fs4.readFileSync(rollupPath, "utf-8");
          return {
            type: "rollup",
            configPath: rollupPath,
            hasTreeShaking: /treeshake/.test(content),
            hasCodeSplitting: /output:.*\[/.test(content)
          };
        }
        return {
          type: "unknown",
          hasTreeShaking: false,
          hasCodeSplitting: false
        };
      }
      /**
       * Detect large modules from node_modules
       */
      async detectLargeModules() {
        const modules = [];
        const nodeModulesPath = path4.join(this.workspaceRoot, "node_modules");
        if (!fs4.existsSync(nodeModulesPath)) {
          return modules;
        }
        const packageJsonPath = path4.join(this.workspaceRoot, "package.json");
        if (!fs4.existsSync(packageJsonPath)) {
          return modules;
        }
        const packageJson = JSON.parse(fs4.readFileSync(packageJsonPath, "utf-8"));
        const dependencies = {
          ...packageJson.dependencies,
          ...packageJson.devDependencies
        };
        for (const [name, _version] of Object.entries(dependencies)) {
          const modulePath = path4.join(nodeModulesPath, name);
          if (fs4.existsSync(modulePath)) {
            const size = this.getDirectorySize(modulePath);
            modules.push({
              name,
              size,
              path: modulePath,
              imported: true,
              treeShakenCorrectly: false
            });
          }
        }
        return modules.sort((a, b) => b.size - a.size);
      }
      /**
       * Check import patterns for tree-shaking optimization
       */
      checkImportPatterns(filePath) {
        const issues = [];
        const content = fs4.readFileSync(filePath, "utf-8");
        if (/import\s+_\s+from\s+['"]lodash['"]/.test(content)) {
          issues.push("Full lodash import detected - use lodash/[method]");
        }
        if (/import\s+\*\s+as\s+\w+\s+from\s+['"](?:lodash|moment|rxjs)['"]/.test(content)) {
          issues.push("Wildcard import prevents tree-shaking");
        }
        if (/import\s+.*\s+from\s+['"]@material-ui\/core['"]/.test(content)) {
          issues.push("Material-UI barrel import - use specific component paths");
        }
        return issues;
      }
      /**
       * Calculate tree-shaking effectiveness score (0-100)
       */
      calculateTreeShakingScore(config) {
        let score = 0;
        if (config.hasTreeShaking)
          score += 50;
        if (config.hasCodeSplitting)
          score += 25;
        if (config.type !== "unknown")
          score += 15;
        if (config.type === "vite")
          score += 10;
        return Math.min(100, score);
      }
      /**
       * Get total size of directory recursively
       */
      getDirectorySize(dirPath) {
        let totalSize = 0;
        const traverse = (currentPath) => {
          try {
            const stats = fs4.statSync(currentPath);
            if (stats.isFile()) {
              totalSize += stats.size;
            } else if (stats.isDirectory()) {
              const files = fs4.readdirSync(currentPath);
              for (const file of files) {
                traverse(path4.join(currentPath, file));
              }
            }
          } catch (_error) {
          }
        };
        traverse(dirPath);
        return totalSize;
      }
    };
    exports2.BundleAnalyzer = BundleAnalyzer2;
  }
});

// src/detector/index.ts
var index_exports = {};
__export(index_exports, {
  BuildDetector: () => import_build_detector.BuildDetector,
  BundleAnalyzer: () => import_bundle_analyzer.BundleAnalyzer,
  CircularDependencyDetector: () => import_circular_detector.CircularDependencyDetector,
  ComplexityDetector: () => import_complexity_detector.ComplexityDetector,
  ComplexityErrorType: () => import_complexity_detector.ComplexityErrorType,
  ComponentIsolationDetector: () => import_isolation_detector.ComponentIsolationDetector,
  ContextAwarePerformanceDetector: () => ContextAwarePerformanceDetector,
  ContextScore: () => ContextScore,
  ESLintDetector: () => import_eslint_detector.ESLintDetector,
  EXPRESS_RULES: () => EXPRESS_RULES,
  EnhancedDBDetector: () => EnhancedDBDetector,
  FileContext: () => FileContext,
  HistoricalAccuracy: () => HistoricalAccuracy,
  ImportDetector: () => import_import_detector.ImportDetector,
  NEXTJS_RULES: () => NEXTJS_RULES,
  NODEJS_RULES: () => NODEJS_RULES,
  NetworkDetector: () => import_network_detector.NetworkDetector,
  PackageDetector: () => import_package_detector.PackageDetector,
  PatternStrength: () => PatternStrength,
  PerformanceDetector: () => import_performance_detector.PerformanceDetector,
  PerformanceErrorType: () => import_performance_detector.PerformanceErrorType,
  Phase1DetectorSuite: () => Phase1DetectorSuite,
  REACT_RULES: () => REACT_RULES,
  RuntimeDetector: () => import_runtime_detector.RuntimeDetector,
  SecurityDetector: () => import_security_detector.SecurityDetector,
  SmartSecurityScanner: () => SmartSecurityScanner,
  StructureScore: () => StructureScore,
  TSDetector: () => import_ts_detector.TSDetector,
  calculateConfidence: () => calculateConfidence,
  checkFrameworkRules: () => checkFrameworkRules,
  detectFramework: () => detectFramework,
  getFrameworkRules: () => getFrameworkRules
});
module.exports = __toCommonJS(index_exports);
var import_ts_detector = __toESM(require_ts_detector());
var import_eslint_detector = __toESM(require_eslint_detector());
var import_import_detector = __toESM(require_import_detector());
var import_package_detector = __toESM(require_package_detector());
var import_runtime_detector = __toESM(require_runtime_detector());
var import_build_detector = __toESM(require_build_detector());
var import_security_detector = __toESM(require_security_detector());
var import_circular_detector = __toESM(require_circular_detector());
var import_isolation_detector = __toESM(require_isolation_detector());
var import_performance_detector = __toESM(require_performance_detector());
var import_network_detector = __toESM(require_network_detector());
var import_complexity_detector = __toESM(require_complexity_detector());

// src/detector/phase1-enhanced.ts
init_enhanced_db_detector();
init_smart_security_scanner();
init_context_aware_performance();
var Phase1DetectorSuite = class {
  dbDetector;
  securityDetector;
  performanceDetector;
  constructor(workspaceRoot) {
    const { EnhancedDBDetector: EnhancedDBDetector2 } = (init_enhanced_db_detector(), __toCommonJS(enhanced_db_detector_exports));
    const { SmartSecurityScanner: SmartSecurityScanner2 } = (init_smart_security_scanner(), __toCommonJS(smart_security_scanner_exports));
    const { ContextAwarePerformanceDetector: ContextAwarePerformanceDetector2 } = (init_context_aware_performance(), __toCommonJS(context_aware_performance_exports));
    this.dbDetector = new EnhancedDBDetector2(workspaceRoot);
    this.securityDetector = new SmartSecurityScanner2(workspaceRoot);
    this.performanceDetector = new ContextAwarePerformanceDetector2(workspaceRoot);
  }
  /**
   * Run all Phase 1 enhanced detectors
   */
  async detectAll(targetDir) {
    const [dbIssues, securityIssues, performanceIssues] = await Promise.all([
      this.dbDetector.detect(targetDir),
      this.securityDetector.detect(targetDir),
      this.performanceDetector.detect(targetDir)
    ]);
    return {
      database: dbIssues,
      security: securityIssues,
      performance: performanceIssues,
      summary: {
        totalIssues: dbIssues.length + securityIssues.length + performanceIssues.length,
        byCategory: {
          database: dbIssues.length,
          security: securityIssues.length,
          performance: performanceIssues.length
        }
      }
    };
  }
  /**
   * Get statistics from all detectors
   */
  async getStatistics(targetDir) {
    const results = await this.detectAll(targetDir);
    return {
      database: this.dbDetector.getSummary?.() || {},
      security: this.securityDetector.getStatistics?.(results.security) || {},
      performance: this.performanceDetector.getStatistics?.(results.performance) || {},
      overall: results.summary
    };
  }
};

// src/detector/index.ts
init_enhanced_db_detector();
init_smart_security_scanner();
init_context_aware_performance();
init_confidence_scoring();

// src/detector/framework-rules.ts
function detectFramework(content, filePath) {
  const indicators = [];
  let framework = "unknown";
  let confidence = 0;
  const reactIndicators = [
    { pattern: /import\s+.*?from\s+['"]react['"]/, weight: 40, indicator: "React import" },
    { pattern: /useState|useEffect|useCallback|useMemo/, weight: 30, indicator: "React Hooks" },
    { pattern: /React\.Component|React\.FC|React\.FunctionComponent/, weight: 25, indicator: "React Component" },
    { pattern: /\.jsx|\.tsx/, weight: 20, indicator: "JSX/TSX extension" }
  ];
  let reactConfidence = 0;
  for (const { pattern, weight, indicator } of reactIndicators) {
    if (pattern.test(content) || pattern.test(filePath)) {
      reactConfidence += weight;
      indicators.push(indicator);
    }
  }
  const nextIndicators = [
    { pattern: /import\s+.*?from\s+['"]next\//, weight: 40, indicator: "Next.js import" },
    { pattern: /getServerSideProps|getStaticProps|getStaticPaths/, weight: 35, indicator: "Next.js data fetching" },
    { pattern: /NextApiRequest|NextApiResponse/, weight: 30, indicator: "Next.js API types" },
    { pattern: /\/app\/.*?\/route\.(ts|js)/, weight: 25, indicator: "Next.js 13+ app dir" }
  ];
  let nextConfidence = 0;
  for (const { pattern, weight, indicator } of nextIndicators) {
    if (pattern.test(content) || pattern.test(filePath)) {
      nextConfidence += weight;
      indicators.push(indicator);
    }
  }
  const expressIndicators = [
    { pattern: /import\s+.*?express\s+from\s+['"]express['"]/, weight: 40, indicator: "Express import" },
    { pattern: /app\.get\(|app\.post\(|app\.use\(/, weight: 35, indicator: "Express routes" },
    { pattern: /req\s*:\s*Request|res\s*:\s*Response/, weight: 30, indicator: "Express types" },
    { pattern: /middleware|router/, weight: 20, indicator: "Express middleware/router" }
  ];
  let expressConfidence = 0;
  for (const { pattern, weight, indicator } of expressIndicators) {
    if (pattern.test(content)) {
      expressConfidence += weight;
      indicators.push(indicator);
    }
  }
  const vueIndicators = [
    { pattern: /import\s+.*?from\s+['"]vue['"]/, weight: 40, indicator: "Vue import" },
    { pattern: /<script setup>|<template>/, weight: 35, indicator: "Vue SFC" },
    { pattern: /defineComponent|defineProps|defineEmits/, weight: 30, indicator: "Vue Composition API" }
  ];
  let vueConfidence = 0;
  for (const { pattern, weight, indicator } of vueIndicators) {
    if (pattern.test(content)) {
      vueConfidence += weight;
      indicators.push(indicator);
    }
  }
  const angularIndicators = [
    { pattern: /import\s+.*?from\s+['"]@angular\//, weight: 40, indicator: "Angular import" },
    { pattern: /@Component|@Injectable|@NgModule/, weight: 35, indicator: "Angular decorators" },
    { pattern: /constructor.*?private.*?\)/, weight: 25, indicator: "Angular DI pattern" }
  ];
  let angularConfidence = 0;
  for (const { pattern, weight, indicator } of angularIndicators) {
    if (pattern.test(content)) {
      angularConfidence += weight;
      indicators.push(indicator);
    }
  }
  const frameworks = [
    { name: "nextjs", confidence: nextConfidence },
    { name: "react", confidence: reactConfidence },
    { name: "express", confidence: expressConfidence },
    { name: "vue", confidence: vueConfidence },
    { name: "angular", confidence: angularConfidence }
  ];
  const best = frameworks.reduce(
    (prev, curr) => curr.confidence > prev.confidence ? curr : prev
  );
  if (best.confidence >= 40) {
    framework = best.name;
    confidence = Math.min(100, best.confidence);
  } else {
    framework = "nodejs";
    confidence = 50;
  }
  return {
    framework,
    confidence,
    indicators
  };
}
var REACT_RULES = [
  {
    framework: "react",
    name: "useEffect-cleanup-missing",
    description: "useEffect with subscriptions/timers should return cleanup function",
    pattern: /useEffect\s*\(\s*\(\s*\)\s*=>\s*\{[\s\S]*?(setInterval|setTimeout|addEventListener|subscribe)\s*\([^}]*\}\s*,/,
    severity: "high",
    suggestedFix: `
useEffect(() => {
  const timer = setInterval(() => { /* ... */ }, 1000);
  
  // \u2705 Return cleanup function
  return () => {
    clearInterval(timer);
  };
}, [dependencies]);`
  },
  {
    framework: "react",
    name: "useState-in-loop",
    description: "useState should not be called in loops or conditions",
    pattern: /(?:for|while|if)\s*\([^)]*\)\s*\{[\s\S]*?useState/,
    severity: "critical",
    suggestedFix: `
// \u274C BAD: useState in conditional
if (condition) {
  const [state, setState] = useState(0); // Breaks rules of hooks
}

// \u2705 GOOD: useState at top level
const [state, setState] = useState(condition ? 0 : 1);`
  },
  {
    framework: "react",
    name: "async-useEffect",
    description: "useEffect callback cannot be async directly",
    pattern: /useEffect\s*\(\s*async\s*\(/,
    severity: "high",
    suggestedFix: `
// \u274C BAD: Async useEffect
useEffect(async () => {
  const data = await fetch();
}, []);

// \u2705 GOOD: Async function inside
useEffect(() => {
  async function fetchData() {
    const data = await fetch();
  }
  fetchData();
}, []);`
  }
];
var EXPRESS_RULES = [
  {
    framework: "express",
    name: "async-route-no-error-handling",
    description: "Async Express routes must handle errors",
    pattern: /app\.(get|post|put|delete|patch)\s*\([^,]*,\s*async\s*\([^)]*\)\s*=>\s*\{(?![\s\S]*(?:try|\.catch))/,
    severity: "high",
    suggestedFix: `
// \u274C BAD: No error handling
app.get('/api/users', async (req, res) => {
  const users = await db.query();
  res.json(users);
});

// \u2705 GOOD: Try-catch or express-async-errors
app.get('/api/users', async (req, res, next) => {
  try {
    const users = await db.query();
    res.json(users);
  } catch (error) {
    next(error);
  }
});`
  },
  {
    framework: "express",
    name: "middleware-no-next",
    description: "Express middleware must call next() or send response",
    pattern: /app\.use\s*\([^,]*,\s*\([^)]*\)\s*=>\s*\{(?![\s\S]*(?:next\(\)|res\.(?:send|json|end)))/,
    severity: "critical",
    suggestedFix: `
// \u274C BAD: No next() or response
app.use((req, res) => {
  console.log(req.url);
  // Hangs the request!
});

// \u2705 GOOD: Call next()
app.use((req, res, next) => {
  console.log(req.url);
  next();
});`
  }
];
var NEXTJS_RULES = [
  {
    framework: "nextjs",
    name: "api-route-no-export",
    description: "Next.js API routes must export default handler",
    pattern: /NextApiRequest[\s\S]*?NextApiResponse(?![\s\S]*export\s+default)/,
    severity: "critical",
    suggestedFix: `
// \u274C BAD: No default export
async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.json({ message: 'Hello' });
}

// \u2705 GOOD: Default export
export default async function handler(
  req: NextApiRequest, 
  res: NextApiResponse
) {
  res.json({ message: 'Hello' });
}`
  },
  {
    framework: "nextjs",
    name: "getServerSideProps-sync",
    description: "getServerSideProps must be async",
    pattern: /export\s+(?:const|function)\s+getServerSideProps\s*(?!=\s*async)/,
    severity: "high",
    suggestedFix: `
// \u274C BAD: Not async
export function getServerSideProps(context) {
  return { props: {} };
}

// \u2705 GOOD: Async function
export async function getServerSideProps(context) {
  const data = await fetchData();
  return { props: { data } };
}`
  }
];
var NODEJS_RULES = [
  {
    framework: "nodejs",
    name: "stream-no-error-handler",
    description: "Node.js streams must have error handlers",
    pattern: /createReadStream|createWriteStream[\s\S]{0,200}(?!\.on\s*\(\s*['"]error['"])/,
    severity: "high",
    suggestedFix: `
// \u274C BAD: No error handler
const stream = fs.createReadStream('file.txt');
stream.pipe(destination);

// \u2705 GOOD: Error handler
const stream = fs.createReadStream('file.txt');
stream.on('error', (err) => {
  console.error('Stream error:', err);
});
stream.pipe(destination);`
  },
  {
    framework: "nodejs",
    name: "event-emitter-memory-leak",
    description: "EventEmitter listeners should be removed",
    pattern: /\.on\s*\(\s*['"][^'"]+['"](?![\s\S]{0,500}\.(?:off|removeListener))/,
    severity: "medium",
    suggestedFix: `
// \u274C BAD: No cleanup
emitter.on('data', handler);

// \u2705 GOOD: Remove listener
emitter.on('data', handler);
// Later...
emitter.off('data', handler);

// OR: Use once() for one-time events
emitter.once('data', handler);`
  }
];
function getFrameworkRules(framework) {
  switch (framework) {
    case "react":
      return REACT_RULES;
    case "express":
      return EXPRESS_RULES;
    case "nextjs":
      return [...REACT_RULES, ...NEXTJS_RULES];
    // Next.js includes React
    case "nodejs":
      return NODEJS_RULES;
    default:
      return [];
  }
}
function checkFrameworkRules(content, filePath) {
  const detection = detectFramework(content, filePath);
  if (detection.confidence < 40) {
    return [];
  }
  const rules = getFrameworkRules(detection.framework);
  const violations = [];
  for (const rule of rules) {
    const matches = Array.from(content.matchAll(new RegExp(rule.pattern, "g")));
    if (matches.length > 0) {
      violations.push({ rule, matches });
    }
  }
  return violations;
}

// src/detector/index.ts
var import_bundle_analyzer = __toESM(require_bundle_analyzer());
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  BuildDetector,
  BundleAnalyzer,
  CircularDependencyDetector,
  ComplexityDetector,
  ComplexityErrorType,
  ComponentIsolationDetector,
  ContextAwarePerformanceDetector,
  ContextScore,
  ESLintDetector,
  EXPRESS_RULES,
  EnhancedDBDetector,
  FileContext,
  HistoricalAccuracy,
  ImportDetector,
  NEXTJS_RULES,
  NODEJS_RULES,
  NetworkDetector,
  PackageDetector,
  PatternStrength,
  PerformanceDetector,
  PerformanceErrorType,
  Phase1DetectorSuite,
  REACT_RULES,
  RuntimeDetector,
  SecurityDetector,
  SmartSecurityScanner,
  StructureScore,
  TSDetector,
  calculateConfidence,
  checkFrameworkRules,
  detectFramework,
  getFrameworkRules
});
/*! Bundled license information:

is-number/index.js:
  (*!
   * is-number <https://github.com/jonschlinkert/is-number>
   *
   * Copyright (c) 2014-present, Jon Schlinkert.
   * Released under the MIT License.
   *)

to-regex-range/index.js:
  (*!
   * to-regex-range <https://github.com/micromatch/to-regex-range>
   *
   * Copyright (c) 2015-present, Jon Schlinkert.
   * Released under the MIT License.
   *)

fill-range/index.js:
  (*!
   * fill-range <https://github.com/jonschlinkert/fill-range>
   *
   * Copyright (c) 2014-present, Jon Schlinkert.
   * Licensed under the MIT License.
   *)
*/
