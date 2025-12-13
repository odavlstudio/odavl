/**
 * Configuration Loader - Phase 4.1.7
 * 
 * Safe, validated config loading with:
 * - JSON schema validation via Zod
 * - Safe defaults when config missing/invalid
 * - Clear USER error attribution via InsightError
 * - Never crashes, always returns valid config
 * 
 * Config location: `.odavl/insight.config.json` (workspace root)
 */

import * as vscode from 'vscode';
import * as fs from 'fs/promises';
import * as path from 'path';
import { z } from 'zod';
import { InsightError } from './errors';
import { ErrorPresenter } from '../ui/error-presenter';

/**
 * Detector severity levels
 */
const SeveritySchema = z.enum(['critical', 'error', 'warning', 'info', 'hint']);

/**
 * Insight Extension Configuration Schema
 * 
 * Validated via Zod for type safety and runtime checking.
 */
const InsightExtensionConfigSchema = z.object({
  /**
   * Enabled detectors (empty = all enabled)
   */
  detectors: z.object({
    typescript: z.boolean().default(true),
    eslint: z.boolean().default(true),
    security: z.boolean().default(true),
    performance: z.boolean().default(true),
    complexity: z.boolean().default(true),
    import: z.boolean().default(true),
    circular: z.boolean().default(true),
    package: z.boolean().default(true),
    runtime: z.boolean().default(true),
    build: z.boolean().default(true),
    network: z.boolean().default(false), // Experimental
  }).default({}),
  
  /**
   * Severity overrides per detector (optional)
   */
  severityOverrides: z.record(z.string(), SeveritySchema).optional(),
  
  /**
   * Diagnostic limits (Phase 4.1.2)
   */
  diagnostics: z.object({
    maxPerFile: z.number().int().min(1).max(100).default(10),
    maxTotal: z.number().int().min(1).max(500).default(50),
  }).default({}),
  
  /**
   * Analysis mode preference
   */
  analysis: z.object({
    /**
     * Default mode: 'local' (privacy-first), 'cloud', or 'both'
     */
    defaultMode: z.enum(['local', 'cloud', 'both']).default('local'),
    
    /**
     * Auto-analyze on file save
     */
    autoAnalyzeOnSave: z.boolean().default(false),
    
    /**
     * Debounce delay for auto-analysis (ms)
     */
    autoAnalyzeDebounceMs: z.number().int().min(100).max(5000).default(500),
  }).default({}),
  
  /**
   * Cloud features (requires authentication)
   */
  cloud: z.object({
    /**
     * Enable cloud analysis
     */
    enabled: z.boolean().default(false),
    
    /**
     * Sync results to cloud
     */
    syncResults: z.boolean().default(false),
  }).default({}),
  
  /**
   * UI preferences
   */
  ui: z.object({
    /**
     * Show NEW/LEGACY issue distinction (Phase 4.1.3)
     */
    showNewIssues: z.boolean().default(true),
    
    /**
     * Show execution mode in status bar (Phase 4.1.4)
     */
    showExecutionMode: z.boolean().default(true),
  }).default({}),
});

/**
 * Validated extension configuration type
 */
export type InsightExtensionConfig = z.infer<typeof InsightExtensionConfigSchema>;

/**
 * Safe default configuration
 * 
 * Matches UX contract principles:
 * - Local-first (no cloud by default)
 * - Privacy-first (no auto-upload)
 * - Signal-to-noise (10/file, 50/total limits)
 */
export const DEFAULT_EXTENSION_CONFIG: InsightExtensionConfig = {
  detectors: {
    typescript: true,
    eslint: true,
    security: true,
    performance: true,
    complexity: true,
    import: true,
    circular: true,
    package: true,
    runtime: true,
    build: true,
    network: false, // Experimental
  },
  diagnostics: {
    maxPerFile: 10,
    maxTotal: 50,
  },
  analysis: {
    defaultMode: 'local',
    autoAnalyzeOnSave: false,
    autoAnalyzeDebounceMs: 500,
  },
  cloud: {
    enabled: false,
    syncResults: false,
  },
  ui: {
    showNewIssues: true,
    showExecutionMode: true,
  },
};

/**
 * Configuration Service
 * 
 * Handles loading, validation, and error attribution for extension config.
 */
export class ConfigService {
  private configCache = new Map<string, { config: InsightExtensionConfig; timestamp: number }>();
  private errorPresenter: ErrorPresenter;
  private outputChannel: vscode.OutputChannel;
  
  constructor(errorPresenter: ErrorPresenter, outputChannel: vscode.OutputChannel) {
    this.errorPresenter = errorPresenter;
    this.outputChannel = outputChannel;
  }
  
  /**
   * Load and validate configuration
   * 
   * Phase 4.1.7: Safe config loading with error attribution
   * 
   * @param workspaceRoot Workspace root path
   * @returns Validated config (defaults if missing/invalid)
   */
  async loadConfig(workspaceRoot: string): Promise<InsightExtensionConfig> {
    // Check cache (valid for 30 seconds)
    const cached = this.configCache.get(workspaceRoot);
    if (cached && Date.now() - cached.timestamp < 30000) {
      return cached.config;
    }
    
    const configPath = path.join(workspaceRoot, '.odavl', 'insight.config.json');
    
    try {
      // Check if config file exists
      const exists = await this.fileExists(configPath);
      
      if (!exists) {
        // No config file - use defaults (not an error)
        this.outputChannel.appendLine('[Config] No config file found, using defaults');
        const config = DEFAULT_EXTENSION_CONFIG;
        this.configCache.set(workspaceRoot, { config, timestamp: Date.now() });
        return config;
      }
      
      // Read and parse JSON
      const content = await fs.readFile(configPath, 'utf8');
      let parsed: unknown;
      
      try {
        parsed = JSON.parse(content);
      } catch (parseError) {
        // Invalid JSON - USER error
        const error = InsightError.invalidConfig(
          'Invalid JSON in .odavl/insight.config.json',
          'Fix JSON syntax errors or delete the file to use defaults'
        );
        
        await this.errorPresenter.present(error, 'Config Validation');
        
        this.outputChannel.appendLine(`[Config] JSON parse error: ${parseError}`);
        this.outputChannel.appendLine('[Config] Using defaults due to parse error');
        
        return DEFAULT_EXTENSION_CONFIG;
      }
      
      // Validate schema
      const result = InsightExtensionConfigSchema.safeParse(parsed);
      
      if (!result.success) {
        // Schema validation failed - USER error
        const validationError = this.formatZodError(result.error);
        
        const error = InsightError.invalidConfig(
          'Config does not match expected schema',
          'Check the config file format or delete it to use defaults'
        );
        
        await this.errorPresenter.present(error, 'Config Validation');
        
        this.outputChannel.appendLine('[Config] Schema validation failed:');
        this.outputChannel.appendLine(validationError);
        this.outputChannel.appendLine('[Config] Using defaults due to validation error');
        
        return DEFAULT_EXTENSION_CONFIG;
      }
      
      // Valid config - cache and return
      const config = result.data;
      this.configCache.set(workspaceRoot, { config, timestamp: Date.now() });
      
      this.outputChannel.appendLine('[Config] Loaded valid config from .odavl/insight.config.json');
      
      return config;
    } catch (error) {
      // File system error (permissions, etc.) - USER error
      const insightError = InsightError.fileSystemError(
        configPath,
        error instanceof Error ? error : undefined
      );
      
      await this.errorPresenter.present(insightError, 'Config Load');
      
      this.outputChannel.appendLine(`[Config] File system error: ${error}`);
      this.outputChannel.appendLine('[Config] Using defaults due to file access error');
      
      return DEFAULT_EXTENSION_CONFIG;
    }
  }
  
  /**
   * Get config synchronously from cache (if available)
   * 
   * @param workspaceRoot Workspace root path
   * @returns Cached config or defaults
   */
  getConfigSync(workspaceRoot: string): InsightExtensionConfig {
    const cached = this.configCache.get(workspaceRoot);
    return cached ? cached.config : DEFAULT_EXTENSION_CONFIG;
  }
  
  /**
   * Clear config cache (for testing or after manual config changes)
   */
  clearCache(): void {
    this.configCache.clear();
  }
  
  /**
   * Open config file in editor (for "Open config" action in error toast)
   */
  async openConfigFile(workspaceRoot: string): Promise<void> {
    const configPath = path.join(workspaceRoot, '.odavl', 'insight.config.json');
    
    try {
      const exists = await this.fileExists(configPath);
      
      if (!exists) {
        // Create template config file
        await this.createTemplateConfig(configPath);
      }
      
      const uri = vscode.Uri.file(configPath);
      await vscode.window.showTextDocument(uri);
    } catch (error) {
      this.outputChannel.appendLine(`[Config] Failed to open config file: ${error}`);
      vscode.window.showErrorMessage('Failed to open config file');
    }
  }
  
  /**
   * Create template config file with defaults
   */
  private async createTemplateConfig(configPath: string): Promise<void> {
    const template = JSON.stringify(DEFAULT_EXTENSION_CONFIG, null, 2);
    const dir = path.dirname(configPath);
    
    // Ensure .odavl directory exists
    await fs.mkdir(dir, { recursive: true });
    
    // Write template
    await fs.writeFile(configPath, template, 'utf8');
    
    this.outputChannel.appendLine(`[Config] Created template config at ${configPath}`);
  }
  
  /**
   * Check if file exists
   */
  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }
  
  /**
   * Format Zod validation errors for output channel
   */
  private formatZodError(error: z.ZodError): string {
    return error.errors
      .map(err => `  - ${err.path.join('.')}: ${err.message}`)
      .join('\n');
  }
}

/**
 * Create config service instance
 */
export function createConfigService(
  errorPresenter: ErrorPresenter,
  outputChannel: vscode.OutputChannel
): ConfigService {
  return new ConfigService(errorPresenter, outputChannel);
}
