/**
 * Performance Timer - Phase Timing Utility
 * Wave 9: Lightweight performance instrumentation
 */

export interface PhaseMetrics {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
}

export class PerformanceTimer {
  private phases = new Map<string, PhaseMetrics>();
  private phaseStack: string[] = [];

  /**
   * Start timing a phase
   */
  startPhase(name: string): void {
    this.phases.set(name, {
      name,
      startTime: performance.now(),
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
   * Reset all metrics
   */
  reset(): void {
    this.phases.clear();
    this.phaseStack = [];
  }
}
