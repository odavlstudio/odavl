/**
 * @file config-loader.ts
 * @description Dynamic configuration loader for Guardian
 * @version 1.0.0
 * 
 * Features:
 * - Load guardian.config.json from workspace root
 * - Auto-discover products from pnpm-workspace.yaml
 * - Merge with default configuration
 * - Validate and apply overrides
 * - Hot-reload on config changes
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import * as yaml from 'js-yaml';
import type { GuardianConfig, CustomProduct } from './guardian.config.schema';
import { DEFAULT_CONFIG, CONSTANTS } from './guardian.config.schema';
import type { ODAVLProduct, ProductMetadata } from './impact-analyzer';

/**
 * Configuration loader with auto-discovery
 */
export class ConfigLoader {
  private config: GuardianConfig;
  private workspaceRoot: string;
  private discoveredProducts: ProductMetadata[] = [];
  
  constructor(workspaceRoot: string) {
    this.workspaceRoot = workspaceRoot;
    this.config = { ...DEFAULT_CONFIG };
  }
  
  /**
   * Load configuration from file
   */
  async load(): Promise<GuardianConfig> {
    const configPath = path.join(this.workspaceRoot, 'guardian.config.json');
    
    try {
      const exists = await fs.access(configPath).then(() => true).catch(() => false);
      
      if (exists) {
        const content = await fs.readFile(configPath, 'utf-8');
        const userConfig = JSON.parse(content) as Partial<GuardianConfig>;
        
        // Deep merge with defaults
        this.config = this.mergeConfig(DEFAULT_CONFIG, userConfig);
        
        console.log('✅ Loaded guardian.config.json');
      } else {
        console.log('ℹ️  Using default configuration (guardian.config.json not found)');
      }
    } catch (error) {
      console.warn('⚠️  Failed to load config:', (error as Error).message);
      console.log('ℹ️  Using default configuration');
    }
    
    // Auto-discover products if enabled
    if (this.config.products?.autoDiscover?.enabled) {
      await this.autoDiscoverProducts();
    }
    
    return this.config;
  }
  
  /**
   * Auto-discover products from pnpm-workspace.yaml
   */
  private async autoDiscoverProducts(): Promise<void> {
    const workspaceFile = this.config.products?.autoDiscover?.workspaceFile || 'pnpm-workspace.yaml';
    const workspacePath = path.join(this.workspaceRoot, workspaceFile);
    
    try {
      const exists = await fs.access(workspacePath).then(() => true).catch(() => false);
      
      if (!exists) {
        console.log('ℹ️  pnpm-workspace.yaml not found, skipping auto-discovery');
        return;
      }
      
      const content = await fs.readFile(workspacePath, 'utf-8');
      const workspace = yaml.load(content) as { packages?: string[] };
      
      if (!workspace.packages) {
        console.log('ℹ️  No packages found in pnpm-workspace.yaml');
        return;
      }
      
      // Discover products from workspace patterns
      const products: ProductMetadata[] = [];
      const defaultCriticality = this.config.products?.autoDiscover?.defaultCriticality || CONSTANTS.DEFAULT_CRITICALITY;
      
      for (const pattern of workspace.packages) {
        // Simple pattern matching (expand globs manually)
        const cleanPattern = pattern.replace(/\/\*+$/, '');
        
        try {
          const entries = await fs.readdir(path.join(this.workspaceRoot, cleanPattern), { withFileTypes: true });
          
          for (const entry of entries) {
            if (entry.isDirectory() && !entry.name.startsWith('.')) {
              const productDir = path.join(cleanPattern, entry.name);
              const packageJsonPath = path.join(this.workspaceRoot, productDir, 'package.json');
              
              try {
                const pkgExists = await fs.access(packageJsonPath).then(() => true).catch(() => false);
                
                if (pkgExists) {
                  const pkg = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));
                  
                  products.push({
                    product: pkg.name?.replace('@odavl-studio/', '') || entry.name as ODAVLProduct,
                    directory: productDir,
                    dependencies: this.extractDependencies(pkg),
                    consumers: [],
                    description: pkg.description || 'Discovered from workspace',
                    criticalityScore: this.getCriticalityScore(entry.name, defaultCriticality),
                  });
                }
              } catch {
                // Skip if package.json is invalid
              }
            }
          }
        } catch {
          // Skip if directory doesn't exist
        }
      }
      
      this.discoveredProducts = products;
      console.log(`✅ Auto-discovered ${products.length} products from workspace`);
      
    } catch (error) {
      console.warn('⚠️  Failed to auto-discover products:', (error as Error).message);
    }
  }
  
  /**
   * Extract ODAVL dependencies from package.json
   */
  private extractDependencies(pkg: any): ODAVLProduct[] {
    const deps: ODAVLProduct[] = [];
    const allDeps = {
      ...pkg.dependencies,
      ...pkg.devDependencies,
      ...pkg.peerDependencies,
    };
    
    for (const dep of Object.keys(allDeps)) {
      if (dep.startsWith('@odavl-studio/')) {
        const name = dep.replace('@odavl-studio/', '');
        deps.push(name as ODAVLProduct);
      }
    }
    
    return deps;
  }
  
  /**
   * Get criticality score for a product
   */
  private getCriticalityScore(name: string, defaultScore: number): number {
    // Check user overrides
    const override = this.config.products?.criticalityScores?.[name];
    if (override !== undefined) return override;
    
    // Smart defaults based on naming conventions
    if (name.includes('core')) return CONSTANTS.CORE_PRODUCT_CRITICALITY;
    if (name.includes('engine')) return CONSTANTS.ENGINE_PRODUCT_CRITICALITY;
    if (name.includes('cli')) return CONSTANTS.CLI_PRODUCT_CRITICALITY;
    if (name.includes('app') || name.includes('dashboard')) return CONSTANTS.DASHBOARD_PRODUCT_CRITICALITY;
    if (name.includes('extension')) return CONSTANTS.EXTENSION_PRODUCT_CRITICALITY;
    
    return defaultScore;
  }
  
  /**
   * Get discovered products
   */
  getDiscoveredProducts(): ProductMetadata[] {
    return this.discoveredProducts;
  }
  
  /**
   * Get configuration value
   */
  get<K extends keyof GuardianConfig>(key: K): GuardianConfig[K] {
    return this.config[key];
  }
  
  /**
   * Get performance settings
   */
  getPerformanceSettings() {
    return {
      impactCacheMaxSize: this.config.performance?.impactCache?.maxSize || CONSTANTS.DEFAULT_CACHE_SIZE,
      impactCacheTTL: (this.config.performance?.impactCache?.ttlMinutes || CONSTANTS.DEFAULT_CACHE_TTL_MINUTES) * 60 * 1000,
      similarityCacheMaxSize: this.config.performance?.similarityCache?.maxSize || CONSTANTS.DEFAULT_SIMILARITY_CACHE_SIZE,
      correlationTimeout: this.config.performance?.correlation?.timeout || CONSTANTS.CORRELATION_TIMEOUT_MS,
      maxErrors: this.config.performance?.correlation?.maxErrors || CONSTANTS.MAX_ERRORS_TO_CORRELATE,
    };
  }
  
  /**
   * Get severity thresholds
   */
  getSeverityThresholds() {
    return {
      low: this.config.thresholds?.severity?.low || CONSTANTS.SEVERITY_LOW,
      medium: this.config.thresholds?.severity?.medium || CONSTANTS.SEVERITY_MEDIUM,
      high: this.config.thresholds?.severity?.high || CONSTANTS.SEVERITY_HIGH,
      critical: this.config.thresholds?.severity?.critical || CONSTANTS.SEVERITY_CRITICAL,
    };
  }
  
  /**
   * Get confidence thresholds
   */
  getConfidenceThresholds() {
    return {
      minimum: this.config.thresholds?.confidence?.minimum || CONSTANTS.CONFIDENCE_MINIMUM,
      warning: this.config.thresholds?.confidence?.warning || CONSTANTS.CONFIDENCE_WARNING,
      high: CONSTANTS.CONFIDENCE_HIGH,
      excellent: CONSTANTS.CONFIDENCE_EXCELLENT,
    };
  }
  
  /**
   * Deep merge configurations
   */
  private mergeConfig(base: GuardianConfig, override: Partial<GuardianConfig>): GuardianConfig {
    const merged = { ...base };
    
    for (const key in override) {
      const k = key as keyof GuardianConfig;
      const value = override[k];
      
      if (value !== undefined) {
        if (typeof value === 'object' && !Array.isArray(value) && value !== null) {
          merged[k] = { ...(base[k] as any), ...value } as any;
        } else {
          merged[k] = value as any;
        }
      }
    }
    
    return merged;
  }
  
  /**
   * Create example config file
   */
  async createExampleConfig(): Promise<void> {
    const exampleConfig: GuardianConfig = {
      version: '1.0.0',
      
      products: {
        criticalityScores: {
          'insight-core': 95,
          'autopilot-engine': 90,
          'guardian-cli': 80,
        },
        custom: [
          {
            id: 'my-custom-product',
            name: 'My Custom Product',
            directory: 'custom/my-product',
            dependencies: ['insight-core'],
            criticalityScore: 70,
            description: 'Custom product example',
          },
        ],
        autoDiscover: {
          enabled: true,
          workspaceFile: 'pnpm-workspace.yaml',
          defaultCriticality: 50,
        },
      },
      
      performance: {
        impactCache: {
          maxSize: 100,
          ttlMinutes: 15,
        },
        similarityCache: {
          maxSize: 1000,
        },
      },
      
      thresholds: {
        severity: {
          low: 25,
          medium: 50,
          high: 75,
          critical: 90,
        },
        confidence: {
          minimum: 30,
          warning: 50,
        },
      },
    };
    
    const configPath = path.join(this.workspaceRoot, 'guardian.config.example.json');
    await fs.writeFile(configPath, JSON.stringify(exampleConfig, null, 2), 'utf-8');
    
    console.log(`✅ Created guardian.config.example.json`);
  }
}
