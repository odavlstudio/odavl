/**
 * Recipe: Optimize Async Operations
 * Detector: performance
 * Optimizes async/await patterns for better performance
 */

export interface Recipe {
  id: string;
  name: string;
  detector: string;
  priority: number;
  match(issue: any): boolean;
  apply(fileContent: string, issue: any): string;
}

export const optimizeAsyncRecipe: Recipe = {
  id: 'optimize-async',
  name: 'Optimize Async Operations',
  detector: 'performance',
  priority: 8,
  
  match(issue: any): boolean {
    if (!issue) return false;
    const msg = issue.message?.toLowerCase() || '';
    return (
      msg.includes('async') ||
      msg.includes('await') ||
      msg.includes('promise') ||
      msg.includes('sequential')
    );
  },
  
  apply(fileContent: string, issue: any): string {
    let updated = fileContent;
    
    // Pattern: Sequential awaits → Promise.all
    // await a(); await b(); await c();
    // → await Promise.all([a(), b(), c()])
    
    const lines = updated.split('\n');
    let consecutiveAwaits: number[] = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (line.startsWith('await ') && !line.includes('Promise.all')) {
        consecutiveAwaits.push(i);
      } else if (consecutiveAwaits.length >= 2) {
        // Found sequence of awaits - add suggestion
        const firstIndex = consecutiveAwaits[0];
        const indent = lines[firstIndex].match(/^\s*/)?.[0] || '';
        
        lines.splice(
          firstIndex,
          0,
          `${indent}// AUTOPILOT: Consider Promise.all for parallel execution (performance)`
        );
        
        consecutiveAwaits = [];
        break; // Only fix first occurrence
      } else {
        consecutiveAwaits = [];
      }
    }
    
    return lines.join('\n');
  }
};
