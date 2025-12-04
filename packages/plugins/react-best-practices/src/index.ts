/**
 * ODAVL Insight - React Best Practices Plugin
 * Official plugin for detecting React anti-patterns and best practices
 */

import {
  DetectorPlugin,
  Issue,
  PluginHelpers,
  type PluginMetadata,
} from '@odavl-studio/sdk/plugin';

export class ReactBestPracticesPlugin extends DetectorPlugin {
  constructor() {
    const metadata: Omit<PluginMetadata, 'type'> = {
      id: 'odavl-react-best-practices',
      name: 'React Best Practices',
      version: '1.0.0',
      description: 'Detect React anti-patterns and enforce best practices',
      author: {
        name: 'ODAVL Team',
        email: 'team@odavl.studio',
        url: 'https://odavl.studio',
      },
      homepage: 'https://plugins.odavl.studio/react-best-practices',
      repository: 'https://github.com/odavl/plugins/tree/main/react-best-practices',
      license: 'MIT',
      keywords: ['react', 'best-practices', 'hooks', 'jsx'],
      engines: {
        odavl: '>=4.0.0',
        node: '>=18.0.0',
      },
    };
    
    super(metadata);
  }
  
  supports(language: string): boolean {
    return language === 'typescript' || language === 'javascript';
  }
  
  shouldSkip(filePath: string): boolean {
    // Only analyze React files
    if (!filePath.match(/\.(tsx|jsx)$/)) {
      return true;
    }
    
    // Skip test files
    return super.shouldSkip(filePath);
  }
  
  async detect(code: string, filePath: string): Promise<Issue[]> {
    const issues: Issue[] = [];
    
    // Rule 1: Detect useState with complex objects (should use useReducer)
    issues.push(...this.detectComplexState(code));
    
    // Rule 2: Detect missing dependency in useEffect
    issues.push(...this.detectMissingDependencies(code));
    
    // Rule 3: Detect inline function definitions in JSX
    issues.push(...this.detectInlineFunctions(code));
    
    // Rule 4: Detect missing React.memo for expensive components
    issues.push(...this.detectMissingMemo(code));
    
    // Rule 5: Detect direct DOM manipulation (should use refs)
    issues.push(...this.detectDirectDOMMutation(code));
    
    return issues;
  }
  
  private detectComplexState(code: string): Issue[] {
    const issues: Issue[] = [];
    const pattern = /useState\s*<\s*\{[^}]+\}\s*>\s*\(/g;
    const matches = PluginHelpers.matchPattern(code, pattern);
    
    for (const match of matches) {
      issues.push({
        type: 'best-practice',
        severity: 'medium',
        message: 'Complex state object detected. Consider using useReducer for better state management.',
        line: match.line,
        column: match.column,
        suggestion: 'Replace useState with useReducer for complex state',
        documentation: 'https://react.dev/reference/react/useReducer',
        fixable: false,
        tags: ['react', 'hooks', 'performance'],
      });
    }
    
    return issues;
  }
  
  private detectMissingDependencies(code: string): Issue[] {
    const issues: Issue[] = [];
    
    // Simple pattern: useEffect with empty deps but uses external variables
    const useEffectPattern = /useEffect\s*\(\s*\(\)\s*=>\s*\{([^}]+)\}\s*,\s*\[\s*\]\s*\)/g;
    const matches = code.matchAll(useEffectPattern);
    
    for (const match of matches) {
      const effectBody = match[1];
      
      // Check if effect uses any variables (simple heuristic)
      if (effectBody.match(/[a-zA-Z_$][a-zA-Z0-9_$]*\s*\(/)) {
        const lineNumber = code.substring(0, match.index!).split('\n').length;
        
        issues.push({
          type: 'quality',
          severity: 'high',
          message: 'useEffect may have missing dependencies. This can cause stale closures.',
          line: lineNumber,
          column: 0,
          suggestion: 'Add all used variables to dependency array or use ESLint react-hooks plugin',
          documentation: 'https://react.dev/reference/react/useEffect#my-effect-runs-after-every-re-render',
          fixable: false,
          tags: ['react', 'hooks', 'bugs'],
        });
      }
    }
    
    return issues;
  }
  
  private detectInlineFunctions(code: string): Issue[] {
    const issues: Issue[] = [];
    
    // Pattern: onClick={() => ...} or onChange={(e) => ...}
    const pattern = /on[A-Z][a-zA-Z]*=\{(\([^)]*\)|[a-zA-Z_$][a-zA-Z0-9_$]*)\s*=>/g;
    const matches = PluginHelpers.matchPattern(code, pattern);
    
    for (const match of matches) {
      issues.push({
        type: 'performance',
        severity: 'low',
        message: 'Inline function in JSX prop causes unnecessary re-renders.',
        line: match.line,
        column: match.column,
        suggestion: 'Extract function outside component or use useCallback',
        documentation: 'https://react.dev/reference/react/useCallback',
        fixable: true,
        tags: ['react', 'performance', 'optimization'],
      });
    }
    
    return issues;
  }
  
  private detectMissingMemo(code: string): Issue[] {
    const issues: Issue[] = [];
    
    // Pattern: Large component without React.memo
    const componentPattern = /(?:export\s+)?(?:const|function)\s+([A-Z][a-zA-Z0-9]*)\s*[=:]\s*(?:\([^)]*\)\s*=>|\()/g;
    const matches = code.matchAll(componentPattern);
    
    for (const match of matches) {
      const componentName = match[1];
      const componentStart = match.index!;
      const lineNumber = code.substring(0, componentStart).split('\n').length;
      
      // Check if component is wrapped with React.memo
      const beforeComponent = code.substring(Math.max(0, componentStart - 100), componentStart);
      if (!beforeComponent.includes('React.memo') && !beforeComponent.includes('memo(')) {
        // Count lines in component (simple heuristic)
        const remainingCode = code.substring(componentStart);
        const componentCode = remainingCode.substring(0, remainingCode.indexOf('\n\nexport') || remainingCode.length);
        const componentLines = componentCode.split('\n').length;
        
        // Only flag large components (>50 lines)
        if (componentLines > 50) {
          issues.push({
            type: 'performance',
            severity: 'medium',
            message: `Large component '${componentName}' (${componentLines} lines) without React.memo may cause performance issues.`,
            line: lineNumber,
            column: 0,
            suggestion: 'Wrap component with React.memo to prevent unnecessary re-renders',
            documentation: 'https://react.dev/reference/react/memo',
            fixable: true,
            tags: ['react', 'performance', 'optimization'],
          });
        }
      }
    }
    
    return issues;
  }
  
  private detectDirectDOMMutation(code: string): Issue[] {
    const issues: Issue[] = [];
    
    // Pattern: document.getElementById, document.querySelector, etc.
    const pattern = /document\.(getElementById|querySelector|querySelectorAll|getElementsByClassName)/g;
    const matches = PluginHelpers.matchPattern(code, pattern);
    
    for (const match of matches) {
      issues.push({
        type: 'best-practice',
        severity: 'high',
        message: 'Direct DOM manipulation detected. Use refs instead for better React integration.',
        line: match.line,
        column: match.column,
        suggestion: 'Replace with useRef hook: const myRef = useRef(null)',
        documentation: 'https://react.dev/reference/react/useRef',
        fixable: false,
        tags: ['react', 'dom', 'refs'],
      });
    }
    
    return issues;
  }
}

export default ReactBestPracticesPlugin;
