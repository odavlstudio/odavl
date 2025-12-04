// GPT-4 Semantic Detector
import OpenAI from 'openai';

export class GPT4Detector {
  private openai: OpenAI;
  
  constructor(apiKey: string) {
    this.openai = new OpenAI({ apiKey });
  }
  
  async analyzeCode(code: string, context: CodeContext): Promise<Issue[]> {
    const prompt = `
Analyze this code for issues. Focus on:
- Security vulnerabilities (OWASP Top 10)
- Performance bottlenecks
- Code smells and anti-patterns
- Best practice violations

Context: ${JSON.stringify(context)}

Code:
```
${code}
```

Return JSON array of issues with: severity, message, line, suggestion.
`;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
      response_format: { type: 'json_object' }
    });
    
    return JSON.parse(response.choices[0].message.content || '[]');
  }
  
  async reviewPR(diff: string, files: string[]): Promise<Review> {
    const prompt = `
Review this PR diff. Provide:
1. Overall quality score (0-100)
2. Critical issues that block merge
3. Suggestions for improvement
4. Estimated review time

Diff:
```
${diff}
```

Files changed: ${files.join(', ')}
`;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3
    });
    
    return parseReview(response.choices[0].message.content);
  }
}

interface CodeContext {
  language: string;
  framework?: string;
  fileType: 'business' | 'test' | 'config';
  dependencies: string[];
}

interface Issue {
  severity: 'critical' | 'high' | 'medium' | 'low';
  message: string;
  line: number;
  column?: number;
  suggestion: string;
  confidence: number;
}

interface Review {
  score: number;
  blockers: string[];
  suggestions: string[];
  estimatedTime: string;
}
