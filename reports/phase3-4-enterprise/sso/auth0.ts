// Auth0 OpenID Connect Configuration
export const auth0Config = {
  domain: process.env.AUTH0_DOMAIN,
  clientID: process.env.AUTH0_CLIENT_ID,
  clientSecret: process.env.AUTH0_CLIENT_SECRET,
  callbackURL: `${process.env.BASE_URL}/auth/auth0/callback`,
  scope: 'openid profile email',
  audience: process.env.AUTH0_AUDIENCE
};