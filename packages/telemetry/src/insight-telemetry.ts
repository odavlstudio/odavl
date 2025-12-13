/**
 * ODAVL Insight — Telemetry Client
 * 
 * Safe telemetry client that works across:
 * - Cloud backend (Next.js API routes)
 * - CLI (Node.js)
 * - VS Code extension (restricted environment)
 * 
 * Features:
 * - Respects opt-out settings
 * - Anonymous by default (hashed user IDs)
 * - No sensitive code content
 * - Batching & retry logic
 * - Graceful degradation (never blocks)
 * 
 * Privacy:
 * - User can opt-out via settings
 * - No PII without explicit consent
 * - All events logged locally first
 */

import { createHash } from 'crypto';
import type { InsightEvent, InsightEventBase, InsightEventType } from './insight-events';
import { Logger } from './logger';
import { EventEmitter, ODAVLEvent } from './events';

/**
 * Telemetry configuration
 */
export interface TelemetryConfig {
  /** Enable/disable telemetry (default: true) */
  enabled: boolean;
  
  /** Anonymous user ID (hashed email) */
  userId?: string;
  
  /** Session ID (generated per session) */
  sessionId?: string;
  
  /** API endpoint for sending events */
  endpoint?: string;
  
  /** API key for authentication */
  apiKey?: string;
  
  /** Batch size (send after N events) */
  batchSize?: number;
  
  /** Flush interval in ms (send every N ms) */
  flushIntervalMs?: number;
  
  /** Log events locally (for debugging) */
  logLocally?: boolean;
  
  // Phase 1.2: workspaceRoot REMOVED (privacy violation - exposes usernames/company names)
  // Local logging now uses current working directory if needed
}

/**
 * Default configuration
 * Phase 1.2: Telemetry OFF by default (opt-in)
 */
const DEFAULT_CONFIG: Partial<TelemetryConfig> = {
  enabled: false, // Phase 1.2: Must be opt-in (GDPR compliance)
  batchSize: 10,
  flushIntervalMs: 60000, // 1 minute
  logLocally: true,
};

/**
 * Telemetry client for Insight
 */
export class InsightTelemetryClient {
  private config: TelemetryConfig;
  private logger?: Logger;
  private eventEmitter?: EventEmitter;
  private eventQueue: InsightEvent[] = [];
  private flushTimer?: NodeJS.Timeout;
  
  constructor(config: Partial<TelemetryConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config } as TelemetryConfig;
    
    // Phase 1.2: Local logging removed (workspaceRoot was privacy violation)
    // If local debugging needed, use console or VS Code output channel
    if (this.config.logLocally) {
      // Logger now uses process.cwd() internally (not workspace-specific)
      this.logger = new Logger();
      this.eventEmitter = new EventEmitter();
    }
    
    // Start flush timer
    if (this.config.enabled && this.config.flushIntervalMs) {
      this.startFlushTimer();
    }
  }
  
  /**
   * @deprecated Phase 1.2: REMOVED - Hashed emails still violate GDPR (linkable PII)
   * Use random sessionId instead for anonymous tracking
   * This method will be removed in v3.0.0
   */
  static hashUserId(email: string): string {
    console.warn('[ODAVL Telemetry] hashUserId() is deprecated and violates GDPR. Use sessionId instead.');
    return createHash('sha256').update(email).digest('hex').substring(0, 16);
  }
  
  /**
   * Generate session ID
   */
  static generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  }
  
  /**
   * Bin file count for privacy (avoid exact counts)
   */
  static binFileCount(count: number): '<10' | '10-50' | '50-100' | '100-500' | '500-1000' | '1000+' {
    if (count < 10) return '<10';
    if (count < 50) return '10-50';
    if (count < 100) return '50-100';
    if (count < 500) return '100-500';
    if (count < 1000) return '500-1000';
    return '1000+';
  }
  
  /**
   * Check if telemetry is enabled
   */
  isEnabled(): boolean {
    return this.config.enabled;
  }
  
  /**
   * Update configuration (e.g., opt-out)
   */
  updateConfig(updates: Partial<TelemetryConfig>): void {
    this.config = { ...this.config, ...updates };
    
    // If disabled, clear queue and stop timer
    if (!this.config.enabled) {
      this.eventQueue = [];
      if (this.flushTimer) {
        clearInterval(this.flushTimer);
        this.flushTimer = undefined;
      }
    } else if (!this.flushTimer && this.config.flushIntervalMs) {
      this.startFlushTimer();
    }
  }
  
  /**
   * Track an Insight event
   */
  async track(
    type: InsightEventType,
    properties: any,
    baseOverrides?: Partial<InsightEventBase>
  ): Promise<void> {
    // Skip if disabled
    if (!this.config.enabled) {
      return;
    }
    
    // Create base event properties
    const base: InsightEventBase = {
      userId: this.config.userId || 'anonymous',
      sessionId: this.config.sessionId,
      planId: 'INSIGHT_FREE', // Override from context
      source: 'cloud', // Override from context
      timestamp: new Date().toISOString(),
      ...baseOverrides,
    };
    
    // Create full event
    const event: InsightEvent = {
      ...base,
      type,
      properties,
    } as InsightEvent;
    
    // Log locally (always, even if remote fails)
    this.logEventLocally(event);
    
    // Add to queue for remote sending
    this.eventQueue.push(event);
    
    // Flush if batch size reached
    if (this.config.batchSize && this.eventQueue.length >= this.config.batchSize) {
      await this.flush();
    }
  }
  
  /**
   * Log event locally for debugging/audit
   */
  private logEventLocally(event: InsightEvent): void {
    if (!this.config.logLocally || !this.logger) {
      return;
    }
    
    // Log to structured log file
    this.logger.info('telemetry_event', {
      type: event.type,
      userId: event.userId,
      planId: event.planId,
      source: event.source,
      properties: event.properties,
    });
    
    // Emit to event system (for internal analytics)
    if (this.eventEmitter) {
      this.eventEmitter.emit(
        ODAVLEvent.INSIGHT_ANALYSIS_STARTED, // Map to existing enum
        'insight',
        {
          eventType: event.type,
          ...event.properties,
        }
      );
    }
  }
  
  /**
   * Flush events to remote endpoint
   */
  async flush(): Promise<void> {
    if (this.eventQueue.length === 0) {
      return;
    }
    
    const events = [...this.eventQueue];
    this.eventQueue = [];
    
    // Skip remote sending if no endpoint configured
    if (!this.config.endpoint) {
      if (this.logger) {
        this.logger.debug('telemetry_flush_skipped', {
          reason: 'no_endpoint',
          eventCount: events.length,
        });
      }
      return;
    }
    
    try {
      // Send events to remote endpoint (batched)
      const response = await fetch(this.config.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.config.apiKey && { 'Authorization': `Bearer ${this.config.apiKey}` }),
        },
        body: JSON.stringify({ events }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      if (this.logger) {
        this.logger.debug('telemetry_flush_success', {
          eventCount: events.length,
        });
      }
    } catch (error) {
      // Log error but don't throw (telemetry should never break app)
      if (this.logger) {
        this.logger.warn('telemetry_flush_failed', {
          error: error instanceof Error ? error.message : String(error),
          eventCount: events.length,
        });
      }
      
      // Re-queue events for retry (max 100 to avoid memory leak)
      if (this.eventQueue.length < 100) {
        this.eventQueue.unshift(...events);
      }
    }
  }
  
  /**
   * Start periodic flush timer
   */
  private startFlushTimer(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    
    if (this.config.flushIntervalMs) {
      this.flushTimer = setInterval(() => {
        this.flush().catch((error) => {
          if (this.logger) {
            this.logger.error('telemetry_flush_timer_error', {
              error: error instanceof Error ? error.message : String(error),
            });
          }
        });
      }, this.config.flushIntervalMs);
      
      // Don't block Node.js from exiting
      if (this.flushTimer.unref) {
        this.flushTimer.unref();
      }
    }
  }
  
  /**
   * Cleanup (flush remaining events)
   */
  async destroy(): Promise<void> {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = undefined;
    }
    
    await this.flush();
  }
}

/**
 * Singleton instance for global use
 */
let globalTelemetryClient: InsightTelemetryClient | undefined;

/**
 * Get or create global telemetry client
 */
export function getInsightTelemetry(config?: Partial<TelemetryConfig>): InsightTelemetryClient {
  if (!globalTelemetryClient) {
    globalTelemetryClient = new InsightTelemetryClient(config);
  }
  return globalTelemetryClient;
}

/**
 * Configure global telemetry client
 */
export function configureInsightTelemetry(config: Partial<TelemetryConfig>): void {
  if (globalTelemetryClient) {
    globalTelemetryClient.updateConfig(config);
  } else {
    globalTelemetryClient = new InsightTelemetryClient(config);
  }
}

/**
 * Track event using global client (convenience method)
 */
export async function trackInsightEvent(
  type: InsightEventType,
  properties: any,
  baseOverrides?: Partial<InsightEventBase>
): Promise<void> {
  const client = getInsightTelemetry();
  await client.track(type, properties, baseOverrides);
}

/**
 * Flush global client (for graceful shutdown)
 */
export async function flushInsightTelemetry(): Promise<void> {
  if (globalTelemetryClient) {
    await globalTelemetryClient.flush();
  }
}
