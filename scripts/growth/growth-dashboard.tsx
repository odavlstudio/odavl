// Growth metrics dashboard component
import React from 'react';

export function GrowthDashboard({ metrics }: { metrics: any }) {
  return (
    <div className="grid grid-cols-4 gap-4">
      <MetricCard title="Signups" value={metrics.signups} change="+12%" />
      <MetricCard title="Conversions" value={metrics.conversions} change="+8%" />
      <MetricCard title="MRR" value={`$${metrics.mrr}`} change="+15%" />
      <MetricCard title="K-Factor" value={metrics.kFactor} change="+0.2" />
    </div>
  );
}

function MetricCard({ title, value, change }: any) {
  return (
    <div className="border rounded p-4">
      <h3 className="text-sm text-gray-600">{title}</h3>
      <p className="text-2xl font-bold">{value}</p>
      <span className="text-green-600">{change}</span>
    </div>
  );
}
