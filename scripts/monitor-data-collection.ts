/**
 * Week 9-10: Data Collection Monitoring Script
 * Run daily to track progress toward 50K samples target
 */

import * as fs from 'node:fs/promises';
import * as path from 'node:path';

interface PredictionEntry {
  predictionId: string;
  timestamp: string;
  features: any;
  prediction: {
    trustScore: number;
    confidence: number;
    recommendation: string;
  };
  context: {
    recipeId: string;
    errorType: string;
    projectPath: string;
  };
  modelUsed: 'neural-network' | 'heuristic';
  outcome?: {
    success: boolean;
    metricsImprovement: number;
    executionTimeMs: number;
  };
  outcomeTimestamp?: string;
}

async function getDailyStats(date: string) {
  const logFile = path.join(process.cwd(), '.odavl/data-collection', `predictions-${date}.jsonl`);
  
  try {
    const content = await fs.readFile(logFile, 'utf-8');
    const lines = content.split('\n').filter(Boolean);
    const entries: PredictionEntry[] = lines.map(line => JSON.parse(line));
    
    const totalPredictions = entries.length;
    const withOutcomes = entries.filter(e => e.outcome).length;
    const successful = entries.filter(e => e.outcome?.success).length;
    const failed = withOutcomes - successful;
    
    const mlUsed = entries.filter(e => e.modelUsed === 'neural-network').length;
    const heuristicUsed = entries.filter(e => e.modelUsed === 'heuristic').length;
    
    // Average trust score
    const avgTrustScore = entries.reduce((sum, e) => sum + e.prediction.trustScore, 0) / totalPredictions;
    
    // Recommendations breakdown
    const autoApprove = entries.filter(e => e.prediction.recommendation === 'auto-apply').length;
    const reviewSuggested = entries.filter(e => e.prediction.recommendation === 'review-suggested').length;
    const manualOnly = entries.filter(e => e.prediction.recommendation === 'manual-only').length;
    
    // Error types
    const errorTypes = entries.reduce((acc, e) => {
      acc[e.context.errorType] = (acc[e.context.errorType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    // Recipes used
    const recipes = entries.reduce((acc, e) => {
      acc[e.context.recipeId] = (acc[e.context.recipeId] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return {
      date,
      totalPredictions,
      withOutcomes,
      successful,
      failed,
      successRate: withOutcomes > 0 ? (successful / withOutcomes * 100) : 0,
      mlUsed,
      heuristicUsed,
      mlUsageRate: (mlUsed / totalPredictions * 100),
      avgTrustScore: avgTrustScore * 100,
      recommendations: { autoApprove, reviewSuggested, manualOnly },
      errorTypes,
      recipes,
    };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return null; // File doesn't exist
    }
    throw error;
  }
}

async function getAllStats() {
  const dataDir = path.join(process.cwd(), '.odavl/data-collection');
  
  try {
    await fs.access(dataDir);
  } catch {
    console.log('⚠️  No data collection directory found. Start ML integration first.');
    return [];
  }
  
  const files = await fs.readdir(dataDir);
  const predictionFiles = files.filter(f => f.startsWith('predictions-') && f.endsWith('.jsonl'));
  
  const allStats = [];
  for (const file of predictionFiles) {
    const date = file.replace('predictions-', '').replace('.jsonl', '');
    const stats = await getDailyStats(date);
    if (stats) allStats.push(stats);
  }
  
  return allStats.sort((a, b) => a.date.localeCompare(b.date));
}

async function displayDashboard() {
  console.log('📊 Week 9-10 Data Collection Dashboard\n');
  console.log('='.repeat(70));
  
  const allStats = await getAllStats();
  
  if (allStats.length === 0) {
    console.log('\n⚠️  No data collected yet. Run ML integration test first:');
    console.log('   pnpm exec tsx scripts/test-ml-integration.ts\n');
    return;
  }
  
  // Overall totals
  const totalPredictions = allStats.reduce((sum, s) => sum + s.totalPredictions, 0);
  const totalWithOutcomes = allStats.reduce((sum, s) => sum + s.withOutcomes, 0);
  const totalSuccessful = allStats.reduce((sum, s) => sum + s.successful, 0);
  const totalMLUsed = allStats.reduce((sum, s) => sum + s.mlUsed, 0);
  
  const overallSuccessRate = totalWithOutcomes > 0 ? (totalSuccessful / totalWithOutcomes * 100) : 0;
  const overallMLUsage = (totalMLUsed / totalPredictions * 100);
  
  console.log('\n🎯 Overall Progress');
  console.log('-'.repeat(70));
  console.log(`Total Predictions:     ${totalPredictions.toLocaleString()}`);
  console.log(`With Outcomes:         ${totalWithOutcomes.toLocaleString()} (${(totalWithOutcomes/totalPredictions*100).toFixed(1)}%)`);
  console.log(`Successful:            ${totalSuccessful.toLocaleString()} (${overallSuccessRate.toFixed(1)}%)`);
  console.log(`ML Usage:              ${totalMLUsed.toLocaleString()} (${overallMLUsage.toFixed(1)}%)`);
  console.log(`\nTarget:                50,000 samples`);
  console.log(`Progress:              ${(totalPredictions/50000*100).toFixed(1)}% (${(50000-totalPredictions).toLocaleString()} remaining)`);
  console.log(`Days Active:           ${allStats.length}`);
  console.log(`Avg Samples/Day:       ${(totalPredictions/allStats.length).toFixed(0)}`);
  console.log(`Days to Target:        ${Math.ceil((50000-totalPredictions)/(totalPredictions/allStats.length))} (at current rate)`);
  
  // Daily breakdown
  console.log('\n📅 Daily Breakdown (Last 7 Days)');
  console.log('-'.repeat(70));
  console.log('Date         | Predictions | Outcomes | Success  | ML Used | Avg Trust');
  console.log('-'.repeat(70));
  
  const recentStats = allStats.slice(-7);
  for (const stat of recentStats) {
    const outcomeRate = stat.withOutcomes > 0 ? (stat.withOutcomes/stat.totalPredictions*100) : 0;
    console.log(
      `${stat.date} | ${stat.totalPredictions.toString().padStart(11)} | ` +
      `${stat.withOutcomes.toString().padStart(8)} | ` +
      `${stat.successRate.toFixed(1).padStart(6)}% | ` +
      `${stat.mlUsageRate.toFixed(1).padStart(6)}% | ` +
      `${stat.avgTrustScore.toFixed(1).padStart(9)}%`
    );
  }
  
  // Today's stats (detailed)
  const today = allStats[allStats.length - 1];
  console.log('\n📊 Today\'s Detailed Stats');
  console.log('-'.repeat(70));
  console.log(`Date:                  ${today.date}`);
  console.log(`Total Predictions:     ${today.totalPredictions}`);
  console.log(`With Outcomes:         ${today.withOutcomes} (${(today.withOutcomes/today.totalPredictions*100).toFixed(1)}%)`);
  console.log(`Successful:            ${today.successful} (${today.successRate.toFixed(1)}%)`);
  console.log(`Failed:                ${today.failed}`);
  console.log(`\nModel Usage:`);
  console.log(`  Neural Network:      ${today.mlUsed} (${today.mlUsageRate.toFixed(1)}%)`);
  console.log(`  Heuristic Fallback:  ${today.heuristicUsed} (${(today.heuristicUsed/today.totalPredictions*100).toFixed(1)}%)`);
  console.log(`\nRecommendations:`);
  console.log(`  Auto-Apply:          ${today.recommendations.autoApprove} (${(today.recommendations.autoApprove/today.totalPredictions*100).toFixed(1)}%)`);
  console.log(`  Review Suggested:    ${today.recommendations.reviewSuggested} (${(today.recommendations.reviewSuggested/today.totalPredictions*100).toFixed(1)}%)`);
  console.log(`  Manual Only:         ${today.recommendations.manualOnly} (${(today.recommendations.manualOnly/today.totalPredictions*100).toFixed(1)}%)`);
  
  console.log(`\nTop Error Types:`);
  const sortedErrors = Object.entries(today.errorTypes).sort((a, b) => b[1] - a[1]);
  sortedErrors.slice(0, 5).forEach(([type, count]) => {
    console.log(`  ${type.padEnd(15)} ${count} (${(count/today.totalPredictions*100).toFixed(1)}%)`);
  });
  
  console.log(`\nTop Recipes:`);
  const sortedRecipes = Object.entries(today.recipes).sort((a, b) => b[1] - a[1]);
  sortedRecipes.slice(0, 5).forEach(([recipe, count]) => {
    console.log(`  ${recipe.padEnd(25)} ${count} (${(count/today.totalPredictions*100).toFixed(1)}%)`);
  });
  
  // Health checks
  console.log('\n🏥 Data Quality Health Checks');
  console.log('-'.repeat(70));
  
  const outcomeCompleteness = (totalWithOutcomes / totalPredictions * 100);
  const mlUsageHealth = overallMLUsage;
  const successRateHealth = overallSuccessRate;
  
  console.log(`Outcome Completeness:  ${outcomeCompleteness.toFixed(1)}% ${outcomeCompleteness >= 95 ? '✅' : '⚠️ (target: 95%)'}`);
  console.log(`ML Usage:              ${mlUsageHealth.toFixed(1)}% ${mlUsageHealth >= 90 ? '✅' : '⚠️ (target: 90%)'}`);
  console.log(`Success Rate:          ${successRateHealth.toFixed(1)}% ${successRateHealth >= 60 ? '✅' : '⚠️ (target: 60%+)'}`);
  
  // Warnings
  console.log('\n⚡ Action Items');
  console.log('-'.repeat(70));
  
  if (outcomeCompleteness < 95) {
    console.log('⚠️  Low outcome completeness - verify VERIFY phase is recording outcomes');
  }
  if (mlUsageHealth < 90) {
    console.log('⚠️  Low ML usage - check if ML_ENABLE=true in environment');
  }
  if (successRateHealth < 60) {
    console.log('⚠️  Low success rate - review recipe quality or adjust trust thresholds');
  }
  if (totalPredictions < 4000 && allStats.length > 0) {
    const rate = totalPredictions / allStats.length;
    if (rate < 4000) {
      console.log(`⚠️  Below target rate (${rate.toFixed(0)}/day vs 4000/day target) - scale up collection`);
    }
  }
  
  if (outcomeCompleteness >= 95 && mlUsageHealth >= 90 && successRateHealth >= 60) {
    console.log('✅ All health checks passed - data collection on track!');
  }
  
  console.log('\n' + '='.repeat(70));
  console.log(`📈 Keep running! ${((50000 - totalPredictions) / 1000).toFixed(1)}K samples to go.\n`);
}

// Run dashboard
displayDashboard().catch(error => {
  console.error('❌ Dashboard error:', error);
  process.exit(1);
});
