# 🔗 ODAVL SDK Integration Guide

**Complete integration examples for Next.js, Express, GitHub Apps, VS Code Extensions, and more.**

---

## 📋 Table of Contents

1. [Next.js Integration](#nextjs-integration)
2. [Express.js Integration](#expressjs-integration)
3. [GitHub App Integration](#github-app-integration)
4. [VS Code Extension Integration](#vscode-extension-integration)
5. [Testing Patterns](#testing-patterns)
6. [Error Handling Strategies](#error-handling-strategies)
7. [Performance Optimization](#performance-optimization)
8. [Production Deployment](#production-deployment)

---

## 🌐 Next.js Integration

### API Route Example

**File:** `app/api/analyze/route.ts`

```typescript
import { Insight } from '@odavl-studio/sdk/insight';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Request validation schema
const AnalyzeRequestSchema = z.object({
  workspacePath: z.string().min(1),
  detectors: z.array(z.string()).optional(),
  config: z.object({
    timeout: z.number().optional(),
    enabledDetectors: z.array(z.string()).optional(),
  }).optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const { workspacePath, detectors, config } = AnalyzeRequestSchema.parse(body);

    // Initialize Insight analyzer
    const insight = new Insight({
      workspacePath,
      timeout: config?.timeout ?? 60000, // 60s default
      enabledDetectors: config?.enabledDetectors,
    });

    // Run analysis
    const result = await insight.analyze();

    // Get metrics
    const metrics = await insight.getMetrics();

    // Return results
    return NextResponse.json({
      success: true,
      result,
      metrics,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Analysis failed:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid request', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### React Hook for Client-Side Usage

**File:** `hooks/useODAVLAnalysis.ts`

```typescript
import { useState, useCallback } from 'react';
import type { InsightAnalysisResult, InsightMetrics } from '@odavl-studio/sdk/insight';

interface UseAnalysisOptions {
  workspacePath: string;
  detectors?: string[];
  onSuccess?: (result: InsightAnalysisResult) => void;
  onError?: (error: Error) => void;
}

export function useODAVLAnalysis() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<InsightAnalysisResult | null>(null);
  const [metrics, setMetrics] = useState<InsightMetrics | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const analyze = useCallback(async (options: UseAnalysisOptions) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspacePath: options.workspacePath,
          detectors: options.detectors,
        }),
      });

      if (!response.ok) {
        throw new Error(`Analysis failed: ${response.statusText}`);
      }

      const data = await response.json();
      
      setResult(data.result);
      setMetrics(data.metrics);
      
      if (options.onSuccess) {
        options.onSuccess(data.result);
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      
      if (options.onError) {
        options.onError(error);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  return { analyze, loading, result, metrics, error };
}
```

### Server Action Example (App Router)

**File:** `app/actions/autopilot.ts`

```typescript
'use server';

import { Autopilot } from '@odavl-studio/sdk/autopilot';
import { revalidatePath } from 'next/cache';
import type { AutopilotRunResult } from '@odavl-studio/sdk/autopilot';

export async function runAutopilotCycle(
  workspacePath: string,
  maxFiles?: number,
  maxLOC?: number
): Promise<{ success: boolean; result?: AutopilotRunResult; error?: string }> {
  try {
    // Initialize autopilot
    const autopilot = new Autopilot({
      workspacePath,
      maxFiles: maxFiles ?? 10,
      maxLOC: maxLOC ?? 40,
      protectedPaths: ['security/**', '**/*.spec.*', 'auth/**'],
    });

    // Run full O-D-A-V-L cycle
    const result = await autopilot.runCycle();

    // Revalidate workspace data
    revalidatePath('/dashboard/workspace');

    return { success: true, result };
  } catch (error) {
    console.error('Autopilot cycle failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function undoLastChange(
  workspacePath: string,
  snapshotId?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const autopilot = new Autopilot({ workspacePath });
    await autopilot.undo(snapshotId);

    revalidatePath('/dashboard/workspace');

    return { success: true };
  } catch (error) {
    console.error('Undo failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
```

### Dashboard Component Example

**File:** `components/AnalysisDashboard.tsx`

```typescript
'use client';

import { useEffect, useState } from 'react';
import { useODAVLAnalysis } from '@/hooks/useODAVLAnalysis';
import type { InsightIssue } from '@odavl-studio/sdk/insight';

interface AnalysisDashboardProps {
  workspacePath: string;
}

export function AnalysisDashboard({ workspacePath }: AnalysisDashboardProps) {
  const { analyze, loading, result, metrics, error } = useODAVLAnalysis();

  useEffect(() => {
    // Run analysis on mount
    analyze({ workspacePath });
  }, [workspacePath, analyze]);

  if (loading) {
    return <div className="animate-pulse">Analyzing workspace...</div>;
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded p-4">
        <h3 className="text-red-800 font-semibold">Analysis Error</h3>
        <p className="text-red-600">{error.message}</p>
      </div>
    );
  }

  if (!result || !metrics) {
    return null;
  }

  // Group issues by severity
  const issuesBySeverity = result.issues.reduce((acc, issue) => {
    const severity = issue.severity;
    if (!acc[severity]) acc[severity] = [];
    acc[severity].push(issue);
    return acc;
  }, {} as Record<string, InsightIssue[]>);

  return (
    <div className="space-y-6">
      {/* Metrics Overview */}
      <div className="grid grid-cols-4 gap-4">
        <MetricCard
          title="Total Issues"
          value={metrics.totalIssues}
          color="blue"
        />
        <MetricCard
          title="Critical"
          value={metrics.criticalIssues}
          color="red"
        />
        <MetricCard
          title="High"
          value={metrics.highIssues}
          color="orange"
        />
        <MetricCard
          title="Medium"
          value={metrics.mediumIssues}
          color="yellow"
        />
      </div>

      {/* Issues List */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Issues Detected</h2>
        
        {Object.entries(issuesBySeverity).map(([severity, issues]) => (
          <IssueGroup
            key={severity}
            severity={severity}
            issues={issues}
          />
        ))}
      </div>

      {/* Detectors Used */}
      <div className="bg-gray-50 rounded p-4">
        <h3 className="font-semibold mb-2">Detectors Used</h3>
        <div className="flex flex-wrap gap-2">
          {result.detectors.map((detector) => (
            <span
              key={detector.name}
              className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
            >
              {detector.name}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, color }: { title: string; value: number; color: string }) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-900',
    red: 'bg-red-50 text-red-900',
    orange: 'bg-orange-50 text-orange-900',
    yellow: 'bg-yellow-50 text-yellow-900',
  }[color];

  return (
    <div className={`${colorClasses} rounded p-4`}>
      <p className="text-sm opacity-75">{title}</p>
      <p className="text-3xl font-bold">{value}</p>
    </div>
  );
}

function IssueGroup({ severity, issues }: { severity: string; issues: InsightIssue[] }) {
  return (
    <div className="border rounded p-4">
      <h3 className="font-semibold text-lg mb-3 capitalize">
        {severity} ({issues.length})
      </h3>
      <div className="space-y-2">
        {issues.map((issue, idx) => (
          <div key={idx} className="border-l-4 border-gray-300 pl-3 py-2">
            <p className="font-medium">{issue.message}</p>
            <p className="text-sm text-gray-600">
              {issue.file}:{issue.line}:{issue.column} • {issue.detector}
            </p>
            {issue.fixSuggestion && (
              <p className="text-sm text-green-600 mt-1">
                💡 {issue.fixSuggestion}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## ⚡ Express.js Integration

### Middleware Example

**File:** `middleware/odavl.ts`

```typescript
import { Request, Response, NextFunction } from 'express';
import { Insight } from '@odavl-studio/sdk/insight';
import { Guardian } from '@odavl-studio/sdk/guardian';

// Analysis middleware
export function analyzeWorkspace(workspacePath: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const insight = new Insight({ workspacePath });
      const result = await insight.analyze();

      // Attach result to request
      (req as any).odavlAnalysis = result;

      next();
    } catch (error) {
      console.error('ODAVL analysis failed:', error);
      next(error);
    }
  };
}

// Quality gate middleware
export function qualityGateGuard(thresholds: {
  maxCritical: number;
  maxHigh: number;
}) {
  return (req: Request, res: Response, next: NextFunction) => {
    const analysis = (req as any).odavlAnalysis;

    if (!analysis) {
      return res.status(500).json({ error: 'No analysis available' });
    }

    const metrics = analysis.summary;
    const criticalCount = metrics.criticalIssues ?? 0;
    const highCount = metrics.highIssues ?? 0;

    if (criticalCount > thresholds.maxCritical) {
      return res.status(400).json({
        error: 'Quality gate failed',
        reason: `Critical issues exceed threshold: ${criticalCount} > ${thresholds.maxCritical}`,
        analysis,
      });
    }

    if (highCount > thresholds.maxHigh) {
      return res.status(400).json({
        error: 'Quality gate failed',
        reason: `High issues exceed threshold: ${highCount} > ${thresholds.maxHigh}`,
        analysis,
      });
    }

    next();
  };
}

// Guardian testing middleware
export function guardianTest(url: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const guardian = new Guardian();
      const report = await guardian.runTests(url);

      if (!report.canDeploy) {
        return res.status(400).json({
          error: 'Deployment blocked by Guardian',
          report,
        });
      }

      (req as any).guardianReport = report;
      next();
    } catch (error) {
      console.error('Guardian test failed:', error);
      next(error);
    }
  };
}
```

### REST API Example

**File:** `routes/analysis.ts`

```typescript
import express from 'express';
import { Insight } from '@odavl-studio/sdk/insight';
import { Autopilot } from '@odavl-studio/sdk/autopilot';
import { Guardian } from '@odavl-studio/sdk/guardian';

const router = express.Router();

// POST /api/analysis/insight
router.post('/insight', async (req, res) => {
  try {
    const { workspacePath, detectors } = req.body;

    if (!workspacePath) {
      return res.status(400).json({ error: 'workspacePath is required' });
    }

    const insight = new Insight({
      workspacePath,
      enabledDetectors: detectors,
    });

    const result = await insight.analyze();
    const metrics = await insight.getMetrics();

    res.json({ success: true, result, metrics });
  } catch (error) {
    console.error('Insight analysis failed:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// POST /api/analysis/autopilot
router.post('/autopilot', async (req, res) => {
  try {
    const { workspacePath, maxFiles, maxLOC } = req.body;

    if (!workspacePath) {
      return res.status(400).json({ error: 'workspacePath is required' });
    }

    const autopilot = new Autopilot({
      workspacePath,
      maxFiles: maxFiles ?? 10,
      maxLOC: maxLOC ?? 40,
    });

    const result = await autopilot.runCycle();

    res.json({ success: true, result });
  } catch (error) {
    console.error('Autopilot cycle failed:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// POST /api/analysis/guardian
router.post('/guardian', async (req, res) => {
  try {
    const { url, thresholds } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'url is required' });
    }

    const guardian = new Guardian();

    if (thresholds) {
      await guardian.setThresholds(thresholds);
    }

    const report = await guardian.runTests(url);

    res.json({ success: true, report });
  } catch (error) {
    console.error('Guardian test failed:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// POST /api/analysis/autopilot/undo
router.post('/autopilot/undo', async (req, res) => {
  try {
    const { workspacePath, snapshotId } = req.body;

    if (!workspacePath) {
      return res.status(400).json({ error: 'workspacePath is required' });
    }

    const autopilot = new Autopilot({ workspacePath });
    await autopilot.undo(snapshotId);

    res.json({ success: true, message: 'Changes reverted successfully' });
  } catch (error) {
    console.error('Undo failed:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// GET /api/analysis/autopilot/ledger
router.get('/autopilot/ledger', async (req, res) => {
  try {
    const { workspacePath } = req.query;

    if (!workspacePath || typeof workspacePath !== 'string') {
      return res.status(400).json({ error: 'workspacePath is required' });
    }

    const autopilot = new Autopilot({ workspacePath });
    const ledger = await autopilot.getLedger();

    res.json({ success: true, ledger });
  } catch (error) {
    console.error('Ledger retrieval failed:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
```

### Complete Express App

**File:** `server.ts`

```typescript
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import analysisRoutes from './routes/analysis';
import { analyzeWorkspace, qualityGateGuard } from './middleware/odavl';

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  message: 'Too many requests from this IP',
});
app.use('/api/', limiter);

// Routes
app.use('/api/analysis', analysisRoutes);

// Protected deployment endpoint with quality gates
app.post(
  '/api/deploy',
  analyzeWorkspace('./src'),
  qualityGateGuard({ maxCritical: 0, maxHigh: 5 }),
  (req, res) => {
    // Proceed with deployment
    res.json({
      success: true,
      message: 'Quality gates passed, deployment approved',
      analysis: (req as any).odavlAnalysis,
    });
  }
);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
  });
});

app.listen(PORT, () => {
  console.log(`🚀 ODAVL API Server running on port ${PORT}`);
});
```

---

## 🤖 GitHub App Integration

### Webhook Handler

**File:** `webhooks/pull-request.ts`

```typescript
import { Webhooks } from '@octokit/webhooks';
import { Octokit } from '@octokit/rest';
import { Insight } from '@odavl-studio/sdk/insight';
import { Autopilot } from '@odavl-studio/sdk/autopilot';
import * as fs from 'fs';
import * as path from 'path';

const webhooks = new Webhooks({
  secret: process.env.GITHUB_WEBHOOK_SECRET!,
});

webhooks.on('pull_request.opened', async ({ payload }) => {
  const { pull_request, repository } = payload;

  console.log(`PR opened: ${pull_request.title} (#${pull_request.number})`);

  try {
    // Initialize GitHub client
    const octokit = new Octokit({
      auth: process.env.GITHUB_APP_TOKEN,
    });

    // Clone repository to temp directory
    const tempDir = `/tmp/${repository.name}-${pull_request.number}`;
    await cloneRepository(repository.clone_url, pull_request.head.ref, tempDir);

    // Run ODAVL Insight analysis
    const insight = new Insight({ workspacePath: tempDir });
    const analysis = await insight.analyze();
    const metrics = await insight.getMetrics();

    // Create PR comment with results
    const commentBody = formatAnalysisComment(analysis, metrics);

    await octokit.issues.createComment({
      owner: repository.owner.login,
      repo: repository.name,
      issue_number: pull_request.number,
      body: commentBody,
    });

    // Update commit status
    const status = metrics.criticalIssues === 0 ? 'success' : 'failure';
    await octokit.repos.createCommitStatus({
      owner: repository.owner.login,
      repo: repository.name,
      sha: pull_request.head.sha,
      state: status,
      description: `${metrics.totalIssues} issues found (${metrics.criticalIssues} critical)`,
      context: 'ODAVL Insight',
    });

    // Cleanup
    fs.rmSync(tempDir, { recursive: true, force: true });
  } catch (error) {
    console.error('Error analyzing PR:', error);
  }
});

webhooks.on('pull_request.synchronize', async ({ payload }) => {
  // Handle PR updates (new commits pushed)
  console.log(`PR updated: ${payload.pull_request.title}`);
  // Re-run analysis...
});

webhooks.on('issue_comment.created', async ({ payload }) => {
  const comment = payload.comment.body.toLowerCase();

  // Check for autopilot trigger command
  if (comment.includes('/odavl autopilot')) {
    const { issue, repository } = payload;

    if (!issue.pull_request) return; // Only run on PRs

    console.log(`Autopilot triggered on PR #${issue.number}`);

    try {
      const octokit = new Octokit({ auth: process.env.GITHUB_APP_TOKEN });

      // Get PR details
      const { data: pr } = await octokit.pulls.get({
        owner: repository.owner.login,
        repo: repository.name,
        pull_number: issue.number,
      });

      // Clone repository
      const tempDir = `/tmp/${repository.name}-${issue.number}`;
      await cloneRepository(repository.clone_url, pr.head.ref, tempDir);

      // Run autopilot
      const autopilot = new Autopilot({
        workspacePath: tempDir,
        maxFiles: 10,
        maxLOC: 40,
      });

      const result = await autopilot.runCycle();

      // Commit changes back to PR branch
      if (result.filesModified.length > 0) {
        await commitChanges(octokit, repository, pr, tempDir, result.filesModified);

        await octokit.issues.createComment({
          owner: repository.owner.login,
          repo: repository.name,
          issue_number: issue.number,
          body: `🤖 **ODAVL Autopilot** completed!\n\n✅ Modified ${result.filesModified.length} file(s)\n📊 Run ID: \`${result.runId}\`\n\nChanges have been pushed to this PR.`,
        });
      } else {
        await octokit.issues.createComment({
          owner: repository.owner.login,
          repo: repository.name,
          issue_number: issue.number,
          body: `🤖 **ODAVL Autopilot** completed!\n\nℹ️ No changes were needed.`,
        });
      }

      // Cleanup
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch (error) {
      console.error('Autopilot failed:', error);

      const octokit = new Octokit({ auth: process.env.GITHUB_APP_TOKEN });
      await octokit.issues.createComment({
        owner: repository.owner.login,
        repo: repository.name,
        issue_number: issue.number,
        body: `❌ **ODAVL Autopilot** failed!\n\nError: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    }
  }
});

function formatAnalysisComment(analysis: any, metrics: any): string {
  return `## 🔍 ODAVL Insight Analysis

### Summary
- **Total Issues:** ${metrics.totalIssues}
- **Critical:** ${metrics.criticalIssues} 🔴
- **High:** ${metrics.highIssues} 🟠
- **Medium:** ${metrics.mediumIssues} 🟡
- **Low:** ${metrics.lowIssues} 🟢

### Issues by Detector
${analysis.detectors.map((d: any) => `- **${d.name}:** ${d.issues?.length ?? 0} issues`).join('\n')}

### Top Issues
${analysis.issues.slice(0, 5).map((issue: any, idx: number) => `
${idx + 1}. **[${issue.severity}]** ${issue.message}
   - File: \`${issue.file}:${issue.line}\`
   - Detector: ${issue.detector}
   ${issue.fixSuggestion ? `- 💡 Suggestion: ${issue.fixSuggestion}` : ''}
`).join('\n')}

${analysis.issues.length > 5 ? `\n_...and ${analysis.issues.length - 5} more issues_` : ''}

---
*Powered by [ODAVL Studio](https://odavl.studio)*
`;
}

async function cloneRepository(url: string, branch: string, targetDir: string): Promise<void> {
  const { execSync } = await import('child_process');
  execSync(`git clone --branch ${branch} --depth 1 ${url} ${targetDir}`, { stdio: 'inherit' });
}

async function commitChanges(
  octokit: Octokit,
  repository: any,
  pr: any,
  workspacePath: string,
  modifiedFiles: string[]
): Promise<void> {
  const { execSync } = await import('child_process');

  // Configure git
  execSync('git config user.name "ODAVL Autopilot"', { cwd: workspacePath });
  execSync('git config user.email "autopilot@odavl.studio"', { cwd: workspacePath });

  // Add and commit changes
  execSync('git add .', { cwd: workspacePath });
  execSync('git commit -m "chore: ODAVL Autopilot improvements"', { cwd: workspacePath });

  // Push to PR branch
  execSync(`git push origin ${pr.head.ref}`, { cwd: workspacePath });
}

export default webhooks;
```

---

## 🧩 VS Code Extension Integration

### Custom Extension Example

**File:** `extension.ts`

```typescript
import * as vscode from 'vscode';
import { Insight } from '@odavl-studio/sdk/insight';
import { Autopilot } from '@odavl-studio/sdk/autopilot';
import type { InsightIssue } from '@odavl-studio/sdk/insight';

let diagnosticCollection: vscode.DiagnosticCollection;

export function activate(context: vscode.ExtensionContext) {
  console.log('ODAVL Extension activated');

  diagnosticCollection = vscode.languages.createDiagnosticCollection('odavl');
  context.subscriptions.push(diagnosticCollection);

  // Register commands
  context.subscriptions.push(
    vscode.commands.registerCommand('odavl.analyzeWorkspace', analyzeWorkspace),
    vscode.commands.registerCommand('odavl.analyzeFile', analyzeCurrentFile),
    vscode.commands.registerCommand('odavl.runAutopilot', runAutopilot),
    vscode.commands.registerCommand('odavl.clearDiagnostics', clearDiagnostics)
  );

  // Auto-analyze on file save
  context.subscriptions.push(
    vscode.workspace.onDidSaveTextDocument((document) => {
      if (vscode.workspace.getConfiguration('odavl').get('analyzeOnSave')) {
        analyzeCurrentFile();
      }
    })
  );

  // Status bar item
  const statusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    100
  );
  statusBarItem.text = '$(shield) ODAVL';
  statusBarItem.command = 'odavl.analyzeWorkspace';
  statusBarItem.show();
  context.subscriptions.push(statusBarItem);
}

async function analyzeWorkspace() {
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders) {
    vscode.window.showErrorMessage('No workspace folder open');
    return;
  }

  const workspacePath = workspaceFolders[0].uri.fsPath;

  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: 'ODAVL: Analyzing workspace...',
      cancellable: false,
    },
    async (progress) => {
      try {
        const insight = new Insight({ workspacePath });
        const result = await insight.analyze();

        // Clear existing diagnostics
        diagnosticCollection.clear();

        // Convert issues to VS Code diagnostics
        const diagnosticsByFile = new Map<string, vscode.Diagnostic[]>();

        for (const issue of result.issues) {
          const fileUri = vscode.Uri.file(issue.file);
          const diagnostics = diagnosticsByFile.get(issue.file) || [];

          const diagnostic = new vscode.Diagnostic(
            new vscode.Range(
              issue.line - 1,
              issue.column,
              issue.line - 1,
              issue.column + 50 // Approximate end
            ),
            issue.message,
            severityToVSCode(issue.severity)
          );

          diagnostic.source = `ODAVL/${issue.detector}`;
          if (issue.fixSuggestion) {
            diagnostic.relatedInformation = [
              new vscode.DiagnosticRelatedInformation(
                new vscode.Location(fileUri, diagnostic.range),
                `💡 ${issue.fixSuggestion}`
              ),
            ];
          }

          diagnostics.push(diagnostic);
          diagnosticsByFile.set(issue.file, diagnostics);
        }

        // Apply diagnostics
        for (const [file, diagnostics] of diagnosticsByFile) {
          diagnosticCollection.set(vscode.Uri.file(file), diagnostics);
        }

        const metrics = await insight.getMetrics();
        vscode.window.showInformationMessage(
          `ODAVL: Found ${metrics.totalIssues} issues (${metrics.criticalIssues} critical)`
        );
      } catch (error) {
        vscode.window.showErrorMessage(
          `ODAVL analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }
  );
}

async function analyzeCurrentFile() {
  const editor = vscode.window.activeTextEditor;
  if (!editor) return;

  const filePath = editor.document.uri.fsPath;
  const workspacePath = vscode.workspace.getWorkspaceFolder(editor.document.uri)?.uri.fsPath;

  if (!workspacePath) {
    vscode.window.showErrorMessage('File is not in a workspace');
    return;
  }

  try {
    const insight = new Insight({ workspacePath });
    const result = await insight.analyze(filePath);

    // Clear diagnostics for this file
    diagnosticCollection.delete(editor.document.uri);

    // Add new diagnostics
    const diagnostics: vscode.Diagnostic[] = [];

    for (const issue of result.issues.filter(i => i.file === filePath)) {
      const diagnostic = new vscode.Diagnostic(
        new vscode.Range(issue.line - 1, issue.column, issue.line - 1, issue.column + 50),
        issue.message,
        severityToVSCode(issue.severity)
      );
      diagnostic.source = `ODAVL/${issue.detector}`;
      diagnostics.push(diagnostic);
    }

    diagnosticCollection.set(editor.document.uri, diagnostics);

    vscode.window.showInformationMessage(`ODAVL: Found ${diagnostics.length} issues in current file`);
  } catch (error) {
    vscode.window.showErrorMessage(
      `ODAVL analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

async function runAutopilot() {
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders) {
    vscode.window.showErrorMessage('No workspace folder open');
    return;
  }

  const workspacePath = workspaceFolders[0].uri.fsPath;

  const confirm = await vscode.window.showWarningMessage(
    'Run ODAVL Autopilot? This will automatically modify files.',
    { modal: true },
    'Run Autopilot',
    'Cancel'
  );

  if (confirm !== 'Run Autopilot') return;

  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: 'ODAVL Autopilot: Running O-D-A-V-L cycle...',
      cancellable: false,
    },
    async (progress) => {
      try {
        const autopilot = new Autopilot({ workspacePath });

        progress.report({ message: 'Observing...' });
        await autopilot.runPhase('observe');

        progress.report({ message: 'Deciding...' });
        await autopilot.runPhase('decide');

        progress.report({ message: 'Acting...' });
        const result = await autopilot.runCycle();

        if (result.filesModified.length > 0) {
          vscode.window.showInformationMessage(
            `ODAVL Autopilot: Modified ${result.filesModified.length} file(s)`,
            'Show Changes',
            'Undo'
          ).then((action) => {
            if (action === 'Undo') {
              autopilot.undo().then(() => {
                vscode.window.showInformationMessage('Changes reverted');
              });
            }
          });
        } else {
          vscode.window.showInformationMessage('ODAVL Autopilot: No changes needed');
        }
      } catch (error) {
        vscode.window.showErrorMessage(
          `ODAVL Autopilot failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }
  );
}

function clearDiagnostics() {
  diagnosticCollection.clear();
  vscode.window.showInformationMessage('ODAVL diagnostics cleared');
}

function severityToVSCode(severity: string): vscode.DiagnosticSeverity {
  switch (severity.toLowerCase()) {
    case 'critical':
      return vscode.DiagnosticSeverity.Error;
    case 'high':
      return vscode.DiagnosticSeverity.Warning;
    case 'medium':
      return vscode.DiagnosticSeverity.Information;
    case 'low':
      return vscode.DiagnosticSeverity.Hint;
    default:
      return vscode.DiagnosticSeverity.Information;
  }
}

export function deactivate() {
  diagnosticCollection?.dispose();
}
```

---

## 🧪 Testing Patterns

### Unit Tests (Vitest)

**File:** `tests/integration.test.ts`

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Insight } from '@odavl-studio/sdk/insight';
import { Autopilot } from '@odavl-studio/sdk/autopilot';
import { Guardian } from '@odavl-studio/sdk/guardian';
import * as fs from 'fs';
import * as path from 'path';

describe('ODAVL SDK Integration', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(__dirname, 'test-workspace-'));
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  describe('Insight', () => {
    it('should analyze workspace and return results', async () => {
      // Create test file with issue
      const testFile = path.join(tempDir, 'test.ts');
      fs.writeFileSync(testFile, `const unused = 'variable';\nconsole.log('test');`);

      const insight = new Insight({ workspacePath: tempDir });
      const result = await insight.analyze();

      expect(result).toBeDefined();
      expect(result.issues).toBeInstanceOf(Array);
      expect(result.summary.totalIssues).toBeGreaterThan(0);
    });

    it('should provide fix suggestions', async () => {
      const testFile = path.join(tempDir, 'test.ts');
      fs.writeFileSync(testFile, `const unused = 'variable';`);

      const insight = new Insight({ workspacePath: tempDir });
      const result = await insight.analyze();

      const issue = result.issues[0];
      const suggestion = await insight.getFixSuggestions(issue);

      expect(suggestion).toBeDefined();
      expect(typeof suggestion).toBe('string');
    });

    it('should export to Problems Panel format', async () => {
      const testFile = path.join(tempDir, 'test.ts');
      fs.writeFileSync(testFile, `const unused = 'variable';`);

      const insight = new Insight({ workspacePath: tempDir });
      const result = await insight.analyze();
      const exported = insight.exportToProblemsPanel(result);

      expect(exported).toBeDefined();
      expect(exported.timestamp).toBeDefined();
      expect(exported.diagnostics).toBeDefined();
    });
  });

  describe('Autopilot', () => {
    it('should run full O-D-A-V-L cycle', async () => {
      // Create test file with linting issues
      const testFile = path.join(tempDir, 'test.ts');
      fs.writeFileSync(testFile, `const unused='variable'\nconsole.log("test")`);

      const autopilot = new Autopilot({
        workspacePath: tempDir,
        maxFiles: 10,
        maxLOC: 40,
      });

      const result = await autopilot.runCycle();

      expect(result).toBeDefined();
      expect(result.runId).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.phase).toBe('learn');
    });

    it('should respect risk budget constraints', async () => {
      const autopilot = new Autopilot({
        workspacePath: tempDir,
        maxFiles: 1, // Very restrictive
        maxLOC: 5,
      });

      // Create multiple files to exceed limit
      for (let i = 0; i < 5; i++) {
        fs.writeFileSync(path.join(tempDir, `file${i}.ts`), 'const x = 1;');
      }

      const result = await autopilot.runCycle();

      // Should complete but modify limited files
      expect(result.filesModified.length).toBeLessThanOrEqual(1);
    });

    it('should create undo snapshots', async () => {
      const testFile = path.join(tempDir, 'test.ts');
      fs.writeFileSync(testFile, 'const x=1');

      const autopilot = new Autopilot({ workspacePath: tempDir });
      await autopilot.runCycle();

      // Check for undo snapshot
      const undoDir = path.join(tempDir, '.odavl', 'undo');
      expect(fs.existsSync(undoDir)).toBe(true);

      const ledger = await autopilot.getLedger();
      expect(ledger.length).toBeGreaterThan(0);
    });

    it('should undo changes', async () => {
      const testFile = path.join(tempDir, 'test.ts');
      const originalContent = 'const x=1';
      fs.writeFileSync(testFile, originalContent);

      const autopilot = new Autopilot({ workspacePath: tempDir });
      await autopilot.runCycle();

      // Undo
      await autopilot.undo();

      const restoredContent = fs.readFileSync(testFile, 'utf-8');
      expect(restoredContent).toBe(originalContent);
    });
  });

  describe('Guardian', () => {
    it('should run pre-deploy tests', async () => {
      const guardian = new Guardian();
      const report = await guardian.runTests('https://example.com');

      expect(report).toBeDefined();
      expect(report.deploymentId).toBeDefined();
      expect(report.tests).toBeInstanceOf(Array);
      expect(report.qualityGates).toBeInstanceOf(Array);
      expect(typeof report.canDeploy).toBe('boolean');
    });

    it('should respect custom thresholds', async () => {
      const guardian = new Guardian();

      await guardian.setThresholds({
        accessibility: 95,
        performance: 90,
        security: 100,
        seo: 85,
      });

      const report = await guardian.runTests('https://example.com');

      // Check if thresholds are applied
      for (const gate of report.qualityGates) {
        if (!gate.passed) {
          expect(gate.current).toBeLessThan(gate.threshold);
        }
      }
    });

    it('should retrieve test history', async () => {
      const guardian = new Guardian();

      // Run multiple tests
      await guardian.runTests('https://example.com');
      await guardian.runTests('https://example.org');

      const history = await guardian.getHistory();

      expect(history).toBeInstanceOf(Array);
      expect(history.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Integration Scenarios', () => {
    it('should run Insight → Autopilot → Guardian workflow', async () => {
      // Create test workspace
      const testFile = path.join(tempDir, 'app.ts');
      fs.writeFileSync(testFile, `const unused='var'\nconsole.log("test")`);

      // Step 1: Analyze with Insight
      const insight = new Insight({ workspacePath: tempDir });
      const analysis = await insight.analyze();
      expect(analysis.issues.length).toBeGreaterThan(0);

      // Step 2: Fix with Autopilot
      const autopilot = new Autopilot({ workspacePath: tempDir });
      const autopilotResult = await autopilot.runCycle();
      expect(autopilotResult.success).toBe(true);

      // Step 3: Verify with Guardian (mock URL)
      const guardian = new Guardian();
      const guardianReport = await guardian.runTests('https://localhost:3000');
      expect(guardianReport).toBeDefined();
    });
  });
});
```

### E2E Tests

**File:** `tests/e2e/cli.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

describe('CLI E2E Tests', () => {
  const testWorkspace = path.join(__dirname, 'test-workspace');

  beforeEach(() => {
    if (fs.existsSync(testWorkspace)) {
      fs.rmSync(testWorkspace, { recursive: true });
    }
    fs.mkdirSync(testWorkspace, { recursive: true });
  });

  afterEach(() => {
    fs.rmSync(testWorkspace, { recursive: true, force: true });
  });

  it('should run odavl insight analyze', () => {
    // Create test file
    fs.writeFileSync(
      path.join(testWorkspace, 'test.ts'),
      'const unused = "variable";'
    );

    const output = execSync('odavl insight analyze', {
      cwd: testWorkspace,
      encoding: 'utf-8',
    });

    expect(output).toContain('Analysis complete');
    expect(output).toContain('issues found');
  });

  it('should run odavl autopilot with --dry-run', () => {
    fs.writeFileSync(
      path.join(testWorkspace, 'test.ts'),
      'const x=1'
    );

    const output = execSync('odavl autopilot run --dry-run', {
      cwd: testWorkspace,
      encoding: 'utf-8',
    });

    expect(output).toContain('Dry run complete');
  });
});
```

---

## 🛡️ Error Handling Strategies

### Comprehensive Error Handler

```typescript
import {
  ConfigurationError,
  AnalysisError,
  NetworkError,
  TimeoutError,
  ValidationError,
} from '@odavl-studio/sdk';

export async function safeAnalysis(workspacePath: string) {
  try {
    const insight = new Insight({
      workspacePath,
      timeout: 60000,
    });

    return await insight.analyze();
  } catch (error) {
    if (error instanceof ConfigurationError) {
      console.error('Configuration error:', error.message);
      // Check .odavl/gates.yml, fix paths, etc.
      return { error: 'configuration', message: error.message };
    }

    if (error instanceof AnalysisError) {
      console.error('Analysis failed:', error.message);
      // Retry with different detectors, check file permissions
      return { error: 'analysis', message: error.message };
    }

    if (error instanceof TimeoutError) {
      console.error('Analysis timed out:', error.message);
      // Increase timeout, analyze smaller subset
      return { error: 'timeout', message: error.message };
    }

    if (error instanceof NetworkError) {
      console.error('Network error:', error.message);
      // Check connectivity, retry with exponential backoff
      return { error: 'network', message: error.message };
    }

    if (error instanceof ValidationError) {
      console.error('Validation error:', error.message);
      // Fix input parameters
      return { error: 'validation', message: error.message };
    }

    // Unknown error
    console.error('Unknown error:', error);
    return { error: 'unknown', message: String(error) };
  }
}
```

### Retry Logic

```typescript
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, attempt);
        console.log(`Retry ${attempt + 1}/${maxRetries} after ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError || new Error('Max retries exceeded');
}

// Usage
const result = await retryWithBackoff(
  () => insight.analyze(),
  3,
  1000
);
```

---

## ⚡ Performance Optimization

### Caching Strategy

```typescript
import { LRUCache } from 'lru-cache';
import type { InsightAnalysisResult } from '@odavl-studio/sdk/insight';

const cache = new LRUCache<string, InsightAnalysisResult>({
  max: 100, // Max 100 entries
  ttl: 1000 * 60 * 15, // 15 minutes
});

export async function cachedAnalysis(workspacePath: string) {
  const cacheKey = `analysis:${workspacePath}`;
  
  // Check cache
  const cached = cache.get(cacheKey);
  if (cached) {
    console.log('Cache hit');
    return cached;
  }

  // Run analysis
  const insight = new Insight({ workspacePath });
  const result = await insight.analyze();

  // Store in cache
  cache.set(cacheKey, result);

  return result;
}
```

### Parallel Processing

```typescript
export async function analyzeMultipleWorkspaces(workspaces: string[]) {
  const results = await Promise.allSettled(
    workspaces.map((workspace) =>
      new Insight({ workspacePath: workspace }).analyze()
    )
  );

  return results.map((result, idx) => ({
    workspace: workspaces[idx],
    success: result.status === 'fulfilled',
    data: result.status === 'fulfilled' ? result.value : null,
    error: result.status === 'rejected' ? result.reason : null,
  }));
}
```

---

## 🚀 Production Deployment

### Environment Configuration

```typescript
// config/odavl.ts
export const odavlConfig = {
  insight: {
    workspacePath: process.env.WORKSPACE_PATH || './src',
    timeout: parseInt(process.env.ANALYSIS_TIMEOUT || '60000'),
    enabledDetectors: process.env.ENABLED_DETECTORS?.split(','),
  },
  autopilot: {
    maxFiles: parseInt(process.env.AUTOPILOT_MAX_FILES || '10'),
    maxLOC: parseInt(process.env.AUTOPILOT_MAX_LOC || '40'),
    protectedPaths: process.env.PROTECTED_PATHS?.split(',') || [
      'security/**',
      '**/*.spec.*',
    ],
  },
  guardian: {
    thresholds: {
      accessibility: parseInt(process.env.GUARDIAN_ACCESSIBILITY || '90'),
      performance: parseInt(process.env.GUARDIAN_PERFORMANCE || '85'),
      security: parseInt(process.env.GUARDIAN_SECURITY || '95'),
      seo: parseInt(process.env.GUARDIAN_SEO || '80'),
    },
  },
};
```

### Docker Compose Example

```yaml
version: '3.8'

services:
  odavl-api:
    build: .
    ports:
      - '3000:3000'
    environment:
      - NODE_ENV=production
      - WORKSPACE_PATH=/app/workspace
      - ANALYSIS_TIMEOUT=60000
      - AUTOPILOT_MAX_FILES=10
      - GUARDIAN_ACCESSIBILITY=90
    volumes:
      - ./workspace:/app/workspace:ro
    restart: unless-stopped

  odavl-worker:
    build: .
    command: node dist/worker.js
    environment:
      - NODE_ENV=production
      - REDIS_URL=redis://redis:6379
    depends_on:
      - redis
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    ports:
      - '6379:6379'
    restart: unless-stopped
```

---

## 📚 Additional Resources

- **CLI Reference:** See [CLI_REFERENCE.md](./CLI_REFERENCE.md)
- **SDK API:** See [SDK_REFERENCE.md](./SDK_REFERENCE.md)
- **Architecture:** See [ARCHITECTURE_COMPLETE.md](./ARCHITECTURE_COMPLETE.md)
- **Best Practices:** See [BEST_PRACTICES.md](./BEST_PRACTICES.md)

---

**Built with ❤️ by ODAVL Studio Team**
