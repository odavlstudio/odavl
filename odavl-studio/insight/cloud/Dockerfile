# Multi-stage build for ODAVL Insight Cloud
# Stage 1: Dependencies
FROM node:20-alpine AS deps
LABEL maintainer="ODAVL Team <support@odavl.com>"
LABEL description="ODAVL Insight Cloud - Global Intelligence Dashboard"

# Install pnpm
RUN npm install -g pnpm@9

# Install system dependencies
RUN apk add --no-cache libc6-compat openssl

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/insight-cloud/package.json ./apps/insight-cloud/
COPY packages/types/package.json ./packages/types/
COPY packages/insight-core/package.json ./packages/insight-core/

# Install dependencies
RUN pnpm install --frozen-lockfile --prod

# Stage 2: Builder
FROM node:20-alpine AS builder

# Install pnpm
RUN npm install -g pnpm@9

# Install system dependencies
RUN apk add --no-cache libc6-compat openssl

WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/insight-cloud/node_modules ./apps/insight-cloud/node_modules
COPY --from=deps /app/packages/types/node_modules ./packages/types/node_modules
COPY --from=deps /app/packages/insight-core/node_modules ./packages/insight-core/node_modules

# Copy source code
COPY . .

# Build packages
WORKDIR /app/packages/types
RUN pnpm build

WORKDIR /app/packages/insight-core
RUN pnpm build

# Build Insight Cloud application
WORKDIR /app/apps/insight-cloud
RUN pnpm build

# Generate Prisma client
RUN pnpm prisma generate

# Stage 3: Runner
FROM node:20-alpine AS runner

# Install system dependencies
RUN apk add --no-cache \
    libc6-compat \
    openssl \
    dumb-init

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 odavl

# Set environment variables
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3001 \
    HOSTNAME="0.0.0.0"

WORKDIR /app

# Copy built application from builder
COPY --from=builder --chown=odavl:nodejs /app/apps/insight-cloud/.next ./apps/insight-cloud/.next
COPY --from=builder --chown=odavl:nodejs /app/apps/insight-cloud/public ./apps/insight-cloud/public
COPY --from=builder --chown=odavl:nodejs /app/apps/insight-cloud/package.json ./apps/insight-cloud/
COPY --from=builder --chown=odavl:nodejs /app/apps/insight-cloud/prisma ./apps/insight-cloud/prisma
COPY --from=builder --chown=odavl:nodejs /app/apps/insight-cloud/node_modules ./apps/insight-cloud/node_modules
COPY --from=builder --chown=odavl:nodejs /app/packages ./packages
COPY --from=builder --chown=odavl:nodejs /app/node_modules ./node_modules

# Switch to non-root user
USER odavl

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3001/api/health', (r) => { process.exit(r.statusCode === 200 ? 0 : 1); });"

# Set working directory to Insight Cloud app
WORKDIR /app/apps/insight-cloud

# Use dumb-init to handle signals properly
ENTRYPOINT ["/usr/bin/dumb-init", "--"]

# Start Next.js server
CMD ["node_modules/.bin/next", "start", "-p", "3001"]
