/**
 * Package Model
 */

export type PackageType = 'detector' | 'recipe' | 'rule' | 'model';

export interface Package {
  id: string;
  name: string;
  version: string;
  type: PackageType;
  author: string;
  description: string;
  manifest: PackageManifest;
  createdAt: string;
  updatedAt: string;
}

export interface PackageManifest {
  name: string;
  version: string;
  type: PackageType;
  entry: string;
  dependencies?: Record<string, string>;
  metadata?: Record<string, unknown>;
}

export interface PublishRequest {
  name: string;
  type: PackageType;
  path: string;
  author: string;
  description: string;
}

export interface PublishResult {
  success: boolean;
  packageId?: string;
  errors?: string[];
}
