// Shared intelligence types
export interface PerformanceInsight {
    metric: string;
    value: number;
    timestamp: string;
}

export interface SmartAlert {
    id: string;
    label: string;
    actions: { label: string; }[];
    triggered: boolean;
}

export interface QualityForecast {
    metric: string;
    forecast: number;
    confidence: number;
}

export interface TrendAnalysis {
    trends: Array<{ metric: string; direction: 'up' | 'down' | 'flat'; }>;
}
