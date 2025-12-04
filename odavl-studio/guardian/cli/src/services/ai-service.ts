/**
 * AI Service with Fallback Mechanism
 * 
 * This service provides AI-powered analysis with automatic fallback to rule-based
 * analysis when AI is unavailable or fails. This ensures Guardian works even without
 * API keys or network connectivity.
 */

import Anthropic from '@anthropic-ai/sdk';
import chalk from 'chalk';

export interface AIAnalysisResult {
  success: boolean;
  usedAI: boolean;
  analysis: string;
  suggestions: string[];
  confidence: number;
  fallbackReason?: string;
}

export interface ScreenshotAnalysisResult extends AIAnalysisResult {
  issues: Array<{
    severity: 'critical' | 'warning' | 'info';
    category: string;
    description: string;
    location?: string;
  }>;
}

export interface ErrorLogAnalysisResult extends AIAnalysisResult {
  errors: Array<{
    type: string;
    message: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    stackTrace?: string;
    suggestion?: string;
  }>;
}

/**
 * AI Service with intelligent fallback
 */
export class AIService {
  private anthropic: Anthropic | null = null;
  private aiAvailable: boolean = false;
  private fallbackMode: boolean = false;

  constructor() {
    this.initializeAI();
  }

  /**
   * Initialize AI client with error handling
   */
  private initializeAI(): void {
    try {
      const apiKey = process.env.ANTHROPIC_API_KEY;
      
      if (!apiKey) {
        console.log(chalk.yellow('⚠️  No ANTHROPIC_API_KEY found - using fallback mode'));
        this.fallbackMode = true;
        return;
      }

      this.anthropic = new Anthropic({ apiKey });
      this.aiAvailable = true;
      console.log(chalk.green('✅ AI service initialized'));
    } catch (error) {
      console.log(chalk.yellow('⚠️  AI initialization failed - using fallback mode'));
      this.fallbackMode = true;
    }
  }

  /**
   * Analyze screenshot with AI (or fallback to rule-based)
   */
  async analyzeScreenshot(
    screenshotBase64: string,
    context?: string
  ): Promise<ScreenshotAnalysisResult> {
    if (this.aiAvailable && this.anthropic) {
      try {
        return await this.analyzeScreenshotWithAI(screenshotBase64, context);
      } catch (error) {
        console.log(chalk.yellow('⚠️  AI analysis failed, falling back to rule-based'));
        return this.analyzeScreenshotFallback(screenshotBase64, context);
      }
    }

    return this.analyzeScreenshotFallback(screenshotBase64, context);
  }

  /**
   * AI-powered screenshot analysis
   */
  private async analyzeScreenshotWithAI(
    screenshotBase64: string,
    context?: string
  ): Promise<ScreenshotAnalysisResult> {
    const message = await this.anthropic!.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: 'image/png',
                data: screenshotBase64,
              },
            },
            {
              type: 'text',
              text: `Analyze this screenshot for visual issues, layout problems, and user experience concerns. ${context ? `Context: ${context}` : ''}

Return a JSON object with:
- issues: array of { severity: 'critical'|'warning'|'info', category: string, description: string, location?: string }
- suggestions: array of improvement suggestions
- confidence: number 0-100`,
            },
          ],
        },
      ],
    });

    const content = message.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type');
    }

    // Extract JSON from response
    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    const parsed = JSON.parse(jsonMatch[0]);

    return {
      success: true,
      usedAI: true,
      analysis: content.text,
      suggestions: parsed.suggestions || [],
      confidence: parsed.confidence || 85,
      issues: parsed.issues || [],
    };
  }

  /**
   * Rule-based screenshot analysis (fallback)
   */
  private analyzeScreenshotFallback(
    screenshotBase64: string,
    context?: string
  ): ScreenshotAnalysisResult {
    // Basic rule-based analysis
    const issues: ScreenshotAnalysisResult['issues'] = [];
    const suggestions: string[] = [];

    // Decode base64 to get image info
    const buffer = Buffer.from(screenshotBase64, 'base64');
    const size = buffer.length;

    // Check image size (rule-based heuristics)
    if (size < 1000) {
      issues.push({
        severity: 'warning',
        category: 'Image Quality',
        description: 'Screenshot appears to be very small or empty',
      });
      suggestions.push('Verify the screenshot capture is working correctly');
    }

    if (size > 5 * 1024 * 1024) {
      issues.push({
        severity: 'info',
        category: 'Performance',
        description: 'Screenshot file size is large (>5MB)',
      });
      suggestions.push('Consider optimizing image compression');
    }

    // Generic suggestions based on context
    if (context?.toLowerCase().includes('homepage')) {
      suggestions.push('Verify all hero images load correctly');
      suggestions.push('Check mobile responsiveness');
      suggestions.push('Ensure call-to-action buttons are visible');
    }

    if (context?.toLowerCase().includes('dashboard')) {
      suggestions.push('Verify data tables are readable');
      suggestions.push('Check chart rendering');
      suggestions.push('Ensure navigation is accessible');
    }

    return {
      success: true,
      usedAI: false,
      analysis: 'Rule-based analysis completed (AI not available)',
      suggestions,
      confidence: 60,
      issues,
      fallbackReason: this.fallbackMode ? 'No API key configured' : 'AI service unavailable',
    };
  }

  /**
   * Analyze error logs with AI (or fallback to parsing)
   */
  async analyzeErrorLogs(
    logs: string,
    context?: string
  ): Promise<ErrorLogAnalysisResult> {
    if (this.aiAvailable && this.anthropic) {
      try {
        return await this.analyzeErrorLogsWithAI(logs, context);
      } catch (error) {
        console.log(chalk.yellow('⚠️  AI analysis failed, falling back to log parsing'));
        return this.analyzeErrorLogsFallback(logs, context);
      }
    }

    return this.analyzeErrorLogsFallback(logs, context);
  }

  /**
   * AI-powered error log analysis
   */
  private async analyzeErrorLogsWithAI(
    logs: string,
    context?: string
  ): Promise<ErrorLogAnalysisResult> {
    const message = await this.anthropic!.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: `Analyze these error logs and provide actionable insights. ${context ? `Context: ${context}` : ''}

Logs:
\`\`\`
${logs.slice(0, 4000)} 
\`\`\`

Return a JSON object with:
- errors: array of { type: string, message: string, severity: 'critical'|'high'|'medium'|'low', suggestion?: string }
- suggestions: array of fix suggestions
- confidence: number 0-100`,
        },
      ],
    });

    const content = message.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type');
    }

    // Extract JSON from response
    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    const parsed = JSON.parse(jsonMatch[0]);

    return {
      success: true,
      usedAI: true,
      analysis: content.text,
      suggestions: parsed.suggestions || [],
      confidence: parsed.confidence || 80,
      errors: parsed.errors || [],
    };
  }

  /**
   * Parse-based error log analysis (fallback)
   */
  private analyzeErrorLogsFallback(
    logs: string,
    context?: string
  ): ErrorLogAnalysisResult {
    const errors: ErrorLogAnalysisResult['errors'] = [];
    const suggestions: string[] = [];

    // Parse common error patterns
    const lines = logs.split('\n');
    const errorPatterns = [
      { pattern: /error/i, type: 'Error', severity: 'high' as const },
      { pattern: /exception/i, type: 'Exception', severity: 'high' as const },
      { pattern: /fail(ed|ure)/i, type: 'Failure', severity: 'medium' as const },
      { pattern: /warn(ing)?/i, type: 'Warning', severity: 'low' as const },
      { pattern: /timeout/i, type: 'Timeout', severity: 'medium' as const },
      { pattern: /cannot|unable/i, type: 'Operation Failed', severity: 'medium' as const },
    ];

    lines.forEach((line, index) => {
      for (const { pattern, type, severity } of errorPatterns) {
        if (pattern.test(line)) {
          errors.push({
            type,
            message: line.trim(),
            severity: severity === 'high' && line.toLowerCase().includes('critical') ? 'critical' : severity,
            stackTrace: lines.slice(Math.max(0, index), Math.min(lines.length, index + 5)).join('\n'),
          });
          break;
        }
      }
    });

    // Generic suggestions based on error types
    const errorTypes = new Set(errors.map((e) => e.type));
    
    if (errorTypes.has('Timeout')) {
      suggestions.push('Increase timeout values in configuration');
      suggestions.push('Check network connectivity');
    }

    if (errorTypes.has('Exception') || errorTypes.has('Error')) {
      suggestions.push('Review error stack traces for root cause');
      suggestions.push('Add error handling and recovery logic');
    }

    if (errors.length > 10) {
      suggestions.push('High error count detected - consider full system review');
    }

    return {
      success: true,
      usedAI: false,
      analysis: `Parsed ${errors.length} issues from logs (AI not available)`,
      suggestions,
      confidence: 70,
      errors,
      fallbackReason: this.fallbackMode ? 'No API key configured' : 'AI service unavailable',
    };
  }

  /**
   * Check if AI is available
   */
  isAIAvailable(): boolean {
    return this.aiAvailable;
  }

  /**
   * Get service status
   */
  getStatus(): { available: boolean; mode: 'ai' | 'fallback'; reason?: string } {
    return {
      available: true, // Service is always available (with fallback)
      mode: this.aiAvailable ? 'ai' : 'fallback',
      reason: this.fallbackMode ? 'No API key or initialization failed' : undefined,
    };
  }
}

// Singleton instance
let aiServiceInstance: AIService | null = null;

/**
 * Get AI service instance (singleton)
 */
export function getAIService(): AIService {
  if (!aiServiceInstance) {
    aiServiceInstance = new AIService();
  }
  return aiServiceInstance;
}
