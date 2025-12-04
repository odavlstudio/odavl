# ODAVL Plugin Developer Guide

**Version**: 2.0.0  
**Last Updated**: November 29, 2025

## Overview

ODAVL Studio supports custom plugins to extend detection capabilities, add new recipes, and integrate with third-party tools. This guide covers everything you need to build, test, and publish ODAVL plugins.

## Table of Contents

1. [Plugin Architecture](#plugin-architecture)
2. [Quick Start](#quick-start)
3. [Plugin Types](#plugin-types)
4. [API Reference](#api-reference)
5. [Testing Plugins](#testing-plugins)
6. [Publishing](#publishing)
7. [Best Practices](#best-practices)

---

## Plugin Architecture

### Plugin Structure

```
my-odavl-plugin/
├── package.json
├── src/
│   ├── index.ts          # Plugin entry point
│   ├── detector.ts       # Custom detector (optional)
│   ├── recipe.ts         # Custom recipe (optional)
│   └── config.ts         # Plugin configuration
├── tests/
│   └── plugin.test.ts
├── README.md
└── .odavl/
    └── plugin.json       # Plugin metadata
```

### Plugin Types

ODAVL supports three plugin types:

1. **Detector Plugin**: Add new error detection capabilities
2. **Recipe Plugin**: Add self-healing recipes for Autopilot
3. **Integration Plugin**: Connect to external tools (GitHub, Jira, Slack)

---

## Quick Start

### 1. Create Plugin Project

```bash
# Using ODAVL CLI
odavl plugin create my-detector-plugin --type detector

# Or manually
mkdir my-detector-plugin
cd my-detector-plugin
pnpm init
```

### 2. Install Dependencies

```bash
pnpm add @odavl-studio/sdk
pnpm add -D @odavl-studio/plugin-testing vitest typescript
```

### 3. Create Plugin Entry Point

**src/index.ts**

```typescript
import { Plugin, DetectorPlugin } from '@odavl-studio/sdk';

export default class MyDetectorPlugin implements DetectorPlugin {
  name = 'my-detector';
  version = '1.0.0';
  
  async analyze(workspace: string): Promise<Issue[]> {
    // Your detection logic here
    return [];
  }
}
```

### 4. Add Plugin Metadata

**.odavl/plugin.json**

```json
{
  "id": "my-detector-plugin",
  "name": "My Custom Detector",
  "version": "1.0.0",
  "type": "detector",
  "author": "Your Name",
  "description": "Detects custom issues in your codebase",
  "main": "dist/index.js",
  "languages": ["typescript", "javascript"],
  "requires": {
    "odavl": ">=2.0.0"
  }
}
```

### 5. Test Your Plugin

```bash
pnpm test
odavl plugin test ./
```

### 6. Publish

```bash
odavl plugin publish
```

---

## Plugin Types

### 1. Detector Plugin

Detector plugins extend ODAVL Insight's error detection capabilities.

**Interface:**

```typescript
interface DetectorPlugin {
  name: string;
  version: string;
  languages: string[];
  
  analyze(workspace: string, options?: AnalysisOptions): Promise<Issue[]>;
}

interface Issue {
  id: string;
  type: 'error' | 'warning' | 'info';
  severity: 'critical' | 'high' | 'medium' | 'low';
  message: string;
  file: string;
  line: number;
  column: number;
  detector: string;
  fixable: boolean;
  suggestedFix?: string;
}
```

**Example - SQL Injection Detector:**

```typescript
import { DetectorPlugin, Issue } from '@odavl-studio/sdk';
import { parse } from '@typescript-eslint/typescript-estree';
import * as fs from 'fs/promises';
import * as path from 'path';

export default class SQLInjectionDetector implements DetectorPlugin {
  name = 'sql-injection';
  version = '1.0.0';
  languages = ['typescript', 'javascript'];
  
  async analyze(workspace: string): Promise<Issue[]> {
    const issues: Issue[] = [];
    const files = await this.findFiles(workspace, /\.(ts|js)$/);
    
    for (const file of files) {
      const content = await fs.readFile(file, 'utf8');
      const fileIssues = this.detectSQLInjection(content, file);
      issues.push(...fileIssues);
    }
    
    return issues;
  }
  
  private detectSQLInjection(content: string, file: string): Issue[] {
    const issues: Issue[] = [];
    const ast = parse(content, { loc: true });
    
    // Look for string concatenation in SQL queries
    const sqlPattern = /\$\{[^}]+\}|"\s*\+\s*[a-zA-Z_]/;
    
    const lines = content.split('\n');
    lines.forEach((line, index) => {
      if (line.includes('SELECT') || line.includes('INSERT') || line.includes('UPDATE')) {
        if (sqlPattern.test(line)) {
          issues.push({
            id: `sql-inj-${index}`,
            type: 'error',
            severity: 'critical',
            message: 'Potential SQL injection vulnerability',
            file,
            line: index + 1,
            column: 0,
            detector: this.name,
            fixable: true,
            suggestedFix: 'Use parameterized queries or prepared statements'
          });
        }
      }
    });
    
    return issues;
  }
  
  private async findFiles(dir: string, pattern: RegExp): Promise<string[]> {
    // Recursive file search implementation
    const files: string[] = [];
    const entries = await fs.readdir(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory() && !entry.name.startsWith('.')) {
        files.push(...await this.findFiles(fullPath, pattern));
      } else if (entry.isFile() && pattern.test(entry.name)) {
        files.push(fullPath);
      }
    }
    
    return files;
  }
}
```

### 2. Recipe Plugin

Recipe plugins add self-healing capabilities to ODAVL Autopilot.

**Interface:**

```typescript
interface RecipePlugin {
  id: string;
  name: string;
  version: string;
  trust: number; // 0.1 - 1.0
  
  canFix(issue: Issue): boolean;
  apply(issue: Issue, workspace: string): Promise<RecipeResult>;
}

interface RecipeResult {
  success: boolean;
  filesModified: string[];
  changes: Change[];
  error?: string;
}
```

**Example - Auto-Import Recipe:**

```typescript
import { RecipePlugin, Issue, RecipeResult } from '@odavl-studio/sdk';
import * as fs from 'fs/promises';

export default class AutoImportRecipe implements RecipePlugin {
  id = 'auto-import';
  name = 'Auto-Import Missing Modules';
  version = '1.0.0';
  trust = 0.8;
  
  canFix(issue: Issue): boolean {
    return issue.message.includes('Cannot find name') || 
           issue.message.includes('is not defined');
  }
  
  async apply(issue: Issue, workspace: string): Promise<RecipeResult> {
    try {
      const missingName = this.extractMissingName(issue.message);
      const importPath = await this.findModule(missingName, workspace);
      
      if (!importPath) {
        return {
          success: false,
          filesModified: [],
          changes: [],
          error: `Could not find module for ${missingName}`
        };
      }
      
      // Add import at top of file
      const content = await fs.readFile(issue.file, 'utf8');
      const lines = content.split('\n');
      const importStatement = `import { ${missingName} } from '${importPath}';`;
      
      // Find last import or add at top
      let insertIndex = 0;
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].startsWith('import ')) {
          insertIndex = i + 1;
        }
      }
      
      lines.splice(insertIndex, 0, importStatement);
      await fs.writeFile(issue.file, lines.join('\n'), 'utf8');
      
      return {
        success: true,
        filesModified: [issue.file],
        changes: [{
          file: issue.file,
          type: 'insert',
          line: insertIndex + 1,
          content: importStatement
        }]
      };
    } catch (error) {
      return {
        success: false,
        filesModified: [],
        changes: [],
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  private extractMissingName(message: string): string {
    const match = message.match(/Cannot find name ['"]([^'"]+)['"]/);
    return match ? match[1] : '';
  }
  
  private async findModule(name: string, workspace: string): Promise<string | null> {
    // Search for module in node_modules or local files
    // Implementation details...
    return null;
  }
}
```

### 3. Integration Plugin

Integration plugins connect ODAVL to external tools.

**Example - Slack Notifier:**

```typescript
import { IntegrationPlugin, Issue } from '@odavl-studio/sdk';

export default class SlackIntegration implements IntegrationPlugin {
  name = 'slack';
  version = '1.0.0';
  
  async onIssuesDetected(issues: Issue[]): Promise<void> {
    const webhookUrl = process.env.SLACK_WEBHOOK_URL;
    if (!webhookUrl) return;
    
    const critical = issues.filter(i => i.severity === 'critical');
    if (critical.length === 0) return;
    
    const message = {
      text: `🚨 ${critical.length} critical issues detected!`,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*ODAVL Alert*\n${critical.length} critical issues found`
          }
        },
        ...critical.slice(0, 5).map(issue => ({
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `• ${issue.message}\n  \`${issue.file}:${issue.line}\``
          }
        }))
      ]
    };
    
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message)
    });
  }
}
```

---

## API Reference

### SDK Exports

```typescript
import {
  // Plugin interfaces
  DetectorPlugin,
  RecipePlugin,
  IntegrationPlugin,
  
  // Types
  Issue,
  RecipeResult,
  AnalysisOptions,
  
  // Utilities
  FileSystem,
  Logger,
  Config
} from '@odavl-studio/sdk';
```

### FileSystem Utilities

```typescript
import { FileSystem } from '@odavl-studio/sdk';

// Read files
const content = await FileSystem.readFile(path);

// Write files
await FileSystem.writeFile(path, content);

// Search files
const files = await FileSystem.findFiles(workspace, {
  pattern: /\.ts$/,
  exclude: ['node_modules', 'dist']
});

// Parse TypeScript
const ast = FileSystem.parseTypeScript(content);
```

### Logger

```typescript
import { Logger } from '@odavl-studio/sdk';

Logger.info('Plugin initialized');
Logger.warn('Potential issue detected');
Logger.error('Plugin failed', { error });
Logger.debug('Debug info', { details });
```

### Config

```typescript
import { Config } from '@odavl-studio/sdk';

// Get plugin config
const config = await Config.get('my-plugin');

// Set config
await Config.set('my-plugin', { apiKey: 'xxx' });
```

---

## Testing Plugins

### Unit Tests

```typescript
import { describe, it, expect } from 'vitest';
import MyDetector from '../src/detector';

describe('MyDetector', () => {
  it('should detect issues', async () => {
    const detector = new MyDetector();
    const issues = await detector.analyze('./test-fixtures');
    
    expect(issues).toHaveLength(1);
    expect(issues[0].severity).toBe('critical');
  });
});
```

### Integration Tests

```typescript
import { PluginTestHarness } from '@odavl-studio/plugin-testing';

describe('Integration Tests', () => {
  it('should work with ODAVL CLI', async () => {
    const harness = new PluginTestHarness();
    await harness.loadPlugin('./');
    
    const result = await harness.runAnalysis('./test-workspace');
    expect(result.issues).toBeDefined();
  });
});
```

### Manual Testing

```bash
# Install plugin locally
odavl plugin install ./

# Run analysis
odavl insight analyze --detectors my-detector

# Uninstall
odavl plugin uninstall my-detector
```

---

## Publishing

### 1. Prepare for Publishing

```bash
# Build plugin
pnpm build

# Run tests
pnpm test

# Lint code
pnpm lint
```

### 2. Publish to Marketplace

```bash
# Login to ODAVL Marketplace
odavl login

# Publish plugin
odavl plugin publish

# Output:
# ✓ Plugin validated
# ✓ Tests passed
# ✓ Published: my-detector-plugin@1.0.0
# URL: https://marketplace.odavl.dev/plugins/my-detector-plugin
```

### 3. Update Plugin

```bash
# Bump version
npm version patch  # or minor, major

# Republish
odavl plugin publish
```

---

## Best Practices

### Performance

1. **Cache Results**: Cache expensive operations
2. **Async Operations**: Use async/await for I/O
3. **Batch Processing**: Process files in batches
4. **Avoid Blocking**: Don't block the event loop

```typescript
// Good
const results = await Promise.all(
  files.map(file => this.analyzeFile(file))
);

// Bad
for (const file of files) {
  await this.analyzeFile(file);
}
```

### Error Handling

```typescript
async analyze(workspace: string): Promise<Issue[]> {
  try {
    // Analysis logic
    return issues;
  } catch (error) {
    Logger.error('Analysis failed', { error, workspace });
    return []; // Return empty rather than throw
  }
}
```

### Security

1. **Validate Input**: Always validate user input
2. **Sanitize Paths**: Prevent path traversal
3. **Limit Scope**: Only access necessary files
4. **No Secrets**: Never hardcode API keys

### Versioning

Follow semantic versioning:
- **Major**: Breaking changes
- **Minor**: New features
- **Patch**: Bug fixes

---

## Examples

### Real-World Plugins

1. **eslint-detector**: Integrates ESLint rules
2. **prettier-recipe**: Auto-formats code
3. **github-integration**: Creates issues automatically
4. **jira-sync**: Syncs with Jira tickets

### Plugin Templates

```bash
# Create from template
odavl plugin create my-plugin --template detector
odavl plugin create my-plugin --template recipe
odavl plugin create my-plugin --template integration
```

---

## Support

- **Documentation**: https://docs.odavl.dev/plugins
- **GitHub**: https://github.com/odavl/studio
- **Discord**: https://discord.gg/odavl
- **Email**: plugins@odavl.dev

---

## Appendix

### Plugin Marketplace

Browse plugins: https://marketplace.odavl.dev

### CLI Commands

```bash
odavl plugin --help
odavl plugin create <name>
odavl plugin install <id>
odavl plugin uninstall <id>
odavl plugin list
odavl plugin search <query>
odavl plugin publish
odavl plugin test <path>
```

### TypeScript Configuration

**tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "declaration": true,
    "outDir": "dist",
    "strict": true,
    "esModuleInterop": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

---

**Happy Plugin Development!** 🚀
