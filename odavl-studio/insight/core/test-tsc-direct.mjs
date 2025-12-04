import { execSync } from 'node:child_process';
import * as path from 'node:path';
import * as fs from 'node:fs';

const workspaceRoot = 'C:/Users/sabou/dev/odavl';
const tsconfigPath = path.join(workspaceRoot, 'tsconfig.json');

console.log('Checking tsconfig.json...');
console.log('Path:', tsconfigPath);
console.log('Exists:', fs.existsSync(tsconfigPath));

try {
  console.log('\nRunning tsc --noEmit...');
  const output = execSync('tsc --noEmit', {
    cwd: workspaceRoot,
    stdio: 'pipe',
    encoding: 'utf8'
  });
  console.log('SUCCESS: No errors found');
} catch (error) {
  console.log('\n✅ Errors found (expected):');
  const output = error.stdout?.toString() || error.stderr?.toString() || '';
  console.log(output);
}
