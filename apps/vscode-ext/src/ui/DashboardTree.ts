

import * as vscode from 'vscode';
import { DashboardItem } from '../components/DashboardProvider';
import { DashboardLogic } from '../logic/DashboardLogic';
import { getODAVLIcon } from '../utils/iconLoader';

type TreeChangeEvent = DashboardItem | undefined | null | void;

/**
 * ODAVL Activity Bar DashboardTree (Wave 2 UI/UX)
 * - Brand colors, animated feedback, richer item rendering
 * - Prepares for real-time updates and Tailwind-style class structure
 */
export class DashboardTree implements vscode.TreeDataProvider<DashboardItem> {
    private readonly _onDidChangeTreeData: vscode.EventEmitter<TreeChangeEvent> = new vscode.EventEmitter<TreeChangeEvent>();
    readonly onDidChangeTreeData: vscode.Event<TreeChangeEvent> = this._onDidChangeTreeData.event;
    private readonly logic: DashboardLogic;

    constructor(logic: DashboardLogic) {
        this.logic = logic;
    }

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    dispose(): void {
        this._onDidChangeTreeData.dispose();
    }

    /**
     * Custom rendering for Activity Bar items: brand color, icon, animated feedback
     */
    getTreeItem(element: DashboardItem): vscode.TreeItem {
        // Use iconLoader for ODAVL icons and brand color
        const item = new vscode.TreeItem(element.label, element.collapsibleState);
        // Use icon if present, else fallback to dashboard icon
        if (element.icon) {
            item.iconPath = getODAVLIcon(element.icon, { color: new vscode.ThemeColor('odavl.activityBarIcon') });
        } else {
            item.iconPath = new vscode.ThemeIcon('dashboard', new vscode.ThemeColor('odavl.activityBarIcon'));
        }
        item.description = element.description;
        item.tooltip = element.tooltip || element.label;
        // Animated feedback for active items
        if (element.contextValue === 'active') {
            item.iconPath = new vscode.ThemeIcon('sync~spin', new vscode.ThemeColor('odavl.activityBarIconActive'));
        }
        item.contextValue = element.contextValue;
        if (element.command) {
            item.command = element.command;
        }
        return item;
    }

    /**
     * Real-time updates: get children from logic, support for richer item types
     */
    async getChildren(element?: DashboardItem): Promise<DashboardItem[]> {
        if (!element) {
            // Root items: dashboard sections (Overview, Analytics, Config, etc.)
            return this.logic.getRootItems();
        }
        // No children for now (future: add sub-sections)
        return [];
    }
}
