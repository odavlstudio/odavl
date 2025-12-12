/**
 * @fileoverview White-Label Branding for ODAVL Insight
 * Custom logo, colors, fonts, email templates, custom domains
 */

export interface BrandingConfig {
  tenantId: string;
  logo?: {
    url: string;
    width?: number;
    height?: number;
  };
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background?: string;
    text?: string;
  };
  fonts?: {
    heading?: string;
    body?: string;
  };
  customDomain?: string;
  emailTemplates?: Record<string, string>;
}

export interface ThemeVariables {
  '--primary-color': string;
  '--secondary-color': string;
  '--accent-color': string;
  '--background-color': string;
  '--text-color': string;
  '--font-heading': string;
  '--font-body': string;
}

export class WhiteLabelBranding {
  /**
   * Generate CSS theme variables from branding config
   */
  static generateTheme(config: BrandingConfig): ThemeVariables {
    return {
      '--primary-color': config.colors.primary,
      '--secondary-color': config.colors.secondary,
      '--accent-color': config.colors.accent,
      '--background-color': config.colors.background || '#ffffff',
      '--text-color': config.colors.text || '#000000',
      '--font-heading': config.fonts?.heading || 'system-ui, sans-serif',
      '--font-body': config.fonts?.body || 'system-ui, sans-serif',
    };
  }

  /**
   * Generate CSS stylesheet
   */
  static generateCSS(config: BrandingConfig): string {
    const theme = this.generateTheme(config);
    const vars = Object.entries(theme)
      .map(([key, value]) => `  ${key}: ${value};`)
      .join('\n');

    return `
:root {
${vars}
}

/* Primary button */
.btn-primary {
  background-color: var(--primary-color);
  color: white;
}

.btn-primary:hover {
  background-color: color-mix(in srgb, var(--primary-color) 80%, black);
}

/* Secondary button */
.btn-secondary {
  background-color: var(--secondary-color);
  color: white;
}

/* Links */
a {
  color: var(--accent-color);
}

a:hover {
  color: color-mix(in srgb, var(--accent-color) 80%, black);
}

/* Headings */
h1, h2, h3, h4, h5, h6 {
  font-family: var(--font-heading);
  color: var(--text-color);
}

/* Body text */
body {
  font-family: var(--font-body);
  color: var(--text-color);
  background-color: var(--background-color);
}
`.trim();
  }

  /**
   * Upload logo to cloud storage
   */
  static async uploadLogo(
    file: Buffer,
    tenantId: string,
    storage: 's3' | 'azure-blob' | 'gcs',
    config: Record<string, string>
  ): Promise<string> {
    const filename = `logos/${tenantId}/logo.png`;

    if (storage === 's3') {
      // AWS S3 upload (simplified - production should use AWS SDK)
      const response = await fetch(`${config.endpoint}/${config.bucket}/${filename}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'image/png',
          'x-amz-acl': 'public-read',
        },
        body: file,
      });

      if (!response.ok) {
        throw new Error(`S3 upload failed: ${response.statusText}`);
      }

      return `${config.endpoint}/${config.bucket}/${filename}`;
    } else if (storage === 'azure-blob') {
      // Azure Blob Storage upload
      const response = await fetch(
        `${config.endpoint}/${config.container}/${filename}?${config.sasToken}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'image/png',
            'x-ms-blob-type': 'BlockBlob',
          },
          body: file,
        }
      );

      if (!response.ok) {
        throw new Error(`Azure Blob upload failed: ${response.statusText}`);
      }

      return `${config.endpoint}/${config.container}/${filename}`;
    } else if (storage === 'gcs') {
      // Google Cloud Storage upload
      const response = await fetch(`${config.endpoint}/${config.bucket}/${filename}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'image/png',
          Authorization: `Bearer ${config.accessToken}`,
        },
        body: file,
      });

      if (!response.ok) {
        throw new Error(`GCS upload failed: ${response.statusText}`);
      }

      return `${config.endpoint}/${config.bucket}/${filename}`;
    }

    throw new Error(`Unsupported storage: ${storage}`);
  }

  /**
   * Generate branded email template
   */
  static generateEmailTemplate(
    type: 'welcome' | 'invitation' | 'password-reset' | 'notification',
    config: BrandingConfig,
    data: Record<string, string>
  ): string {
    const logoHtml = config.logo
      ? `<img src="${config.logo.url}" alt="Logo" width="${config.logo.width || 150}" />`
      : '';

    const templates = {
      welcome: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: ${config.fonts?.body || 'sans-serif'}; color: ${config.colors.text || '#000'}; }
    .header { background-color: ${config.colors.primary}; padding: 20px; text-align: center; }
    .content { padding: 30px; }
    .button { background-color: ${config.colors.accent}; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; }
  </style>
</head>
<body>
  <div class="header">${logoHtml}</div>
  <div class="content">
    <h1>Welcome ${data.name}!</h1>
    <p>Thank you for joining ODAVL Insight. Your account is now active.</p>
    <a href="${data.loginUrl}" class="button">Get Started</a>
  </div>
</body>
</html>`,

      invitation: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: ${config.fonts?.body || 'sans-serif'}; color: ${config.colors.text || '#000'}; }
    .header { background-color: ${config.colors.primary}; padding: 20px; text-align: center; }
    .content { padding: 30px; }
    .button { background-color: ${config.colors.accent}; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; }
  </style>
</head>
<body>
  <div class="header">${logoHtml}</div>
  <div class="content">
    <h1>You've Been Invited!</h1>
    <p>${data.inviterName} has invited you to join their team on ODAVL Insight.</p>
    <a href="${data.inviteUrl}" class="button">Accept Invitation</a>
    <p><small>This invitation expires in 7 days.</small></p>
  </div>
</body>
</html>`,

      'password-reset': `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: ${config.fonts?.body || 'sans-serif'}; color: ${config.colors.text || '#000'}; }
    .header { background-color: ${config.colors.primary}; padding: 20px; text-align: center; }
    .content { padding: 30px; }
    .button { background-color: ${config.colors.accent}; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; }
  </style>
</head>
<body>
  <div class="header">${logoHtml}</div>
  <div class="content">
    <h1>Reset Your Password</h1>
    <p>Click the button below to reset your password:</p>
    <a href="${data.resetUrl}" class="button">Reset Password</a>
    <p><small>This link expires in 1 hour. If you didn't request this, ignore this email.</small></p>
  </div>
</body>
</html>`,

      notification: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: ${config.fonts?.body || 'sans-serif'}; color: ${config.colors.text || '#000'}; }
    .header { background-color: ${config.colors.primary}; padding: 20px; text-align: center; }
    .content { padding: 30px; }
  </style>
</head>
<body>
  <div class="header">${logoHtml}</div>
  <div class="content">
    <h1>${data.title}</h1>
    <p>${data.message}</p>
  </div>
</body>
</html>`,
    };

    return templates[type];
  }

  /**
   * Configure custom domain with DNS validation
   */
  static async configureCustomDomain(
    domain: string,
    tenantId: string,
    provider: 'cloudflare' | 'route53' | 'azure-dns'
  ): Promise<{ success: boolean; records: Array<{ type: string; name: string; value: string }> }> {
    // Generate verification token
    const token = Math.random().toString(36).substring(2);

    // DNS records to create
    const records = [
      { type: 'TXT', name: `_odavl-verification.${domain}`, value: `odavl-tenant=${tenantId}-${token}` },
      { type: 'CNAME', name: domain, value: 'app.odavl.com' },
      { type: 'CNAME', name: `www.${domain}`, value: 'app.odavl.com' },
    ];

    return { success: true, records };
  }

  /**
   * Verify custom domain DNS configuration
   */
  static async verifyCustomDomain(domain: string, expectedToken: string): Promise<boolean> {
    try {
      // DNS lookup for TXT record (simplified - production should use dns.promises.resolveTxt)
      const response = await fetch(`https://dns.google/resolve?name=_odavl-verification.${domain}&type=TXT`);
      const data = await response.json();

      if (data.Answer) {
        const txtRecord = data.Answer.find((r: any) => r.type === 16); // TXT
        if (txtRecord && txtRecord.data.includes(expectedToken)) {
          return true;
        }
      }

      return false;
    } catch {
      return false;
    }
  }

  /**
   * Get branding config for tenant
   */
  static async getBrandingConfig(tenantId: string): Promise<BrandingConfig | null> {
    // This would fetch from database in production
    return null;
  }

  /**
   * Save branding config for tenant
   */
  static async saveBrandingConfig(config: BrandingConfig): Promise<void> {
    // This would save to database in production
  }
}
