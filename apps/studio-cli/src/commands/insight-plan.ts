/**
 * ODAVL Insight Plan Command
 * 
 * Display current plan information and limits.
 */

import chalk from 'chalk';
import { 
  type InsightPlanId,
  getAllInsightPlanIds,
  getInsightPlan,
} from '../../../../odavl-studio/insight/core/src/config/insight-product.js';
import {
  getAnalysisLimits,
  canRunCloudAnalysis,
  canUseTeamCollaboration,
  getEnabledDetectors,
  formatLimit,
} from '../../../../odavl-studio/insight/core/src/config/insight-entitlements.js';

export interface PlanOptions {
  json?: boolean;
}

/**
 * Get current plan (mock for now - will be replaced with actual license check)
 */
function getCurrentPlanId(): InsightPlanId {
  // TODO: Replace with actual license/subscription check
  // For now, default to FREE plan
  return 'INSIGHT_FREE';
}

/**
 * Show plan information
 */
export async function showPlan(options: PlanOptions = {}) {
  const currentPlanId = getCurrentPlanId();
  const plan = getInsightPlan(currentPlanId);
  const limits = getAnalysisLimits(currentPlanId);
  const detectors = getEnabledDetectors(currentPlanId);

  if (options.json) {
    // JSON output
    console.log(JSON.stringify({
      current_plan: {
        id: plan.id,
        display_name: plan.displayName,
        sku: plan.sku,
        monthly_price: plan.monthlyPrice,
        yearly_price: plan.yearlyPrice,
      },
      limits: {
        max_projects: limits.maxProjects,
        max_concurrent_analyses: limits.maxConcurrentAnalyses,
        max_files_per_analysis: limits.maxFilesPerAnalysis,
        historical_retention_days: limits.historicalRetentionDays,
      },
      features: {
        cloud_dashboard: canRunCloudAnalysis(currentPlanId),
        team_collaboration: canUseTeamCollaboration(currentPlanId),
        enabled_detectors: detectors,
      },
      all_features: plan.features,
    }, null, 2));
    return;
  }

  // Human-readable output
  console.log();
  console.log(chalk.cyan.bold('╔══════════════════════════════════════════════╗'));
  console.log(chalk.cyan.bold('║       ODAVL Insight - Current Plan          ║'));
  console.log(chalk.cyan.bold('╚══════════════════════════════════════════════╝'));
  console.log();

  // Current Plan
  const priceLabel = plan.monthlyPrice === 0 
    ? chalk.green('FREE') 
    : chalk.yellow(`$${plan.monthlyPrice}/month`);
  
  console.log(chalk.white.bold('📋 Plan: ') + chalk.cyan.bold(plan.displayName) + ` (${priceLabel})`);
  console.log(chalk.gray(`   ${plan.description}`));
  console.log();

  // Limits Section
  console.log(chalk.white.bold('📊 Limits & Quotas:'));
  console.log(chalk.gray('   ├─ Projects:         ') + chalk.white(formatLimit(limits.maxProjects)));
  console.log(chalk.gray('   ├─ Concurrent:       ') + chalk.white(formatLimit(limits.maxConcurrentAnalyses) + ' analyses'));
  console.log(chalk.gray('   ├─ Files/Analysis:   ') + chalk.white(formatLimit(limits.maxFilesPerAnalysis)));
  console.log(chalk.gray('   └─ History:          ') + chalk.white(`${limits.historicalRetentionDays} days`));
  console.log();

  // Features Section
  console.log(chalk.white.bold('✨ Features:'));
  const cloudEnabled = canRunCloudAnalysis(currentPlanId);
  const teamEnabled = canUseTeamCollaboration(currentPlanId);
  
  console.log(chalk.gray('   ├─ Cloud Dashboard:  ') + (cloudEnabled ? chalk.green('✓ Enabled') : chalk.red('✗ Disabled')));
  console.log(chalk.gray('   ├─ Team Collab:      ') + (teamEnabled ? chalk.green('✓ Enabled') : chalk.red('✗ Disabled')));
  console.log(chalk.gray('   └─ Detectors:        ') + chalk.white(`${detectors.length} enabled`));
  console.log();

  // Enabled Detectors
  console.log(chalk.white.bold('🔍 Enabled Detectors:'));
  const detectorColumns = 3;
  const detectorsPerColumn = Math.ceil(detectors.length / detectorColumns);
  
  for (let i = 0; i < detectorsPerColumn; i++) {
    let line = '   ';
    for (let col = 0; col < detectorColumns; col++) {
      const idx = col * detectorsPerColumn + i;
      if (idx < detectors.length) {
        const detector = detectors[idx];
        line += chalk.cyan('• ') + chalk.white(detector.padEnd(20));
      }
    }
    console.log(line);
  }
  console.log();

  // Feature List
  if (plan.features.length > 0) {
    console.log(chalk.white.bold('📦 Included Features:'));
    plan.features.forEach((feature, index) => {
      const prefix = index === plan.features.length - 1 ? '   └─ ' : '   ├─ ';
      console.log(chalk.gray(prefix) + chalk.white(feature));
    });
    console.log();
  }

  // Upgrade message for non-Enterprise plans
  if (currentPlanId !== 'INSIGHT_ENTERPRISE') {
    console.log(chalk.yellow.bold('💎 Want More?'));
    console.log(chalk.gray('   Run ') + chalk.cyan('odavl insight plans') + chalk.gray(' to see upgrade options'));
    console.log(chalk.gray('   Or visit: ') + chalk.underline('https://odavl.com/pricing'));
    console.log();
  }
}

/**
 * Show all available plans (comparison)
 */
export async function showAllPlans() {
  const planIds = getAllInsightPlanIds();

  console.log();
  console.log(chalk.cyan.bold('╔══════════════════════════════════════════════╗'));
  console.log(chalk.cyan.bold('║       ODAVL Insight - All Plans             ║'));
  console.log(chalk.cyan.bold('╚══════════════════════════════════════════════╝'));
  console.log();

  for (const planId of planIds) {
    const plan = getInsightPlan(planId);
    const limits = getAnalysisLimits(planId);
    const popular = plan.popular ? chalk.yellow(' ⭐ POPULAR') : '';

    console.log(chalk.white.bold(`📋 ${plan.displayName}${popular}`));
    
    const priceLabel = plan.monthlyPrice === 0 
      ? chalk.green('FREE') 
      : chalk.yellow(`$${plan.monthlyPrice}/mo`) + chalk.gray(` ($${plan.yearlyPrice}/yr)`);
    console.log(chalk.gray('   Price: ') + priceLabel);
    console.log(chalk.gray(`   ${plan.description}`));
    console.log();
    
    console.log(chalk.gray('   Limits:'));
    console.log(chalk.gray('   • Projects:    ') + chalk.white(formatLimit(limits.maxProjects)));
    console.log(chalk.gray('   • Concurrent:  ') + chalk.white(formatLimit(limits.maxConcurrentAnalyses)));
    console.log(chalk.gray('   • Files:       ') + chalk.white(formatLimit(limits.maxFilesPerAnalysis)));
    console.log(chalk.gray('   • Detectors:   ') + chalk.white(`${plan.enabledDetectors.length}`));
    console.log();
  }

  console.log(chalk.cyan('For full details, visit: ') + chalk.underline('https://odavl.com/pricing'));
  console.log();
}
