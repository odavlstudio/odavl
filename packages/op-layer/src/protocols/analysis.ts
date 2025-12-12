/**
 * ODAVL Protocol Layer - Analysis Protocol
 * Façade for code analysis - Autopilot never sees Insight internals
 * Phase 3B: Global caching + performance hooks integrated
 * Phase 4 (ROUND 11): Global registry to fix module instance isolation
 */

import type {
  AnalysisRequest,
  AnalysisSummary,
} from '../types/analysis.js';
import { GlobalCache } from '../cache/global-cache.js';
import { EventEmitter } from 'node:events';
import { AdapterRegistry } from './registry.js';

/**
 * Performance hook context
 */
export interface AnalysisHookContext {
  request: AnalysisRequest;
  startMs: number;
  endMs?: number;
  duration?: number;
  cacheHit?: boolean;
  result?: AnalysisSummary;
  error?: Error;
}

// Export adapter interface for implementations
// **Round 12**: Added optional initialize() method
export interface AnalysisAdapter {
  analyze(request: AnalysisRequest): Promise<AnalysisSummary>;
  initialize?(): Promise<void>; // Optional initialization hook for setup
}

/**
 * AnalysisProtocol is the only façade Autopilot sees.
 * Internally, it can use Insight Core, Cloud, or any other implementation.
 * Phase 3B: Caching layer + performance hooks for monitoring and plugins
 * Phase 4 (ROUND 11): Uses AdapterRegistry (globalThis) to fix module isolation
 */
export class AnalysisProtocol {
  // ⚠️ REMOVED: private static adapter (replaced with AdapterRegistry)
  private static enableCache = true; // Can be disabled for testing
  private static emitter = new EventEmitter();

  /**
   * Register event listener
   * Events: 'before', 'after', 'error', 'cache-hit', 'cache-miss'
   * 
   * @example
   * ```typescript
   * AnalysisProtocol.on('after', (ctx) => {
   *   console.log(`Analysis took ${ctx.duration}ms`);
   * });
   * ```
   */
  static on(
    event: 'before' | 'after' | 'error' | 'cache-hit' | 'cache-miss',
    listener: (ctx: AnalysisHookContext) => void
  ): void {
    this.emitter.on(event, listener);
  }

  /**
   * Remove event listener
   */
  static off(
    event: 'before' | 'after' | 'error' | 'cache-hit' | 'cache-miss',
    listener: (ctx: AnalysisHookContext) => void
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
   * Register adapter globally (via AdapterRegistry)
   * This fixes module instance isolation - adapter is shared across ALL modules
   */
  static registerAdapter(adapter: AnalysisAdapter): void {
    AdapterRegistry.register(adapter);
  }

  /**
   * Get adapter from global registry
   * Throws if not registered
   */
  static ensureAdapter(): AnalysisAdapter {
    const adapter = AdapterRegistry.get();
    if (!adapter) {
      throw new Error(
        '[AnalysisProtocol] No adapter registered. Call AnalysisProtocol.registerAdapter() at bootstrap.'
      );
    }
    return adapter;
  }

  /**
   * Check if adapter is registered globally
   * Works across ALL module instances
   */
  static isAdapterRegistered(): boolean {
    return AdapterRegistry.isRegistered();
  }

  /**
   * Clear adapter registration (useful for testing)
   */
  static clearAdapter(): void {
    AdapterRegistry.clear();
  }

  /**
   * Request analysis with caching + performance hooks
   * Phase 3B: Emits events for monitoring and plugins
   */
  static async requestAnalysis(
    request: AnalysisRequest
  ): Promise<AnalysisSummary> {
    const adapter = this.ensureAdapter();
    const startMs = Date.now();

    // Create hook context
    const ctx: AnalysisHookContext = {
      request,
      startMs,
    };

    // Emit 'before' event
    this.emitter.emit('before', ctx);

    try {
      // Generate cache key based on workspace + detectors
      const cacheKey = await GlobalCache.generateAnalysisKey(
        request.workspaceRoot,
        request.detectors || [],
        { enabledOnly: request.enabledOnly }
      );

      // Check cache first
      if (this.enableCache) {
        const cached = GlobalCache.get<AnalysisSummary>('analysis', cacheKey);
        if (cached) {
          console.log('[AnalysisProtocol] Cache hit - skipping analysis');
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

      // Cache miss - run analysis
      console.log('[AnalysisProtocol] Cache miss - running analysis');
      ctx.cacheHit = false;
      this.emitter.emit('cache-miss', ctx);

      const result = await adapter.analyze(request);

      // Store in cache (1 hour TTL)
      if (this.enableCache) {
        GlobalCache.set('analysis', cacheKey, result, 3600000);
      }

      // Update context
      ctx.result = result;
      ctx.endMs = Date.now();
      ctx.duration = ctx.endMs - ctx.startMs;

      // Emit 'after' event
      this.emitter.emit('after', ctx);

      return result;
    } catch (error) {
      // Update context with error
      ctx.error = error as Error;
      ctx.endMs = Date.now();
      ctx.duration = ctx.endMs - ctx.startMs;

      // Emit 'error' event
      this.emitter.emit('error', ctx);

      throw error;
    }
  }

  /**
   * Toggle caching (useful for testing)
   */
  static setCacheEnabled(enabled: boolean): void {
    this.enableCache = enabled;
  }

  /**
   * Clear analysis cache
   */
  static clearCache(): void {
    GlobalCache.clear('analysis');
  }
}

