import * as vscode from 'vscode';

export interface IssueItem {
  severity: 'error' | 'warning' | 'info' | 'hint';
  message: string;
  source: string;
  file: string;
  line: number;
  confidence: number;
}

export class IssuesTreeItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly issue?: IssueItem,
    public readonly command?: vscode.Command
  ) {
    super(label, collapsibleState);
    
    if (issue) {
      this.tooltip = `${issue.message}\nFile: ${issue.file}:${issue.line}\nConfidence: ${issue.confidence}%`;
      this.description = `${issue.file}:${issue.line}`;
      this.contextValue = 'issue';
      
      // Set icon based on severity
      this.iconPath = new vscode.ThemeIcon(
        issue.severity === 'error' ? 'error' :
        issue.severity === 'warning' ? 'warning' :
        issue.severity === 'info' ? 'info' : 'lightbulb',
        issue.severity === 'error' ? new vscode.ThemeColor('errorForeground') :
        issue.severity === 'warning' ? new vscode.ThemeColor('warningForeground') :
        new vscode.ThemeColor('foreground')
      );
    }
  }
}

export class IssuesExplorerProvider implements vscode.TreeDataProvider<IssuesTreeItem> {
  private _onDidChangeTreeData = new vscode.EventEmitter<IssuesTreeItem | undefined | null | void>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  private issues: Map<string, IssueItem[]> = new Map();
  private diagnosticCollection: vscode.DiagnosticCollection;
  private refreshDebounceTimer: NodeJS.Timeout | undefined;
  private disposables: vscode.Disposable[] = [];

  constructor(diagnostics: vscode.DiagnosticCollection) {
    this.diagnosticCollection = diagnostics;
    
    // Watch for diagnostic changes with debouncing
    const diagnosticsListener = vscode.languages.onDidChangeDiagnostics(() => {
      this.debouncedRefresh();
    });
    this.disposables.push(diagnosticsListener);
  }

  private debouncedRefresh(): void {
    if (this.refreshDebounceTimer) {
      clearTimeout(this.refreshDebounceTimer);
    }
    this.refreshDebounceTimer = setTimeout(() => {
      this.refresh();
    }, 300); // 300ms debounce
  }

  refresh(): void {
    try {
      this.loadIssues();
      this._onDidChangeTreeData.fire();
    } catch (error) {
      console.error('ODAVL: Failed to refresh issues explorer', error);
    }
  }

  private loadIssues(): void {
    try {
      this.issues.clear(); // Clear old data to prevent memory leaks
      
      this.diagnosticCollection.forEach((uri, diagnostics) => {
        const odavlDiagnostics = diagnostics.filter(d => d.source?.startsWith('ODAVL'));
        
        if (odavlDiagnostics.length > 0) {
          const items: IssueItem[] = odavlDiagnostics.map(d => ({
            severity: d.severity === vscode.DiagnosticSeverity.Error ? 'error' :
                     d.severity === vscode.DiagnosticSeverity.Warning ? 'warning' :
                     d.severity === vscode.DiagnosticSeverity.Information ? 'info' : 'hint',
            message: d.message,
            source: d.source || 'ODAVL',
            file: vscode.workspace.asRelativePath(uri),
            line: d.range.start.line + 1,
            confidence: this.extractConfidence(d.message)
          }));
          
          this.issues.set(uri.fsPath, items);
        }
      });
    } catch (error) {
      console.error('ODAVL: Failed to load issues', error);
      vscode.window.showErrorMessage('ODAVL Insight: Failed to load issues. Please try refreshing.');
    }
  }

  private extractConfidence(message: string): number {
    const match = message.match(/confidence[:\s]+(\d+)%/i);
    return match ? parseInt(match[1]) : 85;
  }

  getTreeItem(element: IssuesTreeItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: IssuesTreeItem): Thenable<IssuesTreeItem[]> {
    if (!element) {
      // Root level: group by severity
      const errors = this.getIssuesBySeverity('error');
      const warnings = this.getIssuesBySeverity('warning');
      const infos = this.getIssuesBySeverity('info');
      
      const result: IssuesTreeItem[] = [];
      
      if (errors.length > 0) {
        result.push(new IssuesTreeItem(
          `Errors (${errors.length})`,
          vscode.TreeItemCollapsibleState.Expanded
        ));
      }
      
      if (warnings.length > 0) {
        result.push(new IssuesTreeItem(
          `Warnings (${warnings.length})`,
          vscode.TreeItemCollapsibleState.Expanded
        ));
      }
      
      if (infos.length > 0) {
        result.push(new IssuesTreeItem(
          `Info (${infos.length})`,
          vscode.TreeItemCollapsibleState.Collapsed
        ));
      }
      
      if (result.length === 0) {
        const welcomeItem = new IssuesTreeItem(
          'Welcome to ODAVL Insight! 🎉',
          vscode.TreeItemCollapsibleState.None
        );
        welcomeItem.description = '';
        welcomeItem.tooltip = 'Start analyzing your code to see issues here';
        welcomeItem.iconPath = new vscode.ThemeIcon('verified', new vscode.ThemeColor('terminal.ansiGreen'));
        
        const analyzeItem = new IssuesTreeItem(
          'Click here to analyze workspace',
          vscode.TreeItemCollapsibleState.None,
          undefined,
          {
            command: 'odavl-insight.analyzeWorkspace',
            title: 'Analyze Workspace',
            arguments: []
          }
        );
        analyzeItem.iconPath = new vscode.ThemeIcon('search');
        analyzeItem.tooltip = 'Analyze all files in workspace';
        
        return Promise.resolve([welcomeItem, analyzeItem]);
      }
      
      return Promise.resolve(result);
    } else {
      // Second level: show issues
      const severity = element.label.toLowerCase().includes('error') ? 'error' :
                      element.label.toLowerCase().includes('warning') ? 'warning' : 'info';
      
      const issues = this.getIssuesBySeverity(severity);
      const items = issues.map(issue => new IssuesTreeItem(
        issue.message.substring(0, 60) + (issue.message.length > 60 ? '...' : ''),
        vscode.TreeItemCollapsibleState.None,
        issue,
        {
          command: 'vscode.open',
          title: 'Open File',
          arguments: [
            vscode.Uri.file(issue.file),
            { selection: new vscode.Range(issue.line - 1, 0, issue.line - 1, 0) }
          ]
        }
      ));
      
      return Promise.resolve(items);
    }
  }

  private getIssuesBySeverity(severity: string): IssueItem[] {
    const result: IssueItem[] = [];
    this.issues.forEach(items => {
      result.push(...items.filter(i => i.severity === severity));
    });
    return result;
  }

  getTotalIssues(): number {
    let total = 0;
    this.issues.forEach(items => {
      total += items.length;
    });
    return total;
  }

  dispose(): void {
    // Clear debounce timer
    if (this.refreshDebounceTimer) {
      clearTimeout(this.refreshDebounceTimer);
      this.refreshDebounceTimer = undefined;
    }
    
    // Dispose all event listeners
    this.disposables.forEach(d => d.dispose());
    this.disposables = [];
    
    // Clear data
    this.issues.clear();
    
    // Dispose event emitter
    this._onDidChangeTreeData.dispose();
  }
}
