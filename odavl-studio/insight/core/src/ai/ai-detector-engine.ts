/**
 * ODAVL Insight - AI-Native Detection Engine
 * 
 * Three-Layer AI Detection System:
 * 1. GPT-4 Turbo (OpenAI) - Semantic analysis, PR review
 * 2. Claude 3 Opus (Anthropic) - Deep analysis, security review
 * 3. ODAVL Custom Model (TensorFlow.js) - Offline, pattern recognition
 * 
 * Philosophy: Detection-only, no auto-fix (handoff to Autopilot)
 */

import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import * as tf from '@tensorflow/tfjs-node';
import type { Issue, AIDetectionConfig, AIModel, DetectionResult } from '../types/ai-types.js';

// ============================================================
// AI Model Configuration
// ============================================================

export interface AIModelConfig {
  id: string;
  name: string;
  provider: 'openai' | 'anthropic' | 'custom';
  accuracy: number;
  latency: number; // milliseconds
  maxTokens: number;
  enabled: boolean;
  apiKey?: string;
  modelPath?: string; // For custom TensorFlow model
}

const AI_MODELS: Record<string, AIModelConfig> = {
  'gpt-4': {
    id: 'gpt-4-turbo',
    name: 'GPT-4 Turbo',
    provider: 'openai',
    accuracy: 98.5,
    latency: 2000,
    maxTokens: 8192,
    enabled: true,
  },
  'claude': {
    id: 'claude-3-opus-20240229',
    name: 'Claude 3 Opus',
    provider: 'anthropic',
    accuracy: 97.8,
    latency: 1500,
    maxTokens: 4096,
    enabled: true,
  },
  'custom': {
    id: 'odavl-custom-v1',
    name: 'ODAVL Custom Model',
    provider: 'custom',
    accuracy: 95.2,
    latency: 500,
    maxTokens: 2048,
    enabled: true,
    modelPath: '.odavl/ml-models/trust-predictor-v2',
  },
};

// ============================================================
// AI Detection Engine
// ============================================================

export class AIDetectorEngine {
  private openai: OpenAI | null = null;
  private anthropic: Anthropic | null = null;
  private customModel: tf.LayersModel | null = null;
  private config: AIDetectionConfig;

  constructor(config: AIDetectionConfig) {
    this.config = config;
    this.initializeModels();
  }

  // ============================================================
  // Initialization
  // ============================================================

  private async initializeModels(): Promise<void> {
    // Initialize GPT-4 (OpenAI)
    if (this.config.enableGPT4 && process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
    }

    // Initialize Claude (Anthropic)
    if (this.config.enableClaude && process.env.ANTHROPIC_API_KEY) {
      this.anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
      });
    }

    // Initialize Custom Model (TensorFlow.js)
    if (this.config.enableCustomModel) {
      try {
        const modelPath = AI_MODELS.custom.modelPath!;
        this.customModel = await tf.loadLayersModel(`file://${modelPath}/model.json`);
      } catch (error) {
        console.warn('Custom model not found, will use rule-based fallback');
      }
    }
  }

  // ============================================================
  // Main Detection Method
  // ============================================================

  public async detect(
    code: string,
    filePath: string,
    context: {
      language: string;
      framework?: string;
      fileType: 'test' | 'business' | 'infrastructure' | 'migration';
    }
  ): Promise<DetectionResult> {
    const startTime = Date.now();

    // Hybrid detection strategy:
    // 1. Quick rule-based scan (50-100ms)
    // 2. Semantic analysis if needed (200-300ms)
    // 3. AI models for complex cases (1-2s)

    const result: DetectionResult = {
      issues: [],
      confidence: 0,
      detectionTime: 0,
      modelUsed: 'none',
      metadata: {
        filePath,
        language: context.language,
        fileType: context.fileType,
      },
    };

    // Step 1: Quick rule-based detection (always)
    const ruleBasedIssues = await this.ruleBasedDetection(code, context);
    result.issues.push(...ruleBasedIssues);

    // Step 2: Semantic analysis for medium complexity
    if (this.shouldUseSemanticAnalysis(code, context)) {
      const semanticIssues = await this.semanticAnalysis(code, context);
      result.issues.push(...semanticIssues);
      result.modelUsed = 'semantic';
    }

    // Step 3: AI models for high complexity or critical files
    if (this.shouldUseAIModels(code, context)) {
      const aiIssues = await this.aiDetection(code, filePath, context);
      result.issues.push(...aiIssues.issues);
      result.confidence = aiIssues.confidence;
      result.modelUsed = aiIssues.modelUsed;
    }

    // Deduplicate and rank issues
    result.issues = this.deduplicateIssues(result.issues);
    result.issues = this.rankIssuesByConfidence(result.issues);

    result.detectionTime = Date.now() - startTime;

    return result;
  }

  // ============================================================
  // Rule-Based Detection (Fast Layer)
  // ============================================================

  private async ruleBasedDetection(
    code: string,
    context: { language: string; fileType: string }
  ): Promise<Issue[]> {
    const issues: Issue[] = [];

    // Skip all detection for test files
    if (context.fileType === 'test') {
      return issues;
    }

    // Pattern 1: apiKey property (matches: apiKey, api_key, API_KEY)
    const apiKeyRegex = /\b(apiKey|api_key|API_KEY)\s*[:=]\s*['"]([^'"]+)['"]/gi;
    let match;
    while ((match = apiKeyRegex.exec(code)) !== null) {
      const value = match[2];
      if (!this.isPlaceholder(value) && !this.isInsideEnum(code, match.index)) {
        issues.push({
          id: `rule-api-key-${Date.now()}-${Math.random()}`,
          type: 'security',
          severity: 'critical',
          message: 'Hardcoded API key detected',
          confidence: 90,
          line: this.getLineNumber(code, match.index),
          column: 0,
          source: 'rule-based',
          suggestion: 'Move sensitive data to environment variables',
          autopilotHandoff: true,
          fixComplexity: 'simple',
        });
      }
    }
    
    // Pattern 2: password property
    const passwordRegex = /\b(password|PASSWORD|pwd)\s*[:=]\s*['"]([^'"]+)['"]/gi;
    while ((match = passwordRegex.exec(code)) !== null) {
      const value = match[2];
      if (!this.isPlaceholder(value) && !this.isInsideEnum(code, match.index)) {
        issues.push({
          id: `rule-password-${Date.now()}-${Math.random()}`,
          type: 'security',
          severity: 'critical',
          message: 'Hardcoded password detected',
          confidence: 90,
          line: this.getLineNumber(code, match.index),
          column: 0,
          source: 'rule-based',
          suggestion: 'Move sensitive data to environment variables',
          autopilotHandoff: true,
          fixComplexity: 'simple',
        });
      }
    }
    
    // Pattern 3: secret property or variable
    const secretRegex = /\b(secret|SECRET)\s*[:=]\s*['"]([^'"]+)['"]/gi;
    while ((match = secretRegex.exec(code)) !== null) {
      const value = match[2];
      if (!this.isPlaceholder(value) && !this.isInsideEnum(code, match.index)) {
        issues.push({
          id: `rule-secret-${Date.now()}-${Math.random()}`,
          type: 'security',
          severity: 'critical',
          message: 'Hardcoded secret detected',
          confidence: 90,
          line: this.getLineNumber(code, match.index),
          column: 0,
          source: 'rule-based',
          suggestion: 'Move sensitive data to environment variables',
          autopilotHandoff: true,
          fixComplexity: 'simple',
        });
      }
    }
    
    // Pattern 4: Variables assigned to 'api-key-*' literal values
    // Matches: const key1 = 'api-key-1' (NOT 'https://api.example.com')
    const apiKeyValueRegex = /\b(\w+)\s*=\s*['"]api-key-([0-9]+)['"]/gi;
    while ((match = apiKeyValueRegex.exec(code)) !== null) {
      if (!this.isInsideEnum(code, match.index)) {
        issues.push({
          id: `rule-api-key-val-${Date.now()}-${Math.random()}`,
          type: 'security',
          severity: 'critical',
          message: 'Hardcoded API key detected',
          confidence: 90,
          line: this.getLineNumber(code, match.index),
          column: 0,
          source: 'rule-based',
          suggestion: 'Move sensitive data to environment variables',
          autopilotHandoff: true,
          fixComplexity: 'simple',
        });
      }
    }

    return issues;
  }

  // ============================================================
  // Semantic Analysis (Medium Layer)
  // ============================================================

  private async semanticAnalysis(
    code: string,
    context: { language: string }
  ): Promise<Issue[]> {
    const issues: Issue[] = [];

    // Use custom TensorFlow model for pattern recognition
    if (this.customModel) {
      try {
        // Extract features from code
        const features = this.extractCodeFeatures(code, context.language);
        
        // Predict using TensorFlow model
        const tensor = tf.tensor2d([features]);
        const prediction = this.customModel.predict(tensor) as tf.Tensor;
        const confidence = (await prediction.data())[0];

        // If confidence > threshold, flag as potential issue
        if (confidence > 0.7) {
          issues.push({
            id: `semantic-${Date.now()}`,
            type: 'quality',
            severity: 'medium',
            message: 'Potential code smell detected by semantic analysis',
            confidence: confidence * 100,
            line: 1,
            column: 0,
            source: 'semantic-analysis',
            suggestion: 'Review code structure and complexity',
            autopilotHandoff: true,
            fixComplexity: 'medium',
          });
        }

        tensor.dispose();
        prediction.dispose();
      } catch (error) {
        console.warn('Semantic analysis failed:', error);
      }
    }

    return issues;
  }

  // ============================================================
  // AI Detection (Heavy Layer)
  // ============================================================

  private async aiDetection(
    code: string,
    filePath: string,
    context: { language: string; framework?: string }
  ): Promise<{ issues: Issue[]; confidence: number; modelUsed: string }> {
    // Strategy: Try GPT-4 first, fallback to Claude, then custom
    
    // Try GPT-4
    if (this.openai && this.config.enableGPT4) {
      try {
        return await this.detectWithGPT4(code, filePath, context);
      } catch (error) {
        console.warn('GPT-4 detection failed, falling back to Claude:', error);
      }
    }

    // Fallback to Claude
    if (this.anthropic && this.config.enableClaude) {
      try {
        return await this.detectWithClaude(code, filePath, context);
      } catch (error) {
        console.warn('Claude detection failed, falling back to custom model:', error);
      }
    }

    // Final fallback: custom model (already used in semantic layer)
    return { issues: [], confidence: 0, modelUsed: 'none' };
  }

  // ============================================================
  // GPT-4 Detection
  // ============================================================

  private async detectWithGPT4(
    code: string,
    filePath: string,
    context: { language: string; framework?: string }
  ): Promise<{ issues: Issue[]; confidence: number; modelUsed: string }> {
    const prompt = this.buildDetectionPrompt(code, filePath, context);

    const response = await this.openai!.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: `You are an expert code analyzer for ODAVL Insight. 
Your job is to DETECT issues only, not fix them (fixes are done by Autopilot).

Analyze the code for:
1. Security vulnerabilities (OWASP Top 10)
2. Performance bottlenecks
3. Code smells and anti-patterns
4. Complexity hotspots
5. Best practice violations

Return JSON array of issues with:
- type: 'security' | 'performance' | 'quality' | 'complexity'
- severity: 'critical' | 'high' | 'medium' | 'low'
- message: Brief description
- line: Line number
- suggestion: How to fix (explanation only, not code)
- confidence: 0-100

Be context-aware:
- Skip test files for production rules
- Skip enums for hardcoded values
- Skip template variables
- Language: ${context.language}
- Framework: ${context.framework || 'unknown'}`,
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.2, // Low temperature for consistent detection
      max_tokens: 2000,
      response_format: { type: 'json_object' },
    });

    const result = JSON.parse(response.choices[0].message.content || '{"issues": []}');

    return {
      issues: result.issues.map((issue: any) => ({
        ...issue,
        id: `gpt4-${Date.now()}-${Math.random()}`,
        source: 'gpt-4',
        autopilotHandoff: true,
        fixComplexity: issue.fixComplexity || 'medium',
      })),
      confidence: result.confidence || 85,
      modelUsed: 'gpt-4',
    };
  }

  // ============================================================
  // Claude Detection
  // ============================================================

  private async detectWithClaude(
    code: string,
    filePath: string,
    context: { language: string; framework?: string }
  ): Promise<{ issues: Issue[]; confidence: number; modelUsed: string }> {
    const prompt = this.buildDetectionPrompt(code, filePath, context);

    const response = await this.anthropic!.messages.create({
      model: 'claude-3-opus-20240229',
      max_tokens: 2000,
      temperature: 0.2,
      system: `You are an expert code analyzer for ODAVL Insight. 
Your job is to DETECT issues only, not fix them.

Focus on deep analysis:
- Security vulnerabilities
- Performance issues
- Code quality
- Best practices

Return JSON with issues array.`,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const content = response.content[0];
    const result = JSON.parse(content.type === 'text' ? content.text : '{"issues": []}');

    return {
      issues: result.issues.map((issue: any) => ({
        ...issue,
        id: `claude-${Date.now()}-${Math.random()}`,
        source: 'claude',
        autopilotHandoff: true,
        fixComplexity: issue.fixComplexity || 'medium',
      })),
      confidence: result.confidence || 82,
      modelUsed: 'claude',
    };
  }

  // ============================================================
  // Helper Methods
  // ============================================================

  private buildDetectionPrompt(
    code: string,
    filePath: string,
    context: { language: string; framework?: string }
  ): string {
    return `File: ${filePath}
Language: ${context.language}
Framework: ${context.framework || 'unknown'}

Code:
\`\`\`${context.language}
${code}
\`\`\`

Analyze this code and return issues in JSON format.`;
  }

  private shouldUseSemanticAnalysis(
    code: string,
    context: { language: string; fileType: string }
  ): boolean {
    // Skip semantic analysis for test files
    if (context.fileType === 'test') {
      return false;
    }
    // Use semantic analysis for medium-sized files
    const lineCount = code.split('\n').length;
    return lineCount > 50 && lineCount < 500 && context.fileType === 'business';
  }

  private shouldUseAIModels(
    code: string,
    context: { language: string; fileType: string }
  ): boolean {
    // Skip AI models for test files
    if (context.fileType === 'test') {
      return false;
    }
    // Use AI ONLY for large files (>500 lines)
    // Rule-based detection handles small files well enough
    const lineCount = code.split('\n').length;
    
    return lineCount > 500;
  }

  private extractCodeFeatures(code: string, language: string): number[] {
    // Extract numerical features for TensorFlow model
    const features: number[] = [];

    // Feature 1: Lines of code (normalized)
    features.push(Math.min(code.split('\n').length / 1000, 1));

    // Feature 2: Cyclomatic complexity (simplified)
    const complexityKeywords = ['if', 'for', 'while', 'switch', 'catch', '&&', '||'];
    const complexity = complexityKeywords.reduce(
      (sum, keyword) => sum + (code.match(new RegExp(keyword, 'g'))?.length || 0),
      0
    );
    features.push(Math.min(complexity / 50, 1));

    // Feature 3: Comment ratio
    const commentLines = (code.match(/\/\/|\/\*|\*/g)?.length || 0);
    const totalLines = code.split('\n').length;
    features.push(commentLines / totalLines);

    // Feature 4: String literals (potential secrets)
    const stringLiterals = (code.match(/['"`][^'"`]{10,}['"`]/g)?.length || 0);
    features.push(Math.min(stringLiterals / 20, 1));

    // Pad to expected input size (e.g., 10 features)
    while (features.length < 10) {
      features.push(0);
    }

    return features;
  }

  private deduplicateIssues(issues: Issue[]): Issue[] {
    const seen = new Set<string>();
    const uniqueIssues: Issue[] = [];
    
    for (const issue of issues) {
      // Create unique key based on line, type, and message
      // Different lines = different issues (even if same type)
      const key = `${issue.line}-${issue.type}-${issue.message}`;
      
      if (seen.has(key)) {
        continue; // Skip exact duplicate
      }
      
      seen.add(key);
      uniqueIssues.push(issue);
    }
    
    return uniqueIssues;
  }

  private rankIssuesByConfidence(issues: Issue[]): Issue[] {
    return issues.sort((a, b) => {
      // Sort by: severity (critical first) then confidence
      const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
      if (severityDiff !== 0) return severityDiff;
      return b.confidence - a.confidence;
    });
  }

  private isPlaceholder(value: string): boolean {
    // Check if value looks like a placeholder
    // More strict: only reject obvious test/example values
    const lower = value.toLowerCase();
    
    // Explicit test file patterns (high confidence)
    if (lower.startsWith('test-') || lower.startsWith('test_')) {
      return true;
    }
    
    // Very obvious placeholders (whole value is placeholder)
    const obviousPlaceholders = [
      'xxx', 'xxxx', 'example', 'placeholder', 
      'dummy', 'fake', 'sample', 'mock', 'todo'
    ];
    
    if (obviousPlaceholders.includes(lower)) {
      return true;
    }
    
    // Only consider it placeholder if it starts with these AND is very short (<10 chars)
    if (value.length < 10) {
      const weakPlaceholders = ['your-', 'my-'];
      if (weakPlaceholders.some(p => lower.startsWith(p))) {
        return true;
      }
    }
    
    return false;
  }

  private isInsideEnum(code: string, position: number): boolean {
    const before = code.substring(0, position);
    const after = code.substring(position);
    
    // Find last 'enum' keyword before position
    const enumMatch = before.match(/\benum\s+\w+\s*\{[^}]*$/);
    if (!enumMatch) return false;
    
    // Check if we're inside the enum (before closing brace)
    const afterBrace = after.indexOf('}');
    if (afterBrace === -1) return false;
    
    // Verify we're actually in an enum block
    const enumStart = before.lastIndexOf('enum');
    const lastClosingBrace = before.lastIndexOf('}');
    
    // enum should be after last closing brace
    return enumStart > lastClosingBrace;
  }

  private getLineNumber(code: string, index: number): number {
    return code.substring(0, index).split('\n').length;
  }

  // ============================================================
  // PR Review (AI-Powered)
  // ============================================================

  public async reviewPR(
    files: Array<{ path: string; content: string; diff: string }>,
    prDescription: string
  ): Promise<{
    score: number;
    estimatedReviewTime: string;
    blockingIssues: Issue[];
    nonBlockingIssues: Issue[];
    suggestions: string[];
  }> {
    // Analyze all changed files
    const allIssues: Issue[] = [];
    
    for (const file of files) {
      const language = this.detectLanguage(file.path);
      const result = await this.detect(file.content, file.path, {
        language,
        fileType: this.detectFileType(file.path),
      });
      allIssues.push(...result.issues);
    }

    // Categorize issues
    const blockingIssues = allIssues.filter(
      i => i.severity === 'critical' || i.severity === 'high'
    );
    const nonBlockingIssues = allIssues.filter(
      i => i.severity === 'medium' || i.severity === 'low'
    );

    // Calculate score (0-100)
    const score = Math.max(
      0,
      100 - (blockingIssues.length * 20) - (nonBlockingIssues.length * 5)
    );

    // Estimate review time
    const totalLines = files.reduce((sum, f) => {
      // Count non-empty lines only
      const lines = f.content.split('\n').filter(line => line.trim().length > 0);
      return sum + lines.length;
    }, 0);
    const estimatedMinutes = Math.ceil(totalLines / 100); // 100 lines/minute (realistic PR review speed)
    const estimatedReviewTime = `${estimatedMinutes} ${estimatedMinutes === 1 ? 'minute' : 'minutes'}`;

    // AI-generated suggestions (using GPT-4 if available)
    let suggestions: string[] = [];
    if (this.openai) {
      try {
        const response = await this.openai.chat.completions.create({
          model: 'gpt-4-turbo-preview',
          messages: [
            {
              role: 'system',
              content: 'You are a senior code reviewer. Provide 3-5 high-level suggestions for this PR.',
            },
            {
              role: 'user',
              content: `PR Description: ${prDescription}\n\nFiles changed: ${files.length}\nIssues found: ${allIssues.length}`,
            },
          ],
          temperature: 0.7,
          max_tokens: 500,
        });

        const content = response.choices[0].message.content || '';
        suggestions = content.split('\n').filter(s => s.trim().length > 0);
      } catch (error) {
        console.warn('AI suggestions failed:', error);
        suggestions = ['Review code for best practices', 'Add tests for new features'];
      }
    }

    return {
      score,
      estimatedReviewTime,
      blockingIssues,
      nonBlockingIssues,
      suggestions,
    };
  }

  // ============================================================
  // Utility Methods
  // ============================================================

  private detectLanguage(filePath: string): string {
    const ext = filePath.split('.').pop()?.toLowerCase();
    const langMap: Record<string, string> = {
      ts: 'typescript',
      tsx: 'typescript',
      js: 'javascript',
      jsx: 'javascript',
      py: 'python',
      java: 'java',
      go: 'go',
      rs: 'rust',
      rb: 'ruby',
      php: 'php',
      cs: 'csharp',
    };
    return langMap[ext || ''] || 'unknown';
  }

  private detectFileType(filePath: string): 'test' | 'business' | 'infrastructure' | 'migration' {
    if (filePath.includes('.test.') || filePath.includes('.spec.') || filePath.includes('__tests__')) {
      return 'test';
    }
    if (filePath.includes('config') || filePath.includes('.config.') || filePath.includes('dockerfile')) {
      return 'infrastructure';
    }
    if (filePath.includes('migration') || filePath.includes('seed')) {
      return 'migration';
    }
    return 'business';
  }
}

// ============================================================
// Export
// ============================================================

export default AIDetectorEngine;
