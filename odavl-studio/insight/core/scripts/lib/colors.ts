/**
 * Color utilities for console output
 */

export function c(color: string, text: string): string {
  const codes: Record<string, string> = {
    reset: '\x1b[0m',
    bold: '\x1b[1m',
    red: '\x1b[91m',
    green: '\x1b[92m',
    yellow: '\x1b[93m',
    blue: '\x1b[94m',
    magenta: '\x1b[95m',
    cyan: '\x1b[96m',
    white: '\x1b[97m',
    gray: '\x1b[90m',
  };
  
  const code = codes[color] || codes.reset;
  return `${code}${text}${codes.reset}`;
}
