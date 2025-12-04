'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Home, Lightbulb, Rocket, ShieldCheck, Settings as Cog6ToothIcon, BarChart, Key, Users, Folder, Shield, Bell } from 'lucide-react';
import { cn } from '@/lib/utils';

const navigation = [
  {
    name: 'Overview',
    href: '/dashboard',
    icon: Home,
    description: 'Dashboard overview and quick stats',
  },
  {
    name: 'Insight',
    href: '/dashboard/insight',
    icon: Lightbulb,
    description: 'ML-powered error detection',
  },
  {
    name: 'Autopilot',
    href: '/dashboard/autopilot',
    icon: Rocket,
    description: 'Self-healing code infrastructure',
  },
  {
    name: 'Guardian',
    href: '/dashboard/guardian',
    icon: ShieldCheck,
    description: 'Pre-deploy testing',
  },
  {
    name: 'Analytics',
    href: '/dashboard/analytics',
    icon: BarChart,
    description: 'Usage metrics and insights',
  },
];

const secondaryNavigation = [
  {
    name: 'Projects',
    href: '/dashboard/projects',
    icon: Folder,
  },
  {
    name: 'Team',
    href: '/dashboard/team',
    icon: Users,
  },
  {
    name: 'Notifications',
    href: '/dashboard/notifications',
    icon: Bell,
  },
  {
    name: 'Permissions',
    href: '/dashboard/permissions',
    icon: Shield,
  },
  {
    name: 'API Keys',
    href: '/dashboard/api-keys',
    icon: Key,
  },
  {
    name: 'Settings',
    href: '/dashboard/settings',
    icon: Cog6ToothIcon,
  },
];

export function Sidebar() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (!pathname) return false;
    if (href === '/dashboard') {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    <aside className="w-64 bg-gray-900 text-white flex flex-col">
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-gray-800">
        <Link href="/dashboard" className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">O</span>
          </div>
          <span className="font-bold text-lg">ODAVL Studio</span>
        </Link>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        <div className="space-y-1">
          {navigation.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200',
                  active
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                )}
                title={item.description}
              >
                <item.icon
                  className={cn(
                    'mr-3 h-5 w-5 flex-shrink-0',
                    active
                      ? 'text-white'
                      : 'text-gray-400 group-hover:text-white'
                  )}
                />
                {item.name}
              </Link>
            );
          })}
        </div>

        {/* Divider */}
        <div className="pt-6 pb-2">
          <div className="border-t border-gray-800" />
        </div>

        {/* Secondary Navigation */}
        <div className="space-y-1">
          {secondaryNavigation.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200',
                  active
                    ? 'bg-gray-800 text-white'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                )}
              >
                <item.icon
                  className={cn(
                    'mr-3 h-5 w-5 flex-shrink-0',
                    active
                      ? 'text-white'
                      : 'text-gray-500 group-hover:text-gray-300'
                  )}
                />
                {item.name}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-800">
        <div className="text-xs text-gray-500 text-center">
          v2.0.0 • <Link href="/docs" className="hover:text-gray-300">Docs</Link>
        </div>
      </div>
    </aside>
  );
}
