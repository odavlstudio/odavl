/**
 * ODAVL Protocol Layer - Pattern Memory Types
 * Type definitions for pattern learning protocol
 */

export interface PatternSignature {
  id?: string;
  detector: string;
  patternType: string;
  signatureHash: string;
  filePath?: string;
  line?: number;
  description?: string;
  examples?: string[];
  confidence?: number;
  tags?: string[];
  occurrences?: number;
  lastSeen?: string;
}

export interface PatternMemoryQuery {
  limit?: number;
  minOccurrences?: number;
  detectors?: string[];
  tags?: string[];
  minConfidence?: number;
}

export interface PatternMemoryResult {
  patterns: PatternSignature[];
  total: number;
}

export interface PatternCorrectionRequest {
  signature: PatternSignature;
  isValid: boolean;
  confidence: number;
  reason?: string;
}
