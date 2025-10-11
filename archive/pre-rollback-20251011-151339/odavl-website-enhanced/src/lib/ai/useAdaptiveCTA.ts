// ODAVL-WAVE-X5: Adaptive CTA Hook - Minimal React Integration
import { useState, useEffect } from 'react';
import { aiBrain, UserContext } from '../../../config/ai/ai.brain.compact';
import { aiRecommender, CTARecommendation } from '../../../config/ai/ai.recommender';

export function useAdaptiveCTA() {
  const [cta, setCta] = useState<CTARecommendation | null>(null);
  const [context, setContext] = useState<UserContext | null>(null);

  useEffect(() => {
    const sessionId = crypto.randomUUID();
    const userContext = aiBrain.inferContext(sessionId);
    const recommendation = aiRecommender.generateCTA(userContext);
    
    setContext(userContext);
    setCta(recommendation);
  }, []);

  const trackInteraction = () => {
    if (context) {
      aiBrain.collectSignal({
        type: 'interaction',
        path: window.location.pathname,
        timestamp: Date.now()
      });
    }
  };

  return {
    cta,
    context,
    trackInteraction,
    isLoading: !cta || !context
  };
}

export default useAdaptiveCTA;