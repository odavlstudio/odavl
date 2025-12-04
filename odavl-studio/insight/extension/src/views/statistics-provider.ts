import * as vscode from 'vscode';

export class StatisticsTreeItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly description?: string,
    public readonly iconPath?: vscode.ThemeIcon
  ) {
    super(label, collapsibleState);
  }
}

export class StatisticsProvider implements vscode.TreeDataProvider<StatisticsTreeItem> {
  private _onDidChangeTreeData = new vscode.EventEmitter<StatisticsTreeItem | undefined | null | void>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;
  private diagnosticCollection: vscode.DiagnosticCollection;
  private issuesProviderRef: { getTotalIssues(): number };
  private refreshDebounceTimer: NodeJS.Timeout | undefined;
  private disposables: vscode.Disposable[] = [];
  private cachedStatistics: any = null;

  constructor(
    issuesProvider: { getTotalIssues(): number },
    diagnostics: vscode.DiagnosticCollection
  ) {
    this.issuesProviderRef = issuesProvider;
    this.diagnosticCollection = diagnostics;
    
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
      this.cachedStatistics = null; // Clear cache
      this._onDidChangeTreeData.fire();
    } catch (error) {
      console.error('ODAVL: Failed to refresh statistics', error);
    }
  }

  getTreeItem(element: StatisticsTreeItem): vscode.TreeItem {
    return element;
  }

  getChildren(): Thenable<StatisticsTreeItem[]> {
    try {
      const stats = this.calculateStatistics();
      
      if (stats.total === 0) {
        return Promise.resolve([
          new StatisticsTreeItem(
            'No issues detected ✨',
            vscode.TreeItemCollapsibleState.None,
            'Your code looks great!',
            new vscode.ThemeIcon('verified', new vscode.ThemeColor('terminal.ansiGreen'))
          ),
          new StatisticsTreeItem(
            'Start Analysis',
            vscode.TreeItemCollapsibleState.None,
            'Click to analyze',
            new vscode.ThemeIcon('search')
          )
        ]);
      }
      
      return Promise.resolve([
        new StatisticsTreeItem(
          'Total Issues',
          vscode.TreeItemCollapsibleState.None,
          stats.total.toString(),
          new vscode.ThemeIcon('pulse')
        ),
        new StatisticsTreeItem(
          'Errors',
          vscode.TreeItemCollapsibleState.None,
          stats.errors.toString(),
          new vscode.ThemeIcon('error', new vscode.ThemeColor('errorForeground'))
        ),
        new StatisticsTreeItem(
          'Warnings',
          vscode.TreeItemCollapsibleState.None,
          stats.warnings.toString(),
          new vscode.ThemeIcon('warning', new vscode.ThemeColor('warningForeground'))
        ),
        new StatisticsTreeItem(
          'Info',
          vscode.TreeItemCollapsibleState.None,
          stats.info.toString(),
          new vscode.ThemeIcon('info')
        ),
        new StatisticsTreeItem(
          'Files Analyzed',
          vscode.TreeItemCollapsibleState.None,
          stats.files.toString(),
          new vscode.ThemeIcon('file')
        ),
        new StatisticsTreeItem(
          'High Confidence',
          vscode.TreeItemCollapsibleState.None,
          `${stats.highConfidence} (>90%)`,
          new vscode.ThemeIcon('verified-filled', new vscode.ThemeColor('terminal.ansiGreen'))
        )
      ]);
    } catch (error) {
      console.error('ODAVL: Failed to get statistics children', error);
      return Promise.resolve([]);
    }
  }

  private calculateStatistics() {
    // Return cached statistics if available
    if (this.cachedStatistics) {
      return this.cachedStatistics;
    }

    try {
      let errors = 0;
      let warnings = 0;
      let info = 0;
      let highConfidence = 0;
      const files = new Set<string>();

      this.diagnosticCollection.forEach((uri, diagnostics) => {
      const odavlDiagnostics = diagnostics.filter(d => d.source?.startsWith('ODAVL'));
      
      if (odavlDiagnostics.length > 0) {
        files.add(uri.fsPath);
        
        odavlDiagnostics.forEach(d => {
          if (d.severity === vscode.DiagnosticSeverity.Error) {
            errors++;
          } else if (d.severity === vscode.DiagnosticSeverity.Warning) {
            warnings++;
          } else {
            info++;
          }
          
          // Check confidence
          const match = d.message.match(/confidence[:\s]+(\d+)%/i);
          if (match && parseInt(match[1]) > 90) {
            highConfidence++;
          }
        });
      }
      });

      this.cachedStatistics = {
        total: errors + warnings + info,
        errors,
        warnings,
        info,
        files: files.size,
        highConfidence
      };

      return this.cachedStatistics;
    } catch (error) {
      console.error('ODAVL: Failed to calculate statistics', error);
      return {
        total: 0,
        errors: 0,
        warnings: 0,
        info: 0,
        files: 0,
        highConfidence: 0
      };
    }
  }

  dispose(): void {
    try {
      // Clear debounce timer
      if (this.refreshDebounceTimer) {
        clearTimeout(this.refreshDebounceTimer);
        this.refreshDebounceTimer = undefined;
      }
      
      // Dispose event listeners
      this.disposables.forEach(d => d.dispose());
      this.disposables = [];
      
      // Clear cache
      this.cachedStatistics = null;
      
      // Dispose event emitter
      this._onDidChangeTreeData.dispose();
    } catch (error) {
      console.error('ODAVL: Failed to dispose statistics provider', error);
    }
  }
}