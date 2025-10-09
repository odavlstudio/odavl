# P1-003: Trust Section Missing (International)

## Issue Description
The trust section (social proof, testimonials, metrics) is completely missing for all non-English locales due to missing translation namespace.

## Reproduction Steps
1. Start development server: `npm run dev`
2. Navigate to: http://localhost:3002/fr (French)
3. Open browser Developer Tools (F12)
4. Check Console tab for trust-related errors
5. Scroll to trust section on homepage
6. Repeat with other locales: /es, /de, /ar, etc.

## Expected Console Errors
```
MISSING_MESSAGE: Could not resolve `trust` in messages for locale `fr`
MISSING_MESSAGE: Could not resolve `trust` in messages for locale `es`
```

## Visual Evidence
- Homepage loads successfully
- Trust section area is empty or shows error messages
- No social proof displayed to international users
- Missing testimonials, metrics, customer logos
- Affects conversion rates and credibility

## File Locations
- **Component:** `src/components/landing/TrustSection.tsx`
- **Missing Translation Files:** All non-English locale files missing `trust` namespace
  - `messages/fr.json`
  - `messages/es.json` 
  - `messages/de.json`
  - `messages/ar.json`
  - `messages/it.json`
  - `messages/pt.json`
  - `messages/ru.json`
  - `messages/ja.json`
  - `messages/zh.json`

## Impact Assessment
- **Severity:** P1 Critical
- **Business Impact:** No social proof for 90% of configured locales
- **User Experience:** Missing trust indicators hurt conversion
- **Affected Users:** All non-English speaking users
- **Conversion Impact:** Reduced credibility and trust signals

## Fix Requirements
1. Add complete `trust` namespace to all locale files
2. Include trust elements:
   - Customer testimonials
   - Usage statistics/metrics
   - Company logos/social proof
   - Security badges
   - Industry recognition
3. Test trust section displays correctly in all locales
4. Verify social proof elements render properly