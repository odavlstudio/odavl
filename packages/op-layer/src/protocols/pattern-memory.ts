/**
 * ODAVL Protocol Layer - Pattern Memory Protocol
 * Façade for pattern learning - Autopilot never sees Insight internals
 */

import type {
  PatternMemoryQuery,
  PatternMemoryResult,
  PatternCorrectionRequest,
} from '../types/pattern-memory.js';

// Export adapter interface for implementations
export interface PatternMemoryAdapter {
  query(criteria: PatternMemoryQuery): Promise<PatternMemoryResult>;
  learnFromCorrection(correction: PatternCorrectionRequest): Promise<void>;
  flush(): Promise<void>;
}

/**
 * PatternMemoryProtocol provides access to pattern learning
 * without exposing Insight Core internals
 */
export class PatternMemoryProtocol {
  private static adapter: PatternMemoryAdapter | null = null;

  static registerAdapter(adapter: PatternMemoryAdapter): void {
    this.adapter = adapter;
  }

  private static ensureAdapter(): PatternMemoryAdapter {
    if (!this.adapter) {
      throw new Error(
        '[PatternMemoryProtocol] No adapter registered. Did you forget to call PatternMemoryProtocol.registerAdapter()?'
      );
    }
    return this.adapter;
  }

  static async getPatternMemory(
    query: PatternMemoryQuery
  ): Promise<PatternMemoryResult> {
    return this.ensureAdapter().query(query);
  }

  static async recordFeedback(
    correction: PatternCorrectionRequest
  ): Promise<void> {
    return this.ensureAdapter().learnFromCorrection(correction);
  }

  static async flush(): Promise<void> {
    return this.ensureAdapter().flush();
  }

  static isAdapterRegistered(): boolean {
    return this.adapter !== null;
  }
}
