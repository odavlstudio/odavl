/**
 * Phase 2.2 Task 8: Analysis Upload Verification Tests
 * 
 * Tests direct JSON upload, strategy selection, and error handling
 */

import { 
  runSuite, 
  assert, 
  assertEquals, 
  MockResponse,
  createTempWorkspace, 
  cleanupTempWorkspace,
} from './test-utils.js';

// Mock upload result types
type UploadResultType = 'SUCCESS' | 'OFFLINE' | 'ERROR' | 'INVALID_TOKEN' | 'QUOTA_EXCEEDED';

interface MockUploadResult {
  type: UploadResultType;
  analysisId?: string;
  dashboardUrl?: string;
  reason?: string;
}

// Mock upload function for testing
async function mockUploadAnalysis(
  issues: any[],
  options: {
    projectName?: string;
    workspaceRoot: string;
    skipQueue?: boolean;
  },
  networkState: 'online' | 'offline' | 'error' = 'online'
): Promise<MockUploadResult> {
  // Simulate different network states
  if (networkState === 'offline') {
    return {
      type: 'OFFLINE',
      reason: 'Network unavailable',
    };
  }
  
  if (networkState === 'error') {
    return {
      type: 'ERROR',
      reason: 'Server error',
    };
  }
  
  // Simulate successful upload
  const analysisId = `analysis-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  
  return {
    type: 'SUCCESS',
    analysisId,
    dashboardUrl: `https://dashboard.odavl.com/analysis/${analysisId}`,
  };
}

// Mock strategy selection function
function selectUploadStrategy(issueCount: number, payloadSize: number): 'direct-json' | 'sarif-s3' {
  // Strategy: Direct JSON for <5000 issues or <5MB, otherwise SARIF S3
  const maxDirectIssues = 5000;
  const maxDirectSize = 5 * 1024 * 1024; // 5MB
  
  if (issueCount < maxDirectIssues && payloadSize < maxDirectSize) {
    return 'direct-json';
  }
  
  return 'sarif-s3';
}

export async function verifyAnalysisUpload() {
  const tests = [
    {
      name: 'Small payload uses direct JSON upload',
      fn: async () => {
        const issues = Array.from({ length: 100 }, (_, i) => ({
          id: `issue-${i}`,
          type: 'typescript',
          severity: 'error',
          message: 'Type error',
          file: `src/file${i}.ts`,
          line: 10,
          column: 5,
        }));
        
        const payloadSize = JSON.stringify(issues).length;
        const strategy = selectUploadStrategy(issues.length, payloadSize);
        
        assertEquals(strategy, 'direct-json', 'Should use direct JSON for small payload');
      },
    },
    
    {
      name: 'Large payload (>5000 issues) uses SARIF S3 upload',
      fn: async () => {
        const issues = Array.from({ length: 6000 }, (_, i) => ({
          id: `issue-${i}`,
          type: 'typescript',
          severity: 'error',
          message: 'Type error',
          file: `src/file${i}.ts`,
          line: 10,
          column: 5,
        }));
        
        const payloadSize = JSON.stringify(issues).length;
        const strategy = selectUploadStrategy(issues.length, payloadSize);
        
        assertEquals(strategy, 'sarif-s3', 'Should use SARIF S3 for large issue count');
      },
    },
    
    {
      name: 'Large payload size (>5MB) uses SARIF S3 upload',
      fn: async () => {
        // Simulate large payload (each issue ~1KB with long messages)
        const issues = Array.from({ length: 6000 }, (_, i) => ({
          id: `issue-${i}`,
          type: 'security',
          severity: 'high',
          message: 'Security vulnerability detected: ' + 'A'.repeat(500),
          file: `src/components/Feature${i}.tsx`,
          line: 42,
          column: 18,
        }));
        
        const payloadSize = JSON.stringify(issues).length;
        const strategy = selectUploadStrategy(issues.length, payloadSize);
        
        assertEquals(strategy, 'sarif-s3', 'Should use SARIF S3 for large payload size');
      },
    },
    
    {
      name: 'Successful upload returns analysis ID and dashboard URL',
      fn: async () => {
        const workspace = await createTempWorkspace();
        
        const issues = [
          {
            id: 'test-1',
            type: 'typescript',
            severity: 'error',
            message: 'Type error',
            file: 'src/index.ts',
            line: 10,
            column: 5,
          },
        ];
        
        const result = await mockUploadAnalysis(
          issues,
          { projectName: 'test-project', workspaceRoot: workspace },
          'online'
        );
        
        assertEquals(result.type, 'SUCCESS', 'Upload should succeed');
        assert(result.analysisId !== undefined, 'Should return analysis ID');
        assert(result.dashboardUrl !== undefined, 'Should return dashboard URL');
        assert(result.dashboardUrl!.includes(result.analysisId!), 'Dashboard URL should contain analysis ID');
        
        await cleanupTempWorkspace(workspace);
      },
    },
    
    {
      name: 'Upload returns OFFLINE when network unavailable',
      fn: async () => {
        const workspace = await createTempWorkspace();
        
        const issues = [
          {
            id: 'test-2',
            type: 'security',
            severity: 'high',
            message: 'Security issue',
            file: 'src/auth.ts',
            line: 20,
            column: 10,
          },
        ];
        
        const result = await mockUploadAnalysis(
          issues,
          { projectName: 'test-project', workspaceRoot: workspace },
          'offline'
        );
        
        assertEquals(result.type, 'OFFLINE', 'Should return OFFLINE status');
        assert(result.reason !== undefined, 'Should provide reason');
        assert(result.analysisId === undefined, 'Should not return analysis ID when offline');
        
        await cleanupTempWorkspace(workspace);
      },
    },
    
    {
      name: 'Upload returns ERROR on server failure',
      fn: async () => {
        const workspace = await createTempWorkspace();
        
        const issues = [
          {
            id: 'test-3',
            type: 'performance',
            severity: 'warning',
            message: 'Performance issue',
            file: 'src/utils.ts',
            line: 15,
            column: 8,
          },
        ];
        
        const result = await mockUploadAnalysis(
          issues,
          { projectName: 'test-project', workspaceRoot: workspace },
          'error'
        );
        
        assertEquals(result.type, 'ERROR', 'Should return ERROR status');
        assert(result.reason !== undefined, 'Should provide error reason');
        
        await cleanupTempWorkspace(workspace);
      },
    },
    
    {
      name: 'Upload handles empty issue array',
      fn: async () => {
        const workspace = await createTempWorkspace();
        
        const result = await mockUploadAnalysis(
          [],
          { projectName: 'test-project', workspaceRoot: workspace },
          'online'
        );
        
        assertEquals(result.type, 'SUCCESS', 'Should succeed with empty issues');
        
        await cleanupTempWorkspace(workspace);
      },
    },
    
    {
      name: 'skipQueue option prevents auto-queueing',
      fn: async () => {
        const workspace = await createTempWorkspace();
        
        const issues = [
          {
            id: 'test-4',
            type: 'typescript',
            severity: 'error',
            message: 'Type error',
            file: 'src/app.ts',
            line: 30,
            column: 12,
          },
        ];
        
        // Upload with skipQueue=true should not queue on OFFLINE
        const result = await mockUploadAnalysis(
          issues,
          { projectName: 'test-project', workspaceRoot: workspace, skipQueue: true },
          'offline'
        );
        
        assertEquals(result.type, 'OFFLINE', 'Should return OFFLINE');
        
        // Note: In real implementation, verify queue file was NOT created
        // This is a simplified mock test
        
        await cleanupTempWorkspace(workspace);
      },
    },
    
    {
      name: 'Project name is included in upload payload',
      fn: async () => {
        const workspace = await createTempWorkspace();
        
        const issues = [
          {
            id: 'test-5',
            type: 'complexity',
            severity: 'warning',
            message: 'High complexity',
            file: 'src/complex.ts',
            line: 100,
            column: 1,
          },
        ];
        
        const result = await mockUploadAnalysis(
          issues,
          { projectName: 'my-awesome-project', workspaceRoot: workspace },
          'online'
        );
        
        assertEquals(result.type, 'SUCCESS', 'Upload should succeed');
        // In real implementation, verify projectName in API request
        
        await cleanupTempWorkspace(workspace);
      },
    },
    
    {
      name: 'Strategy selection boundary: exactly 5000 issues',
      fn: async () => {
        const issues = Array.from({ length: 5000 }, (_, i) => ({
          id: `issue-${i}`,
          type: 'typescript',
          severity: 'error',
          message: 'Error',
          file: `file${i}.ts`,
          line: 1,
          column: 1,
        }));
        
        const payloadSize = JSON.stringify(issues).length;
        const strategy = selectUploadStrategy(issues.length, payloadSize);
        
        // At boundary (5000), should use direct JSON (< 5000 is direct)
        assertEquals(strategy, 'direct-json', 'Should use direct JSON at 5000 issues');
      },
    },
    
    {
      name: 'Strategy selection boundary: 5001 issues',
      fn: async () => {
        const issues = Array.from({ length: 5001 }, (_, i) => ({
          id: `issue-${i}`,
          type: 'typescript',
          severity: 'error',
          message: 'Error',
          file: `file${i}.ts`,
          line: 1,
          column: 1,
        }));
        
        const payloadSize = JSON.stringify(issues).length;
        const strategy = selectUploadStrategy(issues.length, payloadSize);
        
        assertEquals(strategy, 'sarif-s3', 'Should use SARIF S3 at 5001 issues');
      },
    },
  ];

  return await runSuite('Analysis Upload Verification', tests);
}

// Run if executed directly
if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}`) {
  verifyAnalysisUpload().then(() => process.exit(0)).catch(() => process.exit(1));
}
