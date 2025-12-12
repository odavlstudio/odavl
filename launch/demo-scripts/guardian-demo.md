# Guardian Demo Script (90 seconds)

**Goal**: Show pre-deploy validation catching issues

## Setup
- Sample website (intentional accessibility/performance issues)
- Guardian ready to test
- Quality gates configured

## Script (90s)

**[0-15s] Opening**
"ODAVL Guardian validates before deployment. Accessibility, performance, security - all tested automatically."

**[15-35s] Run Tests**
*Execute guardian test*
"Testing odavl-demo.com... Guardian checks 50+ rules across 4 categories."

**[35-55s] Results Dashboard**
*Show results*
- Accessibility: 88% (3 WCAG violations)
- Performance: 92% (LCP too slow)
- Security: 100% (SSL, CSP, OWASP passed)
- SEO: 95% (missing meta descriptions)

**[55-70s] Drill Down**
*Click accessibility issue*
"Missing alt text on 3 images. Links without descriptive text. Guardian shows exact locations and fixes."

**[70-90s] Quality Gates**
"Overall score: 94%. Threshold: 90%. Status: PASSED ✅"
"Guardian blocks deployment if score drops below threshold. No bugs reach production. Free at odavl.com"
