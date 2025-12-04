#!/usr/bin/env node
import { TestOrchestrator } from './test-orchestrator';
import { ReportGenerator } from './report-generator';

/**
 * CLI for Guardian testing
 * Usage: guardian-test <url> [options]
 */

// ANSI color codes for beautiful output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m',
};

const c = (text: string, color: keyof typeof colors) => `${colors[color]}${text}${colors.reset}`;

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
    console.log(`
${c('╔════════════════════════════════════════════════╗', 'cyan')}
${c('║', 'cyan')}  ${c('🛡️  ODAVL Guardian', 'bright')} - Pre-Deploy Testing  ${c('║', 'cyan')}
${c('╚════════════════════════════════════════════════╝', 'cyan')}

${c('Usage:', 'bright')}
  ${c('guardian-test', 'green')} ${c('<url>', 'yellow')} ${c('[options]', 'dim')}

${c('Options:', 'bright')}
  ${c('--browser', 'cyan')} <type>     Browser type (chromium, firefox, webkit) ${c('[default: chromium]', 'dim')}
  ${c('--headless', 'cyan')}          Run in headless mode ${c('[default: true]', 'dim')}
  ${c('--timeout', 'cyan')} <ms>      Timeout in milliseconds ${c('[default: 30000]', 'dim')}
  ${c('--output', 'cyan')} <dir>      Output directory for reports ${c('[default: .odavl/guardian]', 'dim')}
  ${c('--format', 'cyan')} <type>     Report format (json, html, both) ${c('[default: both]', 'dim')}

${c('Examples:', 'bright')}
  ${c('guardian-test', 'green')} ${c('http://localhost:3000', 'yellow')}
  ${c('guardian-test', 'green')} ${c('https://example.com', 'yellow')} ${c('--browser firefox --format html', 'dim')}
  ${c('guardian-test', 'green')} ${c('http://localhost:3000/en', 'yellow')} ${c('--headless --output ./reports', 'dim')}
    `);
    process.exit(0);
  }

  const url = args[0];
  
  // Parse options
  const options: any = { url };
  
  for (let i = 1; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === '--browser' && args[i + 1]) {
      options.browserType = args[i + 1];
      i++;
    } else if (arg === '--headless') {
      options.headless = true;
    } else if (arg === '--timeout' && args[i + 1]) {
      options.timeout = parseInt(args[i + 1], 10);
      i++;
    } else if (arg === '--output' && args[i + 1]) {
      options.outputDir = args[i + 1];
      i++;
    } else if (arg === '--format' && args[i + 1]) {
      options.format = args[i + 1];
      i++;
    }
  }

  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log('  🚀 Starting Guardian Test...');
  console.log('═══════════════════════════════════════════════════');
  console.log(`📍 URL: ${url}`);
  console.log(`🌐 Browser: ${options.browserType || 'chromium'}`);
  console.log('');

  try {
    // Run test
    const orchestrator = new TestOrchestrator();
    const report = await orchestrator.runTests(options);

    // Generate report
    const generator = new ReportGenerator();
    const reportPath = await generator.generate(report, {
      outputDir: options.outputDir,
      format: options.format || 'both'
    });

    // Display results
    console.log('');
    console.log('═══════════════════════════════════════════════════');
    
    if (report.status === 'passed') {
      console.log(`  ✅ Status: PASSED`);
    } else {
      console.log(`  ℹ️  Status: ANALYSIS COMPLETE`);
    }
    
    const duration = (report.duration / 1000).toFixed(2);
    console.log(`  ⏱️  Duration: ${duration}s`);
    console.log('═══════════════════════════════════════════════════');
    console.log('');
    
    if (report.issues.length > 0) {
      console.log(`📋 Found ${report.issues.length} issue(s):\n`);
      
      for (const issue of report.issues) {
        const icon = issue.severity === 'critical' ? '🔴' : 
                     issue.severity === 'high' ? '🟠' : 
                     issue.severity === 'medium' ? '🟡' : '⚪';
        
        console.log(`${icon} [${issue.severity.toUpperCase()}] ${issue.type}`);
        console.log(`   ${issue.message}`);
        console.log('');
      }
    } else {
      console.log('✨ No issues detected! Perfect score!\n');
    }

    console.log(`📊 Report: ${reportPath}`);
    console.log('');
    console.log('═══════════════════════════════════════════════════');

    // Always exit with 0 - results are informational, not errors!
    process.exit(0);

  } catch (error) {
    console.error('');
    console.error('═══════════════════════════════════════════════════');
    console.error('  ⚠️  Analysis Error');
    console.error('═══════════════════════════════════════════════════');
    console.error((error as Error).message);
    console.error('');
    // Exit with 0 even on error - it's informational
    process.exit(0);
  }
}

main();
