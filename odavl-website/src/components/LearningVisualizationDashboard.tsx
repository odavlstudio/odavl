'use client';

import React, { useState, useEffect } from 'react';
import { EvidenceTable } from './EvidenceTable';

import type { EvidenceRun } from '../types/ODAVLTypes';

export function LearningVisualizationDashboard() {
  const [runs, setRuns] = useState<EvidenceRun[]>([]);
  const [raw, setRaw] = useState<EvidenceRun[] | null>(null);
  const [loading, setLoading] = useState(true);
  // Auto-refresh every 15s
  useEffect(() => {
    async function refresh() {
      try {
        const res = await fetch('/api/evidence');
        const data = await res.json();
        setRuns(data.runs);
        setRaw(data.raw);
      } catch (err) {
        // Optionally log error for diagnostics
        if (process.env.NODE_ENV === 'development') {
          console.error('Failed to fetch evidence:', err);
          console.error('Failed to fetch evidence:', err);
        }
        setRuns([]);
        setRaw(null);
      }
      setLoading(false);
    }
    refresh();
    const timer = setInterval(refresh, 15000);
    return () => clearInterval(timer);
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center p-8"><div className="text-lg">Loading ODAVL Evidence...</div></div>;
  }

  return (
    <div className="space-y-6 p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">ODAVL Evidence Table</h1>
      <EvidenceTable runs={runs} raw={raw || undefined} />
      <div className="border-t pt-4 text-center text-sm text-muted-foreground">
        <p>ODAVL v2.0 • Autonomous Code Quality System • Last updated: {new Date().toLocaleString()}</p>
      </div>
    </div>
  );
}
