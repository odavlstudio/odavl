/**
 * Recipe: Remove Dead Code
 * Detector: complexity
 * Removes unreachable code and unused variables
 */

export interface Recipe {
  id: string;
  name: string;
  detector: string;
  priority: number;
  match(issue: any): boolean;
  apply(fileContent: string, issue: any): string;
}

export const removeDeadCodeRecipe: Recipe = {
  id: 'remove-dead-code',
  name: 'Remove Dead Code',
  detector: 'complexity',
  priority: 6,
  
  match(issue: any): boolean {
    if (!issue) return false;
    const msg = issue.message?.toLowerCase() || '';
    return (
      msg.includes('unreachable') ||
      msg.includes('dead code') ||
      msg.includes('unused variable') ||
      msg.includes('never used')
    );
  },
  
  apply(fileContent: string, issue: any): string {
    // MVP: Comment out dead code instead of removing
    let updated = fileContent;
    
    if (issue.location?.startLine) {
      const lines = updated.split('\n');
      const lineIndex = issue.location.startLine - 1;
      
      if (lineIndex >= 0 && lineIndex < lines.length) {
        const line = lines[lineIndex];
        
        // If line is not already commented
        if (!line.trim().startsWith('//') && !line.trim().startsWith('/*')) {
          const indent = line.match(/^\s*/)?.[0] || '';
          lines[lineIndex] = `${indent}// AUTOPILOT: Dead code commented out - ${issue.message}\n${indent}// ${line.trim()}`;
        }
        
        updated = lines.join('\n');
      }
    }
    
    return updated;
  }
};
