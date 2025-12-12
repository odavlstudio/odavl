'use client';

import { useState } from 'react';
import { useOrganizations, useSwitchOrganization } from '@/lib/api-hooks';
import { useRouter } from 'next/navigation';

export function OrganizationSelector() {
  const router = useRouter();
  const { data: organizations, loading } = useOrganizations();
  const { mutate: switchOrg, loading: switching } = useSwitchOrganization();
  const [isOpen, setIsOpen] = useState(false);

  // Current organization (first one for now - could be enhanced to store in session)
  const currentOrg = organizations?.[0];

  const handleSwitch = async (orgId: string) => {
    try {
      await switchOrg(orgId);
      setIsOpen(false);
      // Refresh page to update organization context
      router.refresh();
    } catch (error) {
      alert('Failed to switch organization');
    }
  };

  if (loading || !organizations || organizations.length === 0) {
    return null;
  }

  // If user only has one organization, show static display
  if (organizations.length === 1) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-md">
        <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center text-white text-xs font-semibold">
          {currentOrg?.name.charAt(0).toUpperCase()}
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-medium text-gray-900">{currentOrg?.name}</span>
          <span className="text-xs text-gray-500">{currentOrg?.role}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={switching}
        className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
      >
        <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center text-white text-xs font-semibold">
          {currentOrg?.name.charAt(0).toUpperCase()}
        </div>
        <div className="flex flex-col items-start">
          <span className="text-sm font-medium text-gray-900">{currentOrg?.name}</span>
          <span className="text-xs text-gray-500">{currentOrg?.role}</span>
        </div>
        <svg
          className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />

          {/* Dropdown */}
          <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-20">
            <div className="px-3 py-2 border-b border-gray-200">
              <p className="text-xs font-medium text-gray-500 uppercase">Organizations</p>
            </div>
            {organizations.map((org) => (
              <button
                key={org.id}
                onClick={() => handleSwitch(org.id)}
                disabled={switching}
                className={`w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-50 transition-colors ${
                  org.id === currentOrg?.id ? 'bg-blue-50' : ''
                }`}
              >
                <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white text-sm font-semibold">
                  {org.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 flex flex-col items-start">
                  <span className="text-sm font-medium text-gray-900">{org.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">{org.role}</span>
                    <span className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-700 rounded">
                      {org.tier}
                    </span>
                  </div>
                </div>
                {org.id === currentOrg?.id && (
                  <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
