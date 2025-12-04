#!/usr/bin/env tsx
/**
 * Test Guardian with example.com (simple site that allows bots)
 */

import { spawn } from 'child_process';
import { join } from 'path';

async function testExampleCom() {
  console.log('🧪 Testing Guardian with example.com (bot-friendly site)...\n');

  const guardianPath = join(process.cwd(), 'odavl-studio/guardian/cli/dist/guardian.mjs');
  
  const guardian = spawn('node', [guardianPath], {
    cwd: process.cwd(),
    stdio: ['pipe', 'pipe', 'pipe'],
  });

  let receivedMenu = false;
  let receivedUrlPrompt = false;
  let testStarted = false;
  let hasResults = false;

  guardian.stdout.on('data', (data) => {
    const text = data.toString();
    process.stdout.write(text);

    if (text.includes('💡 Enter command:') && !receivedMenu) {
      receivedMenu = true;
      setTimeout(() => {
        guardian.stdin.write('w\n');
      }, 500);
    }

    if (text.includes('Enter website URL') && !receivedUrlPrompt) {
      receivedUrlPrompt = true;
      console.log('\n📤 Testing with http://example.com...\n');
      setTimeout(() => {
        guardian.stdin.write('http://example.com\n');
        testStarted = true;
      }, 500);
    }

    // Check for success indicators
    if (testStarted && (text.includes('✔') || text.includes('✓'))) {
      hasResults = true;
    }

    if (testStarted && text.includes('Press Enter to return')) {
      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      if (hasResults) {
        console.log('✅ SUCCESS: Guardian tested website successfully!');
      } else {
        console.log('⚠️  Test completed but results unclear');
      }
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      
      setTimeout(() => {
        guardian.kill();
        process.exit(hasResults ? 0 : 1);
      }, 1000);
    }
  });

  guardian.stderr.on('data', (data) => {
    const text = data.toString();
    // Ignore Playwright warnings about webdriver
    if (!text.includes('webdriver') && !text.includes('DevTools')) {
      console.error('STDERR:', text);
    }
  });

  // Timeout
  setTimeout(() => {
    console.log('\n⏱️  Test timeout (60s)');
    guardian.kill();
    process.exit(1);
  }, 60000);
}

testExampleCom().catch(console.error);
