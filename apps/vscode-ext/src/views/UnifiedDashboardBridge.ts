// Utility for webview <-> extension messaging for UnifiedDashboard
// This is a client-side bridge for VS Code webviews

export type DashboardDataRequest = { command: 'getDashboardData' };
export type DashboardDataResponse = {
    command: 'dashboardData';
    data: {
        trustScore: number;
        qualityTrend: string;
        lastRun: string;
        totalRuns: number;
        evidenceCount: number;
        aiInsights: { type: string; message: string }[];
        logs: { type: 'info' | 'success' | 'warning'; text: string }[];
        analytics: { quality: number[]; labels: string[] };
    };
};

export function requestDashboardData(): Promise<DashboardDataResponse['data']> {
    return new Promise((resolve) => {
        type VSCodeApi = { postMessage: (msg: unknown) => void };
        const win = window as unknown as { acquireVsCodeApi?: () => VSCodeApi; vscode?: VSCodeApi };
        const vscode = win.acquireVsCodeApi?.() || win.vscode;
        if (!vscode) {
            // fallback: resolve with mock data
            resolve({
                trustScore: 92,
                qualityTrend: 'improving',
                lastRun: '2025-10-14 09:32',
                totalRuns: 128,
                evidenceCount: 47,
                aiInsights: [
                    { type: 'optimization', message: 'Quality trend is improving. Keep running cycles!' },
                    { type: 'achievement', message: 'Trust score up 2% this week.' }
                ],
                logs: [
                    { type: 'info', text: 'ODAVL cycle completed successfully.' },
                    { type: 'success', text: 'All quality gates passed.' },
                    { type: 'warning', text: '1 warning: unused variable in src/utils.' }
                ],
                analytics: {
                    quality: [10, 8, 6, 7, 9, 10, 12],
                    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
                }
            });
            return;
        }
        const handler = (event: MessageEvent) => {
            if (event.data && event.data.command === 'dashboardData') {
                window.removeEventListener('message', handler);
                resolve(event.data.data);
            }
        };
        window.addEventListener('message', handler);
        vscode.postMessage({ command: 'getDashboardData' });
    });
}
