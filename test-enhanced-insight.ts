#!/usr/bin/env tsx
/**
 * Quick Test - Enhanced ODAVL Insight
 * Test the AI-powered analysis on studio-hub
 */

import { PerformanceDetector } from './odavl-studio/insight/core/src/detector/performance-detector.js';
import { RuntimeDetector } from './odavl-studio/insight/core/src/detector/runtime-detector.js';
import { EnhancedAnalyzer } from './odavl-studio/insight/core/src/analyzer/enhanced-analyzer.js';
import * as path from 'node:path';

const RESET = '\x1b[0m';
const CYAN = '\x1b[36m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RED = '\x1b[31m';
const BLUE = '\x1b[34m';
const MAGENTA = '\x1b[35m';
const GRAY = '\x1b[90m';
const WHITE = '\x1b[97m';
const BOLD = '\x1b[1m';

async function test() {
  console.log(`\n${CYAN}${BOLD}🚀 Testing Enhanced ODAVL Insight${RESET}\n`);

  const targetPath = path.join(process.cwd(), 'apps/studio-hub');
  const analyzer = new EnhancedAnalyzer();

  // Test Performance Detector
  console.log(`${YELLOW}⚡ Testing Performance Detector...${RESET}`);
  const perfDetector = new PerformanceDetector(targetPath);
  const perfIssues = await perfDetector.detect(targetPath);
  console.log(`${GREEN}   Found ${perfIssues.length} performance issues${RESET}\n`);

  // Test Runtime Detector
  console.log(`${YELLOW}⚙️  Testing Runtime Detector...${RESET}`);
  const runtimeDetector = new RuntimeDetector(targetPath);
  const runtimeIssues = await runtimeDetector.detect(targetPath);
  console.log(`${GREEN}   Found ${runtimeIssues.length} runtime issues${RESET}\n`);

  // Enhance the first 5 performance issues
  console.log(`${CYAN}═══════════════════════════════════════════════════════════${RESET}`);
  console.log(`${BOLD}📊 ENHANCED ANALYSIS (First 5 Performance Issues)${RESET}`);
  console.log(`${CYAN}═══════════════════════════════════════════════════════════${RESET}\n`);

  const perfToShow = perfIssues.slice(0, 5);
  for (const [i, issue] of perfToShow.entries()) {
    const enhanced = analyzer.enhanceIssue(issue, 'Performance');

    // Priority and confidence
    const priorityColor = enhanced.priority === 'critical' ? RED : 
                         enhanced.priority === 'high' ? YELLOW : 
                         enhanced.priority === 'medium' ? BLUE : GRAY;
    const confColor = enhanced.confidence >= 90 ? GREEN : 
                     enhanced.confidence >= 70 ? YELLOW : RED;

    console.log(`${RED}${i + 1}. ${issue.message}${RESET}`);
    console.log(`   ${priorityColor}[${enhanced.priority.toUpperCase()}]${RESET} ${confColor}${enhanced.confidence}% confident${RESET}`);
    console.log(`${GRAY}   📄 ${issue.file}${RESET}`);

    // Impact
    const impacts = [];
    if (enhanced.impact.security > 0) impacts.push(`${RED}Security: ${enhanced.impact.security}/10${RESET}`);
    if (enhanced.impact.performance > 0) impacts.push(`${YELLOW}Performance: ${enhanced.impact.performance}/10${RESET}`);
    if (enhanced.impact.maintainability > 0) impacts.push(`${BLUE}Maintainability: ${enhanced.impact.maintainability}/10${RESET}`);
    if (impacts.length > 0) {
      console.log(`   📊 Impact: ${impacts.join(' • ')}`);
    }

    // Root cause
    if (enhanced.rootCause) {
      console.log(`${CYAN}   🔍 ${enhanced.rootCause.substring(0, 120)}...${RESET}`);
    }

    // Smart fix
    if (enhanced.smartFix) {
      console.log(`${GREEN}   💡 ${enhanced.smartFix.split('\n')[0]}${RESET}`);
    }

    // Prevention
    if (enhanced.preventionTip) {
      console.log(`${MAGENTA}   ${enhanced.preventionTip}${RESET}`);
    }

    console.log();
  }

  // Enhance runtime issues
  console.log(`${CYAN}═══════════════════════════════════════════════════════════${RESET}`);
  console.log(`${BOLD}⚙️  ENHANCED ANALYSIS (First 5 Runtime Issues)${RESET}`);
  console.log(`${CYAN}═══════════════════════════════════════════════════════════${RESET}\n`);

  const runtimeToShow = runtimeIssues.slice(0, 5);
  for (const [i, issue] of runtimeToShow.entries()) {
    const enhanced = analyzer.enhanceIssue(issue, 'Runtime');

    const priorityColor = enhanced.priority === 'critical' ? RED : 
                         enhanced.priority === 'high' ? YELLOW : BLUE;
    const confColor = enhanced.confidence >= 90 ? GREEN : 
                     enhanced.confidence >= 70 ? YELLOW : RED;

    console.log(`${RED}${i + 1}. ${issue.message}${RESET}`);
    console.log(`   ${priorityColor}[${enhanced.priority.toUpperCase()}]${RESET} ${confColor}${enhanced.confidence}% confident${RESET}`);
    console.log(`${GRAY}   📄 ${issue.file}${RESET}`);

    if (enhanced.smartFix) {
      console.log(`${GREEN}   💡 ${enhanced.smartFix.split('\n')[0]}${RESET}`);
    }

    if (enhanced.preventionTip) {
      console.log(`${MAGENTA}   ${enhanced.preventionTip}${RESET}`);
    }

    console.log();
  }

  // Statistics
  console.log(`${CYAN}═══════════════════════════════════════════════════════════${RESET}`);
  console.log(`${BOLD}📈 CONFIDENCE FILTERING DEMONSTRATION${RESET}`);
  console.log(`${CYAN}═══════════════════════════════════════════════════════════${RESET}\n`);

  const allEnhanced = [...perfIssues, ...runtimeIssues].map((issue, idx) => 
    analyzer.enhanceIssue(issue, idx < perfIssues.length ? 'Performance' : 'Runtime')
  );

  const total = allEnhanced.length;
  const filtered60 = analyzer.filterByConfidence(allEnhanced, 60).length;
  const filtered70 = analyzer.filterByConfidence(allEnhanced, 70).length;
  const filtered80 = analyzer.filterByConfidence(allEnhanced, 80).length;
  const filtered90 = analyzer.filterByConfidence(allEnhanced, 90).length;

  console.log(`${WHITE}Total issues found: ${total}${RESET}`);
  console.log(`${GREEN}With ≥60% confidence: ${filtered60} (${((filtered60/total)*100).toFixed(1)}%)${RESET}`);
  console.log(`${GREEN}With ≥70% confidence: ${filtered70} (${((filtered70/total)*100).toFixed(1)}%)${RESET}`);
  console.log(`${YELLOW}With ≥80% confidence: ${filtered80} (${((filtered80/total)*100).toFixed(1)}%)${RESET}`);
  console.log(`${RED}With ≥90% confidence: ${filtered90} (${((filtered90/total)*100).toFixed(1)}%)${RESET}`);

  console.log(`\n${GREEN}✅ Enhanced analysis complete!${RESET}\n`);
}

test().catch(err => {
  console.error(`${RED}❌ Error: ${err.message}${RESET}`);
  process.exit(1);
});
