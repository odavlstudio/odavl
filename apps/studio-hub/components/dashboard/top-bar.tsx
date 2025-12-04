'use client';

import { Search, HelpCircle } from 'lucide-react';
import { NotificationsBell } from './notifications-bell';

export function TopBar() {
  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      {/* Search */}
      <div className="flex-1 max-w-2xl">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search projects, issues, or documentation..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-4 ml-6">
        {/* Help */}
        <button
          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          title="Help & Documentation"
        >
          <HelpCircle className="h-5 w-5" />
        </button>

        {/* Notifications */}
        <NotificationsBell />

        {/* User Menu */}
        <button className="flex items-center gap-3 hover:bg-gray-100 rounded-lg p-2 transition-colors">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
            JD
          </div>
          <div className="text-left hidden md:block">
            <p className="text-sm font-medium text-gray-900">John Doe</p>
            <p className="text-xs text-gray-500">Pro Plan</p>
          </div>
        </button>
      </div>
    </header>
  );
}
