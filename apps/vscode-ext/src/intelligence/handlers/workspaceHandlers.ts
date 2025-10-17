import { readGovernanceFiles } from '../governance';
import { readEnterpriseConfig } from '../config';
import { generateAdvice } from '../advisor';

export async function handleWorkspaceSwitch(newWorkspace: string, postMessage: (msg: any) => void) {
    const summary = await readGovernanceFiles(newWorkspace);
    const config = await readEnterpriseConfig(newWorkspace);
    const advice = generateAdvice(summary, {});
    postMessage({ type: 'workspaceSwitched', payload: { summary, config, advice, workspace: newWorkspace } });
}
