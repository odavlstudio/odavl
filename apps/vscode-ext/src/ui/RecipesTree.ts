
import * as vscode from 'vscode';
import { RecipeItem } from '../components/RecipesProvider';
import { RecipesLogic } from '../logic/RecipesLogic';
import { getODAVLIcon } from '../utils/iconLoader';

type TreeChangeEvent = RecipeItem | undefined | null | void;

/**
 * ODAVL Activity Bar RecipesTree (Wave 2 UI/UX)
 * - Brand colors, icons, animated expand/collapse, real-time sync
 * - Prepares for richer item rendering and animation support
 */
export class RecipesTree implements vscode.TreeDataProvider<RecipeItem> {
    private readonly _onDidChangeTreeData: vscode.EventEmitter<TreeChangeEvent> = new vscode.EventEmitter<TreeChangeEvent>();
    readonly onDidChangeTreeData: vscode.Event<TreeChangeEvent> = this._onDidChangeTreeData.event;
    private readonly logic: RecipesLogic;

    constructor(logic: RecipesLogic) {
        this.logic = logic;
    }

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    dispose(): void {
        this._onDidChangeTreeData.dispose();
    }

    /**
     * Custom rendering for Activity Bar recipe items: brand color, icon, animated expand/collapse
     */
    getTreeItem(element: RecipeItem): vscode.TreeItem {
        // Use ODAVL icon and color for categories and recipes
        const item = new vscode.TreeItem(element.label, element.collapsibleState);
        if (element.recipeType === 'category') {
            item.iconPath = getODAVLIcon('folder', { color: new vscode.ThemeColor('odavl.activityBarIcon') });
        } else if (element.recipeType === 'help') {
            item.iconPath = getODAVLIcon('info', { color: new vscode.ThemeColor('odavl.activityBarIcon') });
        } else if (element.recipeType === 'info') {
            item.iconPath = getODAVLIcon('info', { color: new vscode.ThemeColor('odavl.activityBarIcon') });
        } else if (element.recipeType === 'eslint') {
            item.iconPath = getODAVLIcon('flame', { color: new vscode.ThemeColor('odavl.activityBarIcon') });
        } else if (element.recipeType === 'quality') {
            item.iconPath = getODAVLIcon('graph', { color: new vscode.ThemeColor('odavl.activityBarIcon') });
        } else if (element.recipeType === 'performance') {
            item.iconPath = getODAVLIcon('rocket', { color: new vscode.ThemeColor('odavl.activityBarIcon') });
        } else if (element.recipeType === 'security') {
            item.iconPath = getODAVLIcon('shield', { color: new vscode.ThemeColor('odavl.activityBarIcon') });
        } else {
            item.iconPath = element.iconPath || getODAVLIcon('symbol-method', { color: new vscode.ThemeColor('odavl.activityBarIcon') });
        }
        item.description = element.description;
        item.tooltip = element.tooltip || element.label;
        item.contextValue = element.contextValue;
        if (element.command) {
            item.command = element.command;
        }
        // Animated expand/collapse: VS Code handles this, but we can add context for future animation
        return item;
    }

    /**
     * Real-time updates: get children from logic, support for richer item types
     */
    async getChildren(element?: RecipeItem): Promise<RecipeItem[]> {
        if (!element) {
            // Root items: recipe categories
            return this.logic.getRootItems();
        }
        // No children here; handled in provider for now
        return [];
    }
}
