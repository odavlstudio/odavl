/**
 * ODAVL Manifest Module
 * 
 * Provides access to the ODAVL Manifest (OMS v1.0) for all products
 * Insight, Autopilot, Guardian, and Brain can import this to read configuration
 */

export * from './types.js';
export {
  manifest,
  loadManifest,
  loadManifestSync,
  clearManifestCache,
  getWorkspaceRoot,
  getManifestPath,
  getSchemaPath,
  ManifestValidationError,
} from './loader.js';
