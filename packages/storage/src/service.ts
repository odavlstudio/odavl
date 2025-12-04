/**
 * Storage Service - Main orchestrator
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { createHash } from 'crypto';
import { gzip, gunzip } from 'zlib';
import { promisify } from 'util';
import type {
  StorageConfig,
  StorageProvider,
  WorkspaceMetadata,
  FileMetadata,
  SyncResult,
  UploadOptions,
  DownloadOptions,
  SyncOptions,
  Conflict,
} from './types';
import { S3Provider } from './providers/s3';
import { AzureBlobProvider } from './providers/azure';
import { LocalProvider } from './providers/local';

const gzipAsync = promisify(gzip);
const gunzipAsync = promisify(gunzip);

export class StorageService {
  private config: StorageConfig;
  private provider: S3Provider | AzureBlobProvider | LocalProvider;

  constructor(config: StorageConfig) {
    this.config = config;
    this.provider = this.initializeProvider();
  }

  private initializeProvider() {
    switch (this.config.provider) {
      case 's3':
        return new S3Provider(this.config);
      case 'azure':
        return new AzureBlobProvider(this.config);
      case 'local':
        return new LocalProvider(this.config);
      default:
        throw new Error(`Unsupported storage provider: ${this.config.provider}`);
    }
  }

  /**
   * Upload workspace to cloud storage
   */
  async uploadWorkspace(
    workspacePath: string,
    userId: string,
    orgId?: string,
    options: UploadOptions = {}
  ): Promise<WorkspaceMetadata> {
    const workspaceName = path.basename(workspacePath);
    const odavlPath = path.join(workspacePath, '.odavl');

    // Check if .odavl exists
    try {
      await fs.access(odavlPath);
    } catch {
      throw new Error(`.odavl directory not found in ${workspacePath}`);
    }

    // Scan files
    const files = await this.scanDirectory(odavlPath);
    
    // Upload each file
    const uploadedFiles: FileMetadata[] = [];
    for (const file of files) {
      const filePath = path.join(odavlPath, file);
      const content = await fs.readFile(filePath);
      
      let processedContent = content;
      let encrypted = false;
      let compressed = false;

      // Compress if enabled
      if (options.compress !== false && this.config.compression?.enabled) {
        processedContent = await gzipAsync(processedContent);
        compressed = true;
      }

      // Encrypt if enabled
      if (options.encrypt !== false && this.config.encryption?.enabled) {
        processedContent = await this.encrypt(processedContent);
        encrypted = true;
      }

      // Upload to storage
      const remoteKey = `workspaces/${userId}/${workspaceName}/.odavl/${file}`;
      await this.provider.upload(remoteKey, processedContent, {
        ...options.metadata,
        encrypted: encrypted.toString(),
        compressed: compressed.toString(),
      });

      const stats = await fs.stat(filePath);
      uploadedFiles.push({
        path: file,
        size: stats.size,
        checksum: this.calculateChecksum(content),
        lastModified: stats.mtime.toISOString(),
        encrypted,
        compressed,
      });
    }

    // Create metadata
    const metadata: WorkspaceMetadata = {
      id: this.generateId(),
      userId,
      orgId,
      workspacePath,
      workspaceName,
      lastSyncAt: new Date().toISOString(),
      version: 1,
      files: uploadedFiles,
      totalSize: uploadedFiles.reduce((sum, f) => sum + f.size, 0),
      checksum: this.calculateChecksum(
        Buffer.from(JSON.stringify(uploadedFiles))
      ),
    };

    // Save metadata
    const metadataKey = `workspaces/${userId}/${workspaceName}/.metadata.json`;
    await this.provider.upload(
      metadataKey,
      Buffer.from(JSON.stringify(metadata, null, 2))
    );

    return metadata;
  }

  /**
   * Download workspace from cloud storage
   */
  async downloadWorkspace(
    workspaceName: string,
    userId: string,
    destinationPath: string,
    options: DownloadOptions = {}
  ): Promise<WorkspaceMetadata> {
    // Download metadata
    const metadataKey = `workspaces/${userId}/${workspaceName}/.metadata.json`;
    const metadataBuffer = await this.provider.download(metadataKey);
    const metadata: WorkspaceMetadata = JSON.parse(metadataBuffer.toString());

    // Create .odavl directory
    const odavlPath = path.join(destinationPath, '.odavl');
    await fs.mkdir(odavlPath, { recursive: true });

    // Download each file
    for (const file of metadata.files) {
      const remoteKey = `workspaces/${userId}/${workspaceName}/.odavl/${file.path}`;
      let content = await this.provider.download(remoteKey);

      // Decrypt if needed
      if (file.encrypted && (options.decrypt !== false)) {
        content = await this.decrypt(content);
      }

      // Decompress if needed
      if (file.compressed && (options.decompress !== false)) {
        content = await gunzipAsync(content);
      }

      // Write to disk
      const localPath = path.join(odavlPath, file.path);
      await fs.mkdir(path.dirname(localPath), { recursive: true });
      await fs.writeFile(localPath, content);
    }

    return metadata;
  }

  /**
   * Sync workspace (bidirectional)
   */
  async syncWorkspace(
    workspacePath: string,
    userId: string,
    options: SyncOptions
  ): Promise<SyncResult> {
    const startTime = Date.now();
    const workspaceName = path.basename(workspacePath);
    const result: SyncResult = {
      success: false,
      uploaded: [],
      downloaded: [],
      deleted: [],
      conflicts: [],
      duration: 0,
    };

    try {
      // Get remote metadata
      let remoteMetadata: WorkspaceMetadata | null = null;
      try {
        const metadataKey = `workspaces/${userId}/${workspaceName}/.metadata.json`;
        const metadataBuffer = await this.provider.download(metadataKey);
        remoteMetadata = JSON.parse(metadataBuffer.toString());
      } catch {
        // No remote workspace yet
      }

      // Scan local files
      const odavlPath = path.join(workspacePath, '.odavl');
      const localFiles = await this.scanDirectory(odavlPath);
      const localMetadata = await this.generateMetadata(
        workspacePath,
        localFiles,
        userId
      );

      // Detect conflicts
      if (remoteMetadata && options.direction === 'both') {
        result.conflicts = this.detectConflicts(
          localMetadata.files,
          remoteMetadata.files
        );
      }

      // Resolve conflicts
      if (result.conflicts.length > 0) {
        if (options.conflictResolution === 'skip') {
          console.warn(
            `Skipping ${result.conflicts.length} conflicted files`
          );
        } else {
          result.conflicts = this.resolveConflicts(
            result.conflicts,
            options.conflictResolution || 'local'
          );
        }
      }

      // Push to remote
      if (options.direction === 'push' || options.direction === 'both') {
        if (!options.dryRun) {
          await this.uploadWorkspace(workspacePath, userId, undefined, {
            compress: true,
            encrypt: true,
          });
        }
        result.uploaded = localFiles;
      }

      // Pull from remote
      if (options.direction === 'pull' || options.direction === 'both') {
        if (remoteMetadata && !options.dryRun) {
          await this.downloadWorkspace(
            workspaceName,
            userId,
            path.dirname(workspacePath)
          );
        }
        result.downloaded = remoteMetadata?.files.map((f) => f.path) || [];
      }

      result.success = true;
    } catch (error: any) {
      console.error('Sync failed:', error);
      result.success = false;
    } finally {
      result.duration = Date.now() - startTime;
    }

    return result;
  }

  /**
   * Delete workspace from cloud storage
   */
  async deleteWorkspace(
    workspaceName: string,
    userId: string
  ): Promise<void> {
    const prefix = `workspaces/${userId}/${workspaceName}/`;
    await this.provider.deletePrefix(prefix);
  }

  /**
   * List all workspaces for user
   */
  async listWorkspaces(userId: string): Promise<WorkspaceMetadata[]> {
    const prefix = `workspaces/${userId}/`;
    const keys = await this.provider.listKeys(prefix);
    
    const metadataKeys = keys.filter((k) => k.endsWith('.metadata.json'));
    const workspaces: WorkspaceMetadata[] = [];

    for (const key of metadataKeys) {
      const buffer = await this.provider.download(key);
      const metadata: WorkspaceMetadata = JSON.parse(buffer.toString());
      workspaces.push(metadata);
    }

    return workspaces;
  }

  // ============================================
  // Helper Methods
  // ============================================

  private async scanDirectory(dir: string): Promise<string[]> {
    const files: string[] = [];
    
    async function scan(currentDir: string, baseDir: string) {
      const entries = await fs.readdir(currentDir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(currentDir, entry.name);
        const relativePath = path.relative(baseDir, fullPath);
        
        if (entry.isDirectory()) {
          await scan(fullPath, baseDir);
        } else {
          files.push(relativePath.replace(/\\/g, '/'));
        }
      }
    }
    
    await scan(dir, dir);
    return files;
  }

  private async generateMetadata(
    workspacePath: string,
    files: string[],
    userId: string
  ): Promise<WorkspaceMetadata> {
    const odavlPath = path.join(workspacePath, '.odavl');
    const fileMetadata: FileMetadata[] = [];

    for (const file of files) {
      const filePath = path.join(odavlPath, file);
      const stats = await fs.stat(filePath);
      const content = await fs.readFile(filePath);

      fileMetadata.push({
        path: file,
        size: stats.size,
        checksum: this.calculateChecksum(content),
        lastModified: stats.mtime.toISOString(),
        encrypted: false,
        compressed: false,
      });
    }

    return {
      id: this.generateId(),
      userId,
      workspacePath,
      workspaceName: path.basename(workspacePath),
      lastSyncAt: new Date().toISOString(),
      version: 1,
      files: fileMetadata,
      totalSize: fileMetadata.reduce((sum, f) => sum + f.size, 0),
      checksum: this.calculateChecksum(
        Buffer.from(JSON.stringify(fileMetadata))
      ),
    };
  }

  private detectConflicts(
    localFiles: FileMetadata[],
    remoteFiles: FileMetadata[]
  ): Conflict[] {
    const conflicts: Conflict[] = [];
    const remoteMap = new Map(remoteFiles.map((f) => [f.path, f]));

    for (const localFile of localFiles) {
      const remoteFile = remoteMap.get(localFile.path);
      
      if (remoteFile) {
        // Check if checksums differ
        if (localFile.checksum !== remoteFile.checksum) {
          // Check timestamps to determine which is newer
          const localTime = new Date(localFile.lastModified).getTime();
          const remoteTime = new Date(remoteFile.lastModified).getTime();
          
          if (Math.abs(localTime - remoteTime) > 1000) {
            // More than 1 second difference = conflict
            conflicts.push({
              path: localFile.path,
              localVersion: localFile,
              remoteVersion: remoteFile,
            });
          }
        }
      }
    }

    return conflicts;
  }

  private resolveConflicts(
    conflicts: Conflict[],
    strategy: 'local' | 'remote' | 'skip'
  ): Conflict[] {
    return conflicts.map((conflict) => ({
      ...conflict,
      resolution: strategy === 'skip' ? undefined : strategy,
    }));
  }

  private calculateChecksum(data: Buffer): string {
    return createHash('sha256').update(data).digest('hex');
  }

  private generateId(): string {
    return `ws_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async encrypt(data: Buffer): Promise<Buffer> {
    // TODO: Implement AES-256-GCM encryption
    // For now, return as-is
    return data;
  }

  private async decrypt(data: Buffer): Promise<Buffer> {
    // TODO: Implement AES-256-GCM decryption
    // For now, return as-is
    return data;
  }
}
