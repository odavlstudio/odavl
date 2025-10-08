// ODAVL-WAVE-X10-INJECT: Evolution Policy - Governance & Safety Limits
// @odavl-governance: SELF-EVOLVING-SAFE mode - Auto-suggestion constraints

export interface EvolutionPolicy {
  maxSuggestionsPerWeek: number;
  allowedModifications: string[];
  forbiddenZones: string[];
  requiresHumanApproval: string[];
  safetyThresholds: {
    maxFilesTouched: number;
    maxLinesPerFile: number;
    maxBundleSizeIncrease: number;
  };
}

export const EVOLUTION_POLICY: EvolutionPolicy = {
  maxSuggestionsPerWeek: 5,
  allowedModifications: [
    'performance optimizations',
    'accessibility improvements', 
    'i18n completeness',
    'UI polish',
    'analytics enhancements'
  ],
  forbiddenZones: [
    '**/security/**',
    '**/*.spec.*',
    '**/public-api/**',
    '**/middleware.ts',
    '**/auth/**'
  ],
  requiresHumanApproval: [
    'component structure changes',
    'routing modifications',
    'dependency updates',
    'build configuration'
  ],
  safetyThresholds: {
    maxFilesTouched: 3,
    maxLinesPerFile: 20,
    maxBundleSizeIncrease: 5 // 5KB max increase
  }
};

export function validateSuggestion(suggestion: { category: string; files?: string[] }): boolean {
  // Validate against policy constraints
  if (!EVOLUTION_POLICY.allowedModifications.includes(suggestion.category)) {
    return false;
  }
  
  // Check forbidden zones
  const touchesForbiddenZone = EVOLUTION_POLICY.forbiddenZones.some(zone =>
    suggestion.files?.some((file: string) => file.includes(zone.replace('**/', '')))
  );
  
  return !touchesForbiddenZone;
}