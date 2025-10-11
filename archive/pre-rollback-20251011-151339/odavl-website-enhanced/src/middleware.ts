// ODAVL SSR Fix: Simplified middleware for proper locale routing
import createMiddleware from 'next-intl/middleware';

export default createMiddleware({
  locales: ['en','de','ar','fr','it','ja','es','pt','ru','zh'],
  defaultLocale: 'en'
});

export const config = {
  matcher: ['/', '/(en|de|ar|fr|it|ja|es|pt|ru|zh)/:path*']
};