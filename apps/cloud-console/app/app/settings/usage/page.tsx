/**
 * Usage Breakdown Page
 * Shows detailed usage metrics and history
 */

'use client';

import { useState, useEffect } from 'react';

interface UsageData {
  eventType: string;
  count: number;
  lastUsed: string;
}

export default function UsagePage() {
  const [usage, setUsage] = useState<UsageData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsage();
  }, []);

  const fetchUsage = async () => {
    const res = await fetch('/api/usage/breakdown');
    if (res.ok) {
      setUsage(await res.json());
    }
    setLoading(false);
  };

  if (loading) return <div>Loading usage data...</div>;

  return (
    <div className="usage-page">
      <h1>Usage Breakdown</h1>

      <table>
        <thead>
          <tr>
            <th>Event Type</th>
            <th>Count</th>
            <th>Last Used</th>
          </tr>
        </thead>
        <tbody>
          {usage.map((item) => (
            <tr key={item.eventType}>
              <td>{item.eventType}</td>
              <td>{item.count}</td>
              <td>{new Date(item.lastUsed).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
