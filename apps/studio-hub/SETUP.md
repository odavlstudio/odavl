// Setup Instructions for Studio Hub
// Week 1 Deployment Guide

# ODAVL Studio Hub - Setup Guide

## Prerequisites

- Node.js 20+ installed
- pnpm 9+ installed
- PostgreSQL 15+ running locally or remote
- GitHub OAuth App created (https://github.com/settings/developers)
- Google OAuth Client created (https://console.cloud.google.com/apis/credentials)

## Step 1: Environment Variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your credentials:

```env
# Database - Update with your PostgreSQL credentials
DATABASE_URL="postgresql://username:password@localhost:5432/odavl_hub?schema=public"

# NextAuth - Generate secret with: openssl rand -base64 32
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-generated-secret-here"

# GitHub OAuth
GITHUB_ID="your-github-client-id"
GITHUB_SECRET="your-github-client-secret"

# Google OAuth
GOOGLE_ID="your-google-client-id.apps.googleusercontent.com"
GOOGLE_SECRET="your-google-client-secret"
```

## Step 2: Create GitHub OAuth App

1. Go to https://github.com/settings/developers
2. Click "New OAuth App"
3. Fill in:
   - Application name: `ODAVL Studio (Development)`
   - Homepage URL: `http://localhost:3000`
   - Authorization callback URL: `http://localhost:3000/api/auth/callback/github`
4. Copy Client ID → `GITHUB_ID`
5. Generate new client secret → `GITHUB_SECRET`

## Step 3: Create Google OAuth Client

1. Go to https://console.cloud.google.com/apis/credentials
2. Create Project (if needed): "ODAVL Studio"
3. Click "Create Credentials" → "OAuth 2.0 Client ID"
4. Configure consent screen if prompted
5. Application type: "Web application"
6. Authorized redirect URIs: `http://localhost:3000/api/auth/callback/google`
7. Copy Client ID → `GOOGLE_ID`
8. Copy Client Secret → `GOOGLE_SECRET`

## Step 4: Database Setup

```bash
# Generate Prisma Client
pnpm db:generate

# Push schema to database (creates tables)
pnpm db:push

# Seed with test data
pnpm db:seed
```

## Step 5: Start Development Server

```bash
pnpm dev
```

Visit: http://localhost:3000

## Step 6: Test Authentication

1. Click "Sign In"
2. Choose GitHub or Google
3. Authorize the app
4. You should be redirected to `/dashboard`

## Troubleshooting

### Database connection fails

Check PostgreSQL is running:
```bash
psql -U postgres -l
```

### OAuth redirect fails

Ensure callback URLs match exactly:
- GitHub: `http://localhost:3000/api/auth/callback/github`
- Google: `http://localhost:3000/api/auth/callback/google`

### Prisma Client not found

Run:
```bash
pnpm db:generate
```

### Port 3000 already in use

Change port in `package.json`:
```json
"dev": "next dev -p 3001"
```

## Prisma Studio (Database GUI)

View and edit database records:

```bash
pnpm db:studio
```

Visit: http://localhost:5555

## Available Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint
- `pnpm db:generate` - Generate Prisma Client
- `pnpm db:push` - Push schema to database
- `pnpm db:migrate` - Create migration
- `pnpm db:seed` - Seed database with test data
- `pnpm db:studio` - Open Prisma Studio

## Next Steps (Week 1 Remaining)

- [x] Setup authentication
- [x] Create database schema
- [ ] Test OAuth flows
- [ ] Create dashboard layout
- [ ] Add protected routes

## Week 2 Preview

- Multi-tenancy (organizations)
- User roles & permissions
- Row-level security
- Organization switcher UI
