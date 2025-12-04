import { ESLintDetector } from './dist/detector/index.js';

console.log('\n🔍 Testing ESLint Detector...\n');

const detector = new ESLintDetector('C:/Users/sabou/dev/odavl');
const errors = await detector.detect();

console.log(`Found ${errors.length} ESLint errors\n`);

// Group by severity
const bySeverity = {
  error: errors.filter(e => e.severity === 2),
  warning: errors.filter(e => e.severity === 1),
};

console.log(`Errors: ${bySeverity.error.length}`);
console.log(`Warnings: ${bySeverity.warning.length}\n`);

// Show first 10 issues
console.log('First 10 issues:\n');
errors.slice(0, 10).forEach((e, i) => {
  const severity = e.severity === 2 ? 'ERROR' : 'WARN';
  console.log(`${i + 1}. [${severity}] ${e.ruleId}`);
  console.log(`   File: ${e.file}`);
  console.log(`   Line: ${e.line}:${e.column}`);
  console.log(`   Message: ${e.message}`);
  if (e.fixable) console.log(`   ✅ Auto-fixable`);
  console.log('');
});
