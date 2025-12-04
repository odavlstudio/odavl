/**
 * @odavl-studio/storage
 * 
 * Cloud Storage Service for ODAVL Workspaces
 * Supports: AWS S3, Azure Blob, Local filesystem
 * 
 * Features:
 * - Upload/download .odavl/ directories
 * - Incremental sync (delta updates)
 * - Compression (gzip)
 * - Encryption (AES-256)
 * - Conflict resolution
 * - Version history
 */

export { StorageService } from './service';
export { S3Provider } from './providers/s3';
export { AzureBlobProvider } from './providers/azure';
export { LocalProvider } from './providers/local';
export * from './types';
export * from './sync';
