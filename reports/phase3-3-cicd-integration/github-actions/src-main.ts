// src/main.ts
import * as core from '@actions/core';
import * as github from '@actions/github';
import { analyzeCode } from './analyzer';
import { evaluateQualityGates } from './quality-gates';
import { createPRComment } from './pr-comment';
import { uploadSARIF } from './sarif';

async function run(): Promise<void> {
  try {
    // Get inputs
    const token = core.getInput('token', { required: true });
    const languages = core.getInput('languages');
    const qualityGatesEnabled = core.getBooleanInput('quality-gates');
    const failOnError = core.getBooleanInput('fail-on-error');
    const errorThreshold = parseInt(core.getInput('error-threshold'));
    const complexityThreshold = parseInt(core.getInput('complexity-threshold'));
    const coverageThreshold = parseInt(core.getInput('coverage-threshold'));
    const securityLevels = core.getInput('security-levels').split(',');
    const uploadSarifEnabled = core.getBooleanInput('upload-sarif');

    core.info('🔍 Starting ODAVL Insight analysis...');

    // Run analysis
    const analysisResult = await analyzeCode({
      token,
      languages: languages === 'auto' ? undefined : languages.split(','),
      workspace: process.env.GITHUB_WORKSPACE!
    });

    core.info(`✅ Analysis complete: ${analysisResult.issuesFound} issues detected`);

    // Set outputs
    core.setOutput('issues-found', analysisResult.issuesFound);
    core.setOutput('report-url', analysisResult.reportUrl);

    // Evaluate quality gates
    if (qualityGatesEnabled) {
      core.info('🚪 Evaluating quality gates...');
      
      const gateResult = await evaluateQualityGates({
        result: analysisResult,
        thresholds: {
          errorRate: errorThreshold,
          complexity: complexityThreshold,
          coverage: coverageThreshold,
          security: securityLevels
        }
      });

      core.setOutput('quality-gate-passed', gateResult.passed);

      if (!gateResult.passed) {
        core.warning(`❌ Quality gates failed: ${gateResult.failures.join(', ')}`);
        
        if (failOnError) {
          core.setFailed(`Quality gates failed: ${gateResult.failures.join(', ')}`);
        }
      } else {
        core.info('✅ All quality gates passed');
      }
    }

    // Create PR comment
    if (github.context.eventName === 'pull_request') {
      core.info('💬 Creating PR comment...');
      await createPRComment({
        result: analysisResult,
        gateResult: qualityGatesEnabled ? gateResult : undefined,
        token: process.env.GITHUB_TOKEN!
      });
    }

    // Upload SARIF
    if (uploadSarifEnabled && analysisResult.sarif) {
      core.info('📤 Uploading SARIF to GitHub Security...');
      await uploadSARIF(analysisResult.sarif);
    }

    core.info('✅ ODAVL Insight analysis complete!');
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message);
    }
  }
}

run();