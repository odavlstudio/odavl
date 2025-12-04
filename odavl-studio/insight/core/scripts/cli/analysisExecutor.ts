import { c, type WorkspaceInfo } from '../interactive-cli.js';
import { AnalysisType } from './analysisTypeSelector.js';

/**
 * Execute the selected analysis type on a workspace
 */
export async function executeAnalysis(
  workspace: WorkspaceInfo,
  analysisType: AnalysisType
): Promise<void> {
  // Lazy load analysis functions to avoid circular dependencies
  const {
    analyzeWorkspace,
    quickScanFromProblemsPanel,
    smartScan,
  } = await import('../interactive-cli.js');

  switch (analysisType) {
    case AnalysisType.Quick:
      await quickScanFromProblemsPanel(workspace.path);
      break;
    case AnalysisType.Full:
      await analyzeWorkspace(workspace.path);
      break;
    case AnalysisType.Smart:
      await smartScan(workspace.path);
      break;
    case AnalysisType.Back:
      // Handled by caller
      break;
    default:
      console.log(c('red', '\n❌ Invalid choice!\n'));
      process.exit(1);
  }
}
