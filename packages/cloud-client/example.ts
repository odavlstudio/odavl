/**
 * Example: How to use @odavl-studio/cloud-client SDK
 * 
 * This demonstrates the complete workflow:
 * 1. Authentication
 * 2. Usage quota checking
 * 3. Upload results
 * 4. Offline queue handling
 */

import { ODAVLCloudClient } from '@odavl-studio/cloud-client';
import {
  AuthenticationError,
  QuotaExceededError,
  NetworkError,
} from '@odavl-studio/cloud-client';

async function main() {
  console.log('🚀 ODAVL Cloud Client SDK Example\n');

  // ============================================
  // 1. Initialize Client
  // ============================================
  const client = new ODAVLCloudClient({
    baseUrl: 'https://api.odavl.io',
    offlineQueue: true,
    retry: {
      retries: 3,
      retryDelay: 1000,
    },
    timeout: 30000,
    debug: true, // Enable debug logging
  });

  // ============================================
  // 2. Authentication
  // ============================================
  console.log('📝 Step 1: Authenticating...\n');

  try {
    // Check if already logged in
    const isLoggedIn = await client.isAuthenticated();

    if (!isLoggedIn) {
      // Option A: API Key (for CI/CD)
      // await client.login('odavl_key_abc123...');

      // Option B: OAuth Device Flow (for interactive CLI)
      const { userCode, verificationUri, expiresIn } = await client.loginDevice();
      
      console.log('✨ Please authenticate:');
      console.log(`   Visit: ${verificationUri}`);
      console.log(`   Enter code: ${userCode}`);
      console.log(`   Expires in: ${expiresIn} seconds\n`);

      // The SDK automatically polls for authorization
      // User approves in browser → credentials saved
      console.log('⏳ Waiting for authorization...\n');
    } else {
      console.log('✅ Already authenticated!\n');
    }
  } catch (error) {
    if (error instanceof AuthenticationError) {
      console.error('❌ Authentication failed:', error.message);
      return;
    }
    throw error;
  }

  // ============================================
  // 3. Check Usage Quota
  // ============================================
  console.log('📊 Step 2: Checking usage quota...\n');

  try {
    const usage = await client.checkUsage('insightScans');

    console.log(`   Current usage: ${usage.used}/${usage.limit}`);
    console.log(`   Can continue: ${usage.canContinue}`);

    if (!usage.canContinue) {
      console.log(`   ⚠️ Quota exceeded!`);
      console.log(`   Upgrade at: ${usage.upgradeUrl}\n`);
      return;
    }

    console.log('   ✅ Quota available!\n');
  } catch (error) {
    if (error instanceof QuotaExceededError) {
      console.error('❌ Quota exceeded:', error.message);
      console.log(`   Upgrade at: ${error.upgradeUrl}`);
      return;
    }
    throw error;
  }

  // ============================================
  // 4. Upload Insight Run
  // ============================================
  console.log('📤 Step 3: Uploading Insight run...\n');

  try {
    const runId = await client.uploadInsightRun({
      workspaceId: 'my-awesome-project',
      detectors: ['typescript', 'eslint', 'security'],
      results: {
        issues: [
          {
            detector: 'typescript',
            severity: 'error',
            message: 'Type "string" is not assignable to type "number"',
            file: 'src/index.ts',
            line: 42,
          },
          {
            detector: 'security',
            severity: 'critical',
            message: 'Hardcoded API key detected',
            file: 'src/config.ts',
            line: 15,
          },
        ],
        metrics: {
          totalFiles: 123,
          totalIssues: 2,
          critical: 1,
          high: 0,
          medium: 1,
          low: 0,
        },
      },
      timestamp: Date.now(),
      duration: 12500,
      cliVersion: '2.0.0',
    });

    console.log(`   ✅ Run uploaded! ID: ${runId}\n`);

    // Increment usage after successful upload
    await client.incrementUsage({
      resource: 'insightScans',
      quantity: 1,
      metadata: {
        workspaceId: 'my-awesome-project',
        detectors: ['typescript', 'eslint', 'security'],
      },
    });

    console.log('   ✅ Usage incremented!\n');
  } catch (error) {
    if (error instanceof NetworkError) {
      console.log('   ⚠️ Network error - request queued for retry');
      console.log(`   Queue size: ${client.getQueueSize()}\n`);
    } else {
      throw error;
    }
  }

  // ============================================
  // 5. Upload Autopilot Run
  // ============================================
  console.log('🤖 Step 4: Uploading Autopilot run...\n');

  try {
    const runId = await client.uploadAutopilotRun({
      workspaceId: 'my-awesome-project',
      phase: 'verify',
      metrics: {
        filesChanged: 3,
        linesAdded: 45,
        linesRemoved: 12,
        issuesFixed: 5,
      },
      edits: [
        {
          file: 'src/utils.ts',
          changes: [
            {
              type: 'remove-unused-import',
              line: 10,
              before: "import { unused } from 'lib';",
              after: '',
            },
          ],
        },
      ],
      timestamp: Date.now(),
      duration: 5400,
      cliVersion: '2.0.0',
    });

    console.log(`   ✅ Run uploaded! ID: ${runId}\n`);

    await client.incrementUsage({
      resource: 'autopilotRuns',
      quantity: 1,
      metadata: { workspaceId: 'my-awesome-project' },
    });

    console.log('   ✅ Usage incremented!\n');
  } catch (error) {
    if (error instanceof NetworkError) {
      console.log('   ⚠️ Network error - request queued for retry\n');
    } else {
      throw error;
    }
  }

  // ============================================
  // 6. Upload Guardian Test
  // ============================================
  console.log('🛡️ Step 5: Uploading Guardian test...\n');

  try {
    const testId = await client.uploadGuardianTest({
      workspaceId: 'my-awesome-project',
      targetUrl: 'https://example.com',
      tests: ['accessibility', 'performance', 'security'],
      results: {
        accessibility: {
          score: 0.92,
          issues: [
            {
              severity: 'moderate',
              message: 'Buttons must have discernible text',
              selector: 'button.submit',
            },
          ],
        },
        performance: {
          score: 0.85,
          metrics: {
            fcp: 1200,
            lcp: 2300,
            cls: 0.05,
          },
        },
        security: {
          score: 0.98,
          issues: [],
        },
      },
      timestamp: Date.now(),
      duration: 8200,
      cliVersion: '2.0.0',
    });

    console.log(`   ✅ Test uploaded! ID: ${testId}\n`);

    await client.incrementUsage({
      resource: 'guardianTests',
      quantity: 1,
      metadata: {
        workspaceId: 'my-awesome-project',
        targetUrl: 'https://example.com',
      },
    });

    console.log('   ✅ Usage incremented!\n');
  } catch (error) {
    if (error instanceof NetworkError) {
      console.log('   ⚠️ Network error - request queued for retry\n');
    } else {
      throw error;
    }
  }

  // ============================================
  // 7. Sync Offline Queue
  // ============================================
  console.log('🔄 Step 6: Syncing offline queue...\n');

  try {
    const { success, failed } = await client.syncOfflineQueue();

    if (success > 0) {
      console.log(`   ✅ Synced ${success} queued requests`);
    }

    if (failed > 0) {
      console.log(`   ❌ Failed to sync ${failed} requests`);
    }

    if (success === 0 && failed === 0) {
      console.log('   ℹ️ Queue is empty');
    }

    console.log('');
  } catch (error) {
    console.error('   ❌ Failed to sync queue:', error);
  }

  // ============================================
  // 8. Logout
  // ============================================
  console.log('👋 Step 7: Logging out...\n');

  try {
    await client.logout();
    console.log('   ✅ Logged out successfully!\n');
  } catch (error) {
    console.error('   ❌ Logout failed:', error);
  }

  console.log('🎉 Example complete!\n');
}

// Run example
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
