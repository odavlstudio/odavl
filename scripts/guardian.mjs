#!/usr/bin/env node
/**
 * ODAVL Guardian - Simple CLI Wrapper
 * Usage: pnpm odavl:guardian <url>
 */

import { spawn } from 'child_process';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const args = process.argv.slice(2);

if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
  console.log(`
🎯 ODAVL Guardian - Pre-Deploy Testing

Usage:
  pnpm odavl:guardian <url> [options]

Examples:
  pnpm odavl:guardian https://github.com
  pnpm odavl:guardian http://localhost:3000
  pnpm odavl:guardian https://example.com --browser firefox

Options:
  --browser <type>     Browser (chromium, firefox, webkit)
  --headless          Run headless
  --timeout <ms>      Timeout in milliseconds
  --output <dir>      Output directory
  --format <type>     Report format (json, html, both)

Quick Commands:
  pnpm odavl:guardian --help        Show this help
  pnpm guardian:api                 Start API server
  pnpm guardian:dev                 Start dashboard

Documentation:
  docs/GUARDIAN_USAGE_GUIDE_AR.md   Arabic guide
  docs/GUARDIAN_MASTER_PLAN.md      Full documentation
  `);
  process.exit(0);
}

// Run guardian-cli
const coreDir = resolve(__dirname, '../odavl-studio/guardian/core');
const cliPath = resolve(coreDir, 'src/guardian-cli.ts');

console.log('🚀 Starting Guardian...\n');

const child = spawn('pnpm', ['exec', 'tsx', cliPath, ...args], {
  cwd: coreDir,
  stdio: 'inherit',
  shell: false
});

child.on('exit', (code) => {
  process.exit(code || 0);
});
