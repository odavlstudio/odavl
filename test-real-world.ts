/**
 * Test Python Detectors on Real-World Projects
 * Tests detectors on Django, Flask, and FastAPI samples
 */

import { 
    PythonTypeDetector, 
    PythonSecurityDetector, 
    PythonComplexityDetector, 
    PythonImportsDetector, 
    PythonBestPracticesDetector 
} from './odavl-studio/insight/core/src/detector/python/index.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testRealWorldProjects() {
    console.log('🐍 Testing Python Detectors on Real-World Projects\n');
    console.log('=' .repeat(70));

    const projects = [
        { name: 'Django Sample', path: 'test-real-world-python/django-sample' },
        { name: 'Flask Sample', path: 'test-real-world-python/flask-sample' },
        { name: 'FastAPI Sample', path: 'test-real-world-python/fastapi-sample' }
    ];

    const startTime = Date.now();
    const allResults = {
        type: [],
        security: [],
        complexity: [],
        imports: [],
        bestPractices: []
    };

    for (const project of projects) {
        console.log(`\n${'='.repeat(70)}`);
        console.log(`📁 Testing: ${project.name}`);
        console.log('='.repeat(70));

        const projectPath = path.join(__dirname, project.path);
        console.log(`Path: ${projectPath}\n`);

        // Test 1: Type Detector
        console.log('📝 Type Detector (MyPy)');
        console.log('-'.repeat(70));
        try {
            const typeDetector = new PythonTypeDetector(projectPath);
            const typeIssues = await typeDetector.detect();
            allResults.type.push(...typeIssues);
            console.log(`✅ Issues found: ${typeIssues.length}`);
            if (typeIssues.length > 0) {
                console.log('Top issues:');
                typeIssues.slice(0, 3).forEach((issue, i) => {
                    console.log(`  ${i + 1}. ${issue.severity.toUpperCase()}: ${issue.message}`);
                    console.log(`     File: ${issue.file}:${issue.line}`);
                });
            }
        } catch (error) {
            console.log(`⚠️  ${error.message}`);
        }

        // Test 2: Security Detector
        console.log('\n🔒 Security Detector (Bandit)');
        console.log('-'.repeat(70));
        try {
            const securityDetector = new PythonSecurityDetector(projectPath);
            const securityIssues = await securityDetector.detect();
            allResults.security.push(...securityIssues);
            console.log(`✅ Issues found: ${securityIssues.length}`);
            
            const critical = securityIssues.filter(i => i.severity === 'critical');
            const high = securityIssues.filter(i => i.severity === 'high');
            
            console.log(`   Critical: ${critical.length}, High: ${high.length}`);
            
            if (critical.length > 0) {
                console.log('Critical issues:');
                critical.forEach((issue, i) => {
                    console.log(`  ${i + 1}. ${issue.message}`);
                    console.log(`     File: ${issue.file}:${issue.line}`);
                });
            }
        } catch (error) {
            console.log(`⚠️  ${error.message}`);
        }

        // Test 3: Complexity Detector
        console.log('\n📊 Complexity Detector (Radon)');
        console.log('-'.repeat(70));
        try {
            const complexityDetector = new PythonComplexityDetector(projectPath);
            const complexityIssues = await complexityDetector.detect();
            allResults.complexity.push(...complexityIssues);
            console.log(`✅ Issues found: ${complexityIssues.length}`);
            if (complexityIssues.length > 0) {
                console.log('Complex functions:');
                complexityIssues.forEach((issue, i) => {
                    console.log(`  ${i + 1}. ${issue.message}`);
                    console.log(`     File: ${issue.file}:${issue.line}`);
                });
            }
        } catch (error) {
            console.log(`⚠️  ${error.message}`);
        }

        // Test 4: Imports Detector
        console.log('\n📦 Imports Detector (isort)');
        console.log('-'.repeat(70));
        try {
            const importsDetector = new PythonImportsDetector(projectPath);
            const importsIssues = await importsDetector.detect();
            allResults.imports.push(...importsIssues);
            console.log(`✅ Issues found: ${importsIssues.length}`);
        } catch (error) {
            console.log(`⚠️  ${error.message}`);
        }

        // Test 5: Best Practices Detector
        console.log('\n✨ Best Practices Detector (Pylint)');
        console.log('-'.repeat(70));
        try {
            const bestPracticesDetector = new PythonBestPracticesDetector(projectPath);
            const bestPracticesIssues = await bestPracticesDetector.detect();
            allResults.bestPractices.push(...bestPracticesIssues);
            console.log(`✅ Issues found: ${bestPracticesIssues.length}`);
        } catch (error) {
            console.log(`⚠️  ${error.message}`);
        }
    }

    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;

    // Summary
    console.log('\n' + '='.repeat(70));
    console.log('📊 Overall Test Summary');
    console.log('='.repeat(70));
    
    const totalIssues = Object.values(allResults).reduce((sum, issues) => sum + issues.length, 0);
    
    console.log(`\nTotal Issues Found: ${totalIssues}`);
    console.log(`  - Type Issues: ${allResults.type.length}`);
    console.log(`  - Security Issues: ${allResults.security.length}`);
    console.log(`  - Complexity Issues: ${allResults.complexity.length}`);
    console.log(`  - Import Issues: ${allResults.imports.length}`);
    console.log(`  - Best Practices Issues: ${allResults.bestPractices.length}`);
    
    console.log(`\n⏱️  Total Analysis Time: ${duration.toFixed(2)}s`);
    console.log(`   Average per project: ${(duration / projects.length).toFixed(2)}s`);
    
    // Severity breakdown
    const securityBySeverity = {
        critical: allResults.security.filter(i => i.severity === 'critical').length,
        high: allResults.security.filter(i => i.severity === 'high').length,
        medium: allResults.security.filter(i => i.severity === 'medium').length,
        low: allResults.security.filter(i => i.severity === 'low').length
    };
    
    console.log(`\n🔒 Security Issues Breakdown:`);
    console.log(`   Critical: ${securityBySeverity.critical}`);
    console.log(`   High: ${securityBySeverity.high}`);
    console.log(`   Medium: ${securityBySeverity.medium}`);
    console.log(`   Low: ${securityBySeverity.low}`);
    
    // Performance metrics
    const filesAnalyzed = projects.length * 3; // Rough estimate
    console.log(`\n📈 Performance Metrics:`);
    console.log(`   Files Analyzed: ~${filesAnalyzed}`);
    console.log(`   Analysis Speed: ${(filesAnalyzed / duration).toFixed(2)} files/sec`);
    
    console.log('\n' + '='.repeat(70));
    console.log('✅ Real-World Testing Complete!');
    console.log('='.repeat(70));
}

testRealWorldProjects().catch(console.error);
