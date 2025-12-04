#!/usr/bin/env tsx
/**
 * Test script to verify Guardian 'w' command works
 * Simulates user input to test website testing command
 */

import { spawn } from 'child_process';
import { join } from 'path';

async function testWCommand() {
  console.log('🧪 Testing Guardian "w" command...\n');

  const guardianPath = join(process.cwd(), 'odavl-studio/guardian/cli/dist/guardian.mjs');
  
  // Spawn Guardian process
  const guardian = spawn('node', [guardianPath], {
    cwd: process.cwd(),
    stdio: ['pipe', 'pipe', 'pipe'],
  });

  let output = '';
  let hasPrompted = false;
  let hasUrlPrompt = false;

  guardian.stdout.on('data', (data) => {
    const text = data.toString();
    output += text;
    process.stdout.write(text);

    // Check if we see the menu
    if (text.includes('💡 Enter command:') && !hasPrompted) {
      console.log('\n✅ Menu displayed successfully');
      hasPrompted = true;
      
      // Send 'w' command
      setTimeout(() => {
        console.log('\n📤 Sending "w" command...\n');
        guardian.stdin.write('w\n');
      }, 500);
    }

    // Check if we see the URL prompt
    if (text.includes('Enter website URL') && !hasUrlPrompt) {
      console.log('\n✅ URL input prompt detected!');
      hasUrlPrompt = true;
      
      // Send test URL
      setTimeout(() => {
        console.log('📤 Sending test URL...\n');
        guardian.stdin.write('http://localhost:3000\n');
        
        // Wait a bit then exit
        setTimeout(() => {
          guardian.kill();
        }, 2000);
      }, 500);
    }

    // Check for error message
    if (text.includes('Command not yet implemented')) {
      console.log('\n❌ ERROR: Command still not implemented!');
      guardian.kill();
      process.exit(1);
    }
  });

  guardian.stderr.on('data', (data) => {
    console.error('STDERR:', data.toString());
  });

  guardian.on('close', (code) => {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    if (hasUrlPrompt) {
      console.log('✅ SUCCESS: "w" command is now working!');
      console.log('✅ URL input prompt is functional');
      process.exit(0);
    } else if (hasPrompted) {
      console.log('⚠️  Menu displayed but URL prompt not detected');
      console.log('Check if command routing is correct');
      process.exit(1);
    } else {
      console.log('❌ FAIL: Menu did not display properly');
      process.exit(1);
    }
  });

  // Timeout after 10 seconds
  setTimeout(() => {
    console.log('\n⏱️  Timeout - killing process');
    guardian.kill();
    process.exit(1);
  }, 10000);
}

testWCommand().catch(console.error);
