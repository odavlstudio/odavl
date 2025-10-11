import * as vscode from 'vscode';

type TreeChangeEvent = RecipeItem | undefined | null | void;

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
        this.iconPath = new vscode.ThemeIcon('check', new vscode.ThemeColor('testing.iconPassed'));
      } else if (trustScore >= 60) {
        this.iconPath = new vscode.ThemeIcon('warning', new vscode.ThemeColor('testing.iconQueued'));
      } else {
        this.iconPath = new vscode.ThemeIcon('error', new vscode.ThemeColor('testing.iconFailed'));
      }
    } else {
      this.iconPath = new vscode.ThemeIcon(recipeType === 'category' ? 'folder' : 'symbol-method');
    }
  }
}

export class RecipesProvider implements vscode.TreeDataProvider<RecipeItem> {
  private readonly _onDidChangeTreeData: vscode.EventEmitter<TreeChangeEvent> = new vscode.EventEmitter<TreeChangeEvent>();
  readonly onDidChangeTreeData: vscode.Event<TreeChangeEvent> = this._onDidChangeTreeData.event;

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: RecipeItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: RecipeItem): Thenable<RecipeItem[]> {
    if (!element) {
      // Root recipe categories
      return Promise.resolve([
        new RecipeItem('ESLint Fixes', vscode.TreeItemCollapsibleState.Collapsed, 'category', undefined, 'Automated ESLint warning fixes'),
        new RecipeItem('Code Quality', vscode.TreeItemCollapsibleState.Collapsed, 'category', undefined, 'Code improvement patterns'),
        new RecipeItem('Performance', vscode.TreeItemCollapsibleState.Collapsed, 'category', undefined, 'Performance optimization recipes'),
        new RecipeItem('Security', vscode.TreeItemCollapsibleState.Collapsed, 'category', undefined, 'Security enhancement patterns'),
        new RecipeItem('Custom Recipes', vscode.TreeItemCollapsibleState.Collapsed, 'category', undefined, 'User-defined custom recipes')
      ]);
    } else if (element.label === 'ESLint Fixes') {
      return Promise.resolve([
        new RecipeItem('Remove Unused Variables', vscode.TreeItemCollapsibleState.None, 'eslint', 95, 'Removes unused variable declarations'),
        new RecipeItem('Fix Import Order', vscode.TreeItemCollapsibleState.None, 'eslint', 88, 'Sorts imports according to ESLint rules'),
        new RecipeItem('Add Missing Semicolons', vscode.TreeItemCollapsibleState.None, 'eslint', 92, 'Adds missing semicolons to statements'),
        new RecipeItem('Fix Indentation', vscode.TreeItemCollapsibleState.None, 'eslint', 85, 'Corrects code indentation issues')
      ]);
    } else if (element.label === 'Code Quality') {
      return Promise.resolve([
        new RecipeItem('Extract Duplicated Code', vscode.TreeItemCollapsibleState.None, 'quality', 75, 'Identifies and extracts duplicate code blocks'),
        new RecipeItem('Simplify Complex Functions', vscode.TreeItemCollapsibleState.None, 'quality', 68, 'Breaks down complex functions into smaller ones'),
        new RecipeItem('Improve Naming', vscode.TreeItemCollapsibleState.None, 'quality', 72, 'Suggests better variable and function names')
      ]);
    } else if (element.label === 'Performance') {
      return Promise.resolve([
        new RecipeItem('Optimize Loops', vscode.TreeItemCollapsibleState.None, 'performance', 80, 'Optimizes inefficient loop patterns'),
        new RecipeItem('Remove Dead Code', vscode.TreeItemCollapsibleState.None, 'performance', 90, 'Removes unreachable or unused code'),
        new RecipeItem('Bundle Size Optimization', vscode.TreeItemCollapsibleState.None, 'performance', 65, 'Reduces bundle size through optimizations')
      ]);
    } else if (element.label === 'Security') {
      return Promise.resolve([
        new RecipeItem('Fix XSS Vulnerabilities', vscode.TreeItemCollapsibleState.None, 'security', 85, 'Patches potential XSS security issues'),
        new RecipeItem('Secure API Calls', vscode.TreeItemCollapsibleState.None, 'security', 78, 'Adds security to API endpoints'),
        new RecipeItem('Input Validation', vscode.TreeItemCollapsibleState.None, 'security', 82, 'Adds proper input validation')
      ]);
    } else if (element.label === 'Custom Recipes') {
      return Promise.resolve([
        new RecipeItem('No custom recipes defined', vscode.TreeItemCollapsibleState.None, 'info', undefined, 'Create custom recipes in .odavl/recipes/'),
        new RecipeItem('Learn More', vscode.TreeItemCollapsibleState.None, 'help', undefined, 'Open recipe documentation')
      ]);
    }
    
    return Promise.resolve([]);
  }
}