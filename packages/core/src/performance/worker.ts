/**
 * Worker Thread Script
 * 
 * Executes tasks in a separate thread for true parallelism.
 * Handles file analysis, detection, and processing.
 * 
 * @since Phase 1 Week 19 (December 2025)
 */

import { parentPort, workerData } from 'node:worker_threads';
import * as fs from 'node:fs/promises';

interface WorkerMessage {
  type: 'task' | 'shutdown';
  task?: any;
  timeout?: number;
}

interface TaskResult {
  taskId: string;
  success: boolean;
  data?: any;
  error?: string;
  duration: number;
  workerId: number;
}

const workerId = workerData.workerId;

// Task handlers registry
const taskHandlers: Record<string, (data: any) => Promise<any>> = {
  'analyze-file': analyzeFile,
  'read-file': readFile,
  'parse-ast': parseAST,
  'run-detector': runDetector,
};

/**
 * Main message handler
 */
if (parentPort) {
  parentPort.on('message', async (message: WorkerMessage) => {
    if (message.type === 'task') {
      await handleTask(message.task, message.timeout || 30000);
    } else if (message.type === 'shutdown') {
      process.exit(0);
    }
  });

  // Send periodic stats
  setInterval(() => {
    sendStats();
  }, 5000);

  log('Worker started');
}

/**
 * Handle incoming task
 */
async function handleTask(task: any, timeout: number): Promise<void> {
  const startTime = Date.now();
  
  log(`Processing task ${task.id} (${task.type})`);

  try {
    // Find handler
    const handler = taskHandlers[task.type];
    
    if (!handler) {
      throw new Error(`Unknown task type: ${task.type}`);
    }

    // Execute with timeout
    const result = await Promise.race([
      handler(task.data),
      createTimeout(timeout),
    ]);

    const duration = Date.now() - startTime;

    // Send success result
    sendResult({
      taskId: task.id,
      success: true,
      data: result,
      duration,
      workerId,
    });

    log(`Task ${task.id} completed in ${duration}ms`);
  } catch (error: any) {
    const duration = Date.now() - startTime;

    // Send error result
    sendResult({
      taskId: task.id,
      success: false,
      error: error.message || String(error),
      duration,
      workerId,
    });

    log(`Task ${task.id} failed: ${error.message}`);
  }
}

/**
 * Task Handler: Analyze File
 */
async function analyzeFile(data: { filePath: string; detectors: string[] }): Promise<any> {
  const { filePath, detectors } = data;

  // Read file
  const content = await fs.readFile(filePath, 'utf-8');
  const lines = content.split('\n');

  // Basic analysis
  const analysis = {
    filePath,
    lines: lines.length,
    size: content.length,
    issues: [] as any[],
  };

  // Run detectors (simplified for now)
  for (const detector of detectors) {
    const issues = await runDetectorInternal(detector, content, filePath);
    analysis.issues.push(...issues);
  }

  return analysis;
}

/**
 * Task Handler: Read File
 */
async function readFile(data: { filePath: string }): Promise<any> {
  const content = await fs.readFile(data.filePath, 'utf-8');
  return {
    content,
    size: content.length,
    lines: content.split('\n').length,
  };
}

/**
 * Task Handler: Parse AST
 */
async function parseAST(data: { content: string; language: string }): Promise<any> {
  // Placeholder for AST parsing
  // In production, use @typescript-eslint/parser or similar
  return {
    type: 'Program',
    body: [],
    parsed: true,
  };
}

/**
 * Task Handler: Run Detector
 */
async function runDetector(data: { detector: string; content: string; filePath: string }): Promise<any> {
  const issues = await runDetectorInternal(data.detector, data.content, data.filePath);
  return { issues };
}

/**
 * Internal detector runner
 */
async function runDetectorInternal(detector: string, content: string, filePath: string): Promise<any[]> {
  const issues: any[] = [];

  // Simple pattern-based detection (placeholder)
  switch (detector) {
    case 'console-log':
      const consoleRegex = /console\.(log|error|warn)/g;
      let match;
      while ((match = consoleRegex.exec(content)) !== null) {
        const line = content.substring(0, match.index).split('\n').length;
        issues.push({
          type: 'console-usage',
          severity: 'warning',
          message: `console.${match[1]} usage detected`,
          file: filePath,
          line,
        });
      }
      break;

    case 'unused-import':
      // Placeholder - would use real AST analysis
      break;

    case 'complexity':
      // Placeholder - would calculate cyclomatic complexity
      break;
  }

  return issues;
}

/**
 * Create timeout promise
 */
function createTimeout(ms: number): Promise<never> {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Task timeout')), ms);
  });
}

/**
 * Send result to parent
 */
function sendResult(result: TaskResult): void {
  if (parentPort) {
    parentPort.postMessage({
      type: 'result',
      result,
    });
  }
}

/**
 * Send worker stats
 */
function sendStats(): void {
  if (parentPort) {
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();

    parentPort.postMessage({
      type: 'stats',
      memoryUsage: memUsage.heapUsed,
      cpuUsage: (cpuUsage.user + cpuUsage.system) / 1000000, // Convert to seconds
    });
  }
}

/**
 * Log message to parent
 */
function log(message: string): void {
  if (parentPort) {
    parentPort.postMessage({
      type: 'log',
      message,
    });
  }
}
