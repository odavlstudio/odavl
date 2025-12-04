'use client';

import React from 'react';
import { useEffect, useState } from 'react';

/**
 * Overview Dashboard
 * All detected issues across 7 languages
 */
export default function OverviewPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch data for Overview Dashboard
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await fetch('/api/insight/overview');
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error('Error fetching overview data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            📊 Overview Dashboard
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            All detected issues across 7 languages
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Features Grid */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-2">
            
            <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Multi-language issue summary
                </h3>
                <div className="mt-4">
                  {/* Feature implementation here */}
                </div>
              </div>
            </div>
            
            
            <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Detection statistics by language
                </h3>
                <div className="mt-4">
                  {/* Feature implementation here */}
                </div>
              </div>
            </div>
            
            
            <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Recent detections timeline
                </h3>
                <div className="mt-4">
                  {/* Feature implementation here */}
                </div>
              </div>
            </div>
            
            
            <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Quick action buttons
                </h3>
                <div className="mt-4">
                  {/* Feature implementation here */}
                </div>
              </div>
            </div>
            
          </div>
        </div>
      </main>
    </div>
  );
}