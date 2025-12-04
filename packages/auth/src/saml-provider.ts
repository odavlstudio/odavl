/**
 * SAML/SSO Provider for Enterprise Authentication
 * Supports Okta, Azure AD, and other SAML 2.0 providers
 * 
 * Week 9-10: Enterprise Features
 * UNIFIED_ACTION_PLAN Phase 2 Month 3
 */

import type { Strategy as SamlStrategy } from 'passport-saml';

export interface SAMLConfig {
    /** Identity Provider (IdP) */
    entryPoint: string;
    issuer: string;
    callbackUrl: string;
    cert: string;
    
    /** Optional: Advanced settings */
    identifierFormat?: string;
    signatureAlgorithm?: string;
    decryptionPvk?: string;
    privateCert?: string;
    
    /** Provider type */
    provider: 'okta' | 'azure-ad' | 'onelogin' | 'google' | 'custom';
}

export interface SAMLProfile {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    displayName?: string;
    nameID?: string;
    nameIDFormat?: string;
    sessionIndex?: string;
    
    /** Raw SAML attributes */
    attributes?: Record<string, any>;
}

/**
 * SAML Provider Manager
 * Handles multiple SAML configurations for different tenants
 */
export class SAMLProviderManager {
    private configs: Map<string, SAMLConfig> = new Map();

    /**
     * Register SAML configuration for tenant
     */
    registerTenant(tenantId: string, config: SAMLConfig): void {
        this.configs.set(tenantId, config);
    }

    /**
     * Get SAML config for tenant
     */
    getConfig(tenantId: string): SAMLConfig | undefined {
        return this.configs.get(tenantId);
    }

    /**
     * Remove tenant configuration
     */
    removeTenant(tenantId: string): boolean {
        return this.configs.delete(tenantId);
    }

    /**
     * List all configured tenants
     */
    listTenants(): string[] {
        return Array.from(this.configs.keys());
    }

    /**
     * Validate SAML configuration
     */
    validateConfig(config: SAMLConfig): { valid: boolean; errors: string[] } {
        const errors: string[] = [];

        if (!config.entryPoint) {
            errors.push('entryPoint is required');
        }

        if (!config.issuer) {
            errors.push('issuer is required');
        }

        if (!config.callbackUrl) {
            errors.push('callbackUrl is required');
        }

        if (!config.cert) {
            errors.push('cert (IdP certificate) is required');
        }

        // Validate URLs
        try {
            new URL(config.entryPoint);
        } catch {
            errors.push('entryPoint must be valid URL');
        }

        try {
            new URL(config.callbackUrl);
        } catch {
            errors.push('callbackUrl must be valid URL');
        }

        return {
            valid: errors.length === 0,
            errors,
        };
    }
}

/**
 * Create SAML Strategy config for passport
 */
export function createSAMLStrategyConfig(config: SAMLConfig): any {
    return {
        entryPoint: config.entryPoint,
        issuer: config.issuer,
        callbackUrl: config.callbackUrl,
        cert: config.cert,
        identifierFormat: config.identifierFormat || 
            'urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress',
        signatureAlgorithm: config.signatureAlgorithm || 'sha256',
        decryptionPvk: config.decryptionPvk,
        privateCert: config.privateCert,
    };
}

/**
 * Parse SAML profile to ODAVL user format
 */
export function parseSAMLProfile(profile: any): SAMLProfile {
    return {
        id: profile.nameID || profile.id,
        email: profile.email || profile.nameID,
        firstName: profile.firstName || profile.givenName,
        lastName: profile.lastName || profile.surname,
        displayName: profile.displayName || 
            `${profile.firstName || ''} ${profile.lastName || ''}`.trim(),
        nameID: profile.nameID,
        nameIDFormat: profile.nameIDFormat,
        sessionIndex: profile.sessionIndex,
        attributes: profile,
    };
}

/**
 * Okta-specific configuration helper
 */
export function createOktaConfig(
    domain: string,
    appId: string,
    cert: string,
    callbackUrl: string
): SAMLConfig {
    return {
        provider: 'okta',
        entryPoint: `https://${domain}/app/${appId}/sso/saml`,
        issuer: `http://www.okta.com/${appId}`,
        callbackUrl,
        cert,
        identifierFormat: 'urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress',
    };
}

/**
 * Azure AD-specific configuration helper
 */
export function createAzureADConfig(
    tenantId: string,
    appId: string,
    cert: string,
    callbackUrl: string
): SAMLConfig {
    return {
        provider: 'azure-ad',
        entryPoint: `https://login.microsoftonline.com/${tenantId}/saml2`,
        issuer: `https://sts.windows.net/${tenantId}/`,
        callbackUrl,
        cert,
        identifierFormat: 'urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress',
    };
}

/**
 * Singleton instance for global SAML management
 */
export const samlProviderManager = new SAMLProviderManager();

/**
 * Express/Next.js middleware for SAML authentication
 */
export function createSAMLMiddleware(tenantId: string) {
    return async (req: any, res: any, next: any) => {
        const config = samlProviderManager.getConfig(tenantId);
        
        if (!config) {
            return res.status(404).json({
                error: 'SAML configuration not found for tenant',
            });
        }

        // Passport SAML strategy would be initialized here
        // This is a placeholder for actual implementation
        next();
    };
}

/**
 * Generate SAML metadata XML for IdP configuration
 */
export function generateSAMLMetadata(
    entityId: string,
    callbackUrl: string,
    publicCert?: string
): string {
    const metadata = `<?xml version="1.0"?>
<EntityDescriptor xmlns="urn:oasis:names:tc:SAML:2.0:metadata"
                  entityID="${entityId}">
  <SPSSODescriptor AuthnRequestsSigned="false"
                   WantAssertionsSigned="true"
                   protocolSupportEnumeration="urn:oasis:names:tc:SAML:2.0:protocol">
    <NameIDFormat>urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress</NameIDFormat>
    <AssertionConsumerService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST"
                              Location="${callbackUrl}"
                              index="1" />
    ${publicCert ? `
    <KeyDescriptor use="signing">
      <KeyInfo xmlns="http://www.w3.org/2000/09/xmldsig#">
        <X509Data>
          <X509Certificate>${publicCert}</X509Certificate>
        </X509Data>
      </KeyInfo>
    </KeyDescriptor>
    ` : ''}
  </SPSSODescriptor>
</EntityDescriptor>`;

    return metadata;
}
