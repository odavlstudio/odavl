// Test if package scanner deduplicates correctly
import { PackageScanner } from './odavl-studio/guardian/cli/src/detectors/package-scanner';
import { resolve } from 'path';

const scanner = new PackageScanner();

// Use workspace root (where pnpm-workspace.yaml is)
const rootPath = resolve(process.cwd());

console.log(`🔍 Scanning workspace: ${rootPath}\n`);

const structure = await scanner.scan(rootPath);

// Get all packages
const packages = [
  structure.rootPackage, 
  ...structure.subPackages
].filter(Boolean);

console.log(`📦 Total packages found: ${packages.length}`);
console.log(`🏢 Workspace type: ${structure.workspaceType}\n`);

// Group by name to detect duplicates
const nameCount = new Map();
packages.forEach(pkg => {
  nameCount.set(pkg.name, (nameCount.get(pkg.name) || 0) + 1);
});

console.log('📊 Package counts by name:\n');
let hasDuplicates = false;

Array.from(nameCount.entries())
  .sort((a, b) => b[1] - a[1]) // Sort by count descending
  .forEach(([name, count]) => {
    const emoji = count > 1 ? '❌' : '✅';
    console.log(`${emoji} ${name}: ${count} occurrence${count > 1 ? 's' : ''}`);
    if (count > 1) hasDuplicates = true;
  });

console.log('\n' + '='.repeat(60));
if (hasDuplicates) {
  console.log('❌ FAILED: Duplicates found!');
  process.exit(1);
} else {
  console.log('✅ SUCCESS: All packages are unique!');
  process.exit(0);
}
