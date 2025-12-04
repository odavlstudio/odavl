/**
 * Storage Service
 * Manages file uploads to S3/Azure Blob Storage with signed URLs
 * 
 * Features:
 * - Generate pre-signed upload/download URLs
 * - Support both S3 and Azure Blob Storage
 * - File metadata management
 * - Access control with expiration
 * - Multi-part upload support
 */

import crypto from 'node:crypto';

export enum StorageProvider {
  S3 = 'S3',
  AZURE_BLOB = 'AZURE_BLOB',
}

export enum StorageAccessLevel {
  PUBLIC = 'PUBLIC',
  PRIVATE = 'PRIVATE',
  ORGANIZATION = 'ORGANIZATION',
  PROJECT = 'PROJECT',
}

export interface StorageFile {
  id: string;
  organizationId: string;
  projectId?: string;
  userId?: string;
  
  // File details
  filename: string;
  originalFilename: string;
  fileSize: number;
  contentType: string;
  
  // Storage
  provider: StorageProvider;
  bucketName: string;
  storageKey: string;
  cloudUrl: string;
  
  // Access control
  accessLevel: StorageAccessLevel;
  expiresAt?: Date;
  
  // Metadata
  metadata?: Record<string, string>;
  tags?: string[];
  
  // Timestamps
  uploadedAt: Date;
  lastAccessedAt?: Date;
  
  // Stats
  downloadCount: number;
}

export interface SignedUrlOptions {
  expiresIn?: number; // Seconds (default: 3600 = 1 hour)
  contentType?: string;
  maxFileSize?: number; // Bytes
  metadata?: Record<string, string>;
}

export interface UploadUrlResponse {
  uploadUrl: string;
  fileUrl: string;
  fileId: string;
  expiresAt: Date;
}

export interface MultiPartUploadInit {
  uploadId: string;
  fileId: string;
  partSize: number;
  totalParts: number;
}

export interface MultiPartUploadPart {
  partNumber: number;
  uploadUrl: string;
  minSize: number;
  maxSize: number;
}

export class StorageService {
  private static instance: StorageService;
  private files = new Map<string, StorageFile>();
  private provider: StorageProvider;
  private bucketName: string;
  
  // S3 config
  private s3Region: string;
  private s3AccessKeyId: string;
  private s3SecretAccessKey: string;
  
  // Azure config
  private azureAccountName: string;
  private azureAccountKey: string;
  private azureContainerName: string;
  
  private constructor() {
    // Detect provider from env
    this.provider = process.env.STORAGE_PROVIDER === 'AZURE_BLOB' 
      ? StorageProvider.AZURE_BLOB 
      : StorageProvider.S3;
    
    // S3 configuration
    this.s3Region = process.env.AWS_REGION || 'us-east-1';
    this.s3AccessKeyId = process.env.AWS_ACCESS_KEY_ID || '';
    this.s3SecretAccessKey = process.env.AWS_SECRET_ACCESS_KEY || '';
    this.bucketName = process.env.S3_BUCKET_NAME || 'odavl-storage';
    
    // Azure configuration
    this.azureAccountName = process.env.AZURE_STORAGE_ACCOUNT_NAME || '';
    this.azureAccountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY || '';
    this.azureContainerName = process.env.AZURE_CONTAINER_NAME || 'odavl-storage';
    
    console.log(`Storage provider: ${this.provider}`);
  }
  
  public static getInstance(): StorageService {
    if (!StorageService.instance) {
      StorageService.instance = new StorageService();
    }
    return StorageService.instance;
  }
  
  /**
   * Generate signed upload URL
   */
  public async generateUploadUrl(params: {
    organizationId: string;
    projectId?: string;
    userId?: string;
    filename: string;
    contentType: string;
    fileSize: number;
    accessLevel?: StorageAccessLevel;
    metadata?: Record<string, string>;
    expiresIn?: number;
  }): Promise<UploadUrlResponse> {
    const fileId = `file_${Date.now()}_${crypto.randomBytes(16).toString('hex')}`;
    const sanitizedFilename = this.sanitizeFilename(params.filename);
    const storageKey = this.generateStorageKey(
      params.organizationId,
      params.projectId,
      fileId,
      sanitizedFilename
    );
    
    const expiresIn = params.expiresIn || 3600; // 1 hour default
    const expiresAt = new Date(Date.now() + expiresIn * 1000);
    
    // Generate signed URL based on provider
    const uploadUrl = this.provider === StorageProvider.S3
      ? await this.generateS3UploadUrl(storageKey, params.contentType, expiresIn, params.metadata)
      : await this.generateAzureUploadUrl(storageKey, params.contentType, expiresIn, params.metadata);
    
    // Generate file URL for access
    const fileUrl = this.getFileUrl(storageKey);
    
    // Store file metadata
    const file: StorageFile = {
      id: fileId,
      organizationId: params.organizationId,
      projectId: params.projectId,
      userId: params.userId,
      filename: sanitizedFilename,
      originalFilename: params.filename,
      fileSize: params.fileSize,
      contentType: params.contentType,
      provider: this.provider,
      bucketName: this.provider === StorageProvider.S3 ? this.bucketName : this.azureContainerName,
      storageKey,
      cloudUrl: fileUrl,
      accessLevel: params.accessLevel || StorageAccessLevel.PRIVATE,
      expiresAt,
      metadata: params.metadata,
      uploadedAt: new Date(),
      downloadCount: 0,
    };
    
    this.files.set(fileId, file);
    
    return {
      uploadUrl,
      fileUrl,
      fileId,
      expiresAt,
    };
  }
  
  /**
   * Generate signed download URL
   */
  public async generateDownloadUrl(
    fileId: string,
    expiresIn: number = 3600
  ): Promise<string> {
    const file = this.files.get(fileId);
    if (!file) {
      throw new Error('File not found');
    }
    
    // Update access stats
    file.lastAccessedAt = new Date();
    file.downloadCount++;
    this.files.set(fileId, file);
    
    // Generate signed URL based on provider
    return this.provider === StorageProvider.S3
      ? await this.generateS3DownloadUrl(file.storageKey, expiresIn)
      : await this.generateAzureDownloadUrl(file.storageKey, expiresIn);
  }
  
  /**
   * Generate S3 upload URL
   */
  private async generateS3UploadUrl(
    key: string,
    contentType: string,
    expiresIn: number,
    metadata?: Record<string, string>
  ): Promise<string> {
    // TODO: Implement actual AWS SDK v3 integration
    // For now, return mock URL
    const timestamp = Date.now();
    const signature = crypto
      .createHmac('sha256', this.s3SecretAccessKey || 'mock-secret')
      .update(`${key}${timestamp}`)
      .digest('hex');
    
    const params = new URLSearchParams({
      'X-Amz-Algorithm': 'AWS4-HMAC-SHA256',
      'X-Amz-Credential': `${this.s3AccessKeyId}/${new Date().toISOString().split('T')[0]}/${this.s3Region}/s3/aws4_request`,
      'X-Amz-Date': new Date().toISOString().replace(/[:-]|\.\d{3}/g, ''),
      'X-Amz-Expires': expiresIn.toString(),
      'X-Amz-SignedHeaders': 'host',
      'X-Amz-Signature': signature,
    });
    
    if (metadata) {
      Object.entries(metadata).forEach(([k, v]) => {
        params.append(`x-amz-meta-${k}`, v);
      });
    }
    
    return `https://${this.bucketName}.s3.${this.s3Region}.amazonaws.com/${key}?${params.toString()}`;
  }
  
  /**
   * Generate S3 download URL
   */
  private async generateS3DownloadUrl(
    key: string,
    expiresIn: number
  ): Promise<string> {
    // TODO: Implement actual AWS SDK v3 integration
    const timestamp = Date.now();
    const signature = crypto
      .createHmac('sha256', this.s3SecretAccessKey || 'mock-secret')
      .update(`${key}${timestamp}`)
      .digest('hex');
    
    const params = new URLSearchParams({
      'X-Amz-Algorithm': 'AWS4-HMAC-SHA256',
      'X-Amz-Credential': `${this.s3AccessKeyId}/${new Date().toISOString().split('T')[0]}/${this.s3Region}/s3/aws4_request`,
      'X-Amz-Date': new Date().toISOString().replace(/[:-]|\.\d{3}/g, ''),
      'X-Amz-Expires': expiresIn.toString(),
      'X-Amz-SignedHeaders': 'host',
      'X-Amz-Signature': signature,
      'response-content-disposition': 'attachment',
    });
    
    return `https://${this.bucketName}.s3.${this.s3Region}.amazonaws.com/${key}?${params.toString()}`;
  }
  
  /**
   * Generate Azure Blob upload URL
   */
  private async generateAzureUploadUrl(
    blobName: string,
    contentType: string,
    expiresIn: number,
    metadata?: Record<string, string>
  ): Promise<string> {
    // TODO: Implement actual Azure Blob Storage SDK integration
    const expiryTime = new Date(Date.now() + expiresIn * 1000).toISOString();
    const signature = crypto
      .createHmac('sha256', this.azureAccountKey || 'mock-key')
      .update(`${blobName}${expiryTime}`)
      .digest('base64');
    
    const params = new URLSearchParams({
      'sv': '2021-06-08', // API version
      'se': expiryTime,
      'sr': 'b', // blob
      'sp': 'w', // write permission
      'sig': signature,
    });
    
    return `https://${this.azureAccountName}.blob.core.windows.net/${this.azureContainerName}/${blobName}?${params.toString()}`;
  }
  
  /**
   * Generate Azure Blob download URL
   */
  private async generateAzureDownloadUrl(
    blobName: string,
    expiresIn: number
  ): Promise<string> {
    // TODO: Implement actual Azure Blob Storage SDK integration
    const expiryTime = new Date(Date.now() + expiresIn * 1000).toISOString();
    const signature = crypto
      .createHmac('sha256', this.azureAccountKey || 'mock-key')
      .update(`${blobName}${expiryTime}`)
      .digest('base64');
    
    const params = new URLSearchParams({
      'sv': '2021-06-08',
      'se': expiryTime,
      'sr': 'b',
      'sp': 'r', // read permission
      'sig': signature,
    });
    
    return `https://${this.azureAccountName}.blob.core.windows.net/${this.azureContainerName}/${blobName}?${params.toString()}`;
  }
  
  /**
   * Initialize multi-part upload
   */
  public async initMultiPartUpload(params: {
    organizationId: string;
    projectId?: string;
    filename: string;
    contentType: string;
    fileSize: number;
    partSize?: number;
  }): Promise<MultiPartUploadInit> {
    const partSize = params.partSize || 5 * 1024 * 1024; // 5MB default
    const totalParts = Math.ceil(params.fileSize / partSize);
    
    const uploadId = `upload_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
    
    // TODO: Initialize actual multi-part upload with S3/Azure
    
    return {
      uploadId,
      fileId: `file_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`,
      partSize,
      totalParts,
    };
  }
  
  /**
   * Get multi-part upload URL
   */
  public async getMultiPartUploadUrl(
    uploadId: string,
    partNumber: number
  ): Promise<MultiPartUploadPart> {
    // TODO: Generate actual part upload URL
    
    const partSize = 5 * 1024 * 1024; // 5MB
    
    return {
      partNumber,
      uploadUrl: `https://mock-upload-url.com/${uploadId}/${partNumber}`,
      minSize: partNumber === 1 ? 0 : partSize,
      maxSize: partSize,
    };
  }
  
  /**
   * Complete multi-part upload
   */
  public async completeMultiPartUpload(
    uploadId: string,
    parts: Array<{ partNumber: number; etag: string }>
  ): Promise<StorageFile> {
    // TODO: Complete actual multi-part upload
    
    const fileId = `file_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
    
    const file: StorageFile = {
      id: fileId,
      organizationId: 'org_123',
      filename: 'large-file.zip',
      originalFilename: 'large-file.zip',
      fileSize: 50 * 1024 * 1024,
      contentType: 'application/zip',
      provider: this.provider,
      bucketName: this.bucketName,
      storageKey: `uploads/${fileId}/large-file.zip`,
      cloudUrl: this.getFileUrl(`uploads/${fileId}/large-file.zip`),
      accessLevel: StorageAccessLevel.PRIVATE,
      uploadedAt: new Date(),
      downloadCount: 0,
    };
    
    this.files.set(fileId, file);
    
    return file;
  }
  
  /**
   * Delete file
   */
  public async deleteFile(fileId: string): Promise<boolean> {
    const file = this.files.get(fileId);
    if (!file) {
      return false;
    }
    
    // TODO: Delete actual file from S3/Azure
    
    this.files.delete(fileId);
    return true;
  }
  
  /**
   * Get file metadata
   */
  public getFile(fileId: string): StorageFile | null {
    return this.files.get(fileId) || null;
  }
  
  /**
   * List files
   */
  public listFiles(params: {
    organizationId?: string;
    projectId?: string;
    userId?: string;
    contentType?: string;
    limit?: number;
    offset?: number;
  }): StorageFile[] {
    let files = Array.from(this.files.values());
    
    if (params.organizationId) {
      files = files.filter(f => f.organizationId === params.organizationId);
    }
    
    if (params.projectId) {
      files = files.filter(f => f.projectId === params.projectId);
    }
    
    if (params.userId) {
      files = files.filter(f => f.userId === params.userId);
    }
    
    if (params.contentType) {
      files = files.filter(f => f.contentType === params.contentType);
    }
    
    // Sort by upload date (newest first)
    files.sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime());
    
    // Pagination
    const offset = params.offset || 0;
    const limit = params.limit || 50;
    
    return files.slice(offset, offset + limit);
  }
  
  /**
   * Get storage statistics
   */
  public getStorageStats(organizationId?: string): {
    totalFiles: number;
    totalSize: number;
    sizeByContentType: Record<string, number>;
    downloadCount: number;
  } {
    let files = Array.from(this.files.values());
    
    if (organizationId) {
      files = files.filter(f => f.organizationId === organizationId);
    }
    
    const totalFiles = files.length;
    const totalSize = files.reduce((sum, f) => sum + f.fileSize, 0);
    const downloadCount = files.reduce((sum, f) => sum + f.downloadCount, 0);
    
    const sizeByContentType: Record<string, number> = {};
    files.forEach(file => {
      sizeByContentType[file.contentType] = (sizeByContentType[file.contentType] || 0) + file.fileSize;
    });
    
    return {
      totalFiles,
      totalSize,
      sizeByContentType,
      downloadCount,
    };
  }
  
  /**
   * Clean up expired files
   */
  public async cleanupExpiredFiles(): Promise<number> {
    const now = new Date();
    let count = 0;
    
    for (const [id, file] of this.files.entries()) {
      if (file.expiresAt && file.expiresAt < now) {
        await this.deleteFile(id);
        count++;
      }
    }
    
    return count;
  }
  
  /**
   * Helper: Sanitize filename
   */
  private sanitizeFilename(filename: string): string {
    return filename
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .replace(/_{2,}/g, '_')
      .substring(0, 255);
  }
  
  /**
   * Helper: Generate storage key
   */
  private generateStorageKey(
    organizationId: string,
    projectId: string | undefined,
    fileId: string,
    filename: string
  ): string {
    const parts = ['uploads', organizationId];
    
    if (projectId) {
      parts.push(projectId);
    }
    
    parts.push(fileId, filename);
    
    return parts.join('/');
  }
  
  /**
   * Helper: Get file URL
   */
  private getFileUrl(storageKey: string): string {
    if (this.provider === StorageProvider.S3) {
      return `https://${this.bucketName}.s3.${this.s3Region}.amazonaws.com/${storageKey}`;
    } else {
      return `https://${this.azureAccountName}.blob.core.windows.net/${this.azureContainerName}/${storageKey}`;
    }
  }
}

// Export singleton instance
export const storageService = StorageService.getInstance();
