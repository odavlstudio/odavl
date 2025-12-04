// Circuit Breaker Implementation for External APIs
// Location: apps/studio-hub/lib/circuit-breaker.ts

import { Redis } from "ioredis";
import { logger } from '@/lib/logger';

/**
 * Circuit Breaker States
 */
export enum CircuitState {
  CLOSED = "closed", // Normal operation
  OPEN = "open", // Rejecting requests
  HALF_OPEN = "half_open", // Testing recovery
}

/**
 * Circuit Breaker Configuration
 */
export interface CircuitBreakerConfig {
  // Failure threshold to trip the breaker
  failureThreshold: number; // Default: 5
  // Success threshold to close the breaker from half-open
  successThreshold: number; // Default: 2
  // Time window for counting failures (milliseconds)
  windowDuration: number; // Default: 60000 (1 minute)
  // Time to wait before attempting recovery (milliseconds)
  openDuration: number; // Default: 30000 (30 seconds)
  // Timeout for individual requests (milliseconds)
  timeout: number; // Default: 5000 (5 seconds)
  // Enable Redis-backed state sharing
  useRedis?: boolean;
  // Redis instance for state persistence
  redis?: Redis;
}

/**
 * Circuit Breaker Metrics
 */
export interface CircuitBreakerMetrics {
  state: CircuitState;
  failureCount: number;
  successCount: number;
  totalRequests: number;
  lastFailureTime?: number;
  lastSuccessTime?: number;
  lastStateChange?: number;
}

/**
 * Circuit Breaker Error
 */
export class CircuitBreakerError extends Error {
  constructor(
    message: string,
    public readonly state: CircuitState,
    public readonly metrics: CircuitBreakerMetrics
  ) {
    super(message);
    this.name = "CircuitBreakerError";
  }
}

/**
 * Circuit Breaker Implementation
 * 
 * Protects external API calls from cascading failures by:
 * - Tracking failure rates
 * - Opening circuit when threshold exceeded
 * - Testing recovery with half-open state
 * - Closing circuit when service recovers
 * 
 * @example
 * ```typescript
 * const breaker = new CircuitBreaker("github-api", {
 *   failureThreshold: 5,
 *   successThreshold: 2,
 *   timeout: 5000,
 * });
 * 
 * const result = await breaker.execute(async () => {
 *   return await fetch("https://api.github.com/users/octocat");
 * });
 * ```
 */
export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount: number = 0;
  private successCount: number = 0;
  private totalRequests: number = 0;
  private lastFailureTime?: number;
  private lastSuccessTime?: number;
  private lastStateChange: number = Date.now();
  private nextAttemptTime: number = 0;
  
  private readonly config: Omit<Required<CircuitBreakerConfig>, 'redis' | 'useRedis'> & {
    useRedis: boolean;
    redis?: Redis;
  };
  
  constructor(
    private readonly name: string,
    config: Partial<CircuitBreakerConfig> = {}
  ) {
    this.config = {
      failureThreshold: config.failureThreshold ?? 5,
      successThreshold: config.successThreshold ?? 2,
      windowDuration: config.windowDuration ?? 60000, // 1 minute
      openDuration: config.openDuration ?? 30000, // 30 seconds
      timeout: config.timeout ?? 5000, // 5 seconds
      useRedis: config.useRedis ?? false,
      redis: config.redis,
    };
    
    // Load state from Redis if enabled
    if (this.config.useRedis && this.config.redis) {
      this.loadStateFromRedis().catch((err) => {
        logger.error('Failed to load circuit breaker state from Redis', err as Error, { name: this.name });
      });
    }
  }
  
  /**
   * Execute a function with circuit breaker protection
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    this.totalRequests++;
    
    // Check if circuit is open
    if (this.state === CircuitState.OPEN) {
      if (Date.now() < this.nextAttemptTime) {
        throw new CircuitBreakerError(
          `Circuit breaker "${this.name}" is OPEN`,
          this.state,
          this.getMetrics()
        );
      }
      
      // Move to half-open state
      await this.transitionToHalfOpen();
    }
    
    try {
      // Execute with timeout
      const result = await this.executeWithTimeout(fn);
      
      // Record success
      await this.onSuccess();
      
      return result;
    } catch (error) {
      // Record failure
      await this.onFailure();
      
      throw error;
    }
  }
  
  /**
   * Execute function with timeout
   */
  private async executeWithTimeout<T>(fn: () => Promise<T>): Promise<T> {
    return Promise.race([
      fn(),
      new Promise<T>((_, reject) =>
        setTimeout(
          () => reject(new Error(`Request timed out after ${this.config.timeout}ms`)),
          this.config.timeout
        )
      ),
    ]);
  }
  
  /**
   * Handle successful execution
   */
  private async onSuccess(): Promise<void> {
    this.lastSuccessTime = Date.now();
    this.failureCount = 0; // Reset failure count on success
    
    if (this.state === CircuitState.HALF_OPEN) {
      this.successCount++;
      
      if (this.successCount >= this.config.successThreshold) {
        await this.transitionToClosed();
      }
    }
    
    await this.saveStateToRedis();
  }
  
  /**
   * Handle failed execution
   */
  private async onFailure(): Promise<void> {
    this.lastFailureTime = Date.now();
    this.failureCount++;
    
    // Reset success count on failure
    if (this.state === CircuitState.HALF_OPEN) {
      this.successCount = 0;
      await this.transitionToOpen();
    } else if (this.state === CircuitState.CLOSED) {
      // Check if failure threshold exceeded
      if (this.failureCount >= this.config.failureThreshold) {
        await this.transitionToOpen();
      }
    }
    
    await this.saveStateToRedis();
  }
  
  /**
   * Transition to OPEN state
   */
  private async transitionToOpen(): Promise<void> {
    this.state = CircuitState.OPEN;
    this.nextAttemptTime = Date.now() + this.config.openDuration;
    this.lastStateChange = Date.now();
    
    logger.warn('Circuit breaker transitioned to OPEN', {
      name: this.name,
      nextAttemptAt: new Date(this.nextAttemptTime).toISOString(),
    });
    
    await this.saveStateToRedis();
    await this.emitMetrics();
  }
  
  /**
   * Transition to HALF_OPEN state
   */
  private async transitionToHalfOpen(): Promise<void> {
    this.state = CircuitState.HALF_OPEN;
    this.successCount = 0;
    this.lastStateChange = Date.now();
    
    logger.info(`Circuit breaker "${this.name}" transitioned to HALF_OPEN state`);
    
    await this.saveStateToRedis();
    await this.emitMetrics();
  }
  
  /**
   * Transition to CLOSED state
   */
  private async transitionToClosed(): Promise<void> {
    this.state = CircuitState.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.lastStateChange = Date.now();
    
    logger.info('Circuit breaker transitioned to CLOSED', { name: this.name });
    
    await this.saveStateToRedis();
    await this.emitMetrics();
  }
  
  /**
   * Get current metrics
   */
  getMetrics(): CircuitBreakerMetrics {
    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      totalRequests: this.totalRequests,
      lastFailureTime: this.lastFailureTime,
      lastSuccessTime: this.lastSuccessTime,
      lastStateChange: this.lastStateChange,
    };
  }
  
  /**
   * Reset circuit breaker
   */
  async reset(): Promise<void> {
    this.state = CircuitState.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.totalRequests = 0;
    this.lastFailureTime = undefined;
    this.lastSuccessTime = undefined;
    this.lastStateChange = Date.now();
    this.nextAttemptTime = 0;
    
    await this.saveStateToRedis();
    
    logger.info('Circuit breaker reset', { name: this.name });
  }
  
  /**
   * Load state from Redis
   */
  private async loadStateFromRedis(): Promise<void> {
    if (!this.config.redis) return;
    
    const key = `circuit-breaker:${this.name}`;
    const data = await this.config.redis.get(key);
    
    if (data) {
      const parsed = JSON.parse(data);
      this.state = parsed.state;
      this.failureCount = parsed.failureCount;
      this.successCount = parsed.successCount;
      this.totalRequests = parsed.totalRequests;
      this.lastFailureTime = parsed.lastFailureTime;
      this.lastSuccessTime = parsed.lastSuccessTime;
      this.lastStateChange = parsed.lastStateChange;
      this.nextAttemptTime = parsed.nextAttemptTime;
    }
  }
  
  /**
   * Save state to Redis
   */
  private async saveStateToRedis(): Promise<void> {
    if (!this.config.redis) return;
    
    const key = `circuit-breaker:${this.name}`;
    const data = JSON.stringify({
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      totalRequests: this.totalRequests,
      lastFailureTime: this.lastFailureTime,
      lastSuccessTime: this.lastSuccessTime,
      lastStateChange: this.lastStateChange,
      nextAttemptTime: this.nextAttemptTime,
    });
    
    await this.config.redis.set(key, data, "EX", 300); // 5-minute TTL
  }
  
  /**
   * Emit metrics to Prometheus/monitoring
   */
  private async emitMetrics(): Promise<void> {
    // Prometheus metrics would be emitted here
    // For now, just log to console
    const metrics = this.getMetrics();
    
    logger.debug('Circuit breaker metrics', {
      name: this.name,
      state: metrics.state,
      failureCount: metrics.failureCount,
      successCount: metrics.successCount,
      totalRequests: metrics.totalRequests,
    });
  }
}

/**
 * Circuit Breaker Registry
 * 
 * Manages multiple circuit breakers for different services
 */
export class CircuitBreakerRegistry {
  private breakers: Map<string, CircuitBreaker> = new Map();
  
  constructor(private readonly redis?: Redis) {}
  
  /**
   * Get or create a circuit breaker
   */
  getBreaker(
    name: string,
    config?: Partial<CircuitBreakerConfig>
  ): CircuitBreaker {
    if (!this.breakers.has(name)) {
      this.breakers.set(
        name,
        new CircuitBreaker(name, {
          ...config,
          redis: this.redis,
          useRedis: !!this.redis,
        })
      );
    }
    
    return this.breakers.get(name)!;
  }
  
  /**
   * Get all breaker metrics
   */
  getAllMetrics(): Record<string, CircuitBreakerMetrics> {
    const metrics: Record<string, CircuitBreakerMetrics> = {};
    
    for (const [name, breaker] of this.breakers) {
      metrics[name] = breaker.getMetrics();
    }
    
    return metrics;
  }
  
  /**
   * Reset all breakers
   */
  async resetAll(): Promise<void> {
    await Promise.all(
      Array.from(this.breakers.values()).map((breaker) => breaker.reset())
    );
  }
}

// Export singleton registry
export const circuitBreakerRegistry = new CircuitBreakerRegistry();
