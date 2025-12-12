/**
 * ODAVL Phase P4 - File-Type System Integration with OMS Manifest
 * 
 * This module extends the manifest loader to support file-type overrides
 * and custom metadata definitions in odavl.yml.
 * 
 * Example manifest extension:
 * ```yaml
 * fileTypes:
 *   overrides:
 *     sourceCode:
 *       risk: medium  # Override default (high)
 *     customType:
 *       patterns: ['*.custom']
 *       risk: high
 *       usedBy: [insight, brain]
 *       description: "Custom file type"
 * ```
 */

import { FileType, FileTypeMetadata, DEFAULT_FILE_TYPE_METADATA } from '../filetypes/universal-types';
import { detectFileType, getFileTypeMetadata } from '../filetypes/file-type-detection';

/**
 * File Type Configuration from Manifest
 * 
 * Allows projects to customize file-type behavior via odavl.yml
 */
export interface FileTypeConfig {
  /**
   * Override default metadata for existing types
   * 
   * @example
   * overrides:
   *   sourceCode:
   *     risk: medium  # Make source code less risky for this project
   *   env:
   *     usedBy: [insight, autopilot, brain]  # Add autopilot
   */
  overrides?: Partial<Record<FileType, Partial<FileTypeMetadata>>>;

  /**
   * Custom file type patterns
   * 
   * Define project-specific file types
   * 
   * @example
   * customTypes:
   *   vendorCode:
   *     patterns: ['vendor/**\/*', 'third-party/**\/*']
   *     risk: low
   *     usedBy: [insight]
   *     description: "Third-party vendor code"
   */
  customTypes?: Record<
    string,
    {
      patterns: string[];
      risk: FileTypeMetadata['risk'];
      usedBy: FileTypeMetadata['usedBy'];
      description: string;
    }
  >;

  /**
   * Ignored patterns (never analyze)
   * 
   * @example
   * ignored: ['node_modules/**', '.git/**', 'dist/**']
   */
  ignored?: string[];
}

/**
 * File Type Registry
 * 
 * Manages file-type metadata with manifest overrides applied.
 * Singleton pattern ensures consistent behavior across ODAVL.
 */
class FileTypeRegistry {
  private metadata: Record<string, FileTypeMetadata> = {};
  private config: FileTypeConfig | null = null;

  /**
   * Initialize registry with manifest config
   * 
   * @param config - File type configuration from odavl.yml
   */
  initialize(config: FileTypeConfig | null): void {
    try {
      this.config = config;
      this.metadata = { ...DEFAULT_FILE_TYPE_METADATA };

      // Apply overrides from manifest
      if (config?.overrides) {
        for (const [type, override] of Object.entries(config.overrides)) {
          if (this.metadata[type]) {
            this.metadata[type] = {
              ...this.metadata[type],
              ...override,
            };
          }
        }
      }

      // TODO: Phase P5 - Implement custom type registration
      // Currently we use default 20 types only
      if (config?.customTypes) {
        console.warn('[FileTypeRegistry] ⚠️ Custom types not yet supported (Phase P5)');
      }
    } catch (error) {
      console.error('[FileTypeRegistry] ❌ Initialization failed:', error);
      // Fail-safe: use defaults
      this.metadata = { ...DEFAULT_FILE_TYPE_METADATA };
    }
  }

  /**
   * Get metadata for a file type (with manifest overrides applied)
   * 
   * @param type - File type to query
   * @returns Metadata with overrides applied
   */
  getMetadata(type: FileType): FileTypeMetadata {
    try {
      return this.metadata[type] || DEFAULT_FILE_TYPE_METADATA[type];
    } catch (error) {
      console.error(`[FileTypeRegistry] ❌ Error getting metadata for ${type}:`, error);
      return DEFAULT_FILE_TYPE_METADATA[type];
    }
  }

  /**
   * Check if a file should be ignored
   * 
   * @param filePath - File path to check
   * @returns true if file should be ignored
   */
  shouldIgnore(filePath: string): boolean {
    try {
      if (!this.config?.ignored) {
        return false;
      }

      // TODO: Phase P5 - Implement micromatch check
      // For now, basic string matching
      return this.config.ignored.some((pattern) =>
        filePath.includes(pattern.replace(/\*\*/g, '').replace(/\*/g, ''))
      );
    } catch (error) {
      console.error('[FileTypeRegistry] ❌ Error checking ignore pattern:', error);
      return false; // Fail-safe: don't ignore
    }
  }

  /**
   * Get all registered types
   * 
   * @returns Array of all file types (including custom types in P5)
   */
  getAllTypes(): FileType[] {
    return Object.keys(this.metadata) as FileType[];
  }

  /**
   * Reset to defaults (useful for testing)
   */
  reset(): void {
    this.metadata = { ...DEFAULT_FILE_TYPE_METADATA };
    this.config = null;
  }
}

// Singleton instance
export const fileTypeRegistry = new FileTypeRegistry();

/**
 * Load File Type Configuration from Manifest
 * 
 * Called by manifest loader during initialization.
 * Applies project-specific file-type customizations.
 * 
 * @param manifest - Parsed odavl.yml manifest
 */
export function loadFileTypeConfig(manifest: any): void {
  try {
    const fileTypeConfig: FileTypeConfig | null = manifest?.fileTypes || null;

    // Initialize registry with config
    fileTypeRegistry.initialize(fileTypeConfig);

    if (fileTypeConfig) {
      console.log('[FileTypeLoader] ✓ File-type configuration loaded');

      if (fileTypeConfig.overrides) {
        const overrideCount = Object.keys(fileTypeConfig.overrides).length;
        console.log(`[FileTypeLoader] ✓ Applied ${overrideCount} type overrides`);
      }

      if (fileTypeConfig.ignored) {
        console.log(`[FileTypeLoader] ✓ Ignoring ${fileTypeConfig.ignored.length} patterns`);
      }
    } else {
      console.log('[FileTypeLoader] ✓ Using default file-type configuration');
    }

    // TODO: Audit - Track file-type config loading for compliance
  } catch (error) {
    console.error('[FileTypeLoader] ❌ Error loading file-type config:', error);
    // Fail-safe: use defaults
    fileTypeRegistry.reset();
  }
}

/**
 * Get File Type Metadata (with manifest overrides)
 * 
 * Public API for getting file-type metadata.
 * Uses registry which has manifest overrides applied.
 * 
 * @param type - File type to query
 * @returns Metadata (risk, usedBy, description)
 */
export function getFileTypeMetadataWithOverrides(type: FileType): FileTypeMetadata {
  return fileTypeRegistry.getMetadata(type);
}

/**
 * Detect File Type (with ignore patterns)
 * 
 * Wrapper around detectFileType that respects manifest ignore patterns.
 * 
 * @param filePath - File path to classify
 * @returns FileType or null if ignored
 */
export function detectFileTypeWithIgnores(filePath: string): FileType | null {
  try {
    // Check if file should be ignored
    if (fileTypeRegistry.shouldIgnore(filePath)) {
      return null;
    }

    // Detect file type
    return detectFileType(filePath);
  } catch (error) {
    console.error(`[FileTypeLoader] ❌ Error detecting type for ${filePath}:`, error);
    return null;
  }
}
