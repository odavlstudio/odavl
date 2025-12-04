/**
 * ODAVL Guardian - Redis Connection Manager
 * Manages Redis connection for BullMQ and caching
 */

import Redis from 'ioredis';

export class RedisConnection {
    private redis: Redis;
    private isConnected: boolean = false;

    constructor() {
        const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

        this.redis = new Redis(redisUrl, {
            maxRetriesPerRequest: null, // Required for BullMQ
            enableReadyCheck: false,
            retryStrategy: (times: number) => {
                const delay = Math.min(times * 50, 2000);
                return delay;
            },
        });

        this.redis.on('connect', () => {
            this.isConnected = true;
            console.log('✅ Redis connected');
        });

        this.redis.on('error', (error: Error) => {
            console.error('❌ Redis error:', error.message);
        });

        this.redis.on('close', () => {
            this.isConnected = false;
            console.log('⚠️  Redis connection closed');
        });
    }

    getConnection(): Redis {
        return this.redis;
    }

    async isReady(): Promise<boolean> {
        try {
            await this.redis.ping();
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Store result in Redis with expiration
     * @param key Redis key
     * @param value Data to store
     * @param ttlSeconds Time to live in seconds (default: 24 hours)
     */
    async storeResult(key: string, value: any, ttlSeconds: number = 86400): Promise<void> {
        await this.redis.setex(key, ttlSeconds, JSON.stringify(value));
    }

    /**
     * Retrieve result from Redis
     * @param key Redis key
     * @returns Parsed data or null if not found
     */
    async getResult<T>(key: string): Promise<T | null> {
        const data = await this.redis.get(key);
        return data ? JSON.parse(data) : null;
    }

    /**
     * Delete key from Redis
     * @param key Redis key
     */
    async deleteResult(key: string): Promise<void> {
        await this.redis.del(key);
    }

    /**
     * Get all keys matching pattern
     * @param pattern Redis key pattern (e.g., 'performance:*')
     */
    async getKeys(pattern: string): Promise<string[]> {
        return await this.redis.keys(pattern);
    }

    async disconnect(): Promise<void> {
        await this.redis.quit();
        this.isConnected = false;
    }
}
