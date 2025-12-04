/**
 * Sample Data Generator
 * 
 * Week 12: Beta Launch - Sample Test Data
 * 
 * Generates realistic sample data for onboarding and demo purposes:
 * - Sample test runs with realistic metrics
 * - Demo monitoring data with uptime/downtime
 * - Example API keys and webhooks
 * - Tutorial project templates
 */

import { faker } from '@faker-js/faker';
import { prisma } from './prisma';

interface SampleDataOptions {
    organizationId: string;
    includeTestRuns?: boolean;
    includeMonitors?: boolean;
    includeApiKeys?: boolean;
    testRunCount?: number;
    monitorCount?: number;
}

/**
 * Generate complete sample dataset for an organization
 */
export async function generateSampleData(options: SampleDataOptions) {
    const {
        organizationId,
        includeTestRuns = true,
        includeMonitors = true,
        includeApiKeys = true,
        testRunCount = 10,
        monitorCount = 5,
    } = options;

    const results = {
        testRuns: [] as any[],
        monitors: [] as any[],
        apiKeys: [] as any[],
    };

    try {
        // Generate sample test runs
        if (includeTestRuns) {
            console.log(`Generating ${testRunCount} sample test runs...`);
            results.testRuns = await generateSampleTestRuns(organizationId, testRunCount);
        }

        // Generate sample monitors
        if (includeMonitors) {
            console.log(`Generating ${monitorCount} sample monitors...`);
            results.monitors = await generateSampleMonitors(organizationId, monitorCount);
        }

        // Generate sample API keys
        if (includeApiKeys) {
            console.log('Generating sample API keys...');
            results.apiKeys = await generateSampleApiKeys(organizationId);
        }

        return results;
    } catch (error) {
        console.error('Error generating sample data:', error);
        throw error;
    }
}

/**
 * Generate sample test runs with realistic metrics
 */
async function generateSampleTestRuns(organizationId: string, count: number) {
    const testRuns = [];
    const frameworks = ['playwright', 'cypress', 'jest', 'vitest', 'selenium'];
    const browsers = ['chromium', 'firefox', 'webkit', 'chrome', 'edge'];
    const statuses = ['passed', 'failed', 'skipped', 'running'];

    for (let i = 0; i < count; i++) {
        const framework = faker.helpers.arrayElement(frameworks);
        const browser = faker.helpers.arrayElement(browsers);
        const status = faker.helpers.arrayElement(statuses);
        const totalTests = faker.number.int({ min: 10, max: 100 });
        const passedTests = status === 'passed' ? totalTests : faker.number.int({ min: 0, max: totalTests });
        const failedTests = totalTests - passedTests;
        const duration = faker.number.int({ min: 5000, max: 300000 }); // 5s to 5min

        const testRun = {
            organizationId,
            name: `${framework}-${browser}-${faker.word.adjective()}-tests`,
            framework,
            browser,
            status,
            totalTests,
            passedTests,
            failedTests,
            skippedTests: 0,
            duration,
            startedAt: faker.date.recent({ days: 30 }),
            completedAt: faker.date.recent({ days: 30 }),
            triggeredBy: faker.helpers.arrayElement(['manual', 'ci', 'scheduled', 'webhook']),
            branch: faker.helpers.arrayElement(['main', 'develop', 'feature/new-ui', 'bugfix/login']),
            commit: faker.git.commitSha(),
            metadata: {
                environment: faker.helpers.arrayElement(['production', 'staging', 'development']),
                parallel: faker.datatype.boolean(),
                retries: faker.number.int({ min: 0, max: 3 }),
                workers: faker.number.int({ min: 1, max: 8 }),
            },
        };

        testRuns.push(testRun);
    }

    return testRuns;
}

/**
 * Generate sample monitors with uptime/downtime data
 */
async function generateSampleMonitors(organizationId: string, count: number) {
    const monitors = [];
    const types = ['http', 'api', 'browser', 'ping'];
    const intervals = [60, 300, 600, 1800, 3600]; // 1min to 1hour in seconds

    for (let i = 0; i < count; i++) {
        const type = faker.helpers.arrayElement(types);
        const interval = faker.helpers.arrayElement(intervals);
        const isHealthy = faker.datatype.boolean({ probability: 0.85 }); // 85% healthy

        const monitor = {
            organizationId,
            name: `${type}-monitor-${faker.word.noun()}`,
            type,
            url: type === 'http' || type === 'api' ? faker.internet.url() : undefined,
            interval,
            timeout: faker.number.int({ min: 5000, max: 30000 }),
            retries: faker.number.int({ min: 1, max: 3 }),
            enabled: true,
            status: isHealthy ? 'up' : 'down',
            lastCheckedAt: faker.date.recent({ days: 1 }),
            uptime: faker.number.float({ min: 95, max: 99.99, fractionDigits: 2 }),
            responseTime: faker.number.int({ min: 50, max: 2000 }),
            metadata: {
                method: type === 'api' ? faker.helpers.arrayElement(['GET', 'POST', 'PUT']) : undefined,
                expectedStatus: type === 'http' || type === 'api' ? 200 : undefined,
                headers: type === 'api' ? { 'Content-Type': 'application/json' } : undefined,
                alertOnFailure: true,
                notificationChannels: ['email', 'slack'],
            },
        };

        monitors.push(monitor);
    }

    return monitors;
}

/**
 * Generate sample API keys for testing
 */
async function generateSampleApiKeys(organizationId: string) {
    const apiKeys = [];
    const scopes = [
        ['read:tests', 'write:tests'],
        ['read:monitors', 'write:monitors'],
        ['read:*', 'write:*'], // Admin key
    ];

    for (let i = 0; i < 3; i++) {
        const scope = scopes[i];
        const keyPrefix = 'gsk_sample_';
        const keyValue = keyPrefix + faker.string.alphanumeric(32);

        const apiKey = {
            organizationId,
            name: i === 0 ? 'Production API Key' : i === 1 ? 'CI/CD Pipeline' : 'Admin Key',
            key: keyValue,
            scopes: scope,
            expiresAt: faker.date.future({ years: 1 }),
            lastUsedAt: faker.date.recent({ days: 7 }),
            createdAt: faker.date.past({ years: 1 }),
            metadata: {
                environment: i === 0 ? 'production' : i === 1 ? 'ci' : 'admin',
                rotationPolicy: '90 days',
                ipWhitelist: i === 2 ? ['192.168.1.0/24'] : undefined,
            },
        };

        apiKeys.push(apiKey);
    }

    return apiKeys;
}

/**
 * Create a sample project template
 */
export async function createSampleProject(organizationId: string, templateType: 'playwright' | 'cypress' | 'jest') {
    const templates = {
        playwright: {
            name: 'Playwright E2E Tests',
            description: 'End-to-end tests using Playwright',
            framework: 'playwright',
            config: {
                testDir: './tests',
                timeout: 30000,
                retries: 2,
                workers: 4,
                use: {
                    baseURL: 'http://localhost:3000',
                    screenshot: 'only-on-failure',
                    video: 'retain-on-failure',
                },
            },
            sampleTests: [
                {
                    name: 'Login flow',
                    file: 'tests/auth/login.spec.ts',
                    duration: 2500,
                    status: 'passed',
                },
                {
                    name: 'User dashboard',
                    file: 'tests/dashboard.spec.ts',
                    duration: 3200,
                    status: 'passed',
                },
                {
                    name: 'API integration',
                    file: 'tests/api/users.spec.ts',
                    duration: 1800,
                    status: 'passed',
                },
            ],
        },
        cypress: {
            name: 'Cypress E2E Tests',
            description: 'Modern E2E testing with Cypress',
            framework: 'cypress',
            config: {
                baseUrl: 'http://localhost:3000',
                viewportWidth: 1280,
                viewportHeight: 720,
                video: true,
                screenshotOnRunFailure: true,
            },
            sampleTests: [
                {
                    name: 'Homepage loads',
                    file: 'cypress/e2e/home.cy.js',
                    duration: 1500,
                    status: 'passed',
                },
                {
                    name: 'Navigation works',
                    file: 'cypress/e2e/navigation.cy.js',
                    duration: 2100,
                    status: 'passed',
                },
                {
                    name: 'Form submission',
                    file: 'cypress/e2e/forms.cy.js',
                    duration: 2800,
                    status: 'passed',
                },
            ],
        },
        jest: {
            name: 'Jest Unit Tests',
            description: 'Unit and integration tests with Jest',
            framework: 'jest',
            config: {
                testEnvironment: 'node',
                collectCoverage: true,
                coverageThreshold: {
                    global: {
                        branches: 80,
                        functions: 80,
                        lines: 80,
                        statements: 80,
                    },
                },
            },
            sampleTests: [
                {
                    name: 'Utility functions',
                    file: 'tests/utils.test.ts',
                    duration: 150,
                    status: 'passed',
                },
                {
                    name: 'API handlers',
                    file: 'tests/api/handlers.test.ts',
                    duration: 320,
                    status: 'passed',
                },
                {
                    name: 'Database operations',
                    file: 'tests/db/operations.test.ts',
                    duration: 450,
                    status: 'passed',
                },
            ],
        },
    };

    const template = templates[templateType];

    return {
        organizationId,
        ...template,
        createdAt: new Date(),
        isTemplate: true,
        isSample: true,
    };
}

/**
 * Cleanup sample data for an organization
 */
export async function cleanupSampleData(organizationId: string) {
    try {
        // This is a placeholder - actual implementation would delete sample data
        console.log(`Cleaning up sample data for organization ${organizationId}`);

        // In production, you'd run:
        // await prisma.testRun.deleteMany({ where: { organizationId, isSample: true } });
        // await prisma.monitor.deleteMany({ where: { organizationId, isSample: true } });
        // etc.

        return { success: true };
    } catch (error) {
        console.error('Error cleaning up sample data:', error);
        throw error;
    }
}

/**
 * Check if organization has sample data
 */
export async function hasSampleData(organizationId: string): Promise<boolean> {
    // Placeholder - would check database for sample data
    return false;
}
