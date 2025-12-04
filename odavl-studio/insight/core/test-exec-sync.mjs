import { execSync } from 'node:child_process';

console.log('Testing tsc execution...\n');

try {
  const output = execSync('tsc --noEmit --project "C:/Users/sabou/dev/odavl/tsconfig.json"', {
    cwd: 'C:/Users/sabou/dev/odavl',
    stdio: 'pipe',
    encoding: 'utf8'
  });
  console.log('✅ No errors - output:', output);
} catch (error) {
  console.log('❌ Errors found (expected):\n');
  console.log('STDOUT:', error.stdout?.toString() || 'none');
  console.log('\nSTDERR:', error.stderr?.toString() || 'none');
  console.log('\nStatus:', error.status);
}
