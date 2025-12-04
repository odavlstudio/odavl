/**
 * Recommendation Card Component
 * Week 10 Day 3: Reports & Insights
 */

'use client';

import React, { useState } from 'react';
import { Target, Zap, Clock, CheckCircle, X } from 'lucide-react';
import type { Recommendation } from '@/lib/reports/types';

export interface RecommendationCardProps {
  recommendation: Recommendation;
  onStatusChange?: (id: string, status: Recommendation['status']) => void;
}

export const RecommendationCard: React.FC<RecommendationCardProps> = ({
  recommendation,
  onStatusChange
}) => {
  const [status, setStatus] = useState(recommendation.status);

  const getPriorityColor = () => {
    switch (recommendation.priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getEffortIcon = () => {
    switch (recommendation.effort) {
      case 'high':
        return '🔥🔥🔥';
      case 'medium':
        return '🔥🔥';
      case 'low':
        return '🔥';
    }
  };

  const handleStatusChange = (newStatus: Recommendation['status']) => {
    setStatus(newStatus);
    onStatusChange?.(recommendation.id, newStatus);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start gap-3">
          <Target className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-gray-900 mb-1">{recommendation.title}</h3>
            <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor()} border`}>
              {recommendation.priority} priority
            </span>
          </div>
        </div>
      </div>

      <p className="text-sm text-gray-700 mb-3">{recommendation.description}</p>

      <div className="space-y-2 mb-3">
        <div className="flex items-center gap-2 text-sm">
          <Zap className="w-4 h-4 text-green-600" />
          <span className="text-gray-600">Impact:</span>
          <span className="text-gray-900">{recommendation.impact}</span>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <Clock className="w-4 h-4 text-amber-600" />
          <span className="text-gray-600">Effort:</span>
          <span className="text-gray-900">{recommendation.effort} {getEffortIcon()}</span>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-600">Category:</span>
          <span className="text-gray-900 capitalize">{recommendation.category.replace('-', ' ')}</span>
        </div>
      </div>

      {/* Status Actions */}
      <div className="flex items-center gap-2 pt-3 border-t border-gray-200">
        <span className="text-xs text-gray-600 mr-2">Status:</span>
        <button
          onClick={() => handleStatusChange('in-progress')}
          className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
            status === 'in-progress'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          In Progress
        </button>
        <button
          onClick={() => handleStatusChange('completed')}
          className={`px-3 py-1 rounded-md text-xs font-medium transition-colors flex items-center gap-1 ${
            status === 'completed'
              ? 'bg-green-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <CheckCircle className="w-3 h-3" />
          Completed
        </button>
        <button
          onClick={() => handleStatusChange('dismissed')}
          className={`px-3 py-1 rounded-md text-xs font-medium transition-colors flex items-center gap-1 ${
            status === 'dismissed'
              ? 'bg-gray-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <X className="w-3 h-3" />
          Dismiss
        </button>
      </div>
    </div>
  );
};
