import * as vscode from 'vscode';

export interface DetectorInfo {
  id: string;
  name: string;
  enabled: boolean;
  language: string;
  description: string;
}

export class DetectorTreeItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly detector?: DetectorInfo
  ) {
    super(label, collapsibleState);
    
    if (detector) {
      this.tooltip = detector.description;
      this.description = detector.language;
      this.contextValue = 'detector';
      
      this.iconPath = new vscode.ThemeIcon(
        detector.enabled ? 'check' : 'close',
        detector.enabled ? 
          new vscode.ThemeColor('terminal.ansiGreen') : 
          new vscode.ThemeColor('terminal.ansiRed')
      );
    }
  }
}

export class DetectorsProvider implements vscode.TreeDataProvider<DetectorTreeItem> {
  private _onDidChangeTreeData = new vscode.EventEmitter<DetectorTreeItem | undefined | null | void>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  private detectors: DetectorInfo[] = [
    // TypeScript/JavaScript
    { id: 'typescript', name: 'TypeScript', enabled: true, language: 'TypeScript', description: 'TypeScript compiler errors and type issues' },
    { id: 'eslint', name: 'ESLint', enabled: true, language: 'TypeScript', description: 'ESLint rule violations' },
    { id: 'import', name: 'Import', enabled: true, language: 'TypeScript', description: 'Import/export issues' },
    { id: 'circular', name: 'Circular', enabled: true, language: 'TypeScript', description: 'Circular dependency detection' },
    { id: 'complexity', name: 'Complexity', enabled: true, language: 'TypeScript', description: 'Code complexity analysis' },
    
    // Security
    { id: 'security', name: 'Security', enabled: true, language: 'All', description: 'Security vulnerabilities (XSS, SQL injection, secrets)' },
    
    // Performance
    { id: 'performance', name: 'Performance', enabled: true, language: 'All', description: 'Performance bottlenecks' },
    { id: 'network', name: 'Network', enabled: true, language: 'All', description: 'Network request issues' },
    
    // Python
    { id: 'python-type', name: 'Python Type', enabled: true, language: 'Python', description: 'Type hint violations' },
    { id: 'python-security', name: 'Python Security', enabled: true, language: 'Python', description: 'Python security issues' },
    { id: 'python-complexity', name: 'Python Complexity', enabled: true, language: 'Python', description: 'Python code complexity' },
    
    // Java
    { id: 'java-exception', name: 'Java Exception', enabled: true, language: 'Java', description: 'Exception handling patterns' },
    { id: 'java-stream', name: 'Java Stream', enabled: true, language: 'Java', description: 'Stream API usage' },
    { id: 'java-complexity', name: 'Java Complexity', enabled: true, language: 'Java', description: 'Java code complexity' },
  ];

  constructor(private context: vscode.ExtensionContext) {
    this.loadDetectorStates();
  }

  refresh(): void {
    try {
      this._onDidChangeTreeData.fire();
    } catch (error) {
      console.error('ODAVL: Failed to refresh detectors', error);
    }
  }

  getTreeItem(element: DetectorTreeItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: DetectorTreeItem): Thenable<DetectorTreeItem[]> {
    try {
      if (!element) {
        // Root level: group by language
        const languages = [...new Set(this.detectors.map(d => d.language))];
        
        return Promise.resolve(languages.map(lang => 
          new DetectorTreeItem(
            lang,
            vscode.TreeItemCollapsibleState.Expanded
          )
        ));
      } else {
        // Second level: show detectors for language
        const detectors = this.detectors.filter(d => d.language === element.label);
        
        return Promise.resolve(detectors.map(detector => 
          new DetectorTreeItem(
            detector.name,
            vscode.TreeItemCollapsibleState.None,
            detector
          )
        ));
      }
    } catch (error) {
      console.error('ODAVL: Failed to get detector children', error);
      return Promise.resolve([]);
    }
  }

  toggleDetector(item: DetectorTreeItem): void {
    if (item.detector) {
      const detector = this.detectors.find(d => d.id === item.detector!.id);
      if (detector) {
        detector.enabled = !detector.enabled;
        this.saveDetectorStates();
        this.refresh();
        
        vscode.window.showInformationMessage(
          `${detector.name} detector ${detector.enabled ? 'enabled' : 'disabled'}`
        );
      }
    }
  }

  private loadDetectorStates(): void {
    try {
      const states = this.context.globalState.get<Record<string, boolean>>('detectorStates', {});
      this.detectors.forEach(detector => {
        if (states[detector.id] !== undefined) {
          detector.enabled = states[detector.id];
        }
      });
    } catch (error) {
      console.error('ODAVL: Failed to load detector states', error);
    }
  }

  private saveDetectorStates(): void {
    try {
      const states: Record<string, boolean> = {};
      this.detectors.forEach(detector => {
        states[detector.id] = detector.enabled;
      });
      this.context.globalState.update('detectorStates', states);
    } catch (error) {
      console.error('ODAVL: Failed to save detector states', error);
    }
  }

  getEnabledDetectors(): string[] {
    return this.detectors.filter(d => d.enabled).map(d => d.id);
  }

  dispose(): void {
    try {
      // Dispose event emitter
      this._onDidChangeTreeData.dispose();
      
      // Clear data
      this.detectors = [];
    } catch (error) {
      console.error('ODAVL: Failed to dispose detectors provider', error);
    }
  }
}
