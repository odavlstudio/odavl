# ⚖️ ODAVL Brain: Risk + Confidence System

**How ODAVL Brain quantifies deployment safety**

## Overview

ODAVL Brain uses a dual metric system:

1. **Risk Score** (0-1): Likelihood of deployment failure
2. **Confidence Score** (0-100%): Trust in the prediction

Both metrics are computed by the 5-model ensemble and combined through the Fusion Engine.

## Risk Score Calculation

### Individual Predictor Risk

Each of the 5 predictors outputs a risk score:

**Neural Network (NN)**:
```typescript
risk_nn = model.predict(fileTypeFeatures);
// e.g., auth/ files → 0.78 risk
//      config files → 0.45 risk
//      test files → 0.12 risk
```

**LSTM**:
```typescript
risk_lstm = model.predict(last10Deployments);
// e.g., [S, S, S, F, S, S, S, S, S, S] → 0.22 risk
//       [F, F, S, F, S, F, S, S, F, S] → 0.68 risk
```

**Multi-Task Learning (MTL)**:
```typescript
const { security, stability, performance } = model.predict(features);
risk_mtl = 0.4 * security + 0.3 * stability + 0.3 * performance;
// e.g., security=0.8, stability=0.3, performance=0.2 → 0.47 risk
```

**Bayesian Confidence**:
```typescript
const { mean, variance } = monteCarloDropout(model, features);
risk_bayesian = mean;
confidence_bayesian = 1 / (1 + variance); // Higher variance = lower confidence
```

**Heuristic**:
```typescript
const testPassRate = guardianReport.passed / guardianReport.total;
const issueScore = guardianReport.criticalIssues * 0.5 + 
                   guardianReport.highIssues * 0.3;
risk_heuristic = (1 - testPassRate) + (issueScore / 10);
```

### Fusion Risk Score

The Fusion Engine combines individual risks:

```typescript
fusionRisk = 
  weights.nn * risk_nn +
  weights.lstm * risk_lstm +
  weights.mtl * risk_mtl +
  weights.bayesian * risk_bayesian +
  weights.heuristic * risk_heuristic;
```

Dynamic weight adjustment (see [OMS documentation](./brain-oms.md)) ensures the right predictor leads in each context.

### Final Risk Score

Self-calibration blends fusion risk with P11 risk:

```typescript
finalRisk = 0.6 * p11Risk + 0.4 * fusionRisk;
```

**Risk Interpretation**:
- `0.0 - 0.25`: 🟢 Low risk (safe to deploy)
- `0.25 - 0.50`: 🟡 Medium risk (review recommended)
- `0.50 - 0.75`: 🟠 High risk (manual testing required)
- `0.75 - 1.0`: 🔴 Critical risk (do not deploy)

## Confidence Score Calculation

### What is Confidence?

**Confidence** measures how certain the Brain is about its prediction. High confidence means the Brain has seen similar patterns before and knows the likely outcome. Low confidence means uncertainty.

### Confidence Factors

**1. Prediction Consensus**

If all 5 predictors agree, confidence is high:

```typescript
const predictions = [risk_nn, risk_lstm, risk_mtl, risk_bayesian, risk_heuristic];
const mean = predictions.reduce((a, b) => a + b) / 5;
const variance = predictions.reduce((a, p) => a + (p - mean) ** 2, 0) / 5;

const consensusConfidence = 1 / (1 + variance);
// e.g., predictions = [0.78, 0.79, 0.80, 0.77, 0.81] → variance = 0.0002 → confidence = 99.9%
//       predictions = [0.45, 0.78, 0.32, 0.91, 0.60] → variance = 0.047 → confidence = 95.5%
```

**2. Bayesian Uncertainty**

Bayesian predictor quantifies uncertainty:

```typescript
const { mean, variance } = monteCarloDropout(model, features);
const bayesianConfidence = 1 / (1 + variance);
// e.g., variance = 0.02 → confidence = 98.0%
//       variance = 0.15 → confidence = 87.0%
```

**3. Historical Accuracy**

How often has the Brain been correct recently?

```typescript
const recentAccuracy = history.last(50).filter(h => h.predictedCorrectly).length / 50;
const historicalConfidence = recentAccuracy;
// e.g., 45/50 correct → confidence = 90%
```

**4. Data Similarity**

How similar is this deployment to training data?

```typescript
const nearestNeighbors = knn(currentFeatures, trainingDataset, k=10);
const avgDistance = nearestNeighbors.reduce((a, n) => a + n.distance, 0) / 10;
const similarityConfidence = 1 / (1 + avgDistance);
// e.g., avgDistance = 0.05 → confidence = 95.2%
//       avgDistance = 0.30 → confidence = 76.9%
```

### Final Confidence Score

```typescript
finalConfidence = (
  0.3 * consensusConfidence +
  0.3 * bayesianConfidence +
  0.2 * historicalConfidence +
  0.2 * similarityConfidence
) * 100; // Convert to percentage
```

**Confidence Interpretation**:
- `90 - 100%`: 🟢 Very confident (trust the prediction)
- `75 - 90%`: 🟡 Confident (generally reliable)
- `60 - 75%`: 🟠 Uncertain (manual review advised)
- `0 - 60%`: 🔴 Low confidence (do not trust prediction)

## Risk vs Confidence Matrix

| Risk | Confidence | Action |
|------|-----------|--------|
| Low (0.0-0.25) | High (>75%) | ✅ Auto-deploy |
| Low (0.0-0.25) | Low (<75%) | ⚠️ Manual review (uncertain safety) |
| Medium (0.25-0.50) | High (>75%) | ⚠️ Manual review (confident risk) |
| Medium (0.25-0.50) | Low (<75%) | ⚠️ Manual review (uncertain risk) |
| High (0.50-0.75) | High (>75%) | ❌ Block (confident high risk) |
| High (0.50-0.75) | Low (<75%) | ❌ Block (uncertain high risk) |
| Critical (0.75-1.0) | Any | 🚫 Always block |

## Deployment Decision Logic

```typescript
if (finalRisk < 0.25 && finalConfidence >= 75) {
  return { canDeploy: true, reasoning: "Low risk, high confidence" };
}

if (finalRisk >= 0.75) {
  return { canDeploy: false, reasoning: "Critical risk detected" };
}

if (finalConfidence < 60) {
  return { canDeploy: false, reasoning: "Confidence too low, manual review required" };
}

// Medium risk or uncertain confidence
return { canDeploy: false, reasoning: "Manual review recommended" };
```

## Practical Examples

### Example 1: Refactoring (Low Risk, High Confidence)

**File Changes**: Split 1 large component into 4 smaller components  
**Predictions**: NN(0.12), LSTM(0.10), MTL(0.15), Bayesian(0.11±0.03), Heuristic(0.08)  
**Fusion Risk**: 0.11  
**Consensus**: Low variance (0.0005) → 99.9% consensus  
**Bayesian Uncertainty**: Low variance (0.03) → 97.1% confidence  
**Historical Accuracy**: 45/50 correct → 90% confidence  
**Final Confidence**: 94.5%  

**Decision**: ✅ **Auto-deploy** (risk=0.11, confidence=94.5%)

### Example 2: Security Patch (High Risk, High Confidence)

**File Changes**: Modify JWT validation logic  
**Predictions**: NN(0.78), LSTM(0.72), MTL(0.85), Bayesian(0.75±0.08), Heuristic(0.65)  
**Fusion Risk**: 0.75  
**Consensus**: Medium variance (0.0045) → 99.5% consensus  
**Bayesian Uncertainty**: Medium variance (0.08) → 92.6% confidence  
**Historical Accuracy**: 42/50 correct → 84% confidence  
**Final Confidence**: 91.2%  

**Decision**: ❌ **Block deployment** (risk=0.75, confidence=91.2%, "Confident high risk")

### Example 3: New Feature (Low Risk, Low Confidence)

**File Changes**: Add new API endpoint (never seen before)  
**Predictions**: NN(0.22), LSTM(0.68), MTL(0.15), Bayesian(0.45±0.18), Heuristic(0.30)  
**Fusion Risk**: 0.32  
**Consensus**: High variance (0.032) → 96.9% consensus  
**Bayesian Uncertainty**: High variance (0.18) → 84.7% confidence  
**Historical Accuracy**: 30/50 correct → 60% confidence (no similar samples)  
**Final Confidence**: 72.1%  

**Decision**: ⚠️ **Manual review** (risk=0.32, confidence=72.1%, "Uncertain medium risk")

## Improving Confidence Over Time

As ODAVL Brain sees more deployments, confidence improves:

1. **More Training Data**: Similarity confidence increases
2. **Better Historical Accuracy**: Meta-learning improves weights
3. **Lower Variance**: Bayesian uncertainty decreases
4. **Tighter Consensus**: Predictors align better

**Target**: 90%+ confidence on 80% of deployments after 100 production runs.
