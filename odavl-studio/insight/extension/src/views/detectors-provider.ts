import * as vscode from 'vscode';
import { getLicenseManager } from '../extension-v2.js';
import { DetectorRegistry, type DetectorInfo as RegistryDetectorInfo } from '../detector-registry.js';
import { SubscriptionTier } from '../license/license-manager.js';

export interface DetectorInfo {
  id: string;
  name: string;
  enabled: boolean;
  language: string;
  description: string;
  locked?: boolean; // NEW: Indicates if detector requires upgrade
  requiredTier?: SubscriptionTier; // NEW: Required tier
}

export class DetectorTreeItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly detector?: DetectorInfo
  ) {
    super(label, collapsibleState);
    
    if (detector) {
      this.tooltip = detector.locked 
        ? `${detector.description}\n\n🔒 Requires ${detector.requiredTier} tier - Click to upgrade`
        : detector.description;
      this.description = detector.language;
      this.contextValue = detector.locked ? 'detector-locked' : 'detector';
      
      // Icon based on lock status
      if (detector.locked) {
        this.iconPath = new vscode.ThemeIcon(
          'lock',
          new vscode.ThemeColor('editorWarning.foreground')
        );
        // Make locked detectors clickable
        this.command = {
          command: 'odavl-insight.showUpgradePrompt',
          title: 'Upgrade',
          arguments: [detector]
        };
      } else {
        this.iconPath = new vscode.ThemeIcon(
          detector.enabled ? 'check' : 'close',
          detector.enabled ? 
            new vscode.ThemeColor('terminal.ansiGreen') : 
            new vscode.ThemeColor('terminal.ansiRed')
        );
      }
    }
  }
}

export class DetectorsProvider implements vscode.TreeDataProvider<DetectorTreeItem> {
  private _onDidChangeTreeData = new vscode.EventEmitter<DetectorTreeItem | undefined | null | void>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  private detectors: DetectorInfo[] = [];

  constructor(private context: vscode.ExtensionContext) {
    this.loadDetectors();
  }

  /**
   * Load detectors based on current license tier
   */
  private async loadDetectors(): Promise<void> {
    try {
      const licenseManager = getLicenseManager();
      const license = await licenseManager.checkLicense();
      
      // Get available detectors from registry
      const availableDetectors = DetectorRegistry.getAvailableDetectors(license.tier);
      const lockedDetectors = DetectorRegistry.getLockedDetectors(license.tier);

      // Map language categories
      const languageMap: Record<string, string> = {
        'typescript': 'TypeScript',
        'eslint': 'TypeScript',
        'import': 'TypeScript',
        'security': 'All',
        'performance': 'All',
        'circular': 'TypeScript',
        'package': 'All',
        'build': 'All',
        'network': 'All',
        'complexity': 'All',
        'isolation': 'TypeScript',
        'python': 'Python',
        'java': 'Java',
        'go': 'Go',
        'rust': 'Rust',
        'ml-prediction': 'All',
        'auto-fix': 'All',
        'custom-rules': 'Enterprise',
        'audit-logs': 'Enterprise',
        'compliance': 'Enterprise'
      };

      // Convert to DetectorInfo format (available)
      this.detectors = [
        ...availableDetectors.map(d => ({
          id: d.id,
          name: d.name,
          enabled: true,
          language: languageMap[d.id] || 'All',
          description: d.description,
          locked: false
        })),
        // Add locked detectors (grayed out)
        ...lockedDetectors.map(d => ({
          id: d.id,
          name: d.name,
          enabled: false,
          language: languageMap[d.id] || 'All',
          description: d.description,
          locked: true,
          requiredTier: d.requiredTier
        }))
      ];

      this.saveDetectorStates();
    } catch (error) {
      console.error('Failed to load detectors:', error);
      // Fallback to FREE tier detectors
      this.detectors = [
        { id: 'typescript', name: 'TypeScript', enabled: true, language: 'TypeScript', description: 'TypeScript compiler errors' },
        { id: 'eslint', name: 'ESLint', enabled: true, language: 'TypeScript', description: 'ESLint violations' },
        { id: 'import', name: 'Import', enabled: true, language: 'TypeScript', description: 'Import issues' }
      ];
    }
  }

  async refresh(): Promise<void> {
    try {
      await this.loadDetectors();
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
        // Prevent toggling locked detectors
        if (detector.locked) {
          vscode.window.showWarningMessage(
            `${detector.name} detector is locked. Upgrade to ${detector.requiredTier} to unlock.`,
            'Upgrade Now'
          ).then(selection => {
            if (selection === 'Upgrade Now') {
              vscode.commands.executeCommand('odavl.showUpgradePrompt');
            }
          });
          return;
        }

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
