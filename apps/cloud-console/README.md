# ODAVL Cloud Console

**Next.js 15 web dashboard for ODAVL SaaS platform.**

## Features

- **Authentication**: NextAuth.js with JWT sessions
- **Multi-Tenant**: Organization, team, and project management
- **Products**: Unified UI for Insight, Autopilot, Guardian, Marketplace, Intelligence
- **Billing**: Subscription management and usage tracking
- **API Integration**: REST API client for cloud services

## Architecture

```
apps/cloud-console/
├── app/               # Next.js 15 App Router
│   ├── layout.tsx     # Root layout
│   ├── page.tsx       # Landing page
│   ├── login/         # Authentication pages
│   ├── dashboard/     # Main dashboard
│   ├── marketplace/   # Extension marketplace
│   ├── intelligence/  # AI analytics
│   ├── projects/      # Project management
│   ├── settings/      # User settings
│   └── api/           # API routes
│       └── auth/      # NextAuth.js
├── components/        # Reusable React components
│   ├── navbar.tsx     # Navigation bar
│   ├── sidebar.tsx    # Sidebar menu
│   └── card.tsx       # Card component
├── lib/               # Utility libraries
│   └── api.ts         # API client
├── public/            # Static assets
├── styles/            # Global styles
└── next.config.mjs    # Next.js configuration
```

## Development

```bash
# Install dependencies
pnpm install

# Start dev server (port 3003)
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start
```

## Environment Variables

Create `.env.local`:

```env
# NextAuth
NEXTAUTH_URL=http://localhost:3003
NEXTAUTH_SECRET=<generate-with-openssl-rand-base64-32>

# OAuth Providers
GITHUB_ID=<github-oauth-client-id>
GITHUB_SECRET=<github-oauth-client-secret>
GOOGLE_ID=<google-oauth-client-id>
GOOGLE_SECRET=<google-oauth-client-secret>

# API Endpoints
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXT_PUBLIC_AUTH_URL=http://localhost:8090
NEXT_PUBLIC_BILLING_URL=http://localhost:8091
NEXT_PUBLIC_TASKS_URL=http://localhost:8092
```

## Pages

- `/` - Landing page
- `/login` - Sign in page
- `/dashboard` - Main dashboard
- `/marketplace` - Extension marketplace
- `/intelligence` - AI analytics
- `/projects` - Project list
- `/settings` - User settings

## API Integration

All pages use the unified API client at `/lib/api.ts` for backend communication.

## Styling

- **Framework**: Tailwind CSS 3.4
- **Theme**: Custom ODAVL brand colors
- **Components**: Utility-first design system
