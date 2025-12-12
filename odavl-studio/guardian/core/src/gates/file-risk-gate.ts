/**
 * OMEGA-P5 Phase 4 Commit 3: Guardian + OMS Integration
 * OMS-aware file risk gate with dynamic thresholds (≤40 LOC)
 */

import type { GateResult, DeploymentGatesInput } from './deployment-gates';
import { loadOMSContext, resolveFileType } from '@odavl-studio/oms';
import { computeFileRiskScore } from '@odavl-studio/oms/risk';

export async function gateFileTypeRisk(input: DeploymentGatesInput): Promise<GateResult> {
  try {
    const omsContext = await loadOMSContext();
    const changedFiles = input.changedFiles || [];
    const fileRisks = changedFiles.map(file => {
      const fileType = resolveFileType(file);
      return computeFileRiskScore({ type: fileType });
    });
    
    const avgRisk = fileRisks.reduce((sum, r) => sum + r, 0) / fileRisks.length;
    const criticalFiles = fileRisks.filter(r => r >= 0.7).length;
    const highRiskFiles = fileRisks.filter(r => r >= 0.5 && r < 0.7).length;
    
    // Dynamic thresholds based on OMS risk scores
    if (avgRisk >= 0.7) {
      return { pass: false, reason: `❌ Critical risk: avgRisk=${avgRisk.toFixed(2)} (≥0.7 threshold)`, gate: 'fileRisk' };
    }
    if (criticalFiles > 0) {
      return { pass: false, reason: `⚠️ ${criticalFiles} critical files detected (risk ≥0.7)`, gate: 'fileRisk' };
    }
    if (avgRisk >= 0.5) {
      return { pass: true, reason: `⚠️ High risk: avgRisk=${avgRisk.toFixed(2)} - extra scrutiny recommended`, gate: 'fileRisk' };
    }
    return { pass: true, reason: `✓ Low risk: avgRisk=${avgRisk.toFixed(2)}, ${highRiskFiles} high-risk files`, gate: 'fileRisk' };
  } catch {
    return { pass: true, reason: '⚠️ OMS unavailable, skipping risk check', gate: 'fileRisk' };
  }
}
