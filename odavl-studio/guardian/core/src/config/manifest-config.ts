/**
 * ODAVL Guardian - Manifest Configuration Loader
 * Phase P2: ACTIVE manifest-driven behavior enforcement
 * 
 * Provides centralized access to Guardian configuration from manifest.
 * Enforces quality gates, thresholds, and baseline policies at runtime.
 */

import { manifest } from '@odavl/core/manifest';

/**
 * Phase P2 Task 3.1: Get enabled test suites from manifest
 * @returns Object indicating which suites are enabled
 */
export function getEnabledSuites(): {
  performance: boolean;
  accessibility: boolean;
  security: boolean;
  visual: boolean;
  e2e: boolean;
} {
  try {
    const suites = manifest.guardian?.suites;
    return {
      performance: suites?.performance?.enabled !== false,
      accessibility: suites?.accessibility?.enabled !== false,
      security: suites?.security?.enabled !== false,
      visual: suites?.visual?.enabled !== false,
      e2e: suites?.e2e?.enabled !== false,
    };
  } catch (error) {
    return {
      performance: true,
      accessibility: true,
      security: true,
      visual: true,
      e2e: true,
    };
  }
}

/**
 * Phase P2 Task 3.1: Get active test suites (filtering disabled)
 * @returns Array of suite names that should run
 */
export function getActiveSuites(): string[] {
  const enabled = getEnabledSuites();
  const active = Object.entries(enabled)
    .filter(([, isEnabled]) => isEnabled)
    .map(([name]) => name);
  
  console.log(`[Guardian] Active test suites: ${active.join(', ')}`);
  return active;
}

/**
 * Phase P2 Task 3.3: Get Lighthouse thresholds from manifest
 * @returns Lighthouse score thresholds (0-100)
 */
export function getLighthouseThresholds(): {
  performance: number;
  accessibility: number;
  bestPractices: number;
  seo: number;
} {
  try {
    const thresholds = manifest.guardian?.thresholds?.lighthouse;
    return {
      performance: thresholds?.performance || 90,
      accessibility: thresholds?.accessibility || 95,
      bestPractices: thresholds?.bestPractices || 90,
      seo: thresholds?.seo || 90,
    };
  } catch (error) {
    return {
      performance: 90,
      accessibility: 95,
      bestPractices: 90,
      seo: 90,
    };
  }
}

/**
 * Phase P2 Task 3.3: Validate Lighthouse scores against thresholds
 * 
 * @param scores Lighthouse scores object
 * @returns Object with { passed: boolean, failures: string[], scores: object }
 */
export function validateLighthouseScores(scores: {
  performance: number;
  accessibility: number;
  bestPractices: number;
  seo: number;
}): {
  passed: boolean;
  failures: string[];
  thresholds: ReturnType<typeof getLighthouseThresholds>;
} {
  const thresholds = getLighthouseThresholds();
  const failures: string[] = [];
  
  if (scores.performance < thresholds.performance) {
    failures.push(`Performance: ${scores.performance} < ${thresholds.performance}`);
  }
  
  if (scores.accessibility < thresholds.accessibility) {
    failures.push(`Accessibility: ${scores.accessibility} < ${thresholds.accessibility}`);
  }
  
  if (scores.bestPractices < thresholds.bestPractices) {
    failures.push(`Best Practices: ${scores.bestPractices} < ${thresholds.bestPractices}`);
  }
  
  if (scores.seo < thresholds.seo) {
    failures.push(`SEO: ${scores.seo} < ${thresholds.seo}`);
  }
  
  if (failures.length > 0) {
    console.error(`[Guardian] Lighthouse thresholds not met:`, failures);
    // TODO P2: Add audit entry for threshold violations
  }
  
  return {
    passed: failures.length === 0,
    failures,
    thresholds,
  };
}

/**
 * Phase P2 Task 3.3: Get Core Web Vitals thresholds from manifest
 * @returns Web vitals thresholds
 */
export function getWebVitalsThresholds(): {
  lcp: number; // Largest Contentful Paint (ms)
  fid: number; // First Input Delay (ms)
  cls: number; // Cumulative Layout Shift
} {
  try {
    const vitals = manifest.guardian?.thresholds?.webVitals;
    return {
      lcp: vitals?.lcp || 2500,
      fid: vitals?.fid || 100,
      cls: vitals?.cls || 0.1,
    };
  } catch (error) {
    return {
      lcp: 2500,
      fid: 100,
      cls: 0.1,
    };
  }
}

/**
 * Phase P2 Task 3.3: Validate Web Vitals against thresholds
 * 
 * @param vitals Web vitals measurements
 * @returns Object with { passed: boolean, failures: string[], thresholds: object }
 */
export function validateWebVitals(vitals: {
  lcp: number;
  fid: number;
  cls: number;
}): {
  passed: boolean;
  failures: string[];
  thresholds: ReturnType<typeof getWebVitalsThresholds>;
} {
  const thresholds = getWebVitalsThresholds();
  const failures: string[] = [];
  
  if (vitals.lcp > thresholds.lcp) {
    failures.push(`LCP: ${vitals.lcp}ms > ${thresholds.lcp}ms`);
  }
  
  if (vitals.fid > thresholds.fid) {
    failures.push(`FID: ${vitals.fid}ms > ${thresholds.fid}ms`);
  }
  
  if (vitals.cls > thresholds.cls) {
    failures.push(`CLS: ${vitals.cls} > ${thresholds.cls}`);
  }
  
  if (failures.length > 0) {
    console.error(`[Guardian] Web Vitals thresholds exceeded:`, failures);
    // TODO P2: Add audit entry for vitals violations
  }
  
  return {
    passed: failures.length === 0,
    failures,
    thresholds,
  };
}

/**
 * Phase P1: Get test environments from manifest
 * TODO P2: Run tests against configured environments
 * @returns Array of environment configurations
 */
export function getEnvironments(): Array<{
  name: string;
  url: string;
  requiresAuth: boolean;
}> {
  try {
    return (manifest.guardian?.environments || [
      { name: 'staging', url: 'https://staging.example.com', requiresAuth: false },
      { name: 'production', url: 'https://example.com', requiresAuth: false },
    ]) as Array<{ name: string; url: string; requiresAuth: boolean }>;
  } catch (error) {
    return [
      { name: 'staging', url: 'https://staging.example.com', requiresAuth: false },
      { name: 'production', url: 'https://example.com', requiresAuth: false },
    ];
  }
}

/**
 * Phase P2 Task 3.4: Get baseline policy from manifest
 * @returns Baseline policy configuration
 */
export function getBaselinePolicy(): {
  mode: 'strict' | 'adaptive' | 'learning';
  updateFrequency: 'manual' | 'weekly' | 'monthly';
  allowRegression: boolean;
} {
  try {
    const policy = manifest.guardian?.baselinePolicy as any;
    return {
      mode: (policy?.mode || 'adaptive') as 'strict' | 'adaptive' | 'learning',
      updateFrequency: (policy?.updateFrequency || 'weekly') as 'manual' | 'weekly' | 'monthly',
      allowRegression: policy?.allowRegression ?? false,
    };
  } catch (error) {
    return {
      mode: 'adaptive',
      updateFrequency: 'weekly',
      allowRegression: false,
    };
  }
}

/**
 * Phase P2 Task 3.4: Compare current results against baseline
 * 
 * @param current Current test results
 * @param baseline Baseline test results
 * @returns Object with { passed: boolean, regressions: string[], improvements: string[] }
 */
export function compareAgainstBaseline(
  current: Record<string, number>,
  baseline: Record<string, number>
): {
  passed: boolean;
  regressions: string[];
  improvements: string[];
  policy: ReturnType<typeof getBaselinePolicy>;
} {
  const policy = getBaselinePolicy();
  const regressions: string[] = [];
  const improvements: string[] = [];
  
  for (const [metric, currentValue] of Object.entries(current)) {
    const baselineValue = baseline[metric];
    
    if (baselineValue === undefined) {
      console.debug(`[Guardian] New metric (no baseline): ${metric} = ${currentValue}`);
      continue;
    }
    
    const delta = currentValue - baselineValue;
    const percentChange = (delta / baselineValue) * 100;
    
    // For scores: lower is worse. For timings: higher is worse.
    // Simplified: assume metrics ending in 'Score' are higher-is-better
    const isScoreMetric = metric.toLowerCase().includes('score');
    const isRegression = isScoreMetric ? delta < 0 : delta > 0;
    
    if (isRegression) {
      if (policy.mode === 'strict' || !policy.allowRegression) {
        regressions.push(
          `${metric}: ${currentValue} vs ${baselineValue} (${percentChange.toFixed(1)}% ${isScoreMetric ? 'decrease' : 'increase'})`
        );
      }
    } else if (delta !== 0) {
      improvements.push(
        `${metric}: ${currentValue} vs ${baselineValue} (${Math.abs(percentChange).toFixed(1)}% ${isScoreMetric ? 'increase' : 'decrease'})`
      );
    }
  }
  
  const passed = policy.allowRegression || regressions.length === 0;
  
  if (regressions.length > 0) {
    console.error(`[Guardian] Baseline regressions detected (policy: ${policy.mode}):`, regressions);
    // TODO P2: Add audit entry for baseline violations
  }
  
  if (improvements.length > 0) {
    console.log(`[Guardian] Improvements over baseline:`, improvements);
  }
  
  return {
    passed,
    regressions,
    improvements,
    policy,
  };
}

/**
 * Phase P1: Check if specific suite is enabled
 * @param suiteName Suite name
 * @returns True if suite should run
 */
export function isSuiteEnabled(suiteName: 'performance' | 'accessibility' | 'security' | 'visual' | 'e2e'): boolean {
  const suites = getEnabledSuites();
  return suites[suiteName];
}
