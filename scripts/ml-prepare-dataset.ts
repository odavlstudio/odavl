#!/usr/bin/env node
/**
 * ML Dataset Preparation Script - Feature Extraction & Normalization
 * 
 * Takes raw GitHub samples and prepares them for ML training:
 * 1. Extract 12-dimensional features from each sample
 * 2. Normalize features (z-score normalization)
 * 3. Balance classes (50/50 success/failure)
 * 4. Split into train/val/test sets (70/15/15)
 * 
 * Usage:
 *   pnpm ml:prepare --input .odavl/datasets/typescript-fixes.json
 *   pnpm ml:prepare-all  (processes all collected datasets)
 * 
 * Output:
 *   .odavl/datasets/processed/{language}-fixes-processed.json
 */

import * as fs from 'fs';
import * as path from 'path';

interface RawSample {
  id: string;
  language: string;
  errorType: string;
  beforeCode: string;
  afterCode: string;
  linesChanged: number;
  complexity: number;
  fixSucceeded: boolean;
  metadata: {
    repo: string;
    date: string;
  };
}

interface ProcessedSample {
  features: number[];              // 12-dimensional vector
  label: number;                   // 0 or 1
  metadata: {
    sampleId: string;
    language: string;
    errorType: string;
  };
}

interface Dataset {
  train: ProcessedSample[];
  validation: ProcessedSample[];
  test: ProcessedSample[];
  metadata: {
    language: string;
    totalSamples: number;
    trainSize: number;
    valSize: number;
    testSize: number;
    featureMeans: number[];
    featureStds: number[];
  };
}

/**
 * Extract 12-dimensional features from raw sample
 */
function extractFeatures(sample: RawSample, repoStats: Map<string, any>): number[] {
  const repo = repoStats.get(sample.metadata.repo);

  return [
    // 1. Historical success rate (computed per repo)
    repo?.successRate ?? 0.5,

    // 2. Error frequency (how common this error type is)
    repo?.errorFrequency[sample.errorType] ?? 0.1,

    // 3. Code complexity (cyclomatic)
    Math.min(1, sample.complexity / 100),

    // 4. Lines changed (normalized by typical file size)
    Math.min(1, sample.linesChanged / 100),

    // 5. Files modified (assume 1 file per sample for now)
    0.1,

    // 6. Error type criticality
    getErrorCriticality(sample.errorType),

    // 7. Similar past outcomes (placeholder - would need cosine similarity)
    0.5,

    // 8. Time since last failure (days, normalized)
    0.5, // Placeholder

    // 9. Project maturity (use repo stars as proxy)
    Math.min(1, (repo?.stars ?? 100) / 10000),

    // 10. Test coverage (estimate from code patterns)
    estimateTestCoverage(sample.afterCode),

    // 11. Recipe complexity (lines changed as proxy)
    Math.min(1, sample.linesChanged / 50),

    // 12. Community trust (repo stars)
    Math.min(1, (repo?.stars ?? 100) / 10000),
  ];
}

/**
 * Get error criticality score
 */
function getErrorCriticality(errorType: string): number {
  const criticalityMap: Record<string, number> = {
    'security': 1.0,
    'runtime-null': 0.8,
    'typescript-type': 0.4,
    'import-missing': 0.5,
    'performance': 0.6,
    'general-fix': 0.5,
  };

  return criticalityMap[errorType] ?? 0.5;
}

/**
 * Estimate test coverage from code
 */
function estimateTestCoverage(code: string): number {
  // Simple heuristic: check for test keywords
  const testKeywords = ['test(', 'describe(', 'it(', 'expect(', 'assert'];
  const hasTests = testKeywords.some(keyword => code.includes(keyword));

  return hasTests ? 0.8 : 0.3; // Rough estimate
}

/**
 * Calculate repository statistics for feature extraction
 */
function calculateRepoStats(samples: RawSample[]): Map<string, any> {
  const repoStats = new Map<string, any>();

  // Group by repo
  const byRepo = new Map<string, RawSample[]>();
  for (const sample of samples) {
    const repo = sample.metadata.repo;
    if (!byRepo.has(repo)) {
      byRepo.set(repo, []);
    }
    byRepo.get(repo)!.push(sample);
  }

  // Calculate stats per repo
  for (const [repo, repoSamples] of byRepo.entries()) {
    const successes = repoSamples.filter(s => s.fixSucceeded).length;
    const total = repoSamples.length;

    const errorFrequency: Record<string, number> = {};
    for (const sample of repoSamples) {
      errorFrequency[sample.errorType] = (errorFrequency[sample.errorType] ?? 0) + 1;
    }

    // Normalize error frequencies
    for (const type in errorFrequency) {
      errorFrequency[type] = errorFrequency[type] / total;
    }

    repoStats.set(repo, {
      successRate: total > 0 ? successes / total : 0.5,
      errorFrequency,
      stars: 1000, // Placeholder (would need GitHub API)
    });
  }

  return repoStats;
}

/**
 * Normalize features using z-score normalization
 */
function normalizeFeatures(samples: ProcessedSample[]): {
  normalized: ProcessedSample[];
  means: number[];
  stds: number[];
} {
  const numFeatures = 12;

  // Calculate means
  const means = new Array(numFeatures).fill(0);
  for (const sample of samples) {
    for (let i = 0; i < numFeatures; i++) {
      means[i] += sample.features[i];
    }
  }
  for (let i = 0; i < numFeatures; i++) {
    means[i] /= samples.length;
  }

  // Calculate standard deviations
  const stds = new Array(numFeatures).fill(0);
  for (const sample of samples) {
    for (let i = 0; i < numFeatures; i++) {
      stds[i] += Math.pow(sample.features[i] - means[i], 2);
    }
  }
  for (let i = 0; i < numFeatures; i++) {
    stds[i] = Math.sqrt(stds[i] / samples.length);
    if (stds[i] === 0) stds[i] = 1; // Avoid division by zero
  }

  // Normalize samples
  const normalized = samples.map(sample => ({
    ...sample,
    features: sample.features.map((f, i) => (f - means[i]) / stds[i]),
  }));

  return { normalized, means, stds };
}

/**
 * Balance classes (50/50 success/failure)
 */
function balanceClasses(samples: ProcessedSample[]): ProcessedSample[] {
  const successes = samples.filter(s => s.label === 1);
  const failures = samples.filter(s => s.label === 0);

  const minSize = Math.min(successes.length, failures.length);

  // Randomly sample to balance
  const balancedSuccesses = successes.slice(0, minSize);
  const balancedFailures = failures.slice(0, minSize);

  return [...balancedSuccesses, ...balancedFailures];
}

/**
 * Split dataset into train/val/test (70/15/15)
 */
function splitDataset(samples: ProcessedSample[]): {
  train: ProcessedSample[];
  validation: ProcessedSample[];
  test: ProcessedSample[];
} {
  // Shuffle samples
  const shuffled = samples.sort(() => Math.random() - 0.5);

  const trainSize = Math.floor(samples.length * 0.7);
  const valSize = Math.floor(samples.length * 0.15);

  return {
    train: shuffled.slice(0, trainSize),
    validation: shuffled.slice(trainSize, trainSize + valSize),
    test: shuffled.slice(trainSize + valSize),
  };
}

/**
 * Process raw dataset
 */
function processDataset(inputPath: string, outputPath: string): void {
  console.log(`\n📂 Processing: ${inputPath}`);

  // Load raw samples
  const raw = JSON.parse(fs.readFileSync(inputPath, 'utf-8')) as RawSample[];
  console.log(`  Loaded: ${raw.length} raw samples`);

  // Calculate repo statistics
  console.log(`  Calculating repository statistics...`);
  const repoStats = calculateRepoStats(raw);

  // Extract features
  console.log(`  Extracting features...`);
  const processed: ProcessedSample[] = raw.map(sample => ({
    features: extractFeatures(sample, repoStats),
    label: sample.fixSucceeded ? 1 : 0,
    metadata: {
      sampleId: sample.id,
      language: sample.language,
      errorType: sample.errorType,
    },
  }));

  // Normalize features
  console.log(`  Normalizing features (z-score)...`);
  const { normalized, means, stds } = normalizeFeatures(processed);

  // Balance classes
  console.log(`  Balancing classes (50/50)...`);
  const balanced = balanceClasses(normalized);
  console.log(`  Balanced: ${balanced.length} samples`);

  // Split dataset
  console.log(`  Splitting dataset (70/15/15)...`);
  const { train, validation, test } = splitDataset(balanced);

  // Create dataset object
  const dataset: Dataset = {
    train,
    validation,
    test,
    metadata: {
      language: raw[0]?.language ?? 'unknown',
      totalSamples: balanced.length,
      trainSize: train.length,
      valSize: validation.length,
      testSize: test.length,
      featureMeans: means,
      featureStds: stds,
    },
  };

  // Save processed dataset
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(outputPath, JSON.stringify(dataset, null, 2));

  console.log(`  ✅ Processed dataset saved to: ${outputPath}`);
  console.log(`  📊 Train: ${train.length}, Val: ${validation.length}, Test: ${test.length}\n`);
}

/**
 * Main entry point
 */
async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.includes('--help')) {
    console.log(`
🧪 ODAVL ML Dataset Preparation

Usage:
  pnpm ml:prepare --input <file>
  pnpm ml:prepare-all

Options:
  --input      Input JSON file (raw samples)
  --all        Process all datasets in .odavl/datasets/

Output:
  .odavl/datasets/processed/{language}-fixes-processed.json

Features Extracted:
  1. Historical success rate
  2. Error frequency
  3. Code complexity
  4. Lines changed
  5. Files modified
  6. Error type criticality
  7. Similar past outcomes
  8. Time since last failure
  9. Project maturity
  10. Test coverage
  11. Recipe complexity
  12. Community trust
`);
    return;
  }

  if (args.includes('--all')) {
    // Process all datasets
    const datasetsDir = path.join(process.cwd(), '.odavl', 'datasets');
    const files = fs.readdirSync(datasetsDir).filter(f => f.endsWith('-fixes.json'));

    console.log(`\n🚀 Processing ${files.length} datasets...\n`);

    for (const file of files) {
      const inputPath = path.join(datasetsDir, file);
      const outputPath = path.join(
        datasetsDir,
        'processed',
        file.replace('.json', '-processed.json')
      );

      processDataset(inputPath, outputPath);
    }

    console.log(`\n✅ All datasets processed!\n`);
  } else {
    // Process single dataset
    const inputIndex = args.indexOf('--input');
    if (inputIndex === -1 || inputIndex + 1 >= args.length) {
      console.error('❌ Error: --input <file> required');
      process.exit(1);
    }

    const inputPath = args[inputIndex + 1];
    const outputPath = inputPath.replace('.json', '-processed.json');

    processDataset(inputPath, outputPath);
  }
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
