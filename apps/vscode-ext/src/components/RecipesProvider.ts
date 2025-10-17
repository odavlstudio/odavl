
import * as vscode from 'vscode';
import { getODAVLIcon } from '../utils/iconLoader';
import { RecipesDataService } from '../providers/RecipesDataService';
import { RecipesLogic } from '../logic/RecipesLogic';
import { RecipesTree } from '../ui/RecipesTree';

export class RecipeItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly recipeType?: string,
    public readonly trustScore?: number,
    public readonly description?: string
  ) {
    super(label, collapsibleState);
    const trustText = trustScore ? ` (Trust: ${trustScore}%)` : '';
    this.tooltip = description || `${this.label}${trustText}`;
    this.contextValue = recipeType || 'recipe';
    // Set icon based on recipe type and trust score
    if (trustScore !== undefined) {
      if (trustScore >= 80) {
        this.iconPath = getODAVLIcon('check', { color: new vscode.ThemeColor('testing.iconPassed') });
      } else if (trustScore >= 60) {
        this.iconPath = getODAVLIcon('warning', { color: new vscode.ThemeColor('testing.iconQueued') });
      } else {
        this.iconPath = getODAVLIcon('error', { color: new vscode.ThemeColor('testing.iconFailed') });
      }
    } else {
      this.iconPath = getODAVLIcon(recipeType === 'category' ? 'folder' : 'symbol-method');
    }
  }
}

export class RecipesProvider implements vscode.TreeDataProvider<RecipeItem> {
  private readonly dataService: RecipesDataService;
  private readonly logic: RecipesLogic;
  private readonly tree: RecipesTree;

  constructor(dataService: RecipesDataService) {
    this.dataService = dataService;
    this.logic = new RecipesLogic(dataService);
    this.tree = new RecipesTree(this.logic);
    this.dataService.onDidChange(() => this.refresh());
  }

  // Delegate TreeDataProvider methods to RecipesTree
  get onDidChangeTreeData() {
    return this.tree.onDidChangeTreeData;
  }

  refresh(): void {
    this.tree.refresh();
  }

  dispose(): void {
    this.tree.dispose();
  }

  getTreeItem(element: RecipeItem): vscode.TreeItem {
    return this.tree.getTreeItem(element);
  }

  async getChildren(element?: RecipeItem): Promise<RecipeItem[]> {
    if (!element) {
      return await this.tree.getChildren();
    }
    const trustData: import('../types/ODAVLTypes').RecipeTrust[] = await (this.dataService.getRecipeTrust() as Promise<import('../types/ODAVLTypes').RecipeTrust[]>);
    const getRecipeTrust = (id: string): number => {
      const recipe = trustData.find((r) => r.id === id);
      return recipe ? Math.round(recipe.trust * 100) : 0;
    };
    const getRecipeRuns = (id: string): number => {
      const recipe = trustData.find((r) => r.id === id);
      return recipe?.runs || 0;
    };
    if (element.label === 'ESLint Fixes') {
      return [
        new RecipeItem('ESM Hygiene', vscode.TreeItemCollapsibleState.None, 'eslint', getRecipeTrust('esm-hygiene'), `Removes unused imports and variables (${getRecipeRuns('esm-hygiene')} runs)`),
        new RecipeItem('No-op Recipe', vscode.TreeItemCollapsibleState.None, 'eslint', getRecipeTrust('noop'), `Testing recipe for validation (${getRecipeRuns('noop')} runs)`)
      ];
    } else if (element.label === 'Code Quality') {
      return [
        new RecipeItem('Extract Duplicated Code', vscode.TreeItemCollapsibleState.None, 'quality', 75, 'Identifies and extracts duplicate code blocks'),
        new RecipeItem('Simplify Complex Functions', vscode.TreeItemCollapsibleState.None, 'quality', 68, 'Breaks down complex functions into smaller ones'),
        new RecipeItem('Improve Naming', vscode.TreeItemCollapsibleState.None, 'quality', 72, 'Suggests better variable and function names')
      ];
    } else if (element.label === 'Performance') {
      return [
        new RecipeItem('Optimize Loops', vscode.TreeItemCollapsibleState.None, 'performance', 80, 'Optimizes inefficient loop patterns'),
        new RecipeItem('Remove Dead Code', vscode.TreeItemCollapsibleState.None, 'performance', 90, 'Removes unreachable or unused code'),
        new RecipeItem('Bundle Size Optimization', vscode.TreeItemCollapsibleState.None, 'performance', 65, 'Reduces bundle size through optimizations')
      ];
    } else if (element.label === 'Security') {
      return [
        new RecipeItem('Fix XSS Vulnerabilities', vscode.TreeItemCollapsibleState.None, 'security', 85, 'Patches potential XSS security issues'),
        new RecipeItem('Secure API Calls', vscode.TreeItemCollapsibleState.None, 'security', 78, 'Adds security to API endpoints'),
        new RecipeItem('Input Validation', vscode.TreeItemCollapsibleState.None, 'security', 82, 'Adds proper input validation')
      ];
    } else if (element.label === 'Custom Recipes') {
      return [
        new RecipeItem('No custom recipes defined', vscode.TreeItemCollapsibleState.None, 'info', undefined, 'Create custom recipes in .odavl/recipes/'),
        new RecipeItem('Learn More', vscode.TreeItemCollapsibleState.None, 'help', undefined, 'Open recipe documentation')
      ];
    } else {
      return [];
    }
  }
}
