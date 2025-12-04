# 🤖 ODAVL ML System V2 - Complete Implementation Guide

**Version:** 2.0  
**Status:** ✅ Infrastructure Complete | 🟡 Data Collection Pending | ⏳ Training Pending  
**Date:** November 21, 2025

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Setup Guide](#setup-guide)
4. [Data Collection](#data-collection)
5. [Dataset Preparation](#dataset-preparation)
6. [Model Training](#model-training)
7. [Integration](#integration)
8. [Usage Examples](#usage-examples)
9. [Progress Tracking](#progress-tracking)

---

## 🎯 Overview

### What is ML System V2?

ML System V2 uses **neural networks** to predict trust scores for code fix recipes, replacing heuristic-based scoring with machine learning for better accuracy and automation.

### Key Improvements

| Metric | Current (Legacy) | Target (ML V2) | Improvement |
|--------|------------------|----------------|-------------|
| **Trust Accuracy** | 85% | 92%+ | +7% |
| **Auto-Approval Rate** | 20% | 55-65% | +35-45% |
| **False Positives** | 5% | <1% | -4% |
| **Manual Review Time** | High | Low | -60% |

### Architecture Overview

```
GitHub Repos (1M+ samples)
    ↓
Data Collection (GitHub API)
    ↓
Feature Extraction (12D vectors)
    ↓
Normalization & Balancing
    ↓
Neural Network Training (TensorFlow.js)
    ↓
Trust Score Prediction (0-1)
    ↓
Recipe Manager (Autopilot Integration)
```

---

## 🏗️ Architecture

### Components

#### 1. **ML Trust Predictor** (`ml-trust-predictor.ts`)
- **Purpose**: Core neural network for trust score prediction
- **Input**: 12-dimensional feature vector
- **Output**: Trust score (0-1) + confidence + recommendation
- **Architecture**: 
  - Input layer: 12 neurons
  - Hidden layers: 64 → 32 → 16 neurons
  - Output layer: 1 neuron (sigmoid)
- **Fallback**: Heuristic scoring until model trained

#### 2. **GitHub API Client** (`github-api-client.ts`)
- **Purpose**: Mine code fix samples from GitHub
- **Features**:
  - Repository search (100+ stars filter)
  - Commit mining (fix keywords)
  - Diff extraction (before/after code)
  - Rate limiting (5000/hour with token)
- **Authentication**: GitHub Personal Access Token

#### 3. **Data Collection** (`data-collection.ts`)
- **Purpose**: Orchestrate repository mining
- **Targets**:
  - TypeScript: 300,000 samples
  - JavaScript: 200,000 samples
  - Python: 400,000 samples
  - **Total**: 900,000+ samples
- **Error Types**: 6 categories (security, type, import, runtime, performance, general)

#### 4. **Recipe Manager** (`ml-recipe-integration.ts`)
- **Purpose**: Integrate ML scoring with Autopilot
- **Features**:
  - Feature flag (enable/disable ML)
  - Feedback loop (outcome tracking)
  - A/B testing (ML vs Legacy)
  - Recipe blacklisting (trust < 0.2)

#### 5. **CLI Scripts**
- **`ml-data-collection.ts`**: GitHub mining CLI
- **`ml-prepare-dataset.ts`**: Feature extraction & normalization

---

## ⚙️ Setup Guide

### Prerequisites

- Node.js >= 18.18
- pnpm >= 9.12.2
- GitHub Personal Access Token

### Step 1: Get GitHub Token

1. Go to: https://github.com/settings/tokens
2. Click **Generate new token (classic)**
3. Scopes: Check **`public_repo`** (read-only)
4. Generate token and copy it

### Step 2: Configure Environment

Create `.env` file in project root:

```bash
# GitHub API Token (required for 5000/hour rate limit)
GITHUB_TOKEN=ghp_your_token_here_32_chars

# ML Configuration
ML_ENABLE=false                # Feature flag (OFF until trained)
ML_MODEL_PATH=.odavl/ml-models/trust-predictor-v1.json

# Training Hyperparameters
ML_EPOCHS=50
ML_BATCH_SIZE=32
ML_LEARNING_RATE=0.001
ML_EARLY_STOPPING_PATIENCE=10

# Data Collection
ML_TARGET_TYPESCRIPT=300000
ML_TARGET_JAVASCRIPT=200000
ML_TARGET_PYTHON=400000

# Production
ML_CONFIDENCE_THRESHOLD=0.7
ML_AUTO_APPLY_THRESHOLD=0.85
```

### Step 3: Install Dependencies

```bash
# No new dependencies required (uses existing Node.js modules)
pnpm install
```

---

## 📊 Data Collection

### Quick Test (10k samples, ~30 minutes)

```bash
# Test with small dataset first
export GITHUB_TOKEN=ghp_your_token_here
pnpm ml:collect --language typescript --target 10000

# Check output
ls -lh .odavl/datasets/typescript-fixes.json
```

### Full Collection (900k+ samples, 60-85 hours)

#### Option 1: Sequential (Single Token)

```bash
# Collect all languages (run in background)
export GITHUB_TOKEN=ghp_your_token_here
pnpm ml:collect-all

# Or one language at a time:
pnpm ml:collect --language typescript --target 300000  # 20-30 hours
pnpm ml:collect --language javascript --target 200000  # 15-20 hours
pnpm ml:collect --language python --target 400000      # 25-35 hours
```

#### Option 2: Parallel (Multiple Tokens)

```bash
# Terminal 1 - TypeScript
GITHUB_TOKEN=token1 pnpm ml:collect --language typescript --target 300000 &

# Terminal 2 - JavaScript
GITHUB_TOKEN=token2 pnpm ml:collect --language javascript --target 200000 &

# Terminal 3 - Python
GITHUB_TOKEN=token3 pnpm ml:collect --language python --target 400000 &

# Wait for all to finish
wait
```

### Progress Monitoring

The CLI shows live progress:

```
📊 Progress: 45,230/300,000 (15.1%) | Repos: 23 | ETA: 18.3h
```

### Output Structure

```json
[
  {
    "id": "facebook/react-abc123-src/App.tsx",
    "language": "typescript",
    "errorType": "typescript-type",
    "beforeCode": "const x: any = 42;",
    "afterCode": "const x: number = 42;",
    "linesChanged": 1,
    "complexity": 5,
    "fixSucceeded": true,
    "metadata": {
      "repo": "facebook/react",
      "commitSha": "abc123",
      "author": "John Doe",
      "date": "2025-11-01T10:30:00Z",
      "file": "src/App.tsx"
    }
  }
]
```

---

## 🧪 Dataset Preparation

### Prepare Single Dataset

```bash
pnpm ml:prepare --input .odavl/datasets/typescript-fixes.json

# Output: .odavl/datasets/processed/typescript-fixes-processed.json
```

### Prepare All Datasets

```bash
pnpm ml:prepare-all

# Processes:
# - typescript-fixes.json
# - javascript-fixes.json
# - python-fixes.json
```

### What Happens During Preparation?

1. **Feature Extraction**: 12-dimensional vectors from raw samples
2. **Normalization**: Z-score normalization (mean=0, std=1)
3. **Class Balancing**: 50/50 split (success/failure)
4. **Dataset Splitting**: 70% train, 15% validation, 15% test

### Output Structure

```json
{
  "train": [
    {
      "features": [0.8, 0.3, 0.5, ...],  // 12 dimensions
      "label": 1,                         // 0 or 1
      "metadata": {
        "sampleId": "facebook/react-abc123",
        "language": "typescript",
        "errorType": "typescript-type"
      }
    }
  ],
  "validation": [...],
  "test": [...],
  "metadata": {
    "language": "typescript",
    "totalSamples": 250000,
    "trainSize": 175000,
    "valSize": 37500,
    "testSize": 37500,
    "featureMeans": [0.5, 0.4, ...],
    "featureStds": [0.2, 0.3, ...]
  }
}
```

---

## 🎓 Model Training

### Step 1: Install TensorFlow.js

```bash
pnpm add @tensorflow/tfjs-node
```

### Step 2: Create Training Script

Create `scripts/ml-train-model.ts`:

```typescript
import * as tf from '@tensorflow/tfjs-node';
import * as fs from 'fs';

async function trainModel() {
  // Load prepared dataset
  const data = JSON.parse(fs.readFileSync('.odavl/datasets/processed/typescript-fixes-processed.json', 'utf-8'));

  // Convert to tensors
  const trainX = tf.tensor2d(data.train.map(s => s.features));
  const trainY = tf.tensor2d(data.train.map(s => [s.label]));
  const valX = tf.tensor2d(data.validation.map(s => s.features));
  const valY = tf.tensor2d(data.validation.map(s => [s.label]));

  // Build neural network
  const model = tf.sequential({
    layers: [
      tf.layers.dense({ inputShape: [12], units: 64, activation: 'relu' }),
      tf.layers.dropout({ rate: 0.3 }),
      tf.layers.dense({ units: 32, activation: 'relu' }),
      tf.layers.dropout({ rate: 0.2 }),
      tf.layers.dense({ units: 16, activation: 'relu' }),
      tf.layers.dense({ units: 1, activation: 'sigmoid' }),
    ],
  });

  // Compile model
  model.compile({
    optimizer: tf.train.adam(0.001),
    loss: 'binaryCrossentropy',
    metrics: ['accuracy', 'precision', 'recall'],
  });

  // Train model
  const history = await model.fit(trainX, trainY, {
    epochs: 50,
    batchSize: 32,
    validationData: [valX, valY],
    callbacks: {
      onEpochEnd: (epoch, logs) => {
        console.log(`Epoch ${epoch + 1}: loss=${logs.loss.toFixed(4)}, acc=${logs.acc.toFixed(4)}`);
      },
    },
    earlyStoppingPatience: 10,
  });

  // Save model
  await model.save('file://.odavl/ml-models/trust-predictor-v1');

  console.log('✅ Model trained and saved!');
}

trainModel();
```

### Step 3: Run Training

```bash
pnpm tsx scripts/ml-train-model.ts

# Expected output:
# Epoch 1/50: loss=0.6234, acc=0.6523
# Epoch 2/50: loss=0.5891, acc=0.6845
# ...
# Epoch 35/50: loss=0.2145, acc=0.9234
# ✅ Model trained and saved!
```

### Target Metrics

- **Accuracy**: >92% on test set
- **Precision**: >94%
- **Recall**: >90%
- **F1 Score**: >92%

---

## 🔗 Integration

### Enable ML Scoring

```typescript
import { createMLRecipeManager } from '@odavl/insight-core/learning';

const manager = createMLRecipeManager();

// Load trained model
await manager.loadModel('.odavl/ml-models/trust-predictor-v1');

// Enable ML scoring
manager.enableML();

// Use in recipe selection
const bestRecipe = await manager.selectBestRecipe(recipes, context);

console.log(`Selected: ${bestRecipe.name}`);
console.log(`ML Trust Score: ${bestRecipe.mlTrustScore.toFixed(3)}`);
console.log(`Recommendation: ${bestRecipe.mlRecommendation}`);
console.log(`Reasoning: ${bestRecipe.mlReasoning.join(', ')}`);
```

### Feedback Loop

```typescript
// After recipe execution
const succeeded = await executeRecipe(bestRecipe);

// Update model with outcome
await manager.updateRecipeOutcome(bestRecipe.id, succeeded, context);
```

### A/B Testing

```typescript
// Compare ML vs Legacy
const { mlChoice, legacyChoice, agreement } = await manager.compareMLvsLegacy(recipes, context);

console.log(`ML Choice: ${mlChoice?.name}`);
console.log(`Legacy Choice: ${legacyChoice?.name}`);
console.log(`Agreement: ${agreement ? 'YES' : 'NO'}`);

// Get metrics after 1000+ runs
const metrics = manager.getABTestMetrics();
console.log(`ML Success Rate: ${(metrics.mlSuccessRate * 100).toFixed(1)}%`);
console.log(`Legacy Success Rate: ${(metrics.legacySuccessRate * 100).toFixed(1)}%`);
console.log(`Improvement: ${(metrics.improvement * 100).toFixed(1)}%`);
```

---

## 📚 Usage Examples

### Example 1: Basic Prediction

```typescript
import { MLTrustPredictor, extractFeatures } from '@odavl/insight-core/learning';

const predictor = new MLTrustPredictor();

const recipe = {
  id: 'fix-typescript-any',
  errorType: 'typescript-type',
  linesChanged: 5,
  filesModified: 1,
};

const context = {
  successRate: 0.85,
  errorCount: 10,
  totalIssues: 100,
  cyclomaticComplexity: 15,
  fileSize: 200,
  coverage: 0.8,
};

const features = extractFeatures(recipe, context);
const prediction = await predictor.predict(features);

console.log(prediction);
// {
//   trustScore: 0.87,
//   confidence: 0.92,
//   recommendation: 'auto-apply',
//   reasoning: [
//     'High historical success rate (85.0%)',
//     'High test coverage (safer change)',
//     'Very similar fixes succeeded before'
//   ]
// }
```

### Example 2: Data Collection (Programmatic)

```typescript
import { GitHubDataMiner } from '@odavl/insight-core/learning';

const miner = new GitHubDataMiner(process.env.GITHUB_TOKEN);

const samples = await miner.mineRepositories(
  'typescript',
  10000,
  (progress) => {
    console.log(`Progress: ${progress.samplesCollected}/${progress.samplesTarget}`);
  }
);

miner.exportSamples('.odavl/datasets/typescript-fixes.json');

const stats = miner.getStats();
console.log(`Success rate: ${(stats.successRate * 100).toFixed(1)}%`);
console.log(`Error types:`, stats.byErrorType);
```

---

## 📈 Progress Tracking

### Current Status (November 21, 2025)

| Phase | Status | Progress | Details |
|-------|--------|----------|---------|
| **Infrastructure** | ✅ Complete | 100% | 1,650+ lines, 4 core modules |
| **Data Collection** | ⏳ Pending | 0% | 900k samples needed |
| **Dataset Prep** | ⏳ Pending | 0% | Automation ready |
| **Model Training** | ⏳ Pending | 0% | TensorFlow.js script needed |
| **A/B Testing** | ⏳ Pending | 0% | Framework ready |
| **Production** | ⏳ Pending | 0% | Feature flag OFF |

### Overall Progress

- **Week 7-8 (ML System V2)**: 30% Complete
- **Phase 2 (Month 2)**: 65% Complete
- **Total Project**: ~18-20% Complete

### Next Steps (Priority Order)

1. **🔥 URGENT**: Start data collection (60-85 hours)
   ```bash
   export GITHUB_TOKEN=your_token
   pnpm ml:collect-all &
   ```

2. **HIGH**: Prepare datasets
   ```bash
   pnpm ml:prepare-all
   ```

3. **MEDIUM**: Train neural network
   ```bash
   pnpm tsx scripts/ml-train-model.ts
   ```

4. **MEDIUM**: A/B testing (validate improvement)
   ```bash
   # Run 1000+ cycles with ML vs Legacy
   ```

5. **LOW**: Production deployment
   ```bash
   ML_ENABLE=true
   ```

---

## 🎯 Success Criteria

### Week 7-8 Completion

- [x] Infrastructure created (1,650+ lines)
- [ ] 900k+ training samples collected
- [ ] Neural network trained (accuracy >92%)
- [ ] A/B testing shows improvement over legacy
- [ ] Production deployment with feature flag
- [ ] Documentation complete

### Target Metrics (After Training)

- **Accuracy**: 92%+ (vs 85% legacy)
- **Auto-Approval**: 55-65% (vs 20% legacy)
- **False-Positive**: <1% (vs 5% legacy)
- **Manual Review Time**: -60%

---

## 📞 Support

For issues or questions:
- GitHub: https://github.com/odavl/odavl-studio
- Docs: https://docs.odavl.studio

---

**Last Updated**: November 21, 2025  
**Version**: 2.0 (Infrastructure Complete)
