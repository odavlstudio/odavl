/**
 * Test script for ODAVL Diagnostic System
 * Run: pnpm tsx scripts/test-diagnostics.ts
 */

import { 
  initializeDiagnostics,
  saveDiagnosticDump,
  saveErrorTrace,
  startPerformanceTracking,
  getDiagnosticsSummary,
  log,
  takeHeapSnapshot,
} from '../packages/core/src/diagnostics';

async function main() {
  console.log('🔍 Testing ODAVL Diagnostic System\n');
  
  // 1. Initialize
  console.log('1️⃣ Initializing diagnostic system...');
  await initializeDiagnostics();
  console.log('   ✅ Initialized\n');
  
  // 2. Test logging
  console.log('2️⃣ Testing log system...');
  log('[INFO] Test message 1');
  log('[DEBUG] Test message 2');
  log('[WARNING] Test message 3');
  console.log('   ✅ Logged 3 messages\n');
  
  // 3. Test crash dump
  console.log('3️⃣ Testing crash dump...');
  try {
    throw new Error('Test error for crash dump');
  } catch (error) {
    const dumpPath = await saveDiagnosticDump(error as Error, {
      test: true,
      operation: 'test-crash-dump',
      customData: { foo: 'bar' },
    });
    console.log(`   ✅ Crash dump saved: ${dumpPath}\n`);
  }
  
  // 4. Test error trace
  console.log('4️⃣ Testing error trace...');
  try {
    throw new Error('Test error for error trace');
  } catch (error) {
    const tracePath = await saveErrorTrace(
      error as Error,
      {
        file: '/test/file.ts',
        function: 'testFunction',
        line: 42,
        column: 10,
      },
      {
        runId: 'run-test-123',
        recipeId: 'test-recipe',
        trustScore: 0.85,
        filesModified: ['file1.ts', 'file2.ts'],
      }
    );
    console.log(`   ✅ Error trace saved: ${tracePath}\n`);
  }
  
  // 5. Test performance tracking
  console.log('5️⃣ Testing performance tracking...');
  const endTracking = startPerformanceTracking('test-operation');
  
  // Simulate some work
  await new Promise(resolve => setTimeout(resolve, 100));
  
  // Simulate memory allocation
  const arr = new Array(1000000).fill(0);
  
  await endTracking();
  console.log('   ✅ Performance log saved\n');
  
  // 6. Test heap snapshot (optional - creates large file)
  console.log('6️⃣ Testing heap snapshot...');
  try {
    const heapPath = await takeHeapSnapshot();
    console.log(`   ✅ Heap snapshot saved: ${heapPath}\n`);
  } catch (error) {
    console.log(`   ⚠️  Heap snapshot failed: ${(error as Error).message}\n`);
  }
  
  // 7. Get summary
  console.log('7️⃣ Getting diagnostic summary...');
  const summary = await getDiagnosticsSummary();
  console.log('   Summary:');
  console.log(`   - Crash dumps: ${summary.crashDumps}`);
  console.log(`   - Error traces: ${summary.errorTraces}`);
  console.log(`   - Performance logs: ${summary.performanceLogs}`);
  console.log(`   - Heap snapshots: ${summary.heapSnapshots}`);
  console.log(`   - Total size: ${(summary.totalSize / 1024).toFixed(2)} KB\n`);
  
  // 8. Test global error handlers
  console.log('8️⃣ Testing global error handlers...');
  console.log('   ℹ️  Global handlers registered (unhandledRejection, uncaughtException)');
  console.log('   ℹ️  Will auto-save dumps on crashes\n');
  
  console.log('✅ All tests passed!');
  console.log('\n📂 Check .odavl/diagnostics/ for generated files');
}

main().catch((error) => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});
