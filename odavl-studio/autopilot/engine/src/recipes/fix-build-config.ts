/**
 * Recipe: Fix Build Configuration
 * Detector: build
 * Fixes common build configuration issues
 */

export interface Recipe {
  id: string;
  name: string;
  detector: string;
  priority: number;
  match(issue: any): boolean;
  apply(fileContent: string, issue: any): string;
}

export const fixBuildConfigRecipe: Recipe = {
  id: 'fix-build-config',
  name: 'Fix Build Configuration',
  detector: 'build',
  priority: 6,
  
  match(issue: any): boolean {
    if (!issue) return false;
    const msg = issue.message?.toLowerCase() || '';
    return (
      msg.includes('build') ||
      msg.includes('tsconfig') ||
      msg.includes('configuration') ||
      msg.includes('compiler')
    );
  },
  
  apply(fileContent: string, issue: any): string {
    // MVP: Add comment about build issue
    const comment = [
      '/**',
      ' * AUTOPILOT: Build Configuration Issue',
      ` * ${issue.message}`,
      ' * ',
      ' * Check:',
      ' * - tsconfig.json settings',
      ' * - package.json scripts',
      ' * - Build tool configuration',
      ' */',
    ].join('\n');
    
    return `${comment}\n\n${fileContent}`;
  }
};
