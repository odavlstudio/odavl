/**
 * Next.js Application Auto-Fixer
 * Automatically fixes common Next.js application launch issues
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
  details?: string; // For detailed human-readable messages - ALWAYS REQUIRED in NextJS
  filesModified?: string[]; // ALWAYS REQUIRED in NextJS
  error?: string;
}

export class NextJSFixer {
  private backupSystem: BackupSystem;

  constructor(workspaceRoot?: string) {
    this.backupSystem = new BackupSystem(workspaceRoot || process.cwd());
  }

  /**
   * Apply fixes for detected issues
   */
  async applyFixes(
    projectPath: string,
    issues: InspectionIssue[]
  ): Promise<FixResult[]> {
    const results: FixResult[] = [];

    // Identify files that will be modified
    const filesToBackup: string[] = [];
    const configFiles = [
      path.join(projectPath, 'next.config.js'),
      path.join(projectPath, 'next.config.mjs'),
      path.join(projectPath, 'next.config.ts'),
      path.join(projectPath, 'package.json'),
    ];
    
    for (const file of configFiles) {
      try {
        await fs.access(file);
        filesToBackup.push(file);
      } catch {
        // File doesn't exist, skip
      }
    }

    // Create backup before any modifications
    if (filesToBackup.length > 0) {
      try {
        await this.backupSystem.createBackup(filesToBackup);
      } catch (error) {
        console.warn('Failed to create backup:', error);
      }
    }
    const autoFixableIssues = issues.filter(i => i.autoFixable);

    for (const issue of autoFixableIssues) {
      try {
        const result = await this.fixIssue(projectPath, issue);
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
    projectPath: string,
    issue: InspectionIssue
  ): Promise<FixResult> {
    switch (issue.id) {
      case 'standalone-output-mode':
        return this.fixStandaloneOutputMode(projectPath);
      
      case 'missing-next-config':
        return this.createNextConfig(projectPath);
      
      case 'missing-public-dir':
        return this.createPublicDir(projectPath);
      
      case 'missing-env-example':
        return this.createEnvExample(projectPath);
      
      case 'missing-npm-scripts':
        return this.fixMissingScripts(projectPath);
      
      case 'no-build-output':
        return this.suggestBuild(projectPath);
      
      case 'missing-robots-txt':
        return this.createRobotsTxt(projectPath);
      
      case 'missing-readme':
        return this.createReadme(projectPath);
      
      case 'missing-tsconfig':
        return this.createTsConfig(projectPath);
      
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
   * Fix "output: standalone" in next.config
   */
  private async fixStandaloneOutputMode(projectPath: string): Promise<FixResult> {
    const nextConfigJs = path.join(projectPath, 'next.config.js');
    const nextConfigMjs = path.join(projectPath, 'next.config.mjs');
    
    let configPath = '';
    try {
      await fs.access(nextConfigJs);
      configPath = nextConfigJs;
    } catch {
      try {
        await fs.access(nextConfigMjs);
        configPath = nextConfigMjs;
      } catch {
        return {
          fixType: 'standalone-output-mode',
          success: false,
          details: 'next.config.js/mjs not found',
          filesModified: [],
        };
      }
    }
    
    let content = await fs.readFile(configPath, 'utf8');
    const originalContent = content;
    
    // Remove "output: 'standalone'" or "output: \"standalone\""
    content = content.replace(/output:\s*['"]standalone['"]\s*,?\s*/g, '');
    
    // Clean up empty lines and trailing commas
    content = content.replace(/,(\s*[}\]])/g, '$1');
    content = content.replace(/\n\s*\n\s*\n/g, '\n\n');
    
    if (content === originalContent) {
      return {
        fixType: 'standalone-output-mode',
        success: false,
        details: 'Could not find "output: standalone" in config file',
        filesModified: [],
      };
    }
    
    await fs.writeFile(configPath, content, 'utf8');
    
    return {
      fixType: 'standalone-output-mode',
      success: true,
      details: `Removed "output: standalone" from ${path.basename(configPath)}`,
      filesModified: [path.basename(configPath)],
    };
  }

  /**
   * Create basic next.config.js
   */
  private async createNextConfig(projectPath: string): Promise<FixResult> {
    const configPath = path.join(projectPath, 'next.config.js');
    
    const content = `/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
};

module.exports = nextConfig;
`;
    
    await fs.writeFile(configPath, content, 'utf8');
    
    return {
      fixType: 'missing-next-config',
      success: true,
      details: 'Created next.config.js with default configuration',
      filesModified: ['next.config.js'],
    };
  }

  /**
   * Create public directory
   */
  private async createPublicDir(projectPath: string): Promise<FixResult> {
    const publicDir = path.join(projectPath, 'public');
    
    await fs.mkdir(publicDir, { recursive: true });
    
    // Create a placeholder file
    const placeholder = path.join(publicDir, '.gitkeep');
    await fs.writeFile(placeholder, '', 'utf8');
    
    return {
      fixType: 'missing-public-dir',
      success: true,
      details: 'Created public/ directory for static assets',
      filesModified: ['public/'],
    };
  }

  /**
   * Create .env.example template
   */
  private async createEnvExample(projectPath: string): Promise<FixResult> {
    const envExamplePath = path.join(projectPath, '.env.example');
    
    const content = `# Environment Variables Template
# Copy this file to .env.local and fill in your values

# Database
# DATABASE_URL=

# Authentication
# NEXTAUTH_SECRET=
# NEXTAUTH_URL=http://localhost:3000

# API Keys
# API_KEY=

# Feature Flags
# NEXT_PUBLIC_FEATURE_FLAG=
`;
    
    await fs.writeFile(envExamplePath, content, 'utf8');
    
    return {
      fixType: 'missing-env-example',
      success: true,
      details: 'Created .env.example template',
      filesModified: ['.env.example'],
    };
  }

  /**
   * Fix missing npm scripts
   */
  private async fixMissingScripts(projectPath: string): Promise<FixResult> {
    const pkgPath = path.join(projectPath, 'package.json');
    const pkg = JSON.parse(await fs.readFile(pkgPath, 'utf8'));
    
    if (!pkg.scripts) {
      pkg.scripts = {};
    }
    
    const requiredScripts: Record<string, string> = {
      dev: 'next dev',
      build: 'next build',
      start: 'next start',
    };
    
    const added: string[] = [];
    for (const [name, command] of Object.entries(requiredScripts)) {
      if (!pkg.scripts[name]) {
        pkg.scripts[name] = command;
        added.push(name);
      }
    }
    
    if (added.length === 0) {
      return {
        fixType: 'missing-npm-scripts',
        success: true,
        details: 'All required scripts already exist',
        filesModified: [],
      };
    }
    
    await fs.writeFile(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf8');
    
    return {
      fixType: 'missing-npm-scripts',
      success: true,
      details: `Added missing scripts: ${added.join(', ')}`,
      filesModified: ['package.json'],
    };
  }

  /**
   * Suggest running build (doesn't actually build)
   */
  private async suggestBuild(projectPath: string): Promise<FixResult> {
    return {
      fixType: 'no-build-output',
      success: true,
      details: 'Run "npm run build" or "pnpm build" to generate build output',
      filesModified: [],
    };
  }

  /**
   * Create robots.txt
   */
  private async createRobotsTxt(projectPath: string): Promise<FixResult> {
    const robotsPath = path.join(projectPath, 'public', 'robots.txt');
    
    // Ensure public directory exists
    const publicDir = path.join(projectPath, 'public');
    await fs.mkdir(publicDir, { recursive: true });
    
    const content = `# Allow all crawlers
User-agent: *
Allow: /

# Sitemap (update with your domain)
# Sitemap: https://yourdomain.com/sitemap.xml
`;
    
    await fs.writeFile(robotsPath, content, 'utf8');
    
    return {
      fixType: 'missing-robots-txt',
      success: true,
      details: 'Created robots.txt with default SEO directives',
      filesModified: ['public/robots.txt'],
    };
  }

  /**
   * Create basic README.md
   */
  private async createReadme(projectPath: string): Promise<FixResult> {
    const readmePath = path.join(projectPath, 'README.md');
    const pkgPath = path.join(projectPath, 'package.json');
    
    let projectName = 'Next.js App';
    try {
      const pkg = JSON.parse(await fs.readFile(pkgPath, 'utf8'));
      projectName = pkg.name || projectName;
    } catch {
      // Use default name
    }
    
    const content = `# ${projectName}

A Next.js application.

## Getting Started

First, install dependencies:

\`\`\`bash
npm install
# or
pnpm install
\`\`\`

Then, run the development server:

\`\`\`bash
npm run dev
# or
pnpm dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Build

To build the application for production:

\`\`\`bash
npm run build
npm start
# or
pnpm build
pnpm start
\`\`\`

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Learn Next.js](https://nextjs.org/learn)
`;
    
    await fs.writeFile(readmePath, content, 'utf8');
    
    return {
      fixType: 'missing-readme',
      success: true,
      details: 'Created README.md with basic project documentation',
      filesModified: ['README.md'],
    };
  }

  /**
   * Create basic tsconfig.json
   */
  private async createTsConfig(projectPath: string): Promise<FixResult> {
    const tsconfigPath = path.join(projectPath, 'tsconfig.json');
    
    const content = {
      compilerOptions: {
        target: 'ES2017',
        lib: ['dom', 'dom.iterable', 'esnext'],
        allowJs: true,
        skipLibCheck: true,
        strict: true,
        noEmit: true,
        esModuleInterop: true,
        module: 'esnext',
        moduleResolution: 'bundler',
        resolveJsonModule: true,
        isolatedModules: true,
        jsx: 'preserve',
        incremental: true,
        plugins: [
          {
            name: 'next',
          },
        ],
        paths: {
          '@/*': ['./*'],
        },
      },
      include: ['next-env.d.ts', '**/*.ts', '**/*.tsx', '.next/types/**/*.ts'],
      exclude: ['node_modules'],
    };
    
    await fs.writeFile(tsconfigPath, JSON.stringify(content, null, 2) + '\n', 'utf8');
    
    return {
      fixType: 'missing-tsconfig',
      success: true,
      details: 'Created tsconfig.json for TypeScript support',
      filesModified: ['tsconfig.json'],
    };
  }
}
