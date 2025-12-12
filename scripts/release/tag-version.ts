#!/usr/bin/env tsx

/**
 * Release Tagging Script
 * Creates git tag, validates clean tree, confirms version
 */

import { execSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
};

function log(message: string, color: string = colors.cyan) {
  console.log(`${color}${message}${colors.reset}`);
}

function error(message: string) {
  console.error(`${colors.red}✗ ${message}${colors.reset}`);
  process.exit(1);
}

function success(message: string) {
  console.log(`${colors.green}✓ ${message}${colors.reset}`);
}

function warn(message: string) {
  console.log(`${colors.yellow}⚠ ${message}${colors.reset}`);
}

/**
 * Read VERSION file
 */
function readVersion(): string {
  if (!existsSync('VERSION')) {
    error('VERSION file not found');
  }

  const version = readFileSync('VERSION', 'utf-8').trim();

  if (!version) {
    error('VERSION file is empty');
  }

  return version;
}

/**
 * Check if git working tree is clean
 */
function checkCleanTree(): boolean {
  try {
    const status = execSync('git status --porcelain', { encoding: 'utf-8' });
    return status.trim() === '';
  } catch {
    return false;
  }
}

/**
 * Check if git tag already exists
 */
function tagExists(tag: string): boolean {
  try {
    execSync(`git rev-parse ${tag}`, { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

/**
 * Create git tag
 */
function createTag(tag: string, message: string) {
  try {
    execSync(`git tag -a ${tag} -m "${message}"`, { stdio: 'inherit' });
    success(`Tag created: ${tag}`);
  } catch {
    error(`Failed to create tag: ${tag}`);
  }
}

/**
 * Push tag to remote
 */
function pushTag(tag: string) {
  try {
    execSync(`git push origin ${tag}`, { stdio: 'inherit' });
    success(`Tag pushed: ${tag}`);
  } catch {
    error(`Failed to push tag: ${tag}`);
  }
}

/**
 * Validate CHANGELOG has entry for version
 */
function validateChangelog(version: string): boolean {
  if (!existsSync('CHANGELOG.md')) {
    warn('CHANGELOG.md not found');
    return false;
  }

  const changelog = readFileSync('CHANGELOG.md', 'utf-8');
  const versionPattern = new RegExp(`\\[${version.replace('v', '')}\\]`);

  if (!versionPattern.test(changelog)) {
    warn(`CHANGELOG.md does not contain entry for ${version}`);
    return false;
  }

  return true;
}

/**
 * Main execution
 */
async function main() {
  log('╔════════════════════════════════════╗');
  log('║  ODAVL Release Tagging Script      ║');
  log('╚════════════════════════════════════╝\n');

  // Step 1: Read VERSION
  log('Step 1: Reading VERSION file...');
  const version = readVersion();
  const tag = version.startsWith('v') ? version : `v${version}`;
  success(`Version: ${version} → Tag: ${tag}`);

  // Step 2: Validate git repository
  log('\nStep 2: Validating git repository...');
  try {
    execSync('git rev-parse --is-inside-work-tree', { stdio: 'pipe' });
    success('Valid git repository');
  } catch {
    error('Not a git repository');
  }

  // Step 3: Check working tree
  log('\nStep 3: Checking working tree...');
  if (!checkCleanTree()) {
    error('Working tree is not clean. Commit or stash changes first.');
  }
  success('Working tree is clean');

  // Step 4: Check if tag exists
  log('\nStep 4: Checking if tag exists...');
  if (tagExists(tag)) {
    error(`Tag already exists: ${tag}`);
  }
  success(`Tag does not exist: ${tag}`);

  // Step 5: Validate CHANGELOG
  log('\nStep 5: Validating CHANGELOG...');
  if (validateChangelog(version)) {
    success(`CHANGELOG.md has entry for ${version}`);
  } else {
    warn('CHANGELOG validation failed (continuing anyway)');
  }

  // Step 6: Confirm
  log('\n╔════════════════════════════════════╗');
  log(`║  Ready to create tag: ${tag.padEnd(13)} ║`);
  log('╚════════════════════════════════════╝\n');

  log('This will:');
  log(`  1. Create annotated git tag: ${tag}`);
  log(`  2. Push tag to origin`);
  log('');

  // Step 7: Create tag
  log('Step 6: Creating git tag...');
  createTag(tag, `ODAVL Studio ${version} - GA Release`);

  // Step 8: Push tag
  log('\nStep 7: Pushing tag to origin...');
  pushTag(tag);

  // Done
  log('\n╔════════════════════════════════════╗');
  log('║  ✓ Release tag created!            ║');
  log('╚════════════════════════════════════╝\n');

  log(`Tag: ${tag}`);
  log(`View on GitHub: https://github.com/odavlstudio/odavl/releases/tag/${tag}`);
  log('');

  log(`${colors.green}Next steps:${colors.reset}`);
  log(`  1. Create GitHub release: gh release create ${tag} --generate-notes`);
  log(`  2. Publish packages: pnpm publish --access public`);
  log(`  3. Deploy to production: pnpm deploy:prod`);
  log('');
}

main().catch((error) => {
  console.error(`${colors.red}✗ Error:${colors.reset}`, error);
  process.exit(1);
});
