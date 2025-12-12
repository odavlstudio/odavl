/**
 * @fileoverview Docker Compose generator for ODAVL Insight stack
 * Generates docker-compose.yml with all services (app, database, redis, etc.)
 */

export interface DockerComposeOptions {
  includeDatabase?: boolean;
  includeRedis?: boolean;
  includePrometheus?: boolean;
  includeGrafana?: boolean;
  includeJaeger?: boolean;
  enableHealthChecks?: boolean;
  environment?: 'development' | 'staging' | 'production';
}

export class DockerComposeGenerator {
  /**
   * Generate docker-compose.yml
   */
  static generate(options: DockerComposeOptions = {}): string {
    const {
      includeDatabase = true,
      includeRedis = true,
      includePrometheus = false,
      includeGrafana = false,
      includeJaeger = false,
      enableHealthChecks = true,
      environment = 'development',
    } = options;

    const services: string[] = [];

    // Main application service
    services.push(this.generateAppService(environment, enableHealthChecks));

    // Database service (PostgreSQL)
    if (includeDatabase) {
      services.push(this.generateDatabaseService(environment));
    }

    // Redis cache
    if (includeRedis) {
      services.push(this.generateRedisService());
    }

    // Prometheus monitoring
    if (includePrometheus) {
      services.push(this.generatePrometheusService());
    }

    // Grafana dashboards
    if (includeGrafana) {
      services.push(this.generateGrafanaService());
    }

    // Jaeger tracing
    if (includeJaeger) {
      services.push(this.generateJaegerService());
    }

    return `version: '3.8'

services:
${services.join('\n\n')}

volumes:
  postgres_data:
  redis_data:
  prometheus_data:
  grafana_data:

networks:
  odavl_network:
    driver: bridge
`;
  }

  /**
   * Generate app service configuration
   */
  private static generateAppService(environment: string, enableHealthChecks: boolean): string {
    const healthCheck = enableHealthChecks
      ? `    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3001/health"]
      interval: 30s
      timeout: 3s
      retries: 3
      start_period: 5s`
      : '';

    return `  odavl-insight:
    build:
      context: .
      dockerfile: Dockerfile
      target: runner
    container_name: odavl-insight
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=${environment}
      - DATABASE_URL=postgresql://postgres:postgres@postgres:5432/odavl_insight
      - REDIS_URL=redis://redis:6379
      - PROMETHEUS_PORT=9090
      - LOG_LEVEL=info
    depends_on:
      - postgres
      - redis
    networks:
      - odavl_network
    restart: unless-stopped
${healthCheck}`;
  }

  /**
   * Generate PostgreSQL service
   */
  private static generateDatabaseService(environment: string): string {
    return `  postgres:
    image: postgres:16-alpine
    container_name: odavl-postgres
    ports:
      - "5432:5432"
    environment:
      - POSTGRES_DB=odavl_insight
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=postgres
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - odavl_network
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5`;
  }

  /**
   * Generate Redis service
   */
  private static generateRedisService(): string {
    return `  redis:
    image: redis:7-alpine
    container_name: odavl-redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    networks:
      - odavl_network
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 3s
      retries: 5
    command: redis-server --appendonly yes`;
  }

  /**
   * Generate Prometheus service
   */
  private static generatePrometheusService(): string {
    return `  prometheus:
    image: prom/prometheus:latest
    container_name: odavl-prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    networks:
      - odavl_network
    restart: unless-stopped
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'`;
  }

  /**
   * Generate Grafana service
   */
  private static generateGrafanaService(): string {
    return `  grafana:
    image: grafana/grafana:latest
    container_name: odavl-grafana
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
      - GF_SERVER_ROOT_URL=http://localhost:3000
    volumes:
      - grafana_data:/var/lib/grafana
    networks:
      - odavl_network
    restart: unless-stopped
    depends_on:
      - prometheus`;
  }

  /**
   * Generate Jaeger service
   */
  private static generateJaegerService(): string {
    return `  jaeger:
    image: jaegertracing/all-in-one:latest
    container_name: odavl-jaeger
    ports:
      - "5775:5775/udp"
      - "6831:6831/udp"
      - "6832:6832/udp"
      - "5778:5778"
      - "16686:16686"
      - "14268:14268"
      - "14250:14250"
      - "9411:9411"
    environment:
      - COLLECTOR_ZIPKIN_HOST_PORT=:9411
    networks:
      - odavl_network
    restart: unless-stopped`;
  }

  /**
   * Generate prometheus.yml configuration
   */
  static generatePrometheusConfig(): string {
    return `global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'odavl-insight'
    static_configs:
      - targets: ['odavl-insight:9090']
    metrics_path: '/metrics'

  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  - job_name: 'node-exporter'
    static_configs:
      - targets: ['node-exporter:9100']
`;
  }
}
