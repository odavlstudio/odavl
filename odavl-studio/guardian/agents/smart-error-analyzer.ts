/**
 * ODAVL Guardian v4.0 - Smart Error Analyzer
 * 
 * Purpose: Analyze runtime errors with AI and suggest fixes
 * - Root cause analysis
 * - Platform-specific issue detection
 * - AI-generated fix suggestions (NO execution)
 * - Handoff to ODAVL Autopilot for actual fixes
 * 
 * Guardian Job: Detect + Suggest (NOT fix)
 * Autopilot Job: Execute fixes safely
 */

import Anthropic from '@anthropic-ai/sdk';
import * as fs from 'fs/promises';

export interface ErrorDiagnosis {
  rootCause: string;
  isPlatformSpecific: boolean;
  isRuntimeIssue: boolean;
  affectedFiles: string[];
  suggestedFix: CodeFixSuggestion;
  confidence: number;
  reasoning: string;
}

export interface CodeFixSuggestion {
  files: FileFix[];
  testPlan: string[];
  verificationSteps: string[];
}

export interface FileFix {
  path: string;
  action: 'modify' | 'create' | 'delete';
  before?: string;
  after?: string;
  explanation: string;
}

export interface ErrorContext {
  platform: string;
  os: string;
  vscodeVersion?: string;
  extensionVersion?: string;
  when: string;
  expected: string;
  actual: string;
  consoleLogs?: string[];
  stackTrace?: string;
}

interface SourceFile {
  path: string;
  content: string;
}

/**
 * Smart Error Analyzer - Guardian v4.0
 * 
 * Architectural Boundaries:
 * ✅ Detects runtime errors
 * ✅ Generates AI-powered fix suggestions
 * ✅ Provides detailed diagnostics
 * ❌ NEVER executes file modifications
 * ❌ NEVER applies fixes automatically
 * 
 * Integration: Guardian → Autopilot handoff
 * - Guardian: Detect + Suggest
 * - Autopilot: Execute fixes safely (O-D-A-V-L cycle)
 */
export class SmartErrorAnalyzer {
  private claude: Anthropic;
  
  constructor(apiKey?: string) {
    this.claude = new Anthropic({ 
      apiKey: apiKey || process.env.ANTHROPIC_API_KEY || ''
    });
  }
  
  /**
   * Analyze runtime error with AI
   * 
   * Steps:
   * 1. Read relevant source files from stack trace
   * 2. Send error + context + source to Claude
   * 3. Get root cause + fix suggestion
   * 4. Return structured diagnosis
   * 
   * Note: This method generates suggestions ONLY.
   * Use ODAVL Autopilot to apply fixes.
   */
  async analyzeRuntimeError(
    error: Error,
    context: ErrorContext
  ): Promise<ErrorDiagnosis> {
    // Read relevant source files
    const sourceFiles = await this.readRelevantFiles(context.stackTrace);
    
    const prompt = `You are debugging an ODAVL VS Code extension runtime error.

ERROR:
${error.message}

STACK TRACE:
${error.stack || 'No stack trace available'}

CONTEXT:
- Platform: ${context.platform}
- OS: ${context.os}
- VS Code Version: ${context.vscodeVersion || 'unknown'}
- Extension Version: ${context.extensionVersion || 'unknown'}
- When: ${context.when}
- Expected behavior: ${context.expected}
- Actual behavior: ${context.actual}

SOURCE FILES:
${sourceFiles.map(f => `
File: ${f.path}
\`\`\`typescript
${f.content}
\`\`\`
`).join('\n')}

CONSOLE LOGS:
${context.consoleLogs?.join('\n') || 'No logs available'}

Analyze this error deeply:
1. What is the root cause?
2. Is this platform-specific (Windows/Mac/Linux issue)?
3. Is this a race condition or timing issue?
4. Which files need to be fixed?
5. What is the exact fix needed?

Return JSON:
{
  "rootCause": "detailed explanation of why this error occurs",
  "isPlatformSpecific": boolean,
  "isRuntimeIssue": boolean,
  "affectedFiles": ["file1.ts", "file2.ts"],
  "suggestedFix": {
    "files": [
      {
        "path": "src/extension.ts",
        "action": "modify",
        "before": "code that has the bug",
        "after": "corrected code",
        "explanation": "why this fixes it"
      }
    ],
    "testPlan": ["test step 1", "test step 2"],
    "verificationSteps": ["how to verify the fix worked"]
  },
  "confidence": 0.0-1.0,
  "reasoning": "detailed reasoning for this diagnosis"
}`;
    
    try {
      const response = await this.claude.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4096,
        messages: [{ role: 'user', content: prompt }]
      });
      
      const text = response.content[0].type === 'text' 
        ? response.content[0].text 
        : '';
      
      const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : text;
      
      const diagnosis = JSON.parse(jsonStr) as ErrorDiagnosis;
      
      return diagnosis;
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      // Return fallback diagnosis
      return {
        rootCause: `AI diagnosis failed: ${errorMessage}`,
        isPlatformSpecific: false,
        isRuntimeIssue: true,
        affectedFiles: [],
        suggestedFix: {
          files: [],
          testPlan: ['Manual debugging required'],
          verificationSteps: ['N/A']
        },
        confidence: 0,
        reasoning: 'AI analysis unavailable'
      };
    }
  }
  
  /**
   * Read source files mentioned in stack trace
   */
  private async readRelevantFiles(stackTrace?: string): Promise<SourceFile[]> {
    if (!stackTrace) return [];
    
    // Extract file paths from stack trace
    const fileMatches = stackTrace.matchAll(/at .* \((.+?):(\d+):(\d+)\)/g);
    const files: SourceFile[] = [];
    const seenPaths = new Set<string>();
    
    for (const match of fileMatches) {
      const filePath = match[1];
      
      // Skip node_modules and system files
      if (filePath.includes('node_modules') || filePath.includes('internal/')) {
        continue;
      }
      
      // Skip duplicates
      if (seenPaths.has(filePath)) {
        continue;
      }
      seenPaths.add(filePath);
      
      try {
        const content = await fs.readFile(filePath, 'utf8');
        files.push({ path: filePath, content });
      } catch {
        // File not readable, skip
      }
    }
    
    return files;
  }
  
  /**
   * Analyze common error patterns
   * 
   * For frequent errors like:
   * - "Cannot read properties of null (reading 'useContext')"
   * - "Module not found"
   * - "Failed to fetch"
   */
  async analyzeCommonPattern(errorMessage: string): Promise<string[]> {
    const suggestions: string[] = [];
    
    // React context errors
    if (errorMessage.includes('useContext') || errorMessage.includes('createContext')) {
      suggestions.push('Add "use client" directive to component file');
      suggestions.push('Check if context provider is wrapping the component');
      suggestions.push('Verify Next.js 13+ App Router compatibility');
    }
    
    // Module not found
    if (errorMessage.includes('Module not found') || errorMessage.includes('Cannot find module')) {
      suggestions.push('Run pnpm install to install dependencies');
      suggestions.push('Check if import path is correct');
      suggestions.push('Verify package is listed in package.json');
    }
    
    // Fetch errors
    if (errorMessage.includes('Failed to fetch') || errorMessage.includes('ECONNREFUSED')) {
      suggestions.push('Check if backend server is running');
      suggestions.push('Verify API endpoint URL is correct');
      suggestions.push('Check CORS configuration');
    }
    
    // Type errors
    if (errorMessage.includes('Type') && errorMessage.includes('not assignable')) {
      suggestions.push('Run pnpm typecheck to see all type errors');
      suggestions.push('Update TypeScript types');
      suggestions.push('Add type annotations');
    }
    
    return suggestions;
  }
  
  /**
   * Generate Autopilot handoff package
   * 
   * Formats diagnosis for ODAVL Autopilot consumption.
   * Autopilot will execute the fix using its O-D-A-V-L cycle.
   */
  generateAutopilotHandoff(diagnosis: ErrorDiagnosis) {
    return {
      source: 'odavl-guardian',
      timestamp: new Date().toISOString(),
      issue: {
        type: 'runtime-error',
        rootCause: diagnosis.rootCause,
        isPlatformSpecific: diagnosis.isPlatformSpecific,
        affectedFiles: diagnosis.affectedFiles,
        confidence: diagnosis.confidence
      },
      suggestedFix: diagnosis.suggestedFix,
      reasoning: diagnosis.reasoning,
      nextSteps: [
        '1. Review suggested fix',
        '2. Run: odavl autopilot run',
        '3. Autopilot will safely apply fixes with O-D-A-V-L cycle',
        '4. Verify with test plan'
      ]
    };
  }
}

/**
 * Example Usage:
 * 
 * const analyzer = new SmartErrorAnalyzer();
 * 
 * // Analyze error
 * const diagnosis = await analyzer.analyzeRuntimeError(
 *   new Error('Cannot read properties of null'),
 *   {
 *     platform: 'extension',
 *     os: 'Windows',
 *     when: 'opening dashboard',
 *     expected: 'dashboard opens',
 *     actual: 'crash with context error',
 *     stackTrace: error.stack
 *   }
 * );
 * 
 * // Hand off to Autopilot (Guardian does NOT execute fixes)
 * const handoff = analyzer.generateAutopilotHandoff(diagnosis);
 * console.log('Fix suggestions ready for Autopilot:');
 * console.log(JSON.stringify(handoff, null, 2));
 * 
 * // Save for Autopilot to consume
 * await fs.writeFile(
 *   '.odavl/guardian/handoff-to-autopilot.json',
 *   JSON.stringify(handoff, null, 2)
 * );
 */

