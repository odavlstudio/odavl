/**
 * ODAVL Protocol Layer - Insight Core Pattern Memory Adapter
 * Wraps Insight Core pattern learning for PatternMemoryProtocol
 * 
 * ⚠️ Uses dynamic require() for runtime loading (not static imports)
 * This is acceptable adapter pattern - no compile-time coupling.
 */

import type {
  PatternMemoryAdapter,
} from '../protocols/pattern-memory.js';

import type {
  PatternMemoryQuery,
  PatternMemoryResult,
  PatternCorrectionRequest,
  PatternSignature,
} from '../types/pattern-memory.js';

// **Round 10 Workaround**: Use dynamic import to bypass ESM tsup polyfills
// @ts-ignore - Insight Core is external, types resolved at runtime via dynamic import
let getPatternMemory: any;

/**
 * Adapter that wraps Insight Core pattern memory
 * **Round 10**: Added async initialization to load CJS learning module
 */
export class InsightCorePatternMemoryAdapter implements PatternMemoryAdapter {
  private memory: any;
  private databasePath: string;
  private initialized = false;

  constructor(databasePath: string) {
    this.databasePath = databasePath;
  }

  /**
   * Initialize pattern memory loading function via dynamic import
   * **Round 10 Workaround**: Force CJS module path to avoid ESM tsup polyfills
   */
  private async initialize(): Promise<void> {
    if (this.initialized) return;
    
    try {
      // **Critical**: Use createRequire to force CommonJS resolution
      const { createRequire } = await import('node:module');
      const require = createRequire(import.meta.url);
      
      // Now require() will use the CJS export path (.js not .mjs)
      const learningModule = require('@odavl-studio/insight-core/learning');
      getPatternMemory = learningModule.getPatternMemory;
      this.memory = getPatternMemory({ databasePath: this.databasePath });
      
      this.initialized = true;
      console.log('✅ [PatternMemoryAdapter] Initialized pattern memory (CJS path)');
    } catch (err) {
      console.error('❌ [PatternMemoryAdapter] Failed to load learning module:', err);
      throw new Error('Failed to initialize pattern memory: ' + (err as Error).message);
    }
  }

  async query(criteria: PatternMemoryQuery): Promise<PatternMemoryResult> {
    // **Round 10**: Ensure initialization before query
    await this.initialize();
    try {
      // Call Insight Core's pattern memory query
      const patterns = await this.memory.query({
        limit: criteria.limit,
        minOccurrences: criteria.minOccurrences,
        detectors: criteria.detectors,
        tags: criteria.tags,
      });

      // Transform to protocol format
      const transformedPatterns: PatternSignature[] = (patterns || []).map(
        (p: any) => ({
          id: p.id || p.signatureHash,
          detector: p.detector,
          patternType: p.patternType,
          signatureHash: p.signatureHash,
          filePath: p.filePath,
          line: p.line,
          description: p.description,
          examples: p.examples,
          confidence: p.confidence,
          tags: p.tags,
          occurrences: p.occurrences,
          lastSeen: p.lastSeen,
        })
      );

      return {
        patterns: transformedPatterns,
        total: transformedPatterns.length,
      };
    } catch (error) {
      console.warn(
        '[InsightCorePatternMemoryAdapter] Query error:',
        error instanceof Error ? error.message : String(error)
      );
      return { patterns: [], total: 0 };
    }
  }

  async learnFromCorrection(
    correction: PatternCorrectionRequest
  ): Promise<void> {
    // **Round 10**: Ensure initialization before learning
    await this.initialize();
    
    try {
      // Transform protocol signature to Insight Core format
      const signature = {
        detector: correction.signature.detector,
        patternType: correction.signature.patternType,
        signatureHash: correction.signature.signatureHash,
        filePath: correction.signature.filePath,
        line: correction.signature.line,
      };

      this.memory.learnFromCorrection(
        signature,
        correction.isValid,
        correction.confidence,
        correction.reason
      );
    } catch (error) {
      console.warn(
        '[InsightCorePatternMemoryAdapter] Learn error:',
        error instanceof Error ? error.message : String(error)
      );
    }
  }

  async flush(): Promise<void> {
    // **Round 10**: Ensure initialization before flush
    await this.initialize();
    
    try {
      this.memory.flush();
    } catch (error) {
      console.warn(
        '[InsightCorePatternMemoryAdapter] Flush error:',
        error instanceof Error ? error.message : String(error)
      );
    }
  }
}
