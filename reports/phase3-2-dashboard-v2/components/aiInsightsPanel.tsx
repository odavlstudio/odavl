// odavl-studio/insight/cloud/components/dashboard-v2/AIInsightsPanel.tsx
'use client';

import { motion } from 'framer-motion';
import { useAIInsights } from '@/hooks/useAIInsights';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sparkles, TrendingUp, AlertTriangle, Lightbulb } from 'lucide-react';

interface AIInsightsPanelProps {
  projectId: string;
  timeRange: string;
}

export function AIInsightsPanel({ projectId, timeRange }: AIInsightsPanelProps) {
  const { insights, loading, refresh } = useAIInsights(projectId, timeRange);

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'anomaly':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'trend':
        return <TrendingUp className="w-4 h-4 text-blue-500" />;
      case 'recommendation':
        return <Lightbulb className="w-4 h-4 text-green-500" />;
      default:
        return <Sparkles className="w-4 h-4 text-purple-500" />;
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return 'bg-green-500';
    if (confidence >= 70) return 'bg-blue-500';
    if (confidence >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-500" />
            AI-Powered Insights
          </CardTitle>
          <Button size="sm" variant="outline" onClick={refresh} disabled={loading}>
            Refresh
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <motion.div
                key={i}
                className="h-20 bg-gray-100 dark:bg-gray-800 rounded"
                animate={{
                  opacity: [0.5, 1, 0.5]
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: 'easeInOut'
                }}
              />
            ))}
          </div>
        ) : (
          insights.map((insight, index) => (
            <motion.div
              key={insight.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="p-4 border rounded-lg hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-3">
                <div className="mt-1">{getInsightIcon(insight.type)}</div>
                
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold">{insight.title}</h4>
                    <Badge variant="outline" className="text-xs">
                      {insight.type}
                    </Badge>
                  </div>

                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {insight.description}
                  </p>

                  {/* Confidence Meter */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>Confidence</span>
                      <span>{insight.confidence}%</span>
                    </div>
                    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <motion.div
                        className={`h-full ${getConfidenceColor(insight.confidence)}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${insight.confidence}%` }}
                        transition={{ duration: 1, ease: 'easeOut' }}
                      />
                    </div>
                  </div>

                  {/* Recommendations */}
                  {insight.recommendations && insight.recommendations.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                        Recommendations:
                      </p>
                      <ul className="text-xs space-y-1">
                        {insight.recommendations.map((rec, i) => (
                          <motion.li
                            key={i}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 + i * 0.1 }}
                            className="flex items-start gap-2"
                          >
                            <span className="text-purple-500">•</span>
                            <span>{rec}</span>
                          </motion.li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Actions */}
                  {insight.actions && (
                    <div className="flex gap-2 pt-2">
                      {insight.actions.map((action) => (
                        <Button key={action.label} size="sm" variant="outline">
                          {action.label}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))
        )}

        {!loading && insights.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-8 text-gray-500"
          >
            <Sparkles className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No insights available yet. Check back later.</p>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}