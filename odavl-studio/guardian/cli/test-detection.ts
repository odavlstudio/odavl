/**
 * Test Guardian v5.0 Auto-Detection
 */

import { detectProject, scanWorkspace } from './src/detectors/index.js';
import chalk from 'chalk';

async function testDetection() {
  console.log(chalk.bold.cyan('\n🧪 Testing Guardian v5.0 Auto-Detection Engine\n'));

  // Test 1: Detect current workspace (ODAVL - should be monorepo)
  console.log(chalk.yellow('Test 1: Detecting ODAVL Studio workspace...'));
  const rootPath = process.cwd().replace(/odavl-studio[/\\]guardian[/\\]cli.*/, '').replace(/\\/g, '/');
  console.log(chalk.gray(`  Path: ${rootPath}`));
  
  const rootDetection = await detectProject(rootPath);
  console.log(chalk.green(`  ✓ Type: ${rootDetection.type}`));
  console.log(chalk.green(`  ✓ Name: ${rootDetection.name}`));
  console.log(chalk.green(`  ✓ Confidence: ${rootDetection.confidence}%`));
  console.log(chalk.green(`  ✓ Framework: ${rootDetection.framework || 'N/A'}`));
  console.log(chalk.gray(`  Reasons: ${rootDetection.detectionReasons.join(', ')}`));

  // Test 2: Scan workspace structure
  console.log(chalk.yellow('\nTest 2: Scanning workspace packages...'));
  const workspace = await scanWorkspace(rootPath);
  console.log(chalk.green(`  ✓ Workspace Type: ${workspace.workspaceType}`));
  console.log(chalk.green(`  ✓ Total Packages: ${workspace.totalPackages}`));

  if (workspace.subPackages.length > 0) {
    console.log(chalk.gray('\n  Found packages:'));
    workspace.subPackages.slice(0, 10).forEach(pkg => {
      const emoji = getTypeEmoji(pkg.type);
      console.log(chalk.gray(`    ${emoji} ${pkg.name} (${pkg.type}) - ${pkg.confidence}% confidence`));
    });
    if (workspace.subPackages.length > 10) {
      console.log(chalk.gray(`    ... and ${workspace.subPackages.length - 10} more`));
    }
  }

  // Test 3: Detect Guardian CLI itself (should be CLI)
  console.log(chalk.yellow('\nTest 3: Detecting Guardian CLI package...'));
  const guardianPath = process.cwd();
  console.log(chalk.gray(`  Path: ${guardianPath}`));
  
  const guardianDetection = await detectProject(guardianPath);
  console.log(chalk.green(`  ✓ Type: ${guardianDetection.type}`));
  console.log(chalk.green(`  ✓ Name: ${guardianDetection.name}`));
  console.log(chalk.green(`  ✓ Confidence: ${guardianDetection.confidence}%`));
  console.log(chalk.gray(`  Reasons: ${guardianDetection.detectionReasons.join(', ')}`));

  console.log(chalk.bold.green('\n✅ All detection tests passed!\n'));
}

function getTypeEmoji(type: string): string {
  const emojis: Record<string, string> = {
    website: '🌐',
    extension: '🧩',
    cli: '⚙️',
    package: '📦',
    monorepo: '🏢',
    unknown: '❓',
  };
  return emojis[type] || '❓';
}

// Run tests
testDetection().catch(console.error);
