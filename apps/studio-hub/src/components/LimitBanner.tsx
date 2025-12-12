/**
 * Limit Banner Component
 * 
 * Shows warning when user hits plan limits with upgrade CTA
 */

import React from 'react';
import Link from 'next/link';
import { InsightPlanId } from '../../../../../odavl-studio/insight/core/src/config/insight-product.js';

export type LimitType = 'projects' | 'files' | 'dailyAnalyses' | 'cloudAccess';

export interface LimitBannerProps {
  limitType: LimitType;
  currentPlan: InsightPlanId;
  currentValue?: number;
  maxValue?: number;
  recommendedPlan?: InsightPlanId;
  onDismiss?: () => void;
}

const LIMIT_MESSAGES: Record<LimitType, (current?: number, max?: number) => string> = {
  projects: (current, max) => 
    `You've reached your project limit (${current}/${max}). Upgrade to create more projects.`,
  files: (current, max) => 
    `This analysis contains ${current} files, exceeding your limit of ${max} files per analysis.`,
  dailyAnalyses: (current, max) => 
    `You've used all ${max} analyses for today (${current}/${max}). Upgrade for unlimited analyses.`,
  cloudAccess: () => 
    'Cloud analysis is a Pro feature. Upgrade to analyze in the cloud with history and collaboration.',
};

const UPGRADE_BENEFITS: Record<LimitType, string[]> = {
  projects: [
    'Create up to 10 projects (Pro) or unlimited (Enterprise)',
    'Better organization for multiple codebases',
    'Team project sharing (Team+)',
  ],
  files: [
    'Analyze up to 1,000 files (Pro) or unlimited (Enterprise)',
    'Perfect for monorepos and large projects',
    'Faster parallel processing',
  ],
  dailyAnalyses: [
    '50 analyses/day (Pro), 200 (Team), unlimited (Enterprise)',
    'Perfect for CI/CD pipelines',
    'No interruptions to your workflow',
  ],
  cloudAccess: [
    'Cloud analysis with 90-day history',
    'Team collaboration and sharing',
    'Access from anywhere (CLI, VS Code, Web)',
  ],
};

export function LimitBanner({ 
  limitType, 
  currentPlan, 
  currentValue, 
  maxValue,
  recommendedPlan = 'INSIGHT_PRO',
  onDismiss 
}: LimitBannerProps) {
  const message = LIMIT_MESSAGES[limitType](currentValue, maxValue);
  const benefits = UPGRADE_BENEFITS[limitType];
  
  return (
    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 rounded-md shadow-sm">
      <div className="flex">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-yellow-800">
            Plan Limit Reached
          </h3>
          <div className="mt-2 text-sm text-yellow-700">
            <p>{message}</p>
          </div>
          <div className="mt-3">
            <div className="text-sm text-yellow-700 mb-2">
              <strong>Upgrade to unlock:</strong>
            </div>
            <ul className="list-disc list-inside text-sm text-yellow-700 space-y-1">
              {benefits.map((benefit, index) => (
                <li key={index}>{benefit}</li>
              ))}
            </ul>
          </div>
          <div className="mt-4 flex gap-3">
            <Link
              href="/pricing"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 transition"
            >
              Upgrade Now
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 transition"
            >
              Compare Plans
            </Link>
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition"
              >
                Dismiss
              </button>
            )}
          </div>
        </div>
        {onDismiss && (
          <div className="ml-auto pl-3">
            <button
              onClick={onDismiss}
              className="inline-flex text-yellow-700 hover:text-yellow-900 focus:outline-none"
            >
              <span className="sr-only">Dismiss</span>
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
