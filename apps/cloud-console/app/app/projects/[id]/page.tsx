/**
 * Unified Project Dashboard
 * Shows last scan/run/action from Insight, Guardian, and Autopilot
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface ProjectDashboard {
  projectId: string;
  projectName: string;
  lastInsightScan?: { date: string; issuesFound: number };
  lastGuardianRun?: { date: string; status: string };
  lastAutopilotJob?: { date: string; filesChanged: number };
  usageSummary: { testRuns: number; analyses: number };
  healthScore: number;
}

export default function ProjectDashboardPage({ params }: { params: { id: string } }) {
  const [dashboard, setDashboard] = useState<ProjectDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, [params.id]);

  const fetchDashboard = async () => {
    const res = await fetch(`/api/projects/${params.id}/dashboard`);
    if (res.ok) {
      setDashboard(await res.json());
    }
    setLoading(false);
  };

  if (loading) return <div>Loading project dashboard...</div>;
  if (!dashboard) return <div>Project not found</div>;

  return (
    <div className="project-dashboard">
      <h1>{dashboard.projectName}</h1>

      <div className="health-indicator">
        <h2>Health Score: {dashboard.healthScore}%</h2>
      </div>

      <div className="product-cards">
        <Link href={`/app/projects/${params.id}/insight`} className="card">
          <h3>ODAVL Insight</h3>
          {dashboard.lastInsightScan ? (
            <>
              <p>Last scan: {new Date(dashboard.lastInsightScan.date).toLocaleDateString()}</p>
              <p>Issues found: {dashboard.lastInsightScan.issuesFound}</p>
            </>
          ) : (
            <p>No scans yet</p>
          )}
        </Link>

        <Link href={`/app/projects/${params.id}/guardian`} className="card">
          <h3>ODAVL Guardian</h3>
          {dashboard.lastGuardianRun ? (
            <>
              <p>Last run: {new Date(dashboard.lastGuardianRun.date).toLocaleDateString()}</p>
              <p>Status: {dashboard.lastGuardianRun.status}</p>
            </>
          ) : (
            <p>No tests yet</p>
          )}
        </Link>

        <Link href={`/app/projects/${params.id}/autopilot`} className="card">
          <h3>ODAVL Autopilot</h3>
          {dashboard.lastAutopilotJob ? (
            <>
              <p>Last job: {new Date(dashboard.lastAutopilotJob.date).toLocaleDateString()}</p>
              <p>Files changed: {dashboard.lastAutopilotJob.filesChanged}</p>
            </>
          ) : (
            <p>No jobs yet</p>
          )}
        </Link>
      </div>

      <div className="usage-summary">
        <h3>Usage Summary</h3>
        <p>Test runs: {dashboard.usageSummary.testRuns}</p>
        <p>Analyses: {dashboard.usageSummary.analyses}</p>
      </div>
    </div>
  );
}
