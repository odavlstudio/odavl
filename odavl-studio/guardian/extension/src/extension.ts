import * as vscode from 'vscode';
import { GuardianApiClient } from './api-client';
import { TestsProvider, AlertsProvider, TrendsProvider } from './tree-providers';

let apiClient: GuardianApiClient;
let testsProvider: TestsProvider;
let alertsProvider: AlertsProvider;
let trendsProvider: TrendsProvider;
let refreshTimer: NodeJS.Timeout | undefined;

export function activate(context: vscode.ExtensionContext) {
    console.log('Guardian extension activated');

    // Initialize API client
    apiClient = new GuardianApiClient();

    // Initialize tree providers
    testsProvider = new TestsProvider(apiClient);
    alertsProvider = new AlertsProvider(apiClient);
    trendsProvider = new TrendsProvider(apiClient);

    // Register tree views
    vscode.window.registerTreeDataProvider('guardian.tests', testsProvider);
    vscode.window.registerTreeDataProvider('guardian.alerts', alertsProvider);
    vscode.window.registerTreeDataProvider('guardian.trends', trendsProvider);

    // Register commands
    context.subscriptions.push(
        vscode.commands.registerCommand('odavl-guardian.analyzeUrl', analyzeUrl),
        vscode.commands.registerCommand('odavl-guardian.showDashboard', showDashboard),
        vscode.commands.registerCommand('odavl-guardian.runScheduledTests', runScheduledTests),
        vscode.commands.registerCommand('odavl-guardian.viewAlerts', viewAlerts),
        vscode.commands.registerCommand('odavl-guardian.createTest', createTest),
        vscode.commands.registerCommand('odavl-guardian.executeTest', executeTest),
        vscode.commands.registerCommand('odavl-guardian.acknowledgeAlert', acknowledgeAlert),
        vscode.commands.registerCommand('guardian.showTestDetails', showTestDetails),
        vscode.commands.registerCommand('guardian.showAlertDetails', showAlertDetails),
        vscode.commands.registerCommand('guardian.refresh', refreshAll)
    );

    // Auto-refresh if enabled
    const config = vscode.workspace.getConfiguration('guardian');
    if (config.get('autoRefresh', true)) {
        const interval = config.get('refreshInterval', 60) * 1000;
        refreshTimer = setInterval(refreshAll, interval);
        context.subscriptions.push({
            dispose: () => {
                if (refreshTimer) {
                    clearInterval(refreshTimer);
                }
            },
        });
    }

    // Initial health check
    checkApiHealth();
}

async function checkApiHealth() {
    const healthy = await apiClient.healthCheck();
    if (!healthy) {
        vscode.window.showWarningMessage(
            'Guardian API is not responding. Check configuration.',
            'Open Settings'
        ).then((action) => {
            if (action === 'Open Settings') {
                vscode.commands.executeCommand('workbench.action.openSettings', 'guardian');
            }
        });
    }
}

async function analyzeUrl() {
    const url = await vscode.window.showInputBox({
        prompt: 'Enter URL to analyze',
        placeHolder: 'https://example.com',
        validateInput: (value) => {
            try {
                new URL(value);
                return null;
            } catch {
                return 'Please enter a valid URL';
            }
        },
    });

    if (!url) {
        return;
    }

    const schedule = await vscode.window.showQuickPick(
        ['Once', 'Every 5 minutes', 'Every 15 minutes', 'Every hour', 'Custom'],
        { placeHolder: 'Select execution schedule' }
    );

    if (!schedule) {
        return;
    }

    let cron = '@once';
    if (schedule === 'Every 5 minutes') {
        cron = '*/5 * * * *';
    } else if (schedule === 'Every 15 minutes') {
        cron = '*/15 * * * *';
    } else if (schedule === 'Every hour') {
        cron = '0 * * * *';
    } else if (schedule === 'Custom') {
        const customCron = await vscode.window.showInputBox({
            prompt: 'Enter cron expression',
            placeHolder: '*/5 * * * *',
        });
        if (customCron) {
            cron = customCron;
        }
    }

    await vscode.window.withProgress(
        {
            location: vscode.ProgressLocation.Notification,
            title: 'Creating test...',
            cancellable: false,
        },
        async () => {
            const test = await apiClient.createTest({
                name: `Analysis: ${new URL(url).hostname}`,
                url,
                schedule: cron,
                enabled: true,
            });

            if (test) {
                vscode.window.showInformationMessage(`Test created: ${test.name}`);
                testsProvider.refresh();
            } else {
                vscode.window.showErrorMessage('Failed to create test');
            }
        }
    );
}

async function showDashboard() {
    const apiUrl = vscode.workspace.getConfiguration('guardian').get('apiUrl', 'http://localhost:3003');
    const dashboardUrl = apiUrl.replace('/api', '');
    vscode.env.openExternal(vscode.Uri.parse(dashboardUrl));
}

async function runScheduledTests() {
    const tests = await apiClient.getTests();
    if (tests.length === 0) {
        vscode.window.showInformationMessage('No tests configured');
        return;
    }

    const selected = await vscode.window.showQuickPick(
        tests.map((t) => ({ label: t.name, description: t.url, test: t })),
        { placeHolder: 'Select test to run' }
    );

    if (!selected) {
        return;
    }

    await vscode.window.withProgress(
        {
            location: vscode.ProgressLocation.Notification,
            title: `Running ${selected.test.name}...`,
            cancellable: false,
        },
        async () => {
            try {
                const result = await apiClient.executeTest(selected.test.id);
                vscode.window.showInformationMessage(
                    `Test completed with score: ${result.score}/100`
                );
                testsProvider.refresh();
            } catch (error) {
                vscode.window.showErrorMessage('Test execution failed');
            }
        }
    );
}

async function viewAlerts() {
    const alerts = await apiClient.getAlerts({ limit: 50 });
    if (alerts.length === 0) {
        vscode.window.showInformationMessage('No active alerts');
        return;
    }

    const selected = await vscode.window.showQuickPick(
        alerts.map((a) => ({
            label: a.title,
            description: `${a.severity} • ${a.status}`,
            detail: a.message,
            alert: a,
        })),
        { placeHolder: 'Select alert' }
    );

    if (selected) {
        showAlertDetails(selected.alert);
    }
}

async function createTest() {
    analyzeUrl();
}

async function executeTest(testItem?: any) {
    if (testItem && testItem.test) {
        await vscode.window.withProgress(
            {
                location: vscode.ProgressLocation.Notification,
                title: `Running ${testItem.test.name}...`,
                cancellable: false,
            },
            async () => {
                try {
                    await apiClient.executeTest(testItem.test.id);
                    vscode.window.showInformationMessage('Test executed successfully');
                    testsProvider.refresh();
                } catch (error) {
                    vscode.window.showErrorMessage('Test execution failed');
                }
            }
        );
    }
}

async function acknowledgeAlert(alertItem?: any) {
    const alert = alertItem?.alert;
    if (!alert) {
        return;
    }

    const userName = await vscode.window.showInputBox({
        prompt: 'Enter your name',
        placeHolder: 'John Doe',
    });

    if (!userName) {
        return;
    }

    const success = await apiClient.acknowledgeAlert(alert.id, userName);
    if (success) {
        vscode.window.showInformationMessage('Alert acknowledged');
        alertsProvider.refresh();
    } else {
        vscode.window.showErrorMessage('Failed to acknowledge alert');
    }
}

async function showTestDetails(test: any) {
    const panel = vscode.window.createWebviewPanel(
        'guardianTestDetails',
        `Test: ${test.name}`,
        vscode.ViewColumn.One,
        { enableScripts: true }
    );

    const executions = await apiClient.getExecutions(test.id, 10);
    const trends = await apiClient.getTrends(test.id, 30);

    panel.webview.html = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: var(--vscode-font-family); padding: 20px; }
                h2 { color: var(--vscode-foreground); }
                .metric { margin: 10px 0; }
                .metric strong { color: var(--vscode-textLink-foreground); }
                .execution { padding: 10px; border: 1px solid var(--vscode-panel-border); margin: 5px 0; }
            </style>
        </head>
        <body>
            <h2>${test.name}</h2>
            <div class="metric"><strong>URL:</strong> ${test.url}</div>
            <div class="metric"><strong>Schedule:</strong> ${test.schedule}</div>
            <div class="metric"><strong>Status:</strong> ${test.enabled ? 'Enabled' : 'Disabled'}</div>
            
            <h3>Recent Executions</h3>
            ${executions.map((e: any) => `
                <div class="execution">
                    <strong>${e.status}</strong> - ${new Date(e.startedAt).toLocaleString()}
                </div>
            `).join('')}

            ${trends ? `
                <h3>Trends (30 days)</h3>
                <div class="metric"><strong>Average Score:</strong> ${trends.summary.avgScore.toFixed(1)}/100</div>
                <div class="metric"><strong>Success Rate:</strong> ${(trends.summary.successRate * 100).toFixed(1)}%</div>
                <div class="metric"><strong>Trend:</strong> ${trends.summary.trendDirection}</div>
            ` : ''}
        </body>
        </html>
    `;
}

async function showAlertDetails(alert: any) {
    const action = await vscode.window.showInformationMessage(
        `${alert.title}\n\n${alert.message}`,
        'Acknowledge',
        'Resolve',
        'Dismiss'
    );

    if (action === 'Acknowledge') {
        const userName = await vscode.window.showInputBox({
            prompt: 'Enter your name',
            placeHolder: 'John Doe',
        });
        if (userName) {
            await apiClient.acknowledgeAlert(alert.id, userName);
            alertsProvider.refresh();
        }
    } else if (action === 'Resolve') {
        await apiClient.resolveAlert(alert.id);
        alertsProvider.refresh();
    }
}

function refreshAll() {
    testsProvider.refresh();
    alertsProvider.refresh();
    trendsProvider.refresh();
}

export function deactivate() {
    if (refreshTimer) {
        clearInterval(refreshTimer);
    }
}

