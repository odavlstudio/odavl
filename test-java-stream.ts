/**
 * Test Java Stream API Detector
 * 
 * Tests detection of imperative loops that can be converted to Stream API
 */

import { JavaStreamDetector } from './odavl-studio/insight/core/src/detector/java/java-stream-detector.js';
import * as path from 'path';

async function testJavaStreamDetector() {
    console.log('🔍 Testing Java Stream API Detector');
    console.log('='.repeat(70));

    const workspace = path.resolve('test-fixtures/java');
    console.log(`📁 Workspace: ${workspace}\n`);

    const detector = new JavaStreamDetector(workspace);

    const startTime = Date.now();
    const issues = await detector.detect();
    const endTime = Date.now();

    console.log('📊 Results:');
    console.log(`⏱️  Analysis time: ${endTime - startTime}ms`);
    console.log(`🔍 Issues found: ${issues.length}`);

    // Count by severity
    const errorCount = issues.filter(i => i.severity === 'error').length;
    const warningCount = issues.filter(i => i.severity === 'warning').length;
    const infoCount = issues.filter(i => i.severity === 'info').length;

    console.log(`🔴 Errors: ${errorCount}`);
    console.log(`🟡 Warnings: ${warningCount}`);
    console.log(`🔵 Info: ${infoCount}`);

    // Group by category
    const byCategory = issues.reduce((acc, issue) => {
        acc[issue.category] = acc[issue.category] || [];
        acc[issue.category].push(issue);
        return acc;
    }, {} as Record<string, typeof issues>);

    console.log('');
    for (const [category, categoryIssues] of Object.entries(byCategory)) {
        console.log(`📂 ${category.toUpperCase()} (${categoryIssues.length} issues):`);
        console.log('-'.repeat(70));

        for (const issue of categoryIssues) {
            const icon = issue.severity === 'error' ? '🔴' : issue.severity === 'warning' ? '🟡' : '🔵';
            console.log(`  ${icon} Line ${issue.line}: ${issue.message}`);
            if (issue.recommendation) {
                console.log(`     💡 ${issue.recommendation}`);
            }
            if (issue.code) {
                console.log(`     🏷️  Code: ${issue.code}`);
            }
            if (issue.autoFix) {
                console.log(`     🔧 Auto-fix: ${issue.autoFix.description}`);
                console.log(`     📝 Suggestion:\n${issue.autoFix.replacement.split('\n').map(l => '        ' + l).join('\n')}`);
            }
            console.log('');
        }
    }

    console.log('='.repeat(70));
    console.log('✅ Java Stream API Detector test complete!');

    return issues;
}

testJavaStreamDetector().catch(console.error);
