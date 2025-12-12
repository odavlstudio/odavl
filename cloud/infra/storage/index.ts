/**
 * Storage abstraction layer for ODAVL Cloud
 * Supports local filesystem and future cloud providers (S3, Azure Blob, GCS)
 */
import type { StorageConfig, StorageResult } from './types.js';
import { cloudLogger, formatError } from '../../shared/utils/index.js';

export interface Storage {
  write(key: string, data: string): Promise<StorageResult>;
  read(key: string): Promise<StorageResult>;
  exists(key: string): Promise<boolean>;
}

export abstract class BaseStorage implements Storage {
  protected config: StorageConfig;

  constructor(config: StorageConfig) {
    this.config = config;
  }

  abstract write(key: string, data: string): Promise<StorageResult>;
  abstract read(key: string): Promise<StorageResult>;
  abstract exists(key: string): Promise<boolean>;

  protected logOperation(operation: string, key: string): void {
    cloudLogger('debug', `Storage ${operation}`, { key, provider: this.config.provider });
  }
}
