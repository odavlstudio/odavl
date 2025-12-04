// Semantic Code Analyzer
import { HfInference } from '@huggingface/inference';

export class SemanticAnalyzer {
  private hf: HfInference;
  
  constructor(apiKey: string) {
    this.hf = new HfInference(apiKey);
  }
  
  async embedCode(code: string): Promise<number[]> {
    const embedding = await this.hf.featureExtraction({
      model: 'microsoft/codebert-base',
      inputs: code
    });
    
    return embedding as number[];
  }
  
  async findSimilarIssues(
    codeEmbedding: number[], 
    knownIssues: KnownIssue[]
  ): Promise<SimilarIssue[]> {
    const similarities = knownIssues.map(issue => ({
      issue,
      similarity: cosineSimilarity(codeEmbedding, issue.embedding)
    }));
    
    return similarities
      .filter(s => s.similarity > 0.85)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 10);
  }
  
  async detectPatterns(code: string): Promise<Pattern[]> {
    // Use transformer model to detect code patterns
    const analysis = await this.hf.textClassification({
      model: 'huggingface/CodeBERTa-small-v1',
      inputs: code
    });
    
    return analysis.map(a => ({
      pattern: a.label,
      confidence: a.score,
      type: categorizePattern(a.label)
    }));
  }
}

interface KnownIssue {
  id: string;
  description: string;
  embedding: number[];
  severity: string;
}

interface SimilarIssue {
  issue: KnownIssue;
  similarity: number;
}

interface Pattern {
  pattern: string;
  confidence: number;
  type: 'design' | 'security' | 'performance';
}

function cosineSimilarity(a: number[], b: number[]): number {
  const dot = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const magA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const magB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  return dot / (magA * magB);
}
