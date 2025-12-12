/**
 * ODAVL Telemetry — Metrics System
 * Counters + Timers (Netflix-style)
 * Prometheus/Datadog compatible
 */

export interface Timer {
  stop(): number;
}

export interface MetricData {
  counters: Record<string, number>;
  timers: Record<string, number[]>;
  timestamp: string;
}

export class Metrics {
  private counters: Map<string, number> = new Map();
  private timers: Map<string, number[]> = new Map();

  /**
   * Increment a counter metric
   * @example metrics.increment('insight.run_count')
   */
  increment(name: string, value: number = 1): void {
    const current = this.counters.get(name) || 0;
    this.counters.set(name, current + value);
  }

  /**
   * Start a timer for measuring duration
   * @example const timer = metrics.timer('autopilot.observe_duration_ms')
   */
  timer(name: string): Timer {
    const start = Date.now();
    return {
      stop: (): number => {
        const duration = Date.now() - start;
        const existing = this.timers.get(name) || [];
        this.timers.set(name, [...existing, duration]);
        return duration;
      }
    };
  }

  /**
   * Get all metrics data
   */
  export(): MetricData {
    return {
      counters: Object.fromEntries(this.counters),
      timers: Object.fromEntries(this.timers),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Reset all metrics
   */
  reset(): void {
    this.counters.clear();
    this.timers.clear();
  }
}
