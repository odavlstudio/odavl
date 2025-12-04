#!/usr/bin/env node

/**
 * ODAVL Guardian v4.1 - Modular CLI
 * 
 * Improvements over v4.0:
 * - Modular architecture (split from 2118-line monolith)
 * - AI service with automatic fallback
 * - Enhanced error handling
 * - Better dependency management
 * - Improved maintainability
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { executeTests, quickTest, fullTest, aiTest, type TestOptions } from './src/commands/test-command.js';
import { getAIService } from './src/services/ai-service.js';
import { getReportService } from './src/services/report-service.js';

const program = new Command();

// Version and description
program
  .name('guardian')
  .version('4.1.0')
  .description('🛡️  ODAVL Guardian - Pre-deploy testing with AI-powered analysis');

// Show service status on startup
const aiService = getAIService();
const status = aiService.getStatus();

if (status.mode === 'fallback') {
  console.log(
    chalk.yellow(
      `\n⚠️  Running in fallback mode: ${status.reason}\n` +
      `   To enable AI features, set ANTHROPIC_API_KEY environment variable.\n`
    )
  );
}

// ============================================================================
// Commands
// ============================================================================

/**
 * Test command - Main testing functionality
 */
program
  .command('test [path]')
  .description('Run Guardian tests on project or URL')
  .option('-u, --url <url>', 'URL to test (for website testing)')
  .option('-m, --mode <mode>', 'Test mode: quick, full, or ai', 'quick')
  .option('-p, --platform <platform>', 'Target platform: windows, macos, linux, all')
  .option('--skip-tests', 'Skip runtime tests')
  .option('-v, --verbose', 'Verbose output')
  .option('-j, --json', 'Output results as JSON')
  .option('-c, --compare', 'Compare with previous run')
  .option('--html', 'Generate HTML report')
  .action(async (path, options) => {
    try {
      const projectPath = path || process.cwd();
      
      console.log(chalk.cyan(`\n🛡️  Guardian v4.1 - ${options.mode.toUpperCase()} Mode\n`));
      
      const testOptions: TestOptions = {
        mode: options.mode,
        platform: options.platform,
        skipTests: options.skipTests,
        verbose: options.verbose,
        json: options.json,
        compare: options.compare,
        html: options.html,
        url: options.url,
      };

      const result = await executeTests(projectPath, testOptions);

      if (!result.success) {
        process.exit(1);
      }
    } catch (error) {
      console.error(chalk.red('\n❌ Test failed:'), error);
      process.exit(1);
    }
  });

/**
 * Quick command - Fast checks only
 */
program
  .command('quick [path]')
  .description('Run quick tests (fast checks only)')
  .option('-u, --url <url>', 'URL to test')
  .option('--json', 'Output as JSON')
  .action(async (path, options) => {
    try {
      const projectPath = path || process.cwd();
      console.log(chalk.cyan('\n⚡ Quick Test Mode\n'));
      
      await quickTest(projectPath, options);
    } catch (error) {
      console.error(chalk.red('\n❌ Quick test failed:'), error);
      process.exit(1);
    }
  });

/**
 * Full command - Comprehensive analysis
 */
program
  .command('full [path]')
  .description('Run full comprehensive analysis')
  .option('-u, --url <url>', 'URL to test')
  .option('--html', 'Generate HTML report')
  .action(async (path, options) => {
    try {
      const projectPath = path || process.cwd();
      console.log(chalk.cyan('\n🔍 Full Analysis Mode\n'));
      
      await fullTest(projectPath, options);
    } catch (error) {
      console.error(chalk.red('\n❌ Full test failed:'), error);
      process.exit(1);
    }
  });

/**
 * AI command - AI-powered analysis
 */
program
  .command('ai [path]')
  .description('Run AI-powered analysis (requires API key)')
  .option('-u, --url <url>', 'URL to test')
  .option('--html', 'Generate HTML report')
  .action(async (path, options) => {
    try {
      const projectPath = path || process.cwd();
      console.log(chalk.cyan('\n🤖 AI Analysis Mode\n'));
      
      await aiTest(projectPath, options);
    } catch (error) {
      console.error(chalk.red('\n❌ AI test failed:'), error);
      process.exit(1);
    }
  });

/**
 * Status command - Show Guardian status
 */
program
  .command('status')
  .description('Show Guardian service status')
  .action(() => {
    const status = aiService.getStatus();
    
    console.log(chalk.bold('\n🛡️  Guardian Status\n'));
    console.log(`  Version: ${chalk.cyan('4.1.0')}`);
    console.log(`  Mode: ${status.mode === 'ai' ? chalk.green('AI Enabled') : chalk.yellow('Fallback Mode')}`);
    
    if (status.reason) {
      console.log(`  Reason: ${chalk.yellow(status.reason)}`);
    }
    
    console.log(`  Service: ${chalk.green('Running')}\n`);
    
    if (status.mode === 'fallback') {
      console.log(chalk.yellow('💡 To enable AI features:'));
      console.log(chalk.gray('   export ANTHROPIC_API_KEY="your-api-key"\n'));
    }
  });

/**
 * Report command - View previous reports
 */
program
  .command('report [path]')
  .description('View latest report')
  .option('--html', 'Open HTML report')
  .action(async (path, options) => {
    try {
      const projectPath = path || process.cwd();
      const reportService = getReportService();
      
      const report = await reportService.loadPreviousReport(projectPath);
      
      if (!report) {
        console.log(chalk.yellow('\n⚠️  No previous reports found\n'));
        return;
      }
      
      reportService.displayReport(report);
      
      if (options.html) {
        const htmlPath = `${projectPath}/.guardian/reports/latest.html`;
        await reportService.exportToHTML(report, htmlPath);
        console.log(chalk.blue(`\n📄 HTML report generated: ${htmlPath}\n`));
      }
    } catch (error) {
      console.error(chalk.red('\n❌ Failed to load report:'), error);
      process.exit(1);
    }
  });

/**
 * Help command - Show detailed help
 */
program
  .command('help-detailed')
  .description('Show detailed help and examples')
  .action(() => {
    console.log(chalk.bold('\n🛡️  ODAVL Guardian - Detailed Help\n'));
    
    console.log(chalk.cyan('Basic Usage:'));
    console.log(chalk.gray('  guardian test              # Test current directory'));
    console.log(chalk.gray('  guardian test ./my-project # Test specific project'));
    console.log(chalk.gray('  guardian test -u https://example.com  # Test website\n'));
    
    console.log(chalk.cyan('Test Modes:'));
    console.log(chalk.gray('  guardian quick   # Fast checks (~30s)'));
    console.log(chalk.gray('  guardian full    # Comprehensive (~5min)'));
    console.log(chalk.gray('  guardian ai      # AI-powered analysis\n'));
    
    console.log(chalk.cyan('Options:'));
    console.log(chalk.gray('  --html           # Generate HTML report'));
    console.log(chalk.gray('  --json           # Output as JSON'));
    console.log(chalk.gray('  --compare        # Compare with previous run'));
    console.log(chalk.gray('  --verbose        # Show detailed output\n'));
    
    console.log(chalk.cyan('Examples:'));
    console.log(chalk.gray('  guardian test --html          # Test with HTML report'));
    console.log(chalk.gray('  guardian ai -u https://myapp.com --html'));
    console.log(chalk.gray('  guardian full --compare       # Compare with last run\n'));
    
    console.log(chalk.cyan('AI Features:'));
    console.log(chalk.gray('  Guardian can use AI for:'));
    console.log(chalk.gray('  • Visual screenshot analysis'));
    console.log(chalk.gray('  • Error log interpretation'));
    console.log(chalk.gray('  • Smart suggestions\n'));
    
    console.log(chalk.gray('  To enable AI: export ANTHROPIC_API_KEY="your-key"\n'));
  });

// Parse arguments
program.parse();

// If no command provided, show help
if (!process.argv.slice(2).length) {
  program.outputHelp();
  
  console.log(chalk.cyan('\n💡 Quick Start:\n'));
  console.log(chalk.gray('  guardian test              # Test current project'));
  console.log(chalk.gray('  guardian quick             # Quick test'));
  console.log(chalk.gray('  guardian status            # Check status'));
  console.log(chalk.gray('  guardian help-detailed     # More examples\n'));
}
