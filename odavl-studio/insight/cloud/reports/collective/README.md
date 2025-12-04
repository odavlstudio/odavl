# ODAVL Insight Cloud - Collective Intelligence Gate

## Overview

This directory contains smoke test reports and accuracy metrics for the collective intelligence system.

## Accuracy Gate

The accuracy gate ensures recommendation quality meets minimum thresholds:

### Thresholds

- **🔴 RED (< 0.4)**: Unacceptable - Exit code 1, blocks deployment
- **🟡 YELLOW (0.4-0.6)**: Warning - Exit code 0, but requires attention
- **🟢 GREEN (≥ 0.6)**: Acceptable - Exit code 0, healthy state

### Calculation

```
accuracy = totalSuccess / (totalSuccess + totalFail)
```

Where:

- `totalSuccess`: Sum of all `FixRecommendation.successCount`
- `totalFail`: Sum of all `FixRecommendation.failCount`

### Usage

```bash
pnpm gate:collective
```

## Smoke Tests

Smoke test reports are generated automatically with filename pattern:

```
run-<timestamp>.md
```

Each report includes:

1. Ingest API test (POST event)
2. Recommend API test (GET recommendations)
3. Feedback API test (POST success feedback)
4. Computed accuracy metrics

### Running Smoke Tests

```bash
pnpm smoke:collective
```

## Reports

All test runs are stored here for audit and trend analysis.
