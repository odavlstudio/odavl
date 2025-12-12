/**
 * ODAVL Insight Analysis Context
 * OMEGA-P5 Phase 4: OMS v2 Integration
 * 
 * Provides OMS context for analysis operations
 */

import type { OMSContext } from '../../../oms/oms-context.js';
import { loadOMSContext } from '@odavl-studio/oms';

export interface AnalysisContextOptions {
  workspaceRoot?: string;
  enableOMS?: boolean;
}

export class AnalysisContext {
  private omsContext: OMSContext | null = null;
  private options: AnalysisContextOptions;

  constructor(options: AnalysisContextOptions = {}) {
    this.options = { enableOMS: true, ...options };
  }

  async initialize(): Promise<void> {
    if (!this.options.enableOMS) return;
    
    try {
      this.omsContext = await loadOMSContext(this.options.workspaceRoot);
    } catch (error) {
      console.warn('⚠️ OMS context initialization failed:', error);
    }
  }

  getOMSContext(): OMSContext | null {
    return this.omsContext;
  }

  isOMSEnabled(): boolean {
    return this.omsContext !== null;
  }
}
