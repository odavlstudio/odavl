/**
 * Phase 2.2 Task 7: Offline Queue for Failed Uploads
 * 
 * Persists failed uploads to disk for retry later.
 * Uses append-only JSONL format for durability and crash safety.
 * 
 * Storage: .odavl/offline-queue.jsonl
 * Max attempts per entry: 3
 * File format: One JSON object per line
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import type { AnalysisUploadPayload } from './cloud-contract.js';

/**
 * Offline queue entry
 */
export interface OfflineQueueEntry {
  id: string;
  timestamp: string;
  payload: AnalysisUploadPayload;
  attempts: number;
  lastError?: string;
  status: 'pending' | 'failed';
}

/**
 * Queue storage path
 */
const QUEUE_FILE = '.odavl/offline-queue.jsonl';
const MAX_ATTEMPTS = 3;

/**
 * Offline Queue Manager
 * 
 * Handles persistence and retrieval of failed uploads.
 * Uses JSONL format for atomic append operations.
 */
export class OfflineQueue {
  private workspaceRoot: string;
  private queuePath: string;

  constructor(workspaceRoot: string) {
    this.workspaceRoot = workspaceRoot;
    this.queuePath = path.join(workspaceRoot, QUEUE_FILE);
  }

  /**
   * Enqueue a failed upload
   * 
   * @param payload Upload payload (already sanitized)
   * @param errorMessage Error message from upload failure
   * @returns Entry ID
   */
  async enqueue(payload: AnalysisUploadPayload, errorMessage: string): Promise<string> {
    const entry: OfflineQueueEntry = {
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      payload,
      attempts: 0,
      lastError: errorMessage,
      status: 'pending',
    };

    await this.ensureQueueDirectory();
    await this.appendEntry(entry);

    return entry.id;
  }

  /**
   * Read all queued entries
   * 
   * Safely handles corrupted lines by skipping them.
   * 
   * @returns Array of valid entries
   */
  async readAll(): Promise<OfflineQueueEntry[]> {
    try {
      const content = await fs.readFile(this.queuePath, 'utf-8');
      const lines = content.split('\n').filter((line) => line.trim().length > 0);
      
      const entries: OfflineQueueEntry[] = [];
      
      for (const line of lines) {
        try {
          const entry = JSON.parse(line) as OfflineQueueEntry;
          
          // Validate entry structure
          if (this.isValidEntry(entry)) {
            entries.push(entry);
          }
        } catch {
          // Skip malformed lines (corruption or partial writes)
          continue;
        }
      }
      
      return entries;
    } catch (error: any) {
      // Queue file doesn't exist or can't be read
      if (error.code === 'ENOENT') {
        return [];
      }
      throw error;
    }
  }

  /**
   * Remove entry from queue
   * 
   * @param id Entry ID to remove
   */
  async remove(id: string): Promise<void> {
    const entries = await this.readAll();
    const filtered = entries.filter((entry) => entry.id !== id);
    await this.writeAll(filtered);
  }

  /**
   * Update entry in queue
   * 
   * @param updatedEntry Updated entry
   */
  async update(updatedEntry: OfflineQueueEntry): Promise<void> {
    const entries = await this.readAll();
    const index = entries.findIndex((entry) => entry.id === updatedEntry.id);
    
    if (index === -1) {
      throw new Error(`Entry ${updatedEntry.id} not found in queue`);
    }
    
    entries[index] = updatedEntry;
    await this.writeAll(entries);
  }

  /**
   * Clear all entries from queue
   */
  async clear(): Promise<void> {
    try {
      await fs.unlink(this.queuePath);
    } catch (error: any) {
      // Ignore if file doesn't exist
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }
  }

  /**
   * Get count of pending entries
   */
  async count(): Promise<number> {
    const entries = await this.readAll();
    return entries.filter((entry) => entry.status === 'pending').length;
  }

  /**
   * Check if entry has exceeded max attempts
   */
  hasExceededMaxAttempts(entry: OfflineQueueEntry): boolean {
    return entry.attempts >= MAX_ATTEMPTS;
  }

  /**
   * Increment attempt count for entry
   */
  async incrementAttempts(id: string, errorMessage: string): Promise<void> {
    const entries = await this.readAll();
    const entry = entries.find((e) => e.id === id);
    
    if (!entry) {
      throw new Error(`Entry ${id} not found in queue`);
    }
    
    entry.attempts += 1;
    entry.lastError = errorMessage;
    
    // Mark as failed if max attempts exceeded
    if (entry.attempts >= MAX_ATTEMPTS) {
      entry.status = 'failed';
    }
    
    await this.update(entry);
  }

  /**
   * Get queue file path
   */
  getQueuePath(): string {
    return this.queuePath;
  }

  /**
   * Ensure queue directory exists
   */
  private async ensureQueueDirectory(): Promise<void> {
    const queueDir = path.dirname(this.queuePath);
    
    try {
      await fs.mkdir(queueDir, { recursive: true });
    } catch (error: any) {
      // Ignore if directory already exists
      if (error.code !== 'EEXIST') {
        throw error;
      }
    }
  }

  /**
   * Append entry to queue file
   * 
   * Uses fs.appendFile for atomic append (crash-safe)
   */
  private async appendEntry(entry: OfflineQueueEntry): Promise<void> {
    const line = JSON.stringify(entry) + '\n';
    await fs.appendFile(this.queuePath, line, 'utf-8');
  }

  /**
   * Write all entries to queue file
   * 
   * Replaces entire file with new entries.
   * Used for remove/update operations.
   */
  private async writeAll(entries: OfflineQueueEntry[]): Promise<void> {
    if (entries.length === 0) {
      // Remove empty queue file
      await this.clear();
      return;
    }
    
    const content = entries.map((entry) => JSON.stringify(entry)).join('\n') + '\n';
    await fs.writeFile(this.queuePath, content, 'utf-8');
  }

  /**
   * Validate entry structure
   */
  private isValidEntry(entry: any): entry is OfflineQueueEntry {
    return (
      typeof entry === 'object' &&
      entry !== null &&
      typeof entry.id === 'string' &&
      typeof entry.timestamp === 'string' &&
      typeof entry.payload === 'object' &&
      typeof entry.attempts === 'number' &&
      (entry.status === 'pending' || entry.status === 'failed')
    );
  }

  /**
   * Generate unique ID for queue entry
   */
  private generateId(): string {
    return 'queue-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9);
  }
}

/**
 * Get singleton offline queue instance
 */
let queueInstance: OfflineQueue | null = null;

export function getOfflineQueue(workspaceRoot: string): OfflineQueue {
  if (!queueInstance || queueInstance['workspaceRoot'] !== workspaceRoot) {
    queueInstance = new OfflineQueue(workspaceRoot);
  }
  return queueInstance;
}
