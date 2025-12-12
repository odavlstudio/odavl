/**
 * ODAVL Guardian - Deployment Gates
 * Phase Ω-P2: Production-grade deployment safety gates
 */

export interface GateResult {
  pass: boolean;
  reason: string;
  score?: number;
  gate: string;
}

export interface DeploymentGatesInput {
  brainConfidence?: number;
  brainFusionScore?: number;
  brainReasoning?: string[];
  lighthouseScore?: number;
  performanceScore?: number; // Overall performance score
  webVitals?: {
    lcp?: number; // Largest Contentful Paint (ms)
    fid?: number; // First Input Delay (ms)
    cls?: number; // Cumulative Layout Shift
  };
  baselineComparison?: {
    regressions: number;
    improvements: number;
  };
  mtlSecurity?: number; // From Brain's Multi-Task Learning
  fileTypeRisk?: {
    high: number;
    medium: number;
    low: number;
  };
  fileRiskSummary?: {
    avgRisk: number;
    criticalCount: number;
  };
  changedFiles?: string[]; // OMEGA-P5 Phase 4: OMS file risk analysis
  thresholds?: {
    confidence?: number;
    lighthouse?: number;
    lcp?: number;
    fid?: number;
    cls?: number;
    maxRegressions?: number;
  };
}

/**
 * Gate 1: Confidence Threshold
 * Block if Brain confidence below required threshold
 * 
 * OMEGA-P8: Threshold adjusted by adaptive guardian sensitivity
 */
export function gateConfidence(input: DeploymentGatesInput): GateResult {
  let threshold = input.thresholds?.confidence ?? 75;
  const confidence = input.brainConfidence ?? 0;

  // OMEGA-P8: Apply adaptive guardian sensitivity adjustment
  try {
    const path = require('node:path');
    const fs = require('node:fs');
    const adaptiveStatePath = path.join(process.cwd(), '.odavl', 'brain-history', 'adaptive', 'state.json');
    if (fs.existsSync(adaptiveStatePath)) {
      const adaptiveContent = fs.readFileSync(adaptiveStatePath, 'utf8');
      const adaptiveState = JSON.parse(adaptiveContent);
      
      // Sensitivity adjustment: low→+0%, medium→+10%, high→+20%, critical→+30%
      const sensitivityAdjustment: Record<string, number> = {
        'low': 0,
        'medium': 0.10,
        'high': 0.20,
        'critical': 0.30,
      };
      
      const adjustment = sensitivityAdjustment[adaptiveState.guardianSensitivity] ?? 0;
      threshold = threshold * (1 + adjustment);
    }
  } catch {
    // Use base threshold
  }

  if (confidence >= threshold) {
    return {
      pass: true,
      reason: `✓ Confidence ${confidence.toFixed(1)}% meets threshold ${threshold.toFixed(1)}%`,
      score: confidence,
      gate: 'confidence',
    };
  }

  return {
    pass: false,
    reason: `❌ Confidence ${confidence.toFixed(1)}% below threshold ${threshold.toFixed(1)}%`,
    score: confidence,
    gate: 'confidence',
  };
}
