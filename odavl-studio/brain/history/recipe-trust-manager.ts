/**
 * OMEGA-P6 Phase 2: Recipe Trust Auto-Learning
 * 
 * Updates recipe trust scores based on real-world telemetry data.
 * Uses exponential smoothing to prevent drastic swings.
 */

import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import type { AutopilotTelemetryEvent } from '../telemetry/autopilot-telemetry.js';

export interface RecipeTrustData {
  [recipeId: string]: {
    trust: number;
    successCount: number;
    failureCount: number;
    lastUpdated: string;
  };
}

/**
 * Get path to recipes-trust.json file
 */
function getRecipeTrustPath(root: string): string {
  return path.join(root, '.odavl', 'recipes-trust.json');
}

/**
 * Load existing trust data from disk
 */
async function loadRecipeTrust(root: string): Promise<RecipeTrustData> {
  try {
    const filePath = getRecipeTrustPath(root);
    const content = await fs.readFile(filePath, 'utf8');
    return JSON.parse(content) as RecipeTrustData;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return {};
    }
    console.warn('[TrustManager] Failed to load trust data:', error);
    return {};
  }
}

/**
 * Save trust data to disk atomically
 */
async function saveRecipeTrust(root: string, data: RecipeTrustData): Promise<void> {
  try {
    const filePath = getRecipeTrustPath(root);
    const dir = path.dirname(filePath);
    await fs.mkdir(dir, { recursive: true });

    const content = JSON.stringify(data, null, 2);
    const tempPath = `${filePath}.tmp`;

    await fs.writeFile(tempPath, content, 'utf8');
    await fs.rename(tempPath, filePath);
  } catch (error) {
    console.warn('[TrustManager] Failed to save trust data:', error);
  }
}

/**
 * Update recipe trust scores from telemetry events
 * 
 * Uses exponential smoothing: new = (old * 0.7) + (computed * 0.3)
 * 
 * @param root Project root directory
 * @param events Telemetry events to process
 * @returns Updated trust data
 */
export async function updateRecipeTrustFromTelemetry(
  root: string,
  events: AutopilotTelemetryEvent[]
): Promise<RecipeTrustData> {
  if (events.length === 0) {
    return {};
  }

  const trustData = await loadRecipeTrust(root);

  // Aggregate recipe outcomes from telemetry
  const recipeStats: Record<string, { successes: number; failures: number }> = {};

  for (const event of events) {
    const sessionSuccess = event.guardian.canDeploy;

    for (const recipe of event.recipes) {
      if (!recipeStats[recipe.recipeId]) {
        recipeStats[recipe.recipeId] = { successes: 0, failures: 0 };
      }

      if (recipe.status === 'executed' && sessionSuccess) {
        recipeStats[recipe.recipeId].successes++;
      } else if (recipe.status === 'failed' || recipe.status === 'rolled-back') {
        recipeStats[recipe.recipeId].failures++;
      }
    }
  }

  // Update trust scores with smoothing
  const now = new Date().toISOString();

  // OMEGA-P8: Load adaptive trust learning rate
  let trustLearningRate = 0.3; // Default: 30% new, 70% old
  try {
    const adaptiveStatePath = path.join(root, '.odavl', 'brain-history', 'adaptive', 'state.json');
    const { existsSync } = await import('node:fs');
    if (existsSync(adaptiveStatePath)) {
      const { readFile } = await import('node:fs/promises');
      const adaptiveContent = await readFile(adaptiveStatePath, 'utf8');
      const adaptiveState = JSON.parse(adaptiveContent);
      trustLearningRate = adaptiveState.trustLearningRate || 0.3;
    }
  } catch {
    // Use default learning rate
  }

  for (const [recipeId, stats] of Object.entries(recipeStats)) {
    const executions = stats.successes + stats.failures;
    if (executions === 0) continue;

    const computedTrust = stats.successes / executions;
    const existingData = trustData[recipeId];

    if (existingData) {
      // OMEGA-P8: Apply adaptive smoothing: newTrust = old * (1 - trustLR) + computed * trustLR
      const smoothedTrust = existingData.trust * (1 - trustLearningRate) + computedTrust * trustLearningRate;
      trustData[recipeId] = {
        trust: Math.max(0.1, Math.min(1.0, smoothedTrust)),
        successCount: existingData.successCount + stats.successes,
        failureCount: existingData.failureCount + stats.failures,
        lastUpdated: now,
      };
    } else {
      // New recipe: use computed trust directly
      trustData[recipeId] = {
        trust: Math.max(0.1, Math.min(1.0, computedTrust)),
        successCount: stats.successes,
        failureCount: stats.failures,
        lastUpdated: now,
      };
    }
  }

  await saveRecipeTrust(root, trustData);
  return trustData;
}
