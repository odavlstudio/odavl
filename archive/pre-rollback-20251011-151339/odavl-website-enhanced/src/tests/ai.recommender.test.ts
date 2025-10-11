// ODAVL-WAVE-X8-INJECT: AI Recommender Tests - Validates AI Recommendations
// @odavl-governance: TESTING-SAFE mode active

export interface AITestRecommendation {
  type: 'feature' | 'security' | 'performance' | 'accessibility';
  priority: 'high' | 'medium' | 'low';
  confidence: number;
  suggestion: string;
}

export class AIRecommenderTester {
  private mockRecommendations: AITestRecommendation[] = [
    {
      type: 'performance',
      priority: 'high',
      confidence: 0.95,
      suggestion: 'Optimize image loading with next/image',
    },
    {
      type: 'accessibility',
      priority: 'medium',
      confidence: 0.88,
      suggestion: 'Add ARIA labels to navigation elements',
    },
    {
      type: 'security',
      priority: 'high',
      confidence: 0.92,
      suggestion: 'Implement Content Security Policy headers',
    },
  ];

  testRecommendationGeneration(): AITestRecommendation[] {
    return this.mockRecommendations.filter(rec => rec.confidence > 0.8);
  }

  testRecommendationPrioritization(): AITestRecommendation[] {
    return this.mockRecommendations
      .sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      })
      .sort((a, b) => b.confidence - a.confidence);
  }

  testRecommendationFiltering(type: AITestRecommendation['type']): AITestRecommendation[] {
    return this.mockRecommendations.filter(rec => rec.type === type);
  }

  validateRecommendationQuality(recommendation: AITestRecommendation): boolean {
    return (
      recommendation.confidence > 0.7 &&
      recommendation.suggestion.length > 10 &&
      ['feature', 'security', 'performance', 'accessibility'].includes(recommendation.type)
    );
  }
}