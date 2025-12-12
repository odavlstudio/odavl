/**
 * Recipe: Avoid Expensive Operations
 * Detector: performance
 * Identifies and suggests alternatives to expensive operations
 */

export interface Recipe {
  id: string;
  name: string;
  detector: string;
  priority: number;
  match(issue: any): boolean;
  apply(fileContent: string, issue: any): string;
}

export const avoidExpensiveOperationsRecipe: Recipe = {
  id: 'avoid-expensive-operations',
  name: 'Avoid Expensive Operations',
  detector: 'performance',
  priority: 7,
  
  match(issue: any): boolean {
    if (!issue) return false;
    const msg = issue.message?.toLowerCase() || '';
    return (
      msg.includes('expensive') ||
      msg.includes('slow') ||
      msg.includes('regex') ||
      msg.includes('json.parse') ||
      msg.includes('deep clone')
    );
  },
  
  apply(fileContent: string, issue: any): string {
    let updated = fileContent;
    
    // Pattern 1: Expensive regex in loops
    if (updated.includes('new RegExp') && updated.includes('for')) {
      const lines = updated.split('\n');
      
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('new RegExp') || lines[i].includes('/.*/')) {
          const indent = lines[i].match(/^\s*/)?.[0] || '';
          lines.splice(
            i,
            0,
            `${indent}// AUTOPILOT: Move regex outside loop for better performance`
          );
          break;
        }
      }
      
      updated = lines.join('\n');
    }
    
    // Pattern 2: JSON.parse in loops
    if (updated.includes('JSON.parse') && (updated.includes('for') || updated.includes('forEach'))) {
      updated = updated.replace(
        /JSON\.parse\(/g,
        '// AUTOPILOT: Consider caching parsed JSON\nJSON.parse('
      );
    }
    
    return updated;
  }
};
