import { performance } from 'node:perf_hooks';

export interface PhaseMetric {
  phase: string;
  started: number;
  ended: number;
  duration: number;
  status: string;
  errors?: string[];
}

export interface CycleMetrics {
  totalDuration: number;
  phases: PhaseMetric[];
}

const phaseMetrics: Record<string, PhaseMetric> = {};
let cycleStart = 0;

export function startCycle() {
  cycleStart = performance.now();
  for (const k of Object.keys(phaseMetrics)) delete phaseMetrics[k];
}

export function startPhase(phase: string) {
  phaseMetrics[phase] = {
    phase,
    started: performance.now(),
    ended: 0,
    duration: 0,
    status: 'running',
    errors: [],
  };
}

export function endPhase(phase: string, status: string, errors?: string[]) {
  const metric = phaseMetrics[phase];
  if (metric) {
    metric.ended = performance.now();
    metric.duration = metric.ended - metric.started;
    metric.status = status;
    if (errors?.length) metric.errors = errors;
  }
}

export function getCycleMetrics(): CycleMetrics {
  const phases = Object.values(phaseMetrics);
  const totalDuration = phases.reduce((sum, p) => sum + p.duration, 0);
  return { totalDuration, phases };
}
