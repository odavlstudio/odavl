/**
 * ODAVL Brain CLI Commands
 * Phase Ω-P1: Brain commands for deployment confidence analysis
 */

import { Command } from 'commander';
import chalk from 'chalk';
import * as path from 'path';

export function createBrainCommand(): Command {
  const brain = new Command('brain');
  brain.description('🧠 ODAVL Brain - ML-powered deployment confidence');

  // brain status
  brain
    .command('status')
    .description('Check Brain health and configuration')
    .action(async () => {
      console.log(chalk.cyan('🧠 ODAVL Brain Status\n'));
      
      try {
        const { BrainHistoryStore } = await import('@odavl-studio/brain/learning');
        const store = new BrainHistoryStore(process.cwd());
        const samples = await store.loadLastNSamples(10);
        
        console.log(chalk.green('✅ Brain Operational'));
        console.log(chalk.white(`📊 Training Samples: ${samples.length}`));
        console.log(chalk.white(`📈 Fusion Engine: Active`));
        console.log(chalk.white(`🔬 Self-Calibration: Enabled`));
      } catch (error) {
        console.log(chalk.red('❌ Brain Not Initialized'));
        console.log(chalk.gray(`   Run 'odavl brain predict' to initialize`));
      }
    });

  // brain predict
  brain
    .command('predict')
    .description('Run deployment confidence prediction')
    .option('--files <pattern>', 'File pattern to analyze (default: git diff)')
    .action(async (options) => {
      console.log(chalk.cyan('🧠 Running Brain Prediction\n'));
      
      try {
        const { computeDeploymentConfidence } = await import('@odavl-studio/brain/runtime');
        
        const result = await computeDeploymentConfidence({
          fileTypeStats: { byType: {}, byRisk: {}, totalFiles: 0 },
          guardianReport: {
            url: 'n/a',
            timestamp: new Date().toISOString(),
            duration: 0,
            status: 'passed',
            issues: [],
            metrics: { totalIssues: 0, critical: 0, high: 0, medium: 0, low: 0 },
          },
          baselineHistory: { runs: [] },
          enableMLPrediction: true,
          changedFiles: [], // OMEGA-P5 Phase 4 Commit 5: OMS integration
        });
        
        console.log(chalk.bold(`Confidence: ${result.confidence.toFixed(1)}%`));
        console.log(chalk.white(`Can Deploy: ${result.canDeploy ? chalk.green('✅ Yes') : chalk.red('❌ No')}`));
        
        // OMEGA-P5 Phase 4 Commit 5: Display OMS file risk summary
        if ((result as any).omsFileRisk) {
          const oms = (result as any).omsFileRisk;
          console.log(chalk.white(`\n📊 File Risk (OMS): Avg ${(oms.avgRisk * 100).toFixed(1)}%, ${oms.criticalFileCount} critical`));
        }
        
        console.log(chalk.white('\nReasoning:'));
        result.reasoning.forEach((r: any) => console.log(chalk.gray(`  ${r}`)));
      } catch (error) {
        console.log(chalk.red(`❌ Prediction failed: ${error}`));
      }
    });

  // brain confidence
  brain
    .command('confidence')
    .description('Get current deployment confidence score')
    .action(async () => {
      console.log(chalk.cyan('🧠 Current Confidence\n'));
      console.log(chalk.white('Use "odavl brain predict" to compute confidence'));
    });

  // brain explain
  brain
    .command('explain')
    .description('Explain fusion engine decision')
    .action(async () => {
      console.log(chalk.cyan('🧠 Fusion Engine Explanation\n'));
      console.log(chalk.white('5-Model Ensemble:'));
      console.log(chalk.gray('  - Neural Network (NN): File-type risk'));
      console.log(chalk.gray('  - LSTM: Sequential patterns'));
      console.log(chalk.gray('  - Multi-Task Learning: Security/Stability/Performance'));
      console.log(chalk.gray('  - Bayesian: Uncertainty quantification'));
      console.log(chalk.gray('  - Heuristic: Guardian metrics\n'));
      console.log(chalk.white('Dynamic Weight Adjustment:'));
      console.log(chalk.gray('  - Security risk → Increase MTL weight'));
      console.log(chalk.gray('  - High variance → Increase Bayesian weight'));
      console.log(chalk.gray('  - Recent failures → Increase LSTM weight\n'));
      console.log(chalk.white('Self-Calibration: 60% P11 + 40% Fusion'));
    });

  // OMEGA-P7 Phase 1: Unified telemetry aggregation command
  brain
    .command('telemetry')
    .description('View unified telemetry across Autopilot + Insight + Guardian')
    .option('-n, --limit <number>', 'Number of recent sessions per product', '100')
    .action(async (options) => {
      console.log(chalk.cyan('📊 Unified Telemetry Analysis\n'));

      try {
        const { loadAllTelemetry, aggregateTelemetry } = await import('@odavl-studio/brain/learning');
        const limit = parseInt(options.limit, 10);
        const data = await loadAllTelemetry(process.cwd(), limit);
        const agg = aggregateTelemetry(data);

        if (agg.autopilot.sessions === 0 && agg.insight.sessions === 0 && agg.guardian.sessions === 0) {
          console.log(chalk.yellow('No telemetry data found. Run Autopilot, Insight, or Guardian to collect data.'));
          return;
        }

        console.log(chalk.cyan(`(last ${limit} sessions per product)\n`));

        // Autopilot section
        if (agg.autopilot.sessions > 0) {
          console.log(chalk.white('Autopilot:'));
          console.log(chalk.gray(`  Sessions: ${agg.autopilot.sessions}`));
          console.log(chalk.gray(`  Avg Brain Confidence: ${(agg.autopilot.avgConfidence * 100).toFixed(0)}%`));
          console.log(chalk.gray(`  Avg Issues Fixed: ${agg.autopilot.avgIssuesFixed.toFixed(1)}`));
          console.log(chalk.gray(`  Avg File Risk: ${(agg.autopilot.avgFileRisk * 100).toFixed(0)}%`));
          console.log(chalk.gray(`  Critical Files Avg: ${agg.autopilot.criticalFilesAvg.toFixed(1)}\n`));
        }

        // Insight section
        if (agg.insight.sessions > 0) {
          console.log(chalk.white('Insight:'));
          console.log(chalk.gray(`  Sessions: ${agg.insight.sessions}`));
          console.log(chalk.gray(`  Avg Issues: ${agg.insight.avgIssues.toFixed(1)}`));
          console.log(chalk.gray(`  Severity: C:${agg.insight.issuesBySeverity.critical}  H:${agg.insight.issuesBySeverity.high}  M:${agg.insight.issuesBySeverity.medium}  L:${agg.insight.issuesBySeverity.low}`));
          console.log(chalk.gray(`  Avg File Risk: ${(agg.insight.avgFileRisk * 100).toFixed(0)}%`));
          console.log(chalk.gray(`  Critical Files Avg: ${agg.insight.criticalFilesAvg.toFixed(1)}\n`));
        }

        // Guardian section
        if (agg.guardian.sessions > 0) {
          console.log(chalk.white('Guardian:'));
          console.log(chalk.gray(`  Sessions: ${agg.guardian.sessions}`));
          console.log(chalk.gray(`  Failure Rate: ${(agg.guardian.failureRate * 100).toFixed(0)}%`));
          if (agg.guardian.mostFailedGate) {
            console.log(chalk.gray(`  Most Failed Gate: "${agg.guardian.mostFailedGate}"`));
          }
          console.log(chalk.gray(`  Avg File Risk: ${(agg.guardian.avgFileRisk * 100).toFixed(0)}%`));
          console.log(chalk.gray(`  Critical Files Avg: ${agg.guardian.criticalFilesAvg.toFixed(1)}\n`));
        }
      } catch (error) {
        console.log(chalk.red(`❌ Failed to aggregate telemetry: ${error}`));
      }
    });

  // OMEGA-P7 Phase 2: Global learning signals command
  brain
    .command('learn')
    .description('View global learning signals from unified telemetry')
    .option('-n, --limit <number>', 'Number of recent sessions per product', '100')
    .action(async (options) => {
      console.log(chalk.cyan('📡 Global Learning Signals\n'));

      try {
        const { loadAllTelemetry, aggregateTelemetry, computeLearningSignals } = await import('@odavl-studio/brain/learning');

        const limit = parseInt(options.limit, 10);
        const data = await loadAllTelemetry(process.cwd(), limit);
        const agg = aggregateTelemetry(data);

        // Check if any data exists
        if (agg.autopilot.sessions === 0 && agg.insight.sessions === 0 && agg.guardian.sessions === 0) {
          console.log(chalk.yellow('No telemetry data found. Run Autopilot, Insight, or Guardian to collect data.'));
          return;
        }

        const signals = computeLearningSignals(agg);

        console.log(chalk.cyan(`(last ${limit} sessions)\n`));
        console.log(chalk.white(`Autopilot Quality:         ${signals.autopilotQuality.toFixed(2)}`));
        console.log(chalk.white(`Insight Detector Health:   ${signals.insightDetectorHealth.toFixed(2)}`));
        console.log(chalk.white(`Guardian Gate Stability:   ${signals.guardianGateStability.toFixed(2)}`));
        console.log(chalk.white(`Risk Pressure:             ${signals.riskPressure.toFixed(2)}`));
        console.log(chalk.gray('--------------------------------'));
        console.log(chalk.white(`Overall Learning Potential: ${signals.overallLearningPotential.toFixed(2)}`));
      } catch (error) {
        console.log(chalk.red(`❌ Failed to compute learning signals: ${error}`));
      }
    });

  // OMEGA-P7 Phase 3: Meta-learning decision command
  brain
    .command('meta')
    .description('View meta-learning decision for adaptive system behavior')
    .option('-n, --limit <number>', 'Number of recent sessions per product', '100')
    .action(async (options) => {
      console.log(chalk.cyan('🧠 Meta-Learning Decision\n'));

      try {
        const { loadAllTelemetry, aggregateTelemetry, computeLearningSignals, computeMetaLearningDecision } = await import('@odavl-studio/brain/learning');

        const limit = parseInt(options.limit, 10);
        const data = await loadAllTelemetry(process.cwd(), limit);
        const agg = aggregateTelemetry(data);

        // Check if any data exists
        if (agg.autopilot.sessions === 0 && agg.insight.sessions === 0 && agg.guardian.sessions === 0) {
          console.log(chalk.yellow('No telemetry data found. Run Autopilot, Insight, or Guardian to collect data.'));
          return;
        }

        const signals = computeLearningSignals(agg);
        const decision = computeMetaLearningDecision(signals);

        console.log(chalk.white(`Fusion LR:                 ${decision.nextFusionLearningRate.toFixed(2)}`));
        console.log(chalk.white(`Trust LR:                  ${decision.nextTrustLearningRate.toFixed(2)}`));
        console.log(chalk.white(`Guardian Sensitivity:      ${decision.recommendedGuardianSensitivity}`));
        console.log(chalk.white(`Autopilot Aggressiveness:  ${decision.autopilotAggressiveness.toFixed(2)}`));
        console.log(chalk.white(`OMS Weight Multiplier:     ${decision.adaptOMSWeighting.toFixed(2)}`));

        console.log(chalk.cyan('\nReasoning:'));
        decision.reasoning.forEach((reason: any) => console.log(chalk.gray(`- ${reason}`)));
      } catch (error) {
        console.log(chalk.red(`❌ Failed to compute meta-learning decision: ${error}`));
      }
    });

  // OMEGA-P8 Phase 1: Adaptive brain evolution command
  brain
    .command('adapt')
    .description('Evolve adaptive brain state based on unified telemetry')
    .option('-n, --limit <number>', 'Number of recent sessions per product', '200')
    .action(async (options) => {
      console.log(chalk.cyan('🤖 Adaptive Brain Evolution\n'));

      try {
        const { evolveAdaptiveBrainState } = await import('@odavl-studio/brain/learning');

        const limit = parseInt(options.limit, 10);
        const state = await evolveAdaptiveBrainState(process.cwd(), limit);

        console.log(chalk.white(`Fusion Learning Rate:        ${state.fusionLearningRate.toFixed(2)}`));
        console.log(chalk.white(`Trust Learning Rate:         ${state.trustLearningRate.toFixed(2)}`));
        console.log(chalk.white(`Guardian Sensitivity:        ${state.guardianSensitivity}`));
        console.log(chalk.white(`Autopilot Aggressiveness:    ${state.autopilotAggressiveness.toFixed(2)}`));
        console.log(chalk.white(`OMS Weight Multiplier:       ${state.omsWeightingMultiplier.toFixed(2)}`));
        console.log(chalk.cyan(`\nState updated successfully at: ${state.lastUpdated}`));
      } catch (error) {
        console.log(chalk.red(`❌ Failed to evolve adaptive brain: ${error}`));
      }
    });

  // OMEGA-P8: View current adaptive brain state
  brain
    .command('adaptive-state')
    .description('Display current adaptive brain state')
    .action(async () => {
      console.log(chalk.cyan('🧠 Current Adaptive Brain State\n'));

      try {
        const statePath = path.join(process.cwd(), '.odavl', 'brain-history', 'adaptive', 'state.json');
        
        if (!require('fs').existsSync(statePath)) {
          console.log(chalk.yellow('⚠️  No adaptive state found. Run "odavl brain adapt" to initialize.'));
          return;
        }

        const content = await import('node:fs/promises').then(fs => fs.readFile(statePath, 'utf8'));
        const state = JSON.parse(content);

        console.log(chalk.white(`Fusion Learning Rate:        ${state.fusionLearningRate?.toFixed(2) ?? 'N/A'}`));
        console.log(chalk.white(`Trust Learning Rate:         ${state.trustLearningRate?.toFixed(2) ?? 'N/A'}`));
        console.log(chalk.white(`Guardian Sensitivity:        ${state.guardianSensitivity ?? 'N/A'}`));
        console.log(chalk.white(`Autopilot Aggressiveness:    ${state.autopilotAggressiveness?.toFixed(2) ?? 'N/A'}`));
        console.log(chalk.white(`OMS Weight Multiplier:       ${state.omsWeightingMultiplier?.toFixed(2) ?? 'N/A'}`));
        console.log(chalk.gray(`\nLast Updated: ${state.lastUpdated ?? 'Unknown'}`));
      } catch (error) {
        console.log(chalk.red(`❌ Failed to read adaptive state: ${error}`));
      }
    });

  // OMEGA-P6 Phase 2: Trust score auto-learning command
  brain
    .command('trust')
    .description('Update recipe trust scores from telemetry')
    .option('--update', 'Update trust scores from telemetry')
    .action(async (options) => {
      console.log(chalk.cyan('🎯 Recipe Trust Scores\n'));

      try {
        const { readAutopilotTelemetry, updateRecipeTrustFromTelemetry } = await import('@odavl-studio/brain/learning');
        const trustPath = path.join(process.cwd(), '.odavl', 'recipes-trust.json');

        // Load old trust scores
        let oldTrust: any = {};
        try {
          oldTrust = JSON.parse(await import('node:fs/promises').then(fs => fs.readFile(trustPath, 'utf8')));
        } catch { /* File may not exist */ }

        if (options.update) {
          const events = await readAutopilotTelemetry(process.cwd(), 100);
          await updateRecipeTrustFromTelemetry(process.cwd(), events);
          console.log(chalk.green(`✅ Updated trust scores from ${events.length} sessions\n`));
        }

        // Load new trust scores
        const newTrust = JSON.parse(await import('node:fs/promises').then(fs => fs.readFile(trustPath, 'utf8')));

        // Display table
        console.log(chalk.white('Recipe Trust Scores:\n'));
        for (const [recipeId, data] of Object.entries(newTrust as any)) {
          const oldScore = oldTrust[recipeId]?.trust ?? 0;
          const newScore = (data as any).trust;
          const delta = newScore - oldScore;
          const arrow = delta > 0 ? chalk.green('↑') : delta < 0 ? chalk.red('↓') : chalk.gray('→');
          console.log(`  ${recipeId}: ${arrow} ${(newScore * 100).toFixed(1)}% (was ${(oldScore * 100).toFixed(1)}%)`);
        }
      } catch (error) {
        console.log(chalk.red(`❌ Failed to process trust scores: ${error}`));
      }
    });

  // OMEGA-P6 Phase 3: Fusion weight calibration
  brain
    .command('fusion')
    .description('View and update fusion engine predictor weights')
    .option('--update', 'Update weights from telemetry data')
    .action(async (options) => {
      console.log(chalk.cyan('⚖️ Fusion Engine Weights\n'));
      
      try {
        const { FusionEngine, readAutopilotTelemetry } = await import('@odavl-studio/brain/learning');
        
        const fusionEngine = new FusionEngine();
        await fusionEngine.loadWeights();
        
        if (options.update) {
          // Load old weights for comparison
          const oldWeightsData = await fusionEngine['weights'];
          const oldWeights = { ...oldWeightsData };
          
          // Update from last 100 telemetry events
          const events = await readAutopilotTelemetry(process.cwd(), 100);
          console.log(chalk.gray(`📊 Processing ${events.length} telemetry events...\n`));
          
          await fusionEngine.updateFusionWeightsFromTelemetry(events);
          await fusionEngine.loadWeights();
          const newWeights = fusionEngine['weights'];
          
          // Display before/after table
          console.log(chalk.white('Predictor     Old     New     Δ'));
          console.log(chalk.gray('─'.repeat(45)));
          
          for (const predictor of ['nn', 'lstm', 'mtl', 'bayesian', 'heuristic'] as const) {
            const oldVal = oldWeights[predictor];
            const newVal = newWeights[predictor];
            const delta = newVal - oldVal;
            const arrow = delta > 0 ? chalk.green('↑') : delta < 0 ? chalk.red('↓') : chalk.gray('→');
            const deltaStr = delta >= 0 ? `+${(delta * 100).toFixed(2)}%` : `${(delta * 100).toFixed(2)}%`;
            console.log(
              `${predictor.padEnd(12)} ${(oldVal * 100).toFixed(1).padStart(5)}%  ${(newVal * 100).toFixed(1).padStart(5)}%  ${arrow} ${deltaStr}`
            );
          }
          
          console.log(chalk.green('\n✅ Fusion weights updated successfully'));
        } else {
          // Just display current weights
          const weights = fusionEngine['weights'];
          console.log(chalk.white('Current Fusion Weights:\n'));
          for (const [predictor, weight] of Object.entries(weights)) {
            if (predictor !== 'riskPenalty') {
              console.log(`  ${predictor.padEnd(12)}: ${((weight as number) * 100).toFixed(1)}%`);
            }
          }
          console.log(chalk.gray('\nUse --update to recalibrate from telemetry'));
        }
      } catch (error) {
        console.log(chalk.red(`❌ Failed to process fusion weights: ${error}`));
      }
    });

  // Legacy support: brain run (orchestrator)
  brain
    .command('run [project-root]')
    .description('Run full Insight → Autopilot → Guardian pipeline (legacy)')
    .option('--skip-autopilot', 'Skip autopilot phase')
    .option('--skip-guardian', 'Skip guardian phase')
    .option('--max-fixes <number>', 'Maximum number of fixes to apply', '50')
    .option('--detectors <list>', 'Comma-separated list of detectors')
    .option('--verbose', 'Verbose output')
    .action(async (projectRoot: string = '.', options) => {
      try {
        const { runBrainPipeline } = await import('@odavl-studio/brain');
        const absoluteRoot = path.resolve(process.cwd(), projectRoot);
        
        const detectors = options.detectors
          ? options.detectors.split(',').map((d: string) => d.trim())
          : undefined;

        const report = await runBrainPipeline({
          projectRoot: absoluteRoot,
          skipAutopilot: options.skipAutopilot || false,
          skipGuardian: options.skipGuardian || false,
          maxFixes: parseInt(options.maxFixes, 10),
          detectors,
          verbose: options.verbose || false,
        });

        process.exit(report.readyForRelease ? 0 : 1);
      } catch (error) {
        console.error('❌ Brain pipeline failed:', error);
        process.exit(1);
      }
    });

  return brain;
}
