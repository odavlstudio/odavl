/**
 * Local Filesystem Provider (for testing)
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import type { StorageConfig } from '../types';

export class LocalProvider {
  private basePath: string;

  constructor(config: StorageConfig) {
    // Use temp directory if not specified
    this.basePath = config.bucket || path.join(process.cwd(), '.odavl-storage');
  }

  async upload(
    key: string,
    data: Buffer,
    metadata?: Record<string, string>
  ): Promise<void> {
    const filePath = path.join(this.basePath, key);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, data);

    // Save metadata separately
    if (metadata) {
      await fs.writeFile(
        `${filePath}.metadata.json`,
        JSON.stringify(metadata, null, 2)
      );
    }
  }

  async download(key: string): Promise<Buffer> {
    const filePath = path.join(this.basePath, key);
    return await fs.readFile(filePath);
  }

  async delete(key: string): Promise<void> {
    const filePath = path.join(this.basePath, key);
    await fs.unlink(filePath).catch(() => {});
    await fs.unlink(`${filePath}.metadata.json`).catch(() => {});
  }

  async listKeys(prefix: string): Promise<string[]> {
    const prefixPath = path.join(this.basePath, prefix);
    const keys: string[] = [];

    async function scan(dir: string, baseDir: string) {
      try {
        const entries = await fs.readdir(dir, { withFileTypes: true });

        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          
          if (entry.isDirectory()) {
            await scan(fullPath, baseDir);
          } else if (!entry.name.endsWith('.metadata.json')) {
            const relativePath = path.relative(baseDir, fullPath);
            keys.push(relativePath.replace(/\\/g, '/'));
          }
        }
      } catch {
        // Directory doesn't exist yet
      }
    }

    await scan(prefixPath, this.basePath);
    return keys.map((k) => path.join(prefix, k).replace(/\\/g, '/'));
  }

  async deletePrefix(prefix: string): Promise<void> {
    const prefixPath = path.join(this.basePath, prefix);
    await fs.rm(prefixPath, { recursive: true, force: true });
  }
}
