/**
 * Performance Timer - Phase Timing Utility
 * Wave 9: Lightweight performance instrumentation
 * Phase 1.4.1: Enhanced with per-detector tracking and detailed breakdown
 */

export interface PhaseMetrics {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  metadata?: Record<string, any>; // Phase 1.4.1: Store additional context
}

export interface DetectorMetrics {
  name: string;
  duration: number;
  status: 'success' | 'failed' | 'timeout';
}

export class PerformanceTimer {
  private phases = new Map<string, PhaseMetrics>();
  private phaseStack: string[] = [];
  private detectorMetrics: DetectorMetrics[] = []; // Phase 1.4.1: Per-detector tracking
  private cacheHitCount = 0; // Phase 1.4.1: Cache statistics
  private cacheMissCount = 0;
  // Phase 1.4.2: Incremental analysis stats
  private filesUnchanged = 0;
  private filesChanged = 0;
  private detectorsSkipped = 0;
  private skippedDetectorNames: string[] = []; // Phase 1.4.3: Track which detectors were skipped

  /**
   * Start timing a phase
   */
  startPhase(name: string, metadata?: Record<string, any>): void {
    this.phases.set(name, {
      name,
      startTime: performance.now(),
      metadata,
    });
    this.phaseStack.push(name);
  }

  /**
   * End timing a phase
   */
  endPhase(name: string): number {
    const phase = this.phases.get(name);
    if (!phase) return 0;

    const endTime = performance.now();
    const duration = endTime - phase.startTime;
    
    phase.endTime = endTime;
    phase.duration = duration;
    
    // Remove from stack
    const idx = this.phaseStack.indexOf(name);
    if (idx >= 0) this.phaseStack.splice(idx, 1);
    
    return duration;
  }

  /**
   * Phase 1.4.1: Track individual detector execution
   */
  trackDetector(name: string, duration: number, status: 'success' | 'failed' | 'timeout'): void {
    this.detectorMetrics.push({ name, duration, status });
  }

  /**
   * Phase 1.4.1: Record cache hit
   */
  recordCacheHit(): void {
    this.cacheHitCount++;
  }

  /**
   * Phase 1.4.1: Record cache miss
   */
  recordCacheMiss(): void {
    this.cacheMissCount++;
  }

  /**
   * Phase 1.4.2: Record incremental analysis stats
   */
  recordIncremental(unchanged: number, changed: number, skipped: number): void {
    this.filesUnchanged = unchanged;
    this.filesChanged = changed;
    this.detectorsSkipped = skipped;
  }

  /**
   * Phase 1.4.3: Record skipped detector names
   */
  recordSkippedDetectors(detectorNames: string[]): void {
    this.skippedDetectorNames = detectorNames;
    this.detectorsSkipped = detectorNames.length;
  }

  /**
   * Get phase metrics
   */
  getPhase(name: string): PhaseMetrics | undefined {
    return this.phases.get(name);
  }

  /**
   * Get all phases
   */
  getAllPhases(): PhaseMetrics[] {
    return Array.from(this.phases.values());
  }

  /**
   * Phase 1.4.1: Get detector metrics
   */
  getDetectorMetrics(): DetectorMetrics[] {
    return this.detectorMetrics;
  }

  /**
   * Get formatted summary for debug output
   */
  getSummary(): string {
    const lines: string[] = [];
    for (const phase of this.phases.values()) {
      if (phase.duration !== undefined) {
        lines.push(`  ${phase.name}: ${(phase.duration / 1000).toFixed(2)}s`);
      }
    }
    return lines.join('\n');
  }

  /**
   * Phase 1.4.1: Get detailed performance breakdown for --debug-perf mode
   */
  getDetailedBreakdown(): string {
    const lines: string[] = [];
    lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    lines.push('ODAVL Insight – Performance Breakdown');
    lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // Phase timings
    const fileDiscovery = this.getPhase('collectFiles');
    if (fileDiscovery?.duration) {
      lines.push(`File discovery:        ${this.formatMs(fileDiscovery.duration)}`);
    }
    
    // Cache statistics
    if (this.cacheHitCount > 0 || this.cacheMissCount > 0) {
      const cacheStatus = this.cacheHitCount > 0 ? 'HIT' : 'MISS';
      const cacheTime = this.getPhase('checkCache')?.duration || 0;
      lines.push(`Incremental check:     ${this.formatMs(cacheTime)} (${cacheStatus})`);
    }
    
    // Phase 1.4.2: Incremental analysis stats
    if (this.filesUnchanged > 0 || this.filesChanged > 0) {
      lines.push(`\nIncremental analysis:`);
      if (this.filesUnchanged > 0) {
        lines.push(`  Unchanged files:     ${this.filesUnchanged} (skipped)`);
      }
      if (this.filesChanged > 0) {
        lines.push(`  Changed files:       ${this.filesChanged} (analyzed)`);
      }
    }
    
    // Phase 1.4.3: Display skipped detectors
    if (this.skippedDetectorNames.length > 0) {
      lines.push(`\nDetectors skipped:     ${this.skippedDetectorNames.length}`);
      for (const detector of this.skippedDetectorNames) {
        lines.push(`  • ${detector}`);
      }
    }
    
    // Detector execution breakdown
    if (this.detectorMetrics.length > 0) {
      lines.push('\nDetector execution:');
      const sortedDetectors = [...this.detectorMetrics].sort((a, b) => b.duration - a.duration);
      for (const detector of sortedDetectors) {
        const statusSymbol = detector.status === 'success' ? '✓' : 
                            detector.status === 'failed' ? '✗' : '⏱';
        lines.push(`  ${statusSymbol} ${detector.name.padEnd(18)}: ${this.formatMs(detector.duration)}`);
      }
    }
    
    // Aggregation
    const aggregation = this.getPhase('aggregateResults');
    if (aggregation?.duration) {
      lines.push(`\nAggregation:           ${this.formatMs(aggregation.duration)}`);
    }
    
    // Total
    const total = this.calculateTotal();
    lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    lines.push(`Total:                 ${(total / 1000).toFixed(2)}s`);
    lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    return lines.join('\n');
  }

  /**
   * Phase 1.4.1: Format milliseconds with appropriate unit
   */
  private formatMs(ms: number): string {
    if (ms < 1000) {
      return `${Math.round(ms)} ms`;
    }
    return `${(ms / 1000).toFixed(2)} s`;
  }

  /**
   * Phase 1.4.1: Calculate total time from all phases
   */
  private calculateTotal(): number {
    let total = 0;
    for (const phase of this.phases.values()) {
      if (phase.duration) {
        total += phase.duration;
      }
    }
    return total;
  }

  /**
   * Reset all metrics
   */
  reset(): void {
    this.phases.clear();
    this.phaseStack = [];
    this.detectorMetrics = [];
    this.cacheHitCount = 0;
    this.cacheMissCount = 0;
    this.filesUnchanged = 0;
    this.filesChanged = 0;
    this.detectorsSkipped = 0;
    this.skippedDetectorNames = [];
  }
}
