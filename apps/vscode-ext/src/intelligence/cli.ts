import * as cp from 'node:child_process';

export async function runCLI(phase: string, workspace: string): Promise<any> {
    return new Promise((resolve, reject) => {
        const cmd = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';
        const args = [`odavl:${phase}`];
        const proc = cp.spawn(cmd, args, { cwd: workspace, shell: true });
        let stdout = '';
        let stderr = '';
        proc.stdout.on('data', (data) => (stdout += data.toString()));
        proc.stderr.on('data', (data) => (stderr += data.toString()));
        proc.on('close', (code) => {
            if (code === 0) resolve(stdout);
            else reject(new Error(stderr || `CLI exited with code ${code}`));
        });
    });
}
