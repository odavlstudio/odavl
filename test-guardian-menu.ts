import { AdaptiveMenuGenerator } from './odavl-studio/guardian/cli/src/menu/adaptive-menu.js';
import { detectSuite } from './odavl-studio/guardian/cli/src/detectors/suite-detector.js';

const workspaceRoot = process.cwd();

console.log('🔍 Detecting suite...\n');

const suite = await detectSuite(workspaceRoot);

if (!suite) {
  console.log('❌ Could not detect suite');
  process.exit(1);
}

console.log(`✅ Detected: ${suite.displayName}`);
console.log(`📦 Products: ${suite.products.length}\n`);

const menuGen = new AdaptiveMenuGenerator();
const sections = menuGen.generateMonorepoMenu(suite);

menuGen.renderMenu(sections, {
  title: `Guardian v5.0 - ${suite.displayName}`,
  subtitle: 'Advanced AI-Powered Code Quality Guardian',
  emoji: '🛡️',
});

console.log('\n✅ Menu rendered successfully!');
