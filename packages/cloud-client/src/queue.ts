/**
 * Offline Queue - Queue API calls when offline, sync when online
 * 
 * Stores failed API calls to ~/.odavl/queue.json
 * Retries when connection is restored
 */

import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as os from 'node:os';
import { nanoid } from 'nanoid';

export interface QueuedRequest {
  id: string;
  url: string;
  method: string;
  data?: any;
  headers?: Record<string, string>;
  timestamp: number;
  retries: number;
  maxRetries: number;
}

export class OfflineQueue {
  private queuePath: string;
  private queue: QueuedRequest[] = [];
  private isProcessing = false;

  constructor() {
    const homeDir = os.homedir();
    const odavlDir = path.join(homeDir, '.odavl');
    this.queuePath = path.join(odavlDir, 'queue.json');
    this.loadQueue();
  }

  /**
   * Load queue from disk
   */
  private async loadQueue(): Promise<void> {
    try {
      const data = await fs.readFile(this.queuePath, 'utf8');
      this.queue = JSON.parse(data);
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        this.queue = [];
      } else {
        console.error('Failed to load offline queue:', error);
        this.queue = [];
      }
    }
  }

  /**
   * Save queue to disk
   */
  private async saveQueue(): Promise<void> {
    try {
      const dir = path.dirname(this.queuePath);
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(this.queuePath, JSON.stringify(this.queue, null, 2), 'utf8');
    } catch (error) {
      console.error('Failed to save offline queue:', error);
    }
  }

  /**
   * Add request to queue
   */
  async enqueue(
    url: string,
    method: string,
    data?: any,
    headers?: Record<string, string>,
    maxRetries: number = 3
  ): Promise<string> {
    const request: QueuedRequest = {
      id: nanoid(),
      url,
      method,
      data,
      headers,
      timestamp: Date.now(),
      retries: 0,
      maxRetries,
    };

    this.queue.push(request);
    await this.saveQueue();

    return request.id;
  }

  /**
   * Remove request from queue
   */
  async dequeue(id: string): Promise<void> {
    this.queue = this.queue.filter((req) => req.id !== id);
    await this.saveQueue();
  }

  /**
   * Get all queued requests
   */
  getAll(): QueuedRequest[] {
    return [...this.queue];
  }

  /**
   * Get queue size
   */
  size(): number {
    return this.queue.length;
  }

  /**
   * Clear entire queue
   */
  async clear(): Promise<void> {
    this.queue = [];
    await this.saveQueue();
  }

  /**
   * Process queue - attempt to sync all queued requests
   */
  async process(
    executeFn: (req: QueuedRequest) => Promise<void>
  ): Promise<{ success: number; failed: number }> {
    if (this.isProcessing) {
      return { success: 0, failed: 0 };
    }

    this.isProcessing = true;
    let successCount = 0;
    let failedCount = 0;

    // Process requests in order (FIFO)
    const requests = [...this.queue];

    for (const request of requests) {
      try {
        await executeFn(request);
        await this.dequeue(request.id);
        successCount++;
      } catch (error) {
        request.retries++;

        if (request.retries >= request.maxRetries) {
          // Max retries reached, remove from queue
          await this.dequeue(request.id);
          failedCount++;
          console.error(
            `Failed to sync request after ${request.maxRetries} retries:`,
            request.url
          );
        } else {
          // Keep in queue for next attempt
          await this.saveQueue();
        }
      }
    }

    this.isProcessing = false;
    return { success: successCount, failed: failedCount };
  }

  /**
   * Clean old requests (older than 7 days)
   */
  async cleanOld(maxAgeMs: number = 7 * 24 * 60 * 60 * 1000): Promise<number> {
    const now = Date.now();
    const initialSize = this.queue.length;

    this.queue = this.queue.filter((req) => now - req.timestamp < maxAgeMs);

    if (this.queue.length < initialSize) {
      await this.saveQueue();
    }

    return initialSize - this.queue.length;
  }
}
