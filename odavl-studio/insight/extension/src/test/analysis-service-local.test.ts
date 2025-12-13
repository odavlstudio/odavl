/**
 * AnalysisService Tests - LOCAL Mode
 * 
 * Unit tests for AnalysisService local analysis pipeline:
 * - Triggers analysis with mocked detector results
 * - Processes issues correctly
 * - Maps severity to VS Code DiagnosticSeverity
 * - Creates diagnostics with correct URIs
 * - Clears diagnostics on request
 * - Handles errors gracefully
 * 
 * Phase 3: Test Analysis & Diagnostics Pipeline - Step 1
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { 
  MockExtensionContext, 
  MockOutputChannel, 
  MockDiagnosticCollection,
} from './vscode-mock';
import type { LocalIssue, UnifiedIssue, AnalysisOptions } from '../services/analysis-service';

/**
 * Mock detector results - defined at top level for vi.mock factory
 */
const mockLocalIssues: LocalIssue[] = [
  {
    filePath: '/mock/workspace/src/index.ts',
    line: 10,
    column: 5,
    severity: 'critical',
    message: 'Hardcoded API key detected',
    detector: 'security',
    ruleId: 'no-hardcoded-secrets',
    category: 'security',
    code: 'SEC001',
    suggestion: 'Use environment variables',
    autoFixable: false,
  },
  {
    filePath: '/mock/workspace/src/utils.ts',
    line: 25,
    column: 12,
    severity: 'high',
    message: 'Unused import statement',
    detector: 'typescript',
    ruleId: 'no-unused-imports',
    category: 'code-quality',
    autoFixable: true,
  },
  {
    filePath: '/mock/workspace/src/app.ts',
    line: 42,
    column: 0,
    severity: 'medium',
    message: 'Function complexity exceeds threshold',
    detector: 'complexity',
    ruleId: 'max-complexity',
    category: 'maintainability',
    code: 'COMP010',
    suggestion: 'Break down into smaller functions',
    autoFixable: false,
  },
  {
    filePath: '/mock/workspace/src/config.ts',
    line: 5,
    column: 2,
    severity: 'low',
    message: 'Consider using const instead of let',
    detector: 'eslint',
    ruleId: 'prefer-const',
    category: 'best-practices',
    autoFixable: true,
  },
  {
    filePath: '/mock/workspace/src/types.ts',
    line: 15,
    column: 0,
    severity: 'info',
    message: 'Missing JSDoc comment',
    detector: 'typescript',
    ruleId: 'require-jsdoc',
    category: 'documentation',
    autoFixable: false,
  },
];

/**
 * Mock insight-core detector
 */
vi.mock('@odavl-studio/insight-core/detector', () => ({
  analyzeWorkspace: vi.fn(async () => ({
    issues: mockLocalIssues,
    summary: {
      total: mockLocalIssues.length,
      critical: 1,
      high: 1,
      medium: 1,
      low: 1,
      info: 1,
    },
  })),
}));

/**
 * Mock VS Code API for tests
 */
const mockVscode = {
  languages: {
    createDiagnosticCollection: vi.fn(() => new MockDiagnosticCollection()),
  },
  window: {
    createOutputChannel: vi.fn(() => new MockOutputChannel()),
    withProgress: vi.fn((options, task) => task({ report: vi.fn() })),
    showWarningMessage: vi.fn(),
    showInformationMessage: vi.fn(),
  },
  workspace: {
    workspaceFolders: [{ uri: { fsPath: '/mock/workspace' }, name: 'workspace', index: 0 }],
  },
  Uri: {
    file: (path: string) => ({ fsPath: path, toString: () => path }),
    parse: (uri: string) => ({ toString: () => uri }),
  },
  Range: class Range {
    constructor(public start: any, public end: any) {}
  },
  Position: class Position {
    constructor(public line: number, public character: number) {}
  },
  Diagnostic: class Diagnostic {
    constructor(
      public range: any,
      public message: string,
      public severity: number
    ) {}
    source?: string;
    code?: string;
  },
  DiagnosticSeverity: {
    Error: 0,
    Warning: 1,
    Information: 2,
    Hint: 3,
  },
  ProgressLocation: {
    Notification: 15,
  },
  EventEmitter: class EventEmitter<T> {
    private listeners: Array<(data: T) => void> = [];
    event = (listener: (data: T) => void) => {
      this.listeners.push(listener);
      return { dispose: () => {} };
    };
    fire(data: T) {
      this.listeners.forEach(l => l(data));
    }
    dispose() {
      this.listeners = [];
    }
  },
  env: {
    openExternal: vi.fn(),
  },
  commands: {
    executeCommand: vi.fn(),
  },
};

// Mock vscode module
vi.mock('vscode', () => mockVscode);

/**
 * Mock CloudClient
 */
class MockCloudClient {
  startAnalysis = vi.fn();
  pollAnalysis = vi.fn();
  getProjects = vi.fn();
}

/**
 * Mock AuthState
 */
const mockAuthState = {
  isAuthenticated: false,
  planId: 'INSIGHT_FREE' as const,
};

describe('AnalysisService - LOCAL Mode', () => {
  let mockContext: MockExtensionContext;
  let mockCloudClient: MockCloudClient;
  let mockDiagnosticCollection: MockDiagnosticCollection;
  let mockOutputChannel: MockOutputChannel;
  let AnalysisService: any; // Dynamic import after mocks are set
  let mockAnalyzeWorkspace: any; // Get reference to mocked function

  beforeEach(async () => {
    // Reset all mocks
    vi.clearAllMocks();
    
    // Create fresh instances
    mockContext = new MockExtensionContext();
    mockCloudClient = new MockCloudClient();
    mockDiagnosticCollection = new MockDiagnosticCollection();
    mockOutputChannel = new MockOutputChannel();
    
    // Setup vscode mocks
    mockVscode.languages.createDiagnosticCollection.mockReturnValue(mockDiagnosticCollection);
    mockVscode.window.createOutputChannel.mockReturnValue(mockOutputChannel);
    
    // Reset workspace folders
    mockVscode.workspace.workspaceFolders = [
      { uri: { fsPath: '/mock/workspace' }, name: 'workspace', index: 0 }
    ];
    
    // Get reference to mocked analyzeWorkspace
    const insightCore = await import('@odavl-studio/insight-core/detector');
    mockAnalyzeWorkspace = insightCore.analyzeWorkspace as any;
    
    // Reset detector mock
    mockAnalyzeWorkspace.mockResolvedValue({
      issues: mockLocalIssues,
      summary: { total: mockLocalIssues.length },
    });
    
    // Dynamically import AnalysisService after mocks are setup
    const module = await import('../services/analysis-service');
    AnalysisService = module.AnalysisService;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Service Initialization', () => {
    it('should create AnalysisService without errors', () => {
      const service = new AnalysisService(
        mockContext as any,
        mockCloudClient as any,
        mockAuthState
      );

      expect(service).toBeDefined();
      expect(mockVscode.languages.createDiagnosticCollection).toHaveBeenCalledWith('odavl-insight');
      expect(mockVscode.window.createOutputChannel).toHaveBeenCalledWith('ODAVL Insight');
    });

    it('should register diagnostics collection in context', () => {
      const service = new AnalysisService(
        mockContext as any,
        mockCloudClient as any,
        mockAuthState
      );

      expect(mockContext.subscriptions.length).toBeGreaterThan(0);
    });

    it('should start in idle state', () => {
      const service = new AnalysisService(
        mockContext as any,
        mockCloudClient as any,
        mockAuthState
      );

      const state = service.getAnalysisState();
      expect(state.state).toBe('idle');
      expect(state.pendingRunRequested).toBe(false);
    });
  });

  describe('Local Analysis Execution', () => {
    it('should trigger local analysis successfully', async () => {
      const service = new AnalysisService(
        mockContext as any,
        mockCloudClient as any,
        mockAuthState
      );

      const issues = await service.runFullAnalysis({ mode: 'local' });

      expect(mockAnalyzeWorkspace).toHaveBeenCalledWith(
        '/mock/workspace',
        expect.objectContaining({
          detectors: expect.arrayContaining(['typescript', 'security']),
        })
      );
      expect(issues).toHaveLength(mockLocalIssues.length);
    });

    it('should map local issues to unified format', async () => {
      const service = new AnalysisService(
        mockContext as any,
        mockCloudClient as any,
        mockAuthState
      );

      const issues = await service.runFullAnalysis({ mode: 'local' });

      expect(issues[0]).toMatchObject({
        filePath: '/mock/workspace/src/index.ts',
        line: 10,
        column: 5,
        severity: 'CRITICAL',
        message: 'Hardcoded API key detected',
        detector: 'security',
        ruleId: 'no-hardcoded-secrets',
        source: 'local',
      });
    });

    it('should respect custom detector selection', async () => {
      const service = new AnalysisService(
        mockContext as any,
        mockCloudClient as any,
        mockAuthState
      );

      await service.runFullAnalysis({
        mode: 'local',
        detectors: ['typescript', 'security'],
      });

      expect(mockAnalyzeWorkspace).toHaveBeenCalledWith(
        '/mock/workspace',
        expect.objectContaining({
          detectors: ['typescript', 'security'],
        })
      );
    });

    it('should handle single-file analysis', async () => {
      const service = new AnalysisService(
        mockContext as any,
        mockCloudClient as any,
        mockAuthState
      );

      await service.runFullAnalysis({
        mode: 'local',
        filePath: '/mock/workspace/src/index.ts',
      });

      expect(mockAnalyzeWorkspace).toHaveBeenCalled();
    });

    it('should log analysis progress to output channel', async () => {
      const service = new AnalysisService(
        mockContext as any,
        mockCloudClient as any,
        mockAuthState
      );

      await service.runFullAnalysis({ mode: 'local' });

      const logs = mockOutputChannel.getLines();
      expect(logs.some(line => line.includes('Starting analysis'))).toBe(true);
      expect(logs.some(line => line.includes('Found'))).toBe(true);
      expect(logs.some(line => line.includes('issues'))).toBe(true);
    });
  });

  describe('Diagnostics Creation', () => {
    it('should create diagnostics for all issues', async () => {
      const service = new AnalysisService(
        mockContext as any,
        mockCloudClient as any,
        mockAuthState
      );

      await service.runFullAnalysis({ mode: 'local' });

      const allDiagnostics = mockDiagnosticCollection.getAllDiagnostics();
      expect(allDiagnostics.size).toBeGreaterThan(0);
    });

    it('should map severity correctly - CRITICAL → Error', async () => {
      const service = new AnalysisService(
        mockContext as any,
        mockCloudClient as any,
        mockAuthState
      );

      await service.runFullAnalysis({ mode: 'local' });

      const diagnostics = mockDiagnosticCollection.get('/mock/workspace/src/index.ts');
      expect(diagnostics).toBeDefined();
      expect(diagnostics![0].severity).toBe(mockVscode.DiagnosticSeverity.Error);
    });

    it('should map severity correctly - HIGH → Error', async () => {
      const service = new AnalysisService(
        mockContext as any,
        mockCloudClient as any,
        mockAuthState
      );

      await service.runFullAnalysis({ mode: 'local' });

      const diagnostics = mockDiagnosticCollection.get('/mock/workspace/src/utils.ts');
      expect(diagnostics).toBeDefined();
      expect(diagnostics![0].severity).toBe(mockVscode.DiagnosticSeverity.Error);
    });

    it('should map severity correctly - MEDIUM → Warning', async () => {
      const service = new AnalysisService(
        mockContext as any,
        mockCloudClient as any,
        mockAuthState
      );

      await service.runFullAnalysis({ mode: 'local' });

      const diagnostics = mockDiagnosticCollection.get('/mock/workspace/src/app.ts');
      expect(diagnostics).toBeDefined();
      expect(diagnostics![0].severity).toBe(mockVscode.DiagnosticSeverity.Warning);
    });

    it('should map severity correctly - LOW → Information', async () => {
      const service = new AnalysisService(
        mockContext as any,
        mockCloudClient as any,
        mockAuthState
      );

      await service.runFullAnalysis({ mode: 'local' });

      const diagnostics = mockDiagnosticCollection.get('/mock/workspace/src/config.ts');
      expect(diagnostics).toBeDefined();
      expect(diagnostics![0].severity).toBe(mockVscode.DiagnosticSeverity.Information);
    });

    it('should map severity correctly - INFO → Hint', async () => {
      const service = new AnalysisService(
        mockContext as any,
        mockCloudClient as any,
        mockAuthState
      );

      await service.runFullAnalysis({ mode: 'local' });

      const diagnostics = mockDiagnosticCollection.get('/mock/workspace/src/types.ts');
      expect(diagnostics).toBeDefined();
      expect(diagnostics![0].severity).toBe(mockVscode.DiagnosticSeverity.Hint);
    });

    it('should include detector source in diagnostics', async () => {
      const service = new AnalysisService(
        mockContext as any,
        mockCloudClient as any,
        mockAuthState
      );

      await service.runFullAnalysis({ mode: 'local' });

      const diagnostics = mockDiagnosticCollection.get('/mock/workspace/src/index.ts');
      expect(diagnostics![0].source).toBe('ODAVL/security');
    });

    it('should include rule ID in diagnostics code', async () => {
      const service = new AnalysisService(
        mockContext as any,
        mockCloudClient as any,
        mockAuthState
      );

      await service.runFullAnalysis({ mode: 'local' });

      const diagnostics = mockDiagnosticCollection.get('/mock/workspace/src/index.ts');
      expect(diagnostics![0].code).toBe('no-hardcoded-secrets');
    });

    it('should create correct range for diagnostics', async () => {
      const service = new AnalysisService(
        mockContext as any,
        mockCloudClient as any,
        mockAuthState
      );

      await service.runFullAnalysis({ mode: 'local' });

      const diagnostics = mockDiagnosticCollection.get('/mock/workspace/src/index.ts');
      const diagnostic = diagnostics![0];
      
      // Line 10 in issue → Position line 9 (0-indexed)
      expect(diagnostic.range.start.line).toBe(9);
      expect(diagnostic.range.start.character).toBe(5);
    });

    it('should group diagnostics by file URI', async () => {
      const service = new AnalysisService(
        mockContext as any,
        mockCloudClient as any,
        mockAuthState
      );

      await service.runFullAnalysis({ mode: 'local' });

      const allDiagnostics = mockDiagnosticCollection.getAllDiagnostics();
      
      // Should have diagnostics for 5 different files
      expect(allDiagnostics.size).toBe(5);
    });
  });

  describe('Clear Diagnostics', () => {
    it('should clear all diagnostics', async () => {
      const service = new AnalysisService(
        mockContext as any,
        mockCloudClient as any,
        mockAuthState
      );

      // Create diagnostics
      await service.runFullAnalysis({ mode: 'local' });
      let allDiagnostics = mockDiagnosticCollection.getAllDiagnostics();
      expect(allDiagnostics.size).toBeGreaterThan(0);

      // Clear
      service.clearDiagnostics();
      allDiagnostics = mockDiagnosticCollection.getAllDiagnostics();
      expect(allDiagnostics.size).toBe(0);
    });

    it('should not throw when clearing empty diagnostics', () => {
      const service = new AnalysisService(
        mockContext as any,
        mockCloudClient as any,
        mockAuthState
      );

      expect(() => service.clearDiagnostics()).not.toThrow();
    });
  });

  describe('Error Handling', () => {
    it('should handle detector errors gracefully', async () => {
      mockAnalyzeWorkspace.mockRejectedValue(new Error('Detector crashed'));

      const service = new AnalysisService(
        mockContext as any,
        mockCloudClient as any,
        mockAuthState
      );

      const issues = await service.runFullAnalysis({ mode: 'local' });

      expect(issues).toEqual([]);
      const logs = mockOutputChannel.getLines();
      expect(logs.some(line => line.includes('Starting analysis'))).toBe(true);
    });

    it('should handle missing workspace gracefully', async () => {
      mockVscode.workspace.workspaceFolders = undefined;

      const service = new AnalysisService(
        mockContext as any,
        mockCloudClient as any,
        mockAuthState
      );

      const issues = await service.runFullAnalysis({ mode: 'local' });

      expect(issues).toEqual([]);
    });

    it('should not create diagnostics on error', async () => {
      mockAnalyzeWorkspace.mockRejectedValue(new Error('Detector crashed'));

      const service = new AnalysisService(
        mockContext as any,
        mockCloudClient as any,
        mockAuthState
      );

      await service.runFullAnalysis({ mode: 'local' });

      const allDiagnostics = mockDiagnosticCollection.getAllDiagnostics();
      expect(allDiagnostics.size).toBe(0);
    });
  });

  describe('State Machine (Race Condition Prevention)', () => {
    it('should prevent concurrent analyses', async () => {
      const service = new AnalysisService(
        mockContext as any,
        mockCloudClient as any,
        mockAuthState
      );

      // Start first analysis (does not await)
      const promise1 = service.runFullAnalysis({ mode: 'local' });
      
      // Check state is running
      let state = service.getAnalysisState();
      expect(state.state).toBe('running');

      // Try to start second analysis immediately
      const promise2 = service.runFullAnalysis({ mode: 'local' });
      
      // Second call should mark pending
      state = service.getAnalysisState();
      expect(state.pendingRunRequested).toBe(true);

      // Wait for completion
      await promise1;
      await promise2;

      // Should call detector twice (initial + follow-up)
      expect(mockAnalyzeWorkspace).toHaveBeenCalledTimes(2);
    });

    it('should return to idle state after analysis', async () => {
      const service = new AnalysisService(
        mockContext as any,
        mockCloudClient as any,
        mockAuthState
      );

      await service.runFullAnalysis({ mode: 'local' });

      const state = service.getAnalysisState();
      expect(state.state).toBe('idle');
      expect(state.pendingRunRequested).toBe(false);
    });

    it('should support isRunning() check', async () => {
      const service = new AnalysisService(
        mockContext as any,
        mockCloudClient as any,
        mockAuthState
      );

      expect(service.isRunning()).toBe(false);

      const promise = service.runFullAnalysis({ mode: 'local' });
      expect(service.isRunning()).toBe(true);

      await promise;
      expect(service.isRunning()).toBe(false);
    });

    it('should handle auth state changes during analysis', async () => {
      const service = new AnalysisService(
        mockContext as any,
        mockCloudClient as any,
        mockAuthState
      );

      // Start analysis
      const promise = service.runFullAnalysis({ mode: 'local' });

      // Change auth state while running
      service.updateAuthState({ isAuthenticated: true, planId: 'INSIGHT_PRO' });

      await promise;

      // Should mark pending run due to auth change
      const logs = mockOutputChannel.getLines();
      expect(logs.some(line => line.includes('Auth Change'))).toBe(true);
    });
  });

  describe('Event Emitter', () => {
    it('should fire onAnalysisComplete event with issues', async () => {
      const service = new AnalysisService(
        mockContext as any,
        mockCloudClient as any,
        mockAuthState
      );

      let capturedIssues: UnifiedIssue[] = [];
      service.onAnalysisComplete((issues) => {
        capturedIssues = issues;
      });

      await service.runFullAnalysis({ mode: 'local' });

      expect(capturedIssues).toHaveLength(mockLocalIssues.length);
      expect(capturedIssues[0].detector).toBe('security');
    });

    it('should fire event even with zero issues', async () => {
      mockAnalyzeWorkspace.mockResolvedValue({ issues: [], summary: { total: 0 } });

      const service = new AnalysisService(
        mockContext as any,
        mockCloudClient as any,
        mockAuthState
      );

      let eventFired = false;
      service.onAnalysisComplete(() => {
        eventFired = true;
      });

      await service.runFullAnalysis({ mode: 'local' });

      expect(eventFired).toBe(true);
    });
  });

  describe('Disposal', () => {
    it('should dispose all resources', () => {
      const service = new AnalysisService(
        mockContext as any,
        mockCloudClient as any,
        mockAuthState
      );

      expect(() => service.dispose()).not.toThrow();
    });

    it('should dispose diagnostics collection', () => {
      const disposeSpy = vi.spyOn(mockDiagnosticCollection, 'dispose');
      
      const service = new AnalysisService(
        mockContext as any,
        mockCloudClient as any,
        mockAuthState
      );

      service.dispose();

      expect(disposeSpy).toHaveBeenCalled();
    });

    it('should dispose output channel', () => {
      const disposeSpy = vi.spyOn(mockOutputChannel, 'dispose');
      
      const service = new AnalysisService(
        mockContext as any,
        mockCloudClient as any,
        mockAuthState
      );

      service.dispose();

      expect(disposeSpy).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle issues with missing columns', async () => {
      const issueWithoutColumn: LocalIssue = {
        filePath: '/mock/workspace/test.ts',
        line: 1,
        severity: 'high',
        message: 'Test issue',
        detector: 'test',
      };

      mockAnalyzeWorkspace.mockResolvedValue({
        issues: [issueWithoutColumn],
        summary: { total: 1 },
      });

      const service = new AnalysisService(
        mockContext as any,
        mockCloudClient as any,
        mockAuthState
      );

      const issues = await service.runFullAnalysis({ mode: 'local' });
      
      expect(issues[0].column).toBeUndefined();
      
      const diagnostics = mockDiagnosticCollection.get('/mock/workspace/test.ts');
      expect(diagnostics![0].range.start.character).toBe(0);
    });

    it('should handle line 0 correctly (convert to Position 0)', async () => {
      const issueAtLineZero: LocalIssue = {
        filePath: '/mock/workspace/test.ts',
        line: 0,
        severity: 'medium',
        message: 'Issue at line 0',
        detector: 'test',
      };

      mockAnalyzeWorkspace.mockResolvedValue({
        issues: [issueAtLineZero],
        summary: { total: 1 },
      });

      const service = new AnalysisService(
        mockContext as any,
        mockCloudClient as any,
        mockAuthState
      );

      await service.runFullAnalysis({ mode: 'local' });

      const diagnostics = mockDiagnosticCollection.get('/mock/workspace/test.ts');
      expect(diagnostics![0].range.start.line).toBe(0);
    });

    it('should handle negative line numbers (clamp to 0)', async () => {
      const issueWithNegativeLine: LocalIssue = {
        filePath: '/mock/workspace/test.ts',
        line: -5,
        severity: 'low',
        message: 'Invalid line',
        detector: 'test',
      };

      mockAnalyzeWorkspace.mockResolvedValue({
        issues: [issueWithNegativeLine],
        summary: { total: 1 },
      });

      const service = new AnalysisService(
        mockContext as any,
        mockCloudClient as any,
        mockAuthState
      );

      await service.runFullAnalysis({ mode: 'local' });

      const diagnostics = mockDiagnosticCollection.get('/mock/workspace/test.ts');
      expect(diagnostics![0].range.start.line).toBe(0);
    });

    it('should handle empty detector results', async () => {
      mockAnalyzeWorkspace.mockResolvedValue({
        issues: [],
        summary: { total: 0 },
      });

      const service = new AnalysisService(
        mockContext as any,
        mockCloudClient as any,
        mockAuthState
      );

      const issues = await service.runFullAnalysis({ mode: 'local' });

      expect(issues).toEqual([]);
      
      const allDiagnostics = mockDiagnosticCollection.getAllDiagnostics();
      expect(allDiagnostics.size).toBe(0);
    });

    it('should handle very long file paths', async () => {
      const longPath = '/mock/workspace/' + 'a'.repeat(200) + '.ts';
      
      const issueWithLongPath: LocalIssue = {
        filePath: longPath,
        line: 1,
        severity: 'info',
        message: 'Test',
        detector: 'test',
      };

      mockAnalyzeWorkspace.mockResolvedValue({
        issues: [issueWithLongPath],
        summary: { total: 1 },
      });

      const service = new AnalysisService(
        mockContext as any,
        mockCloudClient as any,
        mockAuthState
      );

      await service.runFullAnalysis({ mode: 'local' });

      const diagnostics = mockDiagnosticCollection.get(longPath);
      expect(diagnostics).toBeDefined();
      expect(diagnostics!).toHaveLength(1);
    });

    it('should handle special characters in file paths', async () => {
      const specialPath = '/mock/workspace/file with spaces & symbols!@#.ts';
      
      const issueWithSpecialPath: LocalIssue = {
        filePath: specialPath,
        line: 1,
        severity: 'medium',
        message: 'Test',
        detector: 'test',
      };

      mockAnalyzeWorkspace.mockResolvedValue({
        issues: [issueWithSpecialPath],
        summary: { total: 1 },
      });

      const service = new AnalysisService(
        mockContext as any,
        mockCloudClient as any,
        mockAuthState
      );

      await service.runFullAnalysis({ mode: 'local' });

      const diagnostics = mockDiagnosticCollection.get(specialPath);
      expect(diagnostics).toBeDefined();
    });
  });
});
