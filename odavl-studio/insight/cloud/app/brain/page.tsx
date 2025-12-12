/**
 * ODAVL Studio Cloud - Brain Analytics Dashboard
 * Phase Ω-P1: Web-based Brain analytics with real-time metrics
 */

import { Suspense } from 'react';
import { BrainMetricsCards } from '@/components/brain/brain-metrics-cards';
import { ConfidenceTimeline } from '@/components/brain/confidence-timeline';
import { FusionWeightsChart } from '@/components/brain/fusion-weights-chart';

export default async function BrainDashboardPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <header className="mb-8">
        <h1 className="text-4xl font-bold mb-2">🧠 ODAVL Brain Analytics</h1>
        <p className="text-muted-foreground">
          ML-powered deployment confidence with 5-model ensemble fusion
        </p>
      </header>

      {/* Metrics Cards */}
      <Suspense fallback={<MetricsCardsSkeleton />}>
        <BrainMetricsCards />
      </Suspense>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        {/* Confidence Timeline */}
        <Suspense fallback={<ChartSkeleton />}>
          <ConfidenceTimeline />
        </Suspense>

        {/* Fusion Weights */}
        <Suspense fallback={<ChartSkeleton />}>
          <FusionWeightsChart />
        </Suspense>
      </div>

      {/* Recent Predictions Table */}
      <Suspense fallback={<TableSkeleton />}>
        <RecentPredictions />
      </Suspense>
    </div>
  );
}

function MetricsCardsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-32 bg-muted rounded-lg animate-pulse" />
      ))}
    </div>
  );
}

function ChartSkeleton() {
  return <div className="h-80 bg-muted rounded-lg animate-pulse" />;
}

function TableSkeleton() {
  return <div className="h-64 bg-muted rounded-lg animate-pulse mt-8" />;
}

async function RecentPredictions() {
  return (
    <div className="mt-8 border rounded-lg p-6">
      <h2 className="text-2xl font-semibold mb-4">Recent Predictions</h2>
      <p className="text-muted-foreground">No predictions yet. Run an analysis to see results.</p>
    </div>
  );
}
