/**
 * ODAVL CLI — Security Commands
 * Vulnerability scanning and dependency analysis
 */

import { Command } from 'commander';
import { OSVScanner, LockIntegrity, DependencyTrust, FileGuard } from '@odavl-studio/security';
import { join } from 'node:path';

export function createSecurityCommand(): Command {
  const security = new Command('security')
    .description('Security scanning and vulnerability detection')
    .alias('sec');

  security
    .command('scan')
    .description('Scan dependencies for vulnerabilities')
    .option('-l, --lockfile <path>', 'Path to lockfile', 'pnpm-lock.yaml')
    .action(async (options) => {
      console.log('🔍 Scanning dependencies...');
      const scanner = new OSVScanner();
      const result = await scanner.scan(options.lockfile);
      console.log(`✅ Scan complete: ${result.total} vulnerabilities found`);
      console.log(`   Critical: ${result.critical}, High: ${result.high}`);
    });

  security
    .command('integrity')
    .description('Verify lockfile integrity')
    .action(() => {
      const lockIntegrity = new LockIntegrity();
      const lockfilePath = join(process.cwd(), 'pnpm-lock.yaml');
      const hash = lockIntegrity.computeHash(lockfilePath);
      console.log(`🔒 Lockfile SHA-256: ${hash.substring(0, 16)}...`);
    });

  security
    .command('trust')
    .description('Check dependency trust scores')
    .argument('<package>', 'Package name')
    .action(async (packageName) => {
      console.log(`🎯 Analyzing ${packageName}...`);
      const trust = new DependencyTrust();
      const score = await trust.score(packageName);
      console.log(`   Score: ${score.score}/100 (${score.recommendation})`);
    });

  return security;
}
