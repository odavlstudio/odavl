'use client';

import React from 'react';

const BrandTokens: React.FC = () => {
  const colorSections = [
    {
      name: 'Primary Blue',
      colors: [
        { shade: '500', value: '#3b82f6', name: 'primary-500' },
        { shade: '600', value: '#2563eb', name: 'primary-600' },
        { shade: '700', value: '#1d4ed8', name: 'primary-700' },
        { shade: '800', value: '#1e40af', name: 'primary-800' },
        { shade: '900', value: '#1e3a8a', name: 'primary-900' },
      ]
    },
    {
      name: 'Secondary Cyan',
      colors: [
        { shade: '400', value: '#38bdf8', name: 'secondary-400' },
        { shade: '500', value: '#0ea5e9', name: 'secondary-500' },
        { shade: '600', value: '#0284c7', name: 'secondary-600' },
      ]
    },
    {
      name: 'Accent Teal',
      colors: [
        { shade: '400', value: '#22d3ee', name: 'accent-400' },
        { shade: '500', value: '#06b6d4', name: 'accent-500' },
        { shade: '600', value: '#0891b2', name: 'accent-600' },
      ]
    },
    {
      name: 'Success Green',
      colors: [
        { shade: '400', value: '#34d399', name: 'success-400' },
        { shade: '500', value: '#10b981', name: 'success-500' },
        { shade: '600', value: '#059669', name: 'success-600' },
      ]
    },
    {
      name: 'Warning Amber',
      colors: [
        { shade: '400', value: '#fbbf24', name: 'warning-400' },
        { shade: '500', value: '#f59e0b', name: 'warning-500' },
        { shade: '600', value: '#d97706', name: 'warning-600' },
      ]
    },
    {
      name: 'Neutral Slate',
      colors: [
        { shade: '300', value: '#cbd5e1', name: 'neutral-300' },
        { shade: '500', value: '#64748b', name: 'neutral-500' },
        { shade: '700', value: '#334155', name: 'neutral-700' },
        { shade: '800', value: '#1e293b', name: 'neutral-800' },
        { shade: '900', value: '#0f172a', name: 'neutral-900' },
      ]
    }
  ];

  return (
    <div className="p-8 bg-white min-h-screen">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-neutral-900 mb-2">
          ODAVL Studio Brand Tokens
        </h1>
        <p className="text-neutral-600 mb-8">
          Visual identity system for autonomous code quality platform
        </p>

        <div className="grid gap-8">
          {colorSections.map((section) => (
            <div key={section.name} className="space-y-4">
              <h2 className="text-2xl font-semibold text-neutral-800">
                {section.name}
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {section.colors.map((color) => (
                  <div key={color.name} className="space-y-2">
                    <div
                      className="w-full h-20 rounded-lg shadow-sm border border-neutral-200"
                      style={{ backgroundColor: color.value }}
                    />
                    <div className="text-sm">
                      <div className="font-medium text-neutral-900">
                        {color.shade}
                      </div>
                      <div className="font-mono text-xs text-neutral-600">
                        {color.value}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 p-6 bg-neutral-50 rounded-lg">
          <h2 className="text-2xl font-semibold text-neutral-800 mb-4">
            Typography Preview
          </h2>
          <div className="space-y-4">
            <div className="text-5xl font-bold text-primary-900">
              ODAVL Studio
            </div>
            <div className="text-2xl font-semibold text-neutral-700">
              Autonomous Code Quality Platform
            </div>
            <div className="text-lg text-neutral-600 max-w-2xl">
              Observe • Decide • Act • Verify • Learn — Transform your codebase 
              with intelligent, autonomous quality improvements backed by enterprise-grade 
              safety controls.
            </div>
            <div className="font-mono text-sm text-accent-600 bg-neutral-800 p-3 rounded">
              npx @odavl/cli run --auto-fix --verify-gates
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BrandTokens;