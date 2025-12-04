/**
 * Export Utilities
 * Week 10 Day 2: Charts & Visualizations
 * 
 * Utilities for exporting dashboard data as CSV/JSON.
 */

import type { DashboardSummary } from './types';

/**
 * Convert array of objects to CSV string
 */
export function arrayToCSV<T extends Record<string, any>>(data: T[]): string {
  if (!data || data.length === 0) return '';

  // Get headers from first object
  const headers = Object.keys(data[0]);
  
  // Create CSV header row
  const csvHeaders = headers.join(',');
  
  // Create CSV data rows
  const csvRows = data.map(row => {
    return headers.map(header => {
      const value = row[header];
      
      // Handle different value types
      if (value === null || value === undefined) return '';
      if (typeof value === 'string') {
        // Escape quotes and wrap in quotes if contains comma
        const escaped = value.replace(/"/g, '""');
        return value.includes(',') ? `"${escaped}"` : escaped;
      }
      
      return value.toString();
    }).join(',');
  });
  
  return [csvHeaders, ...csvRows].join('\n');
}

/**
 * Download CSV file
 */
export function downloadCSV(filename: string, csvContent: string): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

/**
 * Download JSON file
 */
export function downloadJSON(filename: string, data: any): void {
  const jsonContent = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

/**
 * Export dashboard summary as CSV
 */
export function exportDashboardCSV(summary: DashboardSummary): void {
  const timestamp = new Date().toISOString().split('T')[0];
  
  // Create simplified export data
  const exportData = [
    {
      metric: 'Health Score',
      value: summary.healthScore.score,
      trend: summary.healthScore.trend,
      date: summary.generatedAt
    },
    {
      metric: 'Total Issues',
      value: summary.issues.total,
      trend: `${summary.issueTrend.change.toFixed(1)}%`,
      date: summary.generatedAt
    },
    {
      metric: 'Critical Issues',
      value: summary.issues.critical,
      trend: '',
      date: summary.generatedAt
    },
    {
      metric: 'High Issues',
      value: summary.issues.high,
      trend: '',
      date: summary.generatedAt
    },
    {
      metric: 'Total Analyses',
      value: summary.analysis.totalAnalyses,
      trend: `${summary.analysis.successRate}% success`,
      date: summary.generatedAt
    },
    {
      metric: 'Active Users',
      value: summary.team.activeUsers,
      trend: '',
      date: summary.generatedAt
    }
  ];
  
  const csv = arrayToCSV(exportData);
  downloadCSV(`odavl-dashboard-${timestamp}.csv`, csv);
}

/**
 * Export dashboard summary as JSON
 */
export function exportDashboardJSON(summary: DashboardSummary): void {
  const timestamp = new Date().toISOString().split('T')[0];
  downloadJSON(`odavl-dashboard-${timestamp}.json`, summary);
}

/**
 * Export issues list as CSV
 */
export function exportIssuesCSV(summary: DashboardSummary): void {
  const timestamp = new Date().toISOString().split('T')[0];
  
  const issuesData = summary.topIssues.map(issue => ({
    id: issue.id,
    title: issue.title,
    severity: issue.severity,
    occurrences: issue.occurrences,
    files: issue.files,
    firstSeen: new Date(issue.firstSeen).toLocaleDateString(),
    lastSeen: new Date(issue.lastSeen).toLocaleDateString()
  }));
  
  const csv = arrayToCSV(issuesData);
  downloadCSV(`odavl-issues-${timestamp}.csv`, csv);
}

/**
 * Export chart data as CSV
 */
export function exportChartDataCSV(chartName: string, data: any[]): void {
  const timestamp = new Date().toISOString().split('T')[0];
  const csv = arrayToCSV(data);
  const filename = `odavl-${chartName.toLowerCase().replace(/\s+/g, '-')}-${timestamp}.csv`;
  downloadCSV(filename, csv);
}
