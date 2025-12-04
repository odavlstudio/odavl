# Multi-stage build for ODAVL CLI
FROM node:20-alpine AS deps
LABEL maintainer="ODAVL Team <support@odavl.com>"
LABEL description="ODAVL CLI - Autonomous Code Quality & Governance Platform"

# Install pnpm
RUN npm install -g pnpm@9

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/cli/package.json ./apps/cli/
COPY packages/insight-core/package.json ./packages/insight-core/
COPY packages/types/package.json ./packages/types/
COPY packages/sdk/package.json ./packages/sdk/

# Install dependencies
RUN pnpm install --frozen-lockfile --prod

# Stage 2: Builder
FROM node:20-alpine AS builder

RUN npm install -g pnpm@9

WORKDIR /app

# Copy dependencies
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/cli/node_modules ./apps/cli/node_modules
COPY --from=deps /app/packages/insight-core/node_modules ./packages/insight-core/node_modules
COPY --from=deps /app/packages/types/node_modules ./packages/types/node_modules
COPY --from=deps /app/packages/sdk/node_modules ./packages/sdk/node_modules

# Copy source code
COPY . .

# Build packages
WORKDIR /app/packages/types
RUN pnpm build

WORKDIR /app/packages/insight-core
RUN pnpm build

WORKDIR /app/packages/sdk
RUN pnpm build

# Build CLI
WORKDIR /app/apps/cli
RUN pnpm build

# Stage 3: Runner
FROM node:20-alpine AS runner

# Install git (needed for ODAVL operations)
RUN apk add --no-cache git

# Create non-root user
RUN addgroup --system --gid 1001 odavl && \
    adduser --system --uid 1001 odavl

ENV NODE_ENV=production

WORKDIR /app

# Copy built CLI from builder
COPY --from=builder --chown=odavl:odavl /app/apps/cli/dist ./apps/cli/dist
COPY --from=builder --chown=odavl:odavl /app/apps/cli/package.json ./apps/cli/
COPY --from=builder --chown=odavl:odavl /app/apps/cli/node_modules ./apps/cli/node_modules
COPY --from=builder --chown=odavl:odavl /app/packages ./packages
COPY --from=builder --chown=odavl:odavl /app/node_modules ./node_modules

# Create .odavl directory structure
RUN mkdir -p /app/.odavl/{recipes,logs,undo,ledger,attestation} && \
    chown -R odavl:odavl /app/.odavl

USER odavl

WORKDIR /app/apps/cli

# Make CLI executable globally
ENV PATH="/app/apps/cli/dist:${PATH}"

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node -e "process.exit(0);"

# Default command: show help
CMD ["node", "dist/index.js", "--help"]
