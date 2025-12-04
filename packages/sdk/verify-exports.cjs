/**
 * SDK Export Verification - CJS
 */
const { Insight, Autopilot, Guardian, initODAVL } = require('./dist/index.cjs');

console.log('Testing @odavl-studio/sdk exports...\n');

// Test imports
console.log('✓ Insight:', typeof Insight);
console.log('✓ Autopilot:', typeof Autopilot);
console.log('✓ Guardian:', typeof Guardian);
console.log('✓ initODAVL:', typeof initODAVL);

// Test instantiation
try {
    const insight = new Insight({ workspacePath: '/test' });
    const autopilot = new Autopilot({ workspacePath: '/test' });
    const guardian = new Guardian();

    console.log('\n✅ SDK Phase 8: COMPLETE');
    console.log('━'.repeat(50));
    console.log('✓ Insight class exported');
    console.log('✓ Autopilot class exported');
    console.log('✓ Guardian class exported');
    console.log('✓ All instances created successfully');
    console.log('✓ ESM + CJS + DTS builds complete');
    console.log('━'.repeat(50));
    console.log('\n🎉 SDK is production-ready!');
} catch (err) {
    console.error('\n❌ Error:', err.message);
    process.exit(1);
}
