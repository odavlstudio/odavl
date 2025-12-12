'use client';

import { useSession } from 'next-auth/react';
import { useUsageStats } from '@/lib/api-hooks';
import { UsageProgress } from '@/components/UsageProgress';
import { LimitBanner } from '@/components/LimitBanner';
import { PlanBadge } from '@/components/PlanBadge';
import type { InsightPlanId } from '../../../../../odavl-studio/insight/core/src/config/insight-product';
import { getAnalysisLimits } from '../../../../../odavl-studio/insight/core/src/config/insight-entitlements';
import Link from 'next/link';

/**
 * Usage & Limits Dashboard
 * 
 * Shows current usage against plan limits with:
 * - Visual progress bars
 * - Limit warnings when approaching thresholds
 * - Upgrade prompts when limits exceeded
 */
export default function UsagePage() {
  const { data: session } = useSession();
  const { data: usage, isLoading } = useUsageStats();

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!session?.user || !usage) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Usage & Limits</h1>
        <p className="text-gray-600">Please sign in to view your usage statistics.</p>
      </div>
    );
  }

  const user = session.user as any;
  const planId = (user.insightPlanId as InsightPlanId) || 'INSIGHT_FREE';
  const isTrial = user.isTrial || false;
  const trialDaysRemaining = user.trialDaysRemaining;
  
  // Get plan limits
  const trialConfig = isTrial ? {
    isTrial: true,
    trialPlanId: user.trialPlanId as InsightPlanId,
    daysRemaining: trialDaysRemaining,
  } : undefined;
  
  const limits = getAnalysisLimits(planId, trialConfig);
  
  // Calculate usage from API data
  const projectsUsed = usage.projectCount || 0;
  const analysesToday = usage.analysesToday || 0;
  const avgFilesPerAnalysis = usage.avgFilesPerAnalysis || 0;
  
  // Check if limits are exceeded
  const projectsExceeded = limits.maxProjects !== -1 && projectsUsed >= limits.maxProjects;
  const dailyAnalysesExceeded = limits.maxAnalysesPerDay !== -1 && analysesToday >= limits.maxAnalysesPerDay;
  const filesExceeded = limits.maxFilesPerAnalysis !== -1 && avgFilesPerAnalysis > limits.maxFilesPerAnalysis;

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Usage & Limits</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Monitor your current usage and plan limits</p>
        </div>
        <PlanBadge
          planId={planId}
          isTrial={isTrial}
          daysRemaining={trialDaysRemaining}
        />
      </div>

      {/* Trial Warning (if applicable) */}
      {isTrial && trialDaysRemaining && trialDaysRemaining <= 7 && (
        <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 rounded-md">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
            </svg>
            <p className="text-yellow-800 dark:text-yellow-200">
              Your trial ends in <strong>{trialDaysRemaining} days</strong>. Upgrade now to keep your Pro features.
            </p>
          </div>
        </div>
      )}

      {/* Limit Banners */}
      {projectsExceeded && (
        <LimitBanner
          limitType="projects"
          currentPlan={planId}
          currentValue={projectsUsed}
          maxValue={limits.maxProjects}
        />
      )}
      
      {dailyAnalysesExceeded && (
        <LimitBanner
          limitType="dailyAnalyses"
          currentPlan={planId}
          currentValue={analysesToday}
          maxValue={limits.maxAnalysesPerDay}
        />
      )}
      
      {filesExceeded && (
        <LimitBanner
          limitType="files"
          currentPlan={planId}
          currentValue={Math.round(avgFilesPerAnalysis)}
          maxValue={limits.maxFilesPerAnalysis}
        />
      )}

      {/* Usage Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Projects Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Projects</h3>
          <UsageProgress
            label="Projects Created"
            current={projectsUsed}
            max={limits.maxProjects}
            unit="projects"
            warningThreshold={80}
          />
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Total projects across your workspace
          </p>
        </div>

        {/* Daily Analyses Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Daily Analyses</h3>
          <UsageProgress
            label="Today's Analyses"
            current={analysesToday}
            max={limits.maxAnalysesPerDay}
            unit="analyses"
            warningThreshold={80}
          />
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Resets daily at midnight UTC
          </p>
        </div>

        {/* Files Per Analysis Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Files Per Analysis</h3>
          <UsageProgress
            label="Average Files"
            current={Math.round(avgFilesPerAnalysis)}
            max={limits.maxFilesPerAnalysis}
            unit="files"
            warningThreshold={80}
          />
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Average across your recent analyses
          </p>
        </div>
      </div>

      {/* Plan Comparison Table */}
      <div className="mt-12 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Plan Comparison</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b dark:border-gray-700">
                <th className="py-3 px-4 text-gray-700 dark:text-gray-300">Feature</th>
                <th className="py-3 px-4 text-gray-700 dark:text-gray-300">FREE</th>
                <th className="py-3 px-4 text-blue-600 dark:text-blue-400">PRO</th>
                <th className="py-3 px-4 text-purple-600 dark:text-purple-400">TEAM</th>
                <th className="py-3 px-4 text-orange-600 dark:text-orange-400">ENTERPRISE</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b dark:border-gray-700">
                <td className="py-3 px-4 text-gray-900 dark:text-white">Projects</td>
                <td className="py-3 px-4">3</td>
                <td className="py-3 px-4 font-semibold">10</td>
                <td className="py-3 px-4 font-semibold">50</td>
                <td className="py-3 px-4 font-semibold">Unlimited</td>
              </tr>
              <tr className="border-b dark:border-gray-700">
                <td className="py-3 px-4 text-gray-900 dark:text-white">Files Per Analysis</td>
                <td className="py-3 px-4">100</td>
                <td className="py-3 px-4 font-semibold">1,000</td>
                <td className="py-3 px-4 font-semibold">5,000</td>
                <td className="py-3 px-4 font-semibold">Unlimited</td>
              </tr>
              <tr className="border-b dark:border-gray-700">
                <td className="py-3 px-4 text-gray-900 dark:text-white">Daily Analyses</td>
                <td className="py-3 px-4">5</td>
                <td className="py-3 px-4 font-semibold">50</td>
                <td className="py-3 px-4 font-semibold">200</td>
                <td className="py-3 px-4 font-semibold">Unlimited</td>
              </tr>
              <tr className="border-b dark:border-gray-700">
                <td className="py-3 px-4 text-gray-900 dark:text-white">History Retention</td>
                <td className="py-3 px-4">7 days</td>
                <td className="py-3 px-4 font-semibold">90 days</td>
                <td className="py-3 px-4 font-semibold">180 days</td>
                <td className="py-3 px-4 font-semibold">365 days</td>
              </tr>
              <tr>
                <td className="py-3 px-4 text-gray-900 dark:text-white">Price</td>
                <td className="py-3 px-4 font-semibold">$0</td>
                <td className="py-3 px-4 font-semibold">$29/mo</td>
                <td className="py-3 px-4 font-semibold">$99/mo</td>
                <td className="py-3 px-4 font-semibold">$299/mo</td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <div className="mt-6 flex justify-end">
          <Link
            href="/app/billing"
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Upgrade Plan
          </Link>
        </div>
      </div>
    </div>
  );
}
