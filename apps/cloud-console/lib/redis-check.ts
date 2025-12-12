/**
 * Redis Connection Validator
 * Validates BullMQ and Guardian workers connectivity
 */

import Redis from '@/lib/redis-stub';

interface RedisCheckResult {
  status: 'healthy' | 'unhealthy';
  latency: number;
  error?: string;
  details: {
    connected: boolean;
    memoryUsage?: string;
    uptime?: number;
  };
}

export async function checkRedisHealth(): Promise<RedisCheckResult> {
  const redis = new Redis(process.env.REDIS_URL!, {
    enableOfflineQueue: false,
    maxRetriesPerRequest: 2,
    retryStrategy: (times: number) => (times > 2 ? null : Math.min(times * 100, 1000)),
  });

  const startTime = Date.now();

  try {
    await redis.ping();
    const latency = Date.now() - startTime;

    const info = await redis.info('memory');
    const memoryMatch = info.match(/used_memory_human:(.+)/);
    const memoryUsage = memoryMatch?.[1]?.trim();

    const uptimeInfo = await redis.info('server');
    const uptimeMatch = uptimeInfo.match(/uptime_in_seconds:(\d+)/);
    const uptime = uptimeMatch ? parseInt(uptimeMatch[1], 10) : undefined;

    await redis.quit();

    return {
      status: 'healthy',
      latency,
      details: {
        connected: true,
        memoryUsage,
        uptime,
      },
    };
  } catch (error) {
    await redis.quit();
    return {
      status: 'unhealthy',
      latency: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: { connected: false },
    };
  }
}
