/**
 * VS Code Extension Auto-Fixer
 * Automatically fixes common VS Code extension launch issues
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import type { InspectionIssue } from '../inspectors/base-inspector.js';
import { BackupSystem } from '../core/src/backup-system.js';

export interface FixResult {
  fixType: string;  // For identifying the fix type
  issueId?: string; // For autopilot-bridge compatibility
  success: boolean;
  message?: string; // For autopilot-bridge compatibility
  details?: string; // For detailed human-readable messages
  filesModified?: string[];
  error?: string;
}

export class ExtensionFixer {
  private backupSystem: BackupSystem;

  constructor(workspaceRoot?: string) {
    this.backupSystem = new BackupSystem(workspaceRoot || process.cwd());
  }

  /**
   * Apply fixes for detected issues
   */
  async applyFixes(
    extensionPath: string,
    issues: InspectionIssue[]
  ): Promise<FixResult[]> {
    const results: FixResult[] = [];

    // Create backup before any modifications
    const filesToBackup = [path.join(extensionPath, 'package.json')];
    try {
      await this.backupSystem.createBackup(filesToBackup);
    } catch (error) {
      console.warn('Failed to create backup:', error);
    }
    const autoFixableIssues = issues.filter(i => i.autoFixable);

    for (const issue of autoFixableIssues) {
      try {
        const result = await this.fixIssue(extensionPath, issue);
        results.push(result);
      } catch (error) {
        results.push({
          fixType: issue.id,
          success: false,
          details: `Failed to fix: ${error instanceof Error ? error.message : 'Unknown error'}`,
          filesModified: [],
        });
      }
    }

    return results;
  }

  /**
   * Fix a single issue
   */
  private async fixIssue(
    extensionPath: string,
    issue: InspectionIssue
  ): Promise<FixResult> {
    switch (issue.id) {
      case 'missing-display-name':
        return this.fixMissingDisplayName(extensionPath);
      
      case 'missing-icon-field':
        return this.fixMissingIconField(extensionPath);
      
      case 'missing-activation-events':
        return this.fixMissingActivationEvents(extensionPath);
      
      case 'missing-webview-registration':
        return this.fixMissingWebviewRegistration(extensionPath);
      
      default:
        return {
          fixType: issue.id,
          success: false,
          details: `No auto-fix available for issue: ${issue.id}`,
          filesModified: [],
        };
    }
  }

  /**
   * Fix missing displayName in package.json
   */
  private async fixMissingDisplayName(extensionPath: string): Promise<FixResult> {
    const pkgPath = path.join(extensionPath, 'package.json');
    const pkg = JSON.parse(await fs.readFile(pkgPath, 'utf8'));
    
    // Generate display name from package name
    const displayName = pkg.name
      ? pkg.name
          .split('-')
          .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ')
      : 'Extension';
    
    pkg.displayName = displayName;
    
    await fs.writeFile(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf8');
    
    return {
      fixType: 'missing-display-name',
      success: true,
      details: `Added displayName: "${displayName}"`,
      filesModified: ['package.json'],
    };
  }

  /**
   * Fix missing icon field in package.json
   */
  private async fixMissingIconField(extensionPath: string): Promise<FixResult> {
    const pkgPath = path.join(extensionPath, 'package.json');
    const pkg = JSON.parse(await fs.readFile(pkgPath, 'utf8'));
    
    // Check if icon file exists
    const possibleIcons = ['icon.png', 'logo.png', 'images/icon.png', 'assets/icon.png'];
    let iconPath = '';
    
    for (const icon of possibleIcons) {
      const fullPath = path.join(extensionPath, icon);
      try {
        await fs.access(fullPath);
        iconPath = icon;
        break;
      } catch {
        // Icon doesn't exist, continue
      }
    }
    
    if (!iconPath) {
      return {
        fixType: 'missing-icon-field',
        success: false,
        details: 'No icon file found. Please create icon.png (128x128) in the root directory',
        filesModified: [],
      };
    }
    
    pkg.icon = iconPath;
    await fs.writeFile(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf8');
    
    return {
      fixType: 'missing-icon-field',
      success: true,
      details: `Added icon field: "${iconPath}"`,
      filesModified: ['package.json'],
    };
  }

  /**
   * Fix missing activation events for views
   */
  private async fixMissingActivationEvents(extensionPath: string): Promise<FixResult> {
    const pkgPath = path.join(extensionPath, 'package.json');
    const pkg = JSON.parse(await fs.readFile(pkgPath, 'utf8'));
    
    if (!pkg.contributes?.views) {
      return {
        fixType: 'missing-activation-events',
        success: false,
        details: 'No views found in package.json to generate activation events',
        filesModified: [],
      };
    }
    
    // Collect all view IDs
    const viewIds: string[] = [];
    for (const location in pkg.contributes.views) {
      const views = pkg.contributes.views[location];
      if (Array.isArray(views)) {
        views.forEach((view: any) => {
          if (view.id) {
            viewIds.push(view.id);
          }
        });
      }
    }
    
    // Add activation events for each view
    if (!pkg.activationEvents) {
      pkg.activationEvents = [];
    }
    
    let added = 0;
    viewIds.forEach(viewId => {
      const activationEvent = `onView:${viewId}`;
      if (!pkg.activationEvents.includes(activationEvent)) {
        pkg.activationEvents.push(activationEvent);
        added++;
      }
    });
    
    if (added === 0) {
      return {
        fixType: 'missing-activation-events',
        success: true,
        details: 'Activation events already exist',
        filesModified: [],
      };
    }
    
    await fs.writeFile(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf8');
    
    return {
      fixType: 'missing-activation-events',
      success: true,
      details: `Added ${added} activation events for views`,
      filesModified: ['package.json'],
    };
  }

  /**
   * Fix missing webview registration (creates template code)
   */
  private async fixMissingWebviewRegistration(extensionPath: string): Promise<FixResult> {
    const pkgPath = path.join(extensionPath, 'package.json');
    const pkg = JSON.parse(await fs.readFile(pkgPath, 'utf8'));
    
    if (!pkg.contributes?.views) {
      return {
        fixType: 'missing-webview-registration',
        success: false,
        details: 'No views defined in package.json',
        filesModified: [],
      };
    }
    
    // Find extension.ts/js file
    const srcDir = path.join(extensionPath, 'src');
    const extensionFiles = ['extension.ts', 'extension.js'];
    let extensionFile = '';
    
    for (const file of extensionFiles) {
      const fullPath = path.join(srcDir, file);
      try {
        await fs.access(fullPath);
        extensionFile = fullPath;
        break;
      } catch {
        // File doesn't exist
      }
    }
    
    if (!extensionFile) {
      return {
        fixType: 'missing-webview-registration',
        success: false,
        details: 'extension.ts/js not found in src/ directory',
        filesModified: [],
      };
    }
    
    // Read extension file
    const extensionContent = await fs.readFile(extensionFile, 'utf8');
    
    // Extract view IDs
    const viewIds: string[] = [];
    for (const location in pkg.contributes.views) {
      const views = pkg.contributes.views[location];
      if (Array.isArray(views)) {
        views.forEach((view: any) => {
          if (view.id && !extensionContent.includes(view.id)) {
            viewIds.push(view.id);
          }
        });
      }
    }
    
    if (viewIds.length === 0) {
      return {
        fixType: 'missing-webview-registration',
        success: true,
        details: 'All views are already registered',
        filesModified: [],
      };
    }
    
    // Generate webview registration template
    const isTypeScript = extensionFile.endsWith('.ts');
    const registrationCode = this.generateWebviewRegistration(viewIds, isTypeScript);
    
    // Create a separate file with the template code
    const templateFile = path.join(extensionPath, 'webview-registration-template.txt');
    await fs.writeFile(templateFile, registrationCode, 'utf8');
    
    return {
      fixType: 'missing-webview-registration',
      success: true,
      details: `Created webview registration template for ${viewIds.length} views. See: webview-registration-template.txt`,
      filesModified: ['webview-registration-template.txt'],
    };
  }

  /**
   * Generate webview registration code template
   */
  private generateWebviewRegistration(viewIds: string[], isTypeScript: boolean): string {
    const imports = isTypeScript
      ? `import * as vscode from 'vscode';`
      : `const vscode = require('vscode');`;
    
    const viewProviders = viewIds.map(viewId => {
      const className = viewId
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join('') + 'Provider';
      
      return `
class ${className} implements vscode.WebviewViewProvider {
  public resolveWebviewView(
    webviewView${isTypeScript ? ': vscode.WebviewView' : ''},
    context${isTypeScript ? ': vscode.WebviewViewResolveContext' : ''},
    token${isTypeScript ? ': vscode.CancellationToken' : ''}
  )${isTypeScript ? ': void | Thenable<void>' : ''} {
    webviewView.webview.options = {
      enableScripts: true,
    };
    
    webviewView.webview.html = this.getHtmlContent();
  }
  
  private getHtmlContent()${isTypeScript ? ': string' : ''} {
    return \`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>${viewId}</title>
        </head>
        <body>
          <h1>${viewId} View</h1>
          <p>Your content here...</p>
        </body>
      </html>
    \`;
  }
}`;
    }).join('\n');
    
    const registrations = viewIds.map(viewId => {
      const className = viewId
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join('') + 'Provider';
      
      return `  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider('${viewId}', new ${className}())
  );`;
    }).join('\n\n');
    
    return `${imports}

// Webview View Providers
${viewProviders}

// Registration (add this to your activate() function)
export function activate(context${isTypeScript ? ': vscode.ExtensionContext' : ''}) {
${registrations}
}
`;
  }
}
