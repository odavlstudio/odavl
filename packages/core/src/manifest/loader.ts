/**
 * ODAVL Manifest Loader
 * 
 * Loads and validates .odavl/manifest.yml against manifest.schema.json
 * Provides a singleton cached instance for the entire application.
 * 
 * Usage:
 *   import { manifest, loadManifest } from '@odavl/core/manifest';
 *   
 *   // Access manifest (auto-loads on first access)
 *   console.log(manifest.project.name);
 *   
 *   // Explicitly reload manifest
 *   const reloaded = await loadManifest({ force: true });
 */

import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse as parseYAML } from 'yaml';
import Ajv, { type ValidateFunction } from 'ajv';
import addFormats from 'ajv-formats';
import type { ODAVLManifest } from './types.js';

// Get workspace root (search upwards for .odavl directory)
function findWorkspaceRoot(): string {
  let currentDir = process.cwd();
  
  // Try up to 10 levels up
  for (let i = 0; i < 10; i++) {
    const odavlPath = resolve(currentDir, '.odavl');
    if (existsSync(odavlPath)) {
      return currentDir;
    }
    
    const parentDir = resolve(currentDir, '..');
    if (parentDir === currentDir) {
      break; // Reached filesystem root
    }
    currentDir = parentDir;
  }
  
  throw new Error(
    'Could not find workspace root. Expected .odavl/ directory in project root.'
  );
}

// Paths
const WORKSPACE_ROOT = findWorkspaceRoot();
const MANIFEST_PATH = resolve(WORKSPACE_ROOT, '.odavl', 'manifest.yml');
const SCHEMA_PATH = resolve(WORKSPACE_ROOT, '.odavl', 'schemas', 'manifest.schema.json');

// Cache
let cachedManifest: ODAVLManifest | null = null;
let validator: ValidateFunction | null = null;

/**
 * Validation Error Class
 */
export class ManifestValidationError extends Error {
  constructor(
    message: string,
    public errors: Array<{ path: string; message: string; value?: unknown }>
  ) {
    super(message);
    this.name = 'ManifestValidationError';
  }

  toString(): string {
    const errorList = this.errors
      .map((err) => `  - ${err.path}: ${err.message}${err.value !== undefined ? ` (got: ${JSON.stringify(err.value)})` : ''}`)
      .join('\n');
    return `${this.message}\n${errorList}`;
  }
}

/**
 * Load JSON Schema and create validator
 */
function getValidator(): ValidateFunction {
  if (validator) {
    return validator;
  }

  if (!existsSync(SCHEMA_PATH)) {
    throw new Error(
      `Manifest schema not found at ${SCHEMA_PATH}. Run 'pnpm build' to generate schemas.`
    );
  }

  const schemaContent = readFileSync(SCHEMA_PATH, 'utf-8');
  const schema = JSON.parse(schemaContent);

  const ajv = new Ajv({
    allErrors: true,
    verbose: true,
    strict: false,
  });
  
  // Add format validators (date, uri, etc.)
  addFormats(ajv);

  validator = ajv.compile(schema);
  return validator;
}

/**
 * Format Ajv validation errors into readable format
 */
function formatValidationErrors(errors: Array<any>): Array<{ path: string; message: string; value?: unknown }> {
  return errors.map((err) => ({
    path: err.instancePath || err.schemaPath || 'root',
    message: err.message || 'validation failed',
    value: err.data,
  }));
}

/**
 * Load and validate the ODAVL manifest
 * 
 * @param options.force - Force reload even if cached
 * @returns Validated manifest object
 * @throws {ManifestValidationError} If validation fails
 * @throws {Error} If manifest file not found
 */
export async function loadManifest(options: { force?: boolean } = {}): Promise<ODAVLManifest> {
  // Return cached manifest unless forced
  if (cachedManifest && !options.force) {
    return cachedManifest;
  }

  // Check manifest exists
  if (!existsSync(MANIFEST_PATH)) {
    throw new Error(
      `Manifest not found at ${MANIFEST_PATH}. Create .odavl/manifest.yml to configure ODAVL products.`
    );
  }

  // Load YAML
  const manifestContent = readFileSync(MANIFEST_PATH, 'utf-8');
  const manifestData = parseYAML(manifestContent);

  // Validate against schema
  const validate = getValidator();
  const isValid = validate(manifestData);

  if (!isValid && validate.errors) {
    const formattedErrors = formatValidationErrors(validate.errors);
    throw new ManifestValidationError(
      'Manifest validation failed against OMS v1.0 schema',
      formattedErrors
    );
  }

  // Cache and return
  cachedManifest = manifestData as ODAVLManifest;
  return cachedManifest;
}

/**
 * Synchronous manifest loader (for initialization)
 * Uses cached manifest if available, otherwise loads synchronously.
 * 
 * @throws {ManifestValidationError} If validation fails
 * @throws {Error} If manifest file not found
 */
export function loadManifestSync(options: { force?: boolean } = {}): ODAVLManifest {
  // Return cached manifest unless forced
  if (cachedManifest && !options.force) {
    return cachedManifest;
  }

  // Check manifest exists
  if (!existsSync(MANIFEST_PATH)) {
    throw new Error(
      `Manifest not found at ${MANIFEST_PATH}. Create .odavl/manifest.yml to configure ODAVL products.`
    );
  }

  // Load YAML
  const manifestContent = readFileSync(MANIFEST_PATH, 'utf-8');
  const manifestData = parseYAML(manifestContent);

  // Validate against schema
  const validate = getValidator();
  const isValid = validate(manifestData);

  if (!isValid && validate.errors) {
    const formattedErrors = formatValidationErrors(validate.errors);
    throw new ManifestValidationError(
      'Manifest validation failed against OMS v1.0 schema',
      formattedErrors
    );
  }

  // Cache and return
  cachedManifest = manifestData as ODAVLManifest;
  return cachedManifest;
}

/**
 * Clear manifest cache (useful for testing)
 */
export function clearManifestCache(): void {
  cachedManifest = null;
  validator = null;
}

/**
 * Singleton manifest accessor
 * Lazily loads the manifest on first access
 */
class ManifestAccessor {
  private _manifest: ODAVLManifest | null = null;

  get value(): ODAVLManifest {
    if (!this._manifest) {
      this._manifest = loadManifestSync();
    }
    return this._manifest;
  }

  // Proxy all manifest properties
  get project() {
    return this.value.project;
  }

  get fileTaxonomy() {
    return this.value.fileTaxonomy;
  }

  get insight() {
    return this.value.insight;
  }

  get autopilot() {
    return this.value.autopilot;
  }

  get guardian() {
    return this.value.guardian;
  }

  get brain() {
    return this.value.brain;
  }

  get overrides() {
    return this.value.overrides;
  }

  get version() {
    return this.value.version;
  }

  get schemaVersion() {
    return this.value.schemaVersion;
  }

  /**
   * Reload manifest from disk
   */
  reload(): void {
    this._manifest = loadManifestSync({ force: true });
  }
}

/**
 * Singleton manifest instance
 * Use this for easy access throughout the application
 * 
 * @example
 * ```ts
 * import { manifest } from '@odavl/core/manifest';
 * 
 * console.log(manifest.project.name);
 * console.log(manifest.autopilot?.riskBudget?.maxFiles);
 * ```
 */
export const manifest = new ManifestAccessor();

/**
 * Get workspace root path
 */
export function getWorkspaceRoot(): string {
  return WORKSPACE_ROOT;
}

/**
 * Get manifest file path
 */
export function getManifestPath(): string {
  return MANIFEST_PATH;
}

/**
 * Get schema file path
 */
export function getSchemaPath(): string {
  return SCHEMA_PATH;
}
