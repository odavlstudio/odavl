import { PerformanceDetector } from './dist/detector/index.js';

console.log('\n⚡ Testing Performance Detector...\n');

const detector = new PerformanceDetector('C:/Users/sabou/dev/odavl');
const errors = await detector.detect();

console.log(`Found ${errors.length} performance issues\n`);

// Group by type
const byType = {};
errors.forEach(e => {
  byType[e.type] = (byType[e.type] || 0) + 1;
});

console.log('Issues by type:');
Object.entries(byType).sort((a, b) => b[1] - a[1]).forEach(([type, count]) => {
  console.log(`  ${type}: ${count}`);
});

// Show first 5 issues
console.log('\nFirst 5 issues:\n');
errors.slice(0, 5).forEach((e, i) => {
  console.log(`${i + 1}. ${e.type}`);
  console.log(`   File: ${e.file}`);
  console.log(`   Line: ${e.line}`);
  console.log(`   Message: ${e.message}`);
  if (e.suggestedFix) console.log(`   Fix: ${e.suggestedFix}`);
  console.log('');
});
