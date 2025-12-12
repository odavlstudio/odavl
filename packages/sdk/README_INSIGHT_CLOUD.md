# ODAVL Insight Cloud SDK

> Clean, type-safe TypeScript SDK for ODAVL Insight Cloud API

The Insight Cloud SDK provides a production-ready client for interacting with ODAVL Insight Cloud backend. Used by VS Code extensions, CLI tools, and external integrators.

## Features

- ✅ **Type-safe** - Full TypeScript support with strict typing
- ✅ **Error handling** - Explicit success/error responses with status codes
- ✅ **Authentication** - JWT token management (externally handled)
- ✅ **Projects** - Create, list, and manage analysis projects
- ✅ **Analyses** - Start, poll, and retrieve analysis results
- ✅ **Issues** - Filter and query detected issues
- ✅ **Pagination** - Built-in support for paginated responses
- ✅ **Timeout control** - Configurable request timeouts

## Installation

```bash
# pnpm (recommended for monorepo)
pnpm add @odavl-studio/sdk

# npm
npm install @odavl-studio/sdk

# yarn
yarn add @odavl-studio/sdk
```

## Quick Start

```typescript
import { createInsightClient } from '@odavl-studio/sdk/insight-cloud';

// Create client with JWT token
const client = createInsightClient({
  accessToken: 'your-jwt-token',
  baseUrl: 'https://cloud.odavl.studio', // optional, defaults to production
  timeout: 30000 // optional, defaults to 30s
});

// List projects
const result = await client.listProjects();
if (result.success) {
  console.log(`Found ${result.data.total} projects`);
  result.data.projects.forEach(p => console.log(`- ${p.name}`));
} else {
  console.error('Error:', result.error.message);
}
```

## API Reference

### Client Configuration

```typescript
interface InsightCloudConfig {
  baseUrl?: string;        // Default: 'https://cloud.odavl.studio'
  accessToken?: string;    // JWT token (can be set later)
  timeout?: number;        // Request timeout in ms (default: 30000)
}
```

### Response Types

All methods return a discriminated union:

```typescript
type InsightResponse<T> = 
  | { success: true; data: T }
  | { success: false; error: InsightApiError };

interface InsightApiError {
  error: string;          // Error code (e.g., 'Unauthorized', 'NotFound')
  message?: string;       // Human-readable message
  details?: any;          // Additional error context
  statusCode?: number;    // HTTP status code
}
```

### Authentication

```typescript
// Set token after initialization
client.setAccessToken('new-jwt-token');

// Check auth status
if (client.isAuthenticated()) {
  console.log('Client is authenticated');
}
```

### Projects

#### List Projects

```typescript
const result = await client.listProjects({
  page: 1,           // optional, default: 1
  pageSize: 20,      // optional, default: 20
  search: 'my-app'   // optional, search by name
});

if (result.success) {
  const { projects, total, page, pageSize } = result.data;
  console.log(`Page ${page} of ${Math.ceil(total / pageSize)}`);
}
```

#### Get Project

```typescript
const result = await client.getProject('project-id');

if (result.success) {
  const project = result.data;
  console.log(`${project.name} - ${project.analysisCount} analyses`);
}
```

#### Create Project

```typescript
const result = await client.createProject({
  name: 'my-project',
  gitUrl: 'https://github.com/user/repo', // optional
  gitBranch: 'main'                        // optional
});

if (result.success) {
  console.log('Created project:', result.data.id);
}
```

### Analyses

#### Start Analysis

```typescript
const result = await client.startAnalysis({
  projectId: 'project-id',
  detectors: ['typescript', 'security', 'performance'], // optional
  language: 'typescript',                                // optional
  path: 'src/'                                          // optional
});

if (result.success) {
  const job = result.data;
  console.log(`Started analysis: ${job.id}`);
  console.log(`Status: ${job.status}, Progress: ${job.progress}%`);
}
```

#### Get Analysis

```typescript
const result = await client.getAnalysis('analysis-id');

if (result.success) {
  const analysis = result.data;
  console.log(`Status: ${analysis.status}`);
  console.log(`Issues: ${analysis.totalIssues} (${analysis.critical} critical)`);
}
```

#### Poll Analysis

Wait for analysis to complete with progress updates:

```typescript
const result = await client.pollAnalysis(
  'analysis-id',
  (progress, status) => {
    console.log(`${status}: ${progress}%`);
  },
  150 // optional, max attempts (default: 150 = 5 minutes)
);

if (result.success) {
  const analysis = result.data;
  if (analysis.status === 'COMPLETED') {
    console.log(`✅ Completed in ${analysis.duration}ms`);
    console.log(`Found ${analysis.totalIssues} issues`);
  } else if (analysis.status === 'FAILED') {
    console.log('❌ Analysis failed');
  }
}
```

#### List Analyses

```typescript
const result = await client.listAnalyses({
  page: 1,                  // optional
  pageSize: 20,             // optional
  projectId: 'project-id',  // optional, filter by project
  status: 'COMPLETED'       // optional, filter by status
});

if (result.success) {
  result.data.analyses.forEach(a => {
    console.log(`${a.id}: ${a.status} - ${a.totalIssues} issues`);
  });
}
```

### Issues

#### List Issues

```typescript
const result = await client.listIssues('analysis-id', {
  page: 1,                       // optional
  pageSize: 50,                  // optional
  severity: 'CRITICAL',          // optional, filter by severity
  detector: 'security',          // optional, filter by detector
  category: 'authentication',    // optional, filter by category
  autoFixable: true              // optional, filter fixable issues
});

if (result.success) {
  result.data.issues.forEach(issue => {
    console.log(`${issue.severity}: ${issue.message}`);
    console.log(`  ${issue.filePath}:${issue.line}`);
    if (issue.autoFixable) {
      console.log(`  ✨ Auto-fixable`);
    }
  });
}
```

#### Get Issue

```typescript
const result = await client.getIssue('issue-id');

if (result.success) {
  const issue = result.data;
  console.log(`${issue.detector}: ${issue.message}`);
  if (issue.suggestion) {
    console.log(`💡 Suggestion: ${issue.suggestion}`);
  }
}
```

## Usage Examples

### Example 1: Node.js Script

```typescript
#!/usr/bin/env node
import { createInsightClient } from '@odavl-studio/sdk/insight-cloud';

async function main() {
  // Get token from environment or auth flow
  const token = process.env.ODAVL_TOKEN;
  if (!token) {
    console.error('Set ODAVL_TOKEN environment variable');
    process.exit(1);
  }

  const client = createInsightClient({ accessToken: token });

  // List all projects
  console.log('📦 Your Projects:');
  const projects = await client.listProjects();
  if (!projects.success) {
    console.error('Failed to load projects:', projects.error.message);
    return;
  }

  for (const project of projects.data.projects) {
    console.log(`\n${project.name} (${project.analysisCount} analyses)`);
    
    // Get recent analyses for each project
    const analyses = await client.listAnalyses({
      projectId: project.id,
      pageSize: 5,
      status: 'COMPLETED'
    });

    if (analyses.success) {
      analyses.data.analyses.forEach(a => {
        console.log(`  - ${a.id}: ${a.totalIssues} issues (${a.critical} critical)`);
      });
    }
  }
}

main().catch(console.error);
```

### Example 2: VS Code Extension

```typescript
import * as vscode from 'vscode';
import { createInsightClient, type InsightCloudClient } from '@odavl-studio/sdk/insight-cloud';

export class CloudService {
  private client: InsightCloudClient;

  constructor(context: vscode.ExtensionContext) {
    this.client = createInsightClient();
    
    // Restore token from secret storage
    this.restoreToken(context);
  }

  private async restoreToken(context: vscode.ExtensionContext) {
    const token = await context.secrets.get('odavl-access-token');
    if (token) {
      this.client.setAccessToken(token);
    }
  }

  async analyzeWorkspace(projectId: string): Promise<void> {
    // Start analysis
    const result = await this.client.startAnalysis({
      projectId,
      detectors: ['typescript', 'security', 'performance'],
      path: vscode.workspace.workspaceFolders?.[0].uri.fsPath
    });

    if (!result.success) {
      vscode.window.showErrorMessage(`Failed to start analysis: ${result.error.message}`);
      return;
    }

    const analysisId = result.data.id;

    // Show progress
    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: 'Analyzing workspace...',
        cancellable: false
      },
      async (progress) => {
        const finalResult = await this.client.pollAnalysis(
          analysisId,
          (prog, status) => {
            progress.report({
              message: `${status}: ${prog}%`,
              increment: prog
            });
          }
        );

        if (finalResult.success && finalResult.data.status === 'COMPLETED') {
          vscode.window.showInformationMessage(
            `✅ Analysis complete: ${finalResult.data.totalIssues} issues found`
          );
        }
      }
    );
  }
}
```

### Example 3: CLI Command

```typescript
import { Command } from 'commander';
import { createInsightClient } from '@odavl-studio/sdk/insight-cloud';
import { loadAuthToken } from './auth'; // Your auth module

const program = new Command();

program
  .command('analyze <projectId>')
  .description('Start cloud analysis for project')
  .option('-d, --detectors <detectors>', 'Comma-separated detector list')
  .action(async (projectId, options) => {
    const token = await loadAuthToken();
    const client = createInsightClient({ accessToken: token });

    const detectors = options.detectors?.split(',');

    console.log('🚀 Starting analysis...');
    const result = await client.startAnalysis({
      projectId,
      detectors,
      path: process.cwd()
    });

    if (!result.success) {
      console.error('❌ Error:', result.error.message);
      process.exit(1);
    }

    console.log(`✅ Analysis started: ${result.data.id}`);
    console.log('Polling for results...');

    const finalResult = await client.pollAnalysis(
      result.data.id,
      (progress, status) => {
        process.stdout.write(`\r${status}: ${progress}%`);
      }
    );

    console.log(''); // newline

    if (finalResult.success && finalResult.data.status === 'COMPLETED') {
      console.log(`\n✅ Analysis complete!`);
      console.log(`Total issues: ${finalResult.data.totalIssues}`);
      console.log(`  Critical: ${finalResult.data.critical}`);
      console.log(`  High: ${finalResult.data.high}`);
      console.log(`  Medium: ${finalResult.data.medium}`);
      console.log(`  Low: ${finalResult.data.low}`);
    } else {
      console.error('❌ Analysis failed');
      process.exit(1);
    }
  });

program.parse();
```

## Error Handling

All methods return explicit success/error responses:

```typescript
const result = await client.getProject('project-id');

if (result.success) {
  // TypeScript knows result.data is available
  const project = result.data;
  console.log(project.name);
} else {
  // TypeScript knows result.error is available
  const { error, message, statusCode } = result.error;
  
  switch (statusCode) {
    case 401:
      console.error('Unauthorized - token may be expired');
      break;
    case 404:
      console.error('Project not found');
      break;
    case 429:
      console.error('Rate limit exceeded');
      break;
    default:
      console.error(`Error: ${message || error}`);
  }
}
```

## Type Definitions

### Core Types

```typescript
// Analysis status
type AnalysisStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';

// Issue severity
type IssueSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';

// Project
interface InsightProject {
  id: string;
  name: string;
  gitUrl?: string;
  gitBranch?: string;
  analysisCount: number;
  lastAnalyzedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// Analysis job
interface InsightAnalysisJob {
  id: string;
  projectId: string;
  status: AnalysisStatus;
  progress: number;
  detectors: string[];
  createdAt: string;
  updatedAt: string;
}

// Analysis result
interface InsightAnalysisResult extends InsightAnalysisJob {
  completedAt?: string;
  duration?: number;
  totalIssues: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  info: number;
  issues: InsightCloudIssue[];
}

// Issue
interface InsightCloudIssue {
  id: string;
  filePath: string;
  line: number;
  column?: number;
  severity: IssueSeverity;
  message: string;
  detector: string;
  ruleId?: string;
  category?: string;
  code?: string;
  suggestion?: string;
  autoFixable: boolean;
  confidence?: number;
}
```

## Best Practices

### 1. Token Management

```typescript
// ✅ Good: Store token securely, set dynamically
const client = createInsightClient();

// After OAuth flow or device code flow
const token = await authenticateUser();
await saveTokenSecurely(token);
client.setAccessToken(token);

// ❌ Bad: Hardcode token in source
const client = createInsightClient({
  accessToken: 'eyJhbGc...' // DON'T DO THIS
});
```

### 2. Error Handling

```typescript
// ✅ Good: Check success, handle specific errors
const result = await client.listProjects();
if (!result.success) {
  if (result.error.statusCode === 401) {
    await refreshToken();
    return retry();
  }
  throw new Error(result.error.message);
}

// ❌ Bad: Assume success
const projects = (await client.listProjects()).data; // May crash!
```

### 3. Pagination

```typescript
// ✅ Good: Handle pagination properly
async function getAllProjects() {
  const projects: InsightProject[] = [];
  let page = 1;
  const pageSize = 50;

  while (true) {
    const result = await client.listProjects({ page, pageSize });
    if (!result.success) break;
    
    projects.push(...result.data.projects);
    
    if (projects.length >= result.data.total) break;
    page++;
  }

  return projects;
}

// ❌ Bad: Only fetch first page
const result = await client.listProjects();
const projects = result.success ? result.data.projects : [];
```

### 4. Timeouts

```typescript
// ✅ Good: Set reasonable timeout for long operations
const client = createInsightClient({
  timeout: 60000 // 60s for analysis polling
});

// ❌ Bad: Use default timeout for long operations
// (default 30s may be too short for analysis)
```

## Development URLs

```typescript
// Production (default)
const client = createInsightClient({
  baseUrl: 'https://cloud.odavl.studio'
});

// Development
const client = createInsightClient({
  baseUrl: 'http://localhost:3000'
});

// Staging
const client = createInsightClient({
  baseUrl: 'https://staging.cloud.odavl.studio'
});
```

## Contributing

Found a bug or want to contribute? See [CONTRIBUTING.md](../../CONTRIBUTING.md).

## License

MIT © ODAVL Studio
