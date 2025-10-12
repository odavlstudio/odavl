/**
 * Performance metrics collection for ODAVL VS Code Extension
 * Tracks activation time, refresh latency, and service response times
 */

interface PerformanceRecord {
  timestamp: string;
  operation: string;
  duration: number;
  metadata?: Record<string, unknown>;
}

class PerformanceMetricsCollector {
  private records: PerformanceRecord[] = [];
  private readonly maxRecords = 100;

  recordActivation(duration: number): void {
    this.addRecord('activation', duration);
  }

  recordRefresh(duration: number, provider?: string): void {
    this.addRecord('refresh', duration, { provider });
  }

  recordServiceCall(operation: string, duration: number): void {
    this.addRecord('service-call', duration, { operation });
  }

  private addRecord(operation: string, duration: number, metadata?: Record<string, unknown>): void {
    this.records.push({
      timestamp: new Date().toISOString(),
      operation,
      duration,
      metadata
    });

    // Keep only recent records
    if (this.records.length > this.maxRecords) {
      this.records = this.records.slice(-this.maxRecords);
    }
  }

  getMetrics(): { activation: number; avgRefresh: number; totalCalls: number } {
    const activation = this.records.find(r => r.operation === 'activation')?.duration || 0;
    const refreshRecords = this.records.filter(r => r.operation === 'refresh');
    const avgRefresh = refreshRecords.length > 0 
      ? refreshRecords.reduce((sum, r) => sum + r.duration, 0) / refreshRecords.length 
      : 0;

    return {
      activation,
      avgRefresh,
      totalCalls: this.records.length
    };
  }
}

export const PerformanceMetrics = new PerformanceMetricsCollector();