/**
 * Widget Registry
 * Week 10 Day 4: Available widgets configuration
 */

import type { WidgetConfig } from './types';

export const WIDGET_REGISTRY: WidgetConfig[] = [
  {
    id: 'metrics-overview',
    type: 'metrics-overview',
    title: 'Metrics Overview',
    description: 'Key performance indicators at a glance',
    defaultSize: 'medium',
    icon: 'BarChart3',
    category: 'metrics',
    configurable: false
  },
  {
    id: 'recent-issues',
    type: 'recent-issues',
    title: 'Recent Issues',
    description: 'Latest detected issues and errors',
    defaultSize: 'medium',
    icon: 'AlertCircle',
    category: 'activity',
    configurable: true
  },
  {
    id: 'top-contributors',
    type: 'top-contributors',
    title: 'Top Contributors',
    description: 'Most active team members',
    defaultSize: 'small',
    icon: 'Users',
    category: 'team',
    configurable: false
  },
  {
    id: 'system-status',
    type: 'system-status',
    title: 'System Status',
    description: 'Health and availability indicators',
    defaultSize: 'small',
    icon: 'Activity',
    category: 'system',
    configurable: false
  },
  {
    id: 'quick-actions',
    type: 'quick-actions',
    title: 'Quick Actions',
    description: 'Common tasks and shortcuts',
    defaultSize: 'small',
    icon: 'Zap',
    category: 'activity',
    configurable: true
  },
  {
    id: 'activity-timeline',
    type: 'activity-timeline',
    title: 'Activity Timeline',
    description: 'Recent project activity feed',
    defaultSize: 'medium',
    icon: 'Clock',
    category: 'activity',
    configurable: true
  },
  {
    id: 'performance-chart',
    type: 'performance-chart',
    title: 'Performance Trends',
    description: 'Analysis performance over time',
    defaultSize: 'large',
    icon: 'TrendingUp',
    category: 'metrics',
    configurable: true
  },
  {
    id: 'security-summary',
    type: 'security-summary',
    title: 'Security Summary',
    description: 'Security issues and vulnerabilities',
    defaultSize: 'medium',
    icon: 'Shield',
    category: 'metrics',
    configurable: false
  }
];

export const getWidgetConfig = (type: string): WidgetConfig | undefined => {
  return WIDGET_REGISTRY.find(w => w.type === type);
};

export const getWidgetsByCategory = (category: string): WidgetConfig[] => {
  return WIDGET_REGISTRY.filter(w => w.category === category);
};
