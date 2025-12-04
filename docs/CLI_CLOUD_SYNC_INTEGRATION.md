# CLI Cloud Sync Integration Guide

Complete guide for integrating ODAVL CLI tools with cloud platform.

## Setup

### 1. Environment Configuration

```bash
# .env file
ODAVL_CLOUD_API=https://api.odavl.studio
ODAVL_API_KEY=your-api-key-here
ODAVL_ORGANIZATION_ID=org_abc123
ODAVL_PROJECT_ID=proj_xyz789
```

### 2. Install Dependencies

```bash
pnpm add @odavl-studio/core
```

## Integration Examples

### Insight CLI Integration

```typescript
// packages/insight-cli/src/commands/analyze.ts
import { cloudSyncService } from '@odavl-studio/core/services/cloud-sync';
import type { InsightAnalysisResult } from '@odavl-studio/core/services/cloud-sync';

interface AnalyzeOptions {
  detectors?: string[];
  output?: string;
  cloud?: boolean;
  cloudOrg?: string;
  cloudProject?: string;
}

export async function analyzeCommand(workspacePath: string, options: AnalyzeOptions) {
  console.log('🔍 Starting Insight analysis...');
  
  // Run analysis
  const analysisResult = await runInsightAnalysis(workspacePath, options.detectors);
  
  // Save locally
  const outputPath = options.output || '.odavl/insight-results.json';
  await fs.writeFile(outputPath, JSON.stringify(analysisResult, null, 2));
  console.log(`✅ Analysis complete. Saved to ${outputPath}`);
  
  // Sync to cloud if enabled
  if (options.cloud) {
    console.log('☁️  Syncing to cloud...');
    
    const organizationId = options.cloudOrg || process.env.ODAVL_ORGANIZATION_ID;
    const projectId = options.cloudProject || process.env.ODAVL_PROJECT_ID;
    
    if (!organizationId || !projectId) {
      console.error('❌ Missing organization or project ID for cloud sync');
      console.error('Set ODAVL_ORGANIZATION_ID and ODAVL_PROJECT_ID environment variables');
      return;
    }
    
    try {
      const syncJob = await cloudSyncService.uploadInsightAnalysis(
        {
          projectId,
          organizationId,
          timestamp: new Date().toISOString(),
          detectors: analysisResult.detectors,
          totalIssues: analysisResult.totalIssues,
          issuesBySeverity: analysisResult.issuesBySeverity,
          issues: analysisResult.issues,
          metrics: analysisResult.metrics,
        },
        outputPath
      );
      
      console.log(`✅ Synced to cloud: ${syncJob.id}`);
      console.log(`   Status: ${syncJob.status}`);
      console.log(`   View at: https://studio.odavl.com/dashboard/${organizationId}/sync`);
    } catch (error) {
      console.error('❌ Cloud sync failed:', error);
    }
  }
}

// Helper function to run analysis
async function runInsightAnalysis(
  workspacePath: string, 
  detectors?: string[]
): Promise<InsightAnalysisResult> {
  // Run detectors (TypeScript, ESLint, Security, etc.)
  const issues = await runDetectors(workspacePath, detectors);
  
  // Calculate metrics
  const filesAnalyzed = await countFiles(workspacePath);
  const startTime = Date.now();
  
  return {
    projectId: process.env.ODAVL_PROJECT_ID || 'unknown',
    organizationId: process.env.ODAVL_ORGANIZATION_ID || 'unknown',
    timestamp: new Date().toISOString(),
    detectors: detectors || ['typescript', 'eslint', 'security'],
    totalIssues: issues.length,
    issuesBySeverity: {
      critical: issues.filter(i => i.severity === 'critical').length,
      high: issues.filter(i => i.severity === 'high').length,
      medium: issues.filter(i => i.severity === 'medium').length,
      low: issues.filter(i => i.severity === 'low').length,
    },
    issues,
    metrics: {
      filesAnalyzed,
      duration: Date.now() - startTime,
      codeLines: await countCodeLines(workspacePath),
    },
  };
}
```

### Autopilot CLI Integration

```typescript
// packages/autopilot-cli/src/odavl-cycle.ts
import { cloudSyncService } from '@odavl-studio/core/services/cloud-sync';
import type { AutopilotLedger } from '@odavl-studio/core/services/cloud-sync';

interface CycleOptions {
  maxFiles?: number;
  maxLoc?: number;
  cloud?: boolean;
}

export async function runODAVLCycle(workspacePath: string, options: CycleOptions) {
  const runId = `run_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const startTime = Date.now();
  
  console.log(`🤖 Starting Autopilot cycle: ${runId}`);
  
  // Execute O-D-A-V-L phases
  const ledger: AutopilotLedger = {
    projectId: process.env.ODAVL_PROJECT_ID || 'unknown',
    organizationId: process.env.ODAVL_ORGANIZATION_ID || 'unknown',
    runId,
    timestamp: new Date().toISOString(),
    phases: {
      observe: await observePhase(),
      decide: await decidePhase(),
      act: await actPhase(),
      verify: await verifyPhase(),
      learn: await learnPhase(),
    },
    success: true,
    totalDuration: Date.now() - startTime,
    improvementScore: 85,
  };
  
  // Save ledger locally
  const ledgerPath = `.odavl/ledger/run-${runId}.json`;
  await fs.writeFile(ledgerPath, JSON.stringify(ledger, null, 2));
  console.log(`✅ Cycle complete. Ledger saved to ${ledgerPath}`);
  
  // Sync to cloud if enabled
  if (options.cloud) {
    console.log('☁️  Syncing ledger to cloud...');
    
    try {
      const syncJob = await cloudSyncService.uploadAutopilotLedger(
        ledger,
        ledgerPath
      );
      
      console.log(`✅ Ledger synced: ${syncJob.id}`);
      console.log(`   Trust score updated: ${ledger.phases.learn.trustScoreUpdated}`);
    } catch (error) {
      console.error('❌ Cloud sync failed:', error);
    }
  }
  
  return ledger;
}

// Phase implementations
async function observePhase() {
  console.log('👀 Observe: Collecting metrics...');
  return {
    status: 'success' as const,
    duration: 1200,
    metrics: {
      eslintErrors: 12,
      typeScriptErrors: 5,
    },
  };
}

async function decidePhase() {
  console.log('🧠 Decide: Selecting recipe...');
  return {
    status: 'success' as const,
    duration: 800,
    selectedRecipe: 'remove-unused-imports',
    trustScore: 0.92,
  };
}

async function actPhase() {
  console.log('🔧 Act: Applying improvements...');
  return {
    status: 'success' as const,
    duration: 2500,
    filesModified: ['src/index.ts', 'src/utils.ts'],
    linesChanged: 45,
  };
}

async function verifyPhase() {
  console.log('✅ Verify: Checking quality...');
  return {
    status: 'success' as const,
    duration: 1500,
    qualityImproved: true,
    attestation: 'sha256:abc123...',
  };
}

async function learnPhase() {
  console.log('🎓 Learn: Updating trust scores...');
  return {
    status: 'success' as const,
    duration: 600,
    trustScoreUpdated: true,
  };
}
```

### Guardian CLI Integration

```typescript
// packages/guardian-cli/src/commands/test.ts
import { cloudSyncService } from '@odavl-studio/core/services/cloud-sync';
import type { GuardianTestResult } from '@odavl-studio/core/services/cloud-sync';

interface TestOptions {
  url: string;
  environment?: 'development' | 'staging' | 'production';
  cloud?: boolean;
  screenshots?: boolean;
}

export async function testCommand(options: TestOptions) {
  const testRunId = `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const startTime = Date.now();
  
  console.log(`🛡️  Starting Guardian tests for ${options.url}`);
  console.log(`   Environment: ${options.environment || 'development'}`);
  console.log(`   Test Run ID: ${testRunId}`);
  
  // Run tests
  const accessibilityResults = await runAccessibilityTests(options.url);
  const performanceResults = await runPerformanceTests(options.url);
  const securityResults = await runSecurityTests(options.url);
  
  // Capture screenshots
  const screenshots: string[] = [];
  if (options.screenshots) {
    console.log('📸 Capturing screenshots...');
    screenshots.push(await captureScreenshot(options.url, 'desktop'));
    screenshots.push(await captureScreenshot(options.url, 'mobile'));
  }
  
  // Build test result
  const result: GuardianTestResult = {
    projectId: process.env.ODAVL_PROJECT_ID || 'unknown',
    organizationId: process.env.ODAVL_ORGANIZATION_ID || 'unknown',
    testRunId,
    timestamp: new Date().toISOString(),
    url: options.url,
    environment: options.environment || 'development',
    tests: {
      accessibility: accessibilityResults,
      performance: performanceResults,
      security: securityResults,
    },
    screenshots,
    passed: accessibilityResults.violations === 0 && securityResults.vulnerabilities === 0,
    totalTests: 15,
    failedTests: accessibilityResults.violations + securityResults.vulnerabilities,
  };
  
  // Save results locally
  const resultPath = `.odavl/guardian/test-${testRunId}.json`;
  await fs.writeFile(resultPath, JSON.stringify(result, null, 2));
  console.log(`✅ Tests complete. Results saved to ${resultPath}`);
  
  // Sync to cloud if enabled
  if (options.cloud) {
    console.log('☁️  Syncing results to cloud...');
    
    try {
      // Upload test results
      const syncJob = await cloudSyncService.uploadGuardianResults(
        result,
        resultPath
      );
      
      console.log(`✅ Results synced: ${syncJob.id}`);
      
      // Upload screenshots
      if (screenshots.length > 0) {
        console.log('📤 Uploading screenshots...');
        
        for (const screenshot of screenshots) {
          const screenshotPath = `.odavl/guardian/${screenshot}`;
          
          await cloudSyncService.uploadScreenshot(
            result.projectId,
            result.organizationId,
            testRunId,
            screenshotPath
          );
          
          console.log(`   ✅ Uploaded ${screenshot}`);
        }
      }
      
      console.log(`   View at: https://studio.odavl.com/dashboard/${result.organizationId}/sync`);
    } catch (error) {
      console.error('❌ Cloud sync failed:', error);
    }
  }
  
  // Print summary
  console.log('\n📊 Test Summary:');
  console.log(`   Accessibility Score: ${accessibilityResults.score}/100`);
  console.log(`   Load Time: ${performanceResults.loadTime}ms`);
  console.log(`   Security Issues: ${securityResults.vulnerabilities}`);
  console.log(`   Overall: ${result.passed ? '✅ PASSED' : '❌ FAILED'}`);
  
  return result;
}

// Test runners
async function runAccessibilityTests(url: string) {
  // Run axe-core tests
  return {
    score: 95,
    violations: 2,
    passes: 13,
  };
}

async function runPerformanceTests(url: string) {
  // Run Lighthouse performance tests
  return {
    loadTime: 1250,
    ttfb: 120,
    fcp: 850,
    lcp: 1100,
  };
}

async function runSecurityTests(url: string) {
  // Run security scans
  return {
    vulnerabilities: 0,
    warnings: 1,
  };
}

async function captureScreenshot(url: string, device: string): Promise<string> {
  // Capture screenshot with Puppeteer
  const filename = `screenshot-${device}-${Date.now()}.png`;
  // ... capture logic ...
  return filename;
}
```

## CLI Command Examples

### Insight with Cloud Sync

```bash
# Analyze and sync to cloud
odavl insight analyze --cloud

# With specific detectors
odavl insight analyze --detectors typescript,eslint,security --cloud

# Specify org/project
odavl insight analyze --cloud --org org_abc123 --project proj_xyz789
```

### Autopilot with Cloud Sync

```bash
# Run cycle and sync to cloud
odavl autopilot run --cloud

# With constraints
odavl autopilot run --max-files 10 --max-loc 40 --cloud

# Single phase with cloud sync
odavl autopilot observe --cloud
```

### Guardian with Cloud Sync

```bash
# Test and sync to cloud
odavl guardian test https://example.com --cloud

# With screenshots
odavl guardian test https://example.com --cloud --screenshots

# Production environment
odavl guardian test https://example.com --environment production --cloud
```

## Progress Tracking

```typescript
// Monitor sync progress
import { cloudSyncService } from '@odavl-studio/core/services/cloud-sync';

async function monitorSync(jobId: string) {
  const interval = setInterval(async () => {
    const job = cloudSyncService.getSyncJob(jobId);
    
    if (!job) {
      clearInterval(interval);
      return;
    }
    
    console.log(`Progress: ${job.uploadProgress}% - Status: ${job.status}`);
    
    if (job.status === 'COMPLETED' || job.status === 'FAILED') {
      clearInterval(interval);
      
      if (job.status === 'COMPLETED') {
        console.log(`✅ Upload complete: ${job.cloudUrl}`);
      } else {
        console.error(`❌ Upload failed: ${job.error}`);
      }
    }
  }, 1000);
}
```

## Error Handling

```typescript
// Retry failed uploads
import { cloudSyncService } from '@odavl-studio/core/services/cloud-sync';

async function retryFailedUploads() {
  const stats = cloudSyncService.getSyncStats();
  
  console.log(`Found ${stats.failed} failed uploads`);
  
  // Get failed jobs
  const failedJobs = stats.byType; // TODO: Get actual failed jobs
  
  for (const jobId of Object.keys(failedJobs)) {
    try {
      const job = await cloudSyncService.retryJob(jobId);
      console.log(`✅ Retrying job ${jobId}`);
    } catch (error) {
      console.error(`❌ Failed to retry ${jobId}:`, error);
    }
  }
}
```

## Best Practices

1. **Environment Variables**: Always set `ODAVL_API_KEY`, `ODAVL_ORGANIZATION_ID`, and `ODAVL_PROJECT_ID`

2. **Error Handling**: Wrap cloud sync in try-catch blocks

3. **Offline Mode**: Make cloud sync optional with `--cloud` flag

4. **Progress Feedback**: Show upload progress for better UX

5. **Retry Logic**: Implement retry mechanism for failed uploads

6. **Cleanup**: Clear old completed jobs periodically

## Troubleshooting

### Issue: "Unauthorized" error

```bash
# Check API key
echo $ODAVL_API_KEY

# Regenerate key at https://studio.odavl.com/settings/api-keys
```

### Issue: Upload timeout

```bash
# Increase timeout in cloud-sync.ts
# Or split large files into smaller chunks
```

### Issue: Missing organization/project ID

```bash
# Set in .env
ODAVL_ORGANIZATION_ID=your-org-id
ODAVL_PROJECT_ID=your-project-id

# Or pass as CLI flags
--org org_abc123 --project proj_xyz789
```
