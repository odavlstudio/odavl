#!/usr/bin/env tsx
/**
 * Automated Guardian Website Test
 * Tests studio-hub website with Guardian
 */

import { spawn } from 'child_process';
import { join } from 'path';

async function testWebsite() {
  console.log('🧪 Testing studio-hub with Guardian...\n');

  const guardianPath = join(process.cwd(), 'odavl-studio/guardian/cli/dist/guardian.mjs');
  
  const guardian = spawn('node', [guardianPath], {
    cwd: process.cwd(),
    stdio: ['pipe', 'pipe', 'pipe'],
  });

  let receivedMenu = false;
  let receivedUrlPrompt = false;
  let testStarted = false;

  guardian.stdout.on('data', (data) => {
    const text = data.toString();
    process.stdout.write(text);

    // Wait for menu
    if (text.includes('💡 Enter command:') && !receivedMenu) {
      receivedMenu = true;
      console.log('\n✅ Menu displayed - sending "w" command...\n');
      setTimeout(() => {
        guardian.stdin.write('w\n');
      }, 500);
    }

    // Wait for URL prompt
    if (text.includes('Enter website URL') && !receivedUrlPrompt) {
      receivedUrlPrompt = true;
      console.log('\n✅ URL prompt received - sending localhost:3000...\n');
      setTimeout(() => {
        guardian.stdin.write('http://localhost:3000\n');
        testStarted = true;
      }, 500);
    }

    // Check for test completion
    if (testStarted && text.includes('Press Enter to return')) {
      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('✅ Website test completed!');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      
      setTimeout(() => {
        guardian.kill();
        process.exit(0);
      }, 1000);
    }
  });

  guardian.stderr.on('data', (data) => {
    console.error('STDERR:', data.toString());
  });

  guardian.on('close', (code) => {
    if (!testStarted) {
      console.log('⚠️  Test did not complete');
      process.exit(1);
    }
  });

  // Timeout
  setTimeout(() => {
    console.log('\n⏱️  Timeout - test taking too long');
    guardian.kill();
    process.exit(1);
  }, 60000); // 60 seconds
}

testWebsite().catch(console.error);
