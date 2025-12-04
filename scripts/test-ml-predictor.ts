/**
 * ML Trust Predictor Testing Script
 * 
 * Tests the trained ML model with sample scenarios and validates predictions
 */

import { MLTrustPredictor, type MLFeatures } from '../odavl-studio/insight/core/src/learning/ml-trust-predictor.js';

// Test scenarios with expected behavior
const testScenarios: Array<{
  name: string;
  features: MLFeatures;
  expectedBehavior: 'auto-apply' | 'review-suggested' | 'manual-only';
  description: string;
}> = [
  {
    name: 'High Confidence Simple Fix',
    description: 'Common import error with high success rate',
    expectedBehavior: 'auto-apply',
    features: {
      historicalSuccessRate: 0.95,
      errorFrequency: 0.8,
      codeComplexity: 0.2,
      linesChanged: 0.1,
      filesModified: 0.1,
      errorTypeCriticality: 0.3,
      similarPastOutcomes: 0.9,
      timeSinceLastFailure: 0.9,
      projectMaturity: 0.7,
      testCoverage: 0.85,
      recipeComplexity: 0.2,
      communityTrust: 0.8,
    },
  },
  {
    name: 'Medium Confidence Type Fix',
    description: 'TypeScript error with moderate complexity',
    expectedBehavior: 'review-suggested',
    features: {
      historicalSuccessRate: 0.7,
      errorFrequency: 0.5,
      codeComplexity: 0.5,
      linesChanged: 0.3,
      filesModified: 0.2,
      errorTypeCriticality: 0.4,
      similarPastOutcomes: 0.6,
      timeSinceLastFailure: 0.5,
      projectMaturity: 0.6,
      testCoverage: 0.6,
      recipeComplexity: 0.4,
      communityTrust: 0.5,
    },
  },
  {
    name: 'Low Confidence Security Fix',
    description: 'Security issue with high risk and complexity',
    expectedBehavior: 'manual-only',
    features: {
      historicalSuccessRate: 0.4,
      errorFrequency: 0.2,
      codeComplexity: 0.8,
      linesChanged: 0.6,
      filesModified: 0.5,
      errorTypeCriticality: 0.9, // Security is critical
      similarPastOutcomes: 0.3,
      timeSinceLastFailure: 0.2,
      projectMaturity: 0.5,
      testCoverage: 0.4,
      recipeComplexity: 0.7,
      communityTrust: 0.3,
    },
  },
  {
    name: 'Complex Refactor',
    description: 'Large refactor with many files changed',
    expectedBehavior: 'manual-only',
    features: {
      historicalSuccessRate: 0.6,
      errorFrequency: 0.4,
      codeComplexity: 0.9,
      linesChanged: 0.8,
      filesModified: 0.9,
      errorTypeCriticality: 0.5,
      similarPastOutcomes: 0.4,
      timeSinceLastFailure: 0.3,
      projectMaturity: 0.7,
      testCoverage: 0.5,
      recipeComplexity: 0.8,
      communityTrust: 0.6,
    },
  },
  {
    name: 'Well-Tested Performance Fix',
    description: 'Performance optimization with good test coverage',
    expectedBehavior: 'auto-apply',
    features: {
      historicalSuccessRate: 0.88,
      errorFrequency: 0.7,
      codeComplexity: 0.4,
      linesChanged: 0.2,
      filesModified: 0.15,
      errorTypeCriticality: 0.6,
      similarPastOutcomes: 0.85,
      timeSinceLastFailure: 0.8,
      projectMaturity: 0.85,
      testCoverage: 0.95,
      recipeComplexity: 0.3,
      communityTrust: 0.9,
    },
  },
];

async function runTests() {
  console.log('\n🧪 ML Trust Predictor Testing\n');
  console.log('═'.repeat(80));
  
  // Initialize predictor with ML enabled
  const predictor = new MLTrustPredictor({
    modelPath: '.odavl/ml-models/trust-predictor-v1',
    mlEnabled: true,
  });
  
  let passed = 0;
  let failed = 0;
  
  for (const scenario of testScenarios) {
    console.log(`\n📊 Test: ${scenario.name}`);
    console.log(`   Description: ${scenario.description}`);
    console.log(`   Expected: ${scenario.expectedBehavior}`);
    
    try {
      const prediction = await predictor.predict(scenario.features);
      
      console.log(`\n   Results:`);
      console.log(`   ✓ Trust Score: ${(prediction.trustScore * 100).toFixed(1)}%`);
      console.log(`   ✓ Confidence: ${(prediction.confidence * 100).toFixed(1)}%`);
      console.log(`   ✓ Recommendation: ${prediction.recommendation}`);
      
      if (prediction.reasoning.length > 0) {
        console.log(`   ✓ Reasoning:`);
        prediction.reasoning.forEach(reason => {
          console.log(`     - ${reason}`);
        });
      }
      
      // Validate recommendation matches expected behavior
      const isCorrect = prediction.recommendation === scenario.expectedBehavior;
      if (isCorrect) {
        console.log(`\n   ✅ PASSED - Recommendation matches expected behavior`);
        passed++;
      } else {
        console.log(`\n   ❌ FAILED - Expected ${scenario.expectedBehavior}, got ${prediction.recommendation}`);
        failed++;
      }
      
      // Show top contributing features
      if (prediction.featureImportance) {
        const topFeatures = Object.entries(prediction.featureImportance)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 3);
        
        console.log(`\n   Top Contributing Features:`);
        topFeatures.forEach(([feature, importance]) => {
          console.log(`     - ${feature}: ${(importance * 100).toFixed(1)}%`);
        });
      }
      
    } catch (error) {
      console.error(`\n   ❌ ERROR: ${error}`);
      failed++;
    }
    
    console.log('\n' + '─'.repeat(80));
  }
  
  console.log(`\n📈 Test Results:`);
  console.log(`   Passed: ${passed}/${testScenarios.length}`);
  console.log(`   Failed: ${failed}/${testScenarios.length}`);
  console.log(`   Success Rate: ${((passed / testScenarios.length) * 100).toFixed(1)}%`);
  
  if (passed === testScenarios.length) {
    console.log('\n✅ All tests passed! ML model is working correctly.');
  } else {
    console.log(`\n⚠️  ${failed} test(s) failed. Review the model predictions.`);
  }
  
  console.log('\n═'.repeat(80));
}

// Run tests
runTests().catch(console.error);
