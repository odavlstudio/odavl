/**
 * Manual type declarations for InsightCorePatternMemoryAdapter
 * (Avoids TypeScript errors with external @odavl-studio/insight-core)
 */

import type { PatternMemoryAdapter } from '../protocols/pattern-memory.js';

/**
 * Adapter that wraps Insight Core pattern memory
 */
export declare class InsightCorePatternMemoryAdapter implements PatternMemoryAdapter {
  constructor(databasePath?: string);
  
  query(criteria: import('../types/pattern-memory.js').PatternMemoryQuery): Promise<import('../types/pattern-memory.js').PatternMemoryResult>;
  
  learnFromCorrection(correction: import('../types/pattern-memory.js').PatternCorrectionRequest): Promise<void>;
  
  flush(): Promise<void>;
}
