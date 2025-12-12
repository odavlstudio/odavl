/**
 * Recipe: Fix Circular Imports
 * Detector: imports
 * Detects and suggests fixes for circular import dependencies
 */

export interface Recipe {
  id: string;
  name: string;
  detector: string;
  priority: number;
  match(issue: any): boolean;
  apply(fileContent: string, issue: any): string;
}

export const fixCircularImportsRecipe: Recipe = {
  id: 'fix-circular-imports',
  name: 'Fix Circular Import Dependencies',
  detector: 'imports',
  priority: 9,
  
  match(issue: any): boolean {
    if (!issue) return false;
    const msg = issue.message?.toLowerCase() || '';
    return (
      msg.includes('circular') ||
      msg.includes('cycle') ||
      msg.includes('circular dependency')
    );
  },
  
  apply(fileContent: string, issue: any): string {
    // MVP: Add warning comment at top of file
    const warning = [
      '/**',
      ' * AUTOPILOT WARNING: Circular Import Detected',
      ` * ${issue.message}`,
      ' * ',
      ' * Suggested fixes:',
      ' * 1. Move shared types to separate file',
      ' * 2. Use dynamic imports (import())',
      ' * 3. Restructure module dependencies',
      ' */',
    ].join('\n');
    
    return `${warning}\n\n${fileContent}`;
  }
};
