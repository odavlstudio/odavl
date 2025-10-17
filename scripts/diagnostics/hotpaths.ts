import { glob } from 'glob';
import { readFileSync } from 'fs';
const files = await glob('**/*.{ts,tsx}', { ignore: ['**/node_modules/**', '**/dist/**'] });
const findings: string[] = [];
for (const f of files) {
    const s = readFileSync(f, 'utf8');
    if (/for\s*\([^)]*\)\s*\{[^}]*await\s+/.test(s)) findings.push(`await-in-loop: ${f}`);
    if (/JSON\.parse\(/.test(s)) findings.push(`json-parse: ${f}`);
}
console.log(findings.join('\n'));
