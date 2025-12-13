#!/usr/bin/env node

/**
 * Main entry point for ODAVL Insight CLI
 */

import { InsightCli } from './cli.js';
import { RealAnalysisEngine } from './analysis-engine.js';
import { createBaselineCommand } from './commands/baseline.js';

async function main(): Promise<void> {
  try {
    // Create real analysis engine
    const engine = new RealAnalysisEngine();

    // Create CLI with engine
    const cli = new InsightCli(engine);

    // Create and execute program
    const program = cli.createProgram();
    
    // Add baseline command
    program.addCommand(createBaselineCommand());
    
    await program.parseAsync(process.argv);
  } catch (error) {
    // Fatal errors (shouldn't reach here due to CLI error handling)
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Fatal error: ${message}`);
    process.exit(2);
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { main };
