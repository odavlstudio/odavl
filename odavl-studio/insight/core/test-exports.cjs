/**
 * Runtime verification test for @odavl-studio/insight-core exports
 * Tests all subpath exports to ensure they can be imported successfully
 */

console.log('Testing @odavl-studio/insight-core exports...\n');

const tests = [
  { name: 'Main export (.)', path: '@odavl-studio/insight-core' },
  { name: 'Server export (./server)', path: '@odavl-studio/insight-core/server' },
  { name: 'Detector index (./detector)', path: '@odavl-studio/insight-core/detector' },
  { name: 'TypeScript detector (./detector/typescript)', path: '@odavl-studio/insight-core/detector/typescript' },
  { name: 'ESLint detector (./detector/eslint)', path: '@odavl-studio/insight-core/detector/eslint' },
  { name: 'Security detector (./detector/security)', path: '@odavl-studio/insight-core/detector/security' },
  { name: 'Performance detector (./detector/performance)', path: '@odavl-studio/insight-core/detector/performance' },
  { name: 'Complexity detector (./detector/complexity)', path: '@odavl-studio/insight-core/detector/complexity' },
  { name: 'Import detector (./detector/import)', path: '@odavl-studio/insight-core/detector/import' },
  { name: 'Python detector (./detector/python)', path: '@odavl-studio/insight-core/detector/python' },
  { name: 'Java detector (./detector/java)', path: '@odavl-studio/insight-core/detector/java' },
  { name: 'Learning utilities (./learning)', path: '@odavl-studio/insight-core/learning' },
];

let passed = 0;
let failed = 0;

for (const test of tests) {
  try {
    const module = require(test.path);
    
    // Basic validation - module should be an object with exports
    if (typeof module !== 'object' || module === null) {
      throw new Error('Module did not export an object');
    }
    
    const exportCount = Object.keys(module).length;
    console.log(`✅ ${test.name}: OK (${exportCount} exports)`);
    passed++;
  } catch (error) {
    console.log(`❌ ${test.name}: FAILED`);
    console.log(`   Error: ${error.message}`);
    failed++;
  }
}

console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
console.log(`Test Results: ${passed} passed, ${failed} failed`);
console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

if (failed > 0) {
  process.exit(1);
}
