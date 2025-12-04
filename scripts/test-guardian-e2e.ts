#!/usr/bin/env tsx
/**
 * Guardian End-to-End Test
 * Tests full flow: CLI → API → Dashboard
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const TEST_URL = 'https://example.com';
const INSIGHT_API = 'http://localhost:3001';

console.log('🔰 Guardian End-to-End Test\n');

// Step 1: Start Insight Cloud dev server
console.log('📊 Step 1: Starting Insight Cloud...');
const insightProcess = spawn('pnpm', ['dev'], {
  cwd: join(__dirname, '../odavl-studio/insight/cloud'),
  shell: true,
  stdio: 'pipe'
});

// Wait for server to start
await new Promise<void>((resolve) => {
  insightProcess.stdout?.on('data', (data) => {
    const output = data.toString();
    if (output.includes('Local:') || output.includes('Ready')) {
      console.log('✅ Insight Cloud started\n');
      resolve();
    }
  });
  
  // Timeout after 30 seconds
  setTimeout(() => {
    console.error('❌ Insight Cloud failed to start');
    process.exit(1);
  }, 30000);
});

// Wait additional 2 seconds for server to be fully ready
await new Promise(resolve => setTimeout(resolve, 2000));

// Step 2: Run Guardian test with upload
console.log('🔰 Step 2: Running Guardian test...');
const guardianProcess = spawn(
  'node',
  [
    join(__dirname, '../odavl-studio/guardian/core/dist/cli.js'),
    'test',
    TEST_URL
  ],
  {
    shell: true,
    stdio: 'inherit',
    env: {
      ...process.env,
      ODAVL_INSIGHT_API: INSIGHT_API
    }
  }
);

await new Promise<void>((resolve, reject) => {
  guardianProcess.on('close', (code) => {
    if (code === 0 || code === 1) { // 0 = passed, 1 = failed but completed
      console.log('\n✅ Guardian test completed\n');
      resolve();
    } else {
      console.error(`❌ Guardian test exited with code ${code}`);
      reject(new Error(`Guardian failed with code ${code}`));
    }
  });
});

// Step 3: Verify data in API
console.log('📡 Step 3: Verifying API data...');
try {
  const response = await fetch(`${INSIGHT_API}/api/guardian?limit=1`);
  
  if (!response.ok) {
    throw new Error(`API returned ${response.status}`);
  }
  
  const data: any = await response.json();
  
  if (data.tests && data.tests.length > 0) {
    console.log('✅ Test results found in database');
    console.log(`   Test ID: ${data.tests[0].id}`);
    console.log(`   URL: ${data.tests[0].url}`);
    console.log(`   Overall Score: ${data.tests[0].overallScore}/100`);
    console.log(`   Status: ${data.tests[0].passed ? 'PASSED' : 'FAILED'}`);
  } else {
    throw new Error('No test results found');
  }
} catch (error) {
  console.error('❌ API verification failed:', (error as Error).message);
  insightProcess.kill();
  process.exit(1);
}

// Step 4: Open dashboard in browser
console.log('\n🌐 Step 4: Dashboard ready at http://localhost:3001/guardian');
console.log('   Press Ctrl+C to stop the server\n');

// Keep process alive
process.on('SIGINT', () => {
  console.log('\n\n🛑 Stopping Insight Cloud...');
  insightProcess.kill();
  process.exit(0);
});

// Wait indefinitely
await new Promise(() => {});
