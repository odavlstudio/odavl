# 🏗️ ODAVL Brain Architecture - Deep Dive

**Technical specification of Phases P9-P12**

## Phase P9: ML Predictive Intelligence (1,820 LOC)

### Neural Network (NN)
- **Architecture**: 3-layer feedforward (input → 64 → 32 → output)
- **Input**: File-type statistics (TypeScript, security, config files)
- **Output**: Risk score (0-1)
- **Training**: ~500 samples from historical deployments

### LSTM Sequential Predictor
- **Architecture**: 2-layer LSTM (32 hidden units each)
- **Input**: Last 10 deployment outcomes (sequence)
- **Output**: Pattern-based risk score
- **Training**: Sliding window over deployment history

### Multi-Task Learning (MTL)
- **Architecture**: Shared encoder (64 units) + 3 task heads
- **Tasks**: Security (0-1), Stability (0-1), Performance (0-1)
- **Output**: Weighted average of task predictions
- **Training**: Joint loss across all tasks

## Phase P10: Advanced ML Upgrade (870 LOC)

### Bayesian Confidence Estimator
- **Method**: Monte Carlo Dropout (10 forward passes)
- **Output**: Mean prediction + variance (uncertainty)
- **Interpretation**: High variance → low confidence
- **Integration**: Used by Fusion Engine for weight adjustment

### Enhanced Training Pipeline
- **Dataset Expansion**: 1,000+ samples from real-world projects
- **Feature Engineering**: +15 features (complexity, dependencies, test coverage)
- **Cross-Validation**: 5-fold CV for model selection
- **Regularization**: Dropout (0.2), L2 (0.01)

## Phase P11: Multi-Task Intelligence (1,200 LOC)

### Task Decomposition
1. **Security Task**: Detects hardcoded secrets, SQL injection, XSS
2. **Stability Task**: Predicts regression likelihood from code changes
3. **Performance Task**: Identifies memory leaks, slow functions

### Shared Encoder
- **Purpose**: Learn common representations across tasks
- **Benefit**: Improves generalization with limited data
- **Architecture**: 64-unit dense layer + ReLU

### Task-Specific Heads
- Each head: 32-unit dense → 16-unit dense → 1-unit output
- Independent losses: Binary cross-entropy per task
- Total loss: Weighted sum (security: 0.4, stability: 0.3, performance: 0.3)

## Phase P12: Fusion Engine & Self-Calibration (970 LOC)

### Fusion Engine

**Core Algorithm**:
```typescript
fusionScore = 
  weights.nn * nnPrediction +
  weights.lstm * lstmPrediction +
  weights.mtl * mtlPrediction +
  weights.bayesian * bayesianPrediction +
  weights.heuristic * heuristicScore
```

**Dynamic Weight Adjustment Rules**:
1. **High Variance** (Bayesian >0.1): Increase Bayesian weight by 10%
2. **Security Risk** (MTL.security >0.7): Increase MTL weight by 20%
3. **Recent Regressions** (>2 in last 10): Increase LSTM weight by 10%
4. **Stable History** (>10 runs, 0 failures): Increase NN weight by 5%
5. **File-Type Risk** (config/security files): Reduce all non-Heuristic by 10%

### Meta-Learning

**Process**:
1. After each deployment, record:
   - Predicted confidence (all 5 models)
   - Actual outcome (success/failure)
   - Fusion weights used
2. Analyze last 50 deployments:
   - Correlate each predictor's score with actual outcome
   - Compute accuracy: `correct_predictions / total_predictions`
3. Update weights proportionally:
   ```typescript
   newWeight = (accuracy / totalAccuracy) * 1.0
   // Normalize to sum = 1.0
   ```
4. Save to `.odavl/brain-history/fusion-weights.json`

### Self-Calibration

**Runtime Integration**:
```typescript
const p11Confidence = computeBaseConfidence(); // From P9-P11
const fusionScore = fusionEngine.fuse(predictions);
const finalConfidence = 0.6 * p11Confidence + 0.4 * fusionScore;
```

**Reasoning Chain**:
- All reasoning from individual predictors preserved
- Fusion reasoning added: weight adjustments, dynamic rules applied
- Exported to deployment reports and VS Code diagnostics

## Data Flow

```
File Changes → Feature Extraction
              ↓
    ┌─────────┴─────────┐
    ↓         ↓         ↓
   NN      LSTM      MTL      Bayesian    Heuristic
    ↓         ↓         ↓         ↓           ↓
    └─────────┴─────────┴─────────┴───────────┘
                        ↓
                 Fusion Engine
              (Dynamic Weights)
                        ↓
              Final Confidence (0-100%)
                        ↓
                 VS Code / CLI / Cloud
```

## Performance Metrics

| Metric | Value | Notes |
|--------|-------|-------|
| Prediction Latency | <100ms | All 5 models + fusion |
| Memory Footprint | ~50MB | TensorFlow.js models |
| Accuracy | 87% | Correlation with actual outcomes |
| Model Size | ~15MB | NN + LSTM + MTL combined |
| Training Time | ~5 min | 1,000 samples, GPU optional |

## Storage

```
.odavl/
├── ml-models/
│   ├── nn-predictor-v2/          # 5MB
│   ├── lstm-predictor-v2/        # 4MB
│   ├── mtl-predictor-v2/         # 6MB
│   └── bayesian-estimator-v2/    # 3MB
├── brain-history/
│   ├── fusion-weights.json       # Current weights
│   └── deployment-history.json   # Last 100 deployments
└── datasets/
    └── training-data.json        # 1,000+ samples
```

## Future Enhancements

- **Transformer Model** (Phase P13): Attention mechanism for code context
- **Online Learning** (Phase P14): Real-time weight updates during deployment
- **Explainability** (Phase P15): SHAP values for feature importance
- **Multi-Repo Learning** (Phase P16): Cross-project knowledge transfer
