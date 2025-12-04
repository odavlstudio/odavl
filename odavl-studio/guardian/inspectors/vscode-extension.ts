/**
 * VS Code Extension Inspector
 * Validates VS Code extensions for launch readiness
 */

import { BaseInspector, InspectionReport, InspectionIssue } from './base-inspector.js';
import { readFile } from 'node:fs/promises';
import * as path from 'node:path';

export class VSCodeExtensionInspector extends BaseInspector {
  async inspect(extensionPath: string): Promise<InspectionReport> {
    const issues: InspectionIssue[] = [];
    
    // 1. Check package.json exists and is valid
    const pkgPath = path.join(extensionPath, 'package.json');
    let pkg: any;
    
    try {
      pkg = await this.readJsonFile(pkgPath);
    } catch (error) {
      issues.push({
        id: 'missing-package-json',
        severity: 'critical',
        category: 'config',
        message: 'package.json not found or invalid',
        file: 'package.json',
        autoFixable: false,
        impact: 'Extension cannot be loaded by VS Code',
      });
      
      return {
        productId: 'vscode-extension',
        productName: 'Unknown Extension',
        productType: 'vscode-extension',
        timestamp: new Date().toISOString(),
        readinessScore: 0,
        status: 'blocked',
        issues,
        metadata: {},
      };
    }
    
    // 2. Validate required package.json fields
    if (!pkg.displayName || pkg.displayName.trim().length === 0) {
      issues.push({
        id: 'missing-display-name',
        severity: 'critical',
        category: 'metadata',
        message: 'Missing "displayName" in package.json',
        file: 'package.json',
        autoFixable: true,
        fix: 'Add displayName field with a user-friendly name',
        impact: 'Extension name will not appear correctly in VS Code',
      });
    }
    
    if (!pkg.publisher) {
      issues.push({
        id: 'missing-publisher',
        severity: 'critical',
        category: 'metadata',
        message: 'Missing "publisher" in package.json',
        file: 'package.json',
        autoFixable: false,
        impact: 'Cannot publish to VS Code Marketplace',
      });
    }
    
    if (!pkg.icon) {
      issues.push({
        id: 'missing-icon-field',
        severity: 'high',
        category: 'metadata',
        message: 'Missing "icon" field in package.json',
        file: 'package.json',
        autoFixable: true,
        fix: 'Add icon field pointing to a 128x128 PNG file',
        impact: 'Extension will appear without icon in marketplace',
      });
    } else {
      // Check if icon file exists
      const iconPath = path.join(extensionPath, pkg.icon);
      const iconExists = await this.fileExists(iconPath);
      
      if (!iconExists) {
        issues.push({
          id: 'icon-file-missing',
          severity: 'high',
          category: 'ui',
          message: `Icon file not found: ${pkg.icon}`,
          file: pkg.icon,
          autoFixable: true,
          fix: 'Create the icon file or update the icon path',
          impact: 'Extension icon will not display',
        });
      }
    }
    
    // 3. Check for webview registrations
    const views = pkg.contributes?.views || {};
    for (const [location, viewList] of Object.entries(views)) {
      for (const view of viewList as any[]) {
        if (view.type === 'webview') {
          // Check if webview is registered in extension.ts
          const extensionFile = path.join(extensionPath, 'src/extension.ts');
          const isRegistered = await this.checkWebviewRegistered(extensionFile, view.id);
          
          if (!isRegistered) {
            issues.push({
              id: `webview-not-registered-${view.id}`,
              severity: 'critical',
              category: 'activation',
              message: `Webview "${view.id}" not registered in extension.ts`,
              file: 'src/extension.ts',
              autoFixable: true,
              fix: `Add vscode.window.registerWebviewViewProvider('${view.id}', provider)`,
              impact: 'Dashboard/panel will not appear when extension loads',
            });
          }
        }
      }
    }
    
    // 4. Check activity bar icons
    const viewContainers = pkg.contributes?.viewsContainers?.activitybar || [];
    for (const container of viewContainers) {
      if (container.icon) {
        const iconPath = path.join(extensionPath, container.icon);
        const iconExists = await this.fileExists(iconPath);
        
        if (!iconExists) {
          issues.push({
            id: `activity-bar-icon-missing-${container.id}`,
            severity: 'critical',
            category: 'ui',
            message: `Activity bar icon not found: ${container.icon}`,
            file: container.icon,
            autoFixable: true,
            fix: 'Create the SVG icon file',
            impact: 'Activity bar icon will not appear in VS Code',
          });
        }
      }
    }
    
    // 5. Check build output
    const distPath = path.join(extensionPath, 'dist');
    const distExists = await this.fileExists(distPath);
    
    if (!distExists) {
      issues.push({
        id: 'build-output-missing',
        severity: 'critical',
        category: 'build',
        message: 'Build output directory (dist/) not found',
        file: 'dist/',
        autoFixable: false,
        fix: 'Run: pnpm build',
        impact: 'Extension cannot run - no compiled code',
      });
    }
    
    // 6. Check README
    const readmePath = path.join(extensionPath, 'README.md');
    const readmeExists = await this.fileExists(readmePath);
    
    if (!readmeExists) {
      issues.push({
        id: 'readme-missing',
        severity: 'medium',
        category: 'metadata',
        message: 'README.md not found',
        file: 'README.md',
        autoFixable: false,
        impact: 'Marketplace page will be empty',
      });
    } else {
      const readme = await readFile(readmePath, 'utf8');
      if (readme.length < 500) {
        issues.push({
          id: 'readme-too-short',
          severity: 'medium',
          category: 'metadata',
          message: `README.md too short (${readme.length} chars, should be >500)`,
          file: 'README.md',
          autoFixable: false,
          impact: 'Users won\'t understand what the extension does',
        });
      }
    }
    
    // 7. Check activation events
    if (views && Object.keys(views).length > 0) {
      const activationEvents = pkg.activationEvents || [];
      const hasOnView = activationEvents.some((event: string) => 
        event.startsWith('onView:')
      );
      
      if (!hasOnView) {
        issues.push({
          id: 'missing-activation-events',
          severity: 'high',
          category: 'activation',
          message: 'Missing activation events for views',
          file: 'package.json',
          autoFixable: true,
          fix: 'Add activation events for each view',
          impact: 'Extension may not activate when views are opened',
        });
      }
    }
    
    const readinessScore = this.calculateReadiness(issues);
    
    return {
      productId: 'vscode-extension',
      productName: pkg.displayName || pkg.name || 'Unknown Extension',
      productType: 'vscode-extension',
      timestamp: new Date().toISOString(),
      readinessScore,
      status: this.determineStatus(readinessScore),
      issues,
      metadata: {
        version: pkg.version,
        publisher: pkg.publisher,
        hasIcon: !!pkg.icon,
        viewCount: Object.values(views).flat().length,
      },
    };
  }
  
  /**
   * Check if a webview is registered in extension.ts
   */
  private async checkWebviewRegistered(
    extensionFile: string,
    viewId: string
  ): Promise<boolean> {
    try {
      const content = await readFile(extensionFile, 'utf8');
      return content.includes(`'${viewId}'`) || content.includes(`"${viewId}"`);
    } catch {
      return false;
    }
  }
}
