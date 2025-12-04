/**
 * Guardian Mission Control - Categorized Menu System
 */

import chalk from 'chalk';
import { getTheme, drawBox, drawSeparator, formatDuration } from './theme.js';

/**
 * Menu Category
 */
export interface MenuCategory {
  id: string;
  name: string;
  emoji: string;
  items: MenuItem[];
}

/**
 * Menu Item
 */
export interface MenuItem {
  id: string;
  key: string;
  label: string;
  emoji: string;
  duration: number; // seconds
  description: string;
  shortcuts?: string[]; // alternative input shortcuts
  isNew?: boolean;
}

/**
 * Get all menu categories
 */
export function getMenuCategories(): MenuCategory[] {
  return [
    {
      id: 'analysis',
      name: 'ANALYSIS & DETECTION',
      emoji: '🔍',
      items: [
        {
          id: 'ai-scan',
          key: '1',
          label: 'AI Full Scan',
          emoji: '🤖',
          duration: 300,
          description: 'Deep AI-powered scan',
          shortcuts: ['f', 'ai', 'full'],
        },
        {
          id: 'language',
          key: '2',
          label: 'Language Analysis',
          emoji: '🗣️',
          duration: 10,
          description: 'Detect all languages',
          shortcuts: ['l', 'lang', 'language'],
          isNew: true,
        },
      ],
    },
    {
      id: 'testing',
      name: 'TESTING & VALIDATION',
      emoji: '🧪',
      items: [
        {
          id: 'website',
          key: 'w',
          label: 'Website Analysis',
          emoji: '🌐',
          duration: 90,
          description: 'Enterprise website scan',
          shortcuts: ['w', 'web', 'website'],
          isNew: true,
        },
        {
          id: 'visual',
          key: '3',
          label: 'Visual Regression',
          emoji: '📸',
          duration: 120,
          description: 'Screenshot comparison',
          shortcuts: ['v', 'visual', 'screenshot'],
        },
        {
          id: 'multidevice',
          key: '4',
          label: 'Multi-Device Test',
          emoji: '📱',
          duration: 180,
          description: 'Cross-platform checks',
          shortcuts: ['m', 'multi', 'device'],
        },
        {
          id: 'extension',
          key: '5',
          label: 'Extension Testing',
          emoji: '🧩',
          duration: 60,
          description: 'VS Code host testing',
          shortcuts: ['e', 'ext', 'extension'],
        },
      ],
    },
    {
      id: 'system',
      name: 'SYSTEM & INSIGHTS',
      emoji: '⚙️',
      items: [
        {
          id: 'dashboard',
          key: '6',
          label: 'Open Dashboard',
          emoji: '🌐',
          duration: 1,
          description: 'Web interface',
          shortcuts: ['d', 'dash', 'dashboard'],
        },
      ],
    },
  ];
}

/**
 * Display categorized menu
 */
export function displayCategorizedMenu(): void {
  const theme = getTheme();
  const { colors } = theme;
  const categories = getMenuCategories();

  console.log();
  
  const lines: string[] = [];
  lines.push(centerText(colors.highlight('SELECT MISSION TYPE:'), 62));
  lines.push('');

  categories.forEach((category, catIndex) => {
    // Category header
    lines.push(colors.secondary(`${category.emoji} ${category.name}`));
    lines.push(colors.muted('━'.repeat(60)));

    // Category items
    category.items.forEach((item) => {
      const keyStr = colors.primary(`[${item.key}]`);
      const labelStr = item.isNew 
        ? `${item.emoji} ${colors.highlight(item.label)} ${colors.warning('(NEW!')}`
        : `${item.emoji} ${colors.info(item.label)}`;
      
      const durationStr = formatDuration(item.duration).padStart(10);
      const separator = colors.muted('│');
      const descStr = colors.muted(item.description);

      lines.push(`${keyStr} ${labelStr.padEnd(30)} ${durationStr} ${separator} ${descStr}`);
    });

    // Add spacing between categories
    if (catIndex < categories.length - 1) {
      lines.push('');
    }
  });

  lines.push('');
  lines.push(colors.muted(`[${colors.primary('0')}] 🚪 Exit`));
  lines.push('');
  lines.push(colors.muted('💡 Tip: Press \'h\' for help'));

  console.log(drawBox(lines, '🛡️ Guardian Mission Control', 64));
  console.log();
}

/**
 * Parse user input to menu item
 */
export function parseMenuInput(input: string): MenuItem | 'exit' | 'help' | 'recommendations' | 'auto' | null {
  const normalized = input.trim().toLowerCase();

  // Special commands
  if (normalized === '0' || normalized === 'x' || normalized === 'exit') {
    return 'exit';
  }

  if (normalized === 'h' || normalized === 'help') {
    return 'help';
  }

  if (normalized === 'r' || normalized === 'rec' || normalized === 'recommendations') {
    return 'recommendations';
  }

  if (normalized === 'a' || normalized === 'auto') {
    return 'auto';
  }

  // Find matching menu item
  const categories = getMenuCategories();
  
  for (const category of categories) {
    for (const item of category.items) {
      // Match by key
      if (item.key === normalized) {
        return item;
      }

      // Match by shortcuts
      if (item.shortcuts?.includes(normalized)) {
        return item;
      }
    }
  }

  return null;
}

/**
 * Display help screen
 */
export function displayHelp(): void {
  const theme = getTheme();
  const { colors } = theme;
  const categories = getMenuCategories();

  console.log();

  const lines: string[] = [];
  lines.push(centerText(colors.highlight('⌨️ KEYBOARD SHORTCUTS & COMMANDS'), 62));
  lines.push('');
  lines.push(colors.secondary('Quick Commands:'));

  // Collect all shortcuts
  const shortcuts: string[] = [];
  
  categories.forEach(category => {
    category.items.forEach(item => {
      if (item.shortcuts && item.shortcuts.length > 0) {
        const shortcutStr = item.shortcuts.slice(0, 2).join(', ');
        shortcuts.push(`${colors.primary(shortcutStr.padEnd(15))} → ${item.emoji} ${item.label}`);
      }
    });
  });

  shortcuts.forEach(s => lines.push('  ' + s));

  lines.push('');
  lines.push(colors.secondary('Special Commands:'));
  lines.push(`  ${colors.primary('h, help'.padEnd(15))} → Show this help`);
  lines.push(`  ${colors.primary('r, rec'.padEnd(15))} → Show AI recommendations`);
  lines.push(`  ${colors.primary('a, auto'.padEnd(15))} → Run all recommended actions`);
  lines.push(`  ${colors.primary('0, x, exit'.padEnd(15))} → Exit Guardian`);

  lines.push('');
  lines.push(colors.secondary('Navigation:'));
  lines.push(`  ${colors.primary('Number keys'.padEnd(15))} → Select menu option`);
  lines.push(`  ${colors.primary('Text commands'.padEnd(15))} → Use shortcuts above`);
  lines.push(`  ${colors.primary('Ctrl+C'.padEnd(15))} → Cancel current operation`);

  console.log(drawBox(lines, '📖 Help & Documentation', 64));
  console.log();
}

/**
 * Center text helper
 */
function centerText(text: string, width: number): string {
  const strippedText = text.replace(/\x1b\[[0-9;]*m/g, '');
  const padding = Math.max(0, width - strippedText.length);
  const leftPad = Math.floor(padding / 2);
  const rightPad = padding - leftPad;
  return ' '.repeat(leftPad) + text + ' '.repeat(rightPad);
}

/**
 * Get menu item by ID
 */
export function getMenuItemById(id: string): MenuItem | null {
  const categories = getMenuCategories();
  
  for (const category of categories) {
    const item = category.items.find(i => i.id === id);
    if (item) return item;
  }

  return null;
}
