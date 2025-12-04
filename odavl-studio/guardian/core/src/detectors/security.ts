import { Page } from 'playwright';
import { Issue } from './white-screen';

export class SecurityDetector {
  /**
   * Detect security issues
   */
  async detect(page: Page): Promise<Issue[]> {
    const issues: Issue[] = [];

    // Get HTTP response headers from stored response
    const response = (page as any)._guardianResponse;
    const responseHeaders = response?.headers() || {};
    
    // Check for missing security headers (both HTTP headers and meta tags)
    const headers = await page.evaluate(() => {
      return {
        csp: document.querySelector('meta[http-equiv="Content-Security-Policy"]')?.getAttribute('content') || null,
        xfo: null, // Set via HTTP headers only
        protocol: window.location.protocol
      };
    });

    // Check HTTP headers for CSP if not in meta tag
    const httpCSP = responseHeaders['content-security-policy'] || null;
    const hasCSP = headers.csp || httpCSP;

    // Check if not using HTTPS
    if (headers.protocol === 'http:' && !page.url().includes('localhost')) {
      issues.push({
        type: 'INSECURE_PROTOCOL',
        severity: 'critical',
        message: '🔒 Not using HTTPS',
        fix: [
          'Enable HTTPS on your server',
          'Obtain SSL/TLS certificate (Let\'s Encrypt)',
          'Redirect HTTP to HTTPS',
          'Enable HSTS header',
          'Update all links to use HTTPS'
        ],
        details: { protocol: headers.protocol }
      });
    }

    // Check for missing Content Security Policy
    if (!hasCSP) {
      issues.push({
        type: 'MISSING_CSP',
        severity: 'high',
        message: '🔒 Missing Content Security Policy',
        fix: [
          'Add Content-Security-Policy header',
          'Start with restrictive policy',
          'Use nonce or hash for inline scripts',
          'Avoid \'unsafe-inline\' and \'unsafe-eval\'',
          'Test with report-only mode first'
        ],
        details: {}
      });
    }

    // Check for mixed content (HTTPS page loading HTTP resources)
    const mixedContent = await page.evaluate(() => {
      if (window.location.protocol !== 'https:') return [];
      
      const resources = Array.from(document.querySelectorAll('img, script, link, iframe'));
      const insecure: string[] = [];

      for (const el of resources) {
        const src = el.getAttribute('src') || el.getAttribute('href');
        if (src && src.startsWith('http://')) {
          insecure.push(src);
        }
      }

      return insecure;
    });

    if (mixedContent.length > 0) {
      issues.push({
        type: 'MIXED_CONTENT',
        severity: 'high',
        message: `🔒 ${mixedContent.length} insecure resource(s) on HTTPS page`,
        fix: [
          'Update all resources to use HTTPS',
          'Use protocol-relative URLs (//example.com)',
          'Host resources on same domain',
          'Use CDN with HTTPS support',
          'Check for hardcoded HTTP URLs in code'
        ],
        details: { resources: mixedContent.slice(0, 5) }
      });
    }

    // Check for inline event handlers (XSS risk)
    const inlineHandlers = await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('*'));
      let count = 0;

      for (const el of elements) {
        const attrs = Array.from(el.attributes);
        for (const attr of attrs) {
          if (attr.name.startsWith('on')) {
            count++;
            break;
          }
        }
      }

      return count;
    });

    if (inlineHandlers > 0) {
      issues.push({
        type: 'INLINE_EVENT_HANDLERS',
        severity: 'medium',
        message: `🔒 ${inlineHandlers} inline event handler(s) found (XSS risk)`,
        fix: [
          'Remove onclick, onload, etc. attributes',
          'Use addEventListener in JavaScript',
          'Implement proper CSP to block inline handlers',
          'Use React/Vue event binding instead',
          'Validate and sanitize all user input'
        ],
        details: { count: inlineHandlers }
      });
    }

    // Check for console.log statements (info disclosure)
    const consoleMessages = await page.evaluate(() => {
      const messages: string[] = [];
      const originalLog = console.log;
      
      console.log = function(...args) {
        messages.push(args.join(' '));
        originalLog.apply(console, args);
      };

      return messages.length;
    });

    // Check for exposed API keys or secrets in page source
    const exposedSecrets = await page.evaluate(() => {
      const html = document.documentElement.innerHTML;
      const patterns = [
        /api[_-]?key["\s:=]+[\w-]{20,}/gi,
        /secret["\s:=]+[\w-]{20,}/gi,
        /password["\s:=]+[\w-]{8,}/gi,
        /token["\s:=]+[\w-]{20,}/gi,
        /aws[_-]?access[_-]?key/gi,
        /AKIA[0-9A-Z]{16}/g, // AWS access key
      ];

      const found: string[] = [];
      for (const pattern of patterns) {
        const matches = html.match(pattern);
        if (matches) {
          found.push(...matches.slice(0, 3)); // Limit to 3 examples
        }
      }

      return found;
    });

    if (exposedSecrets.length > 0) {
      issues.push({
        type: 'EXPOSED_SECRETS',
        severity: 'critical',
        message: `🔒 Potential API keys/secrets exposed in page source`,
        fix: [
          'IMMEDIATELY rotate exposed credentials',
          'Never hardcode API keys in client-side code',
          'Use environment variables on server',
          'Use server-side API proxies',
          'Implement proper secret management',
          'Add secrets to .gitignore'
        ],
        details: { 
          examples: exposedSecrets.map(s => s.substring(0, 30) + '...')
        }
      });
    }

    // Check for autocomplete on sensitive fields
    const sensitiveAutocomplete = await page.evaluate(() => {
      const passwordFields = Array.from(document.querySelectorAll(
        'input[type="password"], input[name*="password"], input[name*="credit"], input[name*="card"]'
      ));

      return passwordFields.filter(field => 
        field.getAttribute('autocomplete') !== 'off' &&
        field.getAttribute('autocomplete') !== 'new-password'
      ).length;
    });

    if (sensitiveAutocomplete > 0) {
      issues.push({
        type: 'SENSITIVE_AUTOCOMPLETE',
        severity: 'low',
        message: `🔒 ${sensitiveAutocomplete} sensitive field(s) with autocomplete enabled`,
        fix: [
          'Add autocomplete="off" to password fields',
          'Use autocomplete="new-password" for registration',
          'Disable autocomplete on credit card fields',
          'Consider security vs. usability tradeoffs',
          'Follow OWASP guidelines for autocomplete'
        ],
        details: { count: sensitiveAutocomplete }
      });
    }

    return issues;
  }

  /**
   * Security score (0-100)
   */
  async getScore(page: Page): Promise<number> {
    const issues = await this.detect(page);
    const criticalCount = issues.filter(i => i.severity === 'critical').length;
    const highCount = issues.filter(i => i.severity === 'high').length;
    const mediumCount = issues.filter(i => i.severity === 'medium').length;
    const lowCount = issues.filter(i => i.severity === 'low').length;

    let score = 100;
    score -= criticalCount * 30;
    score -= highCount * 15;
    score -= mediumCount * 8;
    score -= lowCount * 3;

    return Math.max(0, score);
  }
}
