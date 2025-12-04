/**
 * Test Python Detectors
 * Manual test script to verify Python detectors work correctly
 */

import { 
    PythonTypeDetector, 
    PythonSecurityDetector, 
    PythonComplexityDetector, 
    PythonImportsDetector, 
    PythonBestPracticesDetector 
} from './odavl-studio/insight/core/dist/detector/index.mjs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testPythonDetectors() {
    console.log('🐍 Testing Python Detectors\n');
    console.log('=' .repeat(60));

    const testDir = path.join(__dirname, 'test-fixtures', 'python');
    console.log(`Test Directory: ${testDir}\n`);

    // Test 1: Type Detector
    console.log('\n📝 Test 1: Python Type Detector');
    console.log('-'.repeat(60));
    try {
        const typeDetector = new PythonTypeDetector(testDir);
        const typeIssues = await typeDetector.detect();
        console.log(`✅ Issues found: ${typeIssues.length}`);
        if (typeIssues.length > 0) {
            console.log('Sample issues:');
            typeIssues.slice(0, 3).forEach(issue => {
                console.log(`  - ${issue.severity.toUpperCase()}: ${issue.message}`);
                console.log(`    File: ${issue.file}:${issue.line}`);
            });
        }
    } catch (error) {
        console.log(`⚠️  ${error.message}`);
    }

    // Test 2: Security Detector
    console.log('\n🔒 Test 2: Python Security Detector');
    console.log('-'.repeat(60));
    try {
        const securityDetector = new PythonSecurityDetector(testDir);
        const securityIssues = await securityDetector.detect();
        console.log(`✅ Issues found: ${securityIssues.length}`);
        if (securityIssues.length > 0) {
            console.log('Sample issues:');
            securityIssues.slice(0, 3).forEach(issue => {
                console.log(`  - ${issue.severity.toUpperCase()}: ${issue.message}`);
                console.log(`    File: ${issue.file}:${issue.line}`);
            });
        }
    } catch (error) {
        console.log(`⚠️  ${error.message}`);
    }

    // Test 3: Complexity Detector
    console.log('\n📊 Test 3: Python Complexity Detector');
    console.log('-'.repeat(60));
    try {
        const complexityDetector = new PythonComplexityDetector(testDir);
        const complexityIssues = await complexityDetector.detect();
        console.log(`✅ Issues found: ${complexityIssues.length}`);
        if (complexityIssues.length > 0) {
            console.log('Sample issues:');
            complexityIssues.slice(0, 3).forEach(issue => {
                console.log(`  - ${issue.severity.toUpperCase()}: ${issue.message}`);
                console.log(`    File: ${issue.file}:${issue.line}`);
            });
        }
    } catch (error) {
        console.log(`⚠️  ${error.message}`);
    }

    // Test 4: Imports Detector
    console.log('\n📦 Test 4: Python Imports Detector');
    console.log('-'.repeat(60));
    try {
        const importsDetector = new PythonImportsDetector(testDir);
        const importsIssues = await importsDetector.detect();
        console.log(`✅ Issues found: ${importsIssues.length}`);
        if (importsIssues.length > 0) {
            console.log('Sample issues:');
            importsIssues.slice(0, 3).forEach(issue => {
                console.log(`  - ${issue.severity.toUpperCase()}: ${issue.message}`);
                console.log(`    File: ${issue.file}:${issue.line}`);
            });
        }
    } catch (error) {
        console.log(`⚠️  ${error.message}`);
    }

    // Test 5: Best Practices Detector
    console.log('\n✨ Test 5: Python Best Practices Detector');
    console.log('-'.repeat(60));
    try {
        const practicesDetector = new PythonBestPracticesDetector(testDir);
        const practicesIssues = await practicesDetector.detect();
        console.log(`✅ Issues found: ${practicesIssues.length}`);
        if (practicesIssues.length > 0) {
            console.log('Sample issues:');
            practicesIssues.slice(0, 3).forEach(issue => {
                console.log(`  - ${issue.severity.toUpperCase()}: ${issue.message}`);
                console.log(`    File: ${issue.file}:${issue.line}`);
            });
        }
    } catch (error) {
        console.log(`⚠️  ${error.message}`);
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('🎉 Python Detectors Test Complete!');
    console.log('='.repeat(60));
}

testPythonDetectors().catch(console.error);
