"use strict";
/**
 * Network & API Monitoring Detector - ODAVL Insight
 * Phase 3: Network & Runtime Monitoring (v1.3.0)
 *
 * Detects network and API-related issues:
 * - API call monitoring (fetch, axios, http patterns)
 * - Timeout detection
 * - Network error handling
 * - Request/response patterns
 * - Concurrent request issues
 *
 * Target Coverage: 20% → 75%
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
exports.NetworkDetector = exports.NetworkErrorType = void 0;
const fs = __importStar(require("node:fs"));
const path = __importStar(require("node:path"));
const glob_1 = require("glob");
var NetworkErrorType;
(function (NetworkErrorType) {
    // API monitoring
    NetworkErrorType["FETCH_WITHOUT_ERROR_HANDLING"] = "FETCH_WITHOUT_ERROR_HANDLING";
    NetworkErrorType["AXIOS_WITHOUT_INTERCEPTOR"] = "AXIOS_WITHOUT_INTERCEPTOR";
    NetworkErrorType["MISSING_TIMEOUT"] = "MISSING_TIMEOUT";
    NetworkErrorType["HARDCODED_URL"] = "HARDCODED_URL";
    // Timeout issues
    NetworkErrorType["NO_REQUEST_TIMEOUT"] = "NO_REQUEST_TIMEOUT";
    NetworkErrorType["EXCESSIVE_TIMEOUT"] = "EXCESSIVE_TIMEOUT";
    NetworkErrorType["MISSING_ABORT_CONTROLLER"] = "MISSING_ABORT_CONTROLLER";
    // Error handling
    NetworkErrorType["MISSING_RETRY_LOGIC"] = "MISSING_RETRY_LOGIC";
    NetworkErrorType["NO_FALLBACK_MECHANISM"] = "NO_FALLBACK_MECHANISM";
    NetworkErrorType["UNHANDLED_NETWORK_ERROR"] = "UNHANDLED_NETWORK_ERROR";
    // Concurrency
    NetworkErrorType["CONCURRENT_REQUESTS_WITHOUT_LIMIT"] = "CONCURRENT_REQUESTS_WITHOUT_LIMIT";
    NetworkErrorType["RACE_CONDITION_RISK"] = "RACE_CONDITION_RISK";
    NetworkErrorType["PROMISE_ALL_WITHOUT_ERROR_HANDLING"] = "PROMISE_ALL_WITHOUT_ERROR_HANDLING";
})(NetworkErrorType || (exports.NetworkErrorType = NetworkErrorType = {}));
class NetworkDetector {
    workspaceRoot;
    ignorePatterns;
    constructor(workspaceRoot) {
        this.workspaceRoot = workspaceRoot;
        this.ignorePatterns = [
            'node_modules/**',
            'dist/**',
            '.next/**',
            'out/**',
            'build/**',
            '**/*.test.*',
            '**/*.spec.*',
            '**/*.mock.*',
            '**/tests/**',
            '**/__tests__/**',
            '**/fixtures/**',
            '**/examples/**',
            '**/demo/**',
        ];
    }
    /**
     * Main detection method
     */
    async detect(targetDir) {
        const dir = targetDir || this.workspaceRoot;
        const errors = [];
        // Find all TypeScript/JavaScript files
        const files = await (0, glob_1.glob)('**/*.{ts,tsx,js,jsx}', {
            cwd: dir,
            ignore: this.ignorePatterns,
        });
        for (const file of files) {
            const filePath = path.join(dir, file);
            const content = fs.readFileSync(filePath, 'utf8');
            // Skip if file is likely false positive (config, types, etc.)
            if (this.shouldExclude(filePath, content)) {
                continue;
            }
            // 1. Detect fetch patterns without error handling
            errors.push(...this.detectFetchIssues(content, filePath));
            // 2. Detect axios patterns
            errors.push(...this.detectAxiosIssues(content, filePath));
            // 3. Detect timeout issues
            errors.push(...this.detectTimeoutIssues(content, filePath));
            // 4. Detect error handling issues
            errors.push(...this.detectErrorHandlingIssues(content, filePath));
            // 5. Detect concurrency issues
            errors.push(...this.detectConcurrencyIssues(content, filePath));
        }
        return errors;
    }
    /**
     * Detect fetch patterns without proper error handling
     */
    detectFetchIssues(content, filePath) {
        const errors = [];
        const lines = content.split('\n');
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            // Pattern: fetch(...) without .catch() or try/catch
            if (/\bfetch\s*\(/.test(line)) {
                const nextLines = lines.slice(i, Math.min(i + 10, lines.length)).join('\n');
                // Check if fetch is in try block or has .catch()
                const hasTryCatch = this.isInTryBlock(lines, i);
                const hasCatchHandler = nextLines.includes('.catch(') || nextLines.includes('.catch (');
                const hasAwaitInTry = /await\s+fetch/.test(line) && hasTryCatch;
                if (!hasTryCatch && !hasCatchHandler && !hasAwaitInTry) {
                    errors.push({
                        file: filePath,
                        line: i + 1,
                        type: NetworkErrorType.FETCH_WITHOUT_ERROR_HANDLING,
                        severity: 'high',
                        message: 'fetch() call without error handling',
                        pattern: line.trim(),
                        suggestedFix: `Add error handling:
try {
  const response = await fetch(url);
  if (!response.ok) throw new Error(\`HTTP \${response.status}\`);
  const data = await response.json();
} catch (error) {
  logger.error('Fetch error:', error);
  // Handle error appropriately
}

Or use .catch():
fetch(url)
  .then(res => res.json())
  .catch(err => logger.error(err));`,
                        details: 'Unhandled fetch errors can cause silent failures and poor user experience'
                    });
                }
                // Check for missing timeout
                const hasTimeout = nextLines.includes('signal:') || nextLines.includes('AbortController');
                if (!hasTimeout) {
                    errors.push({
                        file: filePath,
                        line: i + 1,
                        type: NetworkErrorType.MISSING_TIMEOUT,
                        severity: 'medium',
                        message: 'fetch() without timeout configuration',
                        pattern: line.trim(),
                        suggestedFix: `Add timeout using AbortController:
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 5000);

try {
  const response = await fetch(url, { signal: controller.signal });
  clearTimeout(timeoutId);
} catch (error) {
  if (error.name === 'AbortError') {
    logger.error('Request timeout');
  }
}`,
                        details: 'Requests without timeouts can hang indefinitely'
                    });
                }
            }
            // Pattern: Hardcoded URLs
            const urlMatch = line.match(/fetch\s*\(\s*['"`](https?:\/\/[^'"`]+)['"`]/);
            if (urlMatch) {
                const url = urlMatch[1];
                // Skip if it's a localhost or example URL
                if (!url.includes('localhost') && !url.includes('127.0.0.1') && !url.includes('example.com')) {
                    errors.push({
                        file: filePath,
                        line: i + 1,
                        type: NetworkErrorType.HARDCODED_URL,
                        severity: 'medium',
                        message: `Hardcoded URL in fetch: ${url}`,
                        pattern: line.trim(),
                        suggestedFix: `Move URL to environment variable or config:
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'fallback-url';
fetch(\`\${API_URL}/endpoint\`)`,
                        details: 'Hardcoded URLs make it difficult to change environments (dev/staging/prod)'
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
        const lines = content.split('\n');
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            // Pattern: axios.get/post/etc without error handling
            if (/\baxios\.(get|post|put|delete|patch|request)\s*\(/.test(line)) {
                const nextLines = lines.slice(i, Math.min(i + 10, lines.length)).join('\n');
                const hasTryCatch = this.isInTryBlock(lines, i);
                const hasCatchHandler = nextLines.includes('.catch(') || nextLines.includes('.catch (');
                if (!hasTryCatch && !hasCatchHandler) {
                    errors.push({
                        file: filePath,
                        line: i + 1,
                        type: NetworkErrorType.FETCH_WITHOUT_ERROR_HANDLING,
                        severity: 'high',
                        message: 'axios call without error handling',
                        pattern: line.trim(),
                        suggestedFix: `Add error handling:
try {
  const response = await axios.get(url);
  // Handle response
} catch (error) {
  if (axios.isAxiosError(error)) {
    logger.error('API Error:', error.response?.status, error.message);
  }
}`,
                        details: 'Axios errors contain response data that should be handled'
                    });
                }
                // Check for timeout configuration
                const hasTimeout = nextLines.includes('timeout:') || content.includes('axios.create');
                if (!hasTimeout) {
                    errors.push({
                        file: filePath,
                        line: i + 1,
                        type: NetworkErrorType.NO_REQUEST_TIMEOUT,
                        severity: 'medium',
                        message: 'axios call without timeout',
                        pattern: line.trim(),
                        suggestedFix: `Add timeout configuration:
axios.get(url, { timeout: 5000 })

Or configure axios instance:
const api = axios.create({
  baseURL: process.env.API_URL,
  timeout: 5000,
});`,
                        details: 'Default axios timeout is 0 (no timeout)'
                    });
                }
            }
            // Check for axios instance creation without interceptors
            if (/axios\.create\s*\(/.test(line)) {
                const fileContent = content;
                const hasInterceptor = fileContent.includes('interceptors.request') ||
                    fileContent.includes('interceptors.response');
                if (!hasInterceptor) {
                    errors.push({
                        file: filePath,
                        line: i + 1,
                        type: NetworkErrorType.AXIOS_WITHOUT_INTERCEPTOR,
                        severity: 'low',
                        message: 'axios instance without interceptors for error handling',
                        pattern: line.trim(),
                        suggestedFix: `Add interceptors for global error handling:
api.interceptors.response.use(
  response => response,
  error => {
    // Global error handling
    logger.error('API Error:', error.response?.status);
    return Promise.reject(error);
  }
);`,
                        details: 'Interceptors provide centralized error handling and logging'
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
        const lines = content.split('\n');
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            // Pattern: setTimeout with very long timeout (>30s)
            // Check current line and next 5 lines for timeout value
            // Handles multi-line setTimeout patterns like:
            //   setTimeout(() => {
            //       logger.debug('Done');
            //   }, 60000);
            if (line.includes('setTimeout')) {
                const block = lines.slice(i, Math.min(i + 6, lines.length)).join('\n');
                const timeoutMatch = block.match(/setTimeout\s*\([\s\S]*?,\s*(\d+)\s*\)/);
                if (timeoutMatch) {
                    const timeout = parseInt(timeoutMatch[1], 10);
                    if (timeout > 30000) {
                        errors.push({
                            file: filePath,
                            line: i + 1,
                            type: NetworkErrorType.EXCESSIVE_TIMEOUT,
                            severity: 'low',
                            message: `Excessive timeout: ${timeout}ms (${timeout / 1000}s)`,
                            pattern: line.trim(),
                            suggestedFix: `Consider reducing timeout or using a more appropriate mechanism:
- For network requests: 5-10 seconds is usually sufficient
- For polling: Use setInterval with reasonable intervals
- For long operations: Consider WebSocket or Server-Sent Events`,
                            details: 'Very long timeouts can indicate architectural issues'
                        });
                    }
                }
            }
            // Pattern: Promise.race for timeout (good practice, just detect)
            if (/Promise\.race\s*\(/.test(line)) {
                const nextLines = lines.slice(i, Math.min(i + 5, lines.length)).join('\n');
                if (nextLines.includes('setTimeout') || nextLines.includes('timeout')) {
                    // This is actually good - no error, just detection for stats
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
        const lines = content.split('\n');
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            // Pattern: .then() without .catch()
            if (/\.then\s*\(/.test(line)) {
                // Look back up to 5 lines to find if this is a network call
                const lookback = Math.max(0, i - 5);
                const prevLines = lines.slice(lookback, i + 1).join('\n');
                const isNetworkCall = prevLines.includes('fetch') ||
                    prevLines.includes('axios') ||
                    prevLines.includes('http.get') ||
                    prevLines.includes('http.post') ||
                    prevLines.includes('request(');
                // Look ahead up to 10 lines to find .catch()
                const nextLines = lines.slice(i, Math.min(i + 10, lines.length)).join('\n');
                const hasCatch = nextLines.includes('.catch(') || nextLines.includes('.catch (');
                if (isNetworkCall && !hasCatch) {
                    errors.push({
                        file: filePath,
                        line: i + 1,
                        type: NetworkErrorType.UNHANDLED_NETWORK_ERROR,
                        severity: 'high',
                        message: '.then() without .catch() handler',
                        pattern: line.trim(),
                        suggestedFix: `Add .catch() handler:
fetch(url)
  .then(res => res.json())
  .then(data => logger.debug(data))
  .catch(error => {
    logger.error('Network error:', error);
    // Handle error appropriately
  });`,
                        details: 'Unhandled promise rejections can crash Node.js applications'
                    });
                }
            }
            // Pattern: response.ok check missing
            if (/const\s+response\s*=\s*await\s+fetch/.test(line)) {
                const nextLines = lines.slice(i, Math.min(i + 5, lines.length)).join('\n');
                const hasOkCheck = nextLines.includes('response.ok') ||
                    nextLines.includes('response.status') ||
                    nextLines.includes('!response.ok');
                if (!hasOkCheck) {
                    errors.push({
                        file: filePath,
                        line: i + 1,
                        type: NetworkErrorType.UNHANDLED_NETWORK_ERROR,
                        severity: 'medium',
                        message: 'fetch response without status check',
                        pattern: line.trim(),
                        suggestedFix: `Check response status:
const response = await fetch(url);
if (!response.ok) {
  throw new Error(\`HTTP error! status: \${response.status}\`);
}
const data = await response.json();`,
                        details: 'fetch() does not reject on HTTP errors (404, 500, etc.)'
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
        const lines = content.split('\n');
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            // Pattern: Promise.all without error handling
            if (/Promise\.all\s*\(/.test(line)) {
                const nextLines = lines.slice(i, Math.min(i + 10, lines.length)).join('\n');
                const hasCatch = nextLines.includes('.catch(') || this.isInTryBlock(lines, i);
                if (!hasCatch) {
                    errors.push({
                        file: filePath,
                        line: i + 1,
                        type: NetworkErrorType.PROMISE_ALL_WITHOUT_ERROR_HANDLING,
                        severity: 'high',
                        message: 'Promise.all() without error handling',
                        pattern: line.trim(),
                        suggestedFix: `Add error handling and consider Promise.allSettled:
// Option 1: Handle errors
try {
  const results = await Promise.all(promises);
} catch (error) {
  logger.error('One or more promises failed:', error);
}

// Option 2: Use Promise.allSettled (continues even if some fail)
const results = await Promise.allSettled(promises);
results.forEach((result, index) => {
  if (result.status === 'rejected') {
    logger.error(\`Promise \${index} failed:\`, result.reason);
  }
});`,
                        details: 'Promise.all() rejects immediately if any promise rejects'
                    });
                }
                // Check for large number of concurrent requests
                // Pattern 1: Promise.all with inline .map()
                //   await Promise.all(userIds.map(id => fetch(...)))
                // Pattern 2: Promise.all with variable from previous .map()
                //   const promises = userIds.map(id => fetch(...));
                //   await Promise.all(promises);
                // Check inline first (next 3 lines)
                const nextFewLines = lines.slice(i, Math.min(i + 3, lines.length)).join('\n');
                const hasInlineMap = /.map\(.*=>/s.test(nextFewLines) &&
                    (nextFewLines.includes('fetch') || nextFewLines.includes('axios'));
                // Check previous lines for map pattern
                const prevLines = lines.slice(Math.max(0, i - 5), i + 1).join('\n');
                const hasPreviousMap = /\.map\s*\([^)]*=>\s*(fetch|axios)/s.test(prevLines);
                if (hasInlineMap || hasPreviousMap) {
                    errors.push({
                        file: filePath,
                        line: i + 1,
                        type: NetworkErrorType.CONCURRENT_REQUESTS_WITHOUT_LIMIT,
                        severity: 'medium',
                        message: 'Unlimited concurrent requests detected',
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
                        details: 'Too many concurrent requests can overwhelm servers and cause rate limiting'
                    });
                }
            }
            // Pattern: Race condition in state updates
            if (/setState|setIsLoading|setData/.test(line)) {
                // Check if this is within a function that has await calls
                const prevLines = lines.slice(Math.max(0, i - 10), i + 1).join('\n');
                const hasAwait = /await\s+(fetch|axios|response\.json)/.test(prevLines);
                if (hasAwait) {
                    // Check if there's a cleanup or cancellation mechanism
                    // Look for AbortController pattern with cleanup - expand range to cover entire useEffect
                    const functionLines = lines.slice(Math.max(0, i - 40), Math.min(i + 15, lines.length)).join('\n');
                    // Check for proper cleanup pattern:
                    // 1. Has useEffect
                    // 2. Has AbortController declared
                    // 3. Has return cleanup function
                    const hasUseEffect = functionLines.includes('useEffect');
                    const hasAbortController = /AbortController|controller\s*=\s*new\s+AbortController/.test(functionLines);
                    const hasCleanupReturn = /return\s*\(\s*\)\s*=>/.test(functionLines);
                    const hasCleanup = hasUseEffect && hasAbortController && hasCleanupReturn;
                    if (!hasCleanup && hasUseEffect) {
                        errors.push({
                            file: filePath,
                            line: i + 1,
                            type: NetworkErrorType.RACE_CONDITION_RISK,
                            severity: 'medium',
                            message: 'Potential race condition: setState after async operation without cleanup',
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
        logger.error(error);
      }
    }
  }
  
  fetchData();
  
  return () => {
    controller.abort(); // Cancel request on unmount
  };
}, [url]);`,
                            details: 'Race conditions occur when component unmounts before async operation completes'
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
        // Scan backwards
        for (let i = lineIndex; i >= 0; i--) {
            const line = lines[i];
            // Count braces
            for (const char of line) {
                if (char === '}')
                    braceCount++;
                if (char === '{')
                    braceCount--;
            }
            // If we exited a block and found 'try'
            if (braceCount < 0 && /try\s*\{/.test(line)) {
                return true;
            }
            // If we're outside the original block scope
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
        // Exclude config files
        if (filePath.includes('config') && (filePath.endsWith('.config.ts') ||
            filePath.endsWith('.config.js'))) {
            return true;
        }
        // Exclude type definition files
        if (filePath.endsWith('.d.ts')) {
            return true;
        }
        // Exclude files that are mostly types/interfaces
        const lines = content.split('\n');
        const typeLines = lines.filter(line => /^\s*(export\s+)?(interface|type|enum)\s+/.test(line)).length;
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
            affectedFiles: new Set(errors.map(e => e.file)).size,
            apiCallsDetected: 0,
            timeoutIssues: 0,
            errorHandlingIssues: 0,
            concurrencyIssues: 0,
        };
        // Initialize byType counters
        for (const type of Object.values(NetworkErrorType)) {
            stats.byType[type] = 0;
        }
        for (const error of errors) {
            // Count by severity
            stats.bySeverity[error.severity]++;
            // Count by type
            stats.byType[error.type]++;
            // Count by category
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
        const relPath = path.relative(this.workspaceRoot, error.file);
        const emoji = this.getSeverityEmoji(error.severity);
        const typeEmoji = this.getTypeEmoji(error.type);
        return `
${emoji} ${typeEmoji} NETWORK ISSUE [${error.type}] [${error.severity.toUpperCase()}]
📁 File: ${relPath}${error.line ? `:${error.line}` : ''}
💬 ${error.message}
${error.pattern ? `\n📋 Pattern: ${error.pattern}` : ''}

✅ Suggested Fix:
${error.suggestedFix}
${error.details ? `\n🔍 Details: ${error.details}` : ''}
${'─'.repeat(60)}
`;
    }
    /**
     * Get emoji for severity
     */
    getSeverityEmoji(severity) {
        const emojis = {
            critical: '💥',
            high: '🔥',
            medium: '⚠️',
            low: 'ℹ️'
        };
        return emojis[severity] || '❓';
    }
    /**
     * Get emoji for error type
     */
    getTypeEmoji(type) {
        const categoryEmojis = {
            FETCH: '🌐',
            AXIOS: '📡',
            TIMEOUT: '⏱️',
            ERROR: '❌',
            CONCURRENCY: '🔀',
            URL: '🔗'
        };
        for (const [key, emoji] of Object.entries(categoryEmojis)) {
            if (type.includes(key)) {
                return emoji;
            }
        }
        return '🔍';
    }
}
exports.NetworkDetector = NetworkDetector;
//# sourceMappingURL=network-detector.js.map