/**
 * Fusion Weights Chart Component
 * Phase Ω-P1: Visualize current fusion weights distribution
 */

'use client';

import { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const COLORS = ['#2563eb', '#7c3aed', '#dc2626', '#16a34a', '#ea580c'];

export function FusionWeightsChart() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/brain/weights')
      .then((res) => res.json())
      .then((json) => {
        const chartData = [
          { name: 'Neural Network', value: json.weights.nn * 100 },
          { name: 'LSTM', value: json.weights.lstm * 100 },
          { name: 'Multi-Task Learning', value: json.weights.mtl * 100 },
          { name: 'Bayesian Confidence', value: json.weights.bayesian * 100 },
          { name: 'Heuristic', value: json.weights.heuristic * 100 },
        ];
        setData(chartData);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load weights:', err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className="h-80 bg-muted rounded-lg animate-pulse" />;
  }

  return (
    <div className="border rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-4">Fusion Weights Distribution</h2>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, value }) => `${name}: ${value.toFixed(0)}%`}
            outerRadius={100}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
