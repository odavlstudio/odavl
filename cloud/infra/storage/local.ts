/**
 * Local filesystem storage adapter
 */
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { BaseStorage } from './index.js';
import type { StorageResult } from './types.js';
import { formatError } from '../../shared/utils/index.js';

export class LocalStorage extends BaseStorage {
  async write(key: string, data: string): Promise<StorageResult> {
    this.logOperation('write', key);
    try {
      const filePath = path.join(this.config.basePath || '.', key);
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      await fs.writeFile(filePath, data, 'utf8');
      return { success: true };
    } catch (error: unknown) {
      return { success: false, error: formatError(error) };
    }
  }

  async read(key: string): Promise<StorageResult> {
    this.logOperation('read', key);
    try {
      const filePath = path.join(this.config.basePath || '.', key);
      const data = await fs.readFile(filePath, 'utf8');
      return { success: true, data };
    } catch (error: unknown) {
      return { success: false, error: formatError(error) };
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const filePath = path.join(this.config.basePath || '.', key);
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }
}
