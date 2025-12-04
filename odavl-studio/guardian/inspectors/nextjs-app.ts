/**
 * Next.js Application Inspector
 * Validates Next.js applications for launch readiness
 */

import { BaseInspector, InspectionReport, InspectionIssue } from './base-inspector.js';
import * as fs from 'fs/promises';
import * as path from 'path';

export class NextJSAppInspector extends BaseInspector {
  async inspect(projectPath: string): Promise<InspectionReport> {
    const issues: InspectionIssue[] = [];
    let projectName = 'Unknown Next.js App';
    let hasAppDir = false;
    let hasPagesDir = false;
    let pkg: any = null;
    
    // 1. Check package.json exists and has Next.js
    const pkgPath = path.join(projectPath, 'package.json');
    
    try {
      pkg = await this.readJsonFile(pkgPath);
      projectName = pkg.name || 'Unknown Next.js App';
    } catch (error) {
      issues.push({
        id: 'missing-package-json',
        severity: 'critical',
        category: 'config',
        message: 'package.json not found or invalid',
        file: 'package.json',
        autoFixable: false,
        impact: 'Cannot identify project dependencies',
      });
      
      return {
        productId: 'nextjs-app',
        productName: 'Unknown Next.js App',
        productType: 'nextjs-app',
        timestamp: new Date().toISOString(),
        readinessScore: 0,
        status: 'blocked',
        issues,
        metadata: {},
      };
    }
    
    // 2. Check next.config.js/mjs exists
    const nextConfigJs = path.join(projectPath, 'next.config.js');
    const nextConfigMjs = path.join(projectPath, 'next.config.mjs');
    const hasNextConfig = await this.fileExists(nextConfigJs) || await this.fileExists(nextConfigMjs);
    
    if (!hasNextConfig) {
      issues.push({
        id: 'missing-next-config',
        severity: 'medium',
        category: 'config',
        message: 'next.config.js not found',
        file: 'next.config.js',
        autoFixable: true,
        fix: 'Create next.config.js with basic configuration',
        impact: 'Using default Next.js configuration, may miss optimizations',
      });
    } else {
      // Check for problematic "output: standalone" config
      const configPath = await this.fileExists(nextConfigJs) ? nextConfigJs : nextConfigMjs;
      const configContent = await fs.readFile(configPath, 'utf8');
      
      if (configContent.includes('output:') && configContent.includes('standalone')) {
        issues.push({
          id: 'standalone-output-mode',
          severity: 'critical',
          category: 'config',
          message: '"output: standalone" causes SSG compatibility issues',
          file: path.basename(configPath),
          autoFixable: true,
          fix: 'Remove "output: standalone" from next.config',
          impact: 'Static export will fail, deployment issues',
        });
      }
    }
    
    // 3. Check for required directories
    const appDir = path.join(projectPath, 'app');
    const pagesDir = path.join(projectPath, 'pages');
    hasAppDir = await this.fileExists(appDir);
    hasPagesDir = await this.fileExists(pagesDir);
    
    if (!hasAppDir && !hasPagesDir) {
      issues.push({
        id: 'missing-routing-dir',
        severity: 'critical',
        category: 'build',
        message: 'Neither app/ nor pages/ directory found',
        file: 'app/ or pages/',
        autoFixable: false,
        impact: 'Next.js cannot find routes, app will not work',
      });
    }
    
    // Warning for mixed routing (app + pages)
    if (hasAppDir && hasPagesDir) {
      issues.push({
        id: 'mixed-routing',
        severity: 'high',
        category: 'config',
        message: 'Both app/ and pages/ directories exist (mixed routing)',
        file: 'app/, pages/',
        autoFixable: false,
        impact: 'Can cause routing conflicts and unexpected behavior',
      });
    }
    
    // 4. Check for public directory
    const publicDir = path.join(projectPath, 'public');
    if (!await this.fileExists(publicDir)) {
      issues.push({
        id: 'missing-public-dir',
        severity: 'low',
        category: 'config',
        message: 'public/ directory not found',
        file: 'public/',
        autoFixable: true,
        fix: 'Create public/ directory for static assets',
        impact: 'Cannot serve static files (favicon, robots.txt, etc.)',
      });
    }
    
    // 5. Check for environment variables setup
    const envExample = path.join(projectPath, '.env.example');
    const envLocal = path.join(projectPath, '.env.local');
    
    if (!await this.fileExists(envExample)) {
      issues.push({
        id: 'missing-env-example',
        severity: 'medium',
        category: 'config',
        message: '.env.example file not found',
        file: '.env.example',
        autoFixable: true,
        fix: 'Create .env.example with required environment variables',
        impact: 'Developers won\'t know which environment variables are needed',
      });
    }
    
    // 6. Check required npm scripts
    const requiredScripts = ['dev', 'build', 'start'];
    const missingScripts = pkg ? requiredScripts.filter(s => !pkg.scripts || !pkg.scripts[s]) : requiredScripts;
    
    if (missingScripts.length > 0) {
      issues.push({
        id: 'missing-npm-scripts',
        severity: 'high',
        category: 'config',
        message: `Missing required scripts: ${missingScripts.join(', ')}`,
        file: 'package.json',
        autoFixable: true,
        fix: `Add missing scripts: ${missingScripts.join(', ')}`,
        impact: 'Cannot run/build the application properly',
      });
    }
    
    // 7. Check build output (.next directory for verification)
    const nextDir = path.join(projectPath, '.next');
    if (!await this.fileExists(nextDir)) {
      issues.push({
        id: 'no-build-output',
        severity: 'low',
        category: 'build',
        message: '.next/ directory not found (app not built yet)',
        file: '.next/',
        autoFixable: true,
        fix: 'Run "npm run build" or "pnpm build"',
        impact: 'Cannot verify build works, may have build-time errors',
      });
    }
    
    // 8. Check for critical metadata files
    const robotsTxt = path.join(projectPath, 'public', 'robots.txt');
    if (await this.fileExists(publicDir) && !await this.fileExists(robotsTxt)) {
      issues.push({
        id: 'missing-robots-txt',
        severity: 'low',
        category: 'metadata',
        message: 'robots.txt not found in public/',
        file: 'public/robots.txt',
        autoFixable: true,
        fix: 'Create robots.txt with SEO directives',
        impact: 'Search engines may not crawl site properly',
      });
    }
    
    // 9. Check for README
    const readme = path.join(projectPath, 'README.md');
    if (!await this.fileExists(readme)) {
      issues.push({
        id: 'missing-readme',
        severity: 'low',
        category: 'metadata',
        message: 'README.md not found',
        file: 'README.md',
        autoFixable: true,
        fix: 'Create README.md with project documentation',
        impact: 'Developers won\'t understand project setup',
      });
    } else {
      const readmeContent = await fs.readFile(readme, 'utf8');
      if (readmeContent.length < 200) {
        issues.push({
          id: 'minimal-readme',
          severity: 'low',
          category: 'metadata',
          message: 'README.md is too short (< 200 chars)',
          file: 'README.md',
          autoFixable: false,
          impact: 'Insufficient documentation for developers',
        });
      }
    }
    
    // 10. Check TypeScript configuration if using TypeScript
    if (pkg && (pkg.devDependencies?.typescript || pkg.dependencies?.typescript)) {
      const tsConfig = path.join(projectPath, 'tsconfig.json');
      if (!await this.fileExists(tsConfig)) {
        issues.push({
          id: 'missing-tsconfig',
          severity: 'high',
          category: 'config',
          message: 'TypeScript installed but tsconfig.json not found',
          file: 'tsconfig.json',
          autoFixable: true,
          fix: 'Run "npx tsc --init" or create tsconfig.json',
          impact: 'TypeScript won\'t work, type checking disabled',
        });
      }
    }
    
    const readinessScore = this.calculateReadiness(issues);
    const status = this.determineStatus(readinessScore);
    
    return {
      productId: 'nextjs-app',
      productName: projectName,
      productType: 'nextjs-app',
      timestamp: new Date().toISOString(),
      readinessScore,
      status,
      issues,
      metadata: {
        hasAppDir,
        hasPagesDir,
        nextVersion: pkg ? (pkg.dependencies?.next || pkg.devDependencies?.next || 'unknown') : 'unknown',
      },
    };
  }
}
