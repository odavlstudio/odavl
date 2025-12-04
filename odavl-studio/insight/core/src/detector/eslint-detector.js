"use strict";
/**
 * ESLint Error Detector
 * Detects ESLint errors in the project
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ESLintDetector = void 0;
const node_child_process_1 = require("node:child_process");
const path = __importStar(require("node:path"));
const logger_1 = require("../utils/logger");
class ESLintDetector {
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
            // Run ESLint with JSON format
            const output = (0, node_child_process_1.execSync)(`eslint . --format json`, {
                cwd: dir,
                stdio: 'pipe',
                encoding: 'utf8'
            });
            return this.parseESLintOutput(output);
        }
        catch (error) {
            // ESLint throws exception if errors found
            const output = error.stdout?.toString() || '[]';
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
                        ruleId: message.ruleId || 'unknown',
                        severity: message.severity,
                        fixable: message.fix !== undefined
                    };
                    this.analyzeRootCause(error);
                    errors.push(error);
                }
            }
        }
        catch (parseError) {
            logger_1.logger.error('Failed to parse ESLint output:', parseError);
        }
        return errors;
    }
    /**
     * Analyze root cause of the error
     */
    analyzeRootCause(error) {
        const knownRules = {
            'no-unused-vars': {
                cause: 'Variable declared but not used',
                fix: 'Delete the variable, use it, or prefix with _ if intentional'
            },
            'no-console': {
                cause: 'Using console.log in code',
                fix: 'Use a custom logger or remove console.log before production'
            },
            '@typescript-eslint/no-explicit-any': {
                cause: 'Using any instead of specific type',
                fix: 'Specify a precise type instead of any (e.g. string, number, object)'
            },
            'import/no-unresolved': {
                cause: 'Import path not found',
                fix: 'Verify path correctness and file existence'
            },
            'no-debugger': {
                cause: 'Using debugger statement',
                fix: 'Remove debugger before committing code'
            },
            '@typescript-eslint/no-unused-vars': {
                cause: 'TypeScript variable not used',
                fix: 'Delete the variable or use it'
            },
            'react/prop-types': {
                cause: 'Component props without PropTypes definition',
                fix: 'Add PropTypes or use TypeScript interfaces'
            },
            'react-hooks/exhaustive-deps': {
                cause: 'useEffect dependencies incomplete',
                fix: 'Add all used variables to dependency array'
            }
        };
        const rule = knownRules[error.ruleId];
        if (rule) {
            error.rootCause = rule.cause;
            error.suggestedFix = rule.fix;
        }
        else {
            error.rootCause = `ESLint rule: ${error.ruleId}`;
            error.suggestedFix = `Check ESLint docs for ${error.ruleId}`;
        }
    }
    /**
     * Format error for display
     */
    formatError(error) {
        const icon = error.severity === 2 ? '❌' : '⚠️';
        const relPath = path.relative(this.workspaceRoot, error.file);
        const fixableTag = error.fixable ? '🔧 [Auto-fixable]' : '';
        return `
${icon} ${error.severity === 2 ? 'ERROR' : 'WARNING'} [${error.ruleId}] ${fixableTag}
📁 File: ${relPath}
📍 Line: ${error.line}, Column: ${error.column}
💬 Error: ${error.message}

🔍 Root Cause:
   ${error.rootCause}

✅ Suggested Fix:
   ${error.suggestedFix}
${'─'.repeat(60)}
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
                stdio: 'inherit'
            });
            return { fixed: 0, failed: 0 }; // ESLint doesn't return fix count
        }
        catch (error) {
            logger_1.logger.error('Auto-fix failed:', error);
            return { fixed: 0, failed: 1 };
        }
    }
}
exports.ESLintDetector = ESLintDetector;
//# sourceMappingURL=eslint-detector.js.map