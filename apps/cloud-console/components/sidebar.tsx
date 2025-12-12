'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';

export default function Sidebar() {
  const pathname = usePathname();
  
  const menuItems = [
    { label: 'Dashboard', icon: '📊', href: '/app/dashboard' },
    { label: 'Projects', icon: '📁', href: '/app/projects' },
    { label: 'Usage & Limits', icon: '📈', href: '/app/usage' },
    { label: 'Marketplace', icon: '🛒', href: '/app/marketplace' },
    { label: 'Intelligence', icon: '🧠', href: '/app/intelligence' },
    { label: 'Simulation', icon: '▶️', href: '/app/simulation' },
    { label: 'Settings', icon: '⚙️', href: '/app/settings' },
  ];

  return (
    <aside className="w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 min-h-screen p-6 hidden lg:block">
      <div className="mb-10">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          ODAVL
        </h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Cloud Console</p>
      </div>

      <nav className="space-y-1">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 ${
                isActive 
                  ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 font-semibold shadow-sm' 
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span className="text-sm">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto pt-8 border-t border-gray-200 dark:border-gray-800 absolute bottom-6 left-6 right-6">
        <button className="w-full flex items-center gap-3 px-4 py-2.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all duration-200">
          <span className="text-lg">🚪</span>
          <span className="text-sm font-medium">Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
