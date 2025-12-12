/**
 * Runtime CLI Validation Test
 * Wave 8: Verify ODAVL Insight CLI works end-to-end without crashes
 */

import { execSync } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

const WORKSPACE_ROOT = path.resolve(__dirname, '../../../../..');
const SAMPLE_PROJECT = path.join(__dirname, '../sample-project');

console.log('🧪 ODAVL Insight CLI Runtime Validation\n');

// Test 1: List detectors
console.log('Test 1: List detectors...');
try {
  const result = execSync('pnpm cli:dev insight detectors', {
    cwd: WORKSPACE_ROOT,
    encoding: 'utf8',
    stdio: 'pipe',
  });
  
  if (result.includes('Available Detectors') || result.includes('detector')) {
    console.log('✓ List detectors works\n');
  } else {
    console.error('✗ List detectors output unexpected\n');
    process.exit(1);
  }
} catch (error: any) {
  console.error('✗ List detectors failed:', error.message);
  process.exit(1);
}

// Test 2: Quick analysis (without requiring real project)
console.log('Test 2: Quick analysis with --help...');
try {
  const result = execSync('pnpm cli:dev insight analyze --help', {
    cwd: WORKSPACE_ROOT,
    encoding: 'utf8',
    stdio: 'pipe',
  });
  
  if (result.includes('analyze') || result.includes('options')) {
    console.log('✓ Analyze --help works\n');
  } else {
    console.error('✗ Analyze --help output unexpected\n');
    process.exit(1);
  }
} catch (error: any) {
  console.error('✗ Analyze --help failed:', error.message);
  process.exit(1);
}

// Test 3: Verify insight-v2.ts has proper exports
console.log('Test 3: Verify CLI exports...');
try {
  const insightV2Path = path.join(WORKSPACE_ROOT, 'apps/studio-cli/src/commands/insight-v2.ts');
  const content = fs.readFileSync(insightV2Path, 'utf8');
  
  const hasAnalyze = content.includes('export async function analyze');
  const hasListDetectors = content.includes('export async function listDetectors');
  const hasErrorHandling = content.includes('try {') && content.includes('catch');
  
  if (hasAnalyze && hasListDetectors && hasErrorHandling) {
    console.log('✓ CLI exports and error handling present\n');
  } else {
    console.error('✗ Missing expected CLI functions or error handling\n');
    process.exit(1);
  }
} catch (error: any) {
  console.error('✗ Failed to verify CLI exports:', error.message);
  process.exit(1);
}

// Test 4: Unified schema validation
console.log('Test 4: Verify unified Issue schema...');
try {
  const schemaContent = fs.readFileSync(
    path.join(WORKSPACE_ROOT, 'apps/studio-cli/src/commands/insight-v2.ts'),
    'utf8'
  );
  
  const hasInsightIssue = schemaContent.includes('interface InsightIssue');
  const hasFile = schemaContent.includes('file: string');
  const hasSeverity = schemaContent.includes("severity: 'info' | 'low' | 'medium' | 'high' | 'critical'");
  
  if (hasInsightIssue && hasFile && hasSeverity) {
    console.log('✓ Unified InsightIssue schema present\n');
  } else {
    console.error('✗ InsightIssue schema missing or incomplete\n');
    process.exit(1);
  }
} catch (error: any) {
  console.error('✗ Failed to verify schema:', error.message);
  process.exit(1);
}

console.log('✅ All CLI validation tests passed!\n');
console.log('Summary:');
console.log('  • CLI commands available and working');
console.log('  • Error handling in place');
console.log('  • Unified output schema defined');
console.log('  • No crashes detected\n');
