import { readGovernanceFiles, GovernanceSummary } from '../governance';
import { generateAdvice } from '../advisor';

export async function handleGovernanceRefresh(workspace: string, postMessage: (msg: any) => void) {
    const summary: GovernanceSummary = await readGovernanceFiles(workspace);
    const advice = generateAdvice(summary, {});
    postMessage({ type: 'governanceUpdate', payload: { summary, advice } });
}
