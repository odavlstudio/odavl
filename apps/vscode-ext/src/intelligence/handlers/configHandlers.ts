import { readEnterpriseConfig, writeEnterpriseConfig, EnterpriseConfig } from '../config';

export async function handleConfigRefresh(workspace: string, postMessage: (msg: any) => void) {
    const config = await readEnterpriseConfig(workspace);
    postMessage({ type: 'enterpriseConfigUpdate', payload: config });
}

export async function handleConfigUpdate(workspace: string, payload: Partial<EnterpriseConfig>, postMessage: (msg: any) => void) {
    // Merge with current config to avoid partial overwrites
    const current = await readEnterpriseConfig(workspace);
    const updated: EnterpriseConfig = { ...current, ...payload };
    await writeEnterpriseConfig(workspace, updated);
    postMessage({ type: 'enterpriseConfigUpdate', payload: updated });
}
