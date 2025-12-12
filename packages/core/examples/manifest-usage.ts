/**
 * Example Usage of ODAVL Manifest Loader
 * 
 * This demonstrates how Insight, Autopilot, Guardian, and Brain
 * can access the manifest configuration.
 */

import { manifest, loadManifest, type ODAVLManifest } from '@odavl/core/manifest';

// ============================================================================
// EXAMPLE 1: Simple Access (Singleton Pattern)
// ============================================================================
console.log('=== Example 1: Simple Access ===');
console.log('Project Name:', manifest.project.name);
console.log('Project ID:', manifest.project.id);
console.log('Languages:', manifest.project.languages.join(', '));
console.log('Risk Profile:', manifest.project.riskProfile);
console.log('Criticality:', manifest.project.criticality);
console.log();

// ============================================================================
// EXAMPLE 2: Insight Configuration
// ============================================================================
console.log('=== Example 2: Insight Configuration ===');
if (manifest.insight) {
  console.log('Enabled Detectors:', manifest.insight.enabled?.join(', '));
  console.log('Disabled Detectors:', manifest.insight.disabled?.join(', '));
  console.log('Min Severity:', manifest.insight.minSeverity);
  console.log('Max Files:', manifest.insight.maxFiles);
  
  if (manifest.insight.fileGlobs) {
    console.log('TypeScript Globs:', manifest.insight.fileGlobs.typescript);
  }
}
console.log();

// ============================================================================
// EXAMPLE 3: Autopilot Risk Budget
// ============================================================================
console.log('=== Example 3: Autopilot Risk Budget ===');
if (manifest.autopilot?.riskBudget) {
  const { maxLoc, maxFiles, maxRecipes } = manifest.autopilot.riskBudget;
  console.log(`Risk Budget: ${maxLoc} LOC, ${maxFiles} files, ${maxRecipes} recipes`);
  console.log('Protected Paths:', manifest.autopilot.protectedPaths?.slice(0, 3).join(', '), '...');
}
console.log();

// ============================================================================
// EXAMPLE 4: Guardian Thresholds
// ============================================================================
console.log('=== Example 4: Guardian Thresholds ===');
if (manifest.guardian?.thresholds?.lighthouse) {
  const thresholds = manifest.guardian.thresholds.lighthouse;
  console.log('Lighthouse Thresholds:');
  console.log(`  Performance: ${thresholds.performance}`);
  console.log(`  Accessibility: ${thresholds.accessibility}`);
  console.log(`  Best Practices: ${thresholds.bestPractices}`);
  console.log(`  SEO: ${thresholds.seo}`);
}
console.log();

// ============================================================================
// EXAMPLE 5: Brain Configuration
// ============================================================================
console.log('=== Example 5: Brain Configuration ===');
if (manifest.brain) {
  console.log('Learning Mode:', manifest.brain.learningMode);
  console.log('Memory Limits:', {
    shortTerm: manifest.brain.memory?.shortTermLimit,
    longTerm: manifest.brain.memory?.longTermLimit,
  });
  console.log('Confidence Thresholds:', manifest.brain.confidenceThresholds);
}
console.log();

// ============================================================================
// EXAMPLE 6: File Taxonomy
// ============================================================================
console.log('=== Example 6: File Taxonomy ===');
console.log('Unit Tests:', manifest.fileTaxonomy.tests.unit[0]);
console.log('E2E Tests:', manifest.fileTaxonomy.tests.e2e[0]);
console.log('Recipes:', manifest.fileTaxonomy.recipes?.[0]);
console.log('ML Models:', manifest.fileTaxonomy.mlModels?.[0]);
console.log();

// ============================================================================
// EXAMPLE 7: Explicit Loading (Async)
// ============================================================================
console.log('=== Example 7: Explicit Loading ===');
async function explicitLoadExample() {
  try {
    const loadedManifest: ODAVLManifest = await loadManifest();
    console.log('Manifest Version:', loadedManifest.version);
    console.log('Schema Version:', loadedManifest.schemaVersion);
    console.log('✅ Manifest loaded and validated successfully');
  } catch (error) {
    console.error('❌ Failed to load manifest:', error);
  }
}

await explicitLoadExample();
console.log();

// ============================================================================
// EXAMPLE 8: Product-Specific Configuration Access
// ============================================================================
console.log('=== Example 8: Product-Specific Access ===');

// Insight
function getInsightConfig() {
  return manifest.insight || { enabled: [], disabled: [], minSeverity: 'medium' as const };
}

// Autopilot
function getAutopilotConfig() {
  return manifest.autopilot || { riskBudget: { maxLoc: 40, maxFiles: 10 } };
}

// Guardian
function getGuardianConfig() {
  return manifest.guardian || { suites: {}, thresholds: {} };
}

// Brain
function getBrainConfig() {
  return manifest.brain || { learningMode: 'adaptive' as const };
}

console.log('Insight Min Severity:', getInsightConfig().minSeverity);
console.log('Autopilot Max Files:', getAutopilotConfig().riskBudget?.maxFiles);
console.log('Guardian Mode:', getGuardianConfig().baselinePolicy?.mode);
console.log('Brain Learning:', getBrainConfig().learningMode);

console.log();
console.log('✅ All examples completed successfully!');
