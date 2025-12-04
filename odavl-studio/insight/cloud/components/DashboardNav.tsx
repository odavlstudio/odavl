/**
 * Dashboard Navigation Component
 * Week 10 Day 2: Charts & Visualizations
 * 
 * Sidebar navigation for dashboard pages.
 */

'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  BarChart3,
  FileText,
  Settings,
  Users,
  Activity
} from 'lucide-react';

const navItems = [
  {
    label: 'Overview',
    href: '/dashboard/overview',
    icon: LayoutDashboard
  },
  {
    label: 'Charts',
    href: '/dashboard/charts',
    icon: BarChart3
  },
  {
    label: 'Reports',
    href: '/dashboard/reports',
    icon: FileText
  },
  {
    label: 'Widgets',
    href: '/dashboard/widgets',
    icon: Activity
  },
  {
    label: 'Team',
    href: '/dashboard/team',
    icon: Users
  },
  {
    label: 'Settings',
    href: '/dashboard/settings',
    icon: Settings
  }
];

export const DashboardNav: React.FC = () => {
  const pathname = usePathname();

  return (
    <nav className="bg-white border-r border-gray-200 w-64 min-h-screen p-4">
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-1">ODAVL Insight</h2>
        <p className="text-xs text-gray-500">Analytics Dashboard</p>
      </div>

      <ul className="space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-lg
                  transition-colors
                  ${
                    isActive
                      ? 'bg-blue-50 text-blue-600 font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
                  }
                `}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>

      {/* Quick Stats */}
      <div className="mt-8 pt-8 border-t border-gray-200">
        <p className="text-xs font-medium text-gray-500 mb-3">QUICK STATS</p>
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Health Score</span>
            <span className="font-bold text-green-600">85</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Active Users</span>
            <span className="font-bold text-blue-600">8</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Open Issues</span>
            <span className="font-bold text-orange-600">32</span>
          </div>
        </div>
      </div>
    </nav>
  );
};
