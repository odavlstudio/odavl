/**
 * Local Storage Adapter
 */
import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { Package } from '../models/package.js';
import { cloudLogger, formatError } from '../../shared/utils/index.js';

export class LocalStorageAdapter {
  private basePath = '.odavl/marketplace/packages';

  async save(pkg: Package): Promise<void> {
    try {
      await fs.mkdir(this.basePath, { recursive: true });
      const filePath = path.join(this.basePath, `${pkg.id}.json`);
      await fs.writeFile(filePath, JSON.stringify(pkg, null, 2), 'utf8');
      cloudLogger('info', 'Package saved to local storage', { id: pkg.id });
    } catch (error: unknown) {
      cloudLogger('error', 'Failed to save package', { error: formatError(error) });
      throw error;
    }
  }

  async load(packageId: string): Promise<Package | null> {
    try {
      const filePath = path.join(this.basePath, `${packageId}.json`);
      const content = await fs.readFile(filePath, 'utf8');
      return JSON.parse(content) as Package;
    } catch {
      return null;
    }
  }

  async exists(packageId: string): Promise<boolean> {
    try {
      const filePath = path.join(this.basePath, `${packageId}.json`);
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  async delete(packageId: string): Promise<void> {
    const filePath = path.join(this.basePath, `${packageId}.json`);
    await fs.unlink(filePath);
  }
}
