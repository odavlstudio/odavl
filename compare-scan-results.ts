#!/usr/bin/env tsx
/**
 * Compare ODAVL Insight scan results
 * Shows before/after improvements
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

const REPORT_PATH = path.join(process.cwd(), '.odavl/insight/reports/odavl-studio-insight-latest.json');

interface ScanResult {
    errors: Array<{
        severity: 'critical' | 'high' | 'medium' | 'low';
        detector: string;
        type: string;
        message: string;
    }>;
    metadata: {
        timestamp: string;
        duration: number;
        detectors: string[];
    };
}

console.log('📊 ODAVL INSIGHT - Progress Report');
console.log('═'.repeat(70));
console.log('');

// Expected baseline from conversation
const BASELINE = {
    phase0: { total: 579, performance: { critical: 151 }, complexity: { critical: 19 } },
    phase1: { total: 536, performance: { critical: 74 }, complexity: { critical: 6 } },
    phase2_n1: { total: 529, performance: { critical: 67 } },
    phase3_isolation_test: { total: 53, isolation: { critical: 5 } }, // Isolation only
};

console.log('📈 IMPROVEMENT TIMELINE');
console.log('─'.repeat(70));
console.log('Phase 0 (Baseline):         579 issues total');
console.log('  └─ Performance Critical:  151 issues');
console.log('  └─ Complexity Critical:    19 issues');
console.log('');
console.log('Phase 1 (O(n²) + Nesting):  536 issues (-7.4%)');
console.log('  └─ Performance Critical:   74 issues (-51% 🔥)');
console.log('  └─ Complexity Critical:     6 issues (-68% 🔥)');
console.log('');
console.log('Phase 2 (N+1 Detection):    529 issues (-1.3%)');
console.log('  └─ Performance Critical:   67 issues (-9%)');
console.log('');
console.log('Phase 3 (Isolation):        Isolation-only test');
console.log('  └─ Isolation Total:        53 issues (was 106, -50% 🔥)');
console.log('  └─ Isolation Critical:      5 issues (was 64, -92.2% 🔥🔥🔥)');
console.log('');

// Try to load latest scan results
if (fs.existsSync(REPORT_PATH)) {
    try {
        const report: ScanResult = JSON.parse(fs.readFileSync(REPORT_PATH, 'utf-8'));
        const total = report.errors.length;
        
        // Count by detector
        const byDetector: Record<string, number> = {};
        const bySeverity: Record<string, number> = { critical: 0, high: 0, medium: 0, low: 0 };
        
        for (const error of report.errors) {
            const detector = error.detector || 'unknown';
            byDetector[detector] = (byDetector[detector] || 0) + 1;
            bySeverity[error.severity] = (bySeverity[error.severity] || 0) + 1;
        }
        
        console.log('📄 LATEST FULL SCAN RESULTS');
        console.log('─'.repeat(70));
        console.log(`Total Issues: ${total}`);
        console.log(`Timestamp: ${new Date(report.metadata?.timestamp || Date.now()).toLocaleString()}`);
        console.log('');
        
        console.log('By Severity:');
        console.log(`  🚨 Critical: ${bySeverity.critical}`);
        console.log(`  🔴 High: ${bySeverity.high}`);
        console.log(`  📊 Medium: ${bySeverity.medium}`);
        console.log(`  💡 Low: ${bySeverity.low}`);
        console.log('');
        
        console.log('By Detector:');
        const sorted = Object.entries(byDetector).sort((a, b) => b[1] - a[1]);
        for (const [detector, count] of sorted) {
            console.log(`  ${detector}: ${count}`);
        }
        console.log('');
        
        // Calculate improvements
        const totalReduction = ((BASELINE.phase0.total - total) / BASELINE.phase0.total * 100).toFixed(1);
        console.log('🎯 TOTAL IMPROVEMENT FROM BASELINE');
        console.log('─'.repeat(70));
        console.log(`Before: ${BASELINE.phase0.total} issues`);
        console.log(`After:  ${total} issues`);
        console.log(`Reduction: ${totalReduction}% 🎉`);
        console.log('');
        
        // Check if goal reached
        if (total < 200) {
            console.log('✅ PHASE 2 GOAL REACHED: < 200 issues! 🎉🎉🎉');
        } else if (total < 300) {
            console.log('🎯 Close to Phase 2 goal (< 200 issues)');
        }
        
        if (total < 100) {
            console.log('🏆 ULTIMATE GOAL REACHED: < 100 issues! 🎉🎉🎉🎉🎉');
        }
        
    } catch (error) {
        console.error('❌ Error reading scan results:', error);
    }
} else {
    console.log('ℹ️  Latest full scan not found. Run full scan to see complete results.');
    console.log(`   Expected path: ${REPORT_PATH}`);
}

console.log('');
console.log('📝 SUMMARY OF IMPROVEMENTS MADE');
console.log('─'.repeat(70));
console.log('1. ✅ O(n²) Detector: Distinguishes O(n²) vs O(n*m)');
console.log('2. ✅ Nesting Depth: Fixed brace counting (only control flow)');
console.log('3. ✅ Confidence Scoring: Reweighted (Context 40%, Pattern 30%)');
console.log('4. ✅ N+1 Detection: Recognizes batch operations & Promise.all');
console.log('5. ✅ Isolation: Smart exemptions for scripts/generators/seeds');
console.log('   └─ Reduced Isolation critical by 92.2% (64 → 5) 🔥');
console.log('');
console.log('🎯 Next Steps:');
console.log('   • Run full scan to verify combined improvements');
console.log('   • Expected: ~470 total issues (based on Isolation reduction)');
console.log('   • Phase 3: Complexity thresholds, integrate false-positive filters');
console.log('   • Ultimate goal: < 100 issues with < 10% false positives');
