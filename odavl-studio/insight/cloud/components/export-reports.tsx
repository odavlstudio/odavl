/**
 * Export Reports (PDF/CSV)
 * Generate and download reports in multiple formats
 * 
 * Week 11-12: Dashboard V2
 * UNIFIED_ACTION_PLAN Phase 2 Month 3
 */

'use client';

import { useState } from 'react';

export type ReportFormat = 'pdf' | 'csv' | 'json' | 'xlsx';

export type ReportType =
    | 'summary'
    | 'issues'
    | 'security'
    | 'autopilot'
    | 'guardian'
    | 'team-activity'
    | 'trends';

export interface ReportConfig {
    type: ReportType;
    format: ReportFormat;
    dateRange?: {
        start: Date;
        end: Date;
    };
    filters?: {
        severity?: string[];
        detectors?: string[];
        projects?: string[];
    };
    includeCharts?: boolean;
    includeRawData?: boolean;
}

export interface ExportReportsProps {
    projectId?: string;
    organizationId?: string;
}

export function ExportReports({ projectId, organizationId }: ExportReportsProps) {
    const [config, setConfig] = useState<ReportConfig>({
        type: 'summary',
        format: 'pdf',
        includeCharts: true,
        includeRawData: false,
    });

    const [isExporting, setIsExporting] = useState(false);
    const [showAdvanced, setShowAdvanced] = useState(false);

    const handleExport = async () => {
        setIsExporting(true);

        try {
            const queryParams = new URLSearchParams({
                type: config.type,
                format: config.format,
                ...(projectId && { projectId }),
                ...(organizationId && { organizationId }),
                ...(config.dateRange && {
                    startDate: config.dateRange.start.toISOString(),
                    endDate: config.dateRange.end.toISOString(),
                }),
                includeCharts: config.includeCharts?.toString() || 'false',
                includeRawData: config.includeRawData?.toString() || 'false',
            });

            if (config.filters) {
                if (config.filters.severity) {
                    queryParams.append('severity', config.filters.severity.join(','));
                }
                if (config.filters.detectors) {
                    queryParams.append('detectors', config.filters.detectors.join(','));
                }
                if (config.filters.projects) {
                    queryParams.append('projects', config.filters.projects.join(','));
                }
            }

            const response = await fetch(`/api/reports/export?${queryParams}`);

            if (!response.ok) {
                throw new Error('Export failed');
            }

            // Download file
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `odavl-report-${config.type}-${Date.now()}.${config.format}`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error('Export failed:', error);
            alert('Failed to export report');
        } finally {
            setIsExporting(false);
        }
    };

    const reportTypes = [
        { value: 'summary', label: 'Executive Summary', description: 'High-level overview of all metrics' },
        { value: 'issues', label: 'Issues Report', description: 'Detailed list of all issues found' },
        { value: 'security', label: 'Security Report', description: 'Security vulnerabilities and fixes' },
        { value: 'autopilot', label: 'Autopilot Report', description: 'Automated improvements history' },
        { value: 'guardian', label: 'Guardian Report', description: 'Pre-deploy testing results' },
        { value: 'team-activity', label: 'Team Activity', description: 'Team member contributions' },
        { value: 'trends', label: 'Trends Report', description: 'Historical trends and patterns' },
    ];

    const formats = [
        { value: 'pdf', label: 'PDF', icon: '📄', description: 'Formatted document with charts' },
        { value: 'csv', label: 'CSV', icon: '📊', description: 'Spreadsheet data' },
        { value: 'json', label: 'JSON', icon: '{ }', description: 'Raw data for integrations' },
        { value: 'xlsx', label: 'Excel', icon: '📈', description: 'Excel workbook' },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold mb-2">Export Reports</h2>
                <p className="text-muted-foreground">
                    Generate and download reports in your preferred format
                </p>
            </div>

            {/* Report Type Selection */}
            <div>
                <label className="block text-sm font-medium mb-3">Report Type</label>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {reportTypes.map(type => (
                        <button
                            key={type.value}
                            onClick={() => setConfig(prev => ({ ...prev, type: type.value as ReportType }))}
                            className={`border rounded-lg p-4 text-left transition-colors ${
                                config.type === type.value
                                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                                    : 'hover:bg-accent'
                            }`}
                        >
                            <h3 className="font-semibold mb-1">{type.label}</h3>
                            <p className="text-xs text-muted-foreground">{type.description}</p>
                        </button>
                    ))}
                </div>
            </div>

            {/* Format Selection */}
            <div>
                <label className="block text-sm font-medium mb-3">Export Format</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {formats.map(format => (
                        <button
                            key={format.value}
                            onClick={() => setConfig(prev => ({ ...prev, format: format.value as ReportFormat }))}
                            className={`border rounded-lg p-4 text-center transition-colors ${
                                config.format === format.value
                                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                                    : 'hover:bg-accent'
                            }`}
                        >
                            <div className="text-3xl mb-2">{format.icon}</div>
                            <div className="font-semibold">{format.label}</div>
                            <div className="text-xs text-muted-foreground mt-1">{format.description}</div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Quick Options */}
            <div className="border rounded-lg p-4 space-y-3">
                <label className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        checked={config.includeCharts || false}
                        onChange={e =>
                            setConfig(prev => ({ ...prev, includeCharts: e.target.checked }))
                        }
                        className="rounded"
                    />
                    <span className="text-sm">Include charts and visualizations</span>
                </label>

                <label className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        checked={config.includeRawData || false}
                        onChange={e =>
                            setConfig(prev => ({ ...prev, includeRawData: e.target.checked }))
                        }
                        className="rounded"
                    />
                    <span className="text-sm">Include raw data tables</span>
                </label>
            </div>

            {/* Advanced Options Toggle */}
            <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="text-sm text-blue-600 hover:underline"
            >
                {showAdvanced ? '− Hide' : '+ Show'} advanced options
            </button>

            {showAdvanced && (
                <div className="border rounded-lg p-4 space-y-4">
                    {/* Date Range */}
                    <div>
                        <label className="block text-sm font-medium mb-2">Date Range</label>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs mb-1">Start Date</label>
                                <input
                                    type="date"
                                    className="w-full border rounded px-3 py-2"
                                    onChange={e => {
                                        const start = new Date(e.target.value);
                                        setConfig(prev => ({
                                            ...prev,
                                            dateRange: {
                                                start,
                                                end: prev.dateRange?.end || new Date(),
                                            },
                                        }));
                                    }}
                                />
                            </div>
                            <div>
                                <label className="block text-xs mb-1">End Date</label>
                                <input
                                    type="date"
                                    className="w-full border rounded px-3 py-2"
                                    onChange={e => {
                                        const end = new Date(e.target.value);
                                        setConfig(prev => ({
                                            ...prev,
                                            dateRange: {
                                                start: prev.dateRange?.start || new Date(),
                                                end,
                                            },
                                        }));
                                    }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Filters */}
                    <div>
                        <label className="block text-sm font-medium mb-2">Filters</label>
                        <div className="space-y-2">
                            <select
                                className="w-full border rounded px-3 py-2"
                                onChange={e => {
                                    const value = e.target.value;
                                    setConfig(prev => ({
                                        ...prev,
                                        filters: {
                                            ...prev.filters,
                                            severity: value ? [value] : undefined,
                                        },
                                    }));
                                }}
                            >
                                <option value="">All severities</option>
                                <option value="critical">Critical</option>
                                <option value="high">High</option>
                                <option value="medium">Medium</option>
                                <option value="low">Low</option>
                            </select>
                        </div>
                    </div>
                </div>
            )}

            {/* Export Button */}
            <button
                onClick={handleExport}
                disabled={isExporting}
                className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isExporting ? 'Exporting...' : `Export ${formats.find(f => f.value === config.format)?.label} Report`}
            </button>

            {/* Info */}
            <div className="text-xs text-muted-foreground text-center">
                Reports are generated on-demand and will download automatically when ready.
                <br />
                Large reports may take a few moments to generate.
            </div>
        </div>
    );
}
