/**
 * Plan Upsell Banner Component
 * Shows upgrade prompts based on user's current plan and feature usage
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { X, Zap, TrendingUp, Users, Shield } from 'lucide-react';

interface PlanUpsellBannerProps {
  currentPlan: 'free' | 'pro' | 'team' | 'enterprise';
  feature?: 'cloud-analysis' | 'ml-predictions' | 'auto-fix' | 'team-features' | 'priority-support';
  limitReached?: boolean;
  customMessage?: string;
}

export function PlanUpsellBanner({
  currentPlan,
  feature,
  limitReached = false,
  customMessage
}: PlanUpsellBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  // Don't show for enterprise users
  if (currentPlan === 'enterprise' || dismissed) {
    return null;
  }

  const getUpsellContent = () => {
    if (customMessage) {
      return {
        icon: Zap,
        title: 'Upgrade Your Plan',
        message: customMessage,
        targetPlan: currentPlan === 'free' ? 'Pro' : 'Team'
      };
    }

    switch (feature) {
      case 'cloud-analysis':
        return {
          icon: Zap,
          title: limitReached 
            ? 'Cloud Analysis Limit Reached' 
            : 'Unlock Cloud Analysis',
          message: limitReached
            ? `You've reached your ${currentPlan === 'free' ? '10' : '1,000'} monthly cloud analysis limit. Upgrade to get ${currentPlan === 'free' ? '1,000' : 'unlimited'} analyses per month.`
            : 'Run analyses in the cloud without local setup. Get faster results and collaborate with your team.',
          targetPlan: currentPlan === 'free' ? 'Pro' : 'Enterprise',
          features: currentPlan === 'free' 
            ? ['1,000 analyses/month', 'Cloud processing', 'API access', 'Priority support']
            : ['Unlimited analyses', 'Dedicated resources', 'SLA guarantee', '24/7 support']
        };

      case 'ml-predictions':
        return {
          icon: TrendingUp,
          title: 'AI-Powered Predictions',
          message: 'Get ML-powered trust scores and automated fix suggestions. Available on Pro and Team plans.',
          targetPlan: 'Pro',
          features: ['ML trust scoring', 'Smart fix suggestions', 'Pattern recognition', 'Predictive analytics']
        };

      case 'auto-fix':
        return {
          icon: Shield,
          title: 'Automated Fixes',
          message: 'Let ODAVL automatically fix detected issues with undo snapshots and safety guarantees.',
          targetPlan: 'Pro',
          features: ['Automated fixes', 'Safe rollback', 'Risk budget protection', 'Attestation chain']
        };

      case 'team-features':
        return {
          icon: Users,
          title: 'Team Collaboration',
          message: 'Share projects, manage team members, and collaborate on code quality improvements.',
          targetPlan: 'Team',
          features: ['Team workspaces', 'Shared projects', 'Role-based access', 'Audit logs']
        };

      case 'priority-support':
        return {
          icon: Shield,
          title: 'Priority Support',
          message: 'Get faster response times and dedicated support for your team.',
          targetPlan: 'Team',
          features: ['Priority email support', 'Slack integration', 'Custom SLA', 'Dedicated account manager']
        };

      default:
        return {
          icon: Zap,
          title: 'Unlock More Features',
          message: 'Upgrade your plan to access advanced features and increase your limits.',
          targetPlan: currentPlan === 'free' ? 'Pro' : 'Team'
        };
    }
  };

  const content = getUpsellContent();
  const Icon = content.icon;

  const bgColor = limitReached ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200';
  const iconColor = limitReached ? 'text-red-600' : 'text-blue-600';
  const textColor = limitReached ? 'text-red-900' : 'text-blue-900';
  const buttonColor = limitReached 
    ? 'bg-red-600 hover:bg-red-700' 
    : 'bg-blue-600 hover:bg-blue-700';

  return (
    <div className={`${bgColor} border rounded-lg p-4 mb-6 relative`}>
      <button
        onClick={() => setDismissed(true)}
        className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        aria-label="Dismiss"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="flex items-start gap-4 pr-8">
        <div className={`${iconColor} mt-0.5`}>
          <Icon className="w-6 h-6" />
        </div>

        <div className="flex-1">
          <h3 className={`text-lg font-semibold ${textColor} mb-1`}>
            {content.title}
          </h3>
          <p className="text-sm text-gray-700 mb-3">
            {content.message}
          </p>

          {content.features && (
            <ul className="grid grid-cols-2 gap-2 mb-4 text-sm text-gray-700">
              {content.features.map((feature, index) => (
                <li key={index} className="flex items-center gap-2">
                  <span className={iconColor}>✓</span>
                  {feature}
                </li>
              ))}
            </ul>
          )}

          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/billing/upgrade"
              className={`inline-flex items-center px-4 py-2 ${buttonColor} text-white rounded-lg transition-colors text-sm font-medium shadow-sm`}
            >
              Upgrade to {content.targetPlan}
            </Link>
            <Link
              href="/pricing"
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Compare Plans →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Feature Limit Warning
 * Shows when user is approaching their plan limit
 */
interface FeatureLimitWarningProps {
  featureName: string;
  current: number;
  limit: number;
  resetDate?: Date;
}

export function FeatureLimitWarning({
  featureName,
  current,
  limit,
  resetDate
}: FeatureLimitWarningProps) {
  const percentage = (current / limit) * 100;
  const isWarning = percentage >= 80;
  const isCritical = percentage >= 95;

  if (percentage < 80) {
    return null;
  }

  const color = isCritical 
    ? 'bg-red-50 border-red-200 text-red-900'
    : 'bg-yellow-50 border-yellow-200 text-yellow-900';

  return (
    <div className={`${color} border rounded-lg p-3 mb-4`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium">
          {featureName}: {current} / {limit}
        </span>
        <span className="text-xs">
          {percentage.toFixed(0)}% used
        </span>
      </div>
      
      <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
        <div
          className={`h-2 rounded-full ${isCritical ? 'bg-red-600' : 'bg-yellow-600'}`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>

      <p className="text-xs">
        {isCritical 
          ? `You're almost out of ${featureName.toLowerCase()}. Consider upgrading to avoid interruption.`
          : `You're approaching your ${featureName.toLowerCase()} limit.`
        }
        {resetDate && (
          <span className="ml-1">
            Resets on {resetDate.toLocaleDateString()}.
          </span>
        )}
      </p>
    </div>
  );
}
