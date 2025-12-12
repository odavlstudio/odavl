/**
 * ODAVL Insight - Detector Worker Entry Point
 * Wave 8 Phase 2 - Process Isolation Infrastructure
 * 
 * Worker process that executes detectors in isolation.
 * Receives ExecuteDetectorMessage from parent, runs detector, streams results back.
 * 
 * Communication Protocol:
 * - Receives: ExecuteDetectorMessage via parentPort
 * - Sends: ProgressMessage, IssueMessage, CompleteMessage, ErrorMessage
 * 
 * @since Wave 8 Phase 2 (December 2025)
 */

import { parentPort, workerData } from 'node:worker_threads';
import type {
  ExecuteDetectorMessage,
  ProgressMessage,
  IssueMessage,
  CompleteMessage,
  ErrorMessage,
} from './worker-protocol.js';
import { loadDetector } from '../detector/detector-loader.js';

// Worker ID for logging
const workerId = workerData?.workerId ?? 0;

/**
 * Log message with worker ID prefix
 */
function log(message: string): void {
  if (process.env.ODAVL_WORKER_VERBOSE === 'true') {
    console.log(`[Worker ${workerId}] ${message}`);
  }
}

/**
 * Send message to parent process
 */
function sendMessage(
  message: ProgressMessage | IssueMessage | CompleteMessage | ErrorMessage
): void {
  if (!parentPort) {
    throw new Error('Worker not running in worker_threads context');
  }
  parentPort.postMessage(message);
}

/**
 * Execute a detector and stream results
 */
async function executeDetector(msg: ExecuteDetectorMessage): Promise<void> {
  const { detector, workspace, options } = msg;
  const startTime = Date.now();
  
  log(`Executing detector: ${detector} in ${workspace}`);

  try {
    // TODO(Wave9/WorkerBundling): Revisit detector bundling strategy to allow
    // more flexible plugin-style detectors without requiring static imports.
    
    // Load detector class (static import ensures tsup bundles loadDetector)
    const DetectorClass = await loadDetector(detector as any);
    
    if (!DetectorClass) {
      sendMessage({
        type: 'error',
        detector,
        code: 'DETECTOR_NOT_FOUND',
        message: `Detector "${detector}" not found or failed to load`,
        details: { detector, workspace },
      });
      return;
    }

    // Instantiate detector
    const detectorInstance = new DetectorClass(workspace);
    
    // Check if detector has detect() method
    if (typeof detectorInstance.detect !== 'function') {
      sendMessage({
        type: 'error',
        detector,
        code: 'INVALID_DETECTOR',
        message: `Detector "${detector}" does not implement detect() method`,
        details: { detector, workspace },
      });
      return;
    }

    log(`Running ${detector}.detect()...`);

    // Execute detector
    const issues = await detectorInstance.detect(options);
    
    if (!Array.isArray(issues)) {
      sendMessage({
        type: 'error',
        detector,
        code: 'INVALID_DETECTOR_RESULT',
        message: `Detector "${detector}" did not return an array`,
        details: { detector, workspace, resultType: typeof issues },
      });
      return;
    }

    log(`${detector} found ${issues.length} issues`);

    // Stream issues one by one
    const total = issues.length;
    for (let i = 0; i < total; i++) {
      // Send progress update every 10 issues or at the end
      if (i % 10 === 0 || i === total - 1) {
        sendMessage({
          type: 'progress',
          detector,
          processed: i + 1,
          total,
        });
      }

      // Send individual issue
      sendMessage({
        type: 'issue',
        detector,
        issue: issues[i],
      });
    }

    // Send completion message
    const durationMs = Date.now() - startTime;
    sendMessage({
      type: 'complete',
      detector,
      issuesCount: issues.length,
      durationMs,
    });

    log(`${detector} completed in ${durationMs}ms`);

  } catch (error: unknown) {
    const durationMs = Date.now() - startTime;
    
    // Handle different error types
    let code = 'DETECTOR_ERROR';
    let message = `Detector "${detector}" threw an error`;
    let details: unknown = { error };

    if (error instanceof Error) {
      message = error.message;
      details = {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };

      // Check for timeout errors (from Phase 1 timeout protection)
      if (error.message.includes('timeout') || error.message.includes('TIMEOUT')) {
        code = 'TIMEOUT';
      }
      // Check for EISDIR errors (directory read errors)
      else if (error.message.includes('EISDIR') || error.message.includes('illegal operation on a directory')) {
        code = 'EISDIR';
      }
      // Check for memory errors
      else if (error.message.includes('out of memory') || error.message.includes('heap')) {
        code = 'OOM';
      }
    }

    sendMessage({
      type: 'error',
      detector,
      code,
      message,
      details,
    });

    log(`${detector} failed after ${durationMs}ms: ${message}`);
  }
}

/**
 * Handle shutdown signal
 */
function handleShutdown(): void {
  log('Received shutdown signal');
  process.exit(0);
}

/**
 * Main worker entry point
 */
if (parentPort) {
  log('Worker started');

  // Listen for messages from parent
  parentPort.on('message', async (message: ExecuteDetectorMessage | { type: 'shutdown' }) => {
    if (message.type === 'shutdown') {
      handleShutdown();
      return;
    }

    if (message.type === 'execute') {
      await executeDetector(message);
    } else {
      log(`Unknown message type: ${(message as any).type}`);
    }
  });

  // Handle uncaught errors
  process.on('uncaughtException', (error: Error) => {
    console.error(`[Worker ${workerId}] Uncaught exception:`, error);
    process.exit(1);
  });

  process.on('unhandledRejection', (reason: unknown) => {
    console.error(`[Worker ${workerId}] Unhandled rejection:`, reason);
    process.exit(1);
  });

} else {
  console.error('This script must be run as a worker thread');
  process.exit(1);
}
