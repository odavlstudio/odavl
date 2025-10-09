/**
 * Telemetry Latency Benchmark - Wave C Task 7
 * Measures round-trip message latency between CLI and VS Code Extension
 */

import { spawn } from 'child_process';
import { performance } from 'perf_hooks';

interface LatencyMeasurement {
  timestamp: number;
  phase: string;
  latencyMs: number;
}

interface BenchmarkResults {
  metadata: {
    timestamp: string;
    task: string;
    description: string;
  };
  measurements: LatencyMeasurement[];
  summary: {
    averageLatencyMs: number;
    minLatencyMs: number;
    maxLatencyMs: number;
    totalMessages: number;
    improvementTarget: string;
  };
}

/**
 * Runs latency benchmark by spawning CLI with --json mode
 * and measuring time between spawn and first message receive
 */
async function measureTelemetryLatency(): Promise<BenchmarkResults> {
  const measurements: LatencyMeasurement[] = [];
  
  return new Promise((resolve) => {
    const startTime = performance.now();
    
    const cli = spawn('tsx', ['apps/cli/src/index.ts', 'observe', '--json'], { 
      shell: true,
      stdio: ['ignore', 'pipe', 'pipe']
    });

    let firstMessageReceived = false;
    
    cli.stdout.on('data', (data) => {
      if (!firstMessageReceived) {
        const latency = performance.now() - startTime;
        measurements.push({
          timestamp: Date.now(),
          phase: 'First Message',
          latencyMs: latency
        });
        firstMessageReceived = true;
      }
      
      const output = data.toString().trim();
      const lines = output.split('\n');
      
      for (const line of lines) {
        if (line.trim()) {
          try {
            const message = JSON.parse(line);
            if (message.type === 'doctor') {
              const receiveTime = performance.now();
              measurements.push({
                timestamp: Date.now(),
                phase: message.data.phase,
                latencyMs: receiveTime - startTime
              });
            }
          } catch {
            // Ignore non-JSON lines
          }
        }
      }
    });

    cli.on('close', () => {
      const avgLatency = measurements.reduce((sum, m) => sum + m.latencyMs, 0) / measurements.length;
      const minLatency = Math.min(...measurements.map(m => m.latencyMs));
      const maxLatency = Math.max(...measurements.map(m => m.latencyMs));
      
      resolve({
        metadata: {
          timestamp: new Date().toISOString(),
          task: "Wave C Task 7 - Telemetry Latency Optimization",
          description: "CLI to Extension message round-trip latency measurement"
        },
        measurements,
        summary: {
          averageLatencyMs: Math.round(avgLatency * 100) / 100,
          minLatencyMs: Math.round(minLatency * 100) / 100,
          maxLatencyMs: Math.round(maxLatency * 100) / 100,
          totalMessages: measurements.length,
          improvementTarget: "≥25% reduction from baseline"
        }
      });
    });
  });
}

// CLI execution
measureTelemetryLatency()
  .then(results => {
    console.log(JSON.stringify(results, null, 2));
  })
  .catch(console.error);

export { measureTelemetryLatency };