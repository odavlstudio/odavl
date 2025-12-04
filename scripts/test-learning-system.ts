#!/usr/bin/env tsx
/**
 * Test Learning System
 * Demonstrates how the learning system works
 */

import { LearningManager } from '../packages/core/src/learning/learning-manager.js';
import path from 'node:path';

async function testLearningSystem() {
  console.log('🧠 Testing ODAVL Learning System\n');

  const workspaceRoot = path.resolve(process.cwd());
  const learningManager = new LearningManager(workspaceRoot);

  try {
    // 1. Load configuration
    console.log('📖 Loading learning configuration...');
    const config = await learningManager.loadConfig();
    console.log('✅ Configuration loaded');
    console.log(`   - Auto-adjust: ${config.learning_config.auto_adjust.enabled}`);
    console.log(`   - Min samples: ${config.learning_config.auto_adjust.min_samples}`);
    console.log(`   - Success threshold: ${config.learning_config.auto_adjust.success_threshold}`);
    console.log();

    // 2. Load legacy trust scores
    console.log('📊 Loading legacy trust scores...');
    const trustScores = await learningManager.loadLegacyTrustScores();
    console.log(`✅ Loaded ${trustScores.length} recipes`);
    console.log();

    // 3. Show statistics
    console.log('📈 Learning Statistics:');
    const stats = await learningManager.getStatistics();
    console.log(`   - Total recipes: ${stats.total_recipes}`);
    console.log(`   - Active recipes: ${stats.active_recipes}`);
    console.log(`   - Blacklisted: ${stats.blacklisted_recipes}`);
    console.log(`   - Average trust: ${stats.avg_trust_score}`);
    console.log(`   - High trust (≥0.8): ${stats.high_trust_count}`);
    console.log(`   - Low trust (<0.5): ${stats.low_trust_count}`);
    console.log();

    // 4. Test pattern preferences
    console.log('🎯 Pattern Preferences:');
    console.log(`   - Prefers strict_typescript: ${learningManager.isPreferredPattern('strict_typescript')}`);
    console.log(`   - Avoids any_type: ${learningManager.shouldAvoidPattern('any_type')}`);
    console.log(`   - Avoids console_logs: ${learningManager.shouldAvoidPattern('console_logs')}`);
    console.log();

    // 5. Show top trusted recipes
    console.log('🏆 Top Trusted Recipes:');
    const topRecipes = trustScores
      .filter(r => !r.blacklisted)
      .sort((a, b) => b.trust - a.trust)
      .slice(0, 5);

    topRecipes.forEach((recipe, index) => {
      const successRate = (recipe.success / recipe.runs * 100).toFixed(1);
      console.log(`   ${index + 1}. ${recipe.id}`);
      console.log(`      Trust: ${recipe.trust.toFixed(2)} | Runs: ${recipe.runs} | Success: ${successRate}%`);
    });
    console.log();

    // 6. Show blacklisted recipes
    const blacklisted = trustScores.filter(r => r.blacklisted);
    if (blacklisted.length > 0) {
      console.log('🚫 Blacklisted Recipes:');
      blacklisted.slice(0, 3).forEach(recipe => {
        console.log(`   - ${recipe.id} (${recipe.consecutiveFailures} consecutive failures)`);
      });
      console.log(`   ... and ${Math.max(0, blacklisted.length - 3)} more`);
      console.log();
    }

    // 7. Simulate learning
    console.log('🧪 Simulating Learning Process:');
    console.log('   Testing recipe: test-learning-demo');
    
    // Initial trust
    let trust = learningManager.getTrustScore('test-learning-demo');
    console.log(`   Initial trust: ${trust.toFixed(2)}`);

    // Simulate 5 successful runs
    for (let i = 0; i < 5; i++) {
      trust = await learningManager.updateTrustScore('test-learning-demo', true, 'test_success');
      console.log(`   After success #${i + 1}: ${trust.toFixed(2)}`);
    }

    // Simulate 1 failure
    trust = await learningManager.updateTrustScore('test-learning-demo', false, 'test_failure');
    console.log(`   After 1 failure: ${trust.toFixed(2)}`);

    // Simulate user override penalty
    trust = await learningManager.applyFeedbackPenalty('test-learning-demo', 'override');
    console.log(`   After user override: ${trust.toFixed(2)}`);

    // Simulate success bonus
    trust = await learningManager.applySuccessBonus('test-learning-demo');
    console.log(`   After verified success: ${trust.toFixed(2)}`);
    console.log();

    console.log('✅ Learning system test complete!');
    console.log('\n💡 Tips:');
    console.log('   - Trust scores auto-adjust based on success rates');
    console.log('   - User feedback (overrides, rollbacks) decreases trust');
    console.log('   - Recipes with 3+ consecutive failures get blacklisted');
    console.log('   - System learns from patterns and improves over time');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testLearningSystem();
}
