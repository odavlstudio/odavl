"use strict";
/**
 * Runtime Error Detector
 * Detects runtime errors from logs: unhandled promises, crashes, exceptions
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
exports.RuntimeDetector = void 0;
const fs = __importStar(require("node:fs"));
const path = __importStar(require("node:path"));
const glob_1 = require("glob");
const logger_1 = require("../utils/logger");
const enhanced_db_detector_1 = require("./enhanced-db-detector");
class RuntimeDetector {
    workspaceRoot;
    enhancedDbDetector;
    constructor(workspaceRoot) {
        this.workspaceRoot = workspaceRoot;
        this.enhancedDbDetector = new enhanced_db_detector_1.EnhancedDBDetector(workspaceRoot);
    }
    /**
     * Detects runtime errors from log files
     */
    async detect(targetDir) {
        const dir = targetDir || this.workspaceRoot;
        const errors = [];
        // Search for log files
        const logPatterns = [
            '.odavl/logs/**/*.log',
            '.next/**/*.log',
            'logs/**/*.log',
            '*.log'
        ];
        for (const pattern of logPatterns) {
            const logFiles = await (0, glob_1.glob)(pattern, {
                cwd: dir,
                ignore: ['node_modules/**', 'dist/**']
            });
            for (const logFile of logFiles) {
                const logPath = path.join(dir, logFile);
                const logErrors = await this.parseLogFile(logPath);
                errors.push(...logErrors);
            }
        }
        // Check process.on('unhandledRejection') in code
        const codeErrors = await this.scanCodeForRuntimeIssues(dir);
        errors.push(...codeErrors);
        // Check for database connection leaks using enhanced detector
        const dbLeaks = await this.detectDBConnectionLeaks(dir);
        errors.push(...dbLeaks);
        // Check for memory leaks (Phase 3 enhancement)
        const memoryLeakErrors = await this.detectMemoryLeaks(dir);
        errors.push(...memoryLeakErrors);
        // Check for race conditions (Phase 3 enhancement)
        const raceConditionErrors = await this.detectRaceConditions(dir);
        errors.push(...raceConditionErrors);
        // Check for resource cleanup issues (Phase 3 enhancement)
        const resourceErrors = await this.detectResourceCleanupIssues(dir);
        errors.push(...resourceErrors);
        return errors;
    }
    /**
     * Detect database connection leaks using enhanced detector
     * Phase 1 Enhancement - replaces basic regex detection
     */
    async detectDBConnectionLeaks(targetDir) {
        try {
            const dbIssues = await this.enhancedDbDetector.detect(targetDir);
            // Convert DBConnectionIssue to RuntimeError format
            return dbIssues.map((issue) => ({
                timestamp: new Date().toISOString(),
                file: issue.file,
                line: issue.line,
                errorType: 'db-connection-leak',
                message: issue.message,
                stack: issue.suggestedFix,
                rootCause: issue.rootCause,
                suggestedFix: issue.suggestedFix,
                severity: 'critical',
                confidence: 95 // Very high confidence - enhanced detector with context awareness
            }));
        }
        catch (error) {
            logger_1.logger.error('[RuntimeDetector] Enhanced DB detection error:', error);
            return []; // Fallback to empty array on error
        }
    }
    /**
     * Detect memory leaks: event listeners, intervals, timeouts without cleanup
     * Phase 3 Enhancement
     */
    async detectMemoryLeaks(dir) {
        const errors = [];
        const files = await (0, glob_1.glob)('**/*.{ts,tsx,js,jsx}', {
            cwd: dir,
            ignore: [
                'node_modules/**',
                'dist/**',
                '.next/**',
                '**/*.test.{ts,tsx,js,jsx}',
                '**/*.spec.{ts,tsx,js,jsx}',
                '**/tests/**',
                '**/__tests__/**'
            ]
        });
        for (const file of files) {
            const filePath = path.join(dir, file);
            const content = fs.readFileSync(filePath, 'utf8');
            const lines = content.split('\n');
            // 1. Event listener leaks
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i];
                // Pattern: addEventListener without removeEventListener
                if (/addEventListener\s*\(/.test(line)) {
                    const nextLines = lines.slice(i, Math.min(i + 30, lines.length)).join('\n');
                    const hasRemove = nextLines.includes('removeEventListener');
                    const hasCleanup = nextLines.includes('return () =>') || nextLines.includes('cleanup');
                    if (!hasRemove && !hasCleanup) {
                        errors.push({
                            timestamp: new Date().toISOString(),
                            file: filePath,
                            line: i + 1,
                            errorType: 'event-listener-leak',
                            message: 'addEventListener without corresponding removeEventListener',
                            rootCause: 'Event listeners not cleaned up can cause memory leaks, especially in SPAs',
                            suggestedFix: `Add cleanup in useEffect or component lifecycle:
useEffect(() => {
  const handler = () => { /* ... */ };
  element.addEventListener('event', handler);
  
  return () => {
    element.removeEventListener('event', handler);
  };
}, []);`,
                            severity: 'high',
                            confidence: 85 // High confidence - clear pattern
                        });
                    }
                }
                // Pattern: setInterval without clearInterval
                if (/setInterval\s*\(/.test(line)) {
                    const nextLines = lines.slice(i, Math.min(i + 30, lines.length)).join('\n');
                    const hasClear = nextLines.includes('clearInterval');
                    const hasCleanup = nextLines.includes('return () =>');
                    if (!hasClear && !hasCleanup) {
                        errors.push({
                            timestamp: new Date().toISOString(),
                            file: filePath,
                            line: i + 1,
                            errorType: 'interval-leak',
                            message: 'setInterval without clearInterval',
                            rootCause: 'Intervals continue running even after component unmount, causing memory leaks',
                            suggestedFix: `Store interval ID and clear it:
useEffect(() => {
  const intervalId = setInterval(() => {
    // your code
  }, 1000);
  
  return () => clearInterval(intervalId);
}, []);`,
                            severity: 'high',
                            confidence: 90 // Very high confidence - clear pattern
                        });
                    }
                }
                // Pattern: setTimeout without cleanup (potential leak in long-running apps)
                if (/setTimeout\s*\(/.test(line)) {
                    const timeoutMatch = /setTimeout\s*\([^,]+,\s*(\d+)/.exec(line);
                    if (timeoutMatch) {
                        const timeout = Number.parseInt(timeoutMatch[1], 10);
                        // Only flag long timeouts (>5s) without cleanup
                        if (timeout > 5000) {
                            const nextLines = lines.slice(i, Math.min(i + 30, lines.length)).join('\n');
                            const hasClear = nextLines.includes('clearTimeout');
                            const hasCleanup = nextLines.includes('return () =>');
                            if (!hasClear && !hasCleanup) {
                                errors.push({
                                    timestamp: new Date().toISOString(),
                                    file: filePath,
                                    line: i + 1,
                                    errorType: 'timeout-leak',
                                    message: `Long setTimeout (${timeout}ms) without cleanup`,
                                    rootCause: 'Long timeouts should be cleared on unmount to prevent callbacks on unmounted components',
                                    suggestedFix: `Store timeout ID and clear it:
useEffect(() => {
  const timeoutId = setTimeout(() => {
    // your code
  }, ${timeout});
  
  return () => clearTimeout(timeoutId);
}, []);`,
                                    severity: 'medium',
                                    confidence: 75 // Good confidence - long timeout is suspicious
                                });
                            }
                        }
                    }
                }
            }
            // 2. Check for memory leak patterns in class components
            // Task 2.3: Only check React components (has React import)
            const hasReactImport = content.includes('from "react"') ||
                content.includes("from 'react'") ||
                content.includes('import React');
            if (hasReactImport && content.includes('class ') && content.includes('Component')) {
                const hasWillUnmount = content.includes('componentWillUnmount');
                const hasListeners = content.includes('addEventListener') ||
                    content.includes('setInterval') ||
                    content.includes('setTimeout');
                if (hasListeners && !hasWillUnmount) {
                    // Find class line
                    const classLine = lines.findIndex(line => /class\s+\w+\s+extends/.test(line));
                    if (classLine !== -1) {
                        errors.push({
                            timestamp: new Date().toISOString(),
                            file: filePath,
                            line: classLine + 1,
                            errorType: 'memory-leak',
                            message: 'Class component with listeners but no componentWillUnmount',
                            rootCause: 'Listeners/intervals/timeouts must be cleaned up in componentWillUnmount',
                            suggestedFix: `Add componentWillUnmount lifecycle method:
componentWillUnmount() {
  // Clear all listeners, intervals, timeouts
  if (this.intervalId) clearInterval(this.intervalId);
  if (this.timeoutId) clearTimeout(this.timeoutId);
  element.removeEventListener('event', this.handler);
}`,
                            severity: 'high',
                            confidence: 70 // Medium-high confidence - may be backend service
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
        const files = await (0, glob_1.glob)('**/*.{ts,tsx,js,jsx}', {
            cwd: dir,
            ignore: [
                'node_modules/**',
                'dist/**',
                '.next/**',
                '**/*.test.{ts,tsx,js,jsx}',
                '**/*.spec.{ts,tsx,js,jsx}',
                '**/tests/**',
                '**/__tests__/**'
            ]
        });
        for (const file of files) {
            const filePath = path.join(dir, file);
            const content = fs.readFileSync(filePath, 'utf8');
            const lines = content.split('\n');
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i];
                // Pattern 1: Multiple async setState without checking if mounted
                if (/setState|setIsLoading|setData|setError/.test(line)) {
                    const prevLines = lines.slice(Math.max(0, i - 10), i).join('\n');
                    const nextLines = lines.slice(i, Math.min(i + 5, lines.length)).join('\n');
                    if (prevLines.includes('await ')) {
                        // Check if there's a mounted check or AbortController
                        const functionContent = lines.slice(Math.max(0, i - 30), Math.min(i + 10, lines.length)).join('\n');
                        const hasMountedCheck = functionContent.includes('isMounted') ||
                            functionContent.includes('isSubscribed') ||
                            functionContent.includes('AbortController');
                        if (!hasMountedCheck && functionContent.includes('useEffect')) {
                            errors.push({
                                timestamp: new Date().toISOString(),
                                file: filePath,
                                line: i + 1,
                                errorType: 'race-condition',
                                message: 'setState after async operation without mount check',
                                rootCause: 'Component may unmount before async operation completes, causing "Can\'t perform state update on unmounted component" warning',
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
                                severity: 'medium',
                                confidence: 65 // Medium confidence - might be handled elsewhere
                            });
                        }
                    }
                }
                // Pattern 2: Shared state modification in concurrent async operations
                if (/let\s+\w+\s*=/.test(line) && lines.slice(i, Math.min(i + 20, lines.length)).join('\n').includes('await')) {
                    const nextLines = lines.slice(i, Math.min(i + 20, lines.length)).join('\n');
                    const hasMultipleAwaits = (nextLines.match(/await\s+/g) || []).length > 1;
                    if (hasMultipleAwaits) {
                        const varMatch = /let\s+(\w+)\s*=/.exec(line);
                        if (varMatch) {
                            const varName = varMatch[1];
                            // Task 2.1: Filter out common false positives
                            const commonLoopCounters = /^(i|j|k|idx|index|n|m)$/;
                            const singleLetter = /^[a-z]$/;
                            const commonParams = /^(id|req|res|err|val|tmp|temp)$/;
                            const sequentialVars = /^(targetDir|filePath|data|result|response|config)$/;
                            // Skip if it's a loop counter, single letter, common param, or sequential variable
                            if (commonLoopCounters.test(varName) || singleLetter.test(varName) ||
                                commonParams.test(varName) || sequentialVars.test(varName)) {
                                continue; // Skip this potential race condition
                            }
                            const varUsageCount = (nextLines.match(new RegExp(`\\b${varName}\\b`, 'g')) || []).length;
                            if (varUsageCount > 2) {
                                errors.push({
                                    timestamp: new Date().toISOString(),
                                    file: filePath,
                                    line: i + 1,
                                    errorType: 'race-condition',
                                    message: `Potential race condition: variable '${varName}' modified in multiple async operations`,
                                    rootCause: 'Shared mutable state accessed by multiple async operations can lead to race conditions',
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
                                    severity: 'low',
                                    confidence: 55 // Lower confidence - may be false positive
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
        const files = await (0, glob_1.glob)('**/*.{ts,tsx,js,jsx}', {
            cwd: dir,
            ignore: [
                'node_modules/**',
                'dist/**',
                '.next/**',
                '**/*.test.{ts,tsx,js,jsx}',
                '**/*.spec.{ts,tsx,js,jsx}',
                '**/tests/**',
                '**/__tests__/**'
            ]
        });
        for (const file of files) {
            const filePath = path.join(dir, file);
            const content = fs.readFileSync(filePath, 'utf8');
            const lines = content.split('\n');
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i];
                // Pattern 1: WebSocket without close
                if (/new\s+WebSocket\s*\(/.test(line)) {
                    const nextLines = lines.slice(i, Math.min(i + 50, lines.length)).join('\n');
                    const hasClose = nextLines.includes('.close()');
                    const hasCleanup = nextLines.includes('return () =>');
                    if (!hasClose && !hasCleanup) {
                        errors.push({
                            timestamp: new Date().toISOString(),
                            file: filePath,
                            line: i + 1,
                            errorType: 'websocket-leak',
                            message: 'WebSocket created without cleanup',
                            rootCause: 'WebSocket connections must be closed to free resources',
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
                            severity: 'high'
                        });
                    }
                }
                // Pattern 2: Database connections - use enhanced detector
                // Handled by enhancedDbDetector in main detect() method
                // Pattern 3: File handles without close
                if (/fs\.(createReadStream|createWriteStream|open)\s*\(/.test(line)) {
                    const nextLines = lines.slice(i, Math.min(i + 30, lines.length)).join('\n');
                    const hasClose = nextLines.includes('.close()') ||
                        nextLines.includes('.end()') ||
                        nextLines.includes('.destroy()');
                    if (!hasClose && !nextLines.includes('pipeline')) {
                        errors.push({
                            timestamp: new Date().toISOString(),
                            file: filePath,
                            line: i + 1,
                            errorType: 'resource-not-cleaned',
                            message: 'File stream without cleanup',
                            rootCause: 'File handles must be closed to prevent resource leaks',
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
                            severity: 'high'
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
        if (!fs.existsSync(logPath))
            return errors;
        const content = fs.readFileSync(logPath, 'utf8');
        const lines = content.split('\n');
        // Common error patterns
        const patterns = [
            {
                regex: /UnhandledPromiseRejectionWarning:\s*(.+)/i,
                type: 'unhandled-promise',
                severity: 'high'
            },
            {
                regex: /Uncaught\s+(?:Error|Exception):\s*(.+)/i,
                type: 'uncaught-exception',
                severity: 'critical'
            },
            {
                regex: /FATAL ERROR:\s*(.+)/i,
                type: 'crash',
                severity: 'critical'
            },
            {
                regex: /AssertionError\s*:\s*(.+)/i,
                type: 'assertion-failure',
                severity: 'high'
            },
            {
                regex: /ENOMEM|Out of memory|JavaScript heap out of memory/i,
                type: 'memory-error',
                severity: 'critical'
            }
        ];
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            for (const pattern of patterns) {
                const match = line.match(pattern.regex);
                if (match) {
                    // Extract stack trace (following lines)
                    const stackLines = [];
                    for (let j = i + 1; j < Math.min(i + 10, lines.length); j++) {
                        if (lines[j].trim().startsWith('at ')) {
                            stackLines.push(lines[j].trim());
                        }
                        else if (stackLines.length > 0) {
                            break;
                        }
                    }
                    // Extract file and line from stack trace
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
                        timestamp: this.extractTimestamp(line) || new Date().toISOString(),
                        file: errorFile,
                        line: errorLine,
                        errorType: pattern.type,
                        message: match[1] || line,
                        stack: stackLines.join('\n'),
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
        // ISO timestamp pattern: 2024-01-15T10:30:45.123Z
        const isoMatch = line.match(/(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z)/);
        if (isoMatch)
            return isoMatch[1];
        // Pattern [2024-01-15 10:30:45]
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
        // Search for TypeScript/JavaScript files (excluding tests)
        const files = await (0, glob_1.glob)('**/*.{ts,tsx,js,jsx}', {
            cwd: dir,
            ignore: [
                'node_modules/**',
                'dist/**',
                '.next/**',
                '**/*.test.{ts,tsx,js,jsx}',
                '**/*.spec.{ts,tsx,js,jsx}',
                '**/tests/**',
                '**/__tests__/**'
            ]
        });
        for (const file of files) {
            const filePath = path.join(dir, file);
            const content = fs.readFileSync(filePath, 'utf8');
            // Only check if file has top-level async without proper error handling
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
        // Only flag top-level async functions that are exported or called immediately
        // Ignore async functions inside try/catch or with .catch() handlers
        const lines = content.split('\n');
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            // Skip if line is in a try block or has .catch()
            if (this.isInTryBlock(lines, i) || line.includes('.catch(')) {
                continue;
            }
            // Check for top-level async IIFE or immediate invocations
            if (/^\s*\(async\s*\(/.test(line) || /^\s*async\s+function\s+\w+\s*\(\).*\{/.test(line)) {
                // Look ahead to see if there's error handling
                const nextLines = lines.slice(i, Math.min(i + 10, lines.length)).join('\n');
                if (!nextLines.includes('try') && !nextLines.includes('.catch(')) {
                    // This is actually potentially dangerous - but let's be lenient
                    // Only flag if it's a main entry point
                    if (filePath.includes('index.ts') || filePath.includes('main.ts')) {
                        errors.push({
                            timestamp: new Date().toISOString(),
                            file: filePath,
                            line: i + 1,
                            errorType: 'unhandled-promise',
                            message: 'Top-level async without error handling',
                            rootCause: 'Top-level async execution without try/catch or .catch()',
                            suggestedFix: `Wrap in try/catch or add .catch():
   (async () => {
     try {
       await yourAsyncOperation();
     } catch (err) {
       logger.error('Error:', err);
       process.exit(1);
     }
   })();`,
                            severity: 'medium'
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
        // Scan backwards to see if we're in a try block
        for (let i = lineIndex; i >= 0; i--) {
            const line = lines[i];
            if (line.includes('}')) {
                openBraces++;
            }
            if (line.includes('{')) {
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
        // This method is now deprecated - we use findCriticalAsyncIssues instead
        return false;
    }
    /**
     * Get root cause based on error type
     */
    getRootCause(errorType, message) {
        const causes = {
            'unhandled-promise': 'Promise rejected without catch handler - async operation failed without error handling',
            'uncaught-exception': 'Exception occurred without catch - programming error not handled in try/catch',
            'crash': 'Application stopped abruptly - fatal error (FATAL ERROR)',
            'assertion-failure': 'Assertion failed - expected value not met at runtime',
            'memory-error': 'Out of memory - application consuming more memory than available',
            'memory-leak': 'Memory leak detected - resources not properly cleaned up',
            'event-listener-leak': 'Event listener not removed - causing memory leak',
            'interval-leak': 'setInterval without clearInterval - timer keeps running',
            'timeout-leak': 'setTimeout without clearTimeout - delayed callback on unmounted component',
            'race-condition': 'Race condition - async operations not synchronized',
            'resource-not-cleaned': 'Resource (file/stream) not properly closed',
            'websocket-leak': 'WebSocket connection not closed',
            'db-connection-leak': 'Database connection not released back to pool'
        };
        return causes[errorType] || message;
    }
    /**
     * Suggest fix based on error type
     */
    getSuggestedFix(errorType, file) {
        const fixes = {
            'unhandled-promise': `Add .catch() handler or use try/catch:
   await somePromise().catch(err => logger.error(err));
   Or check file: ${file}`,
            'uncaught-exception': `Add try/catch block around the code:
   try {
     // your code
   } catch (err) {
     logger.error('Error:', err);
   }`,
            'crash': `Check logs in detail to determine cause - could be:
   - type error
   - null/undefined access
   - infinite recursion`,
            'assertion-failure': `Check assertions in code - unexpected value:
   Check file: ${file}`,
            'memory-error': `Reduce memory consumption:
   - Check for memory leaks (closures, event listeners)
   - Increase heap size: node --max-old-space-size=4096
   - Use streaming instead of loading all data`,
            'memory-leak': `Review resource cleanup in ${file} - add proper cleanup in useEffect return or componentWillUnmount`,
            'event-listener-leak': `Add removeEventListener in cleanup function`,
            'interval-leak': `Store interval ID and call clearInterval in cleanup`,
            'timeout-leak': `Store timeout ID and call clearTimeout in cleanup`,
            'race-condition': `Use AbortController or isMounted flag to prevent state updates after unmount`,
            'resource-not-cleaned': `Close file streams/handles in finally block or use pipeline`,
            'websocket-leak': `Call ws.close() in useEffect cleanup function`,
            'db-connection-leak': `Release connection in finally block: connection.release()`
        };
        return fixes[errorType] || 'Check code and logs';
    }
    /**
     * Format error for display
     */
    formatError(error) {
        const relPath = path.relative(this.workspaceRoot, error.file);
        let emoji = '⚠️';
        if (error.severity === 'critical')
            emoji = '💥';
        else if (error.severity === 'high')
            emoji = '🔥';
        else if (error.severity === 'low')
            emoji = 'ℹ️';
        // Build confidence display with color-coded indicator
        let confidenceStr = '';
        if (error.confidence !== undefined) {
            let confidenceIndicator = '🔴'; // Low (<50%)
            if (error.confidence >= 80)
                confidenceIndicator = '🟢'; // High (≥80%)
            else if (error.confidence >= 50)
                confidenceIndicator = '🟡'; // Medium (50-79%)
            confidenceStr = `[Confidence: ${error.confidence}%] ${confidenceIndicator}`;
        }
        return `
${emoji} RUNTIME ERROR [${error.errorType}] [${error.severity.toUpperCase()}] ${confidenceStr}
⏰ Time: ${error.timestamp}
📁 File: ${relPath}
${error.line ? `📍 Line: ${error.line}` : ''}
💬 Message: ${error.message}

🔍 Root Cause:
   ${error.rootCause}

✅ Suggested Fix:
   ${error.suggestedFix}
${error.stack ? `\n📋 Stack Trace:\n${error.stack}` : ''}
${'─'.repeat(60)}
`;
    }
}
exports.RuntimeDetector = RuntimeDetector;
//# sourceMappingURL=runtime-detector.js.map