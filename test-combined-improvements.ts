#!/usr/bin/env tsx
/**
 * Direct analysis using updated detectors
 * Bypasses CLI to get immediate results
 */

import { PerformanceDetector } from './odavl-studio/insight/core/src/detector/performance-detector';
import { ComplexityDetector } from './odavl-studio/insight/core/src/detector/complexity-detector';
import { ComponentIsolationDetector } from './odavl-studio/insight/core/src/detector/isolation-detector';
import * as path from 'node:path';

const WORKSPACE_ROOT = process.cwd();
const TARGET_DIR = path.join(WORKSPACE_ROOT, 'odavl-studio/insight');

console.log('🔍 ODAVL INSIGHT - Direct Analysis (Updated Detectors)');
console.log('═'.repeat(70));
console.log('');

async function main() {
    const results: Record<string, any> = {};
    
    // Performance detector
    console.log('⚡ Running Performance detector...');
    const perfDetector = new PerformanceDetector(WORKSPACE_ROOT);
    const perfIssues = await perfDetector.detect(TARGET_DIR);
    const perfStats = perfDetector.getStatistics(perfIssues);
    results.performance = {
        total: perfIssues.length,
        critical: perfIssues.filter(i => i.severity === 'critical').length,
        high: perfIssues.filter(i => i.severity === 'high').length,
        medium: perfIssues.filter(i => i.severity === 'medium').length,
    };
    console.log(`  ✅ ${results.performance.total} issues (${results.performance.critical} critical)`);
    
    // Complexity detector
    console.log('🧮 Running Complexity detector...');
    const complexDetector = new ComplexityDetector(WORKSPACE_ROOT);
    const complexIssues = await complexDetector.detect(TARGET_DIR);
    results.complexity = {
        total: complexIssues.length,
        critical: complexIssues.filter(i => i.severity === 'critical').length,
        high: complexIssues.filter(i => i.severity === 'high').length,
        medium: complexIssues.filter(i => i.severity === 'medium').length,
    };
    console.log(`  ✅ ${results.complexity.total} issues (${results.complexity.critical} critical)`);
    
    // Isolation detector (UPDATED)
    console.log('🔐 Running Isolation detector (UPDATED)...');
    const isolationDetector = new ComponentIsolationDetector(WORKSPACE_ROOT);
    const isolationIssues = await isolationDetector.detect(TARGET_DIR);
    const isolationStats = isolationDetector.getStatistics(isolationIssues);
    results.isolation = {
        total: isolationIssues.length,
        critical: isolationIssues.filter(i => i.severity === 'high').length,
        medium: isolationIssues.filter(i => i.severity === 'medium').length,
        low: isolationIssues.filter(i => i.severity === 'low').length,
    };
    console.log(`  ✅ ${results.isolation.total} issues (${results.isolation.critical} critical)`);
    
    console.log('');
    console.log('📊 COMBINED RESULTS SUMMARY');
    console.log('─'.repeat(70));
    
    const totalIssues = results.performance.total + results.complexity.total + results.isolation.total;
    const totalCritical = results.performance.critical + results.complexity.critical + results.isolation.critical;
    
    console.log(`Total Issues: ${totalIssues}`);
    console.log(`Total Critical: ${totalCritical}`);
    console.log('');
    
    console.log('By Detector:');
    console.log(`  ⚡ Performance: ${results.performance.total} (${results.performance.critical} critical)`);
    console.log(`  🧮 Complexity: ${results.complexity.total} (${results.complexity.critical} critical)`);
    console.log(`  🔐 Isolation: ${results.isolation.total} (${results.isolation.critical} critical)`);
    console.log('');
    
    console.log('📈 IMPROVEMENTS FROM BASELINE (579 issues)');
    console.log('─'.repeat(70));
    
    const baseline = {
        total: 579,
        performance: { total: 138, critical: 151 },
        complexity: { total: 291, critical: 19 },
        isolation: { total: 106, critical: 64 },
    };
    
    const totalReduction = ((baseline.total - totalIssues) / baseline.total * 100).toFixed(1);
    const criticalReduction = ((baseline.performance.critical + baseline.complexity.critical + baseline.isolation.critical - totalCritical) / (baseline.performance.critical + baseline.complexity.critical + baseline.isolation.critical) * 100).toFixed(1);
    
    console.log(`Total: 579 → ${totalIssues} (-${totalReduction}%)`);
    console.log(`Critical: 234 → ${totalCritical} (-${criticalReduction}%)`);
    console.log('');
    
    console.log('Breakdown:');
    console.log(`  ⚡ Performance: ${baseline.performance.critical} → ${results.performance.critical} critical (-${((baseline.performance.critical - results.performance.critical) / baseline.performance.critical * 100).toFixed(1)}%)`);
    console.log(`  🧮 Complexity: ${baseline.complexity.critical} → ${results.complexity.critical} critical (-${((baseline.complexity.critical - results.complexity.critical) / baseline.complexity.critical * 100).toFixed(1)}%)`);
    console.log(`  🔐 Isolation: ${baseline.isolation.critical} → ${results.isolation.critical} critical (-${((baseline.isolation.critical - results.isolation.critical) / baseline.isolation.critical * 100).toFixed(1)}%)`);
    console.log('');
    
    // Goal check
    if (totalIssues < 200) {
        console.log('🎉 PHASE 2 GOAL ACHIEVED: < 200 issues!');
        console.log('');
    } else {
        const remaining = totalIssues - 200;
        console.log(`🎯 Progress toward Phase 2: ${remaining} issues to go (target: < 200)`);
        console.log('');
    }
    
    if (totalIssues < 100) {
        console.log('🏆 ULTIMATE GOAL ACHIEVED: < 100 issues!');
    }
}

main().catch(console.error);
