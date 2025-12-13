/**
 * Phase 2.2 Task 8: Run All Verification Tests
 * 
 * Executes all Phase 2.2 verification tests and prints summary
 */

import chalk from 'chalk';
import { printSummary, type SuiteResult } from './test-utils.js';
import { verifyHttpClient } from './verify-http-client.js';
import { verifyAuthFlow } from './verify-auth-flow.js';
import { verifyAnalysisUpload } from './verify-analysis-upload.js';
import { verifyOfflineQueue } from './verify-offline-queue.js';
import { verifySyncCommand } from './verify-sync-command.js';
import { verifyPrivacySanitization } from './verify-privacy-sanitization.js';

async function main() {
  console.log(chalk.bold.cyan('\n🧪 Phase 2.2 Verification Tests'));
  console.log(chalk.gray('Testing all Phase 2.2 components\n'));
  console.log(chalk.gray('═'.repeat(60)));

  const suiteResults: SuiteResult[] = [];

  try {
    // Run all test suites
    console.log(chalk.yellow('\nRunning verification tests...\n'));
    
    suiteResults.push(await verifyHttpClient());
    suiteResults.push(await verifyAuthFlow());
    suiteResults.push(await verifyAnalysisUpload());
    suiteResults.push(await verifyOfflineQueue());
    suiteResults.push(await verifySyncCommand());
    suiteResults.push(await verifyPrivacySanitization());

    // Print summary
    printSummary(suiteResults);
  } catch (error: any) {
    console.error(chalk.red('\n✗ Verification failed with error:'));
    console.error(error);
    process.exit(1);
  }
}

main();
