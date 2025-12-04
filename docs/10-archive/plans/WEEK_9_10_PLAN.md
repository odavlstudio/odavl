# Week 9-10: Real Data Collection & Production Validation 📊

**Duration**: 10-12 days  
**Phase**: Phase 2 Month 2 - ML System V2  
**Status**: ⏳ **IN PROGRESS**  
**Goal**: Collect 50,000+ real autopilot executions, validate 87% ML accuracy

---

## 🎯 Objectives

### Primary Goal
**Validate ML System V2 with real production data** - Prove that the 87% accuracy from Day 4 A/B testing holds true when deployed to actual codebases with real developers.

### Success Criteria
```yaml
Data Collection:
  - ✅ 50,000+ recipe executions logged
  - ✅ ML predictions captured for each execution
  - ✅ Actual outcomes recorded (success/failure)
  - ✅ Feature vectors stored for retraining

Accuracy Validation:
  - ✅ ML accuracy ≥85% on real data (vs 87% on test set)
  - ✅ ML beats heuristic by ≥3% (vs 3.5% in Day 4)
  - ✅ False positive rate <5%
  - ✅ Auto-approval rate 40-60%

Production Quality:
  - ✅ Zero crashes from ML predictions
  - ✅ Prediction latency <100ms (p99)
  - ✅ Graceful fallback when model fails
  - ✅ Data pipeline handles 1000+ requests/hour
```

---

## 📋 Implementation Plan

### Phase 1: Production Setup (Day 1-2)

#### Day 1 Morning: Environment Configuration

**Task 1.1: Create Production Configuration**

```bash
# Create production .env
cat > .env.production << 'EOF'
# ML Configuration
ML_ENABLE=true
ML_MODEL_PATH=.odavl/models/trust-predictor-v2.joblib
ML_CONFIDENCE_THRESHOLD=0.65
ML_AUTO_APPLY_THRESHOLD=0.85

# Data Collection
DATA_COLLECTION_ENABLED=true
DATA_LOG_PATH=.odavl/data-collection/
DATA_BATCH_SIZE=1000
DATA_FLUSH_INTERVAL=300000  # 5 minutes

# Feature Flags
FEATURE_AUTO_APPROVE=true
FEATURE_BATCH_PROCESSING=false
FEATURE_A_B_TESTING=false  # Disable, we're in production

# Monitoring
SENTRY_DSN=https://...  # Add your Sentry DSN
DATADOG_API_KEY=...      # Add your Datadog key
LOG_LEVEL=info
EOF
```

**Task 1.2: Setup Data Collection Directory**

```bash
# Create directory structure
mkdir -p .odavl/data-collection/{raw,processed,models}

# Initialize data collection metadata
cat > .odavl/data-collection/metadata.json << 'EOF'
{
  "version": "2.0",
  "startDate": "2025-01-22T00:00:00Z",
  "targetSamples": 50000,
  "collectedSamples": 0,
  "mlEnabled": true,
  "modelVersion": "v2.0-day4",
  "accuracyBaseline": 0.87,
  "heuristicBaseline": 0.835
}
EOF
```

**Task 1.3: Update MLTrustPredictor for Data Logging**

```typescript
// odavl-studio/insight/core/src/learning/ml-trust-predictor.ts

// Add after existing imports
import * as fs from 'node:fs/promises';
import * as path from 'node:path';

export class MLTrustPredictor {
  private dataLogPath: string;
  private logBuffer: DataPoint[] = [];
  private readonly BATCH_SIZE = 1000;

  constructor(options: MLPredictorOptions) {
    // ... existing constructor code
    
    // New: Setup data collection
    if (process.env.DATA_COLLECTION_ENABLED === 'true') {
      this.dataLogPath = process.env.DATA_LOG_PATH || '.odavl/data-collection/raw/';
      this.initializeDataCollection();
    }
  }

  private async initializeDataCollection(): Promise<void> {
    try {
      await fs.mkdir(this.dataLogPath, { recursive: true });
      console.log(`✅ Data collection initialized at ${this.dataLogPath}`);
    } catch (error) {
      console.error('❌ Failed to initialize data collection:', error);
    }
  }

  async predict(features: MLFeatures, context?: PredictionContext): Promise<TrustPrediction> {
    const startTime = Date.now();
    
    // Make prediction (existing code)
    const prediction = await this.predictInternal(features);
    
    // NEW: Log for data collection
    if (this.dataLogPath && context) {
      await this.logPrediction(features, prediction, context);
    }
    
    return prediction;
  }

  private async logPrediction(
    features: MLFeatures,
    prediction: TrustPrediction,
    context: PredictionContext
  ): Promise<void> {
    const dataPoint: DataPoint = {
      timestamp: new Date().toISOString(),
      recipeId: context.recipeId,
      features: features,
      prediction: {
        trustScore: prediction.trustScore,
        recommendation: prediction.recommendation,
        confidence: prediction.confidence,
        usedML: this.mlEnabled && this.modelLoaded
      },
      outcome: null,  // Will be filled later when we know the result
      metadata: {
        fileCount: context.filesModified?.length || 0,
        linesChanged: context.linesChanged || 0,
        projectPath: context.projectPath
      }
    };

    this.logBuffer.push(dataPoint);

    // Flush buffer when full
    if (this.logBuffer.length >= this.BATCH_SIZE) {
      await this.flushLogBuffer();
    }
  }

  private async flushLogBuffer(): Promise<void> {
    if (this.logBuffer.length === 0) return;

    try {
      const filename = `predictions-${Date.now()}.jsonl`;
      const filepath = path.join(this.dataLogPath, filename);
      
      const lines = this.logBuffer.map(dp => JSON.stringify(dp)).join('\n');
      await fs.appendFile(filepath, lines + '\n');
      
      console.log(`📊 Flushed ${this.logBuffer.length} predictions to ${filename}`);
      this.logBuffer = [];
    } catch (error) {
      console.error('❌ Failed to flush log buffer:', error);
    }
  }

  // New: Record actual outcome after recipe execution
  async recordOutcome(recipeId: string, success: boolean, metrics?: OutcomeMetrics): Promise<void> {
    // Implementation: Update the logged prediction with actual outcome
    // This will be called by the ACT phase after recipe execution
  }
}

// Types
interface DataPoint {
  timestamp: string;
  recipeId: string;
  features: MLFeatures;
  prediction: {
    trustScore: number;
    recommendation: 'auto-apply' | 'review-suggested' | 'manual-only';
    confidence: number;
    usedML: boolean;
  };
  outcome: {
    success: boolean;
    errorCount?: number;
    testsPass?: boolean;
    verificationScore?: number;
  } | null;
  metadata: {
    fileCount: number;
    linesChanged: number;
    projectPath: string;
  };
}

interface PredictionContext {
  recipeId: string;
  filesModified?: string[];
  linesChanged?: number;
  projectPath: string;
}

interface OutcomeMetrics {
  errorCount: number;
  testsPass: boolean;
  verificationScore: number;
}
```

#### Day 1 Afternoon: DECIDE Phase Integration

**Task 1.4: Update DECIDE Phase to Use ML Predictions**

```typescript
// odavl-studio/autopilot/engine/src/phases/decide.ts

import { MLTrustPredictor, extractFeatures } from '@odavl-studio/insight-core/learning';

export async function decide(metrics: Metrics): Promise<Recipe> {
  // ... existing metrics analysis code

  // Load recipes
  const recipes = await loadRecipes('.odavl/recipes/');
  
  // NEW: ML-powered recipe selection
  if (process.env.ML_ENABLE === 'true') {
    return await decideWithML(recipes, metrics);
  } else {
    // Fallback to trust score sorting
    return decideLegacy(recipes);
  }
}

async function decideWithML(recipes: Recipe[], metrics: Metrics): Promise<Recipe> {
  const predictor = new MLTrustPredictor({
    mlEnabled: true,
    modelPath: process.env.ML_MODEL_PATH || '.odavl/models/trust-predictor-v2.joblib'
  });

  // Score all recipes with ML
  const scoredRecipes = await Promise.all(
    recipes.map(async (recipe) => {
      const features = extractFeatures(recipe, metrics);
      const prediction = await predictor.predict(features, {
        recipeId: recipe.id,
        filesModified: recipe.filesModified,
        linesChanged: recipe.linesChanged,
        projectPath: metrics.projectPath
      });

      return {
        recipe,
        mlTrustScore: prediction.trustScore,
        recommendation: prediction.recommendation,
        confidence: prediction.confidence
      };
    })
  );

  // Sort by ML trust score (descending)
  scoredRecipes.sort((a, b) => b.mlTrustScore - a.mlTrustScore);

  // Log decision
  console.log('📊 ML Recipe Ranking:');
  scoredRecipes.slice(0, 5).forEach((sr, idx) => {
    console.log(`  ${idx + 1}. ${sr.recipe.id} - Trust: ${sr.mlTrustScore.toFixed(3)} (${sr.recommendation})`);
  });

  // Return top recipe
  const selected = scoredRecipes[0];
  console.log(`✅ Selected: ${selected.recipe.id} with ML trust ${selected.mlTrustScore.toFixed(3)}`);
  
  return selected.recipe;
}
```

#### Day 2: VERIFY Phase Outcome Logging

**Task 1.5: Record Actual Outcomes After Recipe Execution**

```typescript
// odavl-studio/autopilot/engine/src/phases/verify.ts

import { MLTrustPredictor } from '@odavl-studio/insight-core/learning';

export async function verify(result: ActResult): Promise<VerificationReport> {
  // ... existing verification code (run tests, check errors, etc.)

  const report: VerificationReport = {
    success: errorCount === 0 && testsPass,
    errorCount,
    testsPass,
    verificationScore: calculateScore(errorCount, testsPass)
  };

  // NEW: Record outcome for ML data collection
  if (process.env.DATA_COLLECTION_ENABLED === 'true') {
    await recordMLOutcome(result.recipeId, report);
  }

  return report;
}

async function recordMLOutcome(recipeId: string, report: VerificationReport): Promise<void> {
  try {
    const predictor = new MLTrustPredictor({ mlEnabled: true });
    await predictor.recordOutcome(recipeId, report.success, {
      errorCount: report.errorCount,
      testsPass: report.testsPass,
      verificationScore: report.verificationScore
    });
    
    console.log(`📊 Recorded outcome for ${recipeId}: ${report.success ? '✅' : '❌'}`);
  } catch (error) {
    console.error('❌ Failed to record ML outcome:', error);
  }
}
```

---

### Phase 2: Data Collection (Day 3-12)

#### Task 2.1: Run Continuous Autopilot Cycles

**Deployment Strategy: 3 Environments**

```bash
# Environment 1: Internal Dogfooding (ODAVL repo itself)
cd ~/dev/odavl
pnpm odavl autopilot run --continuous --max-cycles 1000

# Environment 2: Beta User Projects (with consent)
# Deploy to 10 beta user repos via GitHub App
# Target: 5,000 executions per repo = 50,000 total

# Environment 3: Public Open Source Projects
# Run on 50 popular TypeScript repos
# Target: 1,000 executions per repo = 50,000 total
```

**Monitoring Dashboard**

```typescript
// scripts/monitor-data-collection.ts

import * as fs from 'node:fs/promises';
import * as path from 'node:path';

async function monitorDataCollection() {
  const dataDir = '.odavl/data-collection/raw/';
  const files = await fs.readdir(dataDir);
  
  let totalSamples = 0;
  let mlPredictions = 0;
  let completedOutcomes = 0;

  for (const file of files) {
    if (!file.endsWith('.jsonl')) continue;
    
    const content = await fs.readFile(path.join(dataDir, file), 'utf-8');
    const lines = content.split('\n').filter(l => l.trim());
    
    lines.forEach(line => {
      const dataPoint = JSON.parse(line);
      totalSamples++;
      if (dataPoint.prediction.usedML) mlPredictions++;
      if (dataPoint.outcome !== null) completedOutcomes++;
    });
  }

  console.log('\n📊 Data Collection Progress:');
  console.log('━'.repeat(50));
  console.log(`Total Samples:      ${totalSamples.toLocaleString()} / 50,000`);
  console.log(`ML Predictions:     ${mlPredictions.toLocaleString()} (${(mlPredictions/totalSamples*100).toFixed(1)}%)`);
  console.log(`Completed Outcomes: ${completedOutcomes.toLocaleString()} (${(completedOutcomes/totalSamples*100).toFixed(1)}%)`);
  console.log(`Progress:           ${'█'.repeat(Math.floor(totalSamples/500))}${'░'.repeat(100-Math.floor(totalSamples/500))} ${(totalSamples/50000*100).toFixed(1)}%`);
  console.log('━'.repeat(50));
}

// Run every 30 minutes
setInterval(monitorDataCollection, 30 * 60 * 1000);
monitorDataCollection(); // Initial run
```

#### Task 2.2: Daily Data Quality Checks

```bash
# Run daily at 9 AM
# scripts/daily-data-check.sh

#!/bin/bash

echo "🔍 Daily Data Quality Check - $(date)"

# Check 1: Data corruption
echo "Checking for corrupted JSONL files..."
find .odavl/data-collection/raw/ -name "*.jsonl" -exec sh -c '
  if ! jq empty {} 2>/dev/null; then
    echo "❌ Corrupted: {}"
  fi
' \;

# Check 2: Prediction latency
echo "Checking ML prediction latency..."
node scripts/check-prediction-latency.js

# Check 3: Outcome completion rate
echo "Checking outcome completion rate..."
node scripts/check-outcome-rate.js

# Check 4: Accuracy trends
echo "Checking accuracy trends..."
node scripts/calculate-rolling-accuracy.js

# Check 5: Disk space
echo "Checking disk space..."
du -sh .odavl/data-collection/
```

---

### Phase 3: Data Analysis (Day 13-14)

#### Task 3.1: Process Raw Data

```typescript
// scripts/process-raw-data.ts

import * as fs from 'node:fs/promises';
import * as path from 'node:path';

interface ProcessedDataset {
  samples: DataPoint[];
  summary: {
    totalSamples: number;
    mlPredictions: number;
    heuristicPredictions: number;
    completedOutcomes: number;
    successRate: number;
    mlAccuracy: number;
    heuristicAccuracy: number;
    improvementOverHeuristic: number;
  };
}

async function processRawData(): Promise<ProcessedDataset> {
  const rawDir = '.odavl/data-collection/raw/';
  const files = await fs.readdir(rawDir);
  
  const samples: DataPoint[] = [];
  
  // Load all samples
  for (const file of files) {
    if (!file.endsWith('.jsonl')) continue;
    
    const content = await fs.readFile(path.join(rawDir, file), 'utf-8');
    const lines = content.split('\n').filter(l => l.trim());
    
    lines.forEach(line => {
      const dataPoint = JSON.parse(line);
      if (dataPoint.outcome !== null) {  // Only include completed samples
        samples.push(dataPoint);
      }
    });
  }

  // Calculate statistics
  const mlSamples = samples.filter(s => s.prediction.usedML);
  const heuristicSamples = samples.filter(s => !s.prediction.usedML);
  
  const mlCorrect = mlSamples.filter(s => {
    const predicted = s.prediction.recommendation !== 'manual-only';
    const actual = s.outcome!.success;
    return predicted === actual;
  }).length;
  
  const heuristicCorrect = heuristicSamples.filter(s => {
    const predicted = s.prediction.recommendation !== 'manual-only';
    const actual = s.outcome!.success;
    return predicted === actual;
  }).length;

  const mlAccuracy = mlCorrect / mlSamples.length;
  const heuristicAccuracy = heuristicCorrect / heuristicSamples.length;
  
  const summary = {
    totalSamples: samples.length,
    mlPredictions: mlSamples.length,
    heuristicPredictions: heuristicSamples.length,
    completedOutcomes: samples.length,
    successRate: samples.filter(s => s.outcome!.success).length / samples.length,
    mlAccuracy,
    heuristicAccuracy,
    improvementOverHeuristic: mlAccuracy - heuristicAccuracy
  };

  // Save processed dataset
  await fs.writeFile(
    '.odavl/data-collection/processed/dataset-v2.json',
    JSON.stringify({ samples, summary }, null, 2)
  );

  return { samples, summary };
}

// Run analysis
processRawData().then(dataset => {
  console.log('\n📊 Dataset Analysis Complete:');
  console.log('━'.repeat(60));
  console.log(`Total Samples:       ${dataset.summary.totalSamples.toLocaleString()}`);
  console.log(`ML Predictions:      ${dataset.summary.mlPredictions.toLocaleString()}`);
  console.log(`Heuristic Fallback:  ${dataset.summary.heuristicPredictions.toLocaleString()}`);
  console.log('');
  console.log(`✅ Success Rate:     ${(dataset.summary.successRate * 100).toFixed(1)}%`);
  console.log(`🤖 ML Accuracy:      ${(dataset.summary.mlAccuracy * 100).toFixed(1)}%`);
  console.log(`📊 Heuristic Acc:    ${(dataset.summary.heuristicAccuracy * 100).toFixed(1)}%`);
  console.log(`🚀 Improvement:      +${(dataset.summary.improvementOverHeuristic * 100).toFixed(1)}%`);
  console.log('━'.repeat(60));
  
  // Validation: Check against Day 4 baseline
  const day4MLAccuracy = 0.87;
  const day4Heuristic = 0.835;
  
  if (dataset.summary.mlAccuracy >= 0.85) {
    console.log('✅ ML accuracy meets threshold (≥85%)');
  } else {
    console.log(`⚠️  ML accuracy below threshold: ${(dataset.summary.mlAccuracy * 100).toFixed(1)}% < 85%`);
    console.log('   → Model retraining recommended');
  }
  
  if (dataset.summary.improvementOverHeuristic >= 0.03) {
    console.log('✅ ML beats heuristic by ≥3%');
  } else {
    console.log(`⚠️  ML improvement too small: +${(dataset.summary.improvementOverHeuristic * 100).toFixed(1)}% < 3%`);
  }
});
```

#### Task 3.2: Generate Accuracy Report

```typescript
// scripts/generate-accuracy-report.ts

import { createWriteStream } from 'node:fs';

async function generateAccuracyReport() {
  const dataset = JSON.parse(
    await fs.readFile('.odavl/data-collection/processed/dataset-v2.json', 'utf-8')
  );

  const report = createWriteStream('.odavl/data-collection/ACCURACY_REPORT.md');

  report.write(`# Week 9-10 Accuracy Report\n\n`);
  report.write(`**Generated**: ${new Date().toISOString()}\n`);
  report.write(`**Dataset Size**: ${dataset.summary.totalSamples.toLocaleString()} samples\n\n`);
  
  report.write(`## Summary\n\n`);
  report.write(`| Metric | ML (v2.0) | Heuristic | Δ |\n`);
  report.write(`|--------|-----------|-----------|----|\n`);
  report.write(`| Accuracy | ${(dataset.summary.mlAccuracy * 100).toFixed(1)}% | ${(dataset.summary.heuristicAccuracy * 100).toFixed(1)}% | +${(dataset.summary.improvementOverHeuristic * 100).toFixed(1)}% |\n`);
  report.write(`| Samples | ${dataset.summary.mlPredictions.toLocaleString()} | ${dataset.summary.heuristicPredictions.toLocaleString()} | - |\n\n`);
  
  report.write(`## Validation Against Day 4 Baseline\n\n`);
  report.write(`| Metric | Day 4 Test Set | Week 9-10 Production | Status |\n`);
  report.write(`|--------|----------------|---------------------|--------|\n`);
  report.write(`| ML Accuracy | 87.0% | ${(dataset.summary.mlAccuracy * 100).toFixed(1)}% | ${dataset.summary.mlAccuracy >= 0.85 ? '✅' : '❌'} |\n`);
  report.write(`| Heuristic | 83.5% | ${(dataset.summary.heuristicAccuracy * 100).toFixed(1)}% | - |\n`);
  report.write(`| Improvement | +3.5% | +${(dataset.summary.improvementOverHeuristic * 100).toFixed(1)}% | ${dataset.summary.improvementOverHeuristic >= 0.03 ? '✅' : '❌'} |\n\n`);
  
  // More detailed analysis...
  report.end();
  
  console.log('✅ Accuracy report generated: .odavl/data-collection/ACCURACY_REPORT.md');
}
```

---

## 📊 Monitoring & Alerts

### Real-time Monitoring (Sentry + Datadog)

```typescript
// odavl-studio/insight/core/src/learning/monitoring.ts

import * as Sentry from '@sentry/node';

export function setupMLMonitoring() {
  // Track prediction latency
  Sentry.addTracingExtensions();
  
  // Custom metrics
  Sentry.metrics.increment('ml.predictions.total', 1);
  Sentry.metrics.distribution('ml.prediction.latency', latency);
  Sentry.metrics.gauge('ml.accuracy.rolling', accuracy);
}

// Alert thresholds
const ALERTS = {
  predictionLatencyP99: 100, // ms
  accuracyDropThreshold: 0.05, // 5% drop
  errorRateThreshold: 0.01, // 1%
};
```

---

## ✅ Success Metrics (Week 9-10)

```yaml
Data Collection: ✅
  - 50,000+ samples collected
  - 95%+ have complete outcomes
  - 90%+ used ML predictions
  - Zero data corruption

Accuracy Validation: ✅
  - ML accuracy: 85-90% on real data
  - Beats heuristic by 3-5%
  - False positive rate: <5%
  - Consistent across project types

Production Quality: ✅
  - Zero ML-related crashes
  - Prediction latency: <50ms (p99)
  - Graceful fallback: 100% uptime
  - Data pipeline: handles 2000+ req/hour

Business Impact: ✅
  - Auto-approval rate: 50%+ (vs 20% heuristic)
  - Developer time saved: 10+ hours/week
  - Beta user satisfaction: NPS >70
  - Feature request: "When is this available?"
```

---

## 🚀 Next Steps After Week 9-10

### Week 11-12: Production Optimization
```yaml
Tasks:
  - Model retraining with 50K samples
  - Feature engineering improvements
  - Hyperparameter tuning
  - A/B test v2.0 vs v2.1
  - Production rollout to all users
```

### Phase 3 (Month 4-6): Market Launch
```yaml
Milestones:
  - Beta program: 50 users
  - First paying customers: 10
  - GitHub Marketplace listing
  - $5M seed funding
  - Team expansion: 10 people
```

---

**Status**: ⏳ **READY TO START**  
**Start Date**: January 22, 2025  
**Expected Completion**: February 2, 2025 (12 days)  
**Next**: Week 11-12 - Production Optimization

---

*Generated for UNIFIED_ACTION_PLAN Phase 2 Month 2*  
*🚀 Global Vision: $60M ARR | 24 Months | Market Leader*
