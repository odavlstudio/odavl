/**
 * Test Python Support
 * Run: pnpm exec tsx test-python-support.ts
 */

import { PythonTypeDetector } from './odavl-studio/insight/core/src/detector/python-type-detector.js';
import { PythonSecurityDetector } from './odavl-studio/insight/core/src/detector/python-security-detector.js';
import { PythonComplexityDetector } from './odavl-studio/insight/core/src/detector/python-complexity-detector.js';

// ANSI colors
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';
const GREEN = '\x1b[32m';
const MAGENTA = '\x1b[35m';
const WHITE = '\x1b[97m';
const GRAY = '\x1b[90m';
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';

async function testPythonSupport() {
  console.log(`${CYAN}${BOLD}🐍 Testing Python Language Support...${RESET}\n`);

  const workspaceRoot = process.cwd();

  console.log(`${WHITE}📂 Workspace: ${workspaceRoot}${RESET}`);
  console.log(`${WHITE}⏳ Running Python detectors...${RESET}\n`);

  try {
    // Test 1: Type Checker
    console.log(`${BOLD}${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}`);
    console.log(`${BOLD}${CYAN}1️⃣  PYTHON TYPE CHECKER${RESET}`);
    console.log(`${BOLD}${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}\n`);

    const typeDetector = new PythonTypeDetector(workspaceRoot);
    const typeIssues = await typeDetector.detect();

    console.log(`${WHITE}Found ${BOLD}${typeIssues.length}${RESET}${WHITE} type issues${RESET}\n`);

    const typesByCategory = {
      'missing-hint': typeIssues.filter(i => i.category === 'missing-hint').length,
      'invalid-type': typeIssues.filter(i => i.category === 'invalid-type').length,
      'type-mismatch': typeIssues.filter(i => i.category === 'type-mismatch').length,
      'optional-issue': typeIssues.filter(i => i.category === 'optional-issue').length,
    };

    console.log(`${GRAY}By Category:${RESET}`);
    console.log(`   ${WHITE}Missing Type Hints: ${typesByCategory['missing-hint']}${RESET}`);
    console.log(`   ${WHITE}Invalid Types: ${typesByCategory['invalid-type']}${RESET}`);
    console.log(`   ${WHITE}Type Mismatches: ${typesByCategory['type-mismatch']}${RESET}`);
    console.log(`   ${WHITE}Optional Issues: ${typesByCategory['optional-issue']}${RESET}\n`);

    // Show top 5 type issues
    if (typeIssues.length > 0) {
      console.log(`${YELLOW}Top 5 Type Issues:${RESET}\n`);
      
      for (let i = 0; i < Math.min(5, typeIssues.length); i++) {
        const issue = typeIssues[i];
        const severityColor = getSeverityColor(issue.severity);
        
        console.log(`${i + 1}. ${severityColor}[${issue.severity.toUpperCase()}]${RESET} ${issue.message}`);
        console.log(`   ${GRAY}📄 ${issue.file}:${issue.line}${RESET}`);
        if (issue.suggestion) {
          console.log(`   ${GREEN}💡 ${issue.suggestion}${RESET}`);
        }
        console.log();
      }
    }

    // Test 2: Security Scanner
    console.log(`${BOLD}${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}`);
    console.log(`${BOLD}${CYAN}2️⃣  PYTHON SECURITY SCANNER (Bandit)${RESET}`);
    console.log(`${BOLD}${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}\n`);

    const securityDetector = new PythonSecurityDetector(workspaceRoot);
    const securityIssues = await securityDetector.detect();

    console.log(`${WHITE}Found ${BOLD}${securityIssues.length}${RESET}${WHITE} security issues${RESET}\n`);

    const securityByCategory = {
      injection: securityIssues.filter(i => i.category === 'injection').length,
      crypto: securityIssues.filter(i => i.category === 'crypto').length,
      secrets: securityIssues.filter(i => i.category === 'secrets').length,
      deserialization: securityIssues.filter(i => i.category === 'deserialization').length,
      other: securityIssues.filter(i => i.category === 'other').length,
    };

    const securityBySeverity = {
      critical: securityIssues.filter(i => i.severity === 'critical').length,
      high: securityIssues.filter(i => i.severity === 'high').length,
      medium: securityIssues.filter(i => i.severity === 'medium').length,
      low: securityIssues.filter(i => i.severity === 'low').length,
    };

    console.log(`${GRAY}By Severity:${RESET}`);
    console.log(`   ${RED}Critical: ${securityBySeverity.critical}${RESET}`);
    console.log(`   ${YELLOW}High: ${securityBySeverity.high}${RESET}`);
    console.log(`   ${MAGENTA}Medium: ${securityBySeverity.medium}${RESET}`);
    console.log(`   ${CYAN}Low: ${securityBySeverity.low}${RESET}\n`);

    console.log(`${GRAY}By Category:${RESET}`);
    console.log(`   ${WHITE}Injection: ${securityByCategory.injection}${RESET}`);
    console.log(`   ${WHITE}Cryptography: ${securityByCategory.crypto}${RESET}`);
    console.log(`   ${WHITE}Secrets: ${securityByCategory.secrets}${RESET}`);
    console.log(`   ${WHITE}Deserialization: ${securityByCategory.deserialization}${RESET}`);
    console.log(`   ${WHITE}Other: ${securityByCategory.other}${RESET}\n`);

    // Show top 5 security issues
    if (securityIssues.length > 0) {
      console.log(`${RED}${BOLD}🚨 Top 5 Security Issues:${RESET}\n`);
      
      const sortedSecurity = securityIssues.sort((a, b) => {
        const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        return severityOrder[a.severity] - severityOrder[b.severity];
      });

      for (let i = 0; i < Math.min(5, sortedSecurity.length); i++) {
        const issue = sortedSecurity[i];
        const severityColor = getSeverityColor(issue.severity);
        
        console.log(`${i + 1}. ${severityColor}[${issue.severity.toUpperCase()}]${RESET} ${issue.message}`);
        console.log(`   ${GRAY}📄 ${issue.file}:${issue.line}${RESET}`);
        if (issue.cwe) {
          console.log(`   ${GRAY}🔗 ${issue.cwe}${RESET}`);
        }
        if (issue.owasp) {
          console.log(`   ${GRAY}🛡️  OWASP: ${issue.owasp}${RESET}`);
        }
        console.log(`   ${GREEN}💡 ${issue.recommendation}${RESET}`);
        console.log();
      }
    }

    // Test 3: Complexity Analyzer
    console.log(`${BOLD}${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}`);
    console.log(`${BOLD}${CYAN}3️⃣  PYTHON COMPLEXITY ANALYZER${RESET}`);
    console.log(`${BOLD}${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}\n`);

    const complexityDetector = new PythonComplexityDetector(workspaceRoot);
    const complexityIssues = await complexityDetector.detect();

    console.log(`${WHITE}Found ${BOLD}${complexityIssues.length}${RESET}${WHITE} complexity issues${RESET}\n`);

    const complexityByCategory = {
      cyclomatic: complexityIssues.filter(i => i.category === 'cyclomatic').length,
      cognitive: complexityIssues.filter(i => i.category === 'cognitive').length,
      length: complexityIssues.filter(i => i.category === 'length').length,
      nesting: complexityIssues.filter(i => i.category === 'nesting').length,
    };

    console.log(`${GRAY}By Category:${RESET}`);
    console.log(`   ${WHITE}Cyclomatic Complexity: ${complexityByCategory.cyclomatic}${RESET}`);
    console.log(`   ${WHITE}Cognitive Complexity: ${complexityByCategory.cognitive}${RESET}`);
    console.log(`   ${WHITE}Long Functions/Classes: ${complexityByCategory.length}${RESET}`);
    console.log(`   ${WHITE}Deep Nesting: ${complexityByCategory.nesting}${RESET}\n`);

    // Show top 5 complexity issues
    if (complexityIssues.length > 0) {
      console.log(`${MAGENTA}Top 5 Complexity Issues:${RESET}\n`);
      
      const sortedComplexity = complexityIssues.sort((a, b) => b.complexity - a.complexity);

      for (let i = 0; i < Math.min(5, sortedComplexity.length); i++) {
        const issue = sortedComplexity[i];
        const severityColor = getSeverityColor(issue.severity);
        
        console.log(`${i + 1}. ${severityColor}[${issue.severity.toUpperCase()}]${RESET} ${issue.message}`);
        console.log(`   ${GRAY}📄 ${issue.file}:${issue.line}${RESET}`);
        console.log(`   ${WHITE}Complexity: ${BOLD}${issue.complexity}${RESET}${WHITE} (threshold: ${issue.threshold})${RESET}`);
        console.log(`   ${GREEN}💡 ${issue.suggestion}${RESET}`);
        console.log();
      }
    }

    // Overall summary
    console.log(`${BOLD}${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}`);
    console.log(`${BOLD}${CYAN}📊 PYTHON ANALYSIS SUMMARY${RESET}`);
    console.log(`${BOLD}${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}\n`);

    const totalIssues = typeIssues.length + securityIssues.length + complexityIssues.length;
    const criticalIssues = securityBySeverity.critical;

    console.log(`${WHITE}Total Issues: ${BOLD}${totalIssues}${RESET}`);
    console.log(`   ${CYAN}Type Issues: ${typeIssues.length}${RESET}`);
    console.log(`   ${RED}Security Issues: ${securityIssues.length}${RESET}`);
    console.log(`   ${MAGENTA}Complexity Issues: ${complexityIssues.length}${RESET}\n`);

    if (criticalIssues > 0) {
      console.log(`${RED}${BOLD}⚠️  ${criticalIssues} CRITICAL security issues found!${RESET}`);
      console.log(`${RED}   Address these immediately before deploying.${RESET}\n`);
    }

    // Calculate Python code quality score
    const qualityScore = calculateQualityScore(typeIssues.length, securityIssues, complexityIssues.length);
    const scoreColor = getScoreColor(qualityScore);
    const scoreEmoji = getScoreEmoji(qualityScore);

    console.log(`${scoreColor}${BOLD}${scoreEmoji} Python Code Quality Score: ${qualityScore}/100${RESET}`);
    console.log(`${WHITE}${getScoreDescription(qualityScore)}${RESET}\n`);

    console.log(`${GREEN}${BOLD}✅ Python support testing complete!${RESET}\n`);

  } catch (error) {
    console.error(`${RED}${BOLD}❌ Error during Python analysis:${RESET}`);
    console.error(error);
  }
}

function getSeverityColor(severity: string): string {
  switch (severity.toLowerCase()) {
    case 'critical': return RED;
    case 'error': return RED;
    case 'high': return YELLOW;
    case 'warning': return YELLOW;
    case 'medium': return MAGENTA;
    case 'info': return CYAN;
    case 'low': return CYAN;
    default: return WHITE;
  }
}

function calculateQualityScore(typeIssues: number, securityIssues: any[], complexityIssues: number): number {
  let score = 100;

  // Type issues penalty
  score -= Math.min(typeIssues * 1, 20);

  // Security issues penalty (more severe)
  const criticalSec = securityIssues.filter(i => i.severity === 'critical').length;
  const highSec = securityIssues.filter(i => i.severity === 'high').length;
  score -= criticalSec * 15;
  score -= highSec * 10;
  score -= Math.min((securityIssues.length - criticalSec - highSec) * 3, 20);

  // Complexity issues penalty
  score -= Math.min(complexityIssues * 2, 15);

  return Math.max(0, Math.round(score));
}

function getScoreColor(score: number): string {
  if (score >= 90) return GREEN;
  if (score >= 75) return CYAN;
  if (score >= 60) return YELLOW;
  if (score >= 40) return MAGENTA;
  return RED;
}

function getScoreEmoji(score: number): string {
  if (score >= 90) return '🏆';
  if (score >= 75) return '✨';
  if (score >= 60) return '👍';
  if (score >= 40) return '⚠️';
  return '🚨';
}

function getScoreDescription(score: number): string {
  if (score >= 90) return 'Excellent! High-quality Python code.';
  if (score >= 75) return 'Good code quality with minor issues.';
  if (score >= 60) return 'Acceptable, but improvements needed.';
  if (score >= 40) return 'Poor quality. Significant refactoring required.';
  return 'Critical issues! Immediate action required.';
}

// Run test
testPythonSupport().catch(console.error);
