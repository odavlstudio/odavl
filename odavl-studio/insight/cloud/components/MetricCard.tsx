/**
 * Metric Card Component
 * Week 10 Day 1: Analytics Dashboard
 * 
 * Displays a single metric with icon, value, and trend indicator.
 */

'use client';

import React from 'react';
import { ArrowUp, ArrowDown, Minus, LucideIcon } from 'lucide-react';

export interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number; // percentage change (positive/negative)
  icon: LucideIcon;
  iconColor?: string;
  iconBgColor?: string;
  subtitle?: string;
  loading?: boolean;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  change,
  icon: Icon,
  iconColor = 'text-blue-600',
  iconBgColor = 'bg-blue-100',
  subtitle,
  loading = false
}) => {
  // Determine trend direction
  const getTrendIcon = () => {
    if (change === undefined) return null;
    if (change > 0) return <ArrowUp className="w-4 h-4" />;
    if (change < 0) return <ArrowDown className="w-4 h-4" />;
    return <Minus className="w-4 h-4" />;
  };

  const getTrendColor = () => {
    if (change === undefined) return '';
    if (change > 0) return 'text-green-600';
    if (change < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getTrendBgColor = () => {
    if (change === undefined) return '';
    if (change > 0) return 'bg-green-50';
    if (change < 0) return 'bg-red-50';
    return 'bg-gray-50';
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-3">
            <div className="h-4 bg-gray-200 rounded animate-pulse w-24"></div>
            <div className="h-8 bg-gray-200 rounded animate-pulse w-32"></div>
            <div className="h-3 bg-gray-200 rounded animate-pulse w-20"></div>
          </div>
          <div className="w-12 h-12 bg-gray-200 rounded-lg animate-pulse"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {/* Title */}
          <p className="text-sm font-medium text-gray-600 mb-2">{title}</p>

          {/* Value */}
          <p className="text-3xl font-bold text-gray-900 mb-2">{value}</p>

          {/* Subtitle or trend indicator */}
          {subtitle && (
            <p className="text-sm text-gray-500">{subtitle}</p>
          )}

          {change !== undefined && (
            <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getTrendColor()} ${getTrendBgColor()}`}>
              {getTrendIcon()}
              <span>{Math.abs(change).toFixed(1)}%</span>
            </div>
          )}
        </div>

        {/* Icon */}
        <div className={`${iconBgColor} ${iconColor} p-3 rounded-lg`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
};
