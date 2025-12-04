// odavl-studio/insight/cloud/hooks/useAIInsights.ts
import { useEffect, useState } from 'react';

interface Insight {
  id: string;
  type: 'anomaly' | 'trend' | 'recommendation';
  title: string;
  description: string;
  confidence: number;
  recommendations?: string[];
  actions?: Array<{ label: string; action: string }>;
}

export function useAIInsights(projectId: string, timeRange: string) {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchInsights = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/ai/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, timeRange })
      });

      if (!response.ok) throw new Error('Failed to fetch insights');

      const data = await response.json();
      setInsights(data.insights);
      setError(null);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
    const interval = setInterval(fetchInsights, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, [projectId, timeRange]);

  return { insights, loading, error, refresh: fetchInsights };
}