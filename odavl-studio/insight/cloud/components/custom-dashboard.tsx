/**
 * Custom Dashboard Builder
 * Drag-and-drop dashboard customization
 * 
 * Week 11-12: Dashboard V2
 * UNIFIED_ACTION_PLAN Phase 2 Month 3
 */

'use client';

import { useState } from 'react';

export type WidgetType =
    | 'metrics-overview'
    | 'issues-chart'
    | 'security-scan'
    | 'autopilot-activity'
    | 'guardian-status'
    | 'team-activity'
    | 'recent-scans'
    | 'code-coverage';

export interface Widget {
    id: string;
    type: WidgetType;
    title: string;
    position: { x: number; y: number };
    size: { width: number; height: number };
    settings?: Record<string, any>;
}

export interface Dashboard {
    id: string;
    name: string;
    description?: string;
    widgets: Widget[];
    layout: 'grid' | 'masonry';
    createdAt: Date;
    updatedAt: Date;
}

const AVAILABLE_WIDGETS: Record<WidgetType, { title: string; description: string; defaultSize: { width: number; height: number } }> = {
    'metrics-overview': {
        title: 'Metrics Overview',
        description: 'Key metrics and KPIs at a glance',
        defaultSize: { width: 2, height: 1 },
    },
    'issues-chart': {
        title: 'Issues Chart',
        description: 'Visual representation of issues over time',
        defaultSize: { width: 2, height: 2 },
    },
    'security-scan': {
        title: 'Security Scan',
        description: 'Latest security scan results',
        defaultSize: { width: 1, height: 1 },
    },
    'autopilot-activity': {
        title: 'Autopilot Activity',
        description: 'Recent autopilot runs and improvements',
        defaultSize: { width: 2, height: 1 },
    },
    'guardian-status': {
        title: 'Guardian Status',
        description: 'Pre-deploy testing status',
        defaultSize: { width: 1, height: 1 },
    },
    'team-activity': {
        title: 'Team Activity',
        description: 'Recent team member activities',
        defaultSize: { width: 1, height: 2 },
    },
    'recent-scans': {
        title: 'Recent Scans',
        description: 'Latest analysis scans',
        defaultSize: { width: 2, height: 1 },
    },
    'code-coverage': {
        title: 'Code Coverage',
        description: 'Test coverage statistics',
        defaultSize: { width: 1, height: 1 },
    },
};

export interface CustomDashboardProps {
    initialDashboard?: Dashboard;
    onSave?: (dashboard: Dashboard) => Promise<void>;
}

export function CustomDashboard({ initialDashboard, onSave }: CustomDashboardProps) {
    const [dashboard, setDashboard] = useState<Dashboard>(
        initialDashboard || {
            id: `dashboard_${Date.now()}`,
            name: 'My Dashboard',
            widgets: [],
            layout: 'grid',
            createdAt: new Date(),
            updatedAt: new Date(),
        }
    );

    const [isEditing, setIsEditing] = useState(false);
    const [showWidgetPicker, setShowWidgetPicker] = useState(false);
    const [saving, setSaving] = useState(false);

    const addWidget = (type: WidgetType) => {
        const widgetInfo = AVAILABLE_WIDGETS[type];
        const newWidget: Widget = {
            id: `widget_${Date.now()}_${Math.random().toString(36).slice(2)}`,
            type,
            title: widgetInfo.title,
            position: { x: 0, y: dashboard.widgets.length },
            size: widgetInfo.defaultSize,
        };

        setDashboard(prev => ({
            ...prev,
            widgets: [...prev.widgets, newWidget],
            updatedAt: new Date(),
        }));

        setShowWidgetPicker(false);
    };

    const removeWidget = (widgetId: string) => {
        setDashboard(prev => ({
            ...prev,
            widgets: prev.widgets.filter(w => w.id !== widgetId),
            updatedAt: new Date(),
        }));
    };

    const updateWidget = (widgetId: string, updates: Partial<Widget>) => {
        setDashboard(prev => ({
            ...prev,
            widgets: prev.widgets.map(w =>
                w.id === widgetId ? { ...w, ...updates } : w
            ),
            updatedAt: new Date(),
        }));
    };

    const handleSave = async () => {
        if (!onSave) return;

        setSaving(true);
        try {
            await onSave(dashboard);
            setIsEditing(false);
        } catch (error) {
            console.error('Failed to save dashboard:', error);
            alert('Failed to save dashboard');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">{dashboard.name}</h1>
                    {dashboard.description && (
                        <p className="text-muted-foreground">{dashboard.description}</p>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    {isEditing ? (
                        <>
                            <button
                                onClick={() => setShowWidgetPicker(true)}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            >
                                + Add Widget
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                            >
                                {saving ? 'Saving...' : 'Save'}
                            </button>
                            <button
                                onClick={() => setIsEditing(false)}
                                className="px-4 py-2 border rounded-lg hover:bg-accent"
                            >
                                Cancel
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={() => setIsEditing(true)}
                            className="px-4 py-2 border rounded-lg hover:bg-accent"
                        >
                            Edit Dashboard
                        </button>
                    )}
                </div>
            </div>

            {/* Dashboard Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {dashboard.widgets.map(widget => (
                    <WidgetContainer
                        key={widget.id}
                        widget={widget}
                        isEditing={isEditing}
                        onRemove={() => removeWidget(widget.id)}
                        onUpdate={updates => updateWidget(widget.id, updates)}
                    />
                ))}

                {dashboard.widgets.length === 0 && !isEditing && (
                    <div className="col-span-full border-2 border-dashed rounded-lg p-12 text-center">
                        <p className="text-lg font-medium mb-2">No widgets yet</p>
                        <p className="text-sm text-muted-foreground mb-4">
                            Click &quot;Edit Dashboard&quot; to add widgets
                        </p>
                    </div>
                )}
            </div>

            {/* Widget Picker Modal */}
            {showWidgetPicker && (
                <WidgetPickerModal
                    onSelect={addWidget}
                    onClose={() => setShowWidgetPicker(false)}
                />
            )}
        </div>
    );
}

interface WidgetContainerProps {
    widget: Widget;
    isEditing: boolean;
    onRemove: () => void;
    onUpdate: (updates: Partial<Widget>) => void;
}

function WidgetContainer({ widget, isEditing, onRemove, onUpdate }: WidgetContainerProps) {
    const gridColSpan = `md:col-span-${Math.min(widget.size.width, 3)}`;
    const gridRowSpan = `md:row-span-${widget.size.height}`;

    return (
        <div className={`border rounded-lg p-4 ${gridColSpan} ${gridRowSpan} relative`}>
            {isEditing && (
                <button
                    onClick={onRemove}
                    className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full hover:bg-red-600"
                >
                    ×
                </button>
            )}

            <h3 className="font-semibold mb-4">{widget.title}</h3>

            {/* Widget Content (placeholder) */}
            <div className="h-48 bg-muted rounded flex items-center justify-center">
                <p className="text-muted-foreground">
                    {AVAILABLE_WIDGETS[widget.type].description}
                </p>
            </div>
        </div>
    );
}

interface WidgetPickerModalProps {
    onSelect: (type: WidgetType) => void;
    onClose: () => void;
}

function WidgetPickerModal({ onSelect, onClose }: WidgetPickerModalProps) {
    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-background border rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold">Add Widget</h2>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-full hover:bg-accent"
                    >
                        ×
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(Object.entries(AVAILABLE_WIDGETS) as [WidgetType, typeof AVAILABLE_WIDGETS[WidgetType]][]).map(
                        ([type, info]) => (
                            <button
                                key={type}
                                onClick={() => onSelect(type)}
                                className="border rounded-lg p-4 text-left hover:bg-accent transition-colors"
                            >
                                <h3 className="font-semibold mb-2">{info.title}</h3>
                                <p className="text-sm text-muted-foreground">
                                    {info.description}
                                </p>
                                <p className="text-xs text-muted-foreground mt-2">
                                    Size: {info.defaultSize.width}×{info.defaultSize.height}
                                </p>
                            </button>
                        )
                    )}
                </div>
            </div>
        </div>
    );
}
