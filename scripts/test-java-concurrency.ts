/**
 * Test script for JavaConcurrencyDetector
 * Tests detection of concurrency issues in Java code
 */

import { JavaConcurrencyDetector } from '../odavl-studio/insight/core/src/detector/java/java-concurrency-detector.js';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function testConcurrencyDetector() {
    console.log('🔍 Testing Java Concurrency Detector\n');
    console.log('='.repeat(70));

    const workspaceRoot = path.join(__dirname, '..', 'test-fixtures', 'java');
    console.log(`📁 Workspace: ${workspaceRoot}\n`);

    const detector = new JavaConcurrencyDetector(workspaceRoot);

    const startTime = Date.now();
    const issues = await detector.detect();
    const endTime = Date.now();

    console.log('📊 Results:');
    console.log(`⏱️  Analysis time: ${endTime - startTime}ms`);
    console.log(`🔍 Issues found: ${issues.length}\n`);

    // Group by severity
    const errors = issues.filter(i => i.severity === 'error');
    const warnings = issues.filter(i => i.severity === 'warning');
    const info = issues.filter(i => i.severity === 'info');

    console.log(`🔴 Errors: ${errors.length}`);
    console.log(`🟡 Warnings: ${warnings.length}`);
    console.log(`🔵 Info: ${info.length}\n`);

    // Group by category
    const categories = new Map<string, typeof issues>();
    for (const issue of issues) {
        const cat = issue.category;
        if (!categories.has(cat)) {
            categories.set(cat, []);
        }
        categories.get(cat)!.push(issue);
    }

    console.log('\n' + '='.repeat(70));
    for (const [category, categoryIssues] of categories) {
        console.log(`\n📂 ${category} (${categoryIssues.length} issues):`);
        console.log('-'.repeat(70));
        
        for (const issue of categoryIssues.slice(0, 10)) {
            const icon = issue.severity === 'error' ? '🔴' : issue.severity === 'warning' ? '🟡' : '🔵';
            const fileName = path.basename(issue.file);
            console.log(`\n  ${icon} Line ${issue.line}: ${issue.message}`);
            if (issue.suggestion) {
                console.log(`     💡 ${issue.suggestion}`);
            }
            console.log(`     🏷️  Code: ${issue.code}`);
        }
        
        if (categoryIssues.length > 10) {
            console.log(`\n  ... and ${categoryIssues.length - 10} more issues`);
        }
    }

    // Show auto-fixable issues
    const autoFixable = issues.filter(i => i.autoFixable);
    if (autoFixable.length > 0) {
        console.log('\n\n🛠️  AUTO-FIXABLE ISSUES (' + autoFixable.length + ' total):');
        console.log('='.repeat(70));
        for (const issue of autoFixable.slice(0, 5)) {
            console.log(`\n  Line ${issue.line}: ${issue.message}`);
            console.log(`  🔧 ${issue.suggestion || 'Auto-fix available'}`);
        }
    }

    console.log('\n' + '='.repeat(70));
    console.log('✅ Java Concurrency Detector test complete!');
}

// Run test
testConcurrencyDetector().catch(console.error);
