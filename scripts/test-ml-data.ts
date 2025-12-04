#!/usr/bin/env tsx

/**
 * ODAVL Studio - ML Data Organization Demo
 * 
 * Demonstrates the ML training data structure:
 * - Dataset loading and validation
 * - Model registry access
 * - Sample preprocessing
 * 
 * Usage:
 *   tsx scripts/test-ml-data.ts
 *   pnpm test:ml-data
 */

import * as fs from 'node:fs/promises';
import * as path from 'node:path';

console.log('🤖 ODAVL ML Data Organization Demo\n');

const ML_DATA_DIR = path.join(process.cwd(), 'ml-data');

// Dataset types
interface TypeScriptErrorSample {
  id: string;
  errorCode: string;
  message: string;
  severity: string;
  category: string;
  metadata: {
    frequency: number;
    successRate: number;
    autoFixable: boolean;
  };
}

interface Dataset<T> {
  version: string;
  updated: string;
  description: string;
  totalSamples: number;
  categories: string[];
  samples: T[];
}

interface ModelInfo {
  id: string;
  name: string;
  version: string;
  type: string;
  status: string;
  metrics: Record<string, number>;
  trainingData: {
    samples: number;
    features: number;
  };
}

async function testDatasetLoading() {
  console.log('📊 Testing Dataset Loading...\n');

  try {
    // Load TypeScript errors dataset
    const tsErrorsPath = path.join(ML_DATA_DIR, 'datasets', 'typescript-errors.json');
    const tsErrorsData = await fs.readFile(tsErrorsPath, 'utf-8');
    const tsErrors: Dataset<TypeScriptErrorSample> = JSON.parse(tsErrorsData);

    console.log('✅ TypeScript Errors Dataset:');
    console.log(`   Version: ${tsErrors.version}`);
    console.log(`   Total Samples: ${tsErrors.totalSamples}`);
    console.log(`   Categories: ${tsErrors.categories.join(', ')}`);
    console.log(`   Last Updated: ${tsErrors.updated}`);

    // Show sample statistics
    const avgSuccessRate = tsErrors.samples.reduce((sum, s) => sum + s.metadata.successRate, 0) / tsErrors.samples.length;
    const autoFixableCount = tsErrors.samples.filter(s => s.metadata.autoFixable).length;

    console.log(`   Avg Success Rate: ${(avgSuccessRate * 100).toFixed(1)}%`);
    console.log(`   Auto-fixable: ${autoFixableCount}/${tsErrors.samples.length}`);

    // Load Python issues dataset
    const pyIssuesPath = path.join(ML_DATA_DIR, 'datasets', 'python-issues.json');
    const pyIssuesData = await fs.readFile(pyIssuesPath, 'utf-8');
    const pyIssues = JSON.parse(pyIssuesData);

    console.log('\n✅ Python Issues Dataset:');
    console.log(`   Version: ${pyIssues.version}`);
    console.log(`   Total Samples: ${pyIssues.totalSamples}`);
    console.log(`   Categories: ${pyIssues.categories.join(', ')}`);
    console.log(`   Last Updated: ${pyIssues.updated}`);

  } catch (error) {
    console.error('❌ Error loading datasets:', (error as Error).message);
  }
}

async function testModelRegistry() {
  console.log('\n\n🤖 Testing Model Registry...\n');

  try {
    const registryPath = path.join(ML_DATA_DIR, 'models', 'model-registry.json');
    const registryData = await fs.readFile(registryPath, 'utf-8');
    const registry: { models: ModelInfo[]; metadata: Record<string, any> } = JSON.parse(registryData);

    console.log('✅ Model Registry:');
    console.log(`   Total Models: ${registry.metadata.totalModels}`);
    console.log(`   Production Models: ${registry.metadata.productionModels}`);
    console.log(`   Framework: TensorFlow.js v${registry.metadata.frameworkVersion}`);

    console.log('\n   Registered Models:');
    registry.models.forEach((model, index) => {
      console.log(`   ${index + 1}. ${model.name} (${model.id})`);
      console.log(`      Type: ${model.type}`);
      console.log(`      Status: ${model.status}`);
      console.log(`      Accuracy: ${(model.metrics.accuracy * 100).toFixed(1)}%`);
      console.log(`      Training Samples: ${model.trainingData.samples.toLocaleString()}`);
      console.log(`      Features: ${model.trainingData.features}`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error loading model registry:', (error as Error).message);
  }
}

async function testDirectoryStructure() {
  console.log('\n📁 Testing Directory Structure...\n');

  const expectedDirs = [
    'datasets',
    'models',
    'evaluation',
    'preprocessing'
  ];

  for (const dir of expectedDirs) {
    const dirPath = path.join(ML_DATA_DIR, dir);
    try {
      const stat = await fs.stat(dirPath);
      if (stat.isDirectory()) {
        const files = await fs.readdir(dirPath);
        console.log(`✅ ${dir}/ (${files.length} items)`);
      }
    } catch (error) {
      console.log(`❌ ${dir}/ (missing)`);
    }
  }
}

async function showDataStatistics() {
  console.log('\n\n📈 Dataset Statistics Summary:\n');

  const stats = [
    { name: 'TypeScript Errors', samples: 10, features: 128, classes: 15, file: 'typescript-errors.json' },
    { name: 'Python Issues', samples: 5, features: 96, classes: 12, file: 'python-issues.json' },
    { name: 'Java Patterns', samples: 0, features: 112, classes: 10, file: 'java-patterns.json (todo)' },
    { name: 'Security CVEs', samples: 0, features: 64, classes: 8, file: 'security-cves.json (todo)' }
  ];

  console.log('┌─────────────────────────┬─────────┬──────────┬─────────┐');
  console.log('│ Dataset                 │ Samples │ Features │ Classes │');
  console.log('├─────────────────────────┼─────────┼──────────┼─────────┤');

  stats.forEach(stat => {
    const name = stat.name.padEnd(23);
    const samples = stat.samples.toString().padStart(7);
    const features = stat.features.toString().padStart(8);
    const classes = stat.classes.toString().padStart(7);
    console.log(`│ ${name} │ ${samples} │ ${features} │ ${classes} │`);
  });

  console.log('└─────────────────────────┴─────────┴──────────┴─────────┘');

  const totalSamples = stats.reduce((sum, s) => sum + s.samples, 0);
  console.log(`\nTotal Training Samples: ${totalSamples} (15 available, 36,000 planned)`);
}

async function main() {
  await testDirectoryStructure();
  await testDatasetLoading();
  await testModelRegistry();
  await showDataStatistics();

  console.log('\n\n✅ ML Data Organization Test Complete!');
  console.log('\n📝 Next Steps:');
  console.log('   1. Collect more training data (target: 36,000 samples)');
  console.log('   2. Train baseline models');
  console.log('   3. Evaluate model performance');
  console.log('   4. Deploy to production');
  console.log('\n📚 Documentation:');
  console.log('   ml-data/README.md - Complete ML data guide');
}

main().catch(console.error);
