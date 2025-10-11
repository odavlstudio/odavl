// ODAVL-WAVE-X4-INJECT: Nonce-based Content Security Policy
// @odavl-governance: SECURITY-SAFE mode active
// ODAVL-WAVE-L-FIX: Web Crypto API for Edge Runtime compatibility

export interface CSPConfig {
  nonce: string;
  policy: string;
}

export function generateNonce(): string {
  // Use Web Crypto API for Edge Runtime compatibility
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array)).replace(/[+/]/g, char => char === '+' ? '-' : '_').replace(/=/g, '');
}

export function buildCSPPolicy(nonce: string, isDev = false): string {
  const basePolicy = {
    'default-src': ["'self'"],
    'script-src': ["'self'", `'nonce-${nonce}'`, 'plausible.io', ...(isDev ? ["'unsafe-eval'"] : [])],
    'style-src': ["'self'", `'nonce-${nonce}'`, 'fonts.googleapis.com'],
    'font-src': ["'self'", 'fonts.gstatic.com'],
    'img-src': ["'self'", 'data:', 'https:'],
    'connect-src': ["'self'", 'plausible.io'],
    'frame-ancestors': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
    'upgrade-insecure-requests': []
  };

  return Object.entries(basePolicy)
    .map(([directive, sources]) => `${directive} ${sources.join(' ')}`)
    .join('; ');
}

const cspUtils = { generateNonce, buildCSPPolicy };
export default cspUtils;