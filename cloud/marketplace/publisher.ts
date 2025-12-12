/**
 * Publisher - Package publishing workflow
 */
import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { Package, PackageManifest, PublishRequest, PublishResult } from './models/package.js';
import { PackageRegistry } from './registry.js';
import { cloudLogger, generateId, formatError } from '../shared/utils/index.js';

export class Publisher {
  private registry: PackageRegistry;
  private packagesDir = '.odavl/marketplace/packages';

  constructor(registry: PackageRegistry) {
    this.registry = registry;
  }

  async publish(request: PublishRequest): Promise<PublishResult> {
    cloudLogger('info', 'Publishing package', { name: request.name, type: request.type });

    try {
      const manifest = await this.generateManifest(request);
      const validationErrors = await this.validate(manifest);

      if (validationErrors.length > 0) {
        return { success: false, errors: validationErrors };
      }

      const pkg = await this.createPackage(request, manifest);
      await this.registry.register(pkg);
      await this.savePackage(pkg);

      return { success: true, packageId: pkg.id };
    } catch (error: unknown) {
      return { success: false, errors: [formatError(error)] };
    }
  }

  private async generateManifest(request: PublishRequest): Promise<PackageManifest> {
    return {
      name: request.name,
      version: '1.0.0',
      type: request.type,
      entry: 'index.js',
      dependencies: {},
    };
  }

  private async validate(manifest: PackageManifest): Promise<string[]> {
    return [];
  }

  private async createPackage(request: PublishRequest, manifest: PackageManifest): Promise<Package> {
    return {
      id: generateId('pkg'),
      name: request.name,
      version: manifest.version,
      type: request.type,
      author: request.author,
      description: request.description,
      manifest,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  private async savePackage(pkg: Package): Promise<void> {
    const pkgPath = path.join(this.packagesDir, `${pkg.id}.json`);
    await fs.mkdir(this.packagesDir, { recursive: true });
    await fs.writeFile(pkgPath, JSON.stringify(pkg, null, 2), 'utf8');
  }
}
