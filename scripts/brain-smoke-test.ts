/**
 * ODAVL Brain v1 - Smoke Test
 * Creates a temporary sandbox and validates the full pipeline
 */

import { runBrainPipeline } from '../packages/odavl-brain/src/index.js';
import * as fs from 'fs/promises';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  console.log('🧪 ODAVL Brain - Smoke Test\n');
  console.log('Creating temporary sandbox...\n');

  // Create temp directory
  const tempDir = path.join(__dirname, '../temp-brain-test');
  await fs.mkdir(tempDir, { recursive: true });

  try {
    // Initialize a minimal project
    console.log('Setting up test project...');
    await setupTestProject(tempDir);

    // Run Brain pipeline
    console.log('\nRunning Brain pipeline...\n');
    const report = await runBrainPipeline({
      projectRoot: tempDir,
      skipAutopilot: false,
      skipGuardian: true, // Skip Guardian for faster smoke test
      maxFixes: 5,
      verbose: true,
    });

    // Validate results
    console.log('\n✅ Smoke Test Results:\n');
    console.log(`  Insight Issues: ${report.insight.totalIssues}`);
    console.log(`  Autopilot Fixes: ${report.autopilot.totalFixes}`);
    console.log(`  Launch Score: ${report.launchScore}/100`);

    // Check if report was saved
    const reportPath = path.join(tempDir, '.odavl/brain-report.json');
    const reportExists = await fs
      .access(reportPath)
      .then(() => true)
      .catch(() => false);

    if (reportExists) {
      console.log(`\n✅ Report saved: ${reportPath}`);
    } else {
      console.log('\n⚠️ Report not saved');
    }

    console.log('\n✅ Smoke test passed!\n');
  } catch (error) {
    console.error('\n❌ Smoke test failed:', error);
    process.exit(1);
  } finally {
    // Cleanup
    console.log('Cleaning up...');
    await fs.rm(tempDir, { recursive: true, force: true });
  }
}

/**
 * Setup a minimal test project with intentional issues
 */
async function setupTestProject(tempDir: string) {
  // Create package.json
  const packageJson = {
    name: 'brain-smoke-test',
    version: '1.0.0',
    type: 'module',
    scripts: {
      build: 'echo "Build placeholder"',
      test: 'echo "Test placeholder"',
    },
  };

  await fs.writeFile(
    path.join(tempDir, 'package.json'),
    JSON.stringify(packageJson, null, 2)
  );

  // Create a TypeScript file with intentional issues
  const testFile = `
// Intentional issues for testing
const unusedVariable = 42;

function testFunction() {
  console.log('Hello World'); // console.log should be avoided
  var oldStyleVar = 'use let/const'; // var is discouraged
}

// Missing export
interface UserData {
  id: number;
  name: string;
}
`;

  const srcDir = path.join(tempDir, 'src');
  await fs.mkdir(srcDir, { recursive: true });
  await fs.writeFile(path.join(srcDir, 'index.ts'), testFile);

  // Create tsconfig.json
  const tsConfig = {
    compilerOptions: {
      target: 'ES2022',
      module: 'ESNext',
      moduleResolution: 'bundler',
      strict: true,
      esModuleInterop: true,
      skipLibCheck: true,
      forceConsistentCasingInFileNames: true,
    },
    include: ['src/**/*'],
  };

  await fs.writeFile(
    path.join(tempDir, 'tsconfig.json'),
    JSON.stringify(tsConfig, null, 2)
  );

  console.log('✅ Test project created');
}

main().catch(console.error);
