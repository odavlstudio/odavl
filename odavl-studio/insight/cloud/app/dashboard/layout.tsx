'use client';

import { useRequireAuth } from '@/lib/auth/AuthContext';
import { useState, useEffect } from 'react';
import WelcomeModal from '@/components/WelcomeModal';
import { useRouter } from 'next/navigation';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, logout } = useRequireAuth();
  const router = useRouter();
  const [showWelcome, setShowWelcome] = useState(false);

  // Check if user is new (created within last 5 minutes)
  useEffect(() => {
    if (user) {
      const createdAt = new Date(user.createdAt || 0).getTime();
      const now = Date.now();
      const fiveMinutes = 5 * 60 * 1000;

      // Show welcome modal for new users (only once per session)
      const hasSeenWelcome = sessionStorage.getItem('hasSeenWelcome');
      if (now - createdAt < fiveMinutes && !hasSeenWelcome) {
        setShowWelcome(true);
        sessionStorage.setItem('hasSeenWelcome', 'true');
      }
    }
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Redirecting in useRequireAuth
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">ODAVL Insight</h1>
          <div className="flex items-center gap-4">
            <a
              href="/dashboard/billing"
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Billing
            </a>
            <span className="text-gray-700">{user.email}</span>
            <button
              onClick={() => {
                logout();
                router.push('/login');
              }}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main>{children}</main>

      {/* Welcome Modal */}
      {showWelcome && (
        <WelcomeModal
          userName={user.name}
          onClose={() => setShowWelcome(false)}
        />
      )}
    </div>
  );
}
