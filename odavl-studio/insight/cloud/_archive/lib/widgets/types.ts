/**
 * Widget Types & Interfaces
 * Week 10 Day 4: Custom Widgets System
 */

export type WidgetSize = 'small' | 'medium' | 'large' | 'full';
export type WidgetType = 
  | 'metrics-overview'
  | 'recent-issues'
  | 'top-contributors'
  | 'system-status'
  | 'quick-actions'
  | 'activity-timeline'
  | 'performance-chart'
  | 'security-summary';

export interface Widget {
  id: string;
  type: WidgetType;
  title: string;
  size: WidgetSize;
  position: number;
  enabled: boolean;
  config?: Record<string, any>;
}

export interface WidgetConfig {
  id: string;
  type: WidgetType;
  title: string;
  description: string;
  defaultSize: WidgetSize;
  icon: string;
  category: 'metrics' | 'activity' | 'team' | 'system';
  configurable: boolean;
}

export interface DashboardLayout {
  widgets: Widget[];
  lastUpdated: string;
  theme: 'light' | 'dark';
}

export interface WidgetData {
  [key: string]: any;
}
