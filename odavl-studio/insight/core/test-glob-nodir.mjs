import { glob } from 'glob';
import * as fs from 'node:fs';

console.log('Testing glob with nodir...\n');

const files = await glob('**/*.{ts,tsx,js,jsx,mjs}', {
  cwd: 'C:/Users/sabou/dev/odavl',
  absolute: true,
  ignore: ['node_modules/**', 'dist/**', '.next/**'],
  nodir: true,
});

console.log(`Found ${files.length} files\n`);

// Check first 10 for directories
console.log('Checking first 10 files:\n');
for (let i = 0; i < Math.min(10, files.length); i++) {
  const file = files[i];
  try {
    const stats = fs.statSync(file);
    const type = stats.isDirectory() ? 'DIR' : 'FILE';
    console.log(`${i + 1}. [${type}] ${file}`);
    
    if (stats.isDirectory()) {
      console.log(`   ❌ FOUND A DIRECTORY! This should not happen.`);
    }
  } catch (e) {
    console.log(`${i + 1}. [ERROR] ${file} - ${e.message}`);
  }
}
