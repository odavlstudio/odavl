/**
 * Autopilot Jobs UI
 * Displays job history with trust scores and decisions
 */

'use client';

import { useState, useEffect } from 'react';

interface AutopilotJob {
  id: string;
  startedAt: string;
  status: string;
  recipeName: string;
  trustScore: number;
  filesChanged: number;
  decision: string;
}

export default function AutopilotPage({ params }: { params: { id: string } }) {
  const [jobs, setJobs] = useState<AutopilotJob[]>([]);

  useEffect(() => {
    fetchJobs();
  }, [params.id]);

  const fetchJobs = async () => {
    const res = await fetch(`/api/projects/${params.id}/autopilot/jobs`);
    if (res.ok) {
      setJobs(await res.json());
    }
  };

  return (
    <div className="autopilot-page">
      <h1>Autopilot Jobs</h1>

      <table className="jobs-table">
        <thead>
          <tr>
            <th>Started</th>
            <th>Recipe</th>
            <th>Trust Score</th>
            <th>Files Changed</th>
            <th>Status</th>
            <th>Decision</th>
          </tr>
        </thead>
        <tbody>
          {jobs.map((job) => (
            <tr key={job.id}>
              <td>{new Date(job.startedAt).toLocaleString()}</td>
              <td>{job.recipeName}</td>
              <td>{(job.trustScore * 100).toFixed(1)}%</td>
              <td>{job.filesChanged}</td>
              <td>{job.status}</td>
              <td>{job.decision}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
