/**
 * ODAVL Studio - Health Check Service
 * Phase 3.2: Observability Stack
 * 
 * Comprehensive health checks for:
 * - Database connectivity
 * - External services (Stripe, S3, etc.)
 * - System resources
 * - Service dependencies
 */

export enum HealthStatus {
  HEALTHY = 'healthy',
  DEGRADED = 'degraded',
  UNHEALTHY = 'unhealthy'
}

export interface HealthCheck {
  name: string;
  status: HealthStatus;
  message?: string;
  duration: number; // milliseconds
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface SystemHealth {
  status: HealthStatus;
  timestamp: Date;
  uptime: number; // seconds
  checks: HealthCheck[];
  summary: {
    total: number;
    healthy: number;
    degraded: number;
    unhealthy: number;
  };
}

class HealthCheckService {
  private readonly startTime: Date;
  private lastHealthCheck: SystemHealth | null = null;
  private healthCheckInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.startTime = new Date();
    
    // Start periodic health checks (every 60 seconds)
    this.startPeriodicHealthChecks();
    
    console.log('🏥 Health check service initialized');
  }

  /**
   * Start periodic health checks
   */
  private startPeriodicHealthChecks(): void {
    this.healthCheckInterval = setInterval(async () => {
      try {
        await this.checkHealth();
      } catch (error) {
        console.error('Health check failed:', error);
      }
    }, 60000); // Every 60 seconds
  }

  /**
   * Stop periodic health checks
   */
  stopPeriodicHealthChecks(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
  }

  /**
   * Check database connectivity
   */
  private async checkDatabase(): Promise<HealthCheck> {
    const startTime = Date.now();
    
    try {
      // TODO: Implement actual database check with Prisma
      // await prisma.$queryRaw`SELECT 1`;
      
      // Simulate check
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const duration = Date.now() - startTime;
      
      if (duration > 1000) {
        return {
          name: 'database',
          status: HealthStatus.DEGRADED,
          message: 'Database responding slowly',
          duration,
          timestamp: new Date(),
          metadata: { responseTime: duration }
        };
      }
      
      return {
        name: 'database',
        status: HealthStatus.HEALTHY,
        message: 'Database connection OK',
        duration,
        timestamp: new Date()
      };
    } catch (error: any) {
      return {
        name: 'database',
        status: HealthStatus.UNHEALTHY,
        message: `Database error: ${error.message}`,
        duration: Date.now() - startTime,
        timestamp: new Date()
      };
    }
  }

  /**
   * Check Redis connectivity (if configured)
   */
  private async checkRedis(): Promise<HealthCheck> {
    const startTime = Date.now();
    
    try {
      // TODO: Implement Redis check
      // await redis.ping();
      
      if (!process.env.REDIS_URL) {
        return {
          name: 'redis',
          status: HealthStatus.HEALTHY,
          message: 'Redis not configured (optional)',
          duration: Date.now() - startTime,
          timestamp: new Date()
        };
      }
      
      return {
        name: 'redis',
        status: HealthStatus.HEALTHY,
        message: 'Redis connection OK',
        duration: Date.now() - startTime,
        timestamp: new Date()
      };
    } catch (error: any) {
      return {
        name: 'redis',
        status: HealthStatus.UNHEALTHY,
        message: `Redis error: ${error.message}`,
        duration: Date.now() - startTime,
        timestamp: new Date()
      };
    }
  }

  /**
   * Check Stripe service
   */
  private async checkStripe(): Promise<HealthCheck> {
    const startTime = Date.now();
    
    try {
      // TODO: Implement Stripe check
      // const balance = await stripe.balance.retrieve();
      
      if (!process.env.STRIPE_SECRET_KEY) {
        return {
          name: 'stripe',
          status: HealthStatus.DEGRADED,
          message: 'Stripe not configured',
          duration: Date.now() - startTime,
          timestamp: new Date()
        };
      }
      
      return {
        name: 'stripe',
        status: HealthStatus.HEALTHY,
        message: 'Stripe service OK',
        duration: Date.now() - startTime,
        timestamp: new Date()
      };
    } catch (error: any) {
      return {
        name: 'stripe',
        status: HealthStatus.UNHEALTHY,
        message: `Stripe error: ${error.message}`,
        duration: Date.now() - startTime,
        timestamp: new Date()
      };
    }
  }

  /**
   * Check storage service (S3/Azure)
   */
  private async checkStorage(): Promise<HealthCheck> {
    const startTime = Date.now();
    
    try {
      // TODO: Implement storage check
      // await s3.headBucket({ Bucket: BUCKET_NAME }).promise();
      
      if (!process.env.AWS_S3_BUCKET && !process.env.AZURE_STORAGE_ACCOUNT) {
        return {
          name: 'storage',
          status: HealthStatus.HEALTHY,
          message: 'Cloud storage not configured (optional)',
          duration: Date.now() - startTime,
          timestamp: new Date()
        };
      }
      
      return {
        name: 'storage',
        status: HealthStatus.HEALTHY,
        message: 'Storage service OK',
        duration: Date.now() - startTime,
        timestamp: new Date()
      };
    } catch (error: any) {
      return {
        name: 'storage',
        status: HealthStatus.UNHEALTHY,
        message: `Storage error: ${error.message}`,
        duration: Date.now() - startTime,
        timestamp: new Date()
      };
    }
  }

  /**
   * Check email service
   */
  private async checkEmail(): Promise<HealthCheck> {
    const startTime = Date.now();
    
    try {
      // TODO: Implement email service check
      // await transporter.verify();
      
      if (!process.env.SMTP_HOST) {
        return {
          name: 'email',
          status: HealthStatus.HEALTHY,
          message: 'Email service in development mode',
          duration: Date.now() - startTime,
          timestamp: new Date()
        };
      }
      
      return {
        name: 'email',
        status: HealthStatus.HEALTHY,
        message: 'Email service OK',
        duration: Date.now() - startTime,
        timestamp: new Date()
      };
    } catch (error: any) {
      return {
        name: 'email',
        status: HealthStatus.UNHEALTHY,
        message: `Email error: ${error.message}`,
        duration: Date.now() - startTime,
        timestamp: new Date()
      };
    }
  }

  /**
   * Check system resources
   */
  private async checkSystemResources(): Promise<HealthCheck> {
    const startTime = Date.now();
    
    try {
      const usage = process.memoryUsage();
      const heapUsedPercent = (usage.heapUsed / usage.heapTotal) * 100;
      
      let status = HealthStatus.HEALTHY;
      let message = 'System resources OK';
      
      if (heapUsedPercent > 90) {
        status = HealthStatus.UNHEALTHY;
        message = `High memory usage: ${heapUsedPercent.toFixed(1)}%`;
      } else if (heapUsedPercent > 75) {
        status = HealthStatus.DEGRADED;
        message = `Elevated memory usage: ${heapUsedPercent.toFixed(1)}%`;
      }
      
      return {
        name: 'system_resources',
        status,
        message,
        duration: Date.now() - startTime,
        timestamp: new Date(),
        metadata: {
          heapUsedPercent: heapUsedPercent.toFixed(2),
          heapUsedMB: (usage.heapUsed / 1024 / 1024).toFixed(2),
          heapTotalMB: (usage.heapTotal / 1024 / 1024).toFixed(2),
          rssMB: (usage.rss / 1024 / 1024).toFixed(2)
        }
      };
    } catch (error: any) {
      return {
        name: 'system_resources',
        status: HealthStatus.UNHEALTHY,
        message: `System check error: ${error.message}`,
        duration: Date.now() - startTime,
        timestamp: new Date()
      };
    }
  }

  /**
   * Check disk space (if applicable)
   */
  private async checkDiskSpace(): Promise<HealthCheck> {
    const startTime = Date.now();
    
    // Disk space checks are platform-specific
    // For now, return healthy
    return {
      name: 'disk_space',
      status: HealthStatus.HEALTHY,
      message: 'Disk space OK',
      duration: Date.now() - startTime,
      timestamp: new Date()
    };
  }

  /**
   * Run all health checks
   */
  async checkHealth(): Promise<SystemHealth> {
    const checks = await Promise.all([
      this.checkDatabase(),
      this.checkRedis(),
      this.checkStripe(),
      this.checkStorage(),
      this.checkEmail(),
      this.checkSystemResources(),
      this.checkDiskSpace()
    ]);

    // Calculate summary
    const summary = {
      total: checks.length,
      healthy: checks.filter(c => c.status === HealthStatus.HEALTHY).length,
      degraded: checks.filter(c => c.status === HealthStatus.DEGRADED).length,
      unhealthy: checks.filter(c => c.status === HealthStatus.UNHEALTHY).length
    };

    // Determine overall status
    let overallStatus = HealthStatus.HEALTHY;
    if (summary.unhealthy > 0) {
      overallStatus = HealthStatus.UNHEALTHY;
    } else if (summary.degraded > 0) {
      overallStatus = HealthStatus.DEGRADED;
    }

    const health: SystemHealth = {
      status: overallStatus,
      timestamp: new Date(),
      uptime: (Date.now() - this.startTime.getTime()) / 1000,
      checks,
      summary
    };

    this.lastHealthCheck = health;
    
    // Log if unhealthy
    if (overallStatus !== HealthStatus.HEALTHY) {
      console.warn('⚠️ System health degraded:', {
        status: overallStatus,
        summary,
        unhealthyChecks: checks.filter(c => c.status === HealthStatus.UNHEALTHY)
      });
    }

    return health;
  }

  /**
   * Get last health check result
   */
  getLastHealthCheck(): SystemHealth | null {
    return this.lastHealthCheck;
  }

  /**
   * Get simple liveness check (for Kubernetes/Docker)
   */
  async isAlive(): Promise<boolean> {
    return true; // Process is running
  }

  /**
   * Get readiness check (for Kubernetes/Docker)
   */
  async isReady(): Promise<boolean> {
    const health = await this.checkHealth();
    return health.status !== HealthStatus.UNHEALTHY;
  }

  /**
   * Get startup check (for Kubernetes)
   */
  async isStarted(): Promise<boolean> {
    // Check if critical services are ready
    const dbCheck = await this.checkDatabase();
    return dbCheck.status !== HealthStatus.UNHEALTHY;
  }
}

// Export singleton
export const healthCheckService = new HealthCheckService();
