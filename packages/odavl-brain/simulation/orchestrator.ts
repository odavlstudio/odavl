import { runInsightFullScan } from "../adapters/run-insight.js";
import { runAutopilotFix } from "../adapters/run-autopilot.js";
import { runGuardianTestSuite } from "../adapters/run-guardian.js";
import { Logger } from "../utils/logger.js";

const logger = new Logger("BrainSimulation");

export async function runODAVLLoop(projectPath: string) {
  logger.info("▶️ Starting ODAVL Simulation Loop...");
  
  // 1. OBSERVE – Run Insight full scan
  logger.info("🔍 [O] Running Insight scan...");
  const insightResult = await runInsightFullScan(projectPath);
  logger.info(`Insight found ${insightResult.issues.length} issues.`);

  // 2. DECIDE – Autopilot decision-making
  logger.info("🤖 [D] Running Autopilot fix routine...");
  const fixSummary = await runAutopilotFix(projectPath, insightResult.issues);
  logger.info(`Autopilot applied ${fixSummary.appliedFixes} fixes.`);

  // 3. ACT – Guardian simulation
  logger.info("🛡️ [A] Running Guardian test simulation...");
  const testReport = await runGuardianTestSuite(projectPath);
  logger.info(`Guardian completed ${testReport.tests} tests.`);

  // 4. VERIFY – Output summary
  logger.info("📊 [V] Preparing verification summary...");
  const summary = {
    insightIssues: insightResult.issues.length,
    autopilotFixes: fixSummary.appliedFixes,
    guardianTests: testReport.tests,
    guardianFailures: testReport.failures,
  };

  // 5. LEARN – Return structured summary
  logger.info("🧠 [L] Loop complete. Returning summary.");
  return summary;
}
