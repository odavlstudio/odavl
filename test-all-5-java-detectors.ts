/**
 * Test All 5 Java Detectors Together
 * 
 * Tests Complexity, Stream, Exception, Memory, Spring
 */

import { JavaComplexityDetector } from './odavl-studio/insight/core/src/detector/java/java-complexity-detector.js';
import { JavaStreamDetector } from './odavl-studio/insight/core/src/detector/java/java-stream-detector.js';
import { JavaExceptionDetector } from './odavl-studio/insight/core/src/detector/java/java-exception-detector.js';
import { JavaMemoryDetector } from './odavl-studio/insight/core/src/detector/java/java-memory-detector.js';
import { JavaSpringDetector } from './odavl-studio/insight/core/src/detector/java/java-spring-detector.js';
import * as path from 'path';

interface TestResult {
    detector: string;
    issues: number;
    time: number;
    severities: { error: number; warning: number; info: number };
}

async function testAll5JavaDetectors() {
    console.log('🔍 Testing All 5 Java Detectors');
    console.log('='.repeat(70));

    const workspace = path.resolve('test-fixtures/java');
    console.log(`📁 Workspace: ${workspace}\n`);

    const results: TestResult[] = [];

    // Test 1: Complexity Detector
    console.log('1️⃣  Testing Complexity Detector...');
    const complexityDetector = new JavaComplexityDetector(workspace);
    const t1 = Date.now();
    const complexityIssues = await complexityDetector.detect();
    const complexityTime = Date.now() - t1;
    results.push({
        detector: 'Complexity',
        issues: complexityIssues.length,
        time: complexityTime,
        severities: {
            error: complexityIssues.filter(i => i.severity === 'error').length,
            warning: complexityIssues.filter(i => i.severity === 'warning').length,
            info: complexityIssues.filter(i => i.severity === 'info').length,
        },
    });
    console.log(`   ✅ ${complexityIssues.length} issues in ${complexityTime}ms\n`);

    // Test 2: Stream API Detector
    console.log('2️⃣  Testing Stream API Detector...');
    const streamDetector = new JavaStreamDetector(workspace);
    const t2 = Date.now();
    const streamIssues = await streamDetector.detect();
    const streamTime = Date.now() - t2;
    results.push({
        detector: 'Stream API',
        issues: streamIssues.length,
        time: streamTime,
        severities: {
            error: streamIssues.filter(i => i.severity === 'error').length,
            warning: streamIssues.filter(i => i.severity === 'warning').length,
            info: streamIssues.filter(i => i.severity === 'info').length,
        },
    });
    console.log(`   ✅ ${streamIssues.length} issues in ${streamTime}ms\n`);

    // Test 3: Exception Detector
    console.log('3️⃣  Testing Exception Detector...');
    const exceptionDetector = new JavaExceptionDetector(workspace);
    const t3 = Date.now();
    const exceptionIssues = await exceptionDetector.detect();
    const exceptionTime = Date.now() - t3;
    results.push({
        detector: 'Exception Handling',
        issues: exceptionIssues.length,
        time: exceptionTime,
        severities: {
            error: exceptionIssues.filter(i => i.severity === 'error').length,
            warning: exceptionIssues.filter(i => i.severity === 'warning').length,
            info: exceptionIssues.filter(i => i.severity === 'info').length,
        },
    });
    console.log(`   ✅ ${exceptionIssues.length} issues in ${exceptionTime}ms\n`);

    // Test 4: Memory Detector
    console.log('4️⃣  Testing Memory Detector...');
    const memoryDetector = new JavaMemoryDetector(workspace);
    const t4 = Date.now();
    const memoryIssues = await memoryDetector.detect();
    const memoryTime = Date.now() - t4;
    results.push({
        detector: 'Memory & Resources',
        issues: memoryIssues.length,
        time: memoryTime,
        severities: {
            error: memoryIssues.filter(i => i.severity === 'error').length,
            warning: memoryIssues.filter(i => i.severity === 'warning').length,
            info: memoryIssues.filter(i => i.severity === 'info').length,
        },
    });
    console.log(`   ✅ ${memoryIssues.length} issues in ${memoryTime}ms\n`);

    // Test 5: Spring Boot Detector
    console.log('5️⃣  Testing Spring Boot Detector...');
    const springDetector = new JavaSpringDetector(workspace);
    const t5 = Date.now();
    const springIssues = await springDetector.detect();
    const springTime = Date.now() - t5;
    results.push({
        detector: 'Spring Boot',
        issues: springIssues.length,
        time: springTime,
        severities: {
            error: springIssues.filter(i => i.severity === 'error').length,
            warning: springIssues.filter(i => i.severity === 'warning').length,
            info: springIssues.filter(i => i.severity === 'info').length,
        },
    });
    console.log(`   ✅ ${springIssues.length} issues in ${springTime}ms\n`);

    // Summary
    console.log('='.repeat(70));
    console.log('📊 Summary:');
    console.log('='.repeat(70));

    const totalIssues = results.reduce((sum, r) => sum + r.issues, 0);
    const totalTime = results.reduce((sum, r) => sum + r.time, 0);
    const totalErrors = results.reduce((sum, r) => sum + r.severities.error, 0);
    const totalWarnings = results.reduce((sum, r) => sum + r.severities.warning, 0);
    const totalInfo = results.reduce((sum, r) => sum + r.severities.info, 0);

    console.log(`\n🔍 Total Issues: ${totalIssues}`);
    console.log(`   🔴 Errors: ${totalErrors}`);
    console.log(`   🟡 Warnings: ${totalWarnings}`);
    console.log(`   🔵 Info: ${totalInfo}\n`);

    console.log(`⏱️  Total Analysis Time: ${totalTime}ms`);
    console.log(`   Average per detector: ${(totalTime / results.length).toFixed(1)}ms\n`);

    console.log('📈 Performance Metrics:');
    console.log('-'.repeat(70));
    for (const result of results) {
        console.log(`   ${result.detector.padEnd(22)} ${result.issues.toString().padStart(3)} issues   ${result.time.toString().padStart(4)}ms`);
    }
    console.log('-'.repeat(70));

    // Performance assessment
    const targetTime = 150; // Target: < 150ms total for 5 detectors
    const performanceRating = totalTime <= targetTime ? '✅ EXCELLENT' : totalTime <= 250 ? '✔️  GOOD' : '⚠️  NEEDS IMPROVEMENT';
    const speedImprovement = ((targetTime - totalTime) / targetTime * 100).toFixed(0);

    console.log(`\n🎯 Performance Target: < ${targetTime}ms`);
    console.log(`   Actual: ${totalTime}ms`);
    console.log(`   Rating: ${performanceRating}`);
    if (totalTime <= targetTime) {
        console.log(`   🚀 ${speedImprovement}% faster than target!`);
    }

    // Detection coverage
    console.log('\n📋 Detection Coverage:');
    console.log('-'.repeat(70));
    console.log(`   Code Quality:       ${complexityIssues.length} issues (complexity, long methods)`);
    console.log(`   Modernization:      ${streamIssues.length} issues (streams, functional style)`);
    console.log(`   Exception Safety:   ${exceptionIssues.length} issues (proper error handling)`);
    console.log(`   Memory Management:  ${memoryIssues.length} issues (leaks, efficiency)`);
    console.log(`   Spring Best Practice: ${springIssues.length} issues (DI, transactions, REST)`);
    console.log('-'.repeat(70));

    console.log('\n' + '='.repeat(70));
    console.log('✅ All 5 Java Detectors test complete!');
    console.log('='.repeat(70));

    return { results, totalIssues, totalTime };
}

testAll5JavaDetectors().catch(console.error);
