/**
 * Recipe: Split Large File
 * Detector: complexity
 * Suggests splitting files that are too large
 */

export interface Recipe {
  id: string;
  name: string;
  detector: string;
  priority: number;
  match(issue: any): boolean;
  apply(fileContent: string, issue: any): string;
}

export const splitLargeFileRecipe: Recipe = {
  id: 'split-large-file',
  name: 'Split Large File',
  detector: 'complexity',
  priority: 5,
  
  match(issue: any): boolean {
    if (!issue) return false;
    const msg = issue.message?.toLowerCase() || '';
    return (
      msg.includes('file too large') ||
      msg.includes('too many lines') ||
      msg.includes('split file')
    );
  },
  
  apply(fileContent: string, issue: any): string {
    // MVP: Add comment at top of file
    const lines = fileContent.split('\n');
    
    // Add suggestion at top
    const comment = [
      '/**',
      ' * AUTOPILOT SUGGESTION: This file is too large',
      ` * Lines: ${lines.length}`,
      ' * Consider splitting into multiple files:',
      ' * - Separate utilities',
      ' * - Extract components',
      ' * - Move types to separate file',
      ' */'
    ].join('\n');
    
    return `${comment}\n\n${fileContent}`;
  }
};
