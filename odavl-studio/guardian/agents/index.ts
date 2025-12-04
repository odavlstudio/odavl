/**
 * ODAVL Guardian v4.0 - AI-Powered Agents
 * 
 * Export all v4.0 agents for unified access
 */

export { RuntimeTestingAgent } from './runtime-tester';
export type { TestReport, RuntimeIssue, PerformanceMetrics } from './runtime-tester';

export { AIVisualInspector } from './ai-visual-inspector';
export type { VisualAnalysis, VisualError, RegressionReport, Regression } from './ai-visual-inspector';

export { SmartErrorAnalyzer } from './smart-error-analyzer';
export type { 
  ErrorDiagnosis, 
  CodeFixSuggestion, 
  FileFix, 
  ErrorContext
} from './smart-error-analyzer';

export { MultiPlatformTester } from './multi-platform-tester';
export type { PlatformReport, TestResults } from './multi-platform-tester';
