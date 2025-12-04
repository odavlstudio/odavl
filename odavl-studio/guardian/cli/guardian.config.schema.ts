/**
 * @file guardian.config.schema.ts
 * @description JSON Schema for Guardian configuration
 * @version 1.0.0
 * 
 * This schema defines the structure for guardian.config.json,
 * allowing users to customize:
 * - Product graph (criticality scores, dependencies)
 * - Performance settings (cache size, TTL)
 * - Impact thresholds
 * - Custom products and plugins
 */

export interface GuardianConfig {
  /**
   * Configuration version (for migration)
   */
  version: string;
  
  /**
   * Product graph customization
   */
  products?: {
    /**
     * Override criticality scores (0-100)
     */
    criticalityScores?: Record<string, number>;
    
    /**
     * Add custom products
     */
    custom?: CustomProduct[];
    
    /**
     * Auto-discover from pnpm-workspace.yaml
     */
    autoDiscover?: {
      enabled: boolean;
      workspaceFile?: string;
      defaultCriticality?: number;
    };
  };
  
  /**
   * Performance settings
   */
  performance?: {
    /**
     * Impact analysis cache
     */
    impactCache?: {
      maxSize?: number;
      ttlMinutes?: number;
    };
    
    /**
     * Similarity cache
     */
    similarityCache?: {
      maxSize?: number;
    };
    
    /**
     * Correlation settings
     */
    correlation?: {
      /**
       * Timeout for large error sets (ms)
       */
      timeout?: number;
      
      /**
       * Max errors to correlate at once
       */
      maxErrors?: number;
    };
  };
  
  /**
   * Impact thresholds
   */
  thresholds?: {
    /**
     * Severity thresholds
     */
    severity?: {
      low?: number;
      medium?: number;
      high?: number;
      critical?: number;
    };
    
    /**
     * Confidence thresholds
     */
    confidence?: {
      minimum?: number;
      warning?: number;
    };
  };
  
  /**
   * Plugin system
   */
  plugins?: {
    /**
     * Custom detectors
     */
    detectors?: string[];
    
    /**
     * Custom analyzers
     */
    analyzers?: string[];
    
    /**
     * Hooks
     */
    hooks?: {
      beforeAnalysis?: string;
      afterAnalysis?: string;
      onError?: string;
    };
  };
  
  /**
   * Dashboard settings
   */
  dashboard?: {
    /**
     * Port for local server
     */
    port?: number;
    
    /**
     * Auto-open browser
     */
    autoOpen?: boolean;
    
    /**
     * Theme
     */
    theme?: 'light' | 'dark' | 'auto';
  };
}

/**
 * Custom product definition
 */
export interface CustomProduct {
  /**
   * Unique product identifier
   */
  id: string;
  
  /**
   * Product name
   */
  name: string;
  
  /**
   * Directory path (relative to workspace root)
   */
  directory: string;
  
  /**
   * Dependencies (product IDs)
   */
  dependencies?: string[];
  
  /**
   * Consumers (product IDs)
   */
  consumers?: string[];
  
  /**
   * Description
   */
  description?: string;
  
  /**
   * Criticality score (0-100)
   */
  criticalityScore?: number;
}

/**
 * Default configuration
 */
export const DEFAULT_CONFIG: GuardianConfig = {
  version: '1.0.0',
  
  products: {
    criticalityScores: {},
    custom: [],
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
    correlation: {
      timeout: 30000, // 30 seconds
      maxErrors: 1000,
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
  
  plugins: {
    detectors: [],
    analyzers: [],
    hooks: {},
  },
  
  dashboard: {
    port: 3333,
    autoOpen: true,
    theme: 'auto',
  },
};

/**
 * Constants (replaced magic numbers)
 */
export const CONSTANTS = {
  // Cache settings
  DEFAULT_CACHE_SIZE: 100,
  DEFAULT_CACHE_TTL_MINUTES: 15,
  DEFAULT_SIMILARITY_CACHE_SIZE: 1000,
  
  // Performance limits
  MAX_CASCADE_DEPTH: 5,
  MAX_ERRORS_TO_CORRELATE: 1000,
  CORRELATION_TIMEOUT_MS: 30000,
  
  // Severity thresholds (0-100)
  SEVERITY_LOW: 25,
  SEVERITY_MEDIUM: 50,
  SEVERITY_HIGH: 75,
  SEVERITY_CRITICAL: 90,
  
  // Confidence thresholds (0-100)
  CONFIDENCE_MINIMUM: 30,
  CONFIDENCE_WARNING: 50,
  CONFIDENCE_HIGH: 70,
  CONFIDENCE_EXCELLENT: 90,
  
  // Default criticality scores
  DEFAULT_CRITICALITY: 50,
  CORE_PRODUCT_CRITICALITY: 95,
  ENGINE_PRODUCT_CRITICALITY: 90,
  CLI_PRODUCT_CRITICALITY: 80,
  DASHBOARD_PRODUCT_CRITICALITY: 70,
  EXTENSION_PRODUCT_CRITICALITY: 65,
  
  // Impact weights
  DIRECT_DEPENDENCY_WEIGHT: 1.0,
  API_CONSUMER_WEIGHT: 0.9,
  DATA_CONSUMER_WEIGHT: 0.7,
  WORKFLOW_TRIGGER_WEIGHT: 0.6,
  SHARED_TYPES_WEIGHT: 0.5,
  INDIRECT_WEIGHT: 0.3,
  
  // Dashboard
  DEFAULT_DASHBOARD_PORT: 3333,
  DASHBOARD_UPDATE_INTERVAL_MS: 5000,
};
