/**
 * Recipe Registry - All available recipes for Autopilot
 * Round 13: First 10 real recipes for MVP
 */

// Complexity Recipes
export { reduceNestingRecipe } from './reduce-nesting.js';
export { extractFunctionRecipe } from './extract-function.js';
export { removeDeadCodeRecipe } from './remove-dead-code.js';
export { splitLargeFileRecipe } from './split-large-file.js';

// Performance Recipes
export { optimizeLoopsRecipe } from './optimize-loops.js';
export { optimizeAsyncRecipe } from './optimize-async.js';
export { avoidExpensiveOperationsRecipe } from './avoid-expensive-operations.js';

// Import Recipes
export { removeUnusedImportsRecipe } from './remove-unused-imports.js';
export { fixCircularImportsRecipe } from './fix-circular-imports.js';

// Build Recipes
export { fixBuildConfigRecipe } from './fix-build-config.js';

// Recipe interface
export interface Recipe {
  id: string;
  name: string;
  detector: string;
  priority: number;
  match(issue: any): boolean;
  apply(fileContent: string, issue: any): string;
}

// Get all recipes sorted by priority (higher = more important)
export function getAllRecipes(): Recipe[] {
  return [
    removeUnusedImportsRecipe,
    optimizeLoopsRecipe,
    fixCircularImportsRecipe,
    reduceNestingRecipe,
    optimizeAsyncRecipe,
    extractFunctionRecipe,
    avoidExpensiveOperationsRecipe,
    removeDeadCodeRecipe,
    fixBuildConfigRecipe,
    splitLargeFileRecipe,
  ].sort((a, b) => b.priority - a.priority);
}

// Find best recipe for an issue
export function findRecipeForIssue(issue: any): Recipe | null {
  const recipes = getAllRecipes();
  
  for (const recipe of recipes) {
    if (recipe.match(issue)) {
      return recipe;
    }
  }
  
  return null;
}
