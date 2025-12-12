/**
 * ODAVL Studio Feature Flags
 * Controls availability of incomplete/experimental features
 */

export const FEATURES = {
  /** CVE Scanner - Not yet implemented (stub only) */
  CVE_SCANNER: false,

  /** Brain ML Coordination - All functions are stubs */
  BRAIN_ML_ENABLED: false,

  /** OMS Risk Scoring - Package missing */
  OMS_RISK_SCORING: false,

  /** Python Detection - Experimental (mypy/bandit/radon) */
  PYTHON_DETECTION: false,

  /** Next.js Detector - Not implemented */
  NEXTJS_DETECTOR: false,
} as const;

export type FeatureFlag = keyof typeof FEATURES;
