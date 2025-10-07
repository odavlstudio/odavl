# ODAVL Website Profile
**Context**: ODAVL Website Development (Next.js 15 + TypeScript + Tailwind + next-intl)

## Scope & Boundaries
- **Work Areas**: `/odavl-website/` ONLY
- **Forbidden**: Never touch parent directories or sibling projects
- **Protected**: Never modify `/security/`, `**/*.spec.*`, `/public-api/`

## Branch Strategy
- **Prefix**: `odavl/web-<task>-<YYYYMMDD>`
- **Examples**: `odavl/web-hero-cta-20251007`, `odavl/web-i18n-de-20251007`

## Constraints
- **Maximum**: ≤40 lines changed, ≤10 files modified per PR
- **Process**: Observe → Decide → Act → Verify → Learn
- **Approval**: Human LGTM required before merge

## Technical Context
- **Framework**: Next.js 15.5.4 with App Router
- **Languages**: TypeScript, JavaScript, CSS
- **Styling**: Tailwind CSS + Custom Design System
- **Animations**: Framer Motion 12.23.22
- **i18n**: next-intl 4.3.9 (10 locales: EN, DE, AR, FR, ES, IT, PT, RU, JA, ZH)
- **Design**: Glass morphism with ODAVL Navy (#0f3460) + Electric Cyan (#00d4ff)

## Communication Tone
- **Style**: Designer-Developer hybrid, user experience focused
- **Audience**: Product managers, designers, marketing teams, end users
- **Format**: User impact explanations, design reasoning, conversion optimization
- **Examples**: "Enhanced CTA conversion flow", "Improved mobile responsiveness"

## Key Files to Monitor
- `src/app/[locale]/page.tsx` - Main landing page
- `src/components/landing/` - Landing page components
- `messages/*.json` - Internationalization files
- `src/lib/seo.ts` - SEO configuration
- `next.config.ts` - Next.js configuration
- `tailwind.config.ts` - Design system configuration

## Landing Page Architecture
- **EnhancedHeroSection**: Primary CTA and value proposition
- **InteractiveDemoSection**: 480-line showcase (exceptional asset)
- **FeaturesSection**: Business benefits and technical capabilities
- **TestimonialsSection**: Social proof and case studies
- **EnhancedPricingSection**: ROI calculator and conversion