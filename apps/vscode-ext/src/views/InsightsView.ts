import * as vscode from 'vscode';
export class InsightsView implements vscode.TreeDataProvider<vscode.TreeItem> {
    private readonly _emitter = new vscode.EventEmitter<void>();
    readonly onDidChangeTreeData = this._emitter.event;
    constructor(private readonly ctx: vscode.ExtensionContext) { }
    refresh() { this._emitter.fire(); }
    dispose() { this._emitter.dispose(); }
    getTreeItem(i: vscode.TreeItem) { return i; }
    async getChildren(): Promise<vscode.TreeItem[]> {
        const ws = vscode.workspace.workspaceFolders?.[0]?.uri;
        if (!ws) return [new vscode.TreeItem('Open a workspace')];
        const items: vscode.TreeItem[] = [];
        for (const f of ['discovery', 'runtime', 'scorecard', 'attestation']) {
            const label = f[0].toUpperCase() + f.slice(1) + ' Report';
            const uri = vscode.Uri.joinPath(ws, 'reports', `${f}-latest.${f === 'scorecard' || f === 'attestation' ? 'json' : 'md'}`);
            const item = new vscode.TreeItem(label, vscode.TreeItemCollapsibleState.None);
            item.command = { command: 'vscode.open', title: 'Open', arguments: [uri] };
            item.iconPath = new vscode.ThemeIcon('graph-line');
            items.push(item);
        }
        return items;
    }
}
