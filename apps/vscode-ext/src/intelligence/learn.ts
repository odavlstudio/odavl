import * as fs from 'node:fs';
import * as path from 'node:path';

export async function learn(result: any) {
    // Summarize and store metrics to .odavl/learn.json
    const workspace = process.cwd();
    const learnPath = path.join(workspace, '.odavl', 'learn.json');
    const summary = { timestamp: Date.now(), result };
    try {
        fs.mkdirSync(path.dirname(learnPath), { recursive: true });
        fs.writeFileSync(learnPath, JSON.stringify(summary, null, 2));
    } catch (e) {
        console.warn('Failed to write learn.json:', e);
    }
    return summary;
}
