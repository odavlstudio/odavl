// Azure AD OpenID Configuration
export const azureAdConfig = {
  identityMetadata: `https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID}/v2.0/.well-known/openid-configuration`,
  clientID: process.env.AZURE_CLIENT_ID,
  clientSecret: process.env.AZURE_CLIENT_SECRET,
  redirectUrl: `${process.env.BASE_URL}/auth/azuread/callback`,
  scope: ['profile', 'email', 'User.Read']
};