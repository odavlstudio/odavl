# 🧠 ODAVL OMS (Orchestrated Multi-Strategy) System

**The coordination layer for ODAVL Brain's 5-model ensemble**

## What is OMS?

**OMS (Orchestrated Multi-Strategy)** is ODAVL's approach to combining multiple AI models into a single, reliable deployment confidence system. Instead of relying on one model, OMS coordinates 5 specialized strategies and learns optimal weights over time.

## Core Principles

### 1. Ensemble > Single Model
No single model is perfect. By combining 5 different approaches, OMS achieves higher accuracy and robustness:

- **Neural Network**: Fast pattern recognition
- **LSTM**: Sequential dependency learning
- **Multi-Task Learning**: Balances security, stability, performance
- **Bayesian**: Quantifies prediction uncertainty
- **Heuristic**: Rule-based baseline from Guardian metrics

### 2. Dynamic Orchestration
OMS doesn't use fixed weights. It adapts based on:

- **Context**: Security changes get more MTL weight
- **Uncertainty**: High variance increases Bayesian weight
- **History**: Recent regressions increase LSTM weight
- **File Types**: Config files reduce ML model influence

### 3. Meta-Learning
After each deployment, OMS updates weights based on actual outcomes:

```typescript
// Analyze last 50 deployments
const accuracies = predictors.map(p => 
  p.correctPredictions / p.totalPredictions
);

// Update weights proportionally
weights = normalize(accuracies);
```

### 4. Self-Calibration
Final confidence blends individual models (60%) with fusion score (40%):

```
Final = 0.6 × P11_Confidence + 0.4 × Fusion_Score
```

This prevents over-reliance on any single approach.

## OMS Architecture

```
┌──────────────────────────────────────┐
│         Input: File Changes          │
└──────────────┬───────────────────────┘
               ↓
       Feature Extraction
         (File types, LOC, complexity)
               ↓
    ┌──────────┴──────────┐
    │   OMS Orchestrator   │
    └──────────┬───────────┘
               ↓
    ┌──────────┴──────────┐
    │  5-Model Ensemble    │
    ├──────────────────────┤
    │  NN       LSTM       │
    │  MTL      Bayesian   │
    │  Heuristic           │
    └──────────┬───────────┘
               ↓
       Fusion Engine
    (Dynamic Weight Learning)
               ↓
       Self-Calibration
    (60/40 Blend with P11)
               ↓
    ┌──────────┴──────────┐
    │  Final Confidence    │
    │  + Reasoning Chain   │
    └──────────────────────┘
```

## Weight Learning Algorithm

### Initial Weights (Default)
- Neural Network: 25%
- LSTM: 15%
- Multi-Task Learning: 30%
- Bayesian: 15%
- Heuristic: 15%

### Dynamic Adjustment Rules

**Rule 1: High Bayesian Variance**
```typescript
if (bayesianVariance > 0.1) {
  weights.bayesian += 0.10; // Uncertainty matters
}
```

**Rule 2: Security Risk Detection**
```typescript
if (mtlPrediction.security > 0.7) {
  weights.mtl += 0.20; // Security expert takes lead
}
```

**Rule 3: Recent Regressions**
```typescript
const recentFailures = history.last(10).filter(r => !r.success).length;
if (recentFailures > 2) {
  weights.lstm += 0.10; // Sequential patterns matter
}
```

**Rule 4: Stable History**
```typescript
if (history.length > 10 && history.last(10).every(r => r.success)) {
  weights.nn += 0.05; // Trust pattern recognition
}
```

**Rule 5: File-Type Risk**
```typescript
const hasSecurityFiles = files.some(f => 
  f.includes('auth/') || f.includes('security/')
);
if (hasSecurityFiles) {
  // Reduce ML influence, boost rule-based
  weights.nn *= 0.9;
  weights.lstm *= 0.9;
  weights.mtl *= 0.9;
  weights.heuristic *= 1.2;
}
```

### Meta-Learning Update (Post-Deployment)

After each deployment:

1. **Record Outcome**:
   ```json
   {
     "timestamp": "2025-01-09T...",
     "predictions": {
       "nn": 0.78,
       "lstm": 0.82,
       "mtl": 0.75,
       "bayesian": 0.80,
       "heuristic": 0.85
     },
     "fusionScore": 0.80,
     "finalConfidence": 79.2,
     "actualOutcome": "success"
   }
   ```

2. **Compute Accuracy** (last 50 samples):
   ```typescript
   const nnCorrect = samples.filter(s => 
     (s.predictions.nn > 0.75 && s.actualOutcome === 'success') ||
     (s.predictions.nn <= 0.75 && s.actualOutcome === 'failure')
   ).length;
   
   const nnAccuracy = nnCorrect / 50; // e.g., 0.88
   ```

3. **Update Weights**:
   ```typescript
   const totalAccuracy = sum([
     nnAccuracy,
     lstmAccuracy,
     mtlAccuracy,
     bayesianAccuracy,
     heuristicAccuracy
   ]); // e.g., 4.2
   
   weights.nn = nnAccuracy / totalAccuracy; // 0.88 / 4.2 = 0.21
   // Repeat for all predictors
   // Normalize to sum = 1.0
   ```

4. **Persist**:
   ```bash
   .odavl/brain-history/fusion-weights.json
   ```

## OMS vs Traditional Approaches

| Approach | Strengths | Weaknesses |
|----------|-----------|------------|
| **Single ML Model** | Fast, consistent | Limited perspective, brittle |
| **Voting Ensemble** | Simple, no training | Ignores model expertise |
| **Stacking** | High accuracy | Requires labeled data, complex |
| **OMS (ODAVL)** | Adaptive, context-aware, self-improving | Requires deployment feedback |

## OMS in Action

### Example: Security Patch Deployment

**Input**:
- 3 files changed in `auth/` directory
- 42 LOC modified
- Guardian: All tests passed

**OMS Processing**:

1. **Feature Extraction**:
   - High-risk files: Yes (auth/)
   - LOC: 42 (medium)
   - Test pass rate: 100%

2. **Individual Predictions**:
   - NN: 45% (detects auth module risk)
   - LSTM: 68% (stable history)
   - MTL: 38% (security task flags auth changes)
   - Bayesian: 55% ± 0.12 (high variance)
   - Heuristic: 72% (Guardian passed)

3. **Fusion Engine**:
   - Rule: Security risk → +20% MTL weight
   - Rule: High variance → +10% Bayesian weight
   - Weights: NN(20%), LSTM(15%), MTL(35%), Bayesian(20%), Heuristic(10%)
   - **Fusion Score: 51%**

4. **Self-Calibration**:
   - P11: 58%
   - Fusion: 51%
   - **Final: 55.2%** (0.6 × 58 + 0.4 × 51)

5. **Decision**: ⚠️ Manual review required (< 75%)

**OMS Reasoning Chain**:
- "🔒 MTL security task detected authentication pattern changes"
- "⚠️ Bayesian variance high (0.12), prediction uncertain"
- "🔧 Fusion Engine applied security risk rule (+20% MTL weight)"
- "📊 Final confidence below threshold due to file-type risk"

## Benefits of OMS

✅ **Adaptive**: Weights change based on context and history  
✅ **Robust**: No single point of failure  
✅ **Transparent**: Full reasoning chain for every decision  
✅ **Self-Improving**: Learns from deployment outcomes  
✅ **Context-Aware**: Different weights for different situations  

## Future Enhancements

- **Multi-Repo OMS**: Learn weights across multiple projects
- **Active Learning**: Request human feedback on uncertain predictions
- **Explainability**: SHAP values for feature importance per predictor
- **Real-Time Updates**: Online learning during deployment (Phase P14)
