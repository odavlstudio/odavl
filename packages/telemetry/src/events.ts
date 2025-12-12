/**
 * ODAVL Telemetry — Event System
 * Standardized events across products
 */

export enum ODAVLEvent {
  // Insight events
  INSIGHT_ANALYSIS_STARTED = 'insight.analysis.started',
  INSIGHT_ANALYSIS_COMPLETED = 'insight.analysis.completed',
  INSIGHT_DETECTOR_RUN = 'insight.detector.run',
  
  // Autopilot events
  AUTOPILOT_CYCLE_STARTED = 'autopilot.cycle.started',
  AUTOPILOT_CYCLE_COMPLETED = 'autopilot.cycle.completed',
  AUTOPILOT_RECIPE_EXECUTED = 'autopilot.recipe.executed',
  
  // Guardian events
  GUARDIAN_TEST_STARTED = 'guardian.test.started',
  GUARDIAN_TEST_COMPLETED = 'guardian.test.completed',
  GUARDIAN_QUALITY_GATE = 'guardian.quality_gate',
  
  // Governance events
  BOUNDARY_VIOLATION_PREVENTED = 'boundary.violation.prevented',
  RISK_BUDGET_EXCEEDED = 'risk.budget.exceeded'
}

export interface Event {
  type: ODAVLEvent;
  timestamp: string;
  product: 'insight' | 'autopilot' | 'guardian';
  data?: Record<string, unknown>;
}

export class EventEmitter {
  private events: Event[] = [];

  emit(type: ODAVLEvent, product: 'insight' | 'autopilot' | 'guardian', data?: Record<string, unknown>): void {
    this.events.push({
      type,
      timestamp: new Date().toISOString(),
      product,
      data
    });
  }

  getEvents(): Event[] {
    return [...this.events];
  }

  clear(): void {
    this.events = [];
  }
}
