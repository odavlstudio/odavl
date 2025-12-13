/**
 * Custom Widgets Dashboard Page
 * Week 10 Day 4: Customizable dashboard with widgets
 */

'use client';

import React, { useState } from 'react';
import {
  Layout,
  Plus,
  Settings,
  Grid3x3,
  Maximize2
} from 'lucide-react';
import { RecentIssuesWidget } from '@/components/widgets/RecentIssuesWidget';
import { TopContributorsWidget } from '@/components/widgets/TopContributorsWidget';
import { SystemStatusWidget } from '@/components/widgets/SystemStatusWidget';
import { QuickActionsWidget } from '@/components/widgets/QuickActionsWidget';
import { ActivityTimelineWidget } from '@/components/widgets/ActivityTimelineWidget';
import { MetricCard } from '@/components/MetricCard';
import { ThemeToggle } from '@/components/ThemeToggle';

type WidgetLayout = 'grid' | 'list';

export default function WidgetsPage() {
  const [layout, setLayout] = useState<WidgetLayout>('grid');
  const [editMode, setEditMode] = useState(false);

  // Mock metrics data
  const metrics = [
    {
      title: 'Total Issues',
      value: 1247,
      change: -8,
      trend: 'down' as const,
      icon: 'AlertCircle'
    },
    {
      title: 'Code Quality',
      value: 87,
      change: 5,
      trend: 'up' as const,
      icon: 'CheckCircle'
    },
    {
      title: 'Team Velocity',
      value: 156,
      change: 12,
      trend: 'up' as const,
      icon: 'TrendingUp'
    },
    {
      title: 'Active Projects',
      value: 23,
      change: 3,
      trend: 'up' as const,
      icon: 'Folder'
    }
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Layout className="w-8 h-8 text-purple-600" />
              <h1 className="text-3xl font-bold text-gray-900">Custom Dashboard</h1>
            </div>
            <p className="text-gray-600">Personalize your workspace with custom widgets</p>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            
            <button
              onClick={() => setLayout(layout === 'grid' ? 'list' : 'grid')}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              title="Toggle layout"
            >
              {layout === 'grid' ? (
                <Grid3x3 className="w-5 h-5 text-gray-600" />
              ) : (
                <Maximize2 className="w-5 h-5 text-gray-600" />
              )}
            </button>

            <button
              onClick={() => setEditMode(!editMode)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                editMode
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Settings className="w-4 h-4" />
              {editMode ? 'Done' : 'Customize'}
            </button>

            <button className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
              <Plus className="w-4 h-4" />
              Add Widget
            </button>
          </div>
        </div>
      </div>

      {/* Edit Mode Banner */}
      {editMode && (
        <div className="mb-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Settings className="w-5 h-5 text-purple-600" />
              <div>
                <p className="font-medium text-purple-900">Customize Mode</p>
                <p className="text-sm text-purple-700">Drag widgets to rearrange, click × to remove</p>
              </div>
            </div>
            <button
              onClick={() => setEditMode(false)}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-medium"
            >
              Save Layout
            </button>
          </div>
        </div>
      )}

      {/* Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {metrics.map((metric, index) => (
          <div key={index} className={editMode ? 'ring-2 ring-purple-300 rounded-lg' : ''}>
            <MetricCard {...metric} />
          </div>
        ))}
      </div>

      {/* Widgets Grid */}
      <div className={`grid gap-6 ${
        layout === 'grid'
          ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
          : 'grid-cols-1'
      }`}>
        {/* Row 1 */}
        <div className={`${editMode ? 'ring-2 ring-purple-300 rounded-lg' : ''} ${
          layout === 'grid' ? 'lg:col-span-2' : ''
        }`}>
          <RecentIssuesWidget />
        </div>
        
        <div className={editMode ? 'ring-2 ring-purple-300 rounded-lg' : ''}>
          <TopContributorsWidget />
        </div>

        {/* Row 2 */}
        <div className={editMode ? 'ring-2 ring-purple-300 rounded-lg' : ''}>
          <SystemStatusWidget />
        </div>

        <div className={editMode ? 'ring-2 ring-purple-300 rounded-lg' : ''}>
          <QuickActionsWidget />
        </div>

        <div className={editMode ? 'ring-2 ring-purple-300 rounded-lg' : ''}>
          <ActivityTimelineWidget />
        </div>
      </div>

      {/* Add Widget Placeholder */}
      {editMode && (
        <div className="mt-6 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-purple-400 hover:bg-purple-50 transition-colors cursor-pointer">
          <Plus className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-600 font-medium">Add New Widget</p>
          <p className="text-sm text-gray-500 mt-1">Choose from available widgets</p>
        </div>
      )}
    </div>
  );
}
