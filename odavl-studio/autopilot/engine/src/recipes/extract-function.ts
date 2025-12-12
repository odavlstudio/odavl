/**
 * Recipe: Extract Function
 * Detector: complexity
 * Suggests extracting large functions into smaller ones
 */

export interface Recipe {
  id: string;
  name: string;
  detector: string;
  priority: number;
  match(issue: any): boolean;
  apply(fileContent: string, issue: any): string;
}

export const extractFunctionRecipe: Recipe = {
  id: 'extract-function',
  name: 'Extract Large Function',
  detector: 'complexity',
  priority: 7,
  
  match(issue: any): boolean {
    if (!issue) return false;
    const msg = issue.message?.toLowerCase() || '';
    return (
      msg.includes('function') ||
      msg.includes('method') ||
      msg.includes('complexity') ||
      msg.includes('lines')
    );
  },
  
  apply(fileContent: string, issue: any): string {
    // MVP: Add comment suggesting extraction
    let updated = fileContent;
    
    if (issue.location?.startLine) {
      const lines = updated.split('\n');
      const lineIndex = issue.location.startLine - 1;
      
      if (lineIndex >= 0 && lineIndex < lines.length) {
        const line = lines[lineIndex];
        const indent = line.match(/^\s*/)?.[0] || '';
        
        // Add comment before function
        lines.splice(
          lineIndex,
          0,
          `${indent}// TODO: Consider extracting this function (${issue.message})`
        );
        
        updated = lines.join('\n');
      }
    }
    
    return updated;
  }
};
