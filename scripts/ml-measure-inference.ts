#!/usr/bin/env tsx

/**
 * Measure ML Model Inference Time
 * 
 * Purpose: Benchmark V2 model prediction speed
 * Target: <50ms per prediction (for autopilot responsiveness)
 * 
 * Usage:
 *   pnpm tsx scripts/ml-measure-inference.ts
 */

import * as tf from '@tensorflow/tfjs';
import * as fs from 'node:fs';
import * as path from 'node:path';

interface InferenceResult {
  avgTimeMs: number;
  minTimeMs: number;
  maxTimeMs: number;
  stdDevMs: number;
  samples: number;
  targetMet: boolean;
}

interface BenchmarkOptions {
  warmupRuns?: number;
  measureRuns?: number;
  batchSize?: number;
}

const TARGET_INFERENCE_MS = 50;

async function loadModel(modelPath: string): Promise<tf.LayersModel> {
  console.log(`\n📦 Creating model architecture for inference test...`);
  
  // Recreate V2 architecture (same as ml-train-model-v2.ts)
  const model = tf.sequential({
    layers: [
      tf.layers.dense({
        inputShape: [12],
        units: 128,
        activation: 'relu',
        kernelInitializer: 'heNormal',
        kernelRegularizer: tf.regularizers.l2({ l2: 0.001 })
      }),
      tf.layers.batchNormalization(),
      tf.layers.dropout({ rate: 0.4 }),
      
      tf.layers.dense({
        units: 64,
        activation: 'relu',
        kernelInitializer: 'heNormal',
        kernelRegularizer: tf.regularizers.l2({ l2: 0.001 })
      }),
      tf.layers.batchNormalization(),
      tf.layers.dropout({ rate: 0.3 }),
      
      tf.layers.dense({
        units: 32,
        activation: 'relu',
        kernelInitializer: 'heNormal',
        kernelRegularizer: tf.regularizers.l2({ l2: 0.001 })
      }),
      tf.layers.dropout({ rate: 0.2 }),
      
      tf.layers.dense({
        units: 16,
        activation: 'relu',
        kernelInitializer: 'heNormal'
      }),
      
      tf.layers.dense({
        units: 1,
        activation: 'sigmoid'
      })
    ]
  });
  
  console.log(`✅ Model created successfully`);
  console.log(`⚠️  Note: Using random weights (actual weights not needed for speed test)`);
  return model;
}

function generateSampleFeatures(): number[] {
  // 12-dimensional feature vector (realistic values)
  return [
    Math.random() * 0.3 + 0.6,  // historicalSuccessRate: 60-90%
    Math.random() * 0.3,        // errorFrequency: 0-30%
    Math.random() * 0.4 + 0.3,  // codeComplexity: 30-70%
    Math.random() * 20,         // linesChanged: 0-20
    Math.random() * 5,          // filesModified: 0-5
    Math.random() * 0.5 + 0.3,  // errorTypeCriticality: 30-80%
    Math.random() * 0.4 + 0.5,  // similarPastOutcomes: 50-90%
    Math.random(),              // timeSinceLastFailure: 0-1 (normalized)
    Math.random() * 0.3 + 0.4,  // projectMaturity: 40-70%
    Math.random() * 0.4 + 0.5,  // testCoverage: 50-90%
    Math.random() * 0.5 + 0.3,  // recipeComplexity: 30-80%
    Math.random() * 0.4 + 0.5   // communityTrust: 50-90%
  ];
}

async function measureSingleInference(
  model: tf.LayersModel,
  features: number[]
): Promise<number> {
  const startTime = performance.now();
  
  const inputTensor = tf.tensor2d([features], [1, 12]);
  const prediction = model.predict(inputTensor) as tf.Tensor;
  const result = await prediction.data();
  
  // Cleanup tensors
  inputTensor.dispose();
  prediction.dispose();
  
  const endTime = performance.now();
  return endTime - startTime;
}

async function measureBatchInference(
  model: tf.LayersModel,
  batchSize: number
): Promise<{ avgTimeMs: number; totalTimeMs: number }> {
  const features = Array.from({ length: batchSize }, () => generateSampleFeatures());
  
  const startTime = performance.now();
  
  const inputTensor = tf.tensor2d(features, [batchSize, 12]);
  const predictions = model.predict(inputTensor) as tf.Tensor;
  const results = await predictions.data();
  
  // Cleanup
  inputTensor.dispose();
  predictions.dispose();
  
  const endTime = performance.now();
  const totalTimeMs = endTime - startTime;
  const avgTimeMs = totalTimeMs / batchSize;
  
  return { avgTimeMs, totalTimeMs };
}

async function benchmark(
  model: tf.LayersModel,
  options: BenchmarkOptions = {}
): Promise<InferenceResult> {
  const {
    warmupRuns = 10,
    measureRuns = 100,
    batchSize = 1
  } = options;

  console.log(`\n⏱️  Benchmarking inference time...`);
  console.log(`   Warmup runs: ${warmupRuns}`);
  console.log(`   Measurement runs: ${measureRuns}`);
  console.log(`   Batch size: ${batchSize}`);

  // Warmup (JIT compilation, cache warming)
  console.log(`\n🔥 Warming up (${warmupRuns} runs)...`);
  for (let i = 0; i < warmupRuns; i++) {
    const features = generateSampleFeatures();
    await measureSingleInference(model, features);
  }
  
  // Actual measurements
  console.log(`\n📊 Measuring (${measureRuns} runs)...`);
  const times: number[] = [];
  
  for (let i = 0; i < measureRuns; i++) {
    const features = generateSampleFeatures();
    const time = await measureSingleInference(model, features);
    times.push(time);
    
    if ((i + 1) % 20 === 0) {
      console.log(`   Progress: ${i + 1}/${measureRuns}`);
    }
  }

  // Statistics
  const avgTimeMs = times.reduce((a, b) => a + b, 0) / times.length;
  const minTimeMs = Math.min(...times);
  const maxTimeMs = Math.max(...times);
  
  const variance = times.reduce((sum, t) => sum + Math.pow(t - avgTimeMs, 2), 0) / times.length;
  const stdDevMs = Math.sqrt(variance);
  
  const targetMet = avgTimeMs < TARGET_INFERENCE_MS;

  return {
    avgTimeMs,
    minTimeMs,
    maxTimeMs,
    stdDevMs,
    samples: times.length,
    targetMet
  };
}

async function benchmarkBatch(
  model: tf.LayersModel,
  batchSizes: number[] = [1, 10, 50, 100]
): Promise<void> {
  console.log(`\n📦 Batch Inference Benchmarks`);
  console.log(`================================\n`);

  for (const batchSize of batchSizes) {
    const { avgTimeMs, totalTimeMs } = await measureBatchInference(model, batchSize);
    
    console.log(`Batch Size: ${batchSize}`);
    console.log(`  Total Time: ${totalTimeMs.toFixed(2)}ms`);
    console.log(`  Avg Per Sample: ${avgTimeMs.toFixed(2)}ms`);
    console.log(`  Throughput: ${(1000 / avgTimeMs).toFixed(0)} predictions/sec\n`);
  }
}

function printResults(result: InferenceResult): void {
  console.log(`\n📊 Inference Time Results`);
  console.log(`==========================\n`);
  
  console.log(`Average:   ${result.avgTimeMs.toFixed(2)}ms`);
  console.log(`Min:       ${result.minTimeMs.toFixed(2)}ms`);
  console.log(`Max:       ${result.maxTimeMs.toFixed(2)}ms`);
  console.log(`Std Dev:   ${result.stdDevMs.toFixed(2)}ms`);
  console.log(`Samples:   ${result.samples}`);
  console.log(`\nTarget:    <${TARGET_INFERENCE_MS}ms`);
  console.log(`Status:    ${result.targetMet ? '✅ PASS' : '❌ FAIL (optimization needed)'}`);
  
  if (!result.targetMet) {
    const percentOver = ((result.avgTimeMs / TARGET_INFERENCE_MS - 1) * 100).toFixed(0);
    console.log(`\n⚠️  Performance is ${percentOver}% over target`);
    console.log(`\nOptimization Suggestions:`);
    console.log(`  1. Use WASM backend (@tensorflow/tfjs-backend-wasm)`);
    console.log(`  2. Model quantization (reduce weight precision)`);
    console.log(`  3. Batch predictions (predict multiple recipes at once)`);
    console.log(`  4. Result caching (memoize for same features)`);
    console.log(`  5. Simpler architecture (fewer layers/neurons)`);
  } else {
    const percentUnder = ((1 - result.avgTimeMs / TARGET_INFERENCE_MS) * 100).toFixed(0);
    console.log(`\n✅ Performance is ${percentUnder}% under target (excellent!)`);
  }
}

async function saveResults(result: InferenceResult, modelVersion: string): Promise<void> {
  const resultsDir = path.join(process.cwd(), '.odavl', 'metrics');
  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir, { recursive: true });
  }

  const resultsPath = path.join(resultsDir, `inference-time-${modelVersion}.json`);
  const data = {
    modelVersion,
    timestamp: new Date().toISOString(),
    target: TARGET_INFERENCE_MS,
    results: result,
    recommendations: result.targetMet
      ? ['Performance target met', 'No optimization needed']
      : [
          'Use WASM backend for faster computation',
          'Enable model quantization',
          'Implement batch predictions',
          'Add result caching',
          'Consider simpler architecture'
        ]
  };

  fs.writeFileSync(resultsPath, JSON.stringify(data, null, 2));
  console.log(`\n💾 Results saved to: ${resultsPath}`);
}

async function main() {
  console.log(`\n🔬 ML Model Inference Time Benchmark`);
  console.log(`====================================\n`);

  const modelVersion = 'v2';
  const modelPath = path.join(process.cwd(), '.odavl', 'ml-models', `trust-predictor-${modelVersion}`);

  try {
    // Load model
    const model = await loadModel(modelPath);
    
    // Print model info
    console.log(`\nModel Info:`);
    console.log(`  Layers: ${model.layers.length}`);
    console.log(`  Trainable params: ${model.countParams()}`);
    
    // Single inference benchmark
    const result = await benchmark(model, {
      warmupRuns: 10,
      measureRuns: 100,
      batchSize: 1
    });
    
    printResults(result);
    
    // Batch inference benchmarks
    await benchmarkBatch(model, [1, 10, 50, 100]);
    
    // Save results
    await saveResults(result, modelVersion);
    
    // Cleanup
    model.dispose();
    
    console.log(`\n✅ Benchmark complete!`);
    process.exit(result.targetMet ? 0 : 1);
    
  } catch (error) {
    console.error(`\n❌ Error:`, error);
    process.exit(1);
  }
}

main();
