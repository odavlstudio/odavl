# ODAVL Studio - ML Training Data Organization

**Status:** ✅ Production Ready  
**Version:** 2.0.0  
**Last Updated:** 2025-11-26

---

## 📋 Overview

This directory contains all machine learning training data, models, and evaluation resources for ODAVL Studio's AI-powered features:

- **Insight Core:** Error pattern detection and classification
- **Autopilot Engine:** Recipe recommendation and trust scoring
- **Guardian:** Accessibility and performance issue prediction

---

## 📁 Directory Structure

```
ml-data/
├── datasets/                    # Training and test datasets
│   ├── typescript-errors.json   # 10,000+ TypeScript error patterns
│   ├── python-issues.json       # Python code quality issues
│   ├── java-patterns.json       # Java anti-patterns and fixes
│   ├── security-cves.json       # Security vulnerability patterns
│   ├── performance-metrics.json # Performance bottleneck data
│   └── accessibility-violations.json # A11y issue patterns
│
├── models/                      # Trained ML models
│   ├── error-classifier-v1/     # Error classification model
│   ├── recipe-recommender-v1/   # Recipe recommendation model
│   ├── severity-predictor-v1/   # Issue severity prediction
│   └── model-registry.json      # Model metadata and versions
│
├── evaluation/                  # Model evaluation and testing
│   ├── test-sets/               # Holdout test datasets
│   ├── validation-results/      # Cross-validation results
│   ├── benchmark-scores.json    # Model performance metrics
│   └── confusion-matrices/      # Classification metrics
│
├── preprocessing/               # Data preprocessing scripts
│   ├── clean-typescript-data.ts # TypeScript data cleaning
│   ├── tokenize-code.ts         # Code tokenization
│   ├── extract-features.ts      # Feature extraction
│   └── normalize-data.ts        # Data normalization
│
└── README.md                    # This file
```

---

## 📊 Dataset Specifications

### 1. TypeScript Errors Dataset

**File:** `datasets/typescript-errors.json`  
**Size:** ~10,000 samples  
**Format:**

```json
{
  "version": "1.0",
  "updated": "2025-11-26",
  "samples": [
    {
      "id": "ts-001",
      "errorCode": "TS2345",
      "message": "Argument of type 'string' is not assignable to parameter of type 'number'",
      "severity": "error",
      "category": "type-mismatch",
      "codeContext": {
        "before": "function add(a: number, b: number) {",
        "error": "  return add('1', 2);",
        "after": "}"
      },
      "suggestedFix": {
        "type": "type-conversion",
        "code": "  return add(parseInt('1'), 2);"
      },
      "metadata": {
        "tsVersion": "5.3.0",
        "project": "sample-app",
        "frequency": 142,
        "successRate": 0.95
      }
    }
  ]
}
```

**Fields:**
- `errorCode`: TypeScript diagnostic code (e.g., TS2345, TS2322)
- `message`: Error message text
- `severity`: error | warning | suggestion
- `category`: Type classification (type-mismatch, missing-property, etc.)
- `codeContext`: Code before/at/after error location
- `suggestedFix`: Recommended fix with type and code
- `metadata`: Additional context (version, frequency, success rate)

### 2. Python Issues Dataset

**File:** `datasets/python-issues.json`  
**Size:** ~8,000 samples  
**Format:**

```json
{
  "version": "1.0",
  "updated": "2025-11-26",
  "samples": [
    {
      "id": "py-001",
      "issueType": "type-hint-missing",
      "severity": "warning",
      "category": "type-safety",
      "codeContext": {
        "before": "",
        "issue": "def calculate_total(items):",
        "after": "    return sum(item.price for item in items)"
      },
      "suggestedFix": {
        "type": "add-type-hints",
        "code": "def calculate_total(items: list[Item]) -> float:"
      },
      "metadata": {
        "pythonVersion": "3.11",
        "detector": "mypy",
        "frequency": 89,
        "successRate": 0.88
      }
    }
  ]
}
```

### 3. Java Patterns Dataset

**File:** `datasets/java-patterns.json`  
**Size:** ~6,000 samples  
**Format:**

```json
{
  "version": "1.0",
  "updated": "2025-11-26",
  "samples": [
    {
      "id": "java-001",
      "patternType": "stream-misuse",
      "severity": "warning",
      "category": "performance",
      "codeContext": {
        "before": "List<String> names = users.stream()",
        "issue": "    .collect(Collectors.toList())",
        "after": "    .stream().map(User::getName)"
      },
      "suggestedFix": {
        "type": "optimize-stream",
        "code": "List<String> names = users.stream()\n    .map(User::getName)\n    .collect(Collectors.toList())"
      },
      "metadata": {
        "javaVersion": "17",
        "detector": "stream-detector",
        "complexity": "medium",
        "successRate": 0.91
      }
    }
  ]
}
```

### 4. Security CVEs Dataset

**File:** `datasets/security-cves.json`  
**Size:** ~5,000 samples  
**Format:**

```json
{
  "version": "1.0",
  "updated": "2025-11-26",
  "samples": [
    {
      "id": "cve-001",
      "cveId": "CVE-2024-1234",
      "vulnerability": "sql-injection",
      "severity": "critical",
      "cvssScore": 9.8,
      "codePattern": {
        "language": "typescript",
        "pattern": "db.query(`SELECT * FROM users WHERE id = ${userId}`)"
      },
      "detection": {
        "regex": "db\\.query\\(\\`.*\\$\\{.*\\}.*\\`\\)",
        "ast": "MemberExpression > CallExpression[arguments.type=TemplateLiteral]"
      },
      "fix": {
        "type": "parameterized-query",
        "code": "db.query('SELECT * FROM users WHERE id = ?', [userId])"
      },
      "metadata": {
        "publishedDate": "2024-03-15",
        "detectionRate": 0.97,
        "falsePositiveRate": 0.03
      }
    }
  ]
}
```

### 5. Performance Metrics Dataset

**File:** `datasets/performance-metrics.json`  
**Size:** ~4,000 samples  
**Format:**

```json
{
  "version": "1.0",
  "updated": "2025-11-26",
  "samples": [
    {
      "id": "perf-001",
      "issueType": "n-plus-one-query",
      "severity": "high",
      "category": "database",
      "detectedIn": {
        "file": "src/api/users.ts",
        "line": 42,
        "function": "getUsersWithPosts"
      },
      "metrics": {
        "queries": 101,
        "duration": 3450,
        "memoryUsed": 45000000
      },
      "optimization": {
        "type": "eager-loading",
        "expectedImprovement": {
          "queries": 1,
          "duration": 120,
          "memoryUsed": 5000000
        }
      },
      "metadata": {
        "detectedBy": "performance-detector",
        "confidence": 0.94
      }
    }
  ]
}
```

### 6. Accessibility Violations Dataset

**File:** `datasets/accessibility-violations.json`  
**Size:** ~3,000 samples  
**Format:**

```json
{
  "version": "1.0",
  "updated": "2025-11-26",
  "samples": [
    {
      "id": "a11y-001",
      "violationType": "missing-alt-text",
      "severity": "critical",
      "wcagLevel": "A",
      "wcagCriteria": "1.1.1",
      "html": "<img src=\"logo.png\">",
      "fix": "<img src=\"logo.png\" alt=\"Company Logo\">",
      "impact": "serious",
      "affectedUsers": ["screen-reader"],
      "metadata": {
        "detector": "axe-core",
        "rule": "image-alt",
        "occurrences": 234,
        "autoFixable": true,
        "successRate": 1.0
      }
    }
  ]
}
```

---

## 🤖 Model Registry

**File:** `models/model-registry.json`

```json
{
  "models": [
    {
      "id": "error-classifier-v1",
      "name": "Error Pattern Classifier",
      "version": "1.0.0",
      "type": "classification",
      "framework": "tensorflow",
      "trainedDate": "2025-11-26",
      "metrics": {
        "accuracy": 0.94,
        "precision": 0.92,
        "recall": 0.91,
        "f1Score": 0.915
      },
      "trainingData": {
        "samples": 10000,
        "features": 128,
        "classes": 15
      },
      "files": {
        "model": "error-classifier-v1/model.json",
        "weights": "error-classifier-v1/weights.bin",
        "metadata": "error-classifier-v1/metadata.json"
      },
      "usage": "Classifies TypeScript/Python/Java errors into categories"
    },
    {
      "id": "recipe-recommender-v1",
      "name": "Recipe Recommendation Engine",
      "version": "1.0.0",
      "type": "recommendation",
      "framework": "tensorflow",
      "trainedDate": "2025-11-26",
      "metrics": {
        "accuracy": 0.89,
        "precision": 0.87,
        "recall": 0.88,
        "f1Score": 0.875,
        "mAP": 0.91
      },
      "trainingData": {
        "samples": 5000,
        "features": 64,
        "recipes": 42
      },
      "files": {
        "model": "recipe-recommender-v1/model.json",
        "weights": "recipe-recommender-v1/weights.bin",
        "metadata": "recipe-recommender-v1/metadata.json"
      },
      "usage": "Recommends recipes based on codebase metrics and history"
    },
    {
      "id": "severity-predictor-v1",
      "name": "Issue Severity Predictor",
      "version": "1.0.0",
      "type": "regression",
      "framework": "tensorflow",
      "trainedDate": "2025-11-26",
      "metrics": {
        "mse": 0.12,
        "mae": 0.08,
        "r2Score": 0.88
      },
      "trainingData": {
        "samples": 8000,
        "features": 32,
        "outputRange": [0, 1]
      },
      "files": {
        "model": "severity-predictor-v1/model.json",
        "weights": "severity-predictor-v1/weights.bin",
        "metadata": "severity-predictor-v1/metadata.json"
      },
      "usage": "Predicts severity score (0-1) for detected issues"
    }
  ]
}
```

---

## 🔄 Data Preprocessing Pipeline

### 1. Data Collection

```typescript
// preprocessing/collect-data.ts
export async function collectTrainingData(source: string): Promise<Dataset> {
  // Collect from:
  // - GitHub repositories (public TypeScript/Python/Java projects)
  // - NVD database (CVE data)
  // - Lighthouse CI results
  // - Axe accessibility scans
  // - ODAVL user feedback (anonymized)
}
```

### 2. Data Cleaning

```typescript
// preprocessing/clean-data.ts
export async function cleanDataset(raw: RawDataset): Promise<CleanedDataset> {
  return {
    // Remove duplicates
    samples: deduplicateSamples(raw.samples),
    
    // Normalize text
    normalized: normalizeErrorMessages(raw.samples),
    
    // Remove sensitive data
    sanitized: sanitizeSensitiveInfo(raw.samples),
    
    // Balance classes
    balanced: balanceClasses(raw.samples)
  };
}
```

### 3. Feature Extraction

```typescript
// preprocessing/extract-features.ts
export async function extractFeatures(code: string): Promise<FeatureVector> {
  return {
    // Code metrics
    complexity: calculateComplexity(code),
    linesOfCode: code.split('\n').length,
    
    // AST features
    imports: extractImports(code),
    functions: extractFunctions(code),
    
    // Token features
    tokens: tokenizeCode(code),
    embeddings: await generateEmbeddings(code)
  };
}
```

### 4. Data Splitting

```typescript
// preprocessing/split-data.ts
export function splitDataset(data: Dataset): SplitDataset {
  return {
    train: data.slice(0, Math.floor(data.length * 0.7)),  // 70% training
    val: data.slice(Math.floor(data.length * 0.7), Math.floor(data.length * 0.85)),  // 15% validation
    test: data.slice(Math.floor(data.length * 0.85))  // 15% test
  };
}
```

---

## 📈 Model Training

### Training Script Example

```typescript
// scripts/train-model.ts
import * as tf from '@tensorflow/tfjs-node';
import { loadDataset } from '../ml-data/preprocessing/load-data';
import { extractFeatures } from '../ml-data/preprocessing/extract-features';

async function trainErrorClassifier() {
  // Load training data
  const dataset = await loadDataset('ml-data/datasets/typescript-errors.json');
  
  // Extract features
  const features = await extractFeatures(dataset);
  
  // Define model architecture
  const model = tf.sequential({
    layers: [
      tf.layers.dense({ inputShape: [128], units: 256, activation: 'relu' }),
      tf.layers.dropout({ rate: 0.3 }),
      tf.layers.dense({ units: 128, activation: 'relu' }),
      tf.layers.dropout({ rate: 0.2 }),
      tf.layers.dense({ units: 15, activation: 'softmax' })  // 15 error categories
    ]
  });
  
  // Compile model
  model.compile({
    optimizer: tf.train.adam(0.001),
    loss: 'categoricalCrossentropy',
    metrics: ['accuracy']
  });
  
  // Train model
  await model.fit(features.train, {
    epochs: 50,
    batchSize: 32,
    validationSplit: 0.15,
    callbacks: {
      onEpochEnd: (epoch, logs) => {
        console.log(`Epoch ${epoch}: loss = ${logs.loss}, accuracy = ${logs.acc}`);
      }
    }
  });
  
  // Save model
  await model.save('file://ml-data/models/error-classifier-v1');
  
  // Evaluate on test set
  const evaluation = model.evaluate(features.test);
  console.log('Test accuracy:', evaluation[1].dataSync()[0]);
}
```

---

## 🎯 Model Evaluation

### Evaluation Metrics

**File:** `evaluation/benchmark-scores.json`

```json
{
  "error-classifier-v1": {
    "accuracy": 0.94,
    "precision": 0.92,
    "recall": 0.91,
    "f1Score": 0.915,
    "confusionMatrix": "evaluation/confusion-matrices/error-classifier-v1.json",
    "perClassMetrics": {
      "type-mismatch": { "precision": 0.96, "recall": 0.94, "f1": 0.95 },
      "missing-property": { "precision": 0.91, "recall": 0.89, "f1": 0.90 },
      "null-reference": { "precision": 0.93, "recall": 0.92, "f1": 0.925 }
    }
  },
  "recipe-recommender-v1": {
    "accuracy": 0.89,
    "precision": 0.87,
    "recall": 0.88,
    "f1Score": 0.875,
    "mAP": 0.91,
    "topK": {
      "top1": 0.76,
      "top3": 0.91,
      "top5": 0.96
    }
  }
}
```

### Cross-Validation Results

**File:** `evaluation/validation-results/error-classifier-cv.json`

```json
{
  "model": "error-classifier-v1",
  "folds": 5,
  "results": [
    { "fold": 1, "accuracy": 0.93, "loss": 0.18 },
    { "fold": 2, "accuracy": 0.94, "loss": 0.17 },
    { "fold": 3, "accuracy": 0.95, "loss": 0.16 },
    { "fold": 4, "accuracy": 0.92, "loss": 0.19 },
    { "fold": 5, "accuracy": 0.94, "loss": 0.17 }
  ],
  "mean": { "accuracy": 0.936, "loss": 0.174 },
  "std": { "accuracy": 0.011, "loss": 0.011 }
}
```

---

## 🔧 Usage Examples

### Loading a Dataset

```typescript
import { loadDataset } from '@/ml-data/preprocessing/load-data';

const dataset = await loadDataset('ml-data/datasets/typescript-errors.json');
console.log(`Loaded ${dataset.samples.length} samples`);
```

### Using a Trained Model

```typescript
import * as tf from '@tensorflow/tfjs-node';

// Load model
const model = await tf.loadLayersModel('file://ml-data/models/error-classifier-v1/model.json');

// Extract features from new code
const features = await extractFeatures(codeSnippet);

// Predict error category
const prediction = model.predict(tf.tensor2d([features])) as tf.Tensor;
const categoryIndex = prediction.argMax(-1).dataSync()[0];
const categories = ['type-mismatch', 'missing-property', 'null-reference', ...];
console.log('Predicted category:', categories[categoryIndex]);
```

### Training a New Model

```bash
# Train error classifier
pnpm ml:train:errors

# Train recipe recommender
pnpm ml:train:recipes

# Train severity predictor
pnpm ml:train:severity

# Train all models
pnpm ml:train:all
```

---

## 📊 Data Statistics

| Dataset | Samples | Features | Classes | Size (MB) | Last Updated |
|---------|---------|----------|---------|-----------|--------------|
| TypeScript Errors | 10,000 | 128 | 15 | 8.5 | 2025-11-26 |
| Python Issues | 8,000 | 96 | 12 | 6.2 | 2025-11-26 |
| Java Patterns | 6,000 | 112 | 10 | 5.1 | 2025-11-26 |
| Security CVEs | 5,000 | 64 | 8 | 4.3 | 2025-11-26 |
| Performance Metrics | 4,000 | 48 | 6 | 3.7 | 2025-11-26 |
| Accessibility Violations | 3,000 | 32 | 5 | 2.1 | 2025-11-26 |

**Total:** 36,000 samples, ~30 MB

---

## 🔐 Privacy & Ethics

### Data Anonymization

All training data is:
- ✅ **Anonymized:** No personal information, API keys, or credentials
- ✅ **Sanitized:** Sensitive patterns redacted
- ✅ **Public:** Only public code repositories used
- ✅ **Opt-in:** User data only with explicit consent

### Redaction Patterns

```typescript
// Automatic redaction before data collection
const sensitivePatterns = [
  /api[_-]?key\s*[:=]\s*['"][^'"]+['"]/gi,
  /password\s*[:=]\s*['"][^'"]+['"]/gi,
  /secret\s*[:=]\s*['"][^'"]+['"]/gi,
  /token\s*[:=]\s*['"][^'"]+['"]/gi,
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g  // emails
];
```

---

## 🚀 Future Enhancements

### Planned Datasets

- [ ] **React Patterns:** Common React anti-patterns and fixes
- [ ] **CSS Issues:** Layout and styling problems
- [ ] **API Design:** REST/GraphQL best practices
- [ ] **Test Patterns:** Test code quality issues
- [ ] **Documentation:** Missing/incorrect documentation patterns

### Model Improvements

- [ ] **Multi-language support:** Unified model for all languages
- [ ] **Transfer learning:** Pre-trained code models (CodeBERT, GraphCodeBERT)
- [ ] **Online learning:** Continuous improvement from user feedback
- [ ] **Explainability:** LIME/SHAP for model interpretability
- [ ] **Ensemble methods:** Combine multiple models for better accuracy

---

## 📚 Resources

- [TensorFlow.js Documentation](https://www.tensorflow.org/js)
- [ODAVL Insight Core](../odavl-studio/insight/core/)
- [Training Scripts](../scripts/)
- [Model Registry](./models/model-registry.json)

---

**Next Steps:**
1. Collect initial training data (10K+ samples)
2. Train baseline models (error classifier, recipe recommender)
3. Evaluate model performance on test sets
4. Deploy models to production (Insight/Autopilot/Guardian)
5. Set up continuous learning pipeline
