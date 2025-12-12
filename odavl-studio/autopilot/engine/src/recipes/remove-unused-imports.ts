/**
 * Recipe: Remove Unused Imports
 * Detector: imports
 * Removes unused import statements
 */

export interface Recipe {
  id: string;
  name: string;
  detector: string;
  priority: number;
  match(issue: any): boolean;
  apply(fileContent: string, issue: any): string;
}

export const removeUnusedImportsRecipe: Recipe = {
  id: 'remove-unused-imports',
  name: 'Remove Unused Imports',
  detector: 'imports',
  priority: 10,
  
  match(issue: any): boolean {
    if (!issue) return false;
    const msg = issue.message?.toLowerCase() || '';
    return (
      msg.includes('unused import') ||
      msg.includes('never used') ||
      msg.includes('imported but not used')
    );
  },
  
  apply(fileContent: string, issue: any): string {
    let updated = fileContent;
    
    if (issue.location?.startLine) {
      const lines = updated.split('\n');
      const lineIndex = issue.location.startLine - 1;
      
      if (lineIndex >= 0 && lineIndex < lines.length) {
        const line = lines[lineIndex].trim();
        
        // Only remove if it's clearly an import line
        if (line.startsWith('import ') && line.includes('from')) {
          // Comment out instead of removing for safety
          lines[lineIndex] = `// AUTOPILOT: Removed unused import - ${issue.message}\n// ${lines[lineIndex]}`;
        }
        
        updated = lines.join('\n');
      }
    }
    
    return updated;
  }
};
