import { TSDetector } from './dist/detector/index.js';

const detector = new TSDetector('C:/Users/sabou/dev/odavl');
const errors = await detector.detect();

console.log(`\n🔍 TypeScript Errors Found: ${errors.length}\n`);

errors.forEach((e, i) => {
  console.log(`${i + 1}. ${e.severity.toUpperCase()}: ${e.code}`);
  console.log(`   File: ${e.file}`);
  console.log(`   Line: ${e.line}:${e.column}`);
  console.log(`   Message: ${e.message}`);
  if (e.rootCause) console.log(`   Root Cause: ${e.rootCause}`);
  if (e.suggestedFix) console.log(`   Fix: ${e.suggestedFix}`);
  console.log('');
});
