# ODAVL Studio Marketing Website

**www.odavl.com** - Official marketing website for ODAVL Studio

## Overview

Next.js 15 marketing website showcasing ODAVL's three products (Insight, Autopilot, Guardian), pricing, marketplace, and brand identity.

## Tech Stack

- **Framework**: Next.js 15.0.3 (App Router)
- **React**: 19.0.0
- **Styling**: Tailwind CSS 3.4
- **Animations**: Framer Motion 11.0
- **Icons**: Lucide React 0.300
- **TypeScript**: 5.3.3
- **Port**: 3004

## Development

```bash
# Install dependencies
pnpm install

# Start dev server
pnpm dev
# → http://localhost:3004

# Build for production
pnpm build

# Start production server
pnpm start

# Type check
pnpm typecheck

# Lint
pnpm lint
```

## Project Structure

```
src/
├── app/                      # Next.js App Router pages
│   ├── layout.tsx           # Root layout with SEO metadata
│   ├── page.tsx             # Home page
│   ├── globals.css          # Global styles
│   ├── pricing/page.tsx     # Pricing page
│   ├── products/
│   │   ├── page.tsx         # Products overview
│   │   ├── insight/page.tsx # Insight product page
│   │   ├── autopilot/page.tsx # Autopilot product page
│   │   └── guardian/page.tsx # Guardian product page
│   ├── marketplace/page.tsx # Marketplace page
│   └── contact/page.tsx     # Contact sales page
├── components/              # Reusable components
│   ├── hero.tsx            # Hero section with animations
│   ├── features.tsx        # Features grid
│   ├── footer.tsx          # Footer with links
│   └── navbar.tsx          # Navigation bar with mobile menu
├── lib/                     # Utilities and configuration
│   ├── palette.ts          # Brand color palette
│   └── typography.ts       # Typography system
public/
└── logo.svg                # ODAVL logo

```

## Brand System

### Colors

```typescript
// Primary
blue: #3b82f6
purple: #8b5cf6
green: #10b981

// Neutrals
dark: #1e293b
light: #f8fafc
```

See `src/lib/palette.ts` for complete palette.

### Typography

```typescript
// Fonts
sans: Inter
mono: Fira Code

// Scale
base: 16px (1rem)
ratio: 1.25 (Major Third)
```

See `src/lib/typography.ts` for complete system.

## Pages

| Route | Description |
|-------|-------------|
| `/` | Home page with hero, products grid, features |
| `/pricing` | Pricing plans (Free, Pro, Enterprise) |
| `/products` | Products overview |
| `/products/insight` | ODAVL Insight product page |
| `/products/autopilot` | ODAVL Autopilot product page |
| `/products/guardian` | ODAVL Guardian product page |
| `/marketplace` | Marketplace with packages |
| `/contact` | Contact sales form |

## SEO & Performance

- Open Graph tags for social sharing
- Twitter Card metadata
- Lighthouse-optimized
- Image optimization with Next.js Image
- Static generation for fast loads
- Security headers (X-Frame-Options, CSP)

## Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
pnpm add -g vercel

# Deploy
vercel
```

### Docker

```bash
# Build image
docker build -t odavl-marketing .

# Run container
docker run -p 3004:3004 odavl-marketing
```

### Manual

```bash
# Build
pnpm build

# Start (requires Node 18+)
pnpm start
```

## Environment Variables

```bash
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXT_PUBLIC_CONSOLE_URL=http://localhost:3003
```

## Integration with Cloud Platform

Marketing website integrates with:

- **Cloud Console** (`http://localhost:3003`) - User dashboard
- **API Gateway** (`http://localhost:8080/api/v1`) - Public API
- **Authentication** (port 8090) - User auth (future)

## Contributing

See `CONTRIBUTING.md` in root for guidelines.

## License

Copyright © 2025 ODAVL Studio. All rights reserved.
