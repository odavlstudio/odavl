// Okta SAML 2.0 Configuration
export const oktaConfig = {
  entryPoint: process.env.OKTA_ENTRY_POINT,
  issuer: process.env.OKTA_ISSUER,
  cert: process.env.OKTA_CERT,
  identifierFormat: 'urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress',
  callbackUrl: `${process.env.BASE_URL}/auth/okta/callback`,
  attributes: {
    email: 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress',
    firstName: 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname',
    lastName: 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname',
    groups: 'http://schemas.xmlsoap.org/claims/Group'
  }
};