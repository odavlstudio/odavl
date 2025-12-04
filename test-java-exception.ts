/**
 * Test Java Exception Detector
 * 
 * Tests detection of exception handling issues
 */

import { JavaExceptionDetector } from './odavl-studio/insight/core/src/detector/java/java-exception-detector.js';
import * as path from 'path';

async function testJavaExceptionDetector() {
    console.log('🔍 Testing Java Exception Detector');
    console.log('='.repeat(70));

    const workspace = path.resolve('test-fixtures/java');
    console.log(`📁 Workspace: ${workspace}\n`);

    const detector = new JavaExceptionDetector(workspace);

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

    // Group by code
    const byCode = issues.reduce((acc, issue) => {
        const code = issue.code || 'UNKNOWN';
        acc[code] = acc[code] || [];
        acc[code].push(issue);
        return acc;
    }, {} as Record<string, typeof issues>);

    console.log('');
    for (const [code, codeIssues] of Object.entries(byCode)) {
        console.log(`📂 ${code} (${codeIssues.length} issues):`);
        console.log('-'.repeat(70));

        for (const issue of codeIssues) {
            const icon = issue.severity === 'error' ? '🔴' : issue.severity === 'warning' ? '🟡' : '🔵';
            console.log(`  ${icon} Line ${issue.line} in ${issue.file}:`);
            console.log(`     ${issue.message}`);
            if (issue.recommendation) {
                console.log(`     💡 ${issue.recommendation.split('\n')[0]}...`);
            }
            console.log('');
        }
    }

    console.log('='.repeat(70));
    console.log('✅ Java Exception Detector test complete!');

    return issues;
}

testJavaExceptionDetector().catch(console.error);
