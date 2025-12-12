/**
 * ODAVL Smart Client - Auto-detection Layer
 * Phase 3C: Local OPLayer → Cloud API fallback
 * 
 * Pattern:
 * 1. Try to import @odavl/oplayer (local installation)
 * 2. If available → use AnalysisProtocol/GuardianProtocol directly
 * 3. If not available → fallback to Cloud API via CloudClient
 */

// CRITICAL: Types must be inline to avoid static imports of @odavl/oplayer
// This allows SDK to work without oplayer dependency
interface AnalysisRequest {
  workspace: string;
  detectors?: string[];
  language?: string;
  options?: Record<string, any>;
}

interface AnalysisSummary {
  totalIssues: number;
  criticalCount: number;
  errorCount: number;
  warningCount: number;
  issues: Array<{
    path: string;
    detector: string;
    severity: string;
    message: string;
    line?: number;
    column?: number;
  }>;
}

interface GuardianAuditRequest {
  url: string;
  suites?: string[];
  options?: Record<string, any>;
}

interface GuardianAuditResult {
  url: string;
  passed: boolean;
  score: number;
  suites: Array<{
    name: string;
    passed: boolean;
    tests: Array<{
      name: string;
      passed: boolean;
      message?: string;
    }>;
  }>;
}

import { getCloudClient, type CloudConfig } from './cloud-client.js';

// ============================================================================
// OPLayer Detection
// ============================================================================

let oplayerAvailable: boolean | null = null;
let AnalysisProtocol: any = null;
let GuardianProtocol: any = null;
let InsightCoreAnalysisAdapter: any = null;
let GuardianPlaywrightAdapter: any = null;

/**
 * Detect if OPLayer is available locally
 * Caches result for performance
 */
async function detectOPLayer(): Promise<boolean> {
  if (oplayerAvailable !== null) {
    return oplayerAvailable;
  }

  try {
    // Try to dynamically import OPLayer protocols
    // CRITICAL: webpackIgnore prevents webpack from trying to resolve at build time
    const protocolsModule = await import(/* webpackIgnore: true */ '@odavl/oplayer/protocols');
    AnalysisProtocol = protocolsModule.AnalysisProtocol;
    GuardianProtocol = protocolsModule.GuardianProtocol;

    // Try to import adapters
    const oplayerModule = await import(/* webpackIgnore: true */ '@odavl/oplayer');
    InsightCoreAnalysisAdapter = oplayerModule.InsightCoreAnalysisAdapter;
    GuardianPlaywrightAdapter = oplayerModule.GuardianPlaywrightAdapter;

    oplayerAvailable = true;
    console.log('[ODAVL SDK] ✅ Local OPLayer detected - using direct protocol access');
    return true;
  } catch (error) {
    oplayerAvailable = false;
    console.log('[ODAVL SDK] ℹ️ Local OPLayer not found - using Cloud API fallback');
    return false;
  }
}

/**
 * Initialize local OPLayer adapters (if available)
 */
async function initializeLocalAdapters(): Promise<void> {
  if (!oplayerAvailable) return;

  try {
    // Register Insight adapter if not already registered
    if (AnalysisProtocol && !AnalysisProtocol.isAdapterRegistered()) {
      if (InsightCoreAnalysisAdapter) {
        AnalysisProtocol.registerAdapter(new InsightCoreAnalysisAdapter());
        console.log('[ODAVL SDK] Registered InsightCoreAnalysisAdapter');
      }
    }

    // Register Guardian adapter if not already registered
    if (GuardianProtocol && !GuardianProtocol.isAdapterRegistered()) {
      if (GuardianPlaywrightAdapter) {
        GuardianProtocol.registerAdapter(new GuardianPlaywrightAdapter());
        console.log('[ODAVL SDK] Registered GuardianPlaywrightAdapter');
      }
    }
  } catch (error) {
    console.warn('[ODAVL SDK] Failed to initialize local adapters:', error);
    // Don't throw - fallback to cloud will work
  }
}

// ============================================================================
// Smart Client Class
// ============================================================================

export interface SmartClientConfig extends CloudConfig {
  /**
   * Force cloud mode (skip local OPLayer detection)
   * Useful for testing cloud APIs even when OPLayer is installed
   */
  forceCloud?: boolean;

  /**
   * Prefer local over cloud
   * Default: true (use local if available)
   */
  preferLocal?: boolean;
}

export class SmartClient {
  private config: SmartClientConfig;
  private cloudClient: ReturnType<typeof getCloudClient>;
  private initialized = false;

  constructor(config: SmartClientConfig = {}) {
    this.config = {
      preferLocal: true,
      forceCloud: false,
      ...config,
    };
    this.cloudClient = getCloudClient(config);
  }

  /**
   * Initialize SDK (detect OPLayer, register adapters)
   * Call once at app startup
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    if (!this.config.forceCloud) {
      const hasLocal = await detectOPLayer();
      if (hasLocal && this.config.preferLocal) {
        await initializeLocalAdapters();
      }
    }

    this.initialized = true;
  }

  /**
   * Check if using local OPLayer or cloud API
   */
  isUsingLocal(): boolean {
    return !this.config.forceCloud && oplayerAvailable === true;
  }

  /**
   * Analyze workspace with auto-detection
   */
  async analyze(request: AnalysisRequest): Promise<AnalysisSummary> {
    await this.initialize();

    // Local path: Use AnalysisProtocol directly
    if (this.isUsingLocal() && AnalysisProtocol) {
      try {
        console.log('[ODAVL SDK] Using local AnalysisProtocol');
        return await AnalysisProtocol.requestAnalysis(request);
      } catch (error) {
        console.warn('[ODAVL SDK] Local analysis failed, falling back to cloud:', error);
        // Fall through to cloud fallback
      }
    }

    // Cloud path: Use CloudClient
    console.log('[ODAVL SDK] Using Insight Cloud API');
    return await this.cloudClient.analyze(request);
  }

  /**
   * Audit website with auto-detection
   */
  async audit(request: GuardianAuditRequest): Promise<GuardianAuditResult> {
    await this.initialize();

    // Local path: Use GuardianProtocol directly
    if (this.isUsingLocal() && GuardianProtocol) {
      try {
        console.log('[ODAVL SDK] Using local GuardianProtocol');
        return await GuardianProtocol.runAudit(request);
      } catch (error) {
        console.warn('[ODAVL SDK] Local audit failed, falling back to cloud:', error);
        // Fall through to cloud fallback
      }
    }

    // Cloud path: Use CloudClient
    console.log('[ODAVL SDK] Using Guardian Cloud API');
    return await this.cloudClient.audit(request);
  }

  /**
   * Execute Autopilot fix
   * Note: Autopilot always uses cloud API (no local protocol)
   */
  async fix(request: {
    workspaceRoot: string;
    mode?: 'observe' | 'decide' | 'act' | 'verify' | 'learn' | 'loop';
    maxFiles?: number;
    maxLOC?: number;
    recipe?: string;
  }): Promise<Record<string, unknown>> {
    await this.initialize();

    console.log('[ODAVL SDK] Using Autopilot Cloud API');
    return await this.cloudClient.fix(request);
  }

  /**
   * Health check for all services
   */
  async healthCheck(): Promise<{
    local: boolean;
    cloud: {
      insight: boolean;
      guardian: boolean;
      autopilot: boolean;
    };
  }> {
    await this.initialize();

    return {
      local: this.isUsingLocal(),
      cloud: {
        insight: await this.cloudClient.checkInsightHealth(),
        guardian: await this.cloudClient.checkGuardianHealth(),
        autopilot: await this.cloudClient.checkAutopilotHealth(),
      },
    };
  }

  /**
   * Update configuration (e.g., API URLs, keys)
   */
  updateConfig(config: Partial<SmartClientConfig>): void {
    this.config = { ...this.config, ...config };
    this.cloudClient.updateConfig(config);
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let globalSmartClient: SmartClient | null = null;

/**
 * Get global SmartClient instance
 * 
 * @example
 * ```typescript
 * import { getSmartClient } from '@odavl-studio/sdk';
 * 
 * const sdk = getSmartClient();
 * await sdk.initialize();
 * 
 * // Auto-detection: uses local OPLayer if available, else Cloud API
 * const result = await sdk.analyze({
 *   workspaceRoot: '/path/to/project',
 *   detectors: ['typescript', 'eslint'],
 * });
 * ```
 */
export function getSmartClient(config?: SmartClientConfig): SmartClient {
  if (!globalSmartClient) {
    globalSmartClient = new SmartClient(config);
  } else if (config) {
    globalSmartClient.updateConfig(config);
  }
  return globalSmartClient;
}
