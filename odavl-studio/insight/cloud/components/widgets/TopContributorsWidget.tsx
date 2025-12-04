/**
 * Top Contributors Widget
 * Shows most active team members
 */

'use client';

import React from 'react';
import { Users, TrendingUp } from 'lucide-react';

interface Contributor {
  id: string;
  name: string;
  avatar: string;
  contributions: number;
  trend: 'up' | 'down' | 'stable';
  changePercent: number;
}

export function TopContributorsWidget() {
  // Mock data
  const contributors: Contributor[] = [
    {
      id: '1',
      name: 'Sarah Chen',
      avatar: '👩‍💻',
      contributions: 247,
      trend: 'up',
      changePercent: 12
    },
    {
      id: '2',
      name: 'Ahmed Ali',
      avatar: '👨‍💼',
      contributions: 189,
      trend: 'up',
      changePercent: 8
    },
    {
      id: '3',
      name: 'Emily Johnson',
      avatar: '👩‍🔬',
      contributions: 156,
      trend: 'stable',
      changePercent: 0
    },
    {
      id: '4',
      name: 'Marcus Brown',
      avatar: '👨‍🎨',
      contributions: 142,
      trend: 'down',
      changePercent: -3
    }
  ];

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center gap-2 mb-4">
        <Users className="w-5 h-5 text-blue-600" />
        <h3 className="font-semibold text-gray-900">Top Contributors</h3>
      </div>

      <div className="space-y-4">
        {contributors.map((contributor, index) => (
          <div key={contributor.id} className="flex items-center gap-3">
            <div className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-full text-xl">
              {contributor.avatar}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-gray-900 truncate">{contributor.name}</p>
                {index === 0 && <span className="text-xs">🏆</span>}
              </div>
              <p className="text-xs text-gray-500">{contributor.contributions} contributions</p>
            </div>
            <div className="flex items-center gap-1">
              {contributor.trend === 'up' && (
                <>
                  <TrendingUp className="w-3 h-3 text-green-600" />
                  <span className="text-xs text-green-600 font-medium">+{contributor.changePercent}%</span>
                </>
              )}
              {contributor.trend === 'down' && (
                <>
                  <TrendingUp className="w-3 h-3 text-red-600 rotate-180" />
                  <span className="text-xs text-red-600 font-medium">{contributor.changePercent}%</span>
                </>
              )}
              {contributor.trend === 'stable' && (
                <span className="text-xs text-gray-500">—</span>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Total Team</span>
          <span className="font-semibold text-gray-900">12 members</span>
        </div>
      </div>
    </div>
  );
}
