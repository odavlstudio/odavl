#!/usr/bin/env tsx
/**
 * Package Version Checker
 * Validates that all packages match the versions defined in .package-versions.json
 * Used in pre-commit hooks and CI/CD pipelines
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { glob } from 'glob';

interface VersionLock {
  version: string;
  lockDate: string;
  core: {
    node: string;
    pnpm: string;
    typescript: string;
  };
  frameworks: {
    react: string;
    next: string;
    vite: string;
  };
  testing: {
    vitest: string;
    playwright: string;
  };
  security: {
    minimumVersions: Record<string, string>;
  };
}

interface PackageJson {
  name: string;
  version: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
}

const ROOT_DIR = process.cwd();
const LOCK_FILE = join(ROOT_DIR, '.package-versions.json');

function parseVersion(versionRange: string): string {
  // Extract version number from range (^1.2.3 -> 1.2.3)
  return versionRange.replace(/^[\^~>=<]+/, '').split(' ')[0];
}

function compareVersions(actual: string, expected: string): boolean {
  const actualVer = parseVersion(actual);
  const expectedVer = parseVersion(expected);
  
  // For minimum versions, check if actual >= expected
  if (expected.startsWith('>=')) {
    return actualVer >= expectedVer;
  }
  
  // For exact/caret versions, check major.minor match
  const actualParts = actualVer.split('.');
  const expectedParts = expectedVer.split('.');
  
  return actualParts[0] === expectedParts[0] && actualParts[1] === expectedParts[1];
}

async function checkPackageVersions() {
  console.log('🔍 Checking package versions against lock file...\n');

  // Load version lock file
  if (!existsSync(LOCK_FILE)) {
    console.error('❌ .package-versions.json not found');
    console.log('   Run: pnpm run forensic:setup to create it');
    process.exit(1);
  }

  const versionLock: VersionLock = JSON.parse(readFileSync(LOCK_FILE, 'utf-8'));
  const errors: string[] = [];
  const warnings: string[] = [];

  // Find all package.json files
  const packageFiles = await glob('**/package.json', {
    ignore: ['**/node_modules/**', '**/dist/**'],
    cwd: ROOT_DIR,
  });

  console.log(`📦 Found ${packageFiles.length} package.json files\n`);

  // Check each package.json
  for (const file of packageFiles) {
    const fullPath = join(ROOT_DIR, file);
    const pkg: PackageJson = JSON.parse(readFileSync(fullPath, 'utf-8'));
    const allDeps = {
      ...pkg.dependencies,
      ...pkg.devDependencies,
    };

    // Check security-critical packages
    for (const [pkgName, minVersion] of Object.entries(versionLock.security.minimumVersions)) {
      if (allDeps[pkgName]) {
        const actualVersion = allDeps[pkgName];
        if (!compareVersions(actualVersion, minVersion)) {
          errors.push(
            `❌ ${pkg.name}: ${pkgName}@${actualVersion} (required: ${minVersion})`
          );
        }
      }
    }

    // Check framework versions
    const frameworkChecks = {
      'react': versionLock.frameworks.react,
      'next': versionLock.frameworks.next,
      'vite': versionLock.frameworks.vite,
    };

    for (const [pkgName, expectedVersion] of Object.entries(frameworkChecks)) {
      if (allDeps[pkgName]) {
        const actualVersion = allDeps[pkgName];
        if (!compareVersions(actualVersion, expectedVersion)) {
          warnings.push(
            `⚠️  ${pkg.name}: ${pkgName}@${actualVersion} (expected: ${expectedVersion})`
          );
        }
      }
    }

    // Check testing packages
    const testingChecks = {
      'vitest': versionLock.testing.vitest,
      '@playwright/test': versionLock.testing.playwright,
    };

    for (const [pkgName, expectedVersion] of Object.entries(testingChecks)) {
      if (allDeps[pkgName]) {
        const actualVersion = allDeps[pkgName];
        if (!compareVersions(actualVersion, expectedVersion)) {
          warnings.push(
            `⚠️  ${pkg.name}: ${pkgName}@${actualVersion} (expected: ${expectedVersion})`
          );
        }
      }
    }
  }

  // Report results
  if (warnings.length > 0) {
    console.log('⚠️  Version Warnings:\n');
    warnings.forEach(w => console.log(`   ${w}`));
    console.log('');
  }

  if (errors.length > 0) {
    console.error('❌ Security Version Violations:\n');
    errors.forEach(e => console.error(`   ${e}`));
    console.log('\n💡 Fix with: pnpm update <package>@<version>\n');
    process.exit(1);
  }

  console.log('✅ All package versions are compliant');
  console.log(`   Lock file version: ${versionLock.version}`);
  console.log(`   Last updated: ${versionLock.lockDate}\n`);
}

checkPackageVersions().catch((error) => {
  console.error('❌ Error checking package versions:', error);
  process.exit(1);
});
