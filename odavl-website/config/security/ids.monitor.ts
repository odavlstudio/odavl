// ODAVL-WAVE-X4-INJECT: Intrusion Detection System monitoring
// @odavl-governance: SECURITY-SAFE mode active
export interface SecurityEvent {
  type: 'anomaly' | 'attack' | 'violation';
  severity: 'low' | 'medium' | 'high' | 'critical';
  ip: string;
  timestamp: number;
  details: string;
  blocked: boolean;
}

const suspiciousPatterns = [
  /\.\.\//g, /<script|javascript:/gi, /union\s+select/gi, 
  /drop\s+table/gi, /exec\(\s*\w+/gi, /\${.*}/g
];

export function detectAnomalies(
  url: string, 
  headers: Record<string, string>,
  userAgent?: string
): SecurityEvent | null {
  const indicators = [];
  
  suspiciousPatterns.forEach(pattern => {
    if (pattern.test(url)) indicators.push(`Pattern: ${pattern}`);
  });

  if (userAgent && (userAgent.length < 10 || userAgent.includes('bot'))) {
    indicators.push('Suspicious user agent');
  }

  return indicators.length > 0 ? {
    type: 'anomaly',
    severity: indicators.length > 2 ? 'high' : 'medium',
    ip: headers['x-forwarded-for'] || 'unknown',
    timestamp: Date.now(),
    details: indicators.join(', '),
    blocked: indicators.length > 2
  } : null;
}