#!/usr/bin/env tsx

/**
 * ML Training Script for Autopilot Trust Prediction
 * 
 * Collects historical data from .odavl directories and trains TensorFlow.js model
 * 
 * Usage:
 *   pnpm ml:train                    # Train on current workspace
 *   pnpm ml:train --all              # Train on all workspaces
 *   pnpm ml:train --eval             # Evaluate existing model
 * 
 * Outputs:
 *   .odavl/ml-models/trust-predictor-v2/model.json
 *   .odavl/ml-models/trust-predictor-v2/weights.bin
 *   .odavl/ml-models/training-report.json
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { MLTrustPredictor, RecipeFeatures } from '../odavl-studio/autopilot/engine/src/ml/trust-predictor';

interface TrainingDataPoint {
  recipeId: string;
  features: RecipeFeatures;
  success: boolean;
  timestamp: string;
}

/**
 * Collect training data from .odavl history
 */
async function collectTrainingData(workspacePath: string): Promise<TrainingDataPoint[]> {
  const odavlPath = path.join(workspacePath, '.odavl');
  
  try {
    // Check if .odavl exists
    await fs.access(odavlPath);
  } catch {
    console.log(`[ML] ⚠️  No .odavl directory found in ${workspacePath}`);
    return [];
  }

  console.log(`[ML] 📂 Collecting data from ${workspacePath}...`);

  const trainingData: TrainingDataPoint[] = [];

  try {
    // Load recipes-trust.json
    const trustPath = path.join(odavlPath, 'recipes-trust.json');
    const trustContent = await fs.readFile(trustPath, 'utf8');
    const trustData = JSON.parse(trustContent) as Array<{
      id: string;
      runs: number;
      success: number;
      trust: number;
      consecutiveFailures?: number;
      blacklisted?: boolean;
    }>;

    // Load history.json
    const historyPath = path.join(odavlPath, 'history.json');
    const historyContent = await fs.readFile(historyPath, 'utf8');
    const historyData = JSON.parse(historyContent) as Array<{
      timestamp: string;
      recipeId: string;
      success: boolean;
      improvement?: { eslint: number; typescript: number; total: number };
      filesAffected?: string[];
      locChanged?: number;
      complexity?: number;
    }>;

    // Combine data
    for (const historyRecord of historyData) {
      const trustRecord = trustData.find(t => t.id === historyRecord.recipeId);
      if (!trustRecord) continue;

      const successRate = trustRecord.runs > 0 ? trustRecord.success / trustRecord.runs : 0.5;
      
      // Extract features from history record
      const features: RecipeFeatures = {
        historicalSuccessRate: successRate,
        totalRuns: trustRecord.runs / 100, // Normalize
        consecutiveFailures: (trustRecord.consecutiveFailures ?? 0) / 5,
        daysSinceLastRun: 0, // Will calculate from timestamp
        filesAffectedCount: (historyRecord.filesAffected?.length ?? 1) / 50,
        linesOfCodeChanged: (historyRecord.locChanged ?? 0) / 1000,
        complexityScore: (historyRecord.complexity ?? 5) / 10,
        isTypescriptFile: historyRecord.filesAffected?.some(f => f.endsWith('.ts')) ? 1 : 0,
        isTestFile: historyRecord.filesAffected?.some(f => f.includes('.test.')) ? 1 : 0,
        hasBreakingChanges: (trustRecord.consecutiveFailures ?? 0) > 0 ? 1 : 0,
      };

      trainingData.push({
        recipeId: historyRecord.recipeId,
        features,
        success: historyRecord.success,
        timestamp: historyRecord.timestamp,
      });
    }

    console.log(`[ML] ✅ Collected ${trainingData.length} training samples from ${workspacePath}`);
  } catch (error) {
    console.error(`[ML] ❌ Error collecting data from ${workspacePath}:`, error);
  }

  return trainingData;
}

/**
 * Generate synthetic training data (for testing when real data insufficient)
 */
function generateSyntheticData(count: number): TrainingDataPoint[] {
  console.log(`[ML] 🎲 Generating ${count} synthetic samples...`);
  
  const data: TrainingDataPoint[] = [];
  
  for (let i = 0; i < count; i++) {
    // Randomly generate features
    const successRate = Math.random();
    const totalRuns = Math.random();
    const consecutiveFailures = Math.random() * 0.6; // 0-3 failures
    const complexity = Math.random();
    
    // Success more likely with: high success rate, low failures, low complexity
    const successProbability = 
      successRate * 0.4 + 
      (1 - consecutiveFailures) * 0.3 + 
      (1 - complexity) * 0.2 + 
      Math.random() * 0.1; // 10% randomness
    
    const success = successProbability > 0.5;
    
    const features: RecipeFeatures = {
      historicalSuccessRate: successRate,
      totalRuns,
      consecutiveFailures,
      daysSinceLastRun: Math.random(),
      filesAffectedCount: Math.random() * 0.5, // 0-25 files
      linesOfCodeChanged: Math.random() * 0.3, // 0-300 LOC
      complexityScore: complexity,
      isTypescriptFile: Math.random() > 0.5 ? 1 : 0,
      isTestFile: Math.random() > 0.7 ? 1 : 0,
      hasBreakingChanges: consecutiveFailures > 0.3 ? 1 : 0,
    };
    
    data.push({
      recipeId: `synthetic-recipe-${i}`,
      features,
      success,
      timestamp: new Date().toISOString(),
    });
  }
  
  return data;
}

/**
 * Split data into train/test sets
 */
function splitData<T>(data: T[], testRatio: number = 0.2): { train: T[]; test: T[] } {
  const shuffled = [...data].sort(() => Math.random() - 0.5);
  const testSize = Math.floor(data.length * testRatio);
  
  return {
    test: shuffled.slice(0, testSize),
    train: shuffled.slice(testSize),
  };
}

/**
 * Main training function
 */
async function main() {
  const args = process.argv.slice(2);
  const shouldCollectAll = args.includes('--all');
  const shouldEvaluate = args.includes('--eval');
  const useSynthetic = args.includes('--synthetic');

  const predictor = new MLTrustPredictor();

  if (shouldEvaluate) {
    // Evaluate existing model
    console.log('[ML] 📊 Evaluating existing model...');
    await predictor.loadModel();
    
    const testData = await collectTrainingData(process.cwd());
    
    if (testData.length === 0) {
      console.log('[ML] ❌ No test data available');
      return;
    }
    
    const metrics = await predictor.evaluateModel(testData);
    console.log(`[ML] 📈 Accuracy: ${(metrics.accuracy * 100).toFixed(2)}%`);
    console.log(`[ML] 📉 Loss: ${metrics.loss.toFixed(4)}`);
    
    return;
  }

  // Collect training data
  let allData: TrainingDataPoint[] = [];

  if (useSynthetic) {
    // Generate synthetic data
    allData = generateSyntheticData(1000);
  } else if (shouldCollectAll) {
    // Collect from multiple workspaces (if configured)
    console.log('[ML] 🌍 Collecting from all workspaces...');
    // TODO: Add workspace discovery logic
    allData = await collectTrainingData(process.cwd());
  } else {
    // Collect from current workspace
    allData = await collectTrainingData(process.cwd());
  }

  if (allData.length < 10) {
    console.log(`[ML] ⚠️  Insufficient data (${allData.length} samples). Minimum 10 required.`);
    console.log('[ML] 💡 Run with --synthetic to generate test data, or collect more real data.');
    return;
  }

  console.log(`[ML] 📊 Total samples: ${allData.length}`);

  // Split data
  const { train, test } = splitData(allData, 0.2);
  console.log(`[ML] 🎓 Training samples: ${train.length}`);
  console.log(`[ML] 🧪 Test samples: ${test.length}`);

  // Train model
  await predictor.trainModel(train);

  // Evaluate
  const metrics = await predictor.evaluateModel(test);
  console.log(`[ML] 📈 Test Accuracy: ${(metrics.accuracy * 100).toFixed(2)}%`);
  console.log(`[ML] 📉 Test Loss: ${metrics.loss.toFixed(4)}`);

  // Save training report
  const report = {
    timestamp: new Date().toISOString(),
    samples: {
      total: allData.length,
      train: train.length,
      test: test.length,
    },
    metrics: {
      accuracy: metrics.accuracy,
      loss: metrics.loss,
    },
    successRate: {
      train: train.filter(d => d.success).length / train.length,
      test: test.filter(d => d.success).length / test.length,
    },
  };

  const reportPath = path.join(process.cwd(), '.odavl', 'ml-models', 'training-report.json');
  await fs.mkdir(path.dirname(reportPath), { recursive: true });
  await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
  console.log(`[ML] 📝 Training report saved to ${reportPath}`);

  console.log('\n✅ Training complete!');
  console.log('📦 Model ready for use in Autopilot');
}

main().catch(console.error);
