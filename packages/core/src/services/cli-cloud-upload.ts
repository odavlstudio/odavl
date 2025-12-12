/**
 * CLI Cloud Upload Service
 * Upload analysis results, ledgers, and test results to ODAVL Cloud
 * 
 * Features:
 * - Automatic retry with exponential backoff
 * - Offline queue with persistence
 * - Progress tracking
 * - Compression (gzip)
 * - Chunked uploads for large files
 */

import { promises as fs } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { createGzip } from 'zlib';
import { pipeline } from 'stream/promises';
import { cliAuthService } from './cli-auth';
// import { authenticatedFetch } from './cli-auth'; // Phase 5: Function doesn't exist

// Phase 5: Stub for missing authenticatedFetch
async function authenticatedFetch(url: string, options?: any): Promise<Response> {
  const credentials = await cliAuthService.getCredentials();
  return fetch(url, {
    ...options,
    headers: {
      ...options?.headers,
      'Authorization': `Bearer ${credentials?.apiKey || ''}`,
    },
  });
}

export interface UploadOptions {
  compress?: boolean;
  retry?: boolean;
  maxRetries?: number;
  onProgress?: (progress: number) => void;
}

export interface UploadResult {
  success: boolean;
  uploadId?: string;
  url?: string;
  error?: string;
  retryable?: boolean;
}

export interface QueuedUpload {
  id: string;
  product: 'insight' | 'autopilot' | 'guardian';
  type: string;
  filePath: string;
  metadata: Record<string, unknown>;
  attempts: number;
  createdAt: string;
  lastAttempt?: string;
}

const QUEUE_DIR = join(homedir(), '.odavl', 'queue');
const QUEUE_FILE = join(QUEUE_DIR, 'uploads.json');
const MAX_RETRIES = 3;
const RETRY_DELAYS = [1000, 5000, 15000]; // 1s, 5s, 15s

/**
 * CLI Cloud Upload Service
 */
export class CLICloudUploadService {
  private static instance: CLICloudUploadService;
  private queue: QueuedUpload[] = [];
  
  private constructor() {
    this.loadQueue();
  }
  
  public static getInstance(): CLICloudUploadService {
    if (!CLICloudUploadService.instance) {
      CLICloudUploadService.instance = new CLICloudUploadService();
    }
    return CLICloudUploadService.instance;
  }
  
  /**
   * Load upload queue from disk
   */
  private async loadQueue(): Promise<void> {
    try {
      const data = await fs.readFile(QUEUE_FILE, 'utf8');
      this.queue = JSON.parse(data);
    } catch {
      this.queue = [];
    }
  }
  
  /**
   * Save upload queue to disk
   */
  private async saveQueue(): Promise<void> {
    try {
      await fs.mkdir(QUEUE_DIR, { recursive: true });
      await fs.writeFile(QUEUE_FILE, JSON.stringify(this.queue, null, 2), 'utf8');
    } catch (error) {
      console.error('Failed to save upload queue:', error);
    }
  }
  
  /**
   * Upload file to cloud
   */
  public async upload(
    product: 'insight' | 'autopilot' | 'guardian',
    type: string,
    filePath: string,
    metadata: Record<string, unknown> = {},
    options: UploadOptions = {}
  ): Promise<UploadResult> {
    const {
      compress = true,
      retry = true,
      maxRetries = MAX_RETRIES,
      onProgress,
    } = options;
    
    // Check authentication
    const isAuthenticated = await cliAuthService.isAuthenticated();
    if (!isAuthenticated) {
      if (retry) {
        // Queue for later
        await this.queueUpload(product, type, filePath, metadata);
        return {
          success: false,
          error: 'Not authenticated. Upload queued for later.',
          retryable: true,
        };
      }
      
      return {
        success: false,
        error: 'Authentication required',
        retryable: false,
      };
    }
    
    try {
      // Read file
      const fileContent = await fs.readFile(filePath, 'utf8');
      let uploadData = fileContent;
      
      // Compress if requested
      if (compress) {
        const compressed = await this.compressData(fileContent);
        uploadData = compressed.toString('base64');
      }
      
      // Upload to cloud
      const response = await authenticatedFetch(`/v1/upload/${product}`, {
        method: 'POST',
        body: JSON.stringify({
          type,
          data: uploadData,
          compressed: compress,
          metadata,
        }),
      });
      
      if (!response.ok) {
        const error = await response.text();
        
        // Queue for retry if retryable error
        if (retry && response.status >= 500) {
          await this.queueUpload(product, type, filePath, metadata);
          return {
            success: false,
            error: `Upload failed: ${error}. Queued for retry.`,
            retryable: true,
          };
        }
        
        return {
          success: false,
          error: `Upload failed: ${error}`,
          retryable: response.status >= 500,
        };
      }
      
      const result = await response.json();
      
      return {
        success: true,
        uploadId: result.uploadId,
        url: result.url,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Queue for retry on network errors
      if (retry) {
        await this.queueUpload(product, type, filePath, metadata);
        return {
          success: false,
          error: `Upload failed: ${errorMessage}. Queued for retry.`,
          retryable: true,
        };
      }
      
      return {
        success: false,
        error: `Upload failed: ${errorMessage}`,
        retryable: true,
      };
    }
  }
  
  /**
   * Queue upload for later
   */
  private async queueUpload(
    product: 'insight' | 'autopilot' | 'guardian',
    type: string,
    filePath: string,
    metadata: Record<string, unknown>
  ): Promise<void> {
    const queuedUpload: QueuedUpload = {
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      product,
      type,
      filePath,
      metadata,
      attempts: 0,
      createdAt: new Date().toISOString(),
    };
    
    this.queue.push(queuedUpload);
    await this.saveQueue();
  }
  
  /**
   * Process upload queue
   */
  public async processQueue(): Promise<{
    processed: number;
    succeeded: number;
    failed: number;
  }> {
    await this.loadQueue();
    
    let processed = 0;
    let succeeded = 0;
    let failed = 0;
    
    const remainingQueue: QueuedUpload[] = [];
    
    for (const item of this.queue) {
      // Skip if max retries exceeded
      if (item.attempts >= MAX_RETRIES) {
        console.warn(`Max retries exceeded for ${item.id}`);
        failed++;
        continue;
      }
      
      processed++;
      item.attempts++;
      item.lastAttempt = new Date().toISOString();
      
      // Exponential backoff delay
      if (item.attempts > 1) {
        const delay = RETRY_DELAYS[item.attempts - 2] || 15000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
      
      // Try upload
      const result = await this.upload(
        item.product,
        item.type,
        item.filePath,
        item.metadata,
        { retry: false }
      );
      
      if (result.success) {
        succeeded++;
      } else {
        // Keep in queue if retryable
        if (result.retryable && item.attempts < MAX_RETRIES) {
          remainingQueue.push(item);
        } else {
          failed++;
        }
      }
    }
    
    this.queue = remainingQueue;
    await this.saveQueue();
    
    return { processed, succeeded, failed };
  }
  
  /**
   * Get queue status
   */
  public async getQueueStatus(): Promise<{
    total: number;
    byProduct: Record<string, number>;
    oldest?: string;
  }> {
    await this.loadQueue();
    
    const byProduct: Record<string, number> = {};
    let oldest: string | undefined;
    
    for (const item of this.queue) {
      byProduct[item.product] = (byProduct[item.product] || 0) + 1;
      
      if (!oldest || item.createdAt < oldest) {
        oldest = item.createdAt;
      }
    }
    
    return {
      total: this.queue.length,
      byProduct,
      oldest,
    };
  }
  
  /**
   * Clear upload queue
   */
  public async clearQueue(): Promise<void> {
    this.queue = [];
    await this.saveQueue();
  }
  
  /**
   * Compress data with gzip
   */
  private async compressData(data: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const gzip = createGzip();
      const chunks: Buffer[] = [];
      
      gzip.on('data', (chunk) => chunks.push(chunk));
      gzip.on('end', () => resolve(Buffer.concat(chunks)));
      gzip.on('error', reject);
      
      gzip.write(data);
      gzip.end();
    });
  }
  
  /**
   * Upload large file in chunks
   */
  public async uploadLargeFile(
    product: 'insight' | 'autopilot' | 'guardian',
    type: string,
    filePath: string,
    metadata: Record<string, unknown> = {},
    chunkSize: number = 5 * 1024 * 1024, // 5MB chunks
    onProgress?: (progress: number) => void
  ): Promise<UploadResult> {
    try {
      const stats = await fs.stat(filePath);
      const fileSize = stats.size;
      const chunks = Math.ceil(fileSize / chunkSize);
      
      // Initialize upload
      const initResponse = await authenticatedFetch(`/v1/upload/${product}/init`, {
        method: 'POST',
        body: JSON.stringify({
          type,
          fileName: filePath.split('/').pop(),
          fileSize,
          chunks,
          metadata,
        }),
      });
      
      if (!initResponse.ok) {
        throw new Error('Failed to initialize upload');
      }
      
      const { uploadId } = await initResponse.json();
      
      // Upload chunks
      const fileHandle = await fs.open(filePath, 'r');
      
      try {
        for (let i = 0; i < chunks; i++) {
          const buffer = Buffer.alloc(chunkSize);
          const { bytesRead } = await fileHandle.read(buffer, 0, chunkSize, i * chunkSize);
          
          const chunkData = buffer.slice(0, bytesRead).toString('base64');
          
          const chunkResponse = await authenticatedFetch(
            `/v1/upload/${product}/chunk`,
            {
              method: 'POST',
              body: JSON.stringify({
                uploadId,
                chunkIndex: i,
                data: chunkData,
              }),
            }
          );
          
          if (!chunkResponse.ok) {
            throw new Error(`Failed to upload chunk ${i}`);
          }
          
          // Report progress
          if (onProgress) {
            const progress = ((i + 1) / chunks) * 100;
            onProgress(progress);
          }
        }
      } finally {
        await fileHandle.close();
      }
      
      // Finalize upload
      const finalizeResponse = await authenticatedFetch(
        `/v1/upload/${product}/finalize`,
        {
          method: 'POST',
          body: JSON.stringify({ uploadId }),
        }
      );
      
      if (!finalizeResponse.ok) {
        throw new Error('Failed to finalize upload');
      }
      
      const result = await finalizeResponse.json();
      
      return {
        success: true,
        uploadId: result.uploadId,
        url: result.url,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        retryable: true,
      };
    }
  }
}

// Singleton instance
export const cloudUploadService = CLICloudUploadService.getInstance();
