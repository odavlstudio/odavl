/**
 * OMEGA-P5: File Risk Index
 * Real risk scoring system for files based on type + history
 */

import type { FileTypeDefinition } from '../file-types/ts.js';

export interface FileRiskInput {
  type: FileTypeDefinition;
  detectorFailureRate?: number;
  changeFrequency?: number;
}

/**
 * OMEGA-P5 Risk Scoring Formula:
 * score = (riskWeight * 0.5) + (importance * 0.3) + (detectorFailure * 0.15) + (changeFreq * 0.05)
 * 
 * OMEGA-P8: Multiplied by adaptive OMS weighting (0.5-1.5)
 */
export function computeFileRiskScore(input: FileRiskInput): number {
  const base = input.type.riskWeight * 0.5;
  const imp = input.type.importance * 0.3;
  const hist = (input.detectorFailureRate ?? 0) * 0.15;
  const freq = (input.changeFrequency ?? 0) * 0.05;
  
  let score = base + imp + hist + freq;

  // OMEGA-P8: Apply adaptive OMS weighting multiplier
  try {
    const path = require('node:path');
    const fs = require('node:fs');
    const adaptiveStatePath = path.join(process.cwd(), '.odavl', 'brain-history', 'adaptive', 'state.json');
    if (fs.existsSync(adaptiveStatePath)) {
      const adaptiveContent = fs.readFileSync(adaptiveStatePath, 'utf8');
      const adaptiveState = JSON.parse(adaptiveContent);
      if (adaptiveState.omsWeightingMultiplier) {
        score = score * adaptiveState.omsWeightingMultiplier;
      }
    }
  } catch {
    // Use base score without adaptive weighting
  }
  
  return Math.min(1, Math.max(0, score));
}

/**
 * Classify risk level based on score
 * Thresholds: <0.25 low, <0.45 medium, <0.7 high, >=0.7 critical
 */
export function classifyRiskLevel(score: number): 'low' | 'medium' | 'high' | 'critical' {
  if (score < 0.25) return 'low';
  if (score < 0.45) return 'medium';
  if (score < 0.7) return 'high';
  return 'critical';
}

/**
 * Build risk index for multiple files
 */
export function buildRiskIndex(
  files: Array<{ path: string; type: FileTypeDefinition; detectorFailureRate?: number; changeFrequency?: number }>
): Record<string, { score: number; level: 'low' | 'medium' | 'high' | 'critical' }> {
  const index: Record<string, { score: number; level: 'low' | 'medium' | 'high' | 'critical' }> = {};
  
  for (const file of files) {
    const score = computeFileRiskScore({
      type: file.type,
      detectorFailureRate: file.detectorFailureRate,
      changeFrequency: file.changeFrequency,
    });
    
    index[file.path] = {
      score,
      level: classifyRiskLevel(score),
    };
  }
  
  return index;
}
