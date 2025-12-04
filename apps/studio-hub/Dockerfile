# Multi-stage build for ODAVL Studio Hub
# Based on Next.js 15 best practices

# ==========================================
# Stage 1: Dependencies
# ==========================================
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat

# Install pnpm
RUN corepack enable && corepack prepare pnpm@9.12.2 --activate

WORKDIR /app

# Copy monorepo workspace files
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY apps/studio-hub/package.json ./apps/studio-hub/

# Install dependencies with frozen lockfile (pnpm will handle workspace dependencies)
RUN pnpm install --frozen-lockfile --filter studio-hub...

# ==========================================
# Stage 2: Builder
# ==========================================
FROM node:20-alpine AS builder
RUN corepack enable && corepack prepare pnpm@9.12.2 --activate

WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/studio-hub/node_modules ./apps/studio-hub/node_modules

# Copy all necessary files
COPY . .

# Set working directory to studio-hub
WORKDIR /app/apps/studio-hub

# Build args for environment variables (Next.js public vars must be available at build time)
ARG NEXT_PUBLIC_APP_URL
ARG DATABASE_URL
ARG NEXTAUTH_URL
ARG NEXTAUTH_SECRET

ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ENV DATABASE_URL=$DATABASE_URL
ENV NEXTAUTH_URL=$NEXTAUTH_URL
ENV NEXTAUTH_SECRET=$NEXTAUTH_SECRET
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Generate Prisma client
RUN pnpm prisma generate

# Build Next.js application
RUN pnpm build

# ==========================================
# Stage 3: Runner (Production)
# ==========================================
FROM node:20-alpine AS runner

WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Set production environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Copy built application
COPY --from=builder --chown=nextjs:nodejs /app/apps/studio-hub/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/studio-hub/.next/static ./apps/studio-hub/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/studio-hub/public ./apps/studio-hub/public

# Copy Prisma schema and client (needed for migrations)
COPY --from=builder --chown=nextjs:nodejs /app/apps/studio-hub/prisma ./apps/studio-hub/prisma
COPY --from=builder --chown=nextjs:nodejs /app/apps/studio-hub/node_modules/.prisma ./apps/studio-hub/node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/apps/studio-hub/node_modules/@prisma ./apps/studio-hub/node_modules/@prisma

# Create directories for runtime data
RUN mkdir -p /app/data && chown nextjs:nodejs /app/data

USER nextjs

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start Next.js server
CMD ["node", "apps/studio-hub/server.js"]

# ==========================================
# Stage 4: Development (Optional)
# ==========================================
FROM node:20-alpine AS development

RUN apk add --no-cache libc6-compat git
RUN corepack enable && corepack prepare pnpm@9.12.2 --activate

WORKDIR /app

# Copy package files
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY apps/studio-hub/package.json ./apps/studio-hub/
COPY packages/*/package.json ./packages/*/

# Install all dependencies (including dev dependencies)
RUN pnpm install --frozen-lockfile

# Copy all source files
COPY . .

WORKDIR /app/apps/studio-hub

# Generate Prisma client
RUN pnpm prisma generate

ENV NODE_ENV=development
ENV PORT=3001

EXPOSE 3001

# Start dev server with hot reload
CMD ["pnpm", "dev"]
