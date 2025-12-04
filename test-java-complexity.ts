/**
 * Test Java Complexity Detector on sample code
 */

import { JavaComplexityDetector } from './odavl-studio/insight/core/src/detector/java/java-complexity-detector.js';
import * as path from 'path';

async function testJavaComplexity() {
    console.log('🔍 Testing Java Complexity Detector\n');
    console.log('=' .repeat(70));
    
    const workspaceRoot = path.join(process.cwd(), 'test-fixtures', 'java');
    const detector = new JavaComplexityDetector(workspaceRoot);
    
    console.log(`📁 Workspace: ${workspaceRoot}\n`);
    
    try {
        const startTime = Date.now();
        const issues = await detector.detect();
        const endTime = Date.now();
        
        console.log(`\n📊 Results:`);
        console.log(`⏱️  Analysis time: ${endTime - startTime}ms`);
        console.log(`🔍 Issues found: ${issues.length}\n`);
        
        if (issues.length === 0) {
            console.log('✅ No complexity issues detected!\n');
            return;
        }
        
        // Group by severity
        const errors = issues.filter(i => i.severity === 'error');
        const warnings = issues.filter(i => i.severity === 'warning');
        const infos = issues.filter(i => i.severity === 'info');
        
        console.log(`🔴 Errors: ${errors.length}`);
        console.log(`🟡 Warnings: ${warnings.length}`);
        console.log(`🔵 Info: ${infos.length}\n`);
        
        // Display issues by category
        const categories = new Set(issues.map(i => i.category));
        
        for (const category of categories) {
            const categoryIssues = issues.filter(i => i.category === category);
            console.log(`\n📂 ${category.toUpperCase()} (${categoryIssues.length} issues):`);
            console.log('-'.repeat(70));
            
            for (const issue of categoryIssues.slice(0, 15)) { // Show first 15
                console.log(`\n  ${getSeverityIcon(issue.severity)} Line ${issue.line}: ${issue.message}`);
                if (issue.recommendation) {
                    console.log(`     💡 ${issue.recommendation}`);
                }
                if (issue.code) {
                    console.log(`     🏷️  Code: ${issue.code}`);
                }
            }
            
            if (categoryIssues.length > 15) {
                console.log(`\n  ... and ${categoryIssues.length - 15} more issues`);
            }
        }
        
        console.log('\n' + '='.repeat(70));
        console.log('✅ Java Complexity Detector test complete!\n');
        
    } catch (error) {
        console.error('❌ Test failed:', error);
        if (error instanceof Error) {
            console.error('Stack:', error.stack);
        }
        process.exit(1);
    }
}

function getSeverityIcon(severity: string): string {
    switch (severity) {
        case 'error': return '🔴';
        case 'warning': return '🟡';
        case 'info': return '🔵';
        default: return '⚪';
    }
}

testJavaComplexity();
