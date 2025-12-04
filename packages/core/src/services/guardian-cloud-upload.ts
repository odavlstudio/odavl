/**
 * Guardian Cloud Upload Integration
 * Upload test results, screenshots, and reports to ODAVL Cloud
 */

import { cloudUploadService } from '../../../packages/core/src/services/cli-cloud-upload';
import { promises as fs } from 'fs';
import { join } from 'path';

export interface GuardianUploadOptions {
  projectId?: string;
  projectName?: string;
  autoUpload?: boolean;
  silent?: boolean;
}

/**
 * Upload Guardian test results to cloud
 */
export async function uploadGuardianResults(
  workspacePath: string,
  testRunId: string,
  options: GuardianUploadOptions = {}
): Promise<void> {
  const { projectId, projectName, autoUpload = true, silent = false } = options;
  
  if (!autoUpload) {
    return;
  }
  
  if (!silent) {
    console.log('\n📤 Uploading Guardian test results to ODAVL Cloud...');
  }
  
  try {
    const resultsPath = join(workspacePath, '.odavl', 'guardian', `test-${testRunId}.json`);
    
    // Check if results exist
    try {
      await fs.access(resultsPath);
    } catch {
      if (!silent) {
        console.log('ℹ️  No test results found to upload');
      }
      return;
    }
    
    // Read results
    const resultsData = await fs.readFile(resultsPath, 'utf8');
    const results = JSON.parse(resultsData);
    
    // Prepare metadata
    const metadata = {
      projectId,
      projectName: projectName || 'Unknown Project',
      testRunId,
      timestamp: results.timestamp || new Date().toISOString(),
      workspace: workspacePath,
      url: results.url,
      environment: results.environment || 'production',
      testsCount: results.tests?.length || 0,
      passed: results.summary?.passed || 0,
      failed: results.summary?.failed || 0,
    };
    
    // Upload to cloud
    const result = await cloudUploadService.upload(
      'guardian',
      'test-results',
      resultsPath,
      metadata,
      {
        compress: true,
        retry: true,
      }
    );
    
    if (result.success) {
      if (!silent) {
        console.log('✅ Test results uploaded successfully!');
        console.log(`📊 View results: ${result.url}`);
      }
    } else {
      if (!silent) {
        console.log(`⚠️  ${result.error}`);
      }
    }
  } catch (error) {
    if (!silent) {
      console.error('❌ Failed to upload test results:', error);
    }
  }
}

/**
 * Upload screenshots to cloud
 */
export async function uploadScreenshots(
  workspacePath: string,
  testRunId: string,
  screenshotPaths: string[],
  options: GuardianUploadOptions = {}
): Promise<void> {
  const { projectId, silent = false } = options;
  
  if (screenshotPaths.length === 0) {
    return;
  }
  
  if (!silent) {
    console.log(`\n📤 Uploading ${screenshotPaths.length} screenshots...`);
  }
  
  try {
    for (const screenshotPath of screenshotPaths) {
      // Check if file exists
      try {
        await fs.access(screenshotPath);
      } catch {
        continue;
      }
      
      const metadata = {
        projectId,
        testRunId,
        timestamp: new Date().toISOString(),
        fileName: screenshotPath.split('/').pop(),
      };
      
      // Upload screenshot
      const result = await cloudUploadService.upload(
        'guardian',
        'screenshot',
        screenshotPath,
        metadata,
        {
          compress: false, // Images don't compress well
          retry: true,
        }
      );
      
      if (result.success && !silent) {
        console.log(`✅ Uploaded: ${metadata.fileName}`);
      }
    }
    
    if (!silent) {
      console.log('✅ All screenshots uploaded!');
    }
  } catch (error) {
    if (!silent) {
      console.error('❌ Failed to upload screenshots:', error);
    }
  }
}

/**
 * Upload Lighthouse report
 */
export async function uploadLighthouseReport(
  workspacePath: string,
  testRunId: string,
  reportPath: string,
  options: GuardianUploadOptions = {}
): Promise<void> {
  const { projectId, silent = false } = options;
  
  if (!silent) {
    console.log('\n📤 Uploading Lighthouse report...');
  }
  
  try {
    // Check if report exists
    try {
      await fs.access(reportPath);
    } catch {
      if (!silent) {
        console.log('ℹ️  No Lighthouse report found');
      }
      return;
    }
    
    const metadata = {
      projectId,
      testRunId,
      timestamp: new Date().toISOString(),
      type: 'lighthouse',
    };
    
    // Upload report
    const result = await cloudUploadService.upload(
      'guardian',
      'lighthouse-report',
      reportPath,
      metadata,
      {
        compress: true,
        retry: true,
      }
    );
    
    if (result.success) {
      if (!silent) {
        console.log('✅ Lighthouse report uploaded!');
      }
    } else {
      if (!silent) {
        console.log(`⚠️  ${result.error}`);
      }
    }
  } catch (error) {
    if (!silent) {
      console.error('❌ Failed to upload Lighthouse report:', error);
    }
  }
}

/**
 * Upload accessibility report
 */
export async function uploadAccessibilityReport(
  workspacePath: string,
  testRunId: string,
  reportPath: string,
  options: GuardianUploadOptions = {}
): Promise<void> {
  const { projectId, silent = false } = options;
  
  if (!silent) {
    console.log('\n📤 Uploading accessibility report...');
  }
  
  try {
    // Check if report exists
    try {
      await fs.access(reportPath);
    } catch {
      if (!silent) {
        console.log('ℹ️  No accessibility report found');
      }
      return;
    }
    
    const metadata = {
      projectId,
      testRunId,
      timestamp: new Date().toISOString(),
      type: 'accessibility',
    };
    
    // Upload report
    const result = await cloudUploadService.upload(
      'guardian',
      'accessibility-report',
      reportPath,
      metadata,
      {
        compress: true,
        retry: true,
      }
    );
    
    if (result.success) {
      if (!silent) {
        console.log('✅ Accessibility report uploaded!');
      }
    } else {
      if (!silent) {
        console.log(`⚠️  ${result.error}`);
      }
    }
  } catch (error) {
    if (!silent) {
      console.error('❌ Failed to upload accessibility report:', error);
    }
  }
}

/**
 * Auto-upload hook for Guardian CLI
 */
export async function guardianAutoUploadHook(
  workspacePath: string,
  testRunId: string,
  options: GuardianUploadOptions = {}
): Promise<void> {
  // Upload test results
  await uploadGuardianResults(workspacePath, testRunId, options);
  
  // Upload screenshots if they exist
  const screenshotsDir = join(workspacePath, '.odavl', 'guardian', 'screenshots', testRunId);
  try {
    const files = await fs.readdir(screenshotsDir);
    const screenshotPaths = files
      .filter(f => f.endsWith('.png') || f.endsWith('.jpg'))
      .map(f => join(screenshotsDir, f));
    
    if (screenshotPaths.length > 0) {
      await uploadScreenshots(workspacePath, testRunId, screenshotPaths, { ...options, silent: true });
    }
  } catch {
    // Directory doesn't exist, skip
  }
  
  // Upload Lighthouse report if exists
  const lighthouseReport = join(workspacePath, '.odavl', 'guardian', `lighthouse-${testRunId}.json`);
  await uploadLighthouseReport(workspacePath, testRunId, lighthouseReport, { ...options, silent: true });
  
  // Upload accessibility report if exists
  const a11yReport = join(workspacePath, '.odavl', 'guardian', `accessibility-${testRunId}.json`);
  await uploadAccessibilityReport(workspacePath, testRunId, a11yReport, { ...options, silent: true });
}
