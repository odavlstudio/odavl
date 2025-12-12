/**
 * OMEGA-P5 Phase 4 Commit 2: Detector Router
 * OMS-aware detector selection (≤40 LOC)
 */

import type { DetectorName } from './detector/detector-loader.js';

/**
 * Select detectors based on OMS intelligence profile
 * Routes to dominant detectors first, falls back to comprehensive defaults
 */
export function selectDetectors(intelligence: any): DetectorName[] {
  if (!intelligence || !intelligence.dominantDetectors) {
    // Fallback: Run all language detectors for maximum coverage
    return [
      'typescript',
      'eslint',
      'security',
      'performance',
      'complexity',
      'import',
      // Python detectors (multi-detector suite)
      'python-type',
      'python-security',
      'python-complexity',
      // Java detectors (multi-detector suite)
      'java-complexity',
      'java-exception',
      // Other languages
      'go',
      'rust'
    ];
  }

  // Use OMS-recommended dominant detectors
  return intelligence.dominantDetectors as DetectorName[];
}
