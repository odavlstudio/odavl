import * as vscode from 'vscode';

/**
 * Unified icon loader for ODAVL ActivityBar and TreeDataProviders.
 * Returns a ThemeIcon or URI for light/dark themes.
 */
export function getODAVLIcon(name: string, options?: { color?: vscode.ThemeColor }): vscode.ThemeIcon {
  // Map icon names to VS Code built-in icons or custom SVGs
  const iconMap: Record<string, string> = {
    // ODAVL View Icons (distinct for better UX)
    'dashboard': 'graph-line',
    'recipes': 'flame',
    'activity': 'pulse',
    'config': 'gear',
    'control': 'play-circle',
    'intelligence': 'lightbulb',
    // Status Icons
    'check': 'check',
    'error': 'error',
    'warning': 'warning',
    'info': 'info',
    'running': 'sync~spin',
    'success': 'check-all',
    // General Icons
    'history': 'history',
    'rocket': 'rocket',
    'pulse': 'pulse',
    'graph': 'graph',
    'settings-gear': 'settings-gear',
    'folder': 'folder',
    'shield': 'shield',
    'clock': 'clock',
    'play': 'play',
    'eye': 'eye',
    'list-unordered': 'list-unordered',
    'edit': 'edit',
    'file': 'file',
    'lock': 'lock',
    'x': 'x',
    'symbol-method': 'symbol-method',
  };
  const iconId = iconMap[name] || name;
  if (iconId.endsWith('.svg')) {
    // For custom SVGs, return a ThemeIcon fallback
    return new vscode.ThemeIcon('symbol-method', options?.color);
  }
  return new vscode.ThemeIcon(iconId, options?.color);
}
