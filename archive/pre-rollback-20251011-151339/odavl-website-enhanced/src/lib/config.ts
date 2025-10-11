/**
 * ODAVL Enterprise Configuration Management
 * Type-safe configuration with environment validation and feature flags
 */

import { z } from 'zod';

// Environment schema validation
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  NEXT_PUBLIC_SITE_URL: z.string().url().default('http://localhost:3000'),
  NEXT_PUBLIC_APP_VERSION: z.string().default('0.1.0-enterprise'),
  
  // Analytics & Monitoring
  NEXT_PUBLIC_ANALYTICS_ID: z.string().optional(),
  NEXT_PUBLIC_SENTRY_DSN: z.string().optional(),
  NEXT_PUBLIC_VERCEL_ANALYTICS: z.boolean().default(false),
  
  // Feature Flags
  NEXT_PUBLIC_ENABLE_STORYBOOK: z.boolean().default(false),
  NEXT_PUBLIC_ENABLE_DEBUG_MODE: z.boolean().default(false),
  NEXT_PUBLIC_ENABLE_PERFORMANCE_MONITORING: z.boolean().default(true),
  NEXT_PUBLIC_ENABLE_A11Y_CHECKS: z.boolean().default(true),
  NEXT_PUBLIC_ENABLE_SECURITY_SCANNING: z.boolean().default(true),
  NEXT_PUBLIC_ENABLE_A11Y_AUDITING: z.boolean().default(true),
  
  // Guardian System
  NEXT_PUBLIC_GUARDIAN_ENABLED: z.boolean().default(true),
  NEXT_PUBLIC_GUARDIAN_STRICT_MODE: z.boolean().default(false),
  
  // Internationalization
  NEXT_PUBLIC_DEFAULT_LOCALE: z.string().default('en'),
  NEXT_PUBLIC_SUPPORTED_LOCALES: z.string().default('en,es,fr,de,it,pt,ru,ar,ja,zh'),
  
  // Security
  NEXT_PUBLIC_CSP_ENABLED: z.boolean().default(true),
  NEXT_PUBLIC_SECURITY_HEADERS: z.boolean().default(true),
  
  // Performance
  NEXT_PUBLIC_BUNDLE_ANALYZER: z.boolean().default(false),
  NEXT_PUBLIC_LIGHTHOUSE_CI: z.boolean().default(false),
});

// Runtime configuration type
export type AppConfig = z.infer<typeof envSchema>;

// Feature flags type
export interface FeatureFlags {
  storybook: boolean;
  debugMode: boolean;
  performanceMonitoring: boolean;
  a11yChecks: boolean;
  guardianEnabled: boolean;
  guardianStrictMode: boolean;
  cspEnabled: boolean;
  securityHeaders: boolean;
  bundleAnalyzer: boolean;
  lighthouseCI: boolean;
  vercelAnalytics: boolean;
  securityScanning: boolean;
  accessibilityAuditing: boolean;
  advancedAnalytics: boolean;
}

// Configuration class
export class EnterpriseConfig {
  private static instance: EnterpriseConfig;
  private config: AppConfig;
  private featureFlags: FeatureFlags;

  private constructor() {
    this.config = this.validateEnvironment();
    this.featureFlags = this.buildFeatureFlags();
  }

  public static getInstance(): EnterpriseConfig {
    if (!EnterpriseConfig.instance) {
      EnterpriseConfig.instance = new EnterpriseConfig();
    }
    return EnterpriseConfig.instance;
  }

  private validateEnvironment(): AppConfig {
    try {
      const env = {
        NODE_ENV: process.env.NODE_ENV,
        NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
        NEXT_PUBLIC_APP_VERSION: process.env.NEXT_PUBLIC_APP_VERSION,
        NEXT_PUBLIC_ANALYTICS_ID: process.env.NEXT_PUBLIC_ANALYTICS_ID,
        NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
        NEXT_PUBLIC_VERCEL_ANALYTICS: process.env.NEXT_PUBLIC_VERCEL_ANALYTICS === 'true',
        NEXT_PUBLIC_ENABLE_STORYBOOK: process.env.NEXT_PUBLIC_ENABLE_STORYBOOK === 'true',
        NEXT_PUBLIC_ENABLE_DEBUG_MODE: process.env.NEXT_PUBLIC_ENABLE_DEBUG_MODE === 'true',
        NEXT_PUBLIC_ENABLE_PERFORMANCE_MONITORING: process.env.NEXT_PUBLIC_ENABLE_PERFORMANCE_MONITORING !== 'false',
        NEXT_PUBLIC_ENABLE_A11Y_CHECKS: process.env.NEXT_PUBLIC_ENABLE_A11Y_CHECKS !== 'false',
        NEXT_PUBLIC_GUARDIAN_ENABLED: process.env.NEXT_PUBLIC_GUARDIAN_ENABLED !== 'false',
        NEXT_PUBLIC_GUARDIAN_STRICT_MODE: process.env.NEXT_PUBLIC_GUARDIAN_STRICT_MODE === 'true',
        NEXT_PUBLIC_DEFAULT_LOCALE: process.env.NEXT_PUBLIC_DEFAULT_LOCALE,
        NEXT_PUBLIC_SUPPORTED_LOCALES: process.env.NEXT_PUBLIC_SUPPORTED_LOCALES,
        NEXT_PUBLIC_CSP_ENABLED: process.env.NEXT_PUBLIC_CSP_ENABLED !== 'false',
        NEXT_PUBLIC_SECURITY_HEADERS: process.env.NEXT_PUBLIC_SECURITY_HEADERS !== 'false',
        NEXT_PUBLIC_BUNDLE_ANALYZER: process.env.NEXT_PUBLIC_BUNDLE_ANALYZER === 'true',
        NEXT_PUBLIC_LIGHTHOUSE_CI: process.env.NEXT_PUBLIC_LIGHTHOUSE_CI === 'true',
      };

      return envSchema.parse(env);
    } catch (error) {
      console.error('❌ Environment validation failed:', error);
      throw new Error('Invalid environment configuration');
    }
  }

  private buildFeatureFlags(): FeatureFlags {
    return {
      storybook: this.config.NEXT_PUBLIC_ENABLE_STORYBOOK,
      debugMode: this.config.NEXT_PUBLIC_ENABLE_DEBUG_MODE,
      performanceMonitoring: this.config.NEXT_PUBLIC_ENABLE_PERFORMANCE_MONITORING,
      a11yChecks: this.config.NEXT_PUBLIC_ENABLE_A11Y_CHECKS,
      guardianEnabled: this.config.NEXT_PUBLIC_GUARDIAN_ENABLED,
      guardianStrictMode: this.config.NEXT_PUBLIC_GUARDIAN_STRICT_MODE,
      cspEnabled: this.config.NEXT_PUBLIC_CSP_ENABLED,
      securityHeaders: this.config.NEXT_PUBLIC_SECURITY_HEADERS,
      bundleAnalyzer: this.config.NEXT_PUBLIC_BUNDLE_ANALYZER,
      lighthouseCI: this.config.NEXT_PUBLIC_LIGHTHOUSE_CI,
      vercelAnalytics: this.config.NEXT_PUBLIC_VERCEL_ANALYTICS,
      securityScanning: this.config.NEXT_PUBLIC_ENABLE_SECURITY_SCANNING,
      accessibilityAuditing: this.config.NEXT_PUBLIC_ENABLE_A11Y_AUDITING,
      advancedAnalytics: this.config.NODE_ENV === 'production' || this.config.NEXT_PUBLIC_ENABLE_DEBUG_MODE,
    };
  }

  // Getters
  public get environment(): string {
    return this.config.NODE_ENV;
  }

  public get siteUrl(): string {
    return this.config.NEXT_PUBLIC_SITE_URL;
  }

  public get version(): string {
    return this.config.NEXT_PUBLIC_APP_VERSION;
  }

  public get flags(): FeatureFlags {
    return this.featureFlags;
  }

  public get isDevelopment(): boolean {
    return this.config.NODE_ENV === 'development';
  }

  public get isProduction(): boolean {
    return this.config.NODE_ENV === 'production';
  }

  public get isTest(): boolean {
    return this.config.NODE_ENV === 'test';
  }

  public get supportedLocales(): string[] {
    return this.config.NEXT_PUBLIC_SUPPORTED_LOCALES.split(',');
  }

  public get defaultLocale(): string {
    return this.config.NEXT_PUBLIC_DEFAULT_LOCALE;
  }

  // Analytics configuration
  public get analytics(): {
    id?: string;
    sentryDsn?: string;
    vercelEnabled: boolean;
  } {
    return {
      id: this.config.NEXT_PUBLIC_ANALYTICS_ID,
      sentryDsn: this.config.NEXT_PUBLIC_SENTRY_DSN,
      vercelEnabled: this.config.NEXT_PUBLIC_VERCEL_ANALYTICS,
    };
  }

  // Feature flag helpers
  public isFeatureEnabled(feature: keyof FeatureFlags): boolean {
    return this.featureFlags[feature];
  }

  public getFeatureConfig<T = unknown>(feature: string, defaultValue: T): T {
    const envKey = `NEXT_PUBLIC_FEATURE_${feature.toUpperCase()}`;
    const value = process.env[envKey];
    
    if (value === undefined) return defaultValue;
    
    // Try to parse as JSON first
    try {
      return JSON.parse(value);
    } catch {
      // If not JSON, return as string or convert boolean
      if (value === 'true') return true as T;
      if (value === 'false') return false as T;
      return value as T;
    }
  }

  // Configuration validation
  public validateConfiguration(): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check required production settings
    if (this.isProduction) {
      if (!this.config.NEXT_PUBLIC_ANALYTICS_ID) {
        warnings.push('Analytics ID not configured for production');
      }
      
      if (!this.config.NEXT_PUBLIC_SENTRY_DSN) {
        warnings.push('Sentry DSN not configured for production');
      }
      
      if (this.config.NEXT_PUBLIC_ENABLE_DEBUG_MODE) {
        errors.push('Debug mode should not be enabled in production');
      }
    }

    // Check development settings
    if (this.isDevelopment) {
      if (!this.config.NEXT_PUBLIC_ENABLE_PERFORMANCE_MONITORING) {
        warnings.push('Performance monitoring disabled in development');
      }
    }

    // Check locale configuration
    if (!this.supportedLocales.includes(this.defaultLocale)) {
      errors.push('Default locale not in supported locales list');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  // Debug information
  public getDebugInfo(): {
    environment: string;
    version: string;
    featureFlags: FeatureFlags;
    validation: ReturnType<typeof EnterpriseConfig.prototype.validateConfiguration>;
  } {
    return {
      environment: this.environment,
      version: this.version,
      featureFlags: this.featureFlags,
      validation: this.validateConfiguration(),
    };
  }

  // Safe configuration export (no sensitive data)
  public getSafeConfig(): Partial<AppConfig> {
    return {
      NODE_ENV: this.config.NODE_ENV,
      NEXT_PUBLIC_SITE_URL: this.config.NEXT_PUBLIC_SITE_URL,
      NEXT_PUBLIC_APP_VERSION: this.config.NEXT_PUBLIC_APP_VERSION,
      NEXT_PUBLIC_DEFAULT_LOCALE: this.config.NEXT_PUBLIC_DEFAULT_LOCALE,
      NEXT_PUBLIC_SUPPORTED_LOCALES: this.config.NEXT_PUBLIC_SUPPORTED_LOCALES,
      // Exclude sensitive keys like DSNs and IDs
    };
  }
}

// Export singleton instance
export const config = EnterpriseConfig.getInstance();

// Export validation utilities
export const validateConfig = () => config.validateConfiguration();
export const getDebugInfo = () => config.getDebugInfo();

// Type guards
export const isProduction = (): boolean => config.isProduction;
export const isDevelopment = (): boolean => config.isDevelopment;
export const isTest = (): boolean => config.isTest;

// Feature flag utilities
export const useFeature = (feature: keyof FeatureFlags): boolean => 
  config.isFeatureEnabled(feature);

export const getFeatureConfig = <T = unknown>(feature: string, defaultValue: T): T => 
  config.getFeatureConfig(feature, defaultValue);

// Default export
export default config;