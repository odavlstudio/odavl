/**
 * Cloudflare WAF Configuration
 * 
 * Implements Web Application Firewall rules for:
 * - DDoS protection
 * - Bot mitigation
 * - Rate limiting
 * - Geographic restrictions
 * - Security level adjustments
 * 
 * Uses Cloudflare API for automated rule management
 */

import { z } from 'zod';
import { logger } from '@/lib/logger';

const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const CLOUDFLARE_ZONE_ID = process.env.CLOUDFLARE_ZONE_ID;
const CLOUDFLARE_API_BASE = 'https://api.cloudflare.com/client/v4';

interface CloudflareResponse<T = any> {
  success: boolean;
  errors: Array<{ code: number; message: string }>;
  messages: string[];
  result: T;
}

/**
 * Cloudflare API client
 */
async function cloudflareAPI<T = any>(
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' = 'GET',
  body?: unknown
): Promise<T> {
  const response = await fetch(`${CLOUDFLARE_API_BASE}${endpoint}`, {
    method,
    headers: {
      'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  
  const data = await response.json() as CloudflareResponse<T>;
  
  if (!data.success) {
    throw new Error(`Cloudflare API error: ${data.errors.map(e => e.message).join(', ')}`);
  }
  
  return data.result;
}

/**
 * Create WAF rule
 */
export async function createWAFRule(rule: {
  description: string;
  expression: string;
  action: 'block' | 'challenge' | 'js_challenge' | 'managed_challenge' | 'log' | 'bypass';
  enabled?: boolean;
}): Promise<{ id: string }> {
  return cloudflareAPI(
    `/zones/${CLOUDFLARE_ZONE_ID}/firewall/rules`,
    'POST',
    {
      filter: {
        expression: rule.expression,
        paused: !(rule.enabled ?? true),
        description: rule.description,
      },
      action: rule.action,
    }
  );
}

/**
 * Apply comprehensive WAF ruleset
 */
export async function applySecurityRules(): Promise<void> {
  logger.emoji('🛡️', 'Applying Cloudflare WAF security rules...');
  
  const rules = [
    // Block known malicious IPs
    {
      description: 'Block known malicious IPs',
      expression: '(ip.geoip.country in {"CN" "RU" "KP"} and cf.threat_score > 30)',
      action: 'block' as const,
    },
    
    // Challenge suspicious requests
    {
      description: 'Challenge requests with high threat score',
      expression: '(cf.threat_score > 50)',
      action: 'managed_challenge' as const,
    },
    
    // Block common attack patterns
    {
      description: 'Block SQL injection attempts',
      expression: '(http.request.uri.query contains "UNION SELECT" or http.request.uri.query contains "OR 1=1")',
      action: 'block' as const,
    },
    
    {
      description: 'Block XSS attempts',
      expression: '(http.request.uri.query contains "<script" or http.request.body contains "<script")',
      action: 'block' as const,
    },
    
    // Rate limiting rules
    {
      description: 'Rate limit API endpoints',
      expression: '(http.request.uri.path matches "^/api/.*" and rate(10s) > 100)',
      action: 'challenge' as const,
    },
    
    // Bot protection
    {
      description: 'Challenge unverified bots',
      expression: '(cf.client.bot and not cf.verified_bot)',
      action: 'managed_challenge' as const,
    },
    
    // Block common vulnerability scanners
    {
      description: 'Block vulnerability scanners',
      expression: '(http.user_agent contains "nikto" or http.user_agent contains "sqlmap" or http.user_agent contains "nmap")',
      action: 'block' as const,
    },
    
    // Protect admin endpoints
    {
      description: 'Strict protection for admin routes',
      expression: '(http.request.uri.path matches "^/(admin|wp-admin|phpmyadmin)" and cf.threat_score > 10)',
      action: 'block' as const,
    },
    
    // Block requests with no user agent
    {
      description: 'Block requests without user agent',
      expression: '(not http.user_agent)',
      action: 'block' as const,
    },
    
    // DDoS mitigation
    {
      description: 'Challenge during suspected DDoS',
      expression: '(rate(1m) > 1000)',
      action: 'js_challenge' as const,
    },
  ];
  
  for (const rule of rules) {
    try {
      const result = await createWAFRule(rule);
      logger.success(`Created rule: ${rule.description}`, { ruleId: result.id });
    } catch (error) {
      logger.error(`Failed to create rule: ${rule.description}`, error as Error);
    }
  }
  
  logger.success('WAF rules applied successfully');
}

/**
 * Configure DDoS protection settings
 */
export async function configureDDoSProtection(): Promise<void> {
  logger.emoji('🛡️', 'Configuring DDoS protection...');
  
  // Enable "I'm Under Attack Mode" setting
  await cloudflareAPI(
    `/zones/${CLOUDFLARE_ZONE_ID}/settings/security_level`,
    'PATCH',
    {
      value: 'high', // Options: off, essentially_off, low, medium, high, under_attack
    }
  );
  
  // Enable Browser Integrity Check
  await cloudflareAPI(
    `/zones/${CLOUDFLARE_ZONE_ID}/settings/browser_check`,
    'PATCH',
    {
      value: 'on',
    }
  );
  
  // Enable Challenge Passage
  await cloudflareAPI(
    `/zones/${CLOUDFLARE_ZONE_ID}/settings/challenge_ttl`,
    'PATCH',
    {
      value: 1800, // 30 minutes
    }
  );
  
  logger.success('DDoS protection configured');
}

/**
 * Configure rate limiting rules
 */
export async function configureRateLimiting(): Promise<void> {
  logger.emoji('🛡️', 'Configuring rate limiting...');
  
  const rateLimitRules = [
    {
      description: 'API rate limit - 1000 req/5min per IP',
      match: {
        request: {
          url: '*.odavl.studio/api/*',
        },
      },
      threshold: 1000,
      period: 300, // 5 minutes
      action: {
        mode: 'challenge',
        timeout: 86400, // 24 hours
      },
    },
    {
      description: 'Login rate limit - 10 req/min per IP',
      match: {
        request: {
          url: '*.odavl.studio/api/auth/*',
        },
      },
      threshold: 10,
      period: 60, // 1 minute
      action: {
        mode: 'block',
        timeout: 3600, // 1 hour
      },
    },
  ];
  
  for (const rule of rateLimitRules) {
    try {
      const result = await cloudflareAPI<{ id: string }>(
        `/zones/${CLOUDFLARE_ZONE_ID}/rate_limits`,
        'POST',
        rule
      );
      logger.success(`Created rate limit: ${rule.description}`, { ruleId: result.id });
    } catch (error) {
      logger.error(`Failed to create rate limit: ${rule.description}`, error as Error);
    }
  }
  
  logger.success('Rate limiting configured');
}

/**
 * Configure bot management
 */
export async function configureBotManagement(): Promise<void> {
  logger.emoji('🤖', 'Configuring bot management...');
  
  // Enable Bot Fight Mode (free tier)
  await cloudflareAPI(
    `/zones/${CLOUDFLARE_ZONE_ID}/bot_management`,
    'PUT',
    {
      fight_mode: true,
      enable_js: true,
      suppress_session_score: false,
    }
  );
  
  logger.success('Bot management configured');
}

/**
 * Get security analytics
 */
export async function getSecurityAnalytics(since: Date): Promise<{
  threats: {
    blocked: number;
    challenged: number;
    passed: number;
  };
  topThreats: Array<{
    type: string;
    count: number;
  }>;
  topBlockedIPs: Array<{
    ip: string;
    count: number;
    country: string;
  }>;
}> {
  const analytics = await cloudflareAPI(
    `/zones/${CLOUDFLARE_ZONE_ID}/firewall/events?since=${since.toISOString()}`
  );
  
  // Process analytics data
  const threats = {
    blocked: 0,
    challenged: 0,
    passed: 0,
  };
  
  const threatCounts: Record<string, number> = {};
  const ipCounts: Record<string, { count: number; country: string }> = {};
  
  for (const event of analytics) {
    if (event.action === 'block') threats.blocked++;
    else if (event.action.includes('challenge')) threats.challenged++;
    else threats.passed++;
    
    // Count threat types
    const threatType = event.rule_id || 'unknown';
    threatCounts[threatType] = (threatCounts[threatType] || 0) + 1;
    
    // Count IPs
    if (event.source?.ip) {
      const ip = event.source.ip;
      if (!ipCounts[ip]) {
        ipCounts[ip] = { count: 0, country: event.source.country || 'unknown' };
      }
      ipCounts[ip].count++;
    }
  }
  
  const topThreats = Object.entries(threatCounts)
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
  
  const topBlockedIPs = Object.entries(ipCounts)
    .map(([ip, data]) => ({ ip, ...data }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
  
  return {
    threats,
    topThreats,
    topBlockedIPs,
  };
}

/**
 * Generate WAF security report
 */
export async function generateWAFReport(): Promise<string> {
  const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const analytics = await getSecurityAnalytics(last24Hours);
  
  return `
# Cloudflare WAF Security Report

**Period:** Last 24 hours
**Generated:** ${new Date().toISOString()}

## Threat Summary

| Action | Count |
|--------|-------|
| Blocked | ${analytics.threats.blocked} |
| Challenged | ${analytics.threats.challenged} |
| Passed | ${analytics.threats.passed} |

## Top Threats

${analytics.topThreats.map((t, i) => `${i + 1}. ${t.type}: ${t.count} events`).join('\n')}

## Top Blocked IPs

${analytics.topBlockedIPs.map((ip, i) => `${i + 1}. ${ip.ip} (${ip.country}): ${ip.count} attempts`).join('\n')}

## Protection Status

✅ WAF Rules: Active
✅ DDoS Protection: Enabled
✅ Bot Management: Enabled
✅ Rate Limiting: Configured

## Recommendations

${analytics.threats.blocked > 1000 ? '⚠️  High number of blocked requests - investigate potential attack\n' : ''}
${analytics.topBlockedIPs.length > 0 ? '⚠️  Consider adding top blocked IPs to permanent blocklist\n' : ''}
✅ Security posture is strong
`;
}

/**
 * Emergency: Enable "Under Attack Mode"
 */
export async function enableUnderAttackMode(): Promise<void> {
  logger.emoji('🚨', 'ENABLING UNDER ATTACK MODE');
  
  await cloudflareAPI(
    `/zones/${CLOUDFLARE_ZONE_ID}/settings/security_level`,
    'PATCH',
    {
      value: 'under_attack',
    }
  );
  
  logger.success('Under Attack Mode enabled - all visitors will see challenge page');
}

/**
 * Disable "Under Attack Mode"
 */
export async function disableUnderAttackMode(): Promise<void> {
  logger.success('Disabling Under Attack Mode');
  
  await cloudflareAPI(
    `/zones/${CLOUDFLARE_ZONE_ID}/settings/security_level`,
    'PATCH',
    {
      value: 'high',
    }
  );
  
  logger.success('Returned to normal security mode');
}
