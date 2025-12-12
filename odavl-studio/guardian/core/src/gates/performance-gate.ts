/**
 * ODAVL Guardian - Performance Gates
 * Phase Ω-P2: Lighthouse + Web Vitals enforcement
 */

import type { GateResult, DeploymentGatesInput } from './deployment-gates';

/**
 * Gate 2: Performance Threshold
 * Block if Lighthouse or Web Vitals below thresholds
 */
export function gatePerformance(input: DeploymentGatesInput): GateResult {
  const lighthouseThreshold = input.thresholds?.lighthouse ?? 90;
  const lcpThreshold = input.thresholds?.lcp ?? 2500; // 2.5s
  const fidThreshold = input.thresholds?.fid ?? 100; // 100ms
  const clsThreshold = input.thresholds?.cls ?? 0.1;

  const issues: string[] = [];

  // Lighthouse check
  if (input.lighthouseScore !== undefined && input.lighthouseScore < lighthouseThreshold) {
    issues.push(`Lighthouse ${input.lighthouseScore} < ${lighthouseThreshold}`);
  }

  // Web Vitals checks
  if (input.webVitals) {
    if (input.webVitals.lcp && input.webVitals.lcp > lcpThreshold) {
      issues.push(`LCP ${input.webVitals.lcp}ms > ${lcpThreshold}ms`);
    }
    if (input.webVitals.fid && input.webVitals.fid > fidThreshold) {
      issues.push(`FID ${input.webVitals.fid}ms > ${fidThreshold}ms`);
    }
    if (input.webVitals.cls && input.webVitals.cls > clsThreshold) {
      issues.push(`CLS ${input.webVitals.cls.toFixed(3)} > ${clsThreshold}`);
    }
  }

  if (issues.length === 0) {
    return {
      pass: true,
      reason: '✓ Performance metrics within thresholds',
      score: input.lighthouseScore,
      gate: 'performance',
    };
  }

  return {
    pass: false,
    reason: `❌ Performance issues: ${issues.join(', ')}`,
    score: input.lighthouseScore,
    gate: 'performance',
  };
}
