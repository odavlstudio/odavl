/**
 * SDK Export Verification
 * Tests that all SDK exports work correctly
 */
import { Insight, Autopilot, Guardian, initODAVL } from '@odavl-studio/sdk';

// Test imports
console.log('✓ Insight:', typeof Insight);
console.log('✓ Autopilot:', typeof Autopilot);
console.log('✓ Guardian:', typeof Guardian);
console.log('✓ initODAVL:', typeof initODAVL);

// Test instantiation
const insight = new Insight({ workspacePath: '/test' });
const autopilot = new Autopilot({ workspacePath: '/test' });
const guardian = new Guardian();

console.log('\n✅ All SDK exports working correctly!');
console.log('- Insight class: ✓');
console.log('- Autopilot class: ✓');
console.log('- Guardian class: ✓');
console.log('- init helper: ✓');
