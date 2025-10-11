// ODAVL-WAVE-X5: AI Brain - Ultra-Compact
export interface UserSignal {
  type: 'page_view' | 'interaction' | 'time_spent';
  path: string;
  timestamp: number;
}

export interface UserContext {
  persona: 'developer' | 'manager' | 'guest' | 'researcher';
  intent: 'exploring' | 'evaluating' | 'implementing' | 'learning';
  engagement: 'low' | 'medium' | 'high';
  sessionId: string;
  confidence: number;
}

class AIBrain {
  private signals: UserSignal[] = [];
  
  collectSignal(signal: UserSignal): void {
    this.signals.push(signal);
    if (this.signals.length > 50) this.signals.shift();
  }

  inferContext(sessionId: string): UserContext {
    const recent = this.signals.filter(s => Date.now() - s.timestamp < 1800000);
    const paths = recent.map(s => s.path);
    
    let persona: UserContext['persona'] = 'guest';
    if (paths.some(p => p.includes('/docs'))) persona = 'developer';
    else if (paths.some(p => p.includes('/security'))) persona = 'manager';
    
    let engagement: UserContext['engagement'] = 'low';
    if (recent.length > 10) engagement = 'high';
    else if (recent.length > 5) engagement = 'medium';
    
    return {
      persona, intent: recent.length > 8 ? 'evaluating' : 'exploring',
      engagement, sessionId, confidence: Math.min(recent.length / 10, 1)
    };
  }
}

export const aiBrain = new AIBrain();