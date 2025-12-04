import { glob } from 'glob';
import { readFileSync } from 'fs';
const files = await glob('**/*.{ts,js}', { ignore: ['**/node_modules/**', '**/dist/**'] });
const findings: string[] = [];
for (const f of files) {
    const s = readFileSync(f, 'utf8');
    if (/export\s+(function|const|let|var|class)/.test(s)) findings.push(`export-diff: ${f}`);
}
console.log(findings.join('\n'));
