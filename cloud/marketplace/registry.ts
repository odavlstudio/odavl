/**
 * Package Registry Engine
 */
import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { Package } from './models/package.js';
import { cloudLogger, formatError } from '../shared/utils/index.js';

export class PackageRegistry {
  private registryPath = '.odavl/marketplace/registry.json';
  private packages: Map<string, Package> = new Map();

  async register(pkg: Package): Promise<void> {
    cloudLogger('info', 'Registering package', { id: pkg.id, name: pkg.name });
    this.packages.set(pkg.id, pkg);
    await this.persist();
  }

  async get(id: string): Promise<Package | null> {
    await this.load();
    return this.packages.get(id) || null;
  }

  async list(): Promise<Package[]> {
    await this.load();
    return Array.from(this.packages.values());
  }

  async search(query: string): Promise<Package[]> {
    await this.load();
    return Array.from(this.packages.values()).filter(
      (pkg) => pkg.name.includes(query) || pkg.description.includes(query)
    );
  }

  private async persist(): Promise<void> {
    try {
      await fs.mkdir(path.dirname(this.registryPath), { recursive: true });
      const data = JSON.stringify(Array.from(this.packages.entries()), null, 2);
      await fs.writeFile(this.registryPath, data, 'utf8');
    } catch (error: unknown) {
      cloudLogger('error', 'Registry persist failed', { error: formatError(error) });
    }
  }

  private async load(): Promise<void> {
    try {
      const content = await fs.readFile(this.registryPath, 'utf8');
      this.packages = new Map(JSON.parse(content));
    } catch {
      // Registry doesn't exist yet
    }
  }
}
