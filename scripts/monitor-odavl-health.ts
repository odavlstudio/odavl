#!/usr/bin/env tsx
/**
 * ODAVL Governance Health Monitor
 * Checks .odavl directory health: metrics overflow, audit log integrity, trust score anomalies
 * 
 * Usage:
 *   pnpm monitor:health          # Run all checks
 *   pnpm monitor:health --verbose # Detailed output
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { createHmac } from 'crypto';

interface HealthCheck {
  name: string;
  status: 'healthy' | 'warning' | 'critical';
  message: string;
  details?: Record<string, any>;
}

interface HealthReport {
  timestamp: string;
  checks: HealthCheck[];
  overallStatus: 'healthy' | 'warning' | 'critical';
  summary: {
    healthy: number;
    warnings: number;
    critical: number;
  };
}

const THRESHOLDS = {
  METRICS_WARNING: 500,
  METRICS_CRITICAL: 1000,
  UNDO_WARNING: 100,
  UNDO_CRITICAL: 200,
  TRUST_SCORE_MIN: 0.1,
  TRUST_SCORE_ANOMALY: 0.3, // Sudden drop >30% is suspicious
  CONSECUTIVE_FAILURES_WARNING: 2,
  CONSECUTIVE_FAILURES_CRITICAL: 3,
};

async function checkMetricsDirectory(): Promise<HealthCheck> {
  const metricsDir = path.join(process.cwd(), '.odavl/metrics');

  try {
    const files = await fs.readdir(metricsDir);
    const jsonFiles = files.filter(f => f.endsWith('.json'));
    const count = jsonFiles.length;

    if (count >= THRESHOLDS.METRICS_CRITICAL) {
      return {
        name: 'Metrics Directory',
        status: 'critical',
        message: `Critical: ${count} metrics files found (threshold: ${THRESHOLDS.METRICS_CRITICAL})`,
        details: { count, threshold: THRESHOLDS.METRICS_CRITICAL }
      };
    } else if (count >= THRESHOLDS.METRICS_WARNING) {
      return {
        name: 'Metrics Directory',
        status: 'warning',
        message: `Warning: ${count} metrics files found (threshold: ${THRESHOLDS.METRICS_WARNING})`,
        details: { count, threshold: THRESHOLDS.METRICS_WARNING }
      };
    } else {
      return {
        name: 'Metrics Directory',
        status: 'healthy',
        message: `Healthy: ${count} metrics files`,
        details: { count }
      };
    }
  } catch (error) {
    return {
      name: 'Metrics Directory',
      status: 'warning',
      message: 'Metrics directory not found or inaccessible',
      details: { error: (error as Error).message }
    };
  }
}

async function checkUndoDirectory(): Promise<HealthCheck> {
  const undoDir = path.join(process.cwd(), '.odavl/undo');

  try {
    const files = await fs.readdir(undoDir);
    const jsonFiles = files.filter(f => f.endsWith('.json') && f !== 'latest.json');
    const count = jsonFiles.length;

    if (count >= THRESHOLDS.UNDO_CRITICAL) {
      return {
        name: 'Undo Snapshots',
        status: 'critical',
        message: `Critical: ${count} undo snapshots (threshold: ${THRESHOLDS.UNDO_CRITICAL})`,
        details: { count, threshold: THRESHOLDS.UNDO_CRITICAL }
      };
    } else if (count >= THRESHOLDS.UNDO_WARNING) {
      return {
        name: 'Undo Snapshots',
        status: 'warning',
        message: `Warning: ${count} undo snapshots (threshold: ${THRESHOLDS.UNDO_WARNING})`,
        details: { count, threshold: THRESHOLDS.UNDO_WARNING }
      };
    } else {
      return {
        name: 'Undo Snapshots',
        status: 'healthy',
        message: `Healthy: ${count} undo snapshots`,
        details: { count }
      };
    }
  } catch (error) {
    return {
      name: 'Undo Snapshots',
      status: 'warning',
      message: 'Undo directory not found or inaccessible',
      details: { error: (error as Error).message }
    };
  }
}

async function checkAuditLogIntegrity(): Promise<HealthCheck> {
  const auditDir = path.join(process.cwd(), '.odavl/audit');

  try {
    const files = await fs.readdir(auditDir);
    const jsonlFiles = files.filter(f => f.endsWith('.jsonl'));

    if (jsonlFiles.length === 0) {
      return {
        name: 'Audit Log Integrity',
        status: 'warning',
        message: 'No audit logs found',
        details: { files: 0 }
      };
    }

    let totalEntries = 0;
    let corruptedFiles = 0;

    for (const file of jsonlFiles) {
      const filePath = path.join(auditDir, file);
      const content = await fs.readFile(filePath, 'utf8');
      const lines = content.trim().split('\n').filter(l => l.length > 0);

      totalEntries += lines.length;

      // Basic integrity check: valid JSON per line
      for (const line of lines) {
        try {
          const entry = JSON.parse(line);
          // Check required fields
          if (!entry.timestamp || !entry.event || !entry.hash) {
            corruptedFiles++;
            break;
          }
        } catch {
          corruptedFiles++;
          break;
        }
      }
    }

    if (corruptedFiles > 0) {
      return {
        name: 'Audit Log Integrity',
        status: 'critical',
        message: `Critical: ${corruptedFiles} corrupted audit log files`,
        details: { totalEntries, corruptedFiles, totalFiles: jsonlFiles.length }
      };
    } else {
      return {
        name: 'Audit Log Integrity',
        status: 'healthy',
        message: `Healthy: ${jsonlFiles.length} audit logs, ${totalEntries} entries`,
        details: { totalEntries, files: jsonlFiles.length }
      };
    }
  } catch (error) {
    return {
      name: 'Audit Log Integrity',
      status: 'warning',
      message: 'Audit directory not found or inaccessible',
      details: { error: (error as Error).message }
    };
  }
}

async function checkTrustScores(): Promise<HealthCheck> {
  const trustPath = path.join(process.cwd(), '.odavl/recipes-trust.json');

  try {
    const content = await fs.readFile(trustPath, 'utf8');
    const trust = JSON.parse(content);

    let lowTrust = 0;
    let blacklisted = 0;
    let highFailures = 0;
    let anomalies: string[] = [];

    for (const [recipeId, data] of Object.entries(trust.recipes || {})) {
      const recipe = data as any;

      if (recipe.blacklisted) {
        blacklisted++;
      }

      if (recipe.trust < THRESHOLDS.TRUST_SCORE_MIN) {
        lowTrust++;
      }

      if (recipe.consecutiveFailures >= THRESHOLDS.CONSECUTIVE_FAILURES_CRITICAL) {
        highFailures++;
      }

      // Check for sudden trust drops
      if (recipe.history && recipe.history.length >= 2) {
        const recent = recipe.history.slice(-2);
        const [prev, current] = recent.map((h: any) => h.trust);

        if (prev - current > THRESHOLDS.TRUST_SCORE_ANOMALY) {
          anomalies.push(`${recipeId}: dropped from ${prev.toFixed(2)} to ${current.toFixed(2)}`);
        }
      }
    }

    if (highFailures > 0 || anomalies.length > 0) {
      return {
        name: 'Trust Scores',
        status: 'critical',
        message: `Critical: ${highFailures} recipes with high failures, ${anomalies.length} anomalies`,
        details: { lowTrust, blacklisted, highFailures, anomalies }
      };
    } else if (lowTrust > 0 || blacklisted > 0) {
      return {
        name: 'Trust Scores',
        status: 'warning',
        message: `Warning: ${lowTrust} low trust, ${blacklisted} blacklisted`,
        details: { lowTrust, blacklisted }
      };
    } else {
      return {
        name: 'Trust Scores',
        status: 'healthy',
        message: 'Healthy: All recipes have acceptable trust scores',
        details: { totalRecipes: Object.keys(trust.recipes || {}).length }
      };
    }
  } catch (error) {
    return {
      name: 'Trust Scores',
      status: 'warning',
      message: 'Trust scores file not found or invalid',
      details: { error: (error as Error).message }
    };
  }
}

async function checkGatesConfiguration(): Promise<HealthCheck> {
  const gatesPath = path.join(process.cwd(), '.odavl/gates.yml');

  try {
    await fs.access(gatesPath);

    // Read and parse YAML (basic check)
    const content = await fs.readFile(gatesPath, 'utf8');

    // Check for required fields
    const hasRiskBudget = /risk_budget:\s*\d+/.test(content);
    const hasForbiddenPaths = /forbidden_paths:/.test(content);
    const hasThresholds = /thresholds:/.test(content);

    if (hasRiskBudget && hasForbiddenPaths && hasThresholds) {
      return {
        name: 'Gates Configuration',
        status: 'healthy',
        message: 'Healthy: gates.yml properly configured',
        details: { hasRiskBudget, hasForbiddenPaths, hasThresholds }
      };
    } else {
      return {
        name: 'Gates Configuration',
        status: 'warning',
        message: 'Warning: gates.yml missing some required fields',
        details: { hasRiskBudget, hasForbiddenPaths, hasThresholds }
      };
    }
  } catch (error) {
    return {
      name: 'Gates Configuration',
      status: 'warning',
      message: 'gates.yml not found or inaccessible',
      details: { error: (error as Error).message }
    };
  }
}

async function checkMLModels(): Promise<HealthCheck> {
  const mlDir = path.join(process.cwd(), '.odavl/ml-models');

  try {
    const models = await fs.readdir(mlDir);
    const modelDirs = await Promise.all(
      models.map(async (m) => {
        const modelPath = path.join(mlDir, m);
        const stats = await fs.stat(modelPath);
        return stats.isDirectory() ? m : null;
      })
    );

    const validModels = modelDirs.filter(Boolean);

    if (validModels.length === 0) {
      return {
        name: 'ML Models',
        status: 'warning',
        message: 'Warning: No ML models found',
        details: { count: 0 }
      };
    }

    // Check each model has versions
    let modelsWithVersions = 0;
    for (const model of validModels) {
      const versionsPath = path.join(mlDir, model!, 'versions.json');
      try {
        await fs.access(versionsPath);
        modelsWithVersions++;
      } catch {
        // Model doesn't have versions.json
      }
    }

    if (modelsWithVersions === validModels.length) {
      return {
        name: 'ML Models',
        status: 'healthy',
        message: `Healthy: ${validModels.length} models with proper versioning`,
        details: { totalModels: validModels.length, withVersions: modelsWithVersions }
      };
    } else {
      return {
        name: 'ML Models',
        status: 'warning',
        message: `Warning: ${validModels.length - modelsWithVersions} models missing versions.json`,
        details: { totalModels: validModels.length, withVersions: modelsWithVersions }
      };
    }
  } catch (error) {
    return {
      name: 'ML Models',
      status: 'warning',
      message: 'ML models directory not found or inaccessible',
      details: { error: (error as Error).message }
    };
  }
}

async function runHealthChecks(): Promise<HealthReport> {
  console.log('🏥 Running ODAVL Governance Health Checks...\n');

  const checks: HealthCheck[] = await Promise.all([
    checkMetricsDirectory(),
    checkUndoDirectory(),
    checkAuditLogIntegrity(),
    checkTrustScores(),
    checkGatesConfiguration(),
    checkMLModels()
  ]);

  const summary = {
    healthy: checks.filter(c => c.status === 'healthy').length,
    warnings: checks.filter(c => c.status === 'warning').length,
    critical: checks.filter(c => c.status === 'critical').length
  };

  const overallStatus = summary.critical > 0
    ? 'critical'
    : summary.warnings > 0
    ? 'warning'
    : 'healthy';

  const report: HealthReport = {
    timestamp: new Date().toISOString(),
    checks,
    overallStatus,
    summary
  };

  return report;
}

async function displayReport(report: HealthReport, verbose: boolean = false) {
  console.log('📊 Health Check Results:\n');

  for (const check of report.checks) {
    const icon = check.status === 'healthy'
      ? '✅'
      : check.status === 'warning'
      ? '⚠️ '
      : '❌';

    console.log(`${icon} ${check.name}: ${check.message}`);

    if (verbose && check.details) {
      console.log(`   Details: ${JSON.stringify(check.details, null, 2)}`);
    }
  }

  console.log('\n📈 Summary:');
  console.log(`   Healthy: ${report.summary.healthy}`);
  console.log(`   Warnings: ${report.summary.warnings}`);
  console.log(`   Critical: ${report.summary.critical}`);

  console.log(`\n🎯 Overall Status: ${report.overallStatus.toUpperCase()}`);

  // Save report
  const reportsDir = path.join(process.cwd(), '.odavl/reports');
  await fs.mkdir(reportsDir, { recursive: true });

  const reportPath = path.join(
    reportsDir,
    `health-${new Date().toISOString().replace(/[:.]/g, '-')}.json`
  );

  await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n💾 Report saved: ${reportPath}`);
}

async function main() {
  const args = process.argv.slice(2);
  const verbose = args.includes('--verbose') || args.includes('-v');

  const report = await runHealthChecks();
  await displayReport(report, verbose);

  // Exit with non-zero if critical issues found
  if (report.overallStatus === 'critical') {
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('💥 Error running health checks:', error);
    process.exit(1);
  });
}

export { runHealthChecks, displayReport };
export type { HealthCheck, HealthReport };
