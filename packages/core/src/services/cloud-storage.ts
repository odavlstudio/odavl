/**
 * Cloud Storage Service
 * Handles S3/GCS operations with presigned URLs for direct uploads
 */

import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export interface UploadOptions {
  key: string;
  contentType: string;
  expiresIn?: number; // seconds, default 3600 (1 hour)
  metadata?: Record<string, string>;
}

export interface FileMetadata {
  key: string;
  size: number;
  contentType: string;
  lastModified: Date;
  metadata?: Record<string, string>;
}

export interface ListOptions {
  prefix?: string;
  maxKeys?: number;
  continuationToken?: string;
}

export interface ListResult {
  files: FileMetadata[];
  nextToken?: string;
  isTruncated: boolean;
}

/**
 * Cloud Storage Service (Singleton)
 * Supports AWS S3 and S3-compatible services (MinIO, DigitalOcean Spaces, etc.)
 */
export class CloudStorageService {
  private static instance: CloudStorageService;
  private s3Client: S3Client;
  private bucket: string;
  private region: string;

  private constructor() {
    // Initialize S3 client with credentials from environment
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
    this.region = process.env.AWS_REGION || 'us-east-1';
    this.bucket = process.env.AWS_S3_BUCKET || 'odavl-storage';

    if (!accessKeyId || !secretAccessKey) {
      throw new Error(
        'AWS credentials not configured. Set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY'
      );
    }

    this.s3Client = new S3Client({
      region: this.region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
      // Support for S3-compatible services (optional)
      ...(process.env.AWS_ENDPOINT_URL && {
        endpoint: process.env.AWS_ENDPOINT_URL,
        forcePathStyle: true, // Required for MinIO and some S3-compatible services
      }),
    });

    console.log(`[CloudStorage] Initialized with bucket: ${this.bucket}, region: ${this.region}`);
  }

  public static getInstance(): CloudStorageService {
    if (!CloudStorageService.instance) {
      CloudStorageService.instance = new CloudStorageService();
    }
    return CloudStorageService.instance;
  }

  /**
   * Generate presigned URL for direct upload from client
   * Client uploads directly to S3, reducing server load
   */
  async generateUploadUrl(options: UploadOptions): Promise<string> {
    const { key, contentType, expiresIn = 3600, metadata = {} } = options;

    try {
      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        ContentType: contentType,
        Metadata: metadata,
      });

      const url = await getSignedUrl(this.s3Client, command, {
        expiresIn,
      });

      console.log(`[CloudStorage] Generated upload URL for: ${key} (expires in ${expiresIn}s)`);
      return url;
    } catch (error) {
      console.error('[CloudStorage] Error generating upload URL:', error);
      throw new Error(`Failed to generate upload URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate presigned URL for direct download
   * Useful for private files that need temporary access
   */
  async generateDownloadUrl(key: string, expiresIn = 3600): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      const url = await getSignedUrl(this.s3Client, command, {
        expiresIn,
      });

      console.log(`[CloudStorage] Generated download URL for: ${key} (expires in ${expiresIn}s)`);
      return url;
    } catch (error) {
      console.error('[CloudStorage] Error generating download URL:', error);
      throw new Error(`Failed to generate download URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Upload buffer directly to S3 (server-side upload)
   * Use this for small files or when client-side upload is not possible
   */
  async uploadBuffer(
    buffer: Buffer,
    key: string,
    contentType: string,
    metadata?: Record<string, string>
  ): Promise<{ key: string; url: string }> {
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: contentType,
        Metadata: metadata,
      });

      await this.s3Client.send(command);

      // Generate public URL (if bucket is public) or presigned URL
      const url = await this.generateDownloadUrl(key, 86400); // 24 hours

      console.log(`[CloudStorage] Uploaded buffer to: ${key} (${buffer.length} bytes)`);
      return { key, url };
    } catch (error) {
      console.error('[CloudStorage] Error uploading buffer:', error);
      throw new Error(`Failed to upload buffer: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete file from S3
   */
  async deleteFile(key: string): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      await this.s3Client.send(command);
      console.log(`[CloudStorage] Deleted file: ${key}`);
    } catch (error) {
      console.error('[CloudStorage] Error deleting file:', error);
      throw new Error(`Failed to delete file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get file metadata without downloading content
   */
  async getFileMetadata(key: string): Promise<FileMetadata> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      const response = await this.s3Client.send(command);

      return {
        key,
        size: response.ContentLength || 0,
        contentType: response.ContentType || 'application/octet-stream',
        lastModified: response.LastModified || new Date(),
        metadata: response.Metadata,
      };
    } catch (error) {
      console.error('[CloudStorage] Error getting file metadata:', error);
      throw new Error(`Failed to get file metadata: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * List files with optional prefix filter
   * Supports pagination for large buckets
   */
  async listFiles(options: ListOptions = {}): Promise<ListResult> {
    const { prefix = '', maxKeys = 1000, continuationToken } = options;

    try {
      const command = new ListObjectsV2Command({
        Bucket: this.bucket,
        Prefix: prefix,
        MaxKeys: maxKeys,
        ContinuationToken: continuationToken,
      });

      const response = await this.s3Client.send(command);

      const files: FileMetadata[] = (response.Contents || []).map((obj) => ({
        key: obj.Key!,
        size: obj.Size || 0,
        contentType: 'application/octet-stream', // ListObjects doesn't return content type
        lastModified: obj.LastModified || new Date(),
      }));

      console.log(`[CloudStorage] Listed ${files.length} files with prefix: ${prefix}`);

      return {
        files,
        nextToken: response.NextContinuationToken,
        isTruncated: response.IsTruncated || false,
      };
    } catch (error) {
      console.error('[CloudStorage] Error listing files:', error);
      throw new Error(`Failed to list files: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Check if file exists in S3
   */
  async fileExists(key: string): Promise<boolean> {
    try {
      await this.getFileMetadata(key);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Generate S3 key from user/org context
   * Pattern: {orgId}/{product}/{userId}/{timestamp}-{filename}
   */
  static generateKey(
    orgId: string,
    product: 'insight' | 'autopilot' | 'guardian',
    userId: string,
    filename: string
  ): string {
    const timestamp = Date.now();
    const sanitizedFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
    return `${orgId}/${product}/${userId}/${timestamp}-${sanitizedFilename}`;
  }

  /**
   * Parse S3 key to extract metadata
   */
  static parseKey(key: string): {
    orgId: string;
    product: string;
    userId: string;
    filename: string;
  } | null {
    const parts = key.split('/');
    if (parts.length < 4) return null;

    const [orgId, product, userId, filenameWithTimestamp] = parts;
    const filename = filenameWithTimestamp.replace(/^\d+-/, ''); // Remove timestamp prefix

    return { orgId, product, userId, filename };
  }

  /**
   * Get storage usage for organization
   * Sums up all file sizes for given prefix
   */
  async getStorageUsage(orgId: string): Promise<number> {
    let totalBytes = 0;
    let continuationToken: string | undefined;

    try {
      do {
        const result = await this.listFiles({
          prefix: `${orgId}/`,
          maxKeys: 1000,
          continuationToken,
        });

        totalBytes += result.files.reduce((sum, file) => sum + file.size, 0);
        continuationToken = result.nextToken;
      } while (continuationToken);

      console.log(`[CloudStorage] Total storage for org ${orgId}: ${totalBytes} bytes`);
      return totalBytes;
    } catch (error) {
      console.error('[CloudStorage] Error calculating storage usage:', error);
      return 0; // Fail gracefully
    }
  }

  /**
   * Bulk delete files by prefix (cleanup utility)
   */
  async deleteByPrefix(prefix: string): Promise<number> {
    let deletedCount = 0;
    let continuationToken: string | undefined;

    try {
      do {
        const result = await this.listFiles({
          prefix,
          maxKeys: 1000,
          continuationToken,
        });

        // Delete files in parallel (batch of 10)
        const deletePromises = result.files.map((file) =>
          this.deleteFile(file.key).catch((err) => {
            console.error(`Failed to delete ${file.key}:`, err);
          })
        );

        await Promise.all(deletePromises);
        deletedCount += result.files.length;
        continuationToken = result.nextToken;
      } while (continuationToken);

      console.log(`[CloudStorage] Deleted ${deletedCount} files with prefix: ${prefix}`);
      return deletedCount;
    } catch (error) {
      console.error('[CloudStorage] Error deleting by prefix:', error);
      throw new Error(`Failed to delete by prefix: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

// Export singleton instance
export const cloudStorage = CloudStorageService.getInstance();
