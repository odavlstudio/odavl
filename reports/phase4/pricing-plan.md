# ODAVL Phase 4: Pricing & Billing Implementation Plan

## Current Site Audit

### Existing Pricing Infrastructure
- **Route**: `/[locale]/pricing` already exists and functional
- **Component**: `PricingTable.tsx` in `src/components/ui/` with motion animations
- **i18n**: Full pricing translations in `messages/en.json` (and other locales)
- **Design**: Glass morphism styling consistent with site theme
- **Navigation**: Accessible via home page developer section `/pricing` link

### Current Pricing Structure (from i18n)
1. **Starter**: $29/month - Individual developers, 3 repos, basic features
2. **Professional**: $99/month - Teams, unlimited repos, advanced features  
3. **Enterprise**: Custom pricing - Large orgs, on-prem, SLA, compliance

### Missing Components for Phase 4 Goals
1. **Canonical Data Model**: No `src/data/pricing.ts` - currently hardcoded in i18n
2. **Checkout Integration**: No Stripe integration or API routes
3. **Billing Documentation**: No deployment/admin guides
4. **Environment Setup**: No `.env.example` with billing vars
5. **Legal Terms**: No specific pricing/billing terms page

## Micro-Commit Implementation Plan

### STEP B1: Data Model (≤40 lines, ≤10 files)
**Files to modify:**
- `src/data/pricing.ts` (new, ~35 lines) - Canonical pricing data structure
- `src/app/[locale]/pricing/page.tsx` (modify, ~5 lines) - Import data from new file

**Changes:**
- Extract pricing data from i18n into TypeScript data file
- Maintain existing feature structure but make it more developer-friendly
- Keep prices realistic: Free tier, Pro $69/month, Enterprise custom

### STEP B2: Enhanced Components (≤40 lines, ≤10 files) 
**Files to modify:**
- `src/components/ui/PricingCard.tsx` (new, ~40 lines) - Individual reusable card
- `src/components/ui/PricingTable.tsx` (modify, ~10 lines) - Use new PricingCard

**Changes:**
- Create atomic PricingCard component for reusability
- Add proper CTA routing (trial/contact/checkout)
- Maintain existing glass morphism styling

### STEP C1: Stripe API Stub (≤40 lines, ≤10 files)
**Files to modify:**
- `src/app/api/stripe/create-session/route.ts` (new, ~35 lines) - Next.js 13+ App Router
- `.env.example` (new, ~10 lines) - Environment variable templates

**Changes:**
- Create API route that returns 501 if STRIPE_SECRET_KEY missing
- Add proper error handling and test mode simulation
- Include webhook endpoint placeholder

### STEP C2: Billing Documentation (≤40 lines, ≤10 files)
**Files to modify:**
- `README_DEPLOY/BILLING.md` (new, ~40 lines) - Stripe setup instructions
- `README_ADMIN.md` (new, ~35 lines) - Admin billing management

**Changes:**
- Clear step-by-step Stripe account setup
- Environment variable configuration
- Production vs test mode instructions

### STEP D1: Legal Terms (≤40 lines, ≤10 files)
**Files to modify:**
- `src/app/[locale]/terms/pricing/page.tsx` (new, ~40 lines) - Pricing terms page
- `reports/phase4/pricing-kpis.md` (new, ~30 lines) - KPI definitions

**Changes:**
- Basic pricing terms placeholder (14-day trial, monthly billing)
- KPI tracking structure for business metrics
- TODO markers for legal review

## Integration Points

### Home Page CTA Locations
- **Hero Section**: Primary CTA already links to contact - could route to pricing
- **Navigation**: Top nav could include pricing link (currently hidden in dev section)
- **Footer**: Already has links structure for pricing integration

### Existing Component Reuse
- **Button**: `ODButton.tsx` with variant support (primary/outline)
- **Card**: `ODCard.tsx` for consistent styling
- **Badge**: `ODBadge.tsx` for "Popular" indicators
- **Motion**: Framer Motion already configured for animations

### Technical Architecture
- **Next.js 13+**: App Router structure in place
- **i18n**: next-intl configured for 9 languages
- **Styling**: Tailwind + CSS-in-JS with design tokens
- **API Routes**: `/api` directory ready for Stripe integration

## Manual Steps Summary (Post-Implementation)

### Stripe Configuration (Requires Mohammad)
1. Create Stripe account and get test keys
2. Configure webhook endpoints for subscription events
3. Set up product catalog in Stripe dashboard
4. Add environment variables to deployment platform (Vercel)

### Production Environment
- `STRIPE_SECRET_KEY=sk_live_...` (Live secret key)
- `STRIPE_PUBLISHABLE_KEY=pk_live_...` (Live publishable key)  
- `STRIPE_WEBHOOK_SECRET=whsec_...` (Webhook signature verification)

### SSO Integration (Future)
- SAML IdP metadata and entity configuration
- SAML_IDP_URL, SAML_ENTITY_ID environment variables
- Legal DPA/SLA document finalization

### Legal & Compliance
- Terms of Service review and approval
- Privacy Policy updates for billing data
- GDPR compliance for EU customers
- SLA document creation for Enterprise tier

## Estimated Implementation Time
- **STEP A**: ✅ Complete (audit and planning)
- **STEP B**: ~30 minutes (data model + components)
- **STEP C**: ~45 minutes (API stub + documentation)  
- **STEP D**: ~20 minutes (legal placeholders + KPIs)
- **STEP E**: ~15 minutes (admin docs + QA)

**Total**: ~2 hours for full implementation with micro-commits
**Risk Level**: Low (mostly data structure and documentation)
**Dependencies**: Stripe keys from Mohammad for live testing