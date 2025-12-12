/**
 * Usage Progress Component
 * 
 * Displays current usage against plan limits
 */

import React from 'react';

export interface UsageProgressProps {
  label: string;
  current: number;
  max: number;
  unit?: string;
  warningThreshold?: number; // percentage (0-100)
  className?: string;
}

export function UsageProgress({ 
  label, 
  current, 
  max, 
  unit = '', 
  warningThreshold = 80,
  className = '' 
}: UsageProgressProps) {
  const isUnlimited = max === -1;
  const percentage = isUnlimited ? 0 : Math.min(100, (current / max) * 100);
  const isWarning = percentage >= warningThreshold;
  const isExceeded = percentage >= 100;
  
  const barColor = isExceeded 
    ? 'bg-red-500' 
    : isWarning 
    ? 'bg-yellow-500' 
    : 'bg-blue-500';
  
  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex justify-between items-center text-sm">
        <span className="font-medium text-gray-700">{label}</span>
        <span className={`font-semibold ${isExceeded ? 'text-red-600' : isWarning ? 'text-yellow-600' : 'text-gray-900'}`}>
          {current} {isUnlimited ? '' : `/ ${max}`} {unit}
          {isUnlimited && <span className="text-gray-500 ml-1">(Unlimited)</span>}
        </span>
      </div>
      {!isUnlimited && (
        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all duration-300 ${barColor}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      )}
      {isExceeded && (
        <p className="text-xs text-red-600 mt-1">
          ⚠️ Limit exceeded. Upgrade to continue.
        </p>
      )}
      {!isExceeded && isWarning && (
        <p className="text-xs text-yellow-600 mt-1">
          ⚠️ Approaching limit. Consider upgrading.
        </p>
      )}
    </div>
  );
}
