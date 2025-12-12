/**
 * @fileoverview Auth module exports
 * Centralized exports for SSO, cloud connectors, white-label, middleware, provisioning
 */

// SSO integration
export { SSOIntegration, type SAMLConfig, type OAuthConfig, type TokenValidationResult, type SessionConfig } from './sso-integration';

// Cloud connectors
export { AzureADConnector, type AzureADConfig, type AzureUser, type AzureGroup } from './azure-ad-connector';
export { GoogleWorkspaceConnector, type GoogleWorkspaceConfig, type GoogleUser, type GoogleGroup } from './google-workspace-connector';
export { OktaConnector, type OktaConfig, type OktaUser, type OktaGroup, type SCIMUser } from './okta-connector';

// White-label branding
export { WhiteLabelBranding, type BrandingConfig, type ThemeVariables } from './white-label-branding';

// Auth middleware
export { AuthMiddleware, type AuthenticatedUser, type AuthMiddlewareOptions } from './auth-middleware';

// User provisioning
export { UserProvisioning, type SCIMUser as SCIMUserProvision, type SCIMGroup, type AttributeMapping, type ProvisioningConfig } from './user-provisioning';
