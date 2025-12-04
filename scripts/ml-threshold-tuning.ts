#!/usr/bin/env tsx
/**
 * Threshold Tuning for ML Trust Predictor
 * 
 * Finds optimal decision threshold to maximize F1 score
 * Tests thresholds from 0.5 to 0.9 in 0.05 increments
 * 
 * Usage: pnpm tsx scripts/ml-threshold-tuning.ts
 */

import * as fs from 'node:fs/promises';

// Read A/B test results
const reportPath = 'c:\\Users\\sabou\\dev\\odavl\\reports\\ab-test-results.json';

interface DetailedResult {
  recipeId: string;
  recipeName: string;
  mlTrustScore: number;
  heuristicTrustScore: number;
  expectedOutcome: 'success' | 'failure';
  mlCorrect: boolean;
  heuristicCorrect: boolean;
}

interface ABTestReport {
  timestamp: string;
  totalCases: number;
  detailedResults: DetailedResult[];
}

async function tuneThreshold() {
  console.log('📊 ML Threshold Tuning\n');
  
  const report = JSON.parse(await fs.readFile(reportPath, 'utf-8')) as ABTestReport;
  const results = report.detailedResults;
  
  console.log(`✅ Loaded ${results.length} test cases\n`);
  
  // Test thresholds from 0.50 to 0.90
  const thresholds = [0.50, 0.55, 0.60, 0.65, 0.70, 0.75, 0.80, 0.85, 0.90];
  const metrics: Array<{
    threshold: number;
    accuracy: number;
    precision: number;
    recall: number;
    f1: number;
    tp: number;
    fp: number;
    tn: number;
    fn: number;
  }> = [];
  
  for (const threshold of thresholds) {
    let tp = 0, fp = 0, tn = 0, fn = 0;
    let correct = 0;
    
    for (const result of results) {
      const predicted = result.mlTrustScore > threshold;
      const actual = result.expectedOutcome === 'success';
      
      if (predicted && actual) tp++;
      if (predicted && !actual) fp++;
      if (!predicted && !actual) tn++;
      if (!predicted && actual) fn++;
      
      if (predicted === actual) correct++;
    }
    
    const accuracy = correct / results.length;
    const precision = tp / (tp + fp) || 0;
    const recall = tp / (tp + fn) || 0;
    const f1 = 2 * (precision * recall) / (precision + recall) || 0;
    
    metrics.push({
      threshold,
      accuracy,
      precision,
      recall,
      f1,
      tp,
      fp,
      tn,
      fn,
    });
  }
  
  // Sort by F1 score (descending)
  metrics.sort((a, b) => b.f1 - a.f1);
  
  console.log('🎯 THRESHOLD TUNING RESULTS\n');
  console.log('═'.repeat(100));
  console.log('Threshold  Accuracy   Precision  Recall     F1 Score   TP   FP   TN   FN');
  console.log('─'.repeat(100));
  
  for (const m of metrics) {
    const marker = m === metrics[0] ? '🏆' : '  ';
    console.log(
      `${marker} ${m.threshold.toFixed(2)}      ` +
      `${(m.accuracy * 100).toFixed(1).padStart(5)}%     ` +
      `${(m.precision * 100).toFixed(1).padStart(5)}%     ` +
      `${(m.recall * 100).toFixed(1).padStart(5)}%     ` +
      `${(m.f1 * 100).toFixed(1).padStart(5)}%     ` +
      `${m.tp.toString().padStart(3)}  ${m.fp.toString().padStart(3)}  ${m.tn.toString().padStart(3)}  ${m.fn.toString().padStart(3)}`
    );
  }
  
  console.log('═'.repeat(100));
  
  const best = metrics[0];
  console.log(`\n🏆 OPTIMAL THRESHOLD: ${best.threshold.toFixed(2)}`);
  console.log(`   Accuracy:  ${(best.accuracy * 100).toFixed(1)}%`);
  console.log(`   Precision: ${(best.precision * 100).toFixed(1)}%`);
  console.log(`   Recall:    ${(best.recall * 100).toFixed(1)}%`);
  console.log(`   F1 Score:  ${(best.f1 * 100).toFixed(1)}%`);
  
  console.log(`\n💡 RECOMMENDATION:`);
  if (best.threshold < 0.65) {
    console.log(`   Lower threshold (${best.threshold.toFixed(2)}) favors RECALL - catch more potential fixes`);
    console.log(`   Use in development/testing environments`);
  } else if (best.threshold > 0.75) {
    console.log(`   Higher threshold (${best.threshold.toFixed(2)}) favors PRECISION - fewer false positives`);
    console.log(`   Use in production/critical systems`);
  } else {
    console.log(`   Balanced threshold (${best.threshold.toFixed(2)}) optimizes F1 score`);
    console.log(`   Use as default for general-purpose automation`);
  }
  
  // Save tuning results
  await fs.writeFile(
    'reports/ml-threshold-tuning.json',
    JSON.stringify({ metrics, optimal: best }, null, 2)
  );
  
  console.log(`\n💾 Results saved to reports/ml-threshold-tuning.json`);
}

tuneThreshold().catch((err) => {
  console.error('❌ Error:', err);
  process.exit(1);
});
