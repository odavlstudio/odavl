import * as fs from 'node:fs';
import * as path from 'node:path';

export async function writeMarkdownReport(workspace: string, metrics: any, riskScore: number, summary: string) {
    try {
        const dir = path.join(workspace, '.odavl', 'reports');
        fs.mkdirSync(dir, { recursive: true });
        const ts = new Date().toISOString().replaceAll(':', '-').replaceAll('.', '-');
        const file = path.join(dir, `ODAVL-Report-${ts}.md`);
        let content = `## ODAVL Cycle Report – ${new Date().toLocaleString()}`;
        content += `\n- Duration: ${metrics.totalDuration.toFixed(0)} ms`;
        let resultText = '';
        if (riskScore === 0) {
            resultText = '✅ PASS';
        } else if (riskScore < 80) {
            resultText = '⚠️ WARN';
        } else {
            resultText = '❌ FAIL';
        }
        content += `\n- Result: ${resultText}`;
        content += `\n- Phases:`;
        for (const p of metrics.phases) {
            content += `\n    - ${p.phase.charAt(0).toUpperCase() + p.phase.slice(1)} … ${p.duration.toFixed(0)} ms – ${p.status === 'success' ? '✅' : '❌'}`;
        }
        content += `\n- Risk Score: ${riskScore}`;
        content += `\n- Summary: ${summary}`;
        fs.writeFileSync(file, content);
        return file;
    } catch (e) {
        console.warn('Markdown report error:', e);
        return null;
    }
}
