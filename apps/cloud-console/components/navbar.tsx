'use client';

import { useSession } from 'next-auth/react';
import { useUsageStats } from '@/lib/api-hooks';
import Link from 'next/link';
import VersionBadge from './VersionBadge';
import { PlanBadge } from './PlanBadge';
import type { InsightPlanId } from '../../../odavl-studio/insight/core/src/config/insight-product';

export default function Navbar() {
  const { data: session } = useSession();
  const { data: usage } = useUsageStats();

  const getPlanBadgeColor = (tier: string) => {
    switch (tier) {
      case 'FREE':
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 border-gray-300 dark:border-gray-600';
      case 'PRO':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 border-blue-300 dark:border-blue-700';
      case 'ENTERPRISE':
        return 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-400 border-purple-300 dark:border-purple-700';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 border-gray-300 dark:border-gray-600';
    }
  };

  return (
    <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-3.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/app/dashboard" className="text-2xl font-bold text-primary">
            ODAVL
          </Link>
          <nav className="flex gap-4">
            <Link href="/app/dashboard" className="text-gray-700 hover:text-primary">
              Dashboard
            </Link>
            <Link href="/app/projects" className="text-gray-700 hover:text-primary">
              Projects
            </Link>
            <Link href="/app/marketplace" className="text-gray-700 hover:text-primary">
              Marketplace
            </Link>
            <Link href="/app/intelligence" className="text-gray-700 hover:text-primary">
              Intelligence
            </Link>
          </nav>
        </div>

        {/* Right side - Version + Plan Badge + User */}
        <div className="flex items-center gap-4">
          {/* Version Badge */}
          <VersionBadge />
          
          {/* Enhanced Plan Badge with Trial Support */}
          {session?.user && (
            <Link href="/app/billing" title="View billing & usage">
              <PlanBadge
                planId={(session.user as any).insightPlanId as InsightPlanId || 'INSIGHT_FREE'}
                isTrial={(session.user as any).isTrial || false}
                daysRemaining={(session.user as any).trialDaysRemaining}
              />
            </Link>
          )}
          
          <button className="text-gray-700 hover:text-primary">
            Notifications
          </button>
          <button className="text-gray-700 hover:text-primary">
            Profile
          </button>
        </div>
      </div>
    </nav>
  );
}

