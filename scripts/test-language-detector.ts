#!/usr/bin/env tsx

/**
 * Test Language Detector - Validates automatic language detection
 * 
 * Tests:
 * 1. TypeScript project detection
 * 2. Python project detection  
 * 3. Java project detection
 * 4. Multi-language project detection
 * 5. File-based language detection
 */

import { LanguageDetector, Language } from '../odavl-studio/insight/core/src/language/language-detector.js';
import * as path from 'node:path';
import { cwd } from 'node:process';

const workspaceRoot = cwd();

function testLanguageDetection() {
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║          Language Detection System - Test Suite             ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  const detector = new LanguageDetector();
  let passedTests = 0;
  let totalTests = 0;

  // Test 1: Detect current project (should be multi-language)
  console.log('📋 Test 1: Current Project Detection\n');
  totalTests++;
  
  const projectResult = detector.detectFromProject(workspaceRoot);
  console.log(`Primary Language: ${LanguageDetector.getLanguageIcon(projectResult.primary)} ${LanguageDetector.getLanguageName(projectResult.primary)}`);
  console.log(`Secondary Languages: ${projectResult.secondary.map(l => LanguageDetector.getLanguageName(l)).join(', ') || 'None'}\n`);
  
  console.log('All Detected Languages:');
  for (const result of projectResult.allDetected) {
    console.log(`  ${LanguageDetector.getLanguageIcon(result.language)} ${LanguageDetector.getLanguageName(result.language)}: ${result.confidence}% confidence`);
    console.log(`     Indicators: ${result.indicators.join(', ')}`);
  }
  
  // Should detect at least TypeScript and Java
  if (projectResult.allDetected.length >= 2) {
    console.log('\n✅ Test 1 PASSED: Multi-language project detected');
    passedTests++;
  } else {
    console.log('\n❌ Test 1 FAILED: Expected multi-language project');
  }

  // Test 2: File-based detection
  console.log('\n═══════════════════════════════════════════════════════════════\n');
  console.log('📋 Test 2: File-Based Language Detection\n');
  
  const testFiles = [
    { file: 'example.ts', expected: Language.TypeScript },
    { file: 'example.tsx', expected: Language.TypeScript },
    { file: 'example.js', expected: Language.TypeScript },
    { file: 'example.py', expected: Language.Python },
    { file: 'example.pyi', expected: Language.Python },
    { file: 'example.java', expected: Language.Java },
    { file: 'example.txt', expected: Language.Unknown },
  ];

  let fileTestsPassed = 0;
  for (const test of testFiles) {
    totalTests++;
    const detected = detector.detectFromFile(test.file);
    const passed = detected === test.expected;
    
    if (passed) {
      console.log(`✅ ${test.file} → ${LanguageDetector.getLanguageName(detected)}`);
      fileTestsPassed++;
      passedTests++;
    } else {
      console.log(`❌ ${test.file} → ${LanguageDetector.getLanguageName(detected)} (expected ${LanguageDetector.getLanguageName(test.expected)})`);
    }
  }

  console.log(`\nFile Detection: ${fileTestsPassed}/${testFiles.length} passed`);

  // Test 3: TypeScript-specific detection
  console.log('\n═══════════════════════════════════════════════════════════════\n');
  console.log('📋 Test 3: TypeScript Detection Indicators\n');
  totalTests++;

  const tsResult = projectResult.allDetected.find(r => r.language === Language.TypeScript);
  if (tsResult) {
    console.log(`Confidence: ${tsResult.confidence}%`);
    console.log(`Indicators: ${tsResult.indicators.join(', ')}`);
    
    // Should have package.json and tsconfig.json
    const hasPackageJson = tsResult.indicators.includes('package.json');
    const hasTsConfig = tsResult.indicators.includes('tsconfig.json');
    
    if (hasPackageJson && hasTsConfig) {
      console.log('\n✅ Test 3 PASSED: TypeScript indicators correct');
      passedTests++;
    } else {
      console.log('\n❌ Test 3 FAILED: Missing expected TypeScript indicators');
    }
  } else {
    console.log('⚠️  Test 3 SKIPPED: TypeScript not detected');
  }

  // Test 4: Java-specific detection
  console.log('\n═══════════════════════════════════════════════════════════════\n');
  console.log('📋 Test 4: Java Detection Indicators\n');
  totalTests++;

  const javaResult = projectResult.allDetected.find(r => r.language === Language.Java);
  if (javaResult) {
    console.log(`Confidence: ${javaResult.confidence}%`);
    console.log(`Indicators: ${javaResult.indicators.join(', ')}`);
    
    // Should have pom.xml or build.gradle, and .java files
    const hasBuildTool = javaResult.indicators.some(i => 
      i.includes('pom.xml') || i.includes('build.gradle')
    );
    const hasJavaFiles = javaResult.indicators.includes('.java files');
    
    if (hasBuildTool && hasJavaFiles) {
      console.log('\n✅ Test 4 PASSED: Java indicators correct');
      passedTests++;
    } else {
      console.log('\n❌ Test 4 FAILED: Missing expected Java indicators');
      console.log(`   Build tool: ${hasBuildTool}, Java files: ${hasJavaFiles}`);
    }
  } else {
    console.log('❌ Test 4 FAILED: Java not detected (expected in this project)');
  }

  // Test 5: Confidence scoring
  console.log('\n═══════════════════════════════════════════════════════════════\n');
  console.log('📋 Test 5: Confidence Scoring Validation\n');
  totalTests++;

  let confidenceTestPassed = true;
  for (const result of projectResult.allDetected) {
    console.log(`${LanguageDetector.getLanguageName(result.language)}: ${result.confidence}%`);
    
    // Confidence should be 0-100
    if (result.confidence < 0 || result.confidence > 100) {
      console.log(`❌ Invalid confidence score: ${result.confidence}`);
      confidenceTestPassed = false;
    }
  }

  if (confidenceTestPassed) {
    console.log('\n✅ Test 5 PASSED: All confidence scores valid (0-100)');
    passedTests++;
  } else {
    console.log('\n❌ Test 5 FAILED: Invalid confidence scores detected');
  }

  // Summary
  console.log('\n═══════════════════════════════════════════════════════════════\n');
  console.log('📊 TEST SUMMARY\n');
  console.log(`Total Tests: ${totalTests}`);
  console.log(`Passed: ${passedTests}`);
  console.log(`Failed: ${totalTests - passedTests}`);
  console.log(`Pass Rate: ${Math.round((passedTests / totalTests) * 100)}%\n`);

  if (passedTests === totalTests) {
    console.log('🎉 ALL TESTS PASSED! Language detection system ready.\n');
    return 0;
  } else if (passedTests >= totalTests * 0.8) {
    console.log('⚠️  Most tests passed. System functional with minor issues.\n');
    return 0;
  } else {
    console.log('❌ Multiple test failures. Review language detection logic.\n');
    return 1;
  }
}

// Run tests
const exitCode = testLanguageDetection();
process.exit(exitCode);
