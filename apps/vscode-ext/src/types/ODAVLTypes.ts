export interface SystemMetrics {
  eslintWarnings: number;
  typeErrors: number;
  timestamp: string;
  lastRun?: string;
  cycleStatus?: string;
}

export interface HistoryEntry {
  ts: string;
  success?: boolean;
  before: SystemMetrics;
  after: SystemMetrics;
  deltas: { eslint: number; types: number };
  decision: string;
  gatesPassed?: boolean;
  gates?: Record<string, unknown>;
}

export interface RecipeTrust {
  id: string;
  runs: number;
  success: number;
  trust: number;
}

export interface ODAVLConfig {
  gates: Record<string, unknown>;
  policy: Record<string, unknown>;
}

export interface EvidenceFile {
  id: string;
  timestamp: string;
  type: string;
  source: string;
  category: string;
  data: unknown;
}

export interface CacheStatus {
  lastUpdate: string;
  isValid: boolean;
  sources: string[];
}