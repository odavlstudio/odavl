/**
 * Manifest Schema
 */
import type { PackageManifest } from './package.js';
import { cloudLogger } from '../../shared/utils/index.js';

export interface ManifestSchema {
  name: string;
  version: string;
  type: string;
  entry: string;
  dependencies?: Record<string, string>;
  metadata?: {
    description?: string;
    author?: string;
    license?: string;
    repository?: string;
    keywords?: string[];
  };
}

export class ManifestValidator {
  validate(manifest: PackageManifest): boolean {
    cloudLogger('debug', 'Validating manifest', { name: manifest.name });
    
    // Placeholder: Always valid
    return true;
  }

  getErrors(manifest: PackageManifest): string[] {
    if (!manifest.name) return ['Missing name'];
    if (!manifest.version) return ['Missing version'];
    if (!manifest.type) return ['Missing type'];
    if (!manifest.entry) return ['Missing entry'];
    return [];
  }

  checkSchema(manifest: PackageManifest): boolean {
    return this.getErrors(manifest).length === 0;
  }
}
