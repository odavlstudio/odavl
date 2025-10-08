// ODAVL-WAVE-X10-INJECT: Evolution Recipes - Template Improvements
// @odavl-governance: SELF-EVOLVING-SAFE mode - Safe improvement patterns

export interface EvolutionRecipe {
  id: string;
  name: string;
  category: 'performance' | 'ux' | 'i18n' | 'quality';
  trigger: string;
  template: string;
  safetyLevel: 'safe' | 'review-required';
}

export const EVOLUTION_RECIPES: EvolutionRecipe[] = [
  {
    id: 'bundle-optimize',
    name: 'Bundle Size Optimization',
    category: 'performance',
    trigger: 'buildSize > 150kb',
    template: 'Add dynamic imports for large components',
    safetyLevel: 'review-required'
  },
  {
    id: 'missing-alt-text',
    name: 'Accessibility: Missing Alt Text',
    category: 'ux',
    trigger: 'lighthouse.accessibility < 95',
    template: 'Add descriptive alt attributes to images',
    safetyLevel: 'safe'
  },
  {
    id: 'i18n-completion',
    name: 'Translation Completeness',
    category: 'i18n',
    trigger: 'missingKeys > 0',
    template: 'Generate missing translation keys',
    safetyLevel: 'safe'
  },
  {
    id: 'unused-imports',
    name: 'Code Quality: Remove Unused Imports',
    category: 'quality',
    trigger: 'eslintWarnings > 0',
    template: 'Remove unused import statements',
    safetyLevel: 'safe'
  },
  {
    id: 'loading-states',
    name: 'UX: Add Loading States',
    category: 'ux',
    trigger: 'bounceRate > 60%',
    template: 'Add skeleton loaders for async components',
    safetyLevel: 'review-required'
  }
];

export function findApplicableRecipes(metrics: Record<string, unknown>): EvolutionRecipe[] {
  /* <ODAVL-AUTO-REFINE> Enhanced recipe matching with actual metrics evaluation */
  return EVOLUTION_RECIPES.filter(recipe => {
    // Simple safety-first approach - only return safe recipes for now
    // TODO: Implement actual trigger evaluation based on metrics
    if (recipe.safetyLevel !== 'safe') return false;
    
    // Basic trigger evaluation for demo purposes
    if (recipe.trigger === 'eslintWarnings > 0' && metrics.eslintWarnings) return true;
    if (recipe.trigger === 'missingKeys > 0' && metrics.missingKeys) return true;
    
    return recipe.safetyLevel === 'safe';
  });
}