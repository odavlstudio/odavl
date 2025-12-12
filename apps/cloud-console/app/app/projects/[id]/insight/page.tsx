/**
 * Insight Issues UI
 * Displays error signatures with filters and details panel
 */

'use client';

import { useState, useEffect } from 'react';

interface Issue {
  id: string;
  detector: string;
  severity: string;
  message: string;
  file: string;
  line: number;
  count: number;
}

export default function InsightPage({ params }: { params: { id: string } }) {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [filters, setFilters] = useState({ severity: 'all', detector: 'all' });
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);

  useEffect(() => {
    fetchIssues();
  }, [params.id, filters]);

  const fetchIssues = async () => {
    const query = new URLSearchParams({
      severity: filters.severity,
      detector: filters.detector,
    });
    const res = await fetch(`/api/projects/${params.id}/insight/issues?${query}`);
    if (res.ok) {
      setIssues(await res.json());
    }
  };

  return (
    <div className="insight-page">
      <h1>Insight Issues</h1>

      <div className="filters">
        <select 
          value={filters.severity} 
          onChange={(e) => setFilters({...filters, severity: e.target.value})}
        >
          <option value="all">All Severities</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>

        <select 
          value={filters.detector} 
          onChange={(e) => setFilters({...filters, detector: e.target.value})}
        >
          <option value="all">All Detectors</option>
          <option value="typescript">TypeScript</option>
          <option value="eslint">ESLint</option>
          <option value="security">Security</option>
        </select>
      </div>

      <table className="issues-table">
        <thead>
          <tr>
            <th>Severity</th>
            <th>Detector</th>
            <th>Message</th>
            <th>File</th>
            <th>Count</th>
          </tr>
        </thead>
        <tbody>
          {issues.map((issue) => (
            <tr key={issue.id} onClick={() => setSelectedIssue(issue)}>
              <td>{issue.severity}</td>
              <td>{issue.detector}</td>
              <td>{issue.message}</td>
              <td>{issue.file}:{issue.line}</td>
              <td>{issue.count}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {selectedIssue && (
        <div className="issue-details">
          <h3>Issue Details</h3>
          <p><strong>File:</strong> {selectedIssue.file}:{selectedIssue.line}</p>
          <p><strong>Message:</strong> {selectedIssue.message}</p>
          <p><strong>Occurrences:</strong> {selectedIssue.count}</p>
        </div>
      )}
    </div>
  );
}
