// ODAVL Plugin SDK v1.0
export interface PluginAPI {
  version: '1.0.0';
  
  // Plugin lifecycle hooks
  hooks: {
    onInit: (context: PluginContext) => void | Promise<void>;
    onDestroy: () => void | Promise<void>;
  };
  
  // Detection API
  detection: {
    registerDetector: (detector: Detector) => void;
    getAST: (filePath: string) => Promise<AST>;
    reportIssue: (issue: Issue) => void;
  };
  
  // Analysis API
  analysis: {
    getMetrics: (filePath: string) => Promise<Metrics>;
    getContext: (filePath: string) => Promise<CodeContext>;
  };
  
  // Configuration API
  config: {
    get: <T>(key: string) => T;
    set: (key: string, value: any) => void;
  };
  
  // UI API (for VS Code extensions)
  ui: {
    showMessage: (message: string, severity: 'info' | 'warning' | 'error') => void;
    createPanel: (options: PanelOptions) => Panel;
  };
}

// Example: Custom Detector Plugin
export class CustomDetectorPlugin {
  constructor(private api: PluginAPI) {}
  
  async onInit(context: PluginContext) {
    this.api.detection.registerDetector({
      id: 'my-custom-detector',
      name: 'My Custom Detector',
      version: '1.0.0',
      
      async analyze(filePath: string): Promise<Issue[]> {
        const ast = await this.api.detection.getAST(filePath);
        const issues: Issue[] = [];
        
        // Custom detection logic
        // Example: Find console.log in production
        if (this.isProduction() && this.hasConsoleLogs(ast)) {
          issues.push({
            severity: 'warning',
            message: 'Remove console.log in production',
            line: 10,
            column: 5,
            suggestion: 'Use proper logging library'
          });
        }
        
        return issues;
      }
    });
  }
  
  private isProduction(): boolean {
    return this.api.config.get<string>('env') === 'production';
  }
  
  private hasConsoleLogs(ast: AST): boolean {
    // AST traversal logic
    return false;
  }
}

interface PluginContext {
  workspaceRoot: string;
  language: string;
  framework?: string;
}

interface Detector {
  id: string;
  name: string;
  version: string;
  analyze: (filePath: string) => Promise<Issue[]>;
}

interface Issue {
  severity: 'error' | 'warning' | 'info';
  message: string;
  line: number;
  column: number;
  suggestion: string;
}
