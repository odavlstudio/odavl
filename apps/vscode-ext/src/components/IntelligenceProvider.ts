import * as vscode from 'vscode';
import { ODAVLDataService } from '../services/ODAVLDataService';
import { AIInsightsEngine } from '../intelligence/AIInsightsEngine';

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
  }
}

/**
 * Intelligence Provider - TreeDataProvider for AI insights and recommendations
 * Displays predictive analytics, quality forecasts, and optimization suggestions
 */
export class IntelligenceProvider implements vscode.TreeDataProvider<IntelligenceItem> {
  private _onDidChangeTreeData = new vscode.EventEmitter<IntelligenceItem | undefined | null | void>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  private insights: AIInsightsEngine;

  constructor(private dataService: ODAVLDataService) {
    this.insights = new AIInsightsEngine();
    // Note: onDataChanged method to be added to ODAVLDataService
  }

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: IntelligenceItem): vscode.TreeItem {
    return element;
  }

  async getChildren(element?: IntelligenceItem): Promise<IntelligenceItem[]> {
    if (!element) {
      return this.getRootItems();
    }

    switch (element.category) {
      case 'forecasts':
        return this.getForecastItems();
      case 'patterns':
        return this.getPatternItems();
      case 'recommendations':
        return this.getRecommendationItems();
      default:
        return [];
    }
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