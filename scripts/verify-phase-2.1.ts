#!/usr/bin/env tsx

/**
 * Phase 2.1 Verification Script
 * 
 * Tests:
 * 1. Privacy sanitization (absolute paths → relative)
 * 2. Message sanitization (variable names → <VAR>)
 * 3. Code snippet removal
 * 4. Token encryption
 * 5. No network calls verification
 */

import chalk from 'chalk';
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';
import { sanitizeIssue, sanitizeFilePath, sanitizeMessage, validateSanitization } from '../apps/studio-cli/src/utils/privacy-sanitizer.js';
import { AuthStorage, mockLogin, getAuthStatus, logout } from '../apps/studio-cli/src/utils/auth-storage.js';
import type { InsightIssue } from '../apps/studio-cli/src/commands/insight-v2.js';

console.log(chalk.cyan.bold('\n🧪 Phase 2.1 Verification Tests\n'));

let passedTests = 0;
let failedTests = 0;

function testSection(name: string) {
  console.log(chalk.cyan(`\n📋 ${name}`));
  console.log(chalk.gray('─'.repeat(50)));
}

function testPass(name: string, details?: string) {
  passedTests++;
  console.log(chalk.green(`✓ ${name}`));
  if (details) {
    console.log(chalk.gray(`  ${details}`));
  }
}

function testFail(name: string, reason: string) {
  failedTests++;
  console.log(chalk.red(`✗ ${name}`));
  console.log(chalk.red(`  Reason: ${reason}`));
}

// Test 1: Privacy Sanitization
testSection('Test 1: Privacy Sanitization');

// Test 1.1: Absolute path sanitization
const workspaceRoot = '/home/user/project';
const absolutePath = '/home/user/project/src/api-keys.ts';
const sanitizedPath = sanitizeFilePath(absolutePath, workspaceRoot);

if (sanitizedPath === 'src/api-keys.ts') {
  testPass('Absolute → Relative path conversion', `${absolutePath} → ${sanitizedPath}`);
} else {
  testFail('Absolute → Relative path conversion', `Expected 'src/api-keys.ts', got '${sanitizedPath}'`);
}

// Test 1.2: Windows path sanitization
const windowsPath = 'C:\\Users\\user\\project\\src\\file.ts';
const windowsRoot = 'C:\\Users\\user\\project';
const sanitizedWindowsPath = sanitizeFilePath(windowsPath, windowsRoot);

if (sanitizedWindowsPath === 'src/file.ts' && !sanitizedWindowsPath.includes('\\')) {
  testPass('Windows path normalization', `${windowsPath} → ${sanitizedWindowsPath}`);
} else {
  testFail('Windows path normalization', `Expected 'src/file.ts', got '${sanitizedWindowsPath}'`);
}

// Test 1.3: Path traversal prevention
const traversalPath = workspaceRoot + '/../../../etc/passwd';
const sanitizedTraversal = sanitizeFilePath(traversalPath, workspaceRoot);

if (!sanitizedTraversal.includes('../')) {
  testPass('Path traversal prevention', `'../' patterns blocked`);
} else {
  testFail('Path traversal prevention', `Path still contains '../': ${sanitizedTraversal}`);
}

// Test 2: Message Sanitization
testSection('Test 2: Message Sanitization');

// Test 2.1: Variable name removal
const message1 = "Unused variable 'AWS_SECRET_KEY'";
const sanitized1 = sanitizeMessage(message1);

if (sanitized1.includes('<VAR>') && !sanitized1.includes('AWS_SECRET_KEY')) {
  testPass('Variable name sanitization', `'AWS_SECRET_KEY' → <VAR>`);
} else {
  testFail('Variable name sanitization', `Expected '<VAR>', got '${sanitized1}'`);
}

// Test 2.2: Multiple variable names
const message2 = 'Function "getUserData" called with "apiKey" parameter';
const sanitized2 = sanitizeMessage(message2);

if (!sanitized2.includes('getUserData') && !sanitized2.includes('apiKey')) {
  testPass('Multiple variable sanitization', `Both variables removed`);
} else {
  testFail('Multiple variable sanitization', `Variables still present: ${sanitized2}`);
}

// Test 2.3: Preserve message structure
const message3 = "Type 'string' is not assignable to type 'number'";
const sanitized3 = sanitizeMessage(message3);

if (sanitized3.includes('Type') && sanitized3.includes('assignable')) {
  testPass('Message structure preservation', 'Core message retained');
} else {
  testFail('Message structure preservation', `Message altered: ${sanitized3}`);
}

// Test 3: Full Issue Sanitization
testSection('Test 3: Full Issue Sanitization');

const originalIssue: InsightIssue = {
  file: '/home/user/project/src/security/credentials.ts',
  line: 42,
  column: 15,
  message: "Hardcoded API key detected in variable 'STRIPE_SECRET'",
  severity: 'critical',
  detector: 'security',
  ruleId: 'hardcoded-secret',
  suggestedFix: 'const STRIPE_SECRET = process.env.STRIPE_SECRET;', // Should be removed
};

const sanitizedIssue = sanitizeIssue(originalIssue, workspaceRoot);

// Test 3.1: Path sanitized
if (!sanitizedIssue.file.includes('/home/') && sanitizedIssue.file.startsWith('src/')) {
  testPass('Issue path sanitization', `Absolute path removed`);
} else {
  testFail('Issue path sanitization', `Path not sanitized: ${sanitizedIssue.file}`);
}

// Test 3.2: Message sanitized
if (!sanitizedIssue.message.includes('STRIPE_SECRET')) {
  testPass('Issue message sanitization', 'Variable name removed');
} else {
  testFail('Issue message sanitization', `Variable still present: ${sanitizedIssue.message}`);
}

// Test 3.3: Code snippet removed
if (!('suggestedFix' in sanitizedIssue)) {
  testPass('Code snippet removal', 'suggestedFix field excluded');
} else {
  testFail('Code snippet removal', 'suggestedFix still present');
}

// Test 3.4: Validation passes
const isValid = validateSanitization(sanitizedIssue);
if (isValid) {
  testPass('Sanitization validation', 'All security checks passed');
} else {
  testFail('Sanitization validation', 'Validation failed - potential leaks detected');
}

// Test 4: Authentication Token Storage
testSection('Test 4: Authentication Token Storage');

const testEmail = 'test@odavl.dev';
const testPassword = 'secure-password-123';
const authStorage = new AuthStorage();

// Test 4.1: Mock login
try {
  const loginResult = await mockLogin(testEmail, testPassword);
  if (loginResult.success) {
    testPass('Mock login', 'Token created and stored');
  } else {
    testFail('Mock login', loginResult.message);
  }
} catch (error: any) {
  testFail('Mock login', error.message);
}

// Test 4.2: Token encryption (file should NOT be plain JSON)
const credentialsPath = path.join(os.homedir(), '.odavl', 'credentials.enc');
try {
  const fileContent = fs.readFileSync(credentialsPath, 'utf8');
  const parsed = JSON.parse(fileContent);
  
  // Check encryption format
  if (parsed.version === 1 && parsed.iv && parsed.authTag && parsed.data) {
    testPass('Token encryption', 'Encrypted format detected (AES-256-GCM)');
    
    // Verify data is encrypted (not plain JWT)
    if (!parsed.data.includes('eyJ')) { // JWT starts with eyJ
      testPass('Token data encryption', 'Token data is encrypted (not plain text)');
    } else {
      testFail('Token data encryption', 'Token appears to be plain text');
    }
  } else {
    testFail('Token encryption', 'Encryption format invalid');
  }
} catch (error: any) {
  testFail('Token encryption', `Cannot read credentials file: ${error.message}`);
}

// Test 4.3: Auth status check
try {
  const status = await getAuthStatus();
  if (status.authenticated && status.userId) {
    testPass('Auth status check', `User authenticated: ${status.userId}`);
  } else {
    testFail('Auth status check', 'Not authenticated');
  }
} catch (error: any) {
  testFail('Auth status check', error.message);
}

// Test 4.4: Device fingerprint
const fingerprint = authStorage.getDeviceFingerprint();
if (fingerprint && fingerprint.length > 20) {
  testPass('Device fingerprint', `Unique device ID generated (${fingerprint.slice(0, 16)}...)`);
} else {
  testFail('Device fingerprint', 'Fingerprint too short or missing');
}

// Test 4.5: Logout cleanup
try {
  await logout();
  const exists = fs.existsSync(credentialsPath);
  if (!exists) {
    testPass('Logout cleanup', 'Credentials file deleted');
  } else {
    testFail('Logout cleanup', 'Credentials file still exists');
  }
} catch (error: any) {
  testFail('Logout cleanup', error.message);
}

// Test 5: No Network Calls (Verification)
testSection('Test 5: No Network Calls Verification');

// This test requires manual verification or network monitoring
console.log(chalk.gray('Network call verification requires manual inspection:'));
console.log(chalk.white('  1. Run: grep -r "fetch\\|axios\\|http\\.request" apps/studio-cli/src/utils/'));
console.log(chalk.white('  2. Expected: No matches (or only in comments)'));
console.log(chalk.white('  3. Monitor network: tcpdump or Wireshark during CLI usage'));
console.log(chalk.gray('\nManual verification recommended for Phase 2.1 completion.'));

// Final Summary
console.log(chalk.cyan.bold('\n\n📊 Test Results Summary'));
console.log(chalk.gray('─'.repeat(50)));
console.log(chalk.green(`✓ Passed: ${passedTests}`));
console.log(chalk.red(`✗ Failed: ${failedTests}`));
console.log(chalk.cyan(`  Total:  ${passedTests + failedTests}`));

if (failedTests === 0) {
  console.log(chalk.green.bold('\n✅ All tests passed! Phase 2.1 verification complete.\n'));
  process.exit(0);
} else {
  console.log(chalk.red.bold(`\n❌ ${failedTests} test(s) failed. Fix before Phase 2.2.\n`));
  process.exit(1);
}
