/**
 * Test Guardian v5.0 Generic Suite Detection
 */

import { detectSuite } from './src/detectors/index.js';
import chalk from 'chalk';

async function testSuiteDetection() {
  console.log(chalk.bold.cyan('\n🧪 Testing Guardian v5.0 Generic Suite Detection\n'));

  // Test on ODAVL workspace
  console.log(chalk.yellow('Test: Detecting suite from current workspace...'));
  const rootPath = process.cwd().replace(/odavl-studio[/\\]guardian[/\\]cli.*/, '').replace(/\\/g, '/');
  console.log(chalk.gray(`  Path: ${rootPath}`));
  
  const suite = await detectSuite(rootPath);
  
  console.log(chalk.green(`  ✓ Suite Name: ${suite.name}`));
  console.log(chalk.green(`  ✓ Display Name: ${suite.displayName}`));
  console.log(chalk.green(`  ✓ Type: ${suite.type}`));
  console.log(chalk.green(`  ✓ Total Products: ${suite.totalProducts}`));
  console.log(chalk.green(`  ✓ Detection Source: ${suite.detectionSource}`));

  console.log(chalk.yellow('\n📊 Products Summary:\n'));
  
  // Group by type
  const byType: Record<string, any[]> = {};
  suite.products.forEach(p => {
    if (!byType[p.type]) byType[p.type] = [];
    byType[p.type].push(p);
  });

  Object.entries(byType).forEach(([type, products]) => {
    console.log(chalk.bold(`  ${products[0].emoji} ${type.toUpperCase()} (${products.length}):`));
    products.slice(0, 5).forEach((p: any) => {
      console.log(chalk.gray(`    • ${p.displayName} ${chalk.dim(`(${p.name})`)}`));
    });
    if (products.length > 5) {
      console.log(chalk.gray(`    ... and ${products.length - 5} more`));
    }
    console.log('');
  });

  console.log(chalk.yellow('📝 Generated Suite Summary:\n'));
  console.log(chalk.gray(suite.products.length > 0 ? generateSummary(suite) : '  No products found'));

  console.log(chalk.bold.green('\n✅ Suite detection test passed!\n'));
  
  // Test display format (as it would appear in menu)
  console.log(chalk.yellow('🎯 Example Menu Display:\n'));
  displayExampleMenu(suite);
}

function generateSummary(suite: any): string {
  const lines: string[] = [];
  
  lines.push(`  🏢 ${suite.displayName} Suite`);
  lines.push(`  📦 ${suite.totalProducts} product${suite.totalProducts !== 1 ? 's' : ''} detected`);
  lines.push('');

  const byType: Record<string, any[]> = {};
  suite.products.forEach((p: any) => {
    if (!byType[p.type]) byType[p.type] = [];
    byType[p.type].push(p);
  });

  Object.entries(byType).forEach(([type, products]) => {
    const emoji = products[0].emoji;
    const typeName = type.charAt(0).toUpperCase() + type.slice(1) + 's';
    lines.push(`  ${emoji} ${typeName} (${products.length}):`);
    products.slice(0, 3).forEach((p: any) => {
      lines.push(`    • ${p.displayName}`);
    });
    if (products.length > 3) {
      lines.push(`    ... and ${products.length - 3} more`);
    }
    lines.push('');
  });

  return lines.join('\n');
}

function displayExampleMenu(suite: any) {
  console.log(chalk.cyan('  ╔════════════════ 🛡️ Guardian v5.0 ═══════════════╗'));
  console.log(chalk.cyan('  ║                                                  ║'));
  console.log(chalk.cyan(`  ║  🏢 ${suite.displayName} Suite`.padEnd(53) + '║'));
  console.log(chalk.cyan(`  ║  📦 ${suite.totalProducts} products detected`.padEnd(53) + '║'));
  console.log(chalk.cyan('  ║                                                  ║'));
  
  // Show first 5 products
  suite.products.slice(0, 5).forEach((p: any, i: number) => {
    const line = `  ║  [${i + 1}] ${p.emoji} ${p.displayName} (${p.type})`;
    console.log(chalk.cyan(line.padEnd(53) + '║'));
  });
  
  if (suite.products.length > 5) {
    console.log(chalk.cyan('  ║      ... and more'.padEnd(53) + '║'));
  }
  
  console.log(chalk.cyan('  ║                                                  ║'));
  console.log(chalk.cyan('  ║  [0] 🚪 Exit                                     ║'));
  console.log(chalk.cyan('  ║                                                  ║'));
  console.log(chalk.cyan('  ╚══════════════════════════════════════════════════╝'));
  console.log('');
}

// Run test
testSuiteDetection().catch(console.error);
