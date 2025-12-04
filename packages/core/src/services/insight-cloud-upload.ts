/**
 * Insight Cloud Upload Integration
 * Upload analysis results to ODAVL Cloud
 */

import { cloudUploadService } from '../../../packages/core/src/services/cli-cloud-upload';
import { promises as fs } from 'fs';
import { join } from 'path';

export interface InsightUploadOptions {
  projectId?: string;
  projectName?: string;
  autoUpload?: boolean;
  silent?: boolean;
}

/**
 * Upload Insight analysis results to cloud
 */
export async function uploadInsightResults(
  workspacePath: string,
  options: InsightUploadOptions = {}
): Promise<void> {
  const { projectId, projectName, autoUpload = true, silent = false } = options;
  
  if (!autoUpload) {
    return;
  }
  
  if (!silent) {
    console.log('\n📤 Uploading analysis results to ODAVL Cloud...');
  }
  
  try {
    // Find results files
    const odavlDir = join(workspacePath, '.odavl');
    const problemsFile = join(odavlDir, 'problems-panel-export.json');
    
    // Check if file exists
    try {
      await fs.access(problemsFile);
    } catch {
      if (!silent) {
        console.log('ℹ️  No analysis results found to upload');
      }
      return;
    }
    
    // Read results
    const resultsData = await fs.readFile(problemsFile, 'utf8');
    const results = JSON.parse(resultsData);
    
    // Prepare metadata
    const metadata = {
      projectId,
      projectName: projectName || 'Unknown Project',
      timestamp: new Date().toISOString(),
      workspace: workspacePath,
      diagnosticsCount: Object.keys(results.diagnostics || {}).length,
    };
    
    // Upload to cloud
    const result = await cloudUploadService.upload(
      'insight',
      'analysis-results',
      problemsFile,
      metadata,
      {
        compress: true,
        retry: true,
      }
    );
    
    if (result.success) {
      if (!silent) {
        console.log('✅ Analysis results uploaded successfully!');
        console.log(`📊 View results: ${result.url}`);
      }
    } else {
      if (!silent) {
        console.log(`⚠️  ${result.error}`);
      }
    }
  } catch (error) {
    if (!silent) {
      console.error('❌ Failed to upload results:', error);
    }
  }
}

/**
 * Upload detector-specific results
 */
export async function uploadDetectorResults(
  workspacePath: string,
  detectorName: string,
  resultsPath: string,
  options: InsightUploadOptions = {}
): Promise<void> {
  const { projectId, projectName, silent = false } = options;
  
  if (!silent) {
    console.log(`\n📤 Uploading ${detectorName} results...`);
  }
  
  try {
    // Read results
    const resultsData = await fs.readFile(resultsPath, 'utf8');
    const results = JSON.parse(resultsData);
    
    // Prepare metadata
    const metadata = {
      projectId,
      projectName: projectName || 'Unknown Project',
      detector: detectorName,
      timestamp: new Date().toISOString(),
      workspace: workspacePath,
      issuesCount: results.issues?.length || 0,
    };
    
    // Upload to cloud
    const result = await cloudUploadService.upload(
      'insight',
      `detector-${detectorName}`,
      resultsPath,
      metadata,
      {
        compress: true,
        retry: true,
      }
    );
    
    if (result.success) {
      if (!silent) {
        console.log(`✅ ${detectorName} results uploaded!`);
      }
    } else {
      if (!silent) {
        console.log(`⚠️  ${result.error}`);
      }
    }
  } catch (error) {
    if (!silent) {
      console.error(`❌ Failed to upload ${detectorName} results:`, error);
    }
  }
}

/**
 * Upload ML training data
 */
export async function uploadMLTrainingData(
  datasetPath: string,
  options: InsightUploadOptions = {}
): Promise<void> {
  const { silent = false } = options;
  
  if (!silent) {
    console.log('\n📤 Uploading ML training data...');
  }
  
  try {
    const metadata = {
      type: 'ml-training-data',
      timestamp: new Date().toISOString(),
    };
    
    // Upload to cloud
    const result = await cloudUploadService.upload(
      'insight',
      'ml-training',
      datasetPath,
      metadata,
      {
        compress: true,
        retry: true,
      }
    );
    
    if (result.success) {
      if (!silent) {
        console.log('✅ Training data uploaded successfully!');
      }
    } else {
      if (!silent) {
        console.log(`⚠️  ${result.error}`);
      }
    }
  } catch (error) {
    if (!silent) {
      console.error('❌ Failed to upload training data:', error);
    }
  }
}

/**
 * Auto-upload hook for Insight CLI
 */
export async function insightAutoUploadHook(
  workspacePath: string,
  options: InsightUploadOptions = {}
): Promise<void> {
  // Upload main results
  await uploadInsightResults(workspacePath, options);
  
  // Upload additional files if they exist
  const odavlDir = join(workspacePath, '.odavl');
  
  // Upload error signatures
  const signaturesFile = join(odavlDir, 'error-signatures.json');
  try {
    await fs.access(signaturesFile);
    await cloudUploadService.upload(
      'insight',
      'error-signatures',
      signaturesFile,
      {
        projectId: options.projectId,
        timestamp: new Date().toISOString(),
      },
      { compress: true, retry: true }
    );
  } catch {
    // File doesn't exist, skip
  }
}
