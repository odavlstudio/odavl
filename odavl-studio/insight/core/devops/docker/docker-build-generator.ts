/**
 * @fileoverview Docker multi-stage build generator for ODAVL Insight
 * Generates optimized Dockerfiles for all supported languages
 */

export interface DockerBuildOptions {
  language: 'typescript' | 'python' | 'java' | 'go' | 'rust' | 'csharp' | 'php' | 'ruby' | 'swift' | 'kotlin';
  nodeVersion?: string;
  pythonVersion?: string;
  javaVersion?: string;
  goVersion?: string;
  rustVersion?: string;
  dotnetVersion?: string;
  phpVersion?: string;
  rubyVersion?: string;
  swiftVersion?: string;
  kotlinVersion?: string;
  enableCache?: boolean;
  targetArchitecture?: 'amd64' | 'arm64' | 'multi';
}

export interface DockerfileTemplate {
  language: string;
  baseImage: string;
  buildStages: string[];
  finalStage: string;
  healthCheck?: string;
  securityScanning?: boolean;
}

export class DockerBuildGenerator {
  /**
   * Generate Dockerfile for specified language
   */
  static generateDockerfile(options: DockerBuildOptions): string {
    const generator = this.getLanguageGenerator(options.language);
    return generator(options);
  }

  /**
   * Get language-specific Dockerfile generator
   */
  private static getLanguageGenerator(language: DockerBuildOptions['language']): (opts: DockerBuildOptions) => string {
    const generators: Record<DockerBuildOptions['language'], (opts: DockerBuildOptions) => string> = {
      typescript: this.generateTypeScriptDockerfile,
      python: this.generatePythonDockerfile,
      java: this.generateJavaDockerfile,
      go: this.generateGoDockerfile,
      rust: this.generateRustDockerfile,
      csharp: this.generateCSharpDockerfile,
      php: this.generatePhpDockerfile,
      ruby: this.generateRubyDockerfile,
      swift: this.generateSwiftDockerfile,
      kotlin: this.generateKotlinDockerfile,
    };

    return generators[language];
  }

  /**
   * Generate TypeScript/Node.js Dockerfile
   */
  private static generateTypeScriptDockerfile(options: DockerBuildOptions): string {
    const nodeVersion = options.nodeVersion || '20-alpine';

    return `# TypeScript/Node.js Multi-Stage Build
# Stage 1: Dependencies
FROM node:${nodeVersion} AS deps
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@9.12.2

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/*/package.json ./packages/
COPY odavl-studio/insight/core/package.json ./odavl-studio/insight/core/

# Install dependencies with frozen lockfile
RUN pnpm install --frozen-lockfile --prod=false

# Stage 2: Build
FROM node:${nodeVersion} AS builder
WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages ./packages

# Copy source code
COPY . .

# Build the application
RUN pnpm build

# Remove dev dependencies
RUN pnpm prune --prod

# Stage 3: Production
FROM node:${nodeVersion} AS runner
WORKDIR /app

# Create non-root user
RUN addgroup --system --gid 1001 odavl && \\
    adduser --system --uid 1001 odavl

# Copy built application
COPY --from=builder --chown=odavl:odavl /app/dist ./dist
COPY --from=builder --chown=odavl:odavl /app/node_modules ./node_modules
COPY --from=builder --chown=odavl:odavl /app/package.json ./

# Switch to non-root user
USER odavl

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \\
  CMD node -e "require('http').get('http://localhost:3001/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

# Start application
CMD ["node", "dist/index.js"]
`;
  }

  /**
   * Generate Python Dockerfile
   */
  private static generatePythonDockerfile(options: DockerBuildOptions): string {
    const pythonVersion = options.pythonVersion || '3.12-slim';

    return `# Python Multi-Stage Build
# Stage 1: Build
FROM python:${pythonVersion} AS builder
WORKDIR /app

# Install build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \\
    gcc \\
    && rm -rf /var/lib/apt/lists/*

# Create virtual environment
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Copy requirements
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Stage 2: Production
FROM python:${pythonVersion} AS runner
WORKDIR /app

# Create non-root user
RUN useradd -m -u 1001 odavl

# Copy virtual environment from builder
COPY --from=builder /opt/venv /opt/venv

# Copy application code
COPY --chown=odavl:odavl . .

# Set environment
ENV PATH="/opt/venv/bin:$PATH" \\
    PYTHONUNBUFFERED=1 \\
    PYTHONDONTWRITEBYTECODE=1

# Switch to non-root user
USER odavl

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \\
  CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')"

# Start application
CMD ["python", "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
`;
  }

  /**
   * Generate Java Dockerfile
   */
  private static generateJavaDockerfile(options: DockerBuildOptions): string {
    const javaVersion = options.javaVersion || '21-jdk-slim';

    return `# Java Multi-Stage Build
# Stage 1: Build
FROM eclipse-temurin:${javaVersion} AS builder
WORKDIR /app

# Copy Maven/Gradle files
COPY pom.xml mvnw ./
COPY .mvn .mvn
COPY src src

# Build application
RUN ./mvnw clean package -DskipTests

# Stage 2: Production
FROM eclipse-temurin:21-jre-alpine AS runner
WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 odavl && \\
    adduser -D -u 1001 -G odavl odavl

# Copy JAR from builder
COPY --from=builder --chown=odavl:odavl /app/target/*.jar app.jar

# Switch to non-root user
USER odavl

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \\
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/actuator/health || exit 1

# JVM options
ENV JAVA_OPTS="-Xms512m -Xmx2048m -XX:+UseG1GC"

# Start application
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
`;
  }

  /**
   * Generate Go Dockerfile
   */
  private static generateGoDockerfile(options: DockerBuildOptions): string {
    const goVersion = options.goVersion || '1.22-alpine';

    return `# Go Multi-Stage Build
# Stage 1: Build
FROM golang:${goVersion} AS builder
WORKDIR /app

# Copy go mod files
COPY go.mod go.sum ./

# Download dependencies
RUN go mod download

# Copy source code
COPY . .

# Build binary with optimizations
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build \\
    -ldflags="-w -s" \\
    -o /app/odavl-insight \\
    ./cmd/main.go

# Stage 2: Production
FROM alpine:3.19 AS runner
WORKDIR /app

# Install CA certificates
RUN apk --no-cache add ca-certificates

# Create non-root user
RUN addgroup -g 1001 odavl && \\
    adduser -D -u 1001 -G odavl odavl

# Copy binary from builder
COPY --from=builder --chown=odavl:odavl /app/odavl-insight .

# Switch to non-root user
USER odavl

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \\
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/health || exit 1

# Start application
CMD ["./odavl-insight"]
`;
  }

  /**
   * Generate Rust Dockerfile
   */
  private static generateRustDockerfile(options: DockerBuildOptions): string {
    const rustVersion = options.rustVersion || '1.75-alpine';

    return `# Rust Multi-Stage Build
# Stage 1: Build
FROM rust:${rustVersion} AS builder
WORKDIR /app

# Install musl-tools for static linking
RUN apk add --no-cache musl-dev

# Copy Cargo files
COPY Cargo.toml Cargo.lock ./

# Create dummy main to cache dependencies
RUN mkdir src && echo "fn main() {}" > src/main.rs
RUN cargo build --release
RUN rm -rf src

# Copy actual source code
COPY src src

# Build application
RUN cargo build --release

# Stage 2: Production
FROM alpine:3.19 AS runner
WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 odavl && \\
    adduser -D -u 1001 -G odavl odavl

# Copy binary from builder
COPY --from=builder --chown=odavl:odavl /app/target/release/odavl-insight .

# Switch to non-root user
USER odavl

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \\
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/health || exit 1

# Start application
CMD ["./odavl-insight"]
`;
  }

  /**
   * Generate C# Dockerfile
   */
  private static generateCSharpDockerfile(options: DockerBuildOptions): string {
    const dotnetVersion = options.dotnetVersion || '9.0';

    return `# C#/.NET Multi-Stage Build
# Stage 1: Build
FROM mcr.microsoft.com/dotnet/sdk:${dotnetVersion} AS builder
WORKDIR /app

# Copy csproj and restore dependencies
COPY *.csproj ./
RUN dotnet restore

# Copy source code
COPY . .

# Build and publish
RUN dotnet publish -c Release -o out

# Stage 2: Production
FROM mcr.microsoft.com/dotnet/aspnet:${dotnetVersion} AS runner
WORKDIR /app

# Create non-root user
RUN useradd -m -u 1001 odavl

# Copy published app
COPY --from=builder --chown=odavl:odavl /app/out .

# Switch to non-root user
USER odavl

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \\
  CMD curl --fail http://localhost:8080/health || exit 1

# Start application
ENTRYPOINT ["dotnet", "ODAVLInsight.dll"]
`;
  }

  /**
   * Generate PHP Dockerfile
   */
  private static generatePhpDockerfile(options: DockerBuildOptions): string {
    const phpVersion = options.phpVersion || '8.3-fpm-alpine';

    return `# PHP Multi-Stage Build
# Stage 1: Build
FROM php:${phpVersion} AS builder
WORKDIR /app

# Install PHP extensions
RUN docker-php-ext-install pdo pdo_mysql opcache

# Install Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# Copy composer files
COPY composer.json composer.lock ./

# Install dependencies
RUN composer install --no-dev --optimize-autoloader --no-interaction

# Copy application code
COPY . .

# Stage 2: Production
FROM php:${phpVersion} AS runner
WORKDIR /app

# Install production extensions
RUN docker-php-ext-install pdo pdo_mysql opcache

# Create non-root user
RUN addgroup -g 1001 odavl && \\
    adduser -D -u 1001 -G odavl odavl

# Copy application from builder
COPY --from=builder --chown=odavl:odavl /app .

# Configure PHP
COPY php.ini /usr/local/etc/php/conf.d/custom.ini

# Switch to non-root user
USER odavl

# Expose port
EXPOSE 9000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \\
  CMD php-fpm-healthcheck || exit 1

# Start PHP-FPM
CMD ["php-fpm"]
`;
  }

  /**
   * Generate Ruby Dockerfile
   */
  private static generateRubyDockerfile(options: DockerBuildOptions): string {
    const rubyVersion = options.rubyVersion || '3.3-alpine';

    return `# Ruby Multi-Stage Build
# Stage 1: Build
FROM ruby:${rubyVersion} AS builder
WORKDIR /app

# Install build dependencies
RUN apk add --no-cache build-base postgresql-dev

# Copy Gemfile
COPY Gemfile Gemfile.lock ./

# Install gems
RUN bundle config set --local deployment 'true' && \\
    bundle config set --local without 'development test' && \\
    bundle install

# Copy application code
COPY . .

# Stage 2: Production
FROM ruby:${rubyVersion} AS runner
WORKDIR /app

# Install runtime dependencies
RUN apk add --no-cache postgresql-client tzdata

# Create non-root user
RUN addgroup -g 1001 odavl && \\
    adduser -D -u 1001 -G odavl odavl

# Copy application from builder
COPY --from=builder --chown=odavl:odavl /app .

# Switch to non-root user
USER odavl

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \\
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Start Rails server
CMD ["bundle", "exec", "rails", "server", "-b", "0.0.0.0"]
`;
  }

  /**
   * Generate Swift Dockerfile
   */
  private static generateSwiftDockerfile(options: DockerBuildOptions): string {
    const swiftVersion = options.swiftVersion || '5.10-jammy';

    return `# Swift Multi-Stage Build
# Stage 1: Build
FROM swift:${swiftVersion} AS builder
WORKDIR /app

# Copy Package files
COPY Package.swift Package.resolved ./

# Resolve dependencies
RUN swift package resolve

# Copy source code
COPY Sources Sources

# Build application
RUN swift build -c release

# Stage 2: Production
FROM ubuntu:22.04 AS runner
WORKDIR /app

# Install runtime dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \\
    libssl3 \\
    && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN useradd -m -u 1001 odavl

# Copy binary from builder
COPY --from=builder --chown=odavl:odavl /app/.build/release/ODAVLInsight .

# Switch to non-root user
USER odavl

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \\
  CMD curl --fail http://localhost:8080/health || exit 1

# Start application
CMD ["./ODAVLInsight"]
`;
  }

  /**
   * Generate Kotlin Dockerfile
   */
  private static generateKotlinDockerfile(options: DockerBuildOptions): string {
    const kotlinVersion = options.kotlinVersion || '1.9.22';

    return `# Kotlin Multi-Stage Build
# Stage 1: Build
FROM gradle:8.5-jdk21 AS builder
WORKDIR /app

# Copy Gradle files
COPY build.gradle.kts settings.gradle.kts gradle.properties ./

# Download dependencies
RUN gradle dependencies --no-daemon

# Copy source code
COPY src src

# Build application
RUN gradle bootJar --no-daemon

# Stage 2: Production
FROM eclipse-temurin:21-jre-alpine AS runner
WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 odavl && \\
    adduser -D -u 1001 -G odavl odavl

# Copy JAR from builder
COPY --from=builder --chown=odavl:odavl /app/build/libs/*.jar app.jar

# Switch to non-root user
USER odavl

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \\
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/actuator/health || exit 1

# JVM options
ENV JAVA_OPTS="-Xms512m -Xmx2048m -XX:+UseG1GC"

# Start application
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
`;
  }

  /**
   * Generate .dockerignore file
   */
  static generateDockerignore(): string {
    return `# Node.js
node_modules/
npm-debug.log
.pnpm-store/

# Build outputs
dist/
build/
out/
target/
.next/
*.jar
*.war

# Environment files
.env
.env.local
.env.*.local

# IDE
.vscode/
.idea/
*.swp
*.swo

# Git
.git/
.gitignore

# OS
.DS_Store
Thumbs.db

# Logs
logs/
*.log

# Test
coverage/
.nyc_output/
reports/

# Misc
.odavl/
*.md
LICENSE
`;
  }
}
