// Hybrid Detection System
// Combines rule-based + AI models for maximum accuracy

export class HybridDetector {
  constructor(
    private ruleEngine: RuleEngine,
    private gpt4: GPT4Detector,
    private semantic: SemanticAnalyzer
  ) {}
  
  async detect(code: string, context: CodeContext): Promise<DetectionResult> {
    // Layer 1: Fast rule-based detection (50-100ms)
    const ruleIssues = await this.ruleEngine.analyze(code, context);
    
    // Layer 2: Semantic similarity (200-300ms)
    const embedding = await this.semantic.embedCode(code);
    const similarIssues = await this.semantic.findSimilarIssues(
      embedding, 
      this.knownIssueDatabase
    );
    
    // Layer 3: GPT-4 deep analysis (1-2s) - only if needed
    let aiIssues: Issue[] = [];
    if (this.shouldUseGPT4(ruleIssues, similarIssues)) {
      aiIssues = await this.gpt4.analyzeCode(code, context);
    }
    
    // Merge and deduplicate
    const allIssues = this.mergeIssues(ruleIssues, similarIssues, aiIssues);
    
    return {
      issues: allIssues,
      performance: {
        ruleTime: this.ruleEngine.lastExecutionTime,
        semanticTime: this.semantic.lastExecutionTime,
        aiTime: aiIssues.length > 0 ? this.gpt4.lastExecutionTime : 0,
        totalTime: Date.now() - startTime
      },
      confidence: this.calculateConfidence(allIssues)
    };
  }
  
  private shouldUseGPT4(
    ruleIssues: Issue[], 
    similarIssues: SimilarIssue[]
  ): boolean {
    // Use GPT-4 if:
    // 1. High severity issues found
    // 2. Low confidence from rules
    // 3. No similar issues in database
    
    const hasCritical = ruleIssues.some(i => i.severity === 'critical');
    const lowConfidence = ruleIssues.some(i => i.confidence < 0.7);
    const noSimilar = similarIssues.length === 0;
    
    return hasCritical || lowConfidence || noSimilar;
  }
  
  private mergeIssues(
    rule: Issue[], 
    similar: SimilarIssue[], 
    ai: Issue[]
  ): Issue[] {
    // Deduplicate and merge issues from all sources
    const merged = new Map<string, Issue>();
    
    // Add rule-based (highest priority)
    rule.forEach(i => merged.set(this.issueKey(i), i));
    
    // Add similar (if confidence high)
    similar.forEach(s => {
      if (s.similarity > 0.9) {
        const key = this.issueKey(s.issue);
        if (!merged.has(key)) {
          merged.set(key, this.convertToIssue(s.issue));
        }
      }
    });
    
    // Add AI (fill gaps)
    ai.forEach(i => {
      const key = this.issueKey(i);
      if (!merged.has(key)) {
        merged.set(key, { ...i, source: 'gpt-4' });
      }
    });
    
    return Array.from(merged.values())
      .sort((a, b) => this.severityScore(b) - this.severityScore(a));
  }
}

interface DetectionResult {
  issues: Issue[];
  performance: PerformanceMetrics;
  confidence: number;
}

interface PerformanceMetrics {
  ruleTime: number;
  semanticTime: number;
  aiTime: number;
  totalTime: number;
}
