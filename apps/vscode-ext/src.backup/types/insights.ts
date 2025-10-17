export type Metric = {
    phase: string;
    duration: number;
};

export type InsightsSummary = {
    successRate: number;
    totalRuns: number;
    avgDuration: string;
};
