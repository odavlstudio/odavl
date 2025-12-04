#!/usr/bin/env tsx
/**
 * Test script to verify Isolation detector improvements
 * Runs analysis on odavl-studio/insight workspace
 */

import { ComponentIsolationDetector } from './odavl-studio/insight/core/src/detector/isolation-detector';
import * as path from 'node:path';

const WORKSPACE_ROOT = process.cwd();
const TARGET_DIR = path.join(WORKSPACE_ROOT, 'odavl-studio/insight');

console.log('🧪 Testing Isolation Detector Improvements');
console.log('═'.repeat(60));
console.log(`📁 Workspace: ${WORKSPACE_ROOT}`);
console.log(`🎯 Target: ${TARGET_DIR}`);
console.log('');

async function main() {
    const detector = new ComponentIsolationDetector(WORKSPACE_ROOT);
    
    console.log('⏳ Running isolation analysis...');
    const startTime = Date.now();
    
    const issues = await detector.detect(TARGET_DIR);
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`✅ Analysis complete in ${duration}s`);
    console.log('');

    // Statistics
    const stats = detector.getStatistics(issues);
    
    console.log('📊 RESULTS SUMMARY');
    console.log('─'.repeat(60));
    console.log(`Total Issues: ${stats.totalIssues}`);
    console.log(`Total Files: ${stats.totalFiles}`);
    console.log('');
    
    console.log('By Severity:');
    console.log(`  🚨 Critical: ${stats.bySeverity.high}`);
    console.log(`  📊 Medium: ${stats.bySeverity.medium}`);
    console.log(`  💡 Low: ${stats.bySeverity.low}`);
    console.log('');
    
    console.log('By Type:');
    console.log(`  God Components: ${stats.byType['god-component']}`);
    console.log(`  Tight Coupling: ${stats.byType['tight-coupling']}`);
    console.log(`  Low Cohesion: ${stats.byType['low-cohesion']}`);
    console.log(`  High Fan-In: ${stats.byType['high-fan-in']}`);
    console.log(`  High Fan-Out: ${stats.byType['high-fan-out']}`);
    console.log(`  Boundary Violations: ${stats.byType['boundary-violation']}`);
    console.log('');

    // Top 10 god component issues
    const godComponents = issues
        .filter(i => i.type === 'god-component')
        .sort((a, b) => b.value - a.value)
        .slice(0, 10);

    if (godComponents.length > 0) {
        console.log('🏗️  TOP 10 GOD COMPONENTS');
        console.log('─'.repeat(60));
        godComponents.forEach((issue, idx) => {
            const severity = issue.severity === 'high' ? '🚨' : '📊';
            console.log(`${idx + 1}. ${severity} ${issue.file}`);
            console.log(`   LOC: ${issue.value}, Threshold: ${issue.threshold}`);
            console.log(`   ${issue.message}`);
            console.log('');
        });
    }

    // Expected improvements
    console.log('📈 COMPARISON WITH PREVIOUS RUN');
    console.log('─'.repeat(60));
    console.log('Previous: 106 total Isolation issues (64 critical)');
    console.log(`Current: ${stats.totalIssues} total (${stats.bySeverity.high} critical)`);
    
    const reduction = ((106 - stats.totalIssues) / 106 * 100).toFixed(1);
    const criticalReduction = ((64 - stats.bySeverity.high) / 64 * 100).toFixed(1);
    
    console.log(`Reduction: ${reduction}% total, ${criticalReduction}% critical`);
    console.log('');
    
    // Expected exemptions
    console.log('🎯 EXPECTED EXEMPTIONS (should not appear):');
    console.log('─'.repeat(60));
    const exemptedFiles = [
        'train-tensorflow-v2.ts',
        'interactive-cli.ts',
        'seed-demo-data.ts',
        'html-reporter.ts',
        'pdf-generator.ts',
    ];
    
    for (const file of exemptedFiles) {
        const found = godComponents.find(i => i.file.includes(file));
        if (found) {
            console.log(`❌ STILL FLAGGED: ${file} (${found.value} LOC)`);
        } else {
            console.log(`✅ EXEMPTED: ${file}`);
        }
    }
}

main().catch(console.error);
