/**
 * Test Performance Profiler
 * Run: pnpm exec tsx test-performance-profiler.ts
 */

import { PerformanceProfilerDetector } from './odavl-studio/insight/core/src/detector/performance-profiler-detector.js';

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

async function testPerformanceProfiler() {
  console.log(`${CYAN}${BOLD}⚡ Testing Real-Time Performance Profiler...${RESET}\n`);

  const workspaceRoot = process.cwd();
  const detector = new PerformanceProfilerDetector(workspaceRoot);

  console.log(`${WHITE}📂 Workspace: ${workspaceRoot}${RESET}`);
  console.log(`${WHITE}⏳ Profiling performance...${RESET}\n`);

  try {
    const startTime = Date.now();
    const result = await detector.detect();
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);

    // Display summary
    console.log(`${BOLD}${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}`);
    console.log(`${BOLD}${CYAN}📊 PERFORMANCE PROFILE SUMMARY${RESET}`);
    console.log(`${BOLD}${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}\n`);

    // Performance Score
    const scoreColor = getScoreColor(result.summary.score);
    const gradeColor = getGradeColor(result.summary.grade);
    
    console.log(`${scoreColor}${BOLD}🎯 Performance Score: ${result.summary.score}/100 (Grade ${result.summary.grade})${RESET}`);
    console.log(`${GRAY}Profiling completed in ${duration}s${RESET}\n`);

    // Metrics
    console.log(`${WHITE}📈 Execution Time:${RESET}`);
    console.log(`   ${GRAY}Total Functions: ${result.metrics.executionTime.totalFunctions}${RESET}`);
    console.log(`   ${GRAY}Slow Functions: ${result.summary.slowFunctions}${RESET}`);
    console.log(`   ${GRAY}Average Time: ${result.metrics.executionTime.averageExecutionTime.toFixed(1)}ms${RESET}`);
    console.log(`   ${GRAY}P95: ${result.metrics.executionTime.p95ExecutionTime.toFixed(1)}ms${RESET}`);
    console.log(`   ${GRAY}P99: ${result.metrics.executionTime.p99ExecutionTime.toFixed(1)}ms${RESET}\n`);

    console.log(`${WHITE}💾 Memory Usage:${RESET}`);
    console.log(`   ${GRAY}Heap Used: ${(result.metrics.memory.heapUsed / 1024 / 1024).toFixed(1)}MB${RESET}`);
    console.log(`   ${GRAY}Heap Total: ${(result.metrics.memory.heapTotal / 1024 / 1024).toFixed(1)}MB${RESET}`);
    console.log(`   ${GRAY}Memory Leaks: ${result.summary.memoryLeaks}${RESET}\n`);

    console.log(`${WHITE}📦 Bundle Size:${RESET}`);
    console.log(`   ${GRAY}Total: ${(result.metrics.bundleSize.totalSize / 1024).toFixed(0)}KB${RESET}`);
    console.log(`   ${GRAY}Gzipped: ${(result.metrics.bundleSize.gzipSize / 1024).toFixed(0)}KB${RESET}`);
    console.log(`   ${GRAY}Large Files: ${result.summary.largeFiles}${RESET}`);
    console.log(`   ${GRAY}Duplicates: ${result.metrics.bundleSize.duplicates.length}${RESET}\n`);

    if (result.issues.length === 0) {
      console.log(`${GREEN}${BOLD}✅ No critical performance bottlenecks found!${RESET}\n`);
      return;
    }

    // Display bottlenecks
    console.log(`${BOLD}${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}`);
    console.log(`${BOLD}${CYAN}🚨 PERFORMANCE BOTTLENECKS (Top 10)${RESET}`);
    console.log(`${BOLD}${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}\n`);

    const topIssues = result.issues.slice(0, 10);

    for (let i = 0; i < topIssues.length; i++) {
      const issue = topIssues[i];
      const severityColor = getSeverityColor(issue.severity);
      const severityBadge = getSeverityBadge(issue.severity);
      const typeIcon = getTypeIcon(issue.bottleneck.type);

      console.log(`${BOLD}${WHITE}${i + 1}. ${typeIcon} ${issue.message}${RESET}`);
      console.log(`   ${severityColor}${severityBadge}${RESET} ${GRAY}${issue.metric}${RESET}`);
      
      if (issue.line) {
        console.log(`   ${GRAY}📄 ${issue.file}:${issue.line}${RESET}`);
      } else {
        console.log(`   ${GRAY}📄 ${issue.file}${RESET}`);
      }

      console.log(`   ${YELLOW}⚠️  Impact: ${issue.impact}${RESET}`);
      console.log(`   ${GREEN}💡 Fix: ${issue.recommendation}${RESET}`);
      console.log(`   ${CYAN}💰 Savings: ${issue.bottleneck.estimatedSavings}${RESET}\n`);
    }

    // Top slow functions
    if (result.metrics.executionTime.slowFunctions.length > 0) {
      console.log(`${BOLD}${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}`);
      console.log(`${BOLD}${CYAN}🐌 SLOWEST FUNCTIONS (Top 5)${RESET}`);
      console.log(`${BOLD}${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}\n`);

      const topFunctions = result.metrics.executionTime.slowFunctions.slice(0, 5);

      for (let i = 0; i < topFunctions.length; i++) {
        const func = topFunctions[i];
        const timeColor = func.executionTime > 100 ? RED : func.executionTime > 50 ? YELLOW : WHITE;

        console.log(`${BOLD}${WHITE}${i + 1}. ${func.name}()${RESET}`);
        console.log(`   ${timeColor}⏱️  ${func.executionTime.toFixed(1)}ms${RESET} ${GRAY}(Complexity: ${func.complexity})${RESET}`);
        console.log(`   ${GRAY}📄 ${func.file}:${func.line}${RESET}\n`);
      }
    }

    // Memory leaks
    if (result.metrics.memory.leaks.length > 0) {
      console.log(`${BOLD}${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}`);
      console.log(`${BOLD}${CYAN}💧 MEMORY LEAKS (Top 5)${RESET}`);
      console.log(`${BOLD}${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}\n`);

      const topLeaks = result.metrics.memory.leaks.slice(0, 5);

      for (let i = 0; i < topLeaks.length; i++) {
        const leak = topLeaks[i];
        const severityColor = getSeverityColor(leak.severity);
        const leakIcon = getLeakIcon(leak.type);

        console.log(`${BOLD}${WHITE}${i + 1}. ${leakIcon} ${leak.description}${RESET}`);
        console.log(`   ${severityColor}${getSeverityBadge(leak.severity)}${RESET} ${GRAY}~${leak.estimatedImpact}KB${RESET}`);
        console.log(`   ${GRAY}📄 ${leak.file}:${leak.line}${RESET}\n`);
      }
    }

    // Large files
    if (result.metrics.bundleSize.largeFiles.length > 0) {
      console.log(`${BOLD}${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}`);
      console.log(`${BOLD}${CYAN}📦 LARGE FILES (Top 5)${RESET}`);
      console.log(`${BOLD}${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}\n`);

      const topFiles = result.metrics.bundleSize.largeFiles.slice(0, 5);

      for (let i = 0; i < topFiles.length; i++) {
        const file = topFiles[i];
        const sizeKB = (file.size / 1024).toFixed(0);
        const sizeColor = file.size > 1024 * 1024 ? RED : file.size > 500 * 1024 ? YELLOW : WHITE;

        console.log(`${BOLD}${WHITE}${i + 1}. ${file.path}${RESET}`);
        console.log(`   ${sizeColor}📏 ${sizeKB}KB${RESET} ${GRAY}(${file.percentage.toFixed(1)}% of total)${RESET}`);
        
        if (file.recommendations.length > 0) {
          console.log(`   ${GREEN}💡 ${file.recommendations[0]}${RESET}`);
        }
        console.log();
      }
    }

    // Recommendations
    console.log(`${BOLD}${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}`);
    console.log(`${BOLD}${CYAN}💡 OPTIMIZATION RECOMMENDATIONS${RESET}`);
    console.log(`${BOLD}${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}\n`);

    console.log(`${WHITE}1. ${GREEN}Focus on critical bottlenecks first${RESET} ${GRAY}(highest impact)${RESET}`);
    console.log(`${WHITE}2. ${GREEN}Fix memory leaks immediately${RESET} ${GRAY}(prevents crashes)${RESET}`);
    console.log(`${WHITE}3. ${GREEN}Optimize slow functions${RESET} ${GRAY}(use memoization, Web Workers)${RESET}`);
    console.log(`${WHITE}4. ${GREEN}Reduce bundle size${RESET} ${GRAY}(code splitting, lazy loading)${RESET}`);
    console.log(`${WHITE}5. ${GREEN}Monitor performance regularly${RESET} ${GRAY}(run profiler before releases)${RESET}\n`);

    console.log(`${GREEN}${BOLD}✅ Performance profiling complete!${RESET}\n`);

  } catch (error) {
    console.error(`${RED}${BOLD}❌ Error during profiling:${RESET}`);
    console.error(error);
  }
}

function getScoreColor(score: number): string {
  if (score >= 90) return GREEN;
  if (score >= 80) return CYAN;
  if (score >= 70) return YELLOW;
  if (score >= 60) return MAGENTA;
  return RED;
}

function getGradeColor(grade: string): string {
  switch (grade) {
    case 'A': return GREEN;
    case 'B': return CYAN;
    case 'C': return YELLOW;
    case 'D': return MAGENTA;
    case 'F': return RED;
    default: return WHITE;
  }
}

function getSeverityColor(severity: string): string {
  switch (severity) {
    case 'critical': return RED;
    case 'high': return YELLOW;
    case 'medium': return MAGENTA;
    case 'low': return CYAN;
    default: return WHITE;
  }
}

function getSeverityBadge(severity: string): string {
  switch (severity) {
    case 'critical': return '[CRITICAL]';
    case 'high': return '[HIGH]';
    case 'medium': return '[MEDIUM]';
    case 'low': return '[LOW]';
    default: return '[UNKNOWN]';
  }
}

function getTypeIcon(type: string): string {
  switch (type) {
    case 'slow-function': return '🐌';
    case 'memory-leak': return '💧';
    case 'large-bundle': return '📦';
    case 'slow-import': return '📥';
    case 'blocking-render': return '🎨';
    default: return '⚠️';
  }
}

function getLeakIcon(type: string): string {
  switch (type) {
    case 'interval': return '⏱️';
    case 'timeout': return '⏰';
    case 'event-listener': return '👂';
    case 'closure': return '🔒';
    case 'cache': return '💾';
    default: return '💧';
  }
}

// Run test
testPerformanceProfiler().catch(console.error);
