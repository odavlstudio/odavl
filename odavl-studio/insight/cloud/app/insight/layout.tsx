/**
 * Insight Section Layout
 * Provides consistent navigation for Insight-specific pages
 */

import { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function InsightLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Insight Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">
              <Link 
                href="/dashboard" 
                className="text-lg font-bold text-gray-900"
              >
                ODAVL Insight
              </Link>
              
              <div className="flex items-center gap-4">
                <NavLink href="/insight/projects">
                  Projects
                </NavLink>
                <NavLink href="/dashboard/analysis">
                  Dashboard
                </NavLink>
                <NavLink href="/dashboard/reports">
                  Reports
                </NavLink>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Link
                href="/dashboard/billing"
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Billing
              </Link>
              <Link
                href="/dashboard"
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Dashboard
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main>{children}</main>
    </div>
  );
}

function NavLink({ href, children }: { href: string; children: ReactNode }) {
  // Note: usePathname() requires 'use client', so we'll use a simpler approach
  return (
    <Link
      href={href}
      className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
    >
      {children}
    </Link>
  );
}
