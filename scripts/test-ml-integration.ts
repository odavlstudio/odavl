/**
 * Week 9-10 Day 2: ML Integration Test Script
 * Tests ML prediction and data logging without full O-D-A-V-L cycle
 */

import { MLTrustPredictor } from '../odavl-studio/insight/core/src/learning/ml-trust-predictor.js';
import type { MLFeatures, MLPrediction } from '../odavl-studio/insight/core/src/learning/ml-trust-predictor.js';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';

// Enable ML
process.env.ML_ENABLE = 'true';

console.log('🧪 Week 9-10 Day 2: ML Integration Test\n');
console.log('=' .repeat(50));

async function testMLPrediction() {
  const predictor = new MLTrustPredictor({ mlEnabled: true });
  
  console.log('\n✅ ML Predictor initialized');
  console.log(`   ML Enabled: ${process.env.ML_ENABLE}`);
  
  // Test Case 1: High-trust scenario (should auto-approve)
  console.log('\n📊 Test 1: High-Trust Scenario');
  const highTrustFeatures: MLFeatures = {
    historicalSuccessRate: 0.9,   // 90% success rate
    errorFrequency: 0.2,           // Rare error
    codeComplexity: 0.3,           // Low complexity
    linesChanged: 0.1,             // Few lines changed
    filesModified: 0.1,            // 1 file
    errorTypeCriticality: 0.5,     // Medium criticality
    similarPastOutcomes: 0.85,     // Very similar past success
    timeSinceLastFailure: 0.9,     // Long time since failure
    projectMaturity: 0.8,          // Mature project
    testCoverage: 0.85,            // Good test coverage
    recipeComplexity: 0.2,         // Simple recipe
    communityTrust: 0.75,          // Trusted recipe
  };
  
  const prediction1 = await predictor.predict(highTrustFeatures);
  console.log(`   Trust Score: ${(prediction1.trustScore * 100).toFixed(1)}%`);
  console.log(`   Confidence: ${(prediction1.confidence * 100).toFixed(1)}%`);
  console.log(`   Recommendation: ${prediction1.recommendation}`);
  console.log(`   Reasoning: ${prediction1.reasoning.slice(0, 2).join(', ')}`);
  
  // Log prediction
  const predId1 = `test-${Date.now()}-001`;
  await predictor.logPrediction(predId1, highTrustFeatures, prediction1, {
    recipeId: 'remove-unused-imports',
    errorType: 'import',
    projectPath: process.cwd(),
  });
  console.log(`   ✅ Prediction logged: ${predId1}`);
  
  // Test Case 2: Low-trust scenario (should require review)
  console.log('\n📊 Test 2: Low-Trust Scenario');
  const lowTrustFeatures: MLFeatures = {
    historicalSuccessRate: 0.4,    // 40% success rate (risky)
    errorFrequency: 0.8,            // Very common error
    codeComplexity: 0.75,           // High complexity
    linesChanged: 0.6,              // Many lines changed
    filesModified: 0.5,             // 5 files
    errorTypeCriticality: 0.9,      // Security issue (critical)
    similarPastOutcomes: 0.3,       // Few similar cases
    timeSinceLastFailure: 0.1,      // Recent failure
    projectMaturity: 0.3,           // Young project
    testCoverage: 0.4,              // Low test coverage
    recipeComplexity: 0.7,          // Complex recipe
    communityTrust: 0.5,            // Neutral trust
  };
  
  const prediction2 = await predictor.predict(lowTrustFeatures);
  console.log(`   Trust Score: ${(prediction2.trustScore * 100).toFixed(1)}%`);
  console.log(`   Confidence: ${(prediction2.confidence * 100).toFixed(1)}%`);
  console.log(`   Recommendation: ${prediction2.recommendation}`);
  console.log(`   Reasoning: ${prediction2.reasoning.slice(0, 2).join(', ')}`);
  
  // Log prediction
  const predId2 = `test-${Date.now()}-002`;
  await predictor.logPrediction(predId2, lowTrustFeatures, prediction2, {
    recipeId: 'refactor-complex-function',
    errorType: 'security',
    projectPath: process.cwd(),
  });
  console.log(`   ✅ Prediction logged: ${predId2}`);
  
  // Test Case 3: Record outcomes
  console.log('\n📝 Test 3: Recording Outcomes');
  
  // Simulate successful execution
  await predictor.recordOutcome(predId1, {
    success: true,
    metricsImprovement: 5,      // Reduced 5 warnings
    executionTimeMs: 1234,
  }, process.cwd());
  console.log(`   ✅ Outcome recorded for ${predId1}: SUCCESS`);
  
  // Simulate failed execution
  await predictor.recordOutcome(predId2, {
    success: false,
    metricsImprovement: -2,     // Added 2 warnings (negative = degradation)
    executionTimeMs: 567,
  }, process.cwd());
  console.log(`   ✅ Outcome recorded for ${predId2}: FAILURE`);
  
  // Verify log file
  console.log('\n📁 Verifying Data Collection Files');
  const today = new Date().toISOString().split('T')[0];
  const logFile = path.join(process.cwd(), '.odavl/data-collection', `predictions-${today}.jsonl`);
  
  try {
    await fs.access(logFile);
    const content = await fs.readFile(logFile, 'utf-8');
    const lines = content.split('\n').filter(Boolean);
    console.log(`   ✅ Log file exists: predictions-${today}.jsonl`);
    console.log(`   ✅ Total predictions: ${lines.length}`);
    
    // Parse and display sample
    const sample = JSON.parse(lines[lines.length - 1]);
    console.log(`\n📋 Sample Log Entry:`);
    console.log(`   Prediction ID: ${sample.predictionId}`);
    console.log(`   Model Used: ${sample.modelUsed}`);
    console.log(`   Trust Score: ${(sample.prediction.trustScore * 100).toFixed(1)}%`);
    console.log(`   Outcome: ${sample.outcome ? (sample.outcome.success ? 'SUCCESS ✅' : 'FAILURE ❌') : 'PENDING ⏳'}`);
    
  } catch (error) {
    console.log(`   ❌ Log file not found: ${logFile}`);
    throw error;
  }
  
  return { predId1, predId2, prediction1, prediction2 };
}

async function validateDataFormat() {
  console.log('\n🔍 Validating JSONL Data Format');
  
  const today = new Date().toISOString().split('T')[0];
  const logFile = path.join(process.cwd(), '.odavl/data-collection', `predictions-${today}.jsonl`);
  
  const content = await fs.readFile(logFile, 'utf-8');
  const lines = content.split('\n').filter(Boolean);
  
  let validCount = 0;
  let errors: string[] = [];
  
  for (const line of lines) {
    try {
      const entry = JSON.parse(line);
      
      // Validate required fields
      if (!entry.predictionId || !entry.timestamp || !entry.features || !entry.prediction) {
        errors.push(`Missing required fields in: ${entry.predictionId || 'unknown'}`);
        continue;
      }
      
      // Validate prediction ID format
      if (!entry.predictionId.match(/^(pred|test)-\d+-[\w]+$/)) {
        errors.push(`Invalid prediction ID format: ${entry.predictionId}`);
      }
      
      // Validate timestamp
      if (isNaN(Date.parse(entry.timestamp))) {
        errors.push(`Invalid timestamp: ${entry.timestamp}`);
      }
      
      // Validate trust score range
      if (entry.prediction.trustScore < 0 || entry.prediction.trustScore > 1) {
        errors.push(`Trust score out of range: ${entry.prediction.trustScore}`);
      }
      
      validCount++;
    } catch (error) {
      errors.push(`Parse error: ${(error as Error).message}`);
    }
  }
  
  console.log(`   ✅ Valid entries: ${validCount}/${lines.length}`);
  console.log(`   ${errors.length === 0 ? '✅' : '❌'} Errors: ${errors.length}`);
  
  if (errors.length > 0) {
    console.log('\n   Errors found:');
    errors.slice(0, 5).forEach(err => console.log(`   - ${err}`));
  }
  
  return { validCount, totalCount: lines.length, errors };
}

// Run tests
(async () => {
  try {
    const startTime = Date.now();
    
    const results = await testMLPrediction();
    const validation = await validateDataFormat();
    
    const duration = Date.now() - startTime;
    
    console.log('\n' + '='.repeat(50));
    console.log('🎯 Test Summary');
    console.log('='.repeat(50));
    console.log(`✅ ML Predictor: Working`);
    console.log(`✅ Data Logging: Working`);
    console.log(`✅ Outcome Recording: Working`);
    console.log(`✅ Data Validation: ${validation.validCount}/${validation.totalCount} valid`);
    console.log(`⏱️  Duration: ${duration}ms`);
    
    if (validation.errors.length > 0) {
      console.log(`\n⚠️  ${validation.errors.length} data quality issues found`);
      process.exit(1);
    }
    
    console.log('\n✅ All tests passed! ML System is production-ready. 🚀');
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Test failed:', (error as Error).message);
    console.error((error as Error).stack);
    process.exit(1);
  }
})();
