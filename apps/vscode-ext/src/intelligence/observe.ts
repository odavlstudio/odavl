import * as fs from 'node:fs';

export async function observe(workspace: string) {
    // Scan for changes: git status + file system
    const gitStatus = await new Promise<string>((resolve) => {
        const { exec } = require('node:child_process');
        exec('git status --porcelain', { cwd: workspace }, (err: any, stdout: string) => {
            resolve(stdout || '');
        });
    });
    const files = fs.readdirSync(workspace);
    return { gitStatus, files };
}
