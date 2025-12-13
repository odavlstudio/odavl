/**
 * Insight Card Component
 * Week 10 Day 3: Reports & Insights
 */

'use client';

import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Info,
  Lightbulb
} from 'lucide-react';
import type { Insight } from '@/lib/reports/types';

export interface InsightCardProps {
  insight: Insight;
}

export const InsightCard: React.FC<InsightCardProps> = ({ insight }) => {
  const getIcon = () => {
    switch (insight.type) {
      case 'positive':
        return <CheckCircle className="w-6 h-6" />;
      case 'negative':
        return <TrendingDown className="w-6 h-6" />;
      case 'warning':
        return <AlertTriangle className="w-6 h-6" />;
      default:
        return <Info className="w-6 h-6" />;
    }
  };

  const getColorClasses = () => {
    switch (insight.type) {
      case 'positive':
        return {
          bg: 'bg-green-50',
          border: 'border-green-200',
          icon: 'text-green-600',
          badge: 'bg-green-100 text-green-800'
        };
      case 'negative':
        return {
          bg: 'bg-red-50',
          border: 'border-red-200',
          icon: 'text-red-600',
          badge: 'bg-red-100 text-red-800'
        };
      case 'warning':
        return {
          bg: 'bg-yellow-50',
          border: 'border-yellow-200',
          icon: 'text-yellow-600',
          badge: 'bg-yellow-100 text-yellow-800'
        };
      default:
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          icon: 'text-blue-600',
          badge: 'bg-blue-100 text-blue-800'
        };
    }
  };

  const colors = getColorClasses();

  return (
    <div className={`${colors.bg} ${colors.border} border rounded-lg p-4`}>
      <div className="flex items-start gap-3">
        <div className={`${colors.icon} flex-shrink-0`}>
          {getIcon()}
        </div>

        <div className="flex-1">
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-semibold text-gray-900">{insight.title}</h3>
            <span className={`${colors.badge} px-2 py-1 rounded-full text-xs font-medium`}>
              {insight.impact} impact
            </span>
          </div>

          <p className="text-sm text-gray-700 mb-2">{insight.description}</p>

          {insight.recommendation && (
            <div className="flex items-start gap-2 mt-3 p-3 bg-white rounded-md border border-gray-200">
              <Lightbulb className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-medium text-gray-900 mb-1">Recommendation:</p>
                <p className="text-xs text-gray-600">{insight.recommendation}</p>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between mt-3">
            <span className="text-xs text-gray-500 capitalize">{insight.category}</span>
            <span className="text-xs text-gray-400">
              {new Date(insight.timestamp).toLocaleTimeString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
