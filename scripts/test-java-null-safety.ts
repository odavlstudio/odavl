/**
 * Test Java Null Safety Detector on sample code
 */

import { JavaNullSafetyDetector } from '../odavl-studio/insight/core/src/detector/java/java-null-safety-detector.js';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function testJavaNullSafety() {
    console.log('🔍 Testing Java Null Safety Detector\n');
    console.log('=' .repeat(70));
    
    const workspaceRoot = path.join(__dirname, '..', 'test-fixtures', 'java');
    const detector = new JavaNullSafetyDetector(workspaceRoot);
    
    console.log(`📁 Workspace: ${workspaceRoot}\n`);
    
    try {
        const startTime = Date.now();
        const issues = await detector.detect();
        const endTime = Date.now();
        
        console.log(`\n📊 Results:`);
        console.log(`⏱️  Analysis time: ${endTime - startTime}ms`);
        console.log(`🔍 Issues found: ${issues.length}\n`);
        
        if (issues.length === 0) {
            console.log('✅ No null safety issues detected!\n');
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
            
            for (const issue of categoryIssues.slice(0, 10)) { // Show first 10
                console.log(`\n  ${getSeverityIcon(issue.severity)} Line ${issue.line}: ${issue.message}`);
                if (issue.recommendation) {
                    console.log(`     💡 ${issue.recommendation}`);
                }
                if (issue.code) {
                    console.log(`     🏷️  Code: ${issue.code}`);
                }
            }
            
            if (categoryIssues.length > 10) {
                console.log(`\n  ... and ${categoryIssues.length - 10} more issues`);
            }
        }
        
        // Show top 5 issues with auto-fix
        const fixableIssues = issues.filter(i => i.autoFix);
        if (fixableIssues.length > 0) {
            console.log(`\n\n🛠️  AUTO-FIXABLE ISSUES (${fixableIssues.length} total):`);
            console.log('='.repeat(70));
            
            for (const issue of fixableIssues.slice(0, 5)) {
                console.log(`\n  Line ${issue.line}: ${issue.message}`);
                console.log(`  🔧 ${issue.autoFix!.description}`);
                console.log(`  📝 Replacement:\n     ${issue.autoFix!.replacement}`);
            }
        }
        
        console.log('\n' + '='.repeat(70));
        console.log('✅ Java Null Safety Detector test complete!\n');
        
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

testJavaNullSafety();
