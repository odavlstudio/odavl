#!/usr/bin/env node
/**
 * ODAVL Forensic Report Aggregator
 * Collects all forensic data and generates summary metrics
 */

import { readFileSync, writeFileSync, existsSync } from 'fs'
import { resolve } from 'path'

const FORENSIC_DIR = 'reports/forensic/_last'

function loadJsonSafe(filepath) {
  try {
    if (!existsSync(filepath)) return null
    return JSON.parse(readFileSync(filepath, 'utf-8'))
  } catch (error) {
    console.warn(`Failed to load ${filepath}:`, error.message)
    return null
  }
}

function loadTextSafe(filepath) {
  try {
    if (!existsSync(filepath)) return ''
    return readFileSync(filepath, 'utf-8')
  } catch (error) {
    console.warn(`Failed to load ${filepath}:`, error.message)
    return ''
  }
}

function calculateScores(metrics) {
  const scores = {}
  
  // Type Safety (0-10): Based on TypeScript errors
  scores.typeSafety = Math.max(0, 10 - metrics.typeErrors)
  
  // Lint Hygiene (0-10): Based on ESLint issues
  const lintIssues = metrics.eslintErrors + metrics.eslintWarnings
  scores.lintHygiene = Math.max(0, 10 - Math.min(10, lintIssues / 5))
  
  // Security (0-10): Based on audit findings
  scores.security = Math.max(0, 10 - metrics.securityIssues)
  
  // Test Coverage (0-10): Based on coverage percentage
  scores.testCoverage = Math.round(metrics.coveragePercent / 10)
  
  // Code Quality (0-10): Combined metric
  scores.codeQuality = Math.round((scores.typeSafety + scores.lintHygiene) / 2)
  
  return scores
}

function main() {
  console.log('🔍 ODAVL Forensic Aggregator Starting...')
  
  const metrics = {
    timestamp: new Date().toISOString(),
    typeErrors: 0,
    eslintErrors: 0,
    eslintWarnings: 0,
    prettierIssues: 0,
    securityIssues: 0,
    coveragePercent: 0,
    testsPassed: 0,
    testsFailed: 0
  }
  
  // Load ESLint results
  const eslintData = loadJsonSafe(resolve(FORENSIC_DIR, 'eslint.json'))
  if (eslintData && Array.isArray(eslintData)) {
    metrics.eslintErrors = eslintData.reduce((sum, file) => 
      sum + file.messages?.filter(m => m.severity === 2).length || 0, 0)
    metrics.eslintWarnings = eslintData.reduce((sum, file) => 
      sum + file.messages?.filter(m => m.severity === 1).length || 0, 0)
  }
  
  // Load TypeScript errors
  const tscOutput = loadTextSafe(resolve(FORENSIC_DIR, 'tsc.txt'))
  const tscErrorMatches = tscOutput.match(/error TS\d+:/g)
  metrics.typeErrors = tscErrorMatches?.length || 0
  
  // Load Prettier issues
  const prettierOutput = loadTextSafe(resolve(FORENSIC_DIR, 'prettier.txt'))
  metrics.prettierIssues = prettierOutput.split('\n').filter(line => line.trim()).length
  
  // Load test coverage
  const coverageData = loadJsonSafe(resolve(FORENSIC_DIR, 'tests/coverage-summary.json'))
  if (coverageData?.total?.lines) {
    metrics.coveragePercent = coverageData.total.lines.pct || 0
  }
  
  // Calculate scores
  const scores = calculateScores(metrics)
  
  // Calculate weighted ODAVL score
  const weights = {
    typeSafety: 0.25,
    lintHygiene: 0.20,
    security: 0.20,
    testCoverage: 0.20,
    codeQuality: 0.15
  }
  
  const odavlScore = Object.entries(weights).reduce((sum, [key, weight]) => {
    return sum + (scores[key] || 0) * weight
  }, 0)
  
  const finalReport = {
    metadata: {
      timestamp: metrics.timestamp,
      version: '1.0.0',
      generator: 'ODAVL Forensic Aggregator'
    },
    metrics,
    scores: { ...scores, odavlScore: Math.round(odavlScore * 10) / 10 },
    weights
  }
  
  // Write results
  writeFileSync(
    resolve(FORENSIC_DIR, 'metrics.json'),
    JSON.stringify(metrics, null, 2)
  )
  
  writeFileSync(
    resolve(FORENSIC_DIR, 'scores.json'),
    JSON.stringify(finalReport, null, 2)
  )
  
  // Summary output
  console.log('📊 Forensic Analysis Complete')
  console.log(`┌─ Type Safety: ${scores.typeSafety}/10`)
  console.log(`├─ Lint Hygiene: ${scores.lintHygiene}/10`)
  console.log(`├─ Security: ${scores.security}/10`)
  console.log(`├─ Test Coverage: ${scores.testCoverage}/10`)
  console.log(`├─ Code Quality: ${scores.codeQuality}/10`)
  console.log(`└─ ODAVL Score: ${finalReport.scores.odavlScore}/10`)
  
  console.log(`\n📁 Results saved to: ${FORENSIC_DIR}/`)
}

main()