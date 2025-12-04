# ODAVL Copilot Website Charter

## Focus Areas

- **Required Pages**: Ensure `/signup`, `/privacy-policy`, `/terms`, `/docs` exist
- **Internationalization**: No hardcoded strings, all text through i18n keys
- **Internal Links**: Validate all internal navigation routes
- **Local Assets**: Images and resources served locally, no external CDNs

## Verification Checklist

- `apps/web build` passes without errors  
- No 404s on critical routes during static check
- All user-facing strings use i18n translation keys
- Image assets properly optimized and locally hosted
- Navigation menus functional across all supported languages

## Quality Gates

- Build time <120 seconds for production bundle
- All required legal/business pages accessible
- SEO metadata properly configured
- Performance scores >90 for key landing pages
