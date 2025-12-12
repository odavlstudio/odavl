/**
 * Plan Badge Component
 * 
 * Displays user's current plan with trial indication
 */

import React from 'react';
import { InsightPlanId } from '../../../../../odavl-studio/insight/core/src/config/insight-product.js';

export interface PlanBadgeProps {
  planId: InsightPlanId;
  isTrial?: boolean;
  daysRemaining?: number;
  className?: string;
}

const PLAN_COLORS: Record<InsightPlanId, string> = {
  INSIGHT_FREE: 'bg-gray-100 text-gray-800 border-gray-300',
  INSIGHT_PRO: 'bg-blue-100 text-blue-800 border-blue-300',
  INSIGHT_TEAM: 'bg-purple-100 text-purple-800 border-purple-300',
  INSIGHT_ENTERPRISE: 'bg-orange-100 text-orange-800 border-orange-300',
};

const PLAN_DISPLAY_NAMES: Record<InsightPlanId, string> = {
  INSIGHT_FREE: 'Free',
  INSIGHT_PRO: 'Pro',
  INSIGHT_TEAM: 'Team',
  INSIGHT_ENTERPRISE: 'Enterprise',
};

export function PlanBadge({ planId, isTrial, daysRemaining, className = '' }: PlanBadgeProps) {
  const colorClass = PLAN_COLORS[planId];
  const displayName = PLAN_DISPLAY_NAMES[planId];
  
  return (
    <span 
      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${colorClass} ${className}`}
      title={isTrial ? `Trial ends in ${daysRemaining} days` : undefined}
    >
      {isTrial && daysRemaining !== undefined ? (
        <>
          <svg className="w-4 h-4 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
          </svg>
          {displayName} Trial ({daysRemaining}d left)
        </>
      ) : (
        displayName
      )}
    </span>
  );
}
