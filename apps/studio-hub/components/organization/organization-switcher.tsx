// Organization Switcher Component
// Week 2: Multi-Tenancy UI

'use client';

import { useState, Fragment } from 'react';
import { useOrganization } from '@/lib/context/organization';
import { Button } from '@/components/ui/button';
import { Check, ChevronDown, Plus } from 'lucide-react';

export function OrganizationSwitcher() {
  const { organization, isLoading } = useOrganization();
  const [isOpen, setIsOpen] = useState(false);
  
  if (isLoading || !organization) {
    return (
      <div className="w-48 h-10 bg-gray-200 animate-pulse rounded-lg" />
    );
  }
  
  return (
    <div className="relative">
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full justify-between"
      >
        <div className="flex items-center gap-3">
          {organization.logo ? (
            <img 
              src={organization.logo} 
              alt={organization.name}
              className="w-6 h-6 rounded"
            />
          ) : (
            <div className="w-6 h-6 rounded bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
              {organization.name.charAt(0).toUpperCase()}
            </div>
          )}
          <span className="font-medium truncate max-w-[120px]">
            {organization.name}
          </span>
        </div>
        <ChevronDown className="w-4 h-4 text-gray-500" />
      </Button>
      
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute left-0 right-0 top-full mt-2 z-20 bg-white rounded-lg shadow-xl border border-gray-200 py-2 min-w-[240px]">
            <div className="px-4 py-2 border-b border-gray-100">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Current Organization
              </p>
            </div>
            
            <div className="py-1">
              <div className="flex items-center justify-between px-4 py-2 bg-blue-50">
                <div className="flex items-center gap-3">
                  {organization.logo ? (
                    <img 
                      src={organization.logo} 
                      alt={organization.name}
                      className="w-8 h-8 rounded"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold">
                      {organization.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-sm">{organization.name}</p>
                    <p className="text-xs text-gray-500 capitalize">{organization.plan.toLowerCase()}</p>
                  </div>
                </div>
                <Check className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            
            <div className="border-t border-gray-100 mt-1 pt-1">
              <button
                onClick={() => {
                  setIsOpen(false);
                  // TODO: Navigate to create organization page
                  window.location.href = '/organizations/new';
                }}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition"
              >
                <div className="w-8 h-8 rounded border-2 border-dashed border-gray-300 flex items-center justify-center">
                  <Plus className="w-4 h-4 text-gray-400" />
                </div>
                <span>Create Organization</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
