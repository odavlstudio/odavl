/**
 * Confidence Timeline Chart Component
 * Phase Ω-P1: Visualize Brain confidence over time
 */

'use client';

import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export function ConfidenceTimeline() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/brain/history?limit=20')
      .then((res) => res.json())
      .then((json) => {
        const chartData = json.samples.map((s: any) => ({
          timestamp: new Date(s.timestamp).toLocaleTimeString(),
          confidence: s.confidence,
          canDeploy: s.canDeploy ? 100 : 0,
        }));
        setData(chartData);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load timeline:', err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className="h-80 bg-muted rounded-lg animate-pulse" />;
  }

  return (
    <div className="border rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-4">Confidence Timeline</h2>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="timestamp" />
          <YAxis domain={[0, 100]} />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="confidence" stroke="#2563eb" strokeWidth={2} name="Confidence %" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
