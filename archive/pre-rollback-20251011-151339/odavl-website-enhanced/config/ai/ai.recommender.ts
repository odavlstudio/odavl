// ODAVL-WAVE-X5: AI Recommender - Minimal CTA System
import { UserContext } from './ai.brain.compact';

export interface CTARecommendation {
  text: string;
  href: string;
  priority: 'high' | 'medium' | 'low';
  confidence: number;
}

class AIRecommender {
  generateCTA(context: UserContext): CTARecommendation {
    const { persona, intent, engagement } = context;
    
    if (persona === 'developer' && intent === 'implementing') {
      return {
        text: 'View API Documentation',
        href: '/docs/api',
        priority: 'high',
        confidence: 0.9
      };
    }
    
    if (persona === 'manager' && engagement === 'high') {
      return {
        text: 'Security Overview',
        href: '/security',
        priority: 'high',
        confidence: 0.8
      };
    }

    return {
      text: 'Get Started',
      href: '/docs',
      priority: 'medium',
      confidence: 0.6
    };
  }
}

export const aiRecommender = new AIRecommender();