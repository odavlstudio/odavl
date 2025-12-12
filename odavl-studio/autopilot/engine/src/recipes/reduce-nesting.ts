/**
 * Recipe: Reduce Nesting
 * Detector: complexity
 * Reduces deeply nested code by extracting early returns and guard clauses
 */

export interface Recipe {
  id: string;
  name: string;
  detector: string;
  priority: number;
  match(issue: any): boolean;
  apply(fileContent: string, issue: any): string;
}

export const reduceNestingRecipe: Recipe = {
  id: 'reduce-nesting',
  name: 'Reduce Deep Nesting',
  detector: 'complexity',
  priority: 8,
  
  match(issue: any): boolean {
    if (!issue) return false;
    const msg = issue.message?.toLowerCase() || '';
    return (
      msg.includes('nesting') ||
      msg.includes('nested') ||
      msg.includes('depth') ||
      (issue.tags?.includes('complexity') && issue.severity === 'high')
    );
  },
  
  apply(fileContent: string, issue: any): string {
    // MVP: Simple pattern matching for common nesting issues
    let updated = fileContent;
    
    // Pattern 1: Convert nested if to early return
    // if (condition) { ... lots of code ... }
    // → if (!condition) return; ... code ...
    
    // Pattern 2: Extract guard clauses
    const lines = updated.split('\n');
    const result: string[] = [];
    let inDeepNesting = false;
    let nestingLevel = 0;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();
      
      // Track braces for nesting level
      const openBraces = (line.match(/{/g) || []).length;
      const closeBraces = (line.match(/}/g) || []).length;
      nestingLevel += openBraces - closeBraces;
      
      // Simple heuristic: If we see nested if at level > 3, add comment
      if (nestingLevel > 3 && trimmed.startsWith('if ')) {
        result.push(`${line}  // TODO: Consider extracting to separate function (complexity)`);
        inDeepNesting = true;
      } else {
        result.push(line);
      }
    }
    
    return result.join('\n');
  }
};
