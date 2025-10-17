// Intelligence engine entrypoint



import { observe } from './observe';
import { decide } from './decide';
import { act } from './act';
import { verify } from './verify';
import { learn } from './learn';
import { startCycle, startPhase, endPhase, getCycleMetrics } from './metrics';
import { logTelemetry } from './telemetry';
import { writeMarkdownReport } from './report';
import { readEnterpriseConfig } from './config';
import { runSecurityScan } from './security';

export async function runCycle(workspacePath: string) {
  startCycle();
  let observed, decision, action, result, learned;
  let errors: string[] = [];

  // --- Enterprise Config Integration ---
  const config = await readEnterpriseConfig(workspacePath);
  let securityReport = null;
  if (config.enableSecurityScan) {
    securityReport = await runSecurityScan(workspacePath);
    const hasCritical = securityReport.vulnerabilities.some(v => v.severity === 'critical');
    if (config.blockOnCritical && hasCritical) {
      throw new Error('❌ Critical vulnerabilities found. Cycle blocked by policy.');
    }
    // Optionally: riskBudget enforcement (warn if riskScore exceeds budget)
    // Not blocking, just for reporting
  }

  try {
    startPhase('observe');
    observed = await observe(workspacePath);
    endPhase('observe', 'success');
  } catch (e) {
    endPhase('observe', 'fail', [String(e)]);
    errors.push('observe: ' + String(e));
  }
  try {
    startPhase('decide');
    decision = await decide(observed);
    endPhase('decide', 'success');
  } catch (e) {
    endPhase('decide', 'fail', [String(e)]);
    errors.push('decide: ' + String(e));
  }
  try {
    startPhase('act');
    action = await act(decision);
    endPhase('act', 'success');
  } catch (e) {
    endPhase('act', 'fail', [String(e)]);
    errors.push('act: ' + String(e));
  }
  try {
    startPhase('verify');
    result = await verify(action);
    endPhase('verify', 'success');
  } catch (e) {
    endPhase('verify', 'fail', [String(e)]);
    errors.push('verify: ' + String(e));
  }
  try {
    startPhase('learn');
    learned = await learn(result);
    endPhase('learn', 'success');
  } catch (e) {
    endPhase('learn', 'fail', [String(e)]);
    errors.push('learn: ' + String(e));
  }
  const metrics = getCycleMetrics();
  // Calculate riskScore and summary
  const riskScore = errors.length ? 80 : 0;
  const summary = errors.length ? 'WARNINGS/FAILURES' : 'OK';
  const telemetry = {
    timestamp: new Date().toISOString(),
    metrics,
    riskScore,
    summary,
    riskBudget: config.riskBudget,
    securityReport,
  };
  await logTelemetry(workspacePath, telemetry);
  const mdFile = await writeMarkdownReport(workspacePath, metrics, riskScore, summary);
  if (typeof (globalThis as any).sendInsightsUpdate === 'function') {
    (globalThis as any).sendInsightsUpdate(mdFile);
  }
  return { observed, decision, action, result, learned, metrics, errors, mdFile, securityReport };
}
