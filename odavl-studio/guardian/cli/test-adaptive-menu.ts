/**
 * Test Adaptive Menu System
 * 
 * This script tests the adaptive menu generation for:
 * 1. Monorepo (ODAVL workspace - 26 products)
 * 2. Single package detection
 */

import { join } from 'path';
import { detectSuite } from './src/detectors/index.js';
import { createAdaptiveMenu } from './src/menu/adaptive-menu.js';

async function testAdaptiveMenu() {
  console.log('🧪 Testing Adaptive Menu System\n');
  console.log('═'.repeat(70));

  // Test 1: Monorepo (ODAVL) - Go to root workspace
  console.log('\n📦 Test 1: Monorepo Detection (ODAVL workspace)\n');
  
  // Navigate to ODAVL root (3 levels up from guardian/cli)
  const workspacePath = join(process.cwd(), '../../..');
  console.log(`Testing from: ${workspacePath}\n`);
  const suite = await detectSuite(workspacePath);

  console.log(`Suite: ${suite.displayName}`);
  console.log(`Type: ${suite.type}`);
  console.log(`Products: ${suite.totalProducts}`);
  console.log(`Detection Source: ${suite.detectionSource}\n`);

  const adaptiveMenu = createAdaptiveMenu();

  if (suite.type === 'monorepo' && suite.totalProducts > 1) {
    console.log('🎯 Generating Monorepo Menu...\n');
    const sections = adaptiveMenu.generateMonorepoMenu(suite);

    console.log('Generated Menu Sections:');
    sections.forEach((section, index) => {
      console.log(`\n  ${section.emoji} ${section.title}`);
      console.log(`     Items: ${section.items.length}`);
      
      // Show first 3 items as preview
      section.items.slice(0, 3).forEach(item => {
        console.log(`     [${item.key}] ${item.emoji} ${item.label}`);
      });
      
      if (section.items.length > 3) {
        console.log(`     ... and ${section.items.length - 3} more`);
      }
    });

    // Render actual menu
    console.log('\n' + '═'.repeat(70));
    console.log('\n🖥️  RENDERED MENU (Monorepo Mode):\n');
    adaptiveMenu.renderMenu(sections, {
      title: 'Guardian v5.0',
      subtitle: `${suite.displayName} Suite - ${suite.totalProducts} products`,
      emoji: '🛡️',
    });
  }

  // Test 2: Single Package (simulate by checking first product)
  if (suite.products.length > 0) {
    const firstProduct = suite.products[0];
    
    console.log('═'.repeat(70));
    console.log('\n📦 Test 2: Single Package Mode (simulated)\n');
    console.log(`Product: ${firstProduct.displayName}`);
    console.log(`Type: ${firstProduct.type}\n`);

    const singleSections = adaptiveMenu.generateSinglePackageMenu(
      firstProduct.type,
      firstProduct.displayName
    );

    console.log('\n🖥️  RENDERED MENU (Single Package Mode):\n');
    adaptiveMenu.renderMenu(singleSections, {
      title: 'Guardian v5.0',
      subtitle: `${firstProduct.displayName} (${firstProduct.type})`,
      emoji: '🛡️',
    });
  }

  // Test 3: Unknown Project
  console.log('═'.repeat(70));
  console.log('\n📦 Test 3: Unknown Project Mode\n');

  const unknownSections = adaptiveMenu.generateUnknownProjectMenu();
  console.log('\n🖥️  RENDERED MENU (Unknown Project Mode):\n');
  adaptiveMenu.renderMenu(unknownSections, {
    title: 'Guardian v5.0',
    subtitle: 'Project Analysis',
    emoji: '🛡️',
  });

  console.log('═'.repeat(70));
  console.log('\n✅ Adaptive Menu System Test Complete!\n');
}

testAdaptiveMenu().catch((error) => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});
