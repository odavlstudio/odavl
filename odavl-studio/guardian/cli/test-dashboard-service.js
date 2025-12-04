#!/usr/bin/env node

/**
 * Test Dashboard Data Service
 */

import { DashboardDataService } from './dist/dashboard-service.mjs';

console.log('\n🧪 Testing Guardian Dashboard Data Service\n');

const projectPath = process.cwd();
const service = new DashboardDataService(projectPath);

console.log('📂 Project Path:', projectPath);
console.log('');

try {
  const data = await service.getDashboardData();
  
  console.log('✅ Dashboard Data Loaded Successfully!\n');
  console.log('═'.repeat(60));
  
  // Summary
  console.log('\n📊 Summary:');
  console.log('  - Status:', data.summary.status);
  console.log('  - Accuracy:', data.summary.accuracy + '%');
  console.log('  - Readiness:', data.summary.readiness + '%');
  console.log('  - Confidence:', data.summary.confidence + '%');
  console.log('  - Issues:', data.summary.issues);
  console.log('  - Critical:', data.summary.criticalIssues);
  console.log('  - Last Run:', data.summary.lastRun.toLocaleString());
  
  // Screenshots
  console.log('\n📱 Screenshots:');
  if (Object.keys(data.screenshots).length > 0) {
    if (data.screenshots.desktop) console.log('  - Desktop:', data.screenshots.desktop);
    if (data.screenshots.tablet) console.log('  - Tablet:', data.screenshots.tablet);
    if (data.screenshots.mobile) console.log('  - Mobile:', data.screenshots.mobile);
  } else {
    console.log('  - None found');
  }
  
  // Visual Regression
  if (data.visualRegression) {
    console.log('\n📸 Visual Regression:');
    console.log('  - Has Changes:', data.visualRegression.hasChanges);
    console.log('  - Total Diff:', data.visualRegression.totalDiffPercentage.toFixed(2) + '%');
    console.log('  - Comparisons:', data.visualRegression.comparisons.length);
  } else {
    console.log('\n📸 Visual Regression: Not available');
  }
  
  // Errors
  console.log('\n❌ Errors:');
  if (data.errors.length > 0) {
    data.errors.forEach((error, i) => {
      console.log(`  ${i + 1}. [${error.severity}] ${error.message}`);
      if (error.file) console.log(`     File: ${error.file}:${error.line || 0}`);
    });
  } else {
    console.log('  - None found');
  }
  
  // Trends
  console.log('\n📈 Trends:');
  if (data.trends.dates.length > 0) {
    console.log('  - Runs:', data.trends.dates.length);
    console.log('  - Latest Accuracy:', data.trends.accuracyScores[data.trends.accuracyScores.length - 1] + '%');
    const avgAccuracy = data.trends.accuracyScores.reduce((a, b) => a + b, 0) / data.trends.accuracyScores.length;
    console.log('  - Average Accuracy:', avgAccuracy.toFixed(1) + '%');
  } else {
    console.log('  - No historical data');
  }
  
  // Project Info
  console.log('\n📦 Project Info:');
  console.log('  - Type:', data.projectInfo.type);
  console.log('  - Name:', data.projectInfo.name);
  console.log('  - Path:', data.projectInfo.path);
  
  console.log('\n═'.repeat(60));
  console.log('\n✅ Test Complete!\n');
  
} catch (error) {
  console.error('\n❌ Error:', error.message);
  process.exit(1);
}
