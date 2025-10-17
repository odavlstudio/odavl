import * as fs from 'node:fs';
import * as path from 'node:path';

const MAX_LOGS = 50;

function getTelemetryDir(workspace: string) {
    return path.join(workspace, '.odavl', 'telemetry');
}

export async function logTelemetry(workspace: string, data: any) {
    const dir = getTelemetryDir(workspace);
    try {
        fs.mkdirSync(dir, { recursive: true });
        // Rotate logs: keep last 50
        const files = fs.readdirSync(dir).filter(f => f.endsWith('.json')).sort((a, b) => a.localeCompare(b));
        if (files.length >= MAX_LOGS) {
            for (let i = 0; i < files.length - MAX_LOGS + 1; ++i) {
                fs.unlinkSync(path.join(dir, files[i]));
            }
        }
        const ts = new Date().toISOString().replaceAll(':', '-').replaceAll('.', '-');
        const file = path.join(dir, `telemetry-${ts}.json`);
        fs.writeFileSync(file, JSON.stringify(data, null, 2));
    } catch (e) {
        console.warn('Telemetry log error:', e);
    }
}
