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

Context: ODAVL Website (use .copilot/profile.website.md).
Branch: odavl/web-complete-audit-prepare-20251007

You are CopilotAgent acting as an expert Site Auditor & Remediator in Governed Autonomous Mode.

Mission (short)
Thoroughly audit, run, test, and harden the entire odavl-website so it becomes a realistic, production-ready website — not a demo with placeholders. Verify all pages share the same polished design system, every interaction and CTA works, all i18n keys exist for EN/DE/AR, and there are no placeholder strings, images, or “fake” content left. Use only factual material drawn from the repository (reports, audits, wave artifacts, README content). Where external/3rd-party real customer testimonials are required but not present in-repo, create a blocking task and mark it in the report — do NOT invent or publish fake external testimonials.

High-level rules (must obey)
- Work *only* inside `odavl-website/`.
- Branch must be `odavl/web-complete-audit-prepare-20251007`.
- Respect governance: any *implementation* change must be ≤40 added/modified lines and ≤10 files per patch. If more fixes are needed, produce multiple small patches/waves and wait for human LGTM between them.
- Do NOT touch protected paths: `**/security/**`, `**/*.spec.*`, `**/public-api/**`.
- EN is source-of-truth for copy; updates must be mirrored to DE and AR with equivalent keys.
- Run Shadow Verify (lint, typecheck, build, i18n check) and include logs.
- Produce artifacts: `observations.json`, `decision.md`, `reports/waves/Ω²-complete-audit.md`, and open PR(s) with evidence.

Step-by-step plan (OBSERVE → DECIDE → ACT → VERIFY → LEARN)

1) OBSERVE (full repo scan)
- Run a full file/folder scan of `odavl-website/`: pages, components, styles, assets, i18n messages, scripts, and any example/placeholder directories.
- Start the development server (`pnpm/pnpm dev` or repo's dev command) and load the site locally. If multiple locales are available, open EN/DE/AR.
- Programmatically crawl every page/path found in the routing table (including dynamic routes) to discover runtime errors, broken links, missing assets, or console errors.
- Run automated checks:
  - ESLint
  - TypeScript typecheck
  - Build (`pnpm build`)
  - Lighthouse (Home page; collect score)
  - Accessibility audit (basic axe or Lighthouse A11y)
  - Unit & E2E tests if present (run `pnpm test` / Playwright / Cypress).
- Collect all findings into `/observations.json` with file-level references and sample console/build traces.

2) DECIDE (recommendations and prioritization)
- Produce `/decision.md` listing the problems found, grouped as:
  A. Critical blocking issues (must fix before any public release)
  B. High-priority UX/consistency issues
  C. Content authenticity (placeholders/fake content)
  D. Performance/SEO accessibility
- For each group, propose concrete fixes (small, prioritized). For each fix, include:
  - exact files to edit
  - rough delta in lines & files (ensure each patch ≤40 lines / ≤10 files)
  - risk & rollback notes
  - whether the fix can be auto-applied or needs human approval (e.g., testimonials)

3) ACT (implement 1st safe patch after decision)
- Implement a single *high-value, safe, and line-budgeted* patch automatically:
  - Prefer non-invasive fixes: replace placeholder copy with factual content derived from internal ODAVL reports, wave summaries, and audit outputs found in repo. Example: convert "Placeholder testimonial" → "Verified by ODAVL Audit: VERIFICATION COMPLETE — Wave Ω²-1A" + link to report, or "500+ engineer-hours saved (internal pilot measurement)" if this is supported by existing reports. Use internal evidence only.
  - Remove or replace obvious `placeholder` labels in UI (buttons, headings, images). If an image is a decorative placeholder, replace with an optimized SVG derived from existing project logo/art (no external downloads).
  - Ensure EN/DE/AR i18n keys are added/updated with parity. If automatic translation is needed, generate DE/AR equivalents using repository phrasing and mark for human review.
  - Standardize layout: ensure header/footer/hero/components use the same design tokens/classes (Tailwind config) and typography scale.
  - Add runtime checks for analytics/tracking stubs so `track` calls don't error when dataLayer is absent (graceful no-op).
- Before committing, run the Shadow Verify steps locally.

4) VERIFY (evidence + metrics)
- Run Shadow Verify: lint, typecheck, build. Include logs in the PR.
- Run Lighthouse (Home) and include screenshot + score. Target: keep or improve previous baseline (Lighthouse ≥95 expected; if not achievable, report gap).
- Run the crawler again and ensure zero runtime console errors and no 404 assets.
- Confirm i18n missing keys = 0 for EN→DE/AR.
- Include before/after screenshots or console traces where changes were made.

5) LEARN (report + next steps)
- Write `/reports/waves/Ω²-complete-audit.md` summarizing:
  - what was changed, why, and where (file diffs)
  - Shadow Verify evidence & logs (embed short excerpts)
  - outstanding items that require human input (e.g., real customer testimonials, official logos, external trust badges)
  - recommended next safe waves (e.g., replace static metrics with live JSON-backed metrics, motion polish, cycle animation)
- Open a PR titled: `Ω²-complete-audit — remove placeholders, align design, verify (≤40 lines)` with:
  - summary of changes
  - Shadow Verify artifacts
  - explicit list of files changed and line count
  - ACTION REQUIRED: human LGTM for merging and guidance on any blocked items (e.g., testimonials).

Important content rules about placeholders/testimonials
- Do NOT invent external customer testimonials or attribute quotes to real external people or companies who did not explicitly consent.
- If real external testimonials exist in the repo (e.g., in prior reports or attachable emails), you may surface them with proper provenance and link.
- When no real external testimonial exists, *replace placeholders with:*
  - internal audit-derived factual statements (e.g., "Verified by ODAVL Audit — Wave Ω²-1A", "ESLint: 9,632 → 0 fixed (internal audit)"), or
  - badges summarizing internal metrics ("500+ engineer-hours saved (internal pilot)"), or
  - an explicit call-to-action saying "Provide a 1–2 sentence customer testimonial to replace this placeholder" and create an issue blocking the merge.
- Any content marked as “sample” or “internal” must be clearly labelled as such in the UI (if shown) and included in PR evidence.

Edge cases & fallbacks
- If a single automated patch cannot resolve all critical issues within the line/file budgets, split into the minimum number of follow-up safe patches and produce a small plan of waves (Ω²-…).
- If running the dev server fails due to missing env variables/secrets, try to run a static build and annotate missing runtime-only checks. Create a small `.env.example` stub if safe and required (no secrets).

Deliverables (must commit to branch and PR)
- `/observations.json` (crawl & findings)
- `/decision.md`
- `/reports/waves/Ω²-complete-audit.md`
- Shadow Verify logs attached to PR
- PR(s) with small patches and evidence
- A clear list of blocking human inputs (if any), and recommended next waves

Begin with OBSERVE: run the scan and return `/observations.json` plus a short executive summary. Then produce `/decision.md`. WAIT for human LGTM in the PR flow before proceeding with ACT changes that alter UI copy or testimonial content.

If you understand, start NOW with OBSERVE and return `/observations.json` and the executive summary in this branch.
