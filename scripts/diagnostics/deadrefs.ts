import { glob } from 'glob';
import { readFileSync } from 'fs';
const files = await glob('**/*.{ts,tsx,js}', { ignore: ['**/node_modules/**', '**/dist/**'] });
const findings: string[] = [];
for (const f of files) {
    const s = readFileSync(f, 'utf8');
    if (/function\s+[_a-zA-Z0-9]+\s*\([^)]*\)\s*\{[^}]*\}/.test(s)) findings.push(`unused-function: ${f}`);
    if (/return;[\s\S]*[a-zA-Z0-9]/.test(s)) findings.push(`unreachable-code: ${f}`);
}
console.log(findings.join('\n'));
