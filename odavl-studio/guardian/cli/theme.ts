/**
 * Guardian Mission Control - Theme System
 * Professional Blue/White Classic Theme
 */

import chalk from 'chalk';

export interface Theme {
  name: string;
  colors: {
    primary: typeof chalk;
    secondary: typeof chalk;
    success: typeof chalk;
    warning: typeof chalk;
    error: typeof chalk;
    info: typeof chalk;
    muted: typeof chalk;
    highlight: typeof chalk;
    border: typeof chalk;
    dim: typeof chalk;
  };
  box: {
    topLeft: string;
    topRight: string;
    bottomLeft: string;
    bottomRight: string;
    horizontal: string;
    vertical: string;
    verticalRight: string;
    verticalLeft: string;
    horizontalDown: string;
    horizontalUp: string;
  };
}

// Professional Blue/White Classic Theme
export const classicTheme: Theme = {
  name: 'classic',
  colors: {
    primary: chalk.blue.bold,
    secondary: chalk.cyan,
    success: chalk.green,
    warning: chalk.yellow,
    error: chalk.red,
    info: chalk.blue,
    muted: chalk.gray,
    highlight: chalk.white.bold,
    border: chalk.blue,
    dim: chalk.dim,
  },
  box: {
    topLeft: '╔',
    topRight: '╗',
    bottomLeft: '╚',
    bottomRight: '╝',
    horizontal: '═',
    vertical: '║',
    verticalRight: '╠',
    verticalLeft: '╣',
    horizontalDown: '╦',
    horizontalUp: '╩',
  },
};

// Current active theme
let activeTheme: Theme = classicTheme;

export function getTheme(): Theme {
  return activeTheme;
}

export function setTheme(theme: Theme): void {
  activeTheme = theme;
}

/**
 * Draw a box with title
 */
export function drawBox(content: string[], title?: string, width: number = 60): string {
  const theme = getTheme();
  const { box, colors } = theme;
  
  const lines: string[] = [];
  
  // Top border with optional title
  if (title) {
    const titlePadded = ` ${title} `;
    const remainingWidth = width - titlePadded.length - 2;
    const leftPad = Math.floor(remainingWidth / 2);
    const rightPad = remainingWidth - leftPad;
    
    lines.push(
      colors.border(box.topLeft) +
      colors.border(box.horizontal.repeat(leftPad)) +
      colors.primary(titlePadded) +
      colors.border(box.horizontal.repeat(rightPad)) +
      colors.border(box.topRight)
    );
  } else {
    lines.push(
      colors.border(box.topLeft + box.horizontal.repeat(width - 2) + box.topRight)
    );
  }
  
  // Content lines
  content.forEach(line => {
    const padding = width - 2 - stripAnsi(line).length;
    lines.push(
      colors.border(box.vertical) +
      ' ' + line + ' '.repeat(Math.max(0, padding)) +
      colors.border(box.vertical)
    );
  });
  
  // Bottom border
  lines.push(
    colors.border(box.bottomLeft + box.horizontal.repeat(width - 2) + box.bottomRight)
  );
  
  return lines.join('\n');
}

/**
 * Draw section separator
 */
export function drawSeparator(width: number = 60, title?: string): string {
  const theme = getTheme();
  const { box, colors } = theme;
  
  if (title) {
    const titlePadded = ` ${title} `;
    const remainingWidth = width - titlePadded.length - 2;
    const leftPad = Math.floor(remainingWidth / 2);
    const rightPad = remainingWidth - leftPad;
    
    return (
      colors.border(box.verticalRight) +
      colors.border(box.horizontal.repeat(leftPad)) +
      colors.secondary(titlePadded) +
      colors.border(box.horizontal.repeat(rightPad)) +
      colors.border(box.verticalLeft)
    );
  }
  
  return colors.border(box.verticalRight + box.horizontal.repeat(width - 2) + box.verticalLeft);
}

/**
 * Draw progress bar
 */
export function drawProgressBar(percentage: number, width: number = 40): string {
  const theme = getTheme();
  const { colors } = theme;
  
  const filled = Math.floor((percentage / 100) * width);
  const empty = width - filled;
  
  const bar = '█'.repeat(filled) + '░'.repeat(empty);
  const color = percentage >= 75 ? colors.success : percentage >= 50 ? colors.warning : colors.error;
  
  return `[${color(bar)}] ${percentage}%`;
}

/**
 * Format duration
 */
export function formatDuration(seconds: number): string {
  const theme = getTheme();
  const { colors } = theme;
  
  if (seconds < 1) return colors.muted('<1s');
  if (seconds < 60) return colors.info(`${Math.round(seconds)}s`);
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.round(seconds % 60);
  
  if (remainingSeconds === 0) {
    return colors.info(`${minutes}m`);
  }
  
  return colors.info(`${minutes}m ${remainingSeconds}s`);
}

/**
 * Strip ANSI codes for length calculation
 */
function stripAnsi(str: string): string {
  // eslint-disable-next-line no-control-regex
  return str.replace(/\u001b\[.*?m/g, '');
}

/**
 * Format trend arrow
 */
export function formatTrend(current: number, previous: number): string {
  const theme = getTheme();
  const { colors } = theme;
  
  if (previous === 0) return colors.muted('→');
  
  const diff = current - previous;
  const percentage = ((diff / previous) * 100).toFixed(0);
  
  if (diff > 0) {
    return colors.success(`⬆️ +${percentage}%`);
  } else if (diff < 0) {
    return colors.error(`⬇️ ${percentage}%`);
  }
  
  return colors.muted('→ 0%');
}

/**
 * Format health score with color
 */
export function formatHealthScore(score: number): string {
  const theme = getTheme();
  const { colors } = theme;
  
  let emoji = '🎯';
  let color = colors.success;
  
  if (score >= 90) {
    emoji = '🎯';
    color = colors.success;
  } else if (score >= 75) {
    emoji = '⚠️';
    color = colors.warning;
  } else {
    emoji = '❌';
    color = colors.error;
  }
  
  return `${emoji} ${color(score.toString())}/100`;
}

/**
 * Format issue count with severity
 */
export function formatIssueCount(count: number, severity: 'critical' | 'high' | 'medium' | 'low'): string {
  const theme = getTheme();
  const { colors } = theme;
  
  const icons = {
    critical: '🔴',
    high: '🟡',
    medium: '🟢',
    low: '🔵',
  };
  
  const colorMap = {
    critical: colors.error,
    high: colors.warning,
    medium: colors.info,
    low: colors.muted,
  };
  
  return `${icons[severity]} ${colorMap[severity](count.toString().padStart(2, ' '))}`;
}

/**
 * Center text within width
 */
export function centerText(text: string, width: number): string {
  const textLength = stripAnsi(text).length;
  const padding = Math.max(0, width - textLength);
  const leftPad = Math.floor(padding / 2);
  const rightPad = padding - leftPad;
  
  return ' '.repeat(leftPad) + text + ' '.repeat(rightPad);
}
