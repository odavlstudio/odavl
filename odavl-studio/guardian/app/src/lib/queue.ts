import Queue from 'bull';
import Redis from 'ioredis';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

// Create Redis connection
const redis = new Redis(REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false
});

// Test Queue - handles test execution jobs
export const testQueue = new Queue('test-execution', REDIS_URL, {
    defaultJobOptions: {
        removeOnComplete: 100, // Keep last 100 completed jobs
        removeOnFail: 200,     // Keep last 200 failed jobs
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 2000
        }
    }
});

// Monitor Queue - handles health checks and uptime monitoring
export const monitorQueue = new Queue('monitoring', REDIS_URL, {
    defaultJobOptions: {
        removeOnComplete: 50,
        removeOnFail: 100,
        attempts: 2,
        backoff: {
            type: 'fixed',
            delay: 5000
        }
    }
});

// Alert Queue - handles alert notifications
export const alertQueue = new Queue('alerts', REDIS_URL, {
    defaultJobOptions: {
        removeOnComplete: 200,
        removeOnFail: 500,
        attempts: 5,
        backoff: {
            type: 'exponential',
            delay: 1000
        }
    }
});

// Queue event handlers
testQueue.on('completed', (job, result) => {
    console.log(`[Queue] Test job ${job.id} completed:`, result);
});

testQueue.on('failed', (job, err) => {
    console.error(`[Queue] Test job ${job?.id} failed:`, err.message);
});

monitorQueue.on('completed', (job, result) => {
    console.log(`[Queue] Monitor job ${job.id} completed:`, result);
});

monitorQueue.on('failed', (job, err) => {
    console.error(`[Queue] Monitor job ${job?.id} failed:`, err.message);
});

alertQueue.on('completed', (job, result) => {
    console.log(`[Queue] Alert job ${job.id} sent:`, result);
});

alertQueue.on('failed', (job, err) => {
    console.error(`[Queue] Alert job ${job?.id} failed:`, err.message);
});

// Helper to check Redis connection
export async function checkRedisConnection(): Promise<boolean> {
    try {
        await redis.ping();
        return true;
    } catch (error) {
        console.error('[Redis] Connection failed:', error);
        return false;
    }
}

// Graceful shutdown
export async function closeQueues(): Promise<void> {
    await Promise.all([
        testQueue.close(),
        monitorQueue.close(),
        alertQueue.close()
    ]);
    await redis.quit();
}
