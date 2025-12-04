/**
 * CloudFlare CDN Configuration for ODAVL Insight Cloud
 * 
 * Features:
 * - Global CDN with 300+ edge locations
 * - DDoS protection
 * - SSL/TLS encryption
 * - Page rules for caching
 * - Workers for edge computing
 * - Analytics and monitoring
 */

export interface CloudFlareConfig {
  zoneId: string;
  accountId: string;
  apiToken: string;
  domains: {
    production: string;
    staging: string;
    cdn: string;
  };
  caching: {
    pageRules: PageRule[];
    workerRoutes: WorkerRoute[];
  };
  security: {
    ssl: SSLConfig;
    firewall: FirewallConfig;
    ddos: DDoSConfig;
  };
  performance: {
    minify: MinifyConfig;
    compression: CompressionConfig;
    http3: boolean;
    earlyHints: boolean;
  };
}

export interface PageRule {
  url: string;
  priority: number;
  actions: {
    cacheLevel?: 'bypass' | 'basic' | 'simplified' | 'aggressive' | 'cache_everything';
    edgeCacheTtl?: number;
    browserCacheTtl?: number;
    alwaysOnline?: boolean;
    securityLevel?: 'off' | 'essentially_off' | 'low' | 'medium' | 'high' | 'under_attack';
  };
}

export interface WorkerRoute {
  pattern: string;
  script: string;
  enabled: boolean;
}

export interface SSLConfig {
  mode: 'off' | 'flexible' | 'full' | 'strict';
  minTlsVersion: '1.0' | '1.1' | '1.2' | '1.3';
  alwaysUseHttps: boolean;
  automaticHttpsRewrites: boolean;
  opportunisticEncryption: boolean;
  tls13: boolean;
  hsts: {
    enabled: boolean;
    maxAge: number;
    includeSubdomains: boolean;
    preload: boolean;
  };
}

export interface FirewallConfig {
  rules: FirewallRule[];
  rateLimiting: {
    enabled: boolean;
    threshold: number;
    period: number;
    action: 'simulate' | 'challenge' | 'block';
  };
  botManagement: {
    enabled: boolean;
    mode: 'challenge' | 'block';
  };
}

export interface FirewallRule {
  expression: string;
  action: 'allow' | 'block' | 'challenge' | 'js_challenge' | 'managed_challenge';
  description: string;
  enabled: boolean;
}

export interface DDoSConfig {
  enabled: boolean;
  sensitivity: 'low' | 'medium' | 'high';
}

export interface MinifyConfig {
  html: boolean;
  css: boolean;
  js: boolean;
}

export interface CompressionConfig {
  brotli: boolean;
  gzip: boolean;
}

/**
 * Production CloudFlare Configuration
 */
export const productionConfig: CloudFlareConfig = {
  zoneId: process.env.CLOUDFLARE_ZONE_ID || '',
  accountId: process.env.CLOUDFLARE_ACCOUNT_ID || '',
  apiToken: process.env.CLOUDFLARE_API_TOKEN || '',

  domains: {
    production: 'app.odavl.com',
    staging: 'staging.odavl.com',
    cdn: 'cdn.odavl.com',
  },

  caching: {
    pageRules: [
      {
        url: '*/static/*',
        priority: 1,
        actions: {
          cacheLevel: 'cache_everything',
          edgeCacheTtl: 31536000, // 1 year
          browserCacheTtl: 31536000,
          alwaysOnline: true,
        },
      },
      {
        url: '*/images/*',
        priority: 2,
        actions: {
          cacheLevel: 'cache_everything',
          edgeCacheTtl: 604800, // 1 week
          browserCacheTtl: 604800,
          alwaysOnline: true,
        },
      },
      {
        url: '*/api/*',
        priority: 3,
        actions: {
          cacheLevel: 'bypass',
          browserCacheTtl: 0,
        },
      },
      {
        url: '*/_next/static/*',
        priority: 4,
        actions: {
          cacheLevel: 'cache_everything',
          edgeCacheTtl: 31536000,
          browserCacheTtl: 31536000,
        },
      },
    ],

    workerRoutes: [
      {
        pattern: 'app.odavl.com/api/*',
        script: 'api-router',
        enabled: true,
      },
      {
        pattern: 'cdn.odavl.com/*',
        script: 'cdn-optimizer',
        enabled: true,
      },
    ],
  },

  security: {
    ssl: {
      mode: 'strict',
      minTlsVersion: '1.2',
      alwaysUseHttps: true,
      automaticHttpsRewrites: true,
      opportunisticEncryption: true,
      tls13: true,
      hsts: {
        enabled: true,
        maxAge: 63072000, // 2 years
        includeSubdomains: true,
        preload: true,
      },
    },

    firewall: {
      rules: [
        {
          expression: '(http.request.uri.path contains "/admin" and not ip.geoip.country in {"US" "CA" "GB"})',
          action: 'block',
          description: 'Block non-US/CA/GB access to admin',
          enabled: true,
        },
        {
          expression: '(http.request.uri.path contains "wp-admin" or http.request.uri.path contains "xmlrpc")',
          action: 'block',
          description: 'Block WordPress exploit attempts',
          enabled: true,
        },
        {
          expression: '(http.user_agent contains "bot" and not cf.client.bot)',
          action: 'challenge',
          description: 'Challenge suspicious bots',
          enabled: true,
        },
        {
          expression: '(http.request.method eq "POST" and http.request.uri.path contains "/api/auth")',
          action: 'js_challenge',
          description: 'JS challenge for auth endpoints',
          enabled: true,
        },
      ],

      rateLimiting: {
        enabled: true,
        threshold: 100,
        period: 60,
        action: 'challenge',
      },

      botManagement: {
        enabled: true,
        mode: 'challenge',
      },
    },

    ddos: {
      enabled: true,
      sensitivity: 'high',
    },
  },

  performance: {
    minify: {
      html: true,
      css: true,
      js: true,
    },
    compression: {
      brotli: true,
      gzip: true,
    },
    http3: true,
    earlyHints: true,
  },
};

/**
 * Staging CloudFlare Configuration
 */
export const stagingConfig: CloudFlareConfig = {
  ...productionConfig,
  domains: {
    production: 'staging.odavl.com',
    staging: 'dev.odavl.com',
    cdn: 'cdn-staging.odavl.com',
  },
  security: {
    ...productionConfig.security,
    firewall: {
      ...productionConfig.security.firewall,
      rules: productionConfig.security.firewall.rules.map(rule => ({
        ...rule,
        enabled: false, // Disable strict rules in staging
      })),
    },
  },
};

/**
 * Get CloudFlare configuration based on environment
 */
export function getCloudFlareConfig(): CloudFlareConfig {
  const env = process.env.NODE_ENV;

  if (env === 'production') {
    return productionConfig;
  }

  return stagingConfig;
}

/**
 * Validate CloudFlare configuration
 */
export function validateConfig(config: CloudFlareConfig): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!config.zoneId) {
    errors.push('Missing CLOUDFLARE_ZONE_ID');
  }

  if (!config.accountId) {
    errors.push('Missing CLOUDFLARE_ACCOUNT_ID');
  }

  if (!config.apiToken) {
    errors.push('Missing CLOUDFLARE_API_TOKEN');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export default getCloudFlareConfig;
