import { execSync } from 'node:child_process';
import * as path from 'node:path';

console.log('Testing parseTypeScriptOutput...\n');

const workspaceRoot = 'C:/Users/sabou/dev/odavl';

try {
  execSync('tsc --noEmit --project "C:/Users/sabou/dev/odavl/tsconfig.json"', {
    cwd: workspaceRoot,
    stdio: 'pipe',
    encoding: 'utf8'
  });
  console.log('No errors');
} catch (error) {
  const output = error.stdout?.toString() || error.stderr?.toString() || '';
  console.log('RAW OUTPUT:');
  console.log(output);
  console.log('\n---\n');
  
  const lines = output.split('\n');
  console.log(`Total lines: ${lines.length}`);
  console.log('First 5 lines:');
  lines.slice(0, 5).forEach((line, i) => {
    console.log(`${i}: "${line}"`);
  });
  
  console.log('\n---\n');
  
  const errorRegex = /^(.+?)\((\d+),(\d+)\): (error|warning) (TS\d+): (.+)$/;
  let matchCount = 0;
  
  for (const line of lines) {
    const match = line.match(errorRegex);
    if (match) {
      matchCount++;
      console.log(`MATCHED #${matchCount}:`, match[0]);
    }
  }
  
  console.log(`\nTotal matches: ${matchCount}`);
}
