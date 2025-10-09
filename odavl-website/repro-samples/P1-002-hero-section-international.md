# P1-002: Hero Section Broken (International)

## Issue Description
The main homepage hero section is completely broken for French and Spanish users, displaying MISSING_MESSAGE errors instead of marketing content.

## Reproduction Steps
1. Start development server: `npm run dev`
2. Navigate to: http://localhost:3002/fr (French)
3. Open browser Developer Tools (F12)
4. Check Console tab for errors
5. Repeat with: http://localhost:3002/es (Spanish)

## Expected Console Errors (French)
```
MISSING_MESSAGE: Could not resolve `hero.preHeadline` in messages for locale `fr`
MISSING_MESSAGE: Could not resolve `hero.headline` in messages for locale `fr`
MISSING_MESSAGE: Could not resolve `hero.subheadline` in messages for locale `fr`
MISSING_MESSAGE: Could not resolve `hero.trustIndicator` in messages for locale `fr`
MISSING_MESSAGE: Could not resolve `hero.benefits.autonomous` in messages for locale `fr`
MISSING_MESSAGE: Could not resolve `hero.ctaPrimary` in messages for locale `fr`
```

## Visual Evidence
- Homepage loads with HTTP 200 status
- Hero section displays error messages instead of content
- CTA buttons show MISSING_MESSAGE text
- Complete loss of marketing messaging
- Same pattern occurs for Spanish (ES) locale

## File Locations
- **Component:** `src/components/landing/EnhancedHeroSection.tsx`
- **Missing Translation Files:** 
  - `messages/fr.json` (incomplete/missing hero keys)
  - `messages/es.json` (incomplete/missing hero keys)

## Impact Assessment
- **Severity:** P1 Critical
- **Business Impact:** Complete homepage failure for international users
- **User Experience:** No marketing message, broken CTA buttons
- **Affected Users:** French and Spanish speaking users (major markets)
- **Brand Impact:** Unprofessional appearance in international markets

## Fix Requirements
1. Create complete hero translation namespace in `messages/fr.json`
2. Create complete hero translation namespace in `messages/es.json`
3. Ensure all hero elements have proper translations:
   - Pre-headline text
   - Main headline
   - Subheadline/description
   - Trust indicators
   - Benefits list
   - Primary CTA button
4. Test homepage renders correctly in FR/ES locales
5. Verify CTA buttons function properly