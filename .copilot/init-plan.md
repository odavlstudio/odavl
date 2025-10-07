🧠 Copilot Autonomous Execution Plan (ODAVL Mode)

You are operating in Governed Autonomous Mode inside ODAVL Studio.
Your mission is to execute the entire Wave Ω²-1A plan automatically and safely, following ODAVL’s strict policy.

📘 Phase 1 — Bootstrap Governance System

Create directory /.copilot/

Add OPERATING_AGREEMENT.md (as described below)

Add prompt.md, observations.example.json, decision.example.md, report.example.md

Create .github/workflows/odavl-guard.yml + scripts/check-diff.mjs + scripts/check-i18n.mjs

Add .github/PULL_REQUEST_TEMPLATE.md and CODEOWNERS for safe review process.

OPERATING_AGREEMENT.md

Process: Observe → Decide(A/B) → Act (≤40 lines/≤10 files) → Verify (shadow) → Learn.
Branches: odavl/<task>-<YYYYMMDD>. No protected paths.
Deliverables: observations.json, decision.md, PR, report.md (evidence).
Human LGTM required before merge.

⚙️ Phase 2 — Update Hero Section

Goal: Modernize hero (EN/DE/AR) + add animated timeline.

Update translations in locales/{en,de,ar}/common.json with:

hero.title / hero.subtitle / hero.ctaPrimary / hero.ctaSecondary

Add new component HeroTimeline.tsx with stagger animation (Framer Motion).

Integrate HeroTimeline into app/[locale]/(home)/page.tsx.

Text values:

EN → "Your code’s immune system—safe, autonomous, always learning."
DE → "Das Immunsystem für Ihren Code—sicher, autonom, lernfähig."
AR → "نظام مناعة للكود — آمن، ذاتي، ويتعلم باستمرار."

🔒 Phase 3 — Apply ODAVL Safety Gates

Ensure scripts/check-diff.mjs enforces:

≤ 40 lines / ≤ 10 files

No protected paths (/security/, *.spec.*, /public-api/)

Ensure scripts/check-i18n.mjs verifies i18n keys match EN.

Link them inside .github/workflows/odavl-guard.yml.

📈 Phase 4 — Execute Wave Ω²-1A

Create branch: odavl/landing-Ω2-1A-<date>

Observe current landing page structure → produce observations.json

Propose A/B improvement plans → save to decision.md

Apply chosen improvement (≤40 lines, ≤10 files)

Run Shadow Verify:

npm run lint, npm run typecheck

node scripts/check-i18n.mjs

Lighthouse snapshot (Home page ≥95)

Write report.md summarizing before/after metrics and open points

Open PR with filled .github/PULL_REQUEST_TEMPLATE.md

✅ Phase 5 — Human Review Gate

Wait for human LGTM approval before merge.

On merge success, append results to /.copilot/learn.json.

⚠️ Rules of Engagement

Never touch protected paths or delete files.

All changes under governance limits.

Always explain rationale before applying code.

When in doubt, pause and ask for human confirmation.

Deliverables for this Run

Governance folder .copilot/ with all templates.

Full CI Guard pipeline + scripts.

Updated Hero (3 languages + animation).

Complete reports/waves/Ω2-1A.md evidence file.

Open PR ready for review.

END OF PLAN

Begin execution with OBSERVE phase and confirm created structure before coding.