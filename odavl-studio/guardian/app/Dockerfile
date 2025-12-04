# Multi-stage build for ODAVL Guardian
# Stage 1: Dependencies
FROM node:20-alpine AS deps
LABEL maintainer="ODAVL Team <support@odavl.com>"
LABEL description="ODAVL Guardian - Automated Testing & Monitoring"

# Install pnpm
RUN npm install -g pnpm@9

# Install system dependencies for Playwright
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/guardian/package.json ./apps/guardian/
COPY packages/types/package.json ./packages/types/
COPY packages/sdk/package.json ./packages/sdk/

# Install dependencies
RUN pnpm install --frozen-lockfile --prod

# Install Playwright browsers
RUN pnpm dlx playwright install chromium

# Stage 2: Builder
FROM node:20-alpine AS builder

# Install pnpm
RUN npm install -g pnpm@9

WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/guardian/node_modules ./apps/guardian/node_modules
COPY --from=deps /app/packages/types/node_modules ./packages/types/node_modules
COPY --from=deps /app/packages/sdk/node_modules ./packages/sdk/node_modules

# Copy source code
COPY . .

# Build packages
WORKDIR /app/packages/types
RUN pnpm build

WORKDIR /app/packages/sdk
RUN pnpm build

# Build Guardian application
WORKDIR /app/apps/guardian
RUN pnpm build

# Generate Prisma client
RUN pnpm prisma generate

# Stage 3: Runner
FROM node:20-alpine AS runner

# Install system dependencies
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    dumb-init

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 odavl

# Set environment variables
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME="0.0.0.0" \
    PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 \
    PLAYWRIGHT_BROWSERS_PATH=/usr/bin

WORKDIR /app

# Copy built application from builder
COPY --from=builder --chown=odavl:nodejs /app/apps/guardian/.next ./apps/guardian/.next
COPY --from=builder --chown=odavl:nodejs /app/apps/guardian/public ./apps/guardian/public
COPY --from=builder --chown=odavl:nodejs /app/apps/guardian/package.json ./apps/guardian/
COPY --from=builder --chown=odavl:nodejs /app/apps/guardian/prisma ./apps/guardian/prisma
COPY --from=builder --chown=odavl:nodejs /app/apps/guardian/node_modules ./apps/guardian/node_modules
COPY --from=builder --chown=odavl:nodejs /app/packages ./packages
COPY --from=builder --chown=odavl:nodejs /app/node_modules ./node_modules

# Copy Playwright browsers
COPY --from=deps /usr/bin/chromium /usr/bin/chromium

# Switch to non-root user
USER odavl

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => { process.exit(r.statusCode === 200 ? 0 : 1); });"

# Set working directory to Guardian app
WORKDIR /app/apps/guardian

# Run database migrations on startup (production should use init container)
# CMD ["sh", "-c", "pnpm prisma migrate deploy && dumb-init node_modules/.bin/next start"]

# Use dumb-init to handle signals properly
ENTRYPOINT ["/usr/bin/dumb-init", "--"]

# Start Next.js server
CMD ["node_modules/.bin/next", "start"]
