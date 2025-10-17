import { runCLI } from './cli';

export async function act(decision: any) {
    // If issues, run odavl:run, else noop
    if (decision.issues > 0) {
        const result = await runCLI('run', process.cwd());
        return { acted: true, result };
    }
    return { acted: false, result: 'No action needed' };
}
