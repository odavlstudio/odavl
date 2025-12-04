import { SecurityDetector } from './dist/detector/index.js';

console.log('\n🛡️ Testing Security Detector...\n');

const detector = new SecurityDetector('C:/Users/sabou/dev/odavl');
const errors = await detector.detect();

console.log(`Found ${errors.length} security issues\n`);

// Group by severity
const bySeverity = {
  critical: errors.filter(e => e.severity === 'critical'),
  high: errors.filter(e => e.severity === 'high'),
  medium: errors.filter(e => e.severity === 'medium'),
  low: errors.filter(e => e.severity === 'low'),
};

console.log(`Critical: ${bySeverity.critical.length}`);
console.log(`High: ${bySeverity.high.length}`);
console.log(`Medium: ${bySeverity.medium.length}`);
console.log(`Low: ${bySeverity.low.length}\n`);

// Show first 5 issues
console.log('First 5 issues:\n');
errors.slice(0, 5).forEach((e, i) => {
  console.log(`${i + 1}. [${e.severity.toUpperCase()}] ${e.type}`);
  console.log(`   File: ${e.file}`);
  console.log(`   Message: ${e.message}`);
  if (e.suggestedFix) console.log(`   Fix: ${e.suggestedFix}`);
  console.log('');
});
