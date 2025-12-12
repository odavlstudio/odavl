/**
 * ODAVL Insight - Worker Protocol Types
 * Wave 8 Phase 2 - Process Isolation Infrastructure
 * 
 * Defines the message contract between Brain (parent) and detector workers.
 * Used for JSONL-style streaming communication.
 * 
 * @since Wave 8 Phase 2 (December 2025)
 */

/**
 * Message from parent process to worker: Execute a detector
 */
export interface ExecuteDetectorMessage {
  type: 'execute';
  detector: string;      // Detector name (e.g., 'typescript', 'eslint', 'security')
  workspace: string;     // Absolute path to project root
  options?: Record<string, unknown>; // Optional detector-specific configuration
}

/**
 * Progress update from worker to parent
 */
export interface ProgressMessage {
  type: 'progress';
  detector: string;
  processed: number;     // Number of files/items processed so far
  total: number;         // Total number of files/items to process
}

/**
 * Individual issue detected, streamed from worker to parent
 */
export interface IssueMessage<Issue = any> {
  type: 'issue';
  detector: string;
  issue: Issue;          // Detector-specific issue format (TSError, ESLintError, etc.)
}

/**
 * Completion message from worker to parent
 */
export interface CompleteMessage {
  type: 'complete';
  detector: string;
  issuesCount: number;   // Total number of issues found
  durationMs: number;    // Time taken to execute detector
}

/**
 * Error message from worker to parent
 */
export interface ErrorMessage {
  type: 'error';
  detector: string;
  code: string;          // Error code: 'TIMEOUT', 'WORKER_CRASH', 'TOOL_ERROR', etc.
  message: string;       // Human-readable error message
  details?: unknown;     // Optional additional error context
}

/**
 * Union type for all messages sent FROM parent TO worker
 */
export type DetectorWorkerIncomingMessage = ExecuteDetectorMessage;

/**
 * Union type for all messages sent FROM worker TO parent
 */
export type DetectorWorkerOutgoingMessage =
  | ProgressMessage
  | IssueMessage
  | CompleteMessage
  | ErrorMessage;

/**
 * Type guard: Check if message is a progress update
 */
export function isProgressMessage(msg: DetectorWorkerOutgoingMessage): msg is ProgressMessage {
  return msg.type === 'progress';
}

/**
 * Type guard: Check if message is an issue
 */
export function isIssueMessage(msg: DetectorWorkerOutgoingMessage): msg is IssueMessage {
  return msg.type === 'issue';
}

/**
 * Type guard: Check if message is completion
 */
export function isCompleteMessage(msg: DetectorWorkerOutgoingMessage): msg is CompleteMessage {
  return msg.type === 'complete';
}

/**
 * Type guard: Check if message is an error
 */
export function isErrorMessage(msg: DetectorWorkerOutgoingMessage): msg is ErrorMessage {
  return msg.type === 'error';
}
