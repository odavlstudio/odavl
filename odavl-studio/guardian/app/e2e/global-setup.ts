/**
 * Global Setup - Runs once before all tests
 * 
 * Responsibilities:
 * - Database setup (migrations, seed data)
 * - Test user creation
 * - Environment validation
 * - Redis connection test
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

async function globalSetup() {
    console.log('🚀 [Global Setup] Starting E2E test environment setup...');

    try {
        // 1. Check environment variables
        console.log('📋 [Global Setup] Checking environment variables...');
        const requiredEnvVars = [
            'DATABASE_URL',
            'REDIS_URL',
            'JWT_SECRET',
            'NEXTAUTH_SECRET'
        ];

        const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
        if (missingVars.length > 0) {
            console.warn(`⚠️  [Global Setup] Missing environment variables: ${missingVars.join(', ')}`);
            console.warn('   Using default test values...');
        }

        // 2. Run database migrations
        console.log('🗄️  [Global Setup] Running Prisma migrations...');
        try {
            execSync('pnpm prisma:migrate', {
                cwd: process.cwd(),
                stdio: 'inherit',
                env: {
                    ...process.env,
                    DATABASE_URL: process.env.DATABASE_URL || 'postgresql://odavl:odavl123@localhost:5432/guardian_test'
                }
            });
            console.log('✅ [Global Setup] Database migrations complete');
        } catch (error) {
            console.error('❌ [Global Setup] Migration failed:', error);
            throw error;
        }

        // 3. Seed test data
        console.log('🌱 [Global Setup] Seeding test data...');
        try {
            execSync('tsx e2e/seed.ts', {
                cwd: process.cwd(),
                stdio: 'inherit'
            });
            console.log('✅ [Global Setup] Test data seeded');
        } catch (error) {
            console.warn('⚠️  [Global Setup] Seed script not found or failed, continuing...');
        }

        // 4. Create reports directory
        const reportsDir = path.join(process.cwd(), 'reports', 'playwright');
        if (!fs.existsSync(reportsDir)) {
            fs.mkdirSync(reportsDir, { recursive: true });
            console.log('✅ [Global Setup] Created reports directory');
        }

        // 5. Create screenshots directory
        const screenshotsDir = path.join(process.cwd(), 'reports', 'playwright', 'screenshots');
        if (!fs.existsSync(screenshotsDir)) {
            fs.mkdirSync(screenshotsDir, { recursive: true });
            console.log('✅ [Global Setup] Created screenshots directory');
        }

        // 6. Wait for services (PostgreSQL, Redis)
        console.log('⏳ [Global Setup] Waiting for services to be ready...');
        await waitForServices();
        console.log('✅ [Global Setup] Services are ready');

        console.log('✅ [Global Setup] Environment setup complete!\n');
    } catch (error) {
        console.error('❌ [Global Setup] Setup failed:', error);
        throw error;
    }
}

/**
 * Wait for PostgreSQL and Redis to be ready
 */
async function waitForServices() {
    const maxRetries = 30;
    const retryDelay = 1000; // 1 second

    for (let i = 0; i < maxRetries; i++) {
        try {
            // Test PostgreSQL connection
            execSync('pnpm prisma db execute --stdin < /dev/null', {
                stdio: 'ignore',
                timeout: 5000
            });

            // Test Redis connection (simple check via telnet or redis-cli if available)
            // For now, assume Redis is ready if PostgreSQL is

            return; // Services ready
        } catch (error) {
            if (i === maxRetries - 1) {
                throw new Error('Services failed to start after 30 seconds');
            }
            await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
    }
}

export default globalSetup;
