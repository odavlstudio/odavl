/**
 * Sync Utilities
 */

import type { WorkspaceMetadata, FileMetadata, Conflict } from './types';

export class SyncEngine {
  /**
   * Calculate delta between local and remote
   */
  static calculateDelta(
    local: WorkspaceMetadata,
    remote: WorkspaceMetadata
  ): {
    toUpload: FileMetadata[];
    toDownload: FileMetadata[];
    toDelete: string[];
    conflicts: Conflict[];
  } {
    const localMap = new Map(local.files.map((f) => [f.path, f]));
    const remoteMap = new Map(remote.files.map((f) => [f.path, f]));

    const toUpload: FileMetadata[] = [];
    const toDownload: FileMetadata[] = [];
    const toDelete: string[] = [];
    const conflicts: Conflict[] = [];

    // Check local files
    for (const localFile of local.files) {
      const remoteFile = remoteMap.get(localFile.path);

      if (!remoteFile) {
        // New local file
        toUpload.push(localFile);
      } else if (localFile.checksum !== remoteFile.checksum) {
        // Modified file - check timestamps
        const localTime = new Date(localFile.lastModified).getTime();
        const remoteTime = new Date(remoteFile.lastModified).getTime();

        if (localTime > remoteTime) {
          toUpload.push(localFile);
        } else if (remoteTime > localTime) {
          toDownload.push(remoteFile);
        } else {
          // Same timestamp but different checksum = conflict
          conflicts.push({
            path: localFile.path,
            localVersion: localFile,
            remoteVersion: remoteFile,
          });
        }
      }
    }

    // Check remote files not in local
    for (const remoteFile of remote.files) {
      if (!localMap.has(remoteFile.path)) {
        toDownload.push(remoteFile);
      }
    }

    // Check for deletions (files in remote but not in local)
    for (const remotePath of remoteMap.keys()) {
      if (!localMap.has(remotePath)) {
        toDelete.push(remotePath);
      }
    }

    return { toUpload, toDownload, toDelete, conflicts };
  }

  /**
   * Merge two workspace metadata (for conflict resolution)
   */
  static mergeMetadata(
    local: WorkspaceMetadata,
    remote: WorkspaceMetadata,
    strategy: 'local' | 'remote' | 'newest'
  ): WorkspaceMetadata {
    if (strategy === 'local') {
      return local;
    }

    if (strategy === 'remote') {
      return remote;
    }

    // Newest strategy: keep files with latest timestamp
    const mergedFiles = new Map<string, FileMetadata>();

    // Add all local files
    for (const file of local.files) {
      mergedFiles.set(file.path, file);
    }

    // Merge with remote files
    for (const remoteFile of remote.files) {
      const localFile = mergedFiles.get(remoteFile.path);

      if (!localFile) {
        mergedFiles.set(remoteFile.path, remoteFile);
      } else {
        const localTime = new Date(localFile.lastModified).getTime();
        const remoteTime = new Date(remoteFile.lastModified).getTime();

        if (remoteTime > localTime) {
          mergedFiles.set(remoteFile.path, remoteFile);
        }
      }
    }

    return {
      ...local,
      files: Array.from(mergedFiles.values()),
      version: Math.max(local.version, remote.version) + 1,
      lastSyncAt: new Date().toISOString(),
    };
  }

  /**
   * Check if workspace needs sync
   */
  static needsSync(local: WorkspaceMetadata, remote: WorkspaceMetadata): boolean {
    if (local.checksum === remote.checksum) {
      return false;
    }

    const delta = this.calculateDelta(local, remote);
    return (
      delta.toUpload.length > 0 ||
      delta.toDownload.length > 0 ||
      delta.toDelete.length > 0 ||
      delta.conflicts.length > 0
    );
  }

  /**
   * Format sync summary for display
   */
  static formatSyncSummary(delta: {
    toUpload: FileMetadata[];
    toDownload: FileMetadata[];
    toDelete: string[];
    conflicts: Conflict[];
  }): string {
    const lines: string[] = [];

    if (delta.toUpload.length > 0) {
      lines.push(`↑ Upload: ${delta.toUpload.length} files`);
      delta.toUpload.forEach((f) => lines.push(`  + ${f.path}`));
    }

    if (delta.toDownload.length > 0) {
      lines.push(`↓ Download: ${delta.toDownload.length} files`);
      delta.toDownload.forEach((f) => lines.push(`  + ${f.path}`));
    }

    if (delta.toDelete.length > 0) {
      lines.push(`✕ Delete: ${delta.toDelete.length} files`);
      delta.toDelete.forEach((f) => lines.push(`  - ${f}`));
    }

    if (delta.conflicts.length > 0) {
      lines.push(`⚠ Conflicts: ${delta.conflicts.length} files`);
      delta.conflicts.forEach((c) => lines.push(`  ! ${c.path}`));
    }

    return lines.join('\n');
  }
}
