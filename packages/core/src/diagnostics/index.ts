/**
 * ODAVL Diagnostic System
 * Comprehensive error tracking, crash dumps, and performance monitoring
 * 
 * @module diagnostics
 * @category Core
 */

import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { performance } from 'node:perf_hooks';

// ========================================
// Types
// ========================================

export interface DiagnosticDump {
  /** Unique identifier for this diagnostic dump */
  id: string;
  
  /** Timestamp when error occurred */
  timestamp: string;
  
  /** Error object */
  error: {
    name: string;
    message: string;
    stack?: string;
    code?: string;
  };
  
  /** Environment information */
  environment: {
    nodeVersion: string;
    platform: string;
    arch: string;
    cwd: string;
    argv: string[];
    env: Record<string, string | undefined>;
  };
  
  /** Memory usage at time of error */
  memory: NodeJS.MemoryUsage;
  
  /** Recent log entries (last 100 lines) */
  recentLogs: string[];
  
  /** Additional context */
  context?: Record<string, any>;
  
  /** Call stack at time of capture */
  callStack?: string;
  
  /** Related files (if any) */
  relatedFiles?: string[];
}

export interface PerformanceLog {
  /** Unique identifier */
  id: string;
  
  /** Timestamp */
  timestamp: string;
  
  /** Operation name */
  operation: string;
  
  /** Duration in milliseconds */
  duration: number;
  
  /** Memory before operation */
  memoryBefore: NodeJS.MemoryUsage;
  
  /** Memory after operation */
  memoryAfter: NodeJS.MemoryUsage;
  
  /** Additional metadata */
  metadata?: Record<string, any>;
}

export interface ErrorTrace {
  /** Unique identifier */
  id: string;
  
  /** Timestamp */
  timestamp: string;
  
  /** Error details */
  error: {
    type: string;
    message: string;
    stack: string;
    phase?: string; // ODAVL phase (observe, decide, act, verify, learn)
  };
  
  /** Execution context */
  context: {
    file?: string;
    function?: string;
    line?: number;
    column?: number;
  };
  
  /** ODAVL-specific context */
  odavl?: {
    runId?: string;
    recipeId?: string;
    trustScore?: number;
    filesModified?: string[];
  };
}

// ========================================
// Configuration
// ========================================

const DIAGNOSTICS_DIR = '.odavl/diagnostics';
const MAX_LOG_LINES = 100;
const MAX_DUMPS_TO_KEEP = 50;

// Recent logs buffer
const recentLogs: string[] = [];

// ========================================
// Core Functions
// ========================================

/**
 * Initialize diagnostic system
 * Call this at application startup
 */
export async function initializeDiagnostics(): Promise<void> {
  // Create directories if they don't exist
  await fs.mkdir(path.join(DIAGNOSTICS_DIR, 'crash-dumps'), { recursive: true });
  await fs.mkdir(path.join(DIAGNOSTICS_DIR, 'heap-snapshots'), { recursive: true });
  await fs.mkdir(path.join(DIAGNOSTICS_DIR, 'error-traces'), { recursive: true });
  await fs.mkdir(path.join(DIAGNOSTICS_DIR, 'performance-logs'), { recursive: true });
  
  // Register global error handlers
  registerGlobalHandlers();
  
  // Cleanup old dumps
  await cleanupOldDumps();
}

/**
 * Register global error handlers
 */
function registerGlobalHandlers(): void {
  // Unhandled Promise Rejection
  process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
    const error = reason instanceof Error ? reason : new Error(String(reason));
    saveDiagnosticDump(error, {
      type: 'unhandledRejection',
      promise: String(promise),
    }).catch(console.error);
  });
  
  // Uncaught Exception
  process.on('uncaughtException', (error: Error) => {
    saveDiagnosticDump(error, {
      type: 'uncaughtException',
      critical: true,
    }).catch(console.error);
    
    // Give time to write dump before exit
    setTimeout(() => {
      process.exit(1);
    }, 1000);
  });
  
  // Warning
  process.on('warning', (warning: Error) => {
    log(`[WARNING] ${warning.name}: ${warning.message}`);
  });
}

/**
 * Save diagnostic dump to disk
 */
export async function saveDiagnosticDump(
  error: Error,
  context?: Record<string, any>
): Promise<string> {
  const id = generateId('crash');
  const timestamp = new Date().toISOString();
  
  const dump: DiagnosticDump = {
    id,
    timestamp,
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack,
      code: (error as any).code,
    },
    environment: {
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      cwd: process.cwd(),
      argv: process.argv,
      env: sanitizeEnvironment(process.env),
    },
    memory: process.memoryUsage(),
    recentLogs: [...recentLogs],
    context,
    callStack: new Error().stack,
  };
  
  const dumpPath = path.join(DIAGNOSTICS_DIR, 'crash-dumps', `${id}.json`);
  await fs.writeFile(dumpPath, JSON.stringify(dump, null, 2), 'utf-8');
  
  log(`[DIAGNOSTIC] Crash dump saved: ${dumpPath}`);
  
  return dumpPath;
}

/**
 * Save error trace
 */
export async function saveErrorTrace(
  error: Error,
  context: Partial<ErrorTrace['context']> = {},
  odavlContext?: ErrorTrace['odavl']
): Promise<string> {
  const id = generateId('trace');
  const timestamp = new Date().toISOString();
  
  const trace: ErrorTrace = {
    id,
    timestamp,
    error: {
      type: error.name,
      message: error.message,
      stack: error.stack || '',
    },
    context,
    odavl: odavlContext,
  };
  
  const tracePath = path.join(DIAGNOSTICS_DIR, 'error-traces', `${id}.json`);
  await fs.writeFile(tracePath, JSON.stringify(trace, null, 2), 'utf-8');
  
  log(`[DIAGNOSTIC] Error trace saved: ${tracePath}`);
  
  return tracePath;
}

/**
 * Start performance tracking for an operation
 */
export function startPerformanceTracking(operation: string): () => Promise<void> {
  const startTime = performance.now();
  const memoryBefore = process.memoryUsage();
  const id = generateId('perf');
  
  return async () => {
    const duration = performance.now() - startTime;
    const memoryAfter = process.memoryUsage();
    
    const perfLog: PerformanceLog = {
      id,
      timestamp: new Date().toISOString(),
      operation,
      duration,
      memoryBefore,
      memoryAfter,
    };
    
    const logPath = path.join(DIAGNOSTICS_DIR, 'performance-logs', `${id}.json`);
    await fs.writeFile(logPath, JSON.stringify(perfLog, null, 2), 'utf-8');
    
    log(`[PERF] ${operation}: ${duration.toFixed(2)}ms`);
  };
}

/**
 * Log message (adds to recent logs buffer)
 */
export function log(message: string): void {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] ${message}`;
  
  recentLogs.push(logEntry);
  
  // Keep only last MAX_LOG_LINES
  if (recentLogs.length > MAX_LOG_LINES) {
    recentLogs.shift();
  }
  
  // Also write to console in development
  if (process.env.NODE_ENV !== 'production') {
    console.log(logEntry);
  }
}

/**
 * Take heap snapshot (requires v8 module)
 */
export async function takeHeapSnapshot(): Promise<string> {
  try {
    const v8 = await import('node:v8');
    const id = generateId('heap');
    const snapshotPath = path.join(DIAGNOSTICS_DIR, 'heap-snapshots', `${id}.heapsnapshot`);
    
    const stream = v8.writeHeapSnapshot(snapshotPath);
    log(`[DIAGNOSTIC] Heap snapshot saved: ${snapshotPath}`);
    
    return stream;
  } catch (error) {
    log(`[ERROR] Failed to take heap snapshot: ${error}`);
    throw error;
  }
}

/**
 * Get diagnostics summary
 */
export async function getDiagnosticsSummary(): Promise<{
  crashDumps: number;
  errorTraces: number;
  performanceLogs: number;
  heapSnapshots: number;
  totalSize: number;
}> {
  const [crashes, traces, perfs, heaps] = await Promise.all([
    fs.readdir(path.join(DIAGNOSTICS_DIR, 'crash-dumps')).catch(() => []),
    fs.readdir(path.join(DIAGNOSTICS_DIR, 'error-traces')).catch(() => []),
    fs.readdir(path.join(DIAGNOSTICS_DIR, 'performance-logs')).catch(() => []),
    fs.readdir(path.join(DIAGNOSTICS_DIR, 'heap-snapshots')).catch(() => []),
  ]);
  
  // Calculate total size
  let totalSize = 0;
  for (const dir of ['crash-dumps', 'error-traces', 'performance-logs', 'heap-snapshots']) {
    const files = await fs.readdir(path.join(DIAGNOSTICS_DIR, dir)).catch(() => []);
    for (const file of files) {
      const stat = await fs.stat(path.join(DIAGNOSTICS_DIR, dir, file)).catch(() => null);
      if (stat) totalSize += stat.size;
    }
  }
  
  return {
    crashDumps: crashes.length,
    errorTraces: traces.length,
    performanceLogs: perfs.length,
    heapSnapshots: heaps.length,
    totalSize,
  };
}

// ========================================
// Helper Functions
// ========================================

/**
 * Generate unique ID
 */
function generateId(prefix: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 9);
  return `${prefix}-${timestamp}-${random}`;
}

/**
 * Sanitize environment variables (remove sensitive data)
 */
function sanitizeEnvironment(env: NodeJS.ProcessEnv): Record<string, string | undefined> {
  const sanitized: Record<string, string | undefined> = {};
  const sensitiveKeys = ['API_KEY', 'SECRET', 'TOKEN', 'PASSWORD', 'PRIVATE_KEY'];
  
  for (const [key, value] of Object.entries(env)) {
    const isSensitive = sensitiveKeys.some((k) => key.toUpperCase().includes(k));
    sanitized[key] = isSensitive ? '***REDACTED***' : value;
  }
  
  return sanitized;
}

/**
 * Cleanup old dumps (keep last MAX_DUMPS_TO_KEEP)
 */
async function cleanupOldDumps(): Promise<void> {
  const dirs = ['crash-dumps', 'error-traces', 'performance-logs'];
  
  for (const dir of dirs) {
    try {
      const dirPath = path.join(DIAGNOSTICS_DIR, dir);
      const files = await fs.readdir(dirPath);
      
      if (files.length > MAX_DUMPS_TO_KEEP) {
        // Sort by creation time
        const filesWithStats = await Promise.all(
          files.map(async (file) => {
            const filePath = path.join(dirPath, file);
            const stat = await fs.stat(filePath);
            return { file, mtime: stat.mtime };
          })
        );
        
        filesWithStats.sort((a, b) => a.mtime.getTime() - b.mtime.getTime());
        
        // Delete oldest files
        const toDelete = filesWithStats.slice(0, files.length - MAX_DUMPS_TO_KEEP);
        await Promise.all(
          toDelete.map(({ file }) => fs.unlink(path.join(dirPath, file)))
        );
        
        log(`[DIAGNOSTIC] Cleaned up ${toDelete.length} old dumps from ${dir}`);
      }
    } catch (error) {
      // Ignore cleanup errors
    }
  }
}

// ========================================
// Exports
// ========================================

export default {
  initializeDiagnostics,
  saveDiagnosticDump,
  saveErrorTrace,
  startPerformanceTracking,
  takeHeapSnapshot,
  getDiagnosticsSummary,
  log,
};
