/**
 * Recipe: Optimize Loops
 * Detector: performance
 * Optimizes inefficient loop patterns
 */

export interface Recipe {
  id: string;
  name: string;
  detector: string;
  priority: number;
  match(issue: any): boolean;
  apply(fileContent: string, issue: any): string;
}

export const optimizeLoopsRecipe: Recipe = {
  id: 'optimize-loops',
  name: 'Optimize Loop Performance',
  detector: 'performance',
  priority: 9,
  
  match(issue: any): boolean {
    if (!issue) return false;
    const msg = issue.message?.toLowerCase() || '';
    return (
      msg.includes('loop') ||
      msg.includes('for') ||
      msg.includes('while') ||
      msg.includes('iteration') ||
      msg.includes('array operation')
    );
  },
  
  apply(fileContent: string, issue: any): string {
    let updated = fileContent;
    
    // Pattern 1: Replace forEach with for...of (faster)
    updated = updated.replace(
      /\.forEach\(\s*\(([^)]+)\)\s*=>\s*{/g,
      (match, param) => {
        return `// AUTOPILOT: Consider for...of for better performance\n// ${match}\nfor (const ${param} of array) {`;
      }
    );
    
    // Pattern 2: Hoist loop-invariant code
    if (issue.location?.startLine) {
      const lines = updated.split('\n');
      const lineIndex = issue.location.startLine - 1;
      
      if (lineIndex >= 0 && lineIndex < lines.length) {
        const line = lines[lineIndex];
        const indent = line.match(/^\s*/)?.[0] || '';
        
        lines.splice(
          lineIndex,
          0,
          `${indent}// TODO: Consider caching loop-invariant expressions (performance)`
        );
        
        updated = lines.join('\n');
      }
    }
    
    return updated;
  }
};
