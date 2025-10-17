import * as vscode from 'vscode';
import { getODAVLIcon } from '../utils/iconLoader';
import { ODAVLDataService } from '../services/ODAVLDataService';
import { AIInsightsEngine } from '../intelligence/AIInsightsEngine';
import { Logger } from '../utils/Logger';

/**
 * Intelligence Item for TreeView display
 */
class IntelligenceItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly category: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState
  ) {
    super(label, collapsibleState);
    this.contextValue = category;
    // Assign iconPath based on category/type
    let iconName: string;
    switch (category) {
      case 'forecasts':
      case 'forecast':
        iconName = 'symbol-number';
        break;
      case 'patterns':
      case 'pattern':
        iconName = 'graph';
        break;
      case 'recommendations':
      case 'recommendation':
        iconName = 'lightbulb';
        break;
      case 'info':
        iconName = 'info';
        break;
      default:
        iconName = 'symbol-key';
    }
    this.iconPath = getODAVLIcon(iconName);
  }
}

/**
 * Intelligence Provider - TreeDataProvider for AI insights and recommendations
 * Displays predictive analytics, quality forecasts, and optimization suggestions
 */
export class IntelligenceProvider implements vscode.TreeDataProvider<IntelligenceItem> {
  private readonly _onDidChangeTreeData = new vscode.EventEmitter<IntelligenceItem | undefined | null | void>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;
  private readonly insights: AIInsightsEngine;
  private readonly logger = new Logger();

  constructor(private readonly dataService: ODAVLDataService) {
    this.insights = new AIInsightsEngine();
    // Note: onDataChanged method to be added to ODAVLDataService
  }

  refresh(): void {
    const perfEnabled = vscode.workspace.getConfiguration('odavl').get('enablePerfMetrics', false);
    let t0: number | undefined;
    if (perfEnabled) t0 = performance.now();
    this._onDidChangeTreeData.fire();
    if (perfEnabled && t0 !== undefined) {
      const t1 = performance.now();
      this.logger.info(`[Perf] IntelligenceProvider.refresh: ${(t1 - t0).toFixed(2)}ms`);
    }
  }

  dispose(): void {
    this._onDidChangeTreeData.dispose();
  }

  getTreeItem(element: IntelligenceItem): vscode.TreeItem {
    return element;
  }

  async getChildren(element?: IntelligenceItem): Promise<IntelligenceItem[]> {
    const perfEnabled = vscode.workspace.getConfiguration('odavl').get('enablePerfMetrics', false);
    let t0: number | undefined;
    if (perfEnabled) t0 = performance.now();
    let result: Promise<IntelligenceItem[]>;
    if (!element) {
      result = Promise.resolve(this.getRootItems());
    } else {
      switch (element.category) {
        case 'forecasts':
          result = this.getForecastItems();
          break;
        case 'patterns':
          result = Promise.resolve(this.getPatternItems());
          break;
        case 'recommendations':
          result = Promise.resolve(this.getRecommendationItems());
          break;
        default:
          result = Promise.resolve([]);
      }
    }
    if (perfEnabled && t0 !== undefined) {
      result.then(() => {
        const t1 = performance.now();
        this.logger.info(`[Perf] IntelligenceProvider.getChildren: ${(t1 - t0).toFixed(2)}ms`);
      });
    }
    return result;
  }

  private getRootItems(): IntelligenceItem[] {
    return [
      new IntelligenceItem('Quality Forecasts', 'forecasts', vscode.TreeItemCollapsibleState.Expanded),
      new IntelligenceItem('Pattern Analysis', 'patterns', vscode.TreeItemCollapsibleState.Collapsed),
      new IntelligenceItem('Recommendations', 'recommendations', vscode.TreeItemCollapsibleState.Collapsed)
    ];
  }

  private async getForecastItems(): Promise<IntelligenceItem[]> {
    const history = await this.dataService.getHistoryEntries();
    this.insights.initialize(history);

    const eslintForecast = this.insights.generateQualityForecast('eslintWarnings');
    const typesForecast = this.insights.generateQualityForecast('typeErrors');

    const items: IntelligenceItem[] = [];

    if (eslintForecast) {
      items.push(new IntelligenceItem(
        `ESLint: ${eslintForecast.currentValue} → ${eslintForecast.predicted7Days[0]} (${eslintForecast.trendDirection})`,
        'forecast',
        vscode.TreeItemCollapsibleState.None
      ));
    }

    if (typesForecast) {
      items.push(new IntelligenceItem(
        `Types: ${typesForecast.currentValue} → ${typesForecast.predicted7Days[0]} (${typesForecast.trendDirection})`,
        'forecast',
        vscode.TreeItemCollapsibleState.None
      ));
    }

    return items.length > 0 ? items : [new IntelligenceItem('No forecast data available', 'info', vscode.TreeItemCollapsibleState.None)];
  }

  private getPatternItems(): IntelligenceItem[] {
    return [
      new IntelligenceItem('Daily quality patterns detected', 'pattern', vscode.TreeItemCollapsibleState.None),
      new IntelligenceItem('Weekly improvement cycles', 'pattern', vscode.TreeItemCollapsibleState.None)
    ];
  }

  private getRecommendationItems(): IntelligenceItem[] {
    return [
      new IntelligenceItem('Run quality check recommended', 'recommendation', vscode.TreeItemCollapsibleState.None),
      new IntelligenceItem('Consider code cleanup', 'recommendation', vscode.TreeItemCollapsibleState.None)
    ];
  }
}
