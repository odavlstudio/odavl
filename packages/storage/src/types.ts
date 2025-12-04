/**
 * Storage Service Types
 */

export type StorageProvider = 's3' | 'azure' | 'local';

export interface StorageConfig {
  provider: StorageProvider;
  region?: string;
  bucket?: string;
  container?: string;
  credentials?: {
    accessKeyId?: string;
    secretAccessKey?: string;
    accountName?: string;
    accountKey?: string;
  };
  encryption?: {
    enabled: boolean;
    algorithm: 'aes-256-gcm';
    key?: string;
  };
  compression?: {
    enabled: boolean;
    level: number; // 1-9
  };
}

export interface WorkspaceMetadata {
  id: string;
  userId: string;
  orgId?: string;
  workspacePath: string;
  workspaceName: string;
  lastSyncAt: string;
  version: number;
  files: FileMetadata[];
  totalSize: number;
  checksum: string;
}

export interface FileMetadata {
  path: string;
  size: number;
  checksum: string;
  lastModified: string;
  encrypted: boolean;
  compressed: boolean;
}

export interface SyncResult {
  success: boolean;
  uploaded: string[];
  downloaded: string[];
  deleted: string[];
  conflicts: Conflict[];
  duration: number;
}

export interface Conflict {
  path: string;
  localVersion: FileMetadata;
  remoteVersion: FileMetadata;
  resolution?: 'local' | 'remote' | 'merge';
}

export interface UploadOptions {
  encrypt?: boolean;
  compress?: boolean;
  overwrite?: boolean;
  metadata?: Record<string, string>;
}

export interface DownloadOptions {
  decrypt?: boolean;
  decompress?: boolean;
  version?: number;
}

export interface SyncOptions {
  direction: 'push' | 'pull' | 'both';
  dryRun?: boolean;
  conflictResolution?: 'local' | 'remote' | 'skip' | 'prompt';
  incremental?: boolean;
  exclude?: string[];
}
