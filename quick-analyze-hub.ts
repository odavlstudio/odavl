#!/usr/bin/env tsx
/**
 * Quick ODAVL Insight Analysis for studio-hub
 * Direct detector execution without complex pipeline
 */

import { TSDetector, ESLintDetector } from './odavl-studio/insight/core/src/detector/index.js';
import { promises as fs } from 'node:fs';
import path from 'node:path';

const targetDir = path.join(process.cwd(), 'apps/studio-hub');

async function analyze() {
    console.log('\n🔍 ODAVL Insight - Quick Analysis\n');
    console.log(`📁 Target: ${targetDir}\n`);

    // TypeScript Detector
    console.log('📊 Running TypeScript Detector...');
    const tsDetector = new TSDetector();
    const tsErrors = await tsDetector.detect(targetDir);
    console.log(`   Found ${tsErrors.length} TypeScript issues\n`);

    // ESLint Detector
    console.log('🔧 Running ESLint Detector...');
    const eslintDetector = new ESLintDetector();
    const eslintErrors = await eslintDetector.detect(targetDir);
    console.log(`   Found ${eslintErrors.length} ESLint issues\n`);

    // Summary
    const totalIssues = tsErrors.length + eslintErrors.length;
    console.log('═══════════════════════════════════════════════════');
    console.log(`📈 SUMMARY: ${totalIssues} total issues`);
    console.log(`   • TypeScript: ${tsErrors.length}`);
    console.log(`   • ESLint: ${eslintErrors.length}`);
    console.log('═══════════════════════════════════════════════════\n');

    // Show first 10 issues
    if (tsErrors.length > 0) {
        console.log('🔴 TypeScript Issues (first 10):');
        tsErrors.slice(0, 10).forEach((err, i) => {
            console.log(`   ${i + 1}. ${err.message}`);
            console.log(`      📄 ${err.file}:${err.line}:${err.column}`);
        });
        console.log();
    }

    if (eslintErrors.length > 0) {
        console.log('🟡 ESLint Issues (first 10):');
        eslintErrors.slice(0, 10).forEach((err, i) => {
            console.log(`   ${i + 1}. ${err.message}`);
            console.log(`      📄 ${err.file}:${err.line}:${err.column}`);
        });
        console.log();
    }

    // Save results
    const reportPath = path.join(process.cwd(), '.odavl/insight/logs/quick-analysis.json');
    await fs.mkdir(path.dirname(reportPath), { recursive: true });
    await fs.writeFile(reportPath, JSON.stringify({
        timestamp: new Date().toISOString(),
        target: targetDir,
        typescript: tsErrors,
        eslint: eslintErrors,
        summary: {
            total: totalIssues,
            typescript: tsErrors.length,
            eslint: eslintErrors.length
        }
    }, null, 2));

    console.log(`💾 Full report saved: ${reportPath}\n`);

    return totalIssues === 0 ? 0 : 1;
}

analyze().then(code => process.exit(code)).catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
});
