/**
 * Guardian Protocol
 * Protocol for website auditing, testing, and quality gates
 * 
 * Phase 3A: Guardian Decoupling from Insight Core
 * Phase 3B: Global caching + performance hooks integrated
 * Pattern: GuardianProtocol → GuardianPlaywrightAdapter → Guardian Engine
 */

import type {
  GuardianAuditRequest,
  GuardianAuditResult,
  GuardianAuditStats,
} from '../types/guardian.js';
import { GlobalCache } from '../cache/global-cache.js';
import { EventEmitter } from 'node:events';

/**
 * Performance hook context for Guardian audits
 */
export interface GuardianHookContext {
  request: GuardianAuditRequest;
  startMs: number;
  endMs?: number;
  duration?: number;
  cacheHit?: boolean;
  result?: GuardianAuditResult;
  error?: Error;
}

/**
 * Guardian Adapter interface - must be implemented by audit providers
 * (e.g., GuardianPlaywrightAdapter, GuardianLighthouseAdapter)
 */
export interface GuardianAdapter {
  /**
   * Perform website audit
   * @param request Audit configuration
   * @returns Audit results with issues, scores, and metrics
   */
  runAudit(request: GuardianAuditRequest): Promise<GuardianAuditResult>;

  /**
   * Check if adapter can handle this audit kind
   * @param kind Audit kind to check
   * @returns True if adapter supports this kind
   */
  supportsKind(kind: string): boolean;

  /**
   * Get adapter metadata
   */
  getMetadata(): {
    name: string;
    version: string;
    supportedKinds: string[];
  };
}

/**
 * Guardian Protocol - Central registry for website audit adapters
 * 
 * Usage:
 * ```typescript
 * import { GuardianProtocol } from '@odavl/oplayer/protocols';
 * import { GuardianPlaywrightAdapter } from '@odavl/oplayer';
 * 
 * // Bootstrap
 * GuardianProtocol.registerAdapter(new GuardianPlaywrightAdapter());
 * 
 * // Use
 * const result = await GuardianProtocol.runAudit({
 *   url: 'https://example.com',
 *   kind: 'full',
 *   browsers: ['chromium'],
 *   devices: ['desktop']
 * });
 * ```
 */
export class GuardianProtocol {
  private static adapter: GuardianAdapter | null = null;
  private static enableCache = true; // Can be disabled for testing
  private static emitter = new EventEmitter();
  private static stats: GuardianAuditStats = {
    bySeverity: { critical: 0, high: 0, medium: 0, low: 0, info: 0 },
    byCategory: {
      accessibility: 0,
      performance: 0,
      security: 0,
      seo: 0,
      visual: 0,
      functionality: 0,
      ux: 0,
      compatibility: 0,
    },
    totalAudits: 0,
    averageScores: {
      overall: 0,
      accessibility: 0,
      performance: 0,
      seo: 0,
      security: 0,
    },
  };

  /**
   * Phase 3B: Performance hooks
   * Register event listener
   * Events: 'before', 'after', 'error', 'cache-hit', 'cache-miss'
   */
  static on(
    event: 'before' | 'after' | 'error' | 'cache-hit' | 'cache-miss',
    listener: (ctx: GuardianHookContext) => void
  ): void {
    this.emitter.on(event, listener);
  }

  /**
   * Remove event listener
   */
  static off(
    event: 'before' | 'after' | 'error' | 'cache-hit' | 'cache-miss',
    listener: (ctx: GuardianHookContext) => void
  ): void {
    this.emitter.off(event, listener);
  }

  /**
   * Remove all event listeners
   */
  static removeAllListeners(): void {
    this.emitter.removeAllListeners();
  }

  /**
   * Register a Guardian adapter
   * @param adapter Adapter implementation (e.g., GuardianPlaywrightAdapter)
   * @throws Error if adapter already registered
   */
  static registerAdapter(adapter: GuardianAdapter): void {
    if (this.adapter !== null) {
      throw new Error(
        '[GuardianProtocol] Adapter already registered. Call unregisterAdapter() first.'
      );
    }
    this.adapter = adapter;
    const meta = adapter.getMetadata();
    console.log(
      `[GuardianProtocol] Registered adapter: ${meta.name} v${meta.version}`
    );
    console.log(
      `[GuardianProtocol] Supported audit kinds: ${meta.supportedKinds.join(', ')}`
    );
  }

  /**
   * Unregister current adapter
   */
  static unregisterAdapter(): void {
    if (this.adapter) {
      const meta = this.adapter.getMetadata();
      console.log(`[GuardianProtocol] Unregistered adapter: ${meta.name}`);
    }
    this.adapter = null;
  }

  /**
   * Check if adapter is registered
   * @returns True if adapter is available
   */
  static isAdapterRegistered(): boolean {
    return this.adapter !== null;
  }

  /**
   * Get current adapter metadata
   * @throws Error if no adapter registered
   */
  static getAdapterMetadata() {
    if (!this.adapter) {
      throw new Error('[GuardianProtocol] No adapter registered');
    }
    return this.adapter.getMetadata();
  }

  /**
   * Check if current adapter supports audit kind
   * @param kind Audit kind to check
   * @returns True if supported
   * @throws Error if no adapter registered
   */
  static supportsKind(kind: string): boolean {
    if (!this.adapter) {
      throw new Error('[GuardianProtocol] No adapter registered');
    }
    return this.adapter.supportsKind(kind);
  }

  /**
   * Run website audit with caching + performance hooks
   * Phase 3B: Emits events for monitoring and plugins
   * 
   * @param request Audit configuration
   * @returns Audit results with issues, scores, and metrics
   * @throws Error if no adapter registered or audit fails
   */
  static async runAudit(
    request: GuardianAuditRequest
  ): Promise<GuardianAuditResult> {
    if (!this.adapter) {
      throw new Error(
        '[GuardianProtocol] No adapter registered. Call registerAdapter() first.'
      );
    }

    // Validate request
    if (!request.url || typeof request.url !== 'string') {
      throw new Error('[GuardianProtocol] Invalid request: url is required');
    }

    if (!request.kind) {
      throw new Error('[GuardianProtocol] Invalid request: kind is required');
    }

    // Check if adapter supports this kind
    if (!this.adapter.supportsKind(request.kind)) {
      throw new Error(
        `[GuardianProtocol] Adapter does not support audit kind: ${request.kind}`
      );
    }

    const startMs = Date.now();

    // Create hook context
    const ctx: GuardianHookContext = {
      request,
      startMs,
    };

    // Emit 'before' event
    this.emitter.emit('before', ctx);

    try {
      // Generate cache key
      const cacheKey = GlobalCache.generateGuardianKey(
        request.url,
        request.kind,
        request.browsers,
        request.devices
      );

      // Check cache first
      if (this.enableCache) {
        const cached = GlobalCache.get<GuardianAuditResult>('guardian', cacheKey);
        if (cached) {
          console.log('[GuardianProtocol] Cache hit - skipping audit');
          ctx.cacheHit = true;
          ctx.result = cached;
          ctx.endMs = Date.now();
          ctx.duration = ctx.endMs - ctx.startMs;

          // Emit 'cache-hit' event
          this.emitter.emit('cache-hit', ctx);
          this.emitter.emit('after', ctx);

          return cached;
        }
      }

      // Cache miss - run audit
      console.log(
        `[GuardianProtocol] Cache miss - Running ${request.kind} audit for: ${request.url}`
      );
      ctx.cacheHit = false;
      this.emitter.emit('cache-miss', ctx);

      // Run audit
      const result = await this.adapter.runAudit(request);

      // Store in cache (1 hour TTL)
      if (this.enableCache) {
        GlobalCache.set('guardian', cacheKey, result, 3600000);
      }

      // Update statistics
      this.updateStats(result);

      // Update context
      ctx.result = result;
      ctx.endMs = Date.now();
      ctx.duration = ctx.endMs - ctx.startMs;

      console.log(
        `[GuardianProtocol] Audit completed in ${ctx.duration}ms - Found ${result.issues.length} issues`
      );

      // Emit 'after' event
      this.emitter.emit('after', ctx);

      return result;
    } catch (error) {
      // Update context with error
      ctx.error = error as Error;
      ctx.endMs = Date.now();
      ctx.duration = ctx.endMs - ctx.startMs;

      console.error(
        `[GuardianProtocol] Audit failed after ${ctx.duration}ms:`,
        error
      );

      // Emit 'error' event
      this.emitter.emit('error', ctx);

      throw error;
    }
  }

  /**
   * Run multiple audits in sequence
   * @param requests Array of audit requests
   * @returns Array of audit results
   */
  static async runAudits(
    requests: GuardianAuditRequest[]
  ): Promise<GuardianAuditResult[]> {
    const results: GuardianAuditResult[] = [];

    for (const request of requests) {
      try {
        const result = await this.runAudit(request);
        results.push(result);
      } catch (error) {
        console.error(
          `[GuardianProtocol] Failed to audit ${request.url}:`,
          error
        );
        // Continue with remaining audits
      }
    }

    return results;
  }

  /**
   * Get audit statistics
   * @returns Current statistics
   */
  static getStats(): GuardianAuditStats {
    return { ...this.stats };
  }

  /**
   * Reset audit statistics
   */
  static resetStats(): void {
    this.stats = {
      bySeverity: { critical: 0, high: 0, medium: 0, low: 0, info: 0 },
      byCategory: {
        accessibility: 0,
        performance: 0,
        security: 0,
        seo: 0,
        visual: 0,
        functionality: 0,
        ux: 0,
        compatibility: 0,
      },
      totalAudits: 0,
      averageScores: {
        overall: 0,
        accessibility: 0,
        performance: 0,
        seo: 0,
        security: 0,
      },
    };
    console.log('[GuardianProtocol] Statistics reset');
  }

  /**
   * Update statistics with audit result
   * @private
   */
  private static updateStats(result: GuardianAuditResult): void {
    this.stats.totalAudits++;

    // Count issues by severity
    for (const issue of result.issues) {
      if (issue.severity in this.stats.bySeverity) {
        this.stats.bySeverity[issue.severity]++;
      }

      // Count by category
      if (issue.category in this.stats.byCategory) {
        this.stats.byCategory[issue.category]++;
      }
    }

    // Update average scores (running average)
    const n = this.stats.totalAudits;
    const updateAvg = (current: number, newValue: number) =>
      (current * (n - 1) + newValue) / n;

    this.stats.averageScores.overall = updateAvg(
      this.stats.averageScores.overall,
      result.scores.overall
    );

    if (result.scores.accessibility !== undefined) {
      this.stats.averageScores.accessibility = updateAvg(
        this.stats.averageScores.accessibility,
        result.scores.accessibility
      );
    }

    if (result.scores.performance !== undefined) {
      this.stats.averageScores.performance = updateAvg(
        this.stats.averageScores.performance,
        result.scores.performance
      );
    }

    if (result.scores.seo !== undefined) {
      this.stats.averageScores.seo = updateAvg(
        this.stats.averageScores.seo,
        result.scores.seo
      );
    }

    if (result.scores.security !== undefined) {
      this.stats.averageScores.security = updateAvg(
        this.stats.averageScores.security,
        result.scores.security
      );
    }
  }

  /**
   * Phase 3B: Cache control methods
   */

  /**
   * Toggle caching (useful for testing)
   */
  static setCacheEnabled(enabled: boolean): void {
    this.enableCache = enabled;
  }

  /**
   * Clear Guardian audit cache
   */
  static clearCache(): void {
    GlobalCache.clear('guardian');
  }
}
