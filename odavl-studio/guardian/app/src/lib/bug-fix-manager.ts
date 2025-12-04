/**
 * Critical Bug Fixes - Week 14
 * Fast-track bug resolution system for beta testing
 */

export interface Bug {
    id: string;
    title: string;
    description: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    status: 'new' | 'triaged' | 'in-progress' | 'resolved' | 'wont-fix';
    category: 'ui' | 'api' | 'performance' | 'security' | 'data' | 'integration' | 'other';
    reportedBy: string;
    assignedTo?: string;
    reproducible: boolean;
    stepsToReproduce: string[];
    expectedBehavior: string;
    actualBehavior: string;
    environment: {
        browser?: string;
        os?: string;
        version?: string;
    };
    attachments: string[];
    createdAt: Date;
    updatedAt: Date;
    resolvedAt?: Date;
    slaDeadline: Date;
    tags: string[];
}

export interface BugFix {
    bugId: string;
    description: string;
    files: string[];
    solution: string;
    testPlan: string[];
    estimatedTime: number; // Hours
    priority: 'immediate' | 'urgent' | 'normal';
    preventionStrategy: string;
}

/**
 * Critical bug fix manager for beta testing
 */
export class BugFixManager {
    private bugs: Bug[] = [];
    private fixes: BugFix[] = [];

    /**
     * Add bug to tracking system
     */
    addBug(bug: Bug): void {
        this.bugs.push(bug);
    }

    /**
     * Get all critical and high severity bugs
     */
    getCriticalBugs(): Bug[] {
        return this.bugs.filter(
            bug =>
                (bug.severity === 'critical' || bug.severity === 'high') &&
                bug.status !== 'resolved' &&
                bug.status !== 'wont-fix'
        );
    }

    /**
     * Get overdue bugs (past SLA deadline)
     */
    getOverdueBugs(): Bug[] {
        const now = new Date();
        return this.bugs.filter(
            bug =>
                bug.status !== 'resolved' &&
                bug.status !== 'wont-fix' &&
                bug.slaDeadline < now
        );
    }

    /**
     * Generate bug fix plan
     */
    generateBugFixPlan(bug: Bug): BugFix {
        const solution = this.generateSolution(bug);
        const testPlan = this.generateTestPlan(bug);
        const preventionStrategy = this.generatePreventionStrategy(bug);
        const estimatedTime = this.estimateFixTime(bug);
        const priority = this.determinePriority(bug);

        return {
            bugId: bug.id,
            description: `Fix: ${bug.title}`,
            files: this.identifyAffectedFiles(bug),
            solution,
            testPlan,
            estimatedTime,
            priority,
            preventionStrategy,
        };
    }

    /**
     * Generate solution based on bug category
     */
    private generateSolution(bug: Bug): string {
        const solutions: Record<string, string> = {
            ui: `
1. Identify the UI component causing the issue
2. Review component state management
3. Check for rendering conditions that may cause the bug
4. Add defensive checks for edge cases
5. Test across different browsers and screen sizes
      `.trim(),

            api: `
1. Review API endpoint implementation
2. Check request/response validation
3. Add error handling for edge cases
4. Verify database queries
5. Test with different input scenarios
6. Update API documentation if needed
      `.trim(),

            performance: `
1. Profile the slow operation
2. Identify bottlenecks (database, network, computation)
3. Implement caching where appropriate
4. Optimize database queries
5. Add pagination or lazy loading
6. Benchmark before/after performance
      `.trim(),

            security: `
1. Assess security impact
2. Review authentication/authorization logic
3. Add input validation and sanitization
4. Implement rate limiting if needed
5. Update security documentation
6. Schedule security audit
      `.trim(),

            data: `
1. Identify data integrity issue
2. Review database schema and constraints
3. Add validation at application layer
4. Implement data migration if needed
5. Add monitoring for data quality
6. Create rollback plan
      `.trim(),

            integration: `
1. Review integration configuration
2. Check API credentials and permissions
3. Verify request/response formats
4. Add retry logic with exponential backoff
5. Improve error messages
6. Update integration documentation
      `.trim(),

            other: `
1. Reproduce the bug consistently
2. Analyze root cause
3. Implement targeted fix
4. Add regression tests
5. Document the fix
      `.trim(),
        };

        return solutions[bug.category] || solutions.other;
    }

    /**
     * Generate test plan
     */
    private generateTestPlan(bug: Bug): string[] {
        const testPlan: string[] = [
            'Reproduce the bug using steps from bug report',
            'Apply the fix',
            'Verify bug is resolved with original reproduction steps',
            'Test edge cases and related scenarios',
            'Run automated test suite',
        ];

        if (bug.severity === 'critical') {
            testPlan.push('Perform smoke testing on all critical flows');
            testPlan.push('Get approval from QA team before deployment');
        }

        if (bug.category === 'api') {
            testPlan.push('Test API with different input payloads');
            testPlan.push('Verify error responses are correct');
        }

        if (bug.category === 'ui') {
            testPlan.push('Test across Chrome, Firefox, Safari');
            testPlan.push('Test on mobile devices');
        }

        if (bug.category === 'performance') {
            testPlan.push('Benchmark performance before/after fix');
            testPlan.push('Verify no performance regression in other areas');
        }

        testPlan.push('Deploy to staging environment for final verification');

        return testPlan;
    }

    /**
     * Generate prevention strategy
     */
    private generatePreventionStrategy(bug: Bug): string {
        const strategies: Record<string, string> = {
            ui: 'Add Playwright E2E tests covering this UI flow. Implement visual regression testing.',
            api: 'Add API contract tests. Implement request/response validation. Add integration tests.',
            performance: 'Add performance benchmarks to CI/CD. Set up performance monitoring alerts.',
            security: 'Add security scanning to CI/CD. Schedule regular security audits.',
            data: 'Add database constraints. Implement data validation at multiple layers.',
            integration: 'Add integration tests. Implement health checks for external services.',
            other: 'Add regression tests. Improve code review process.',
        };

        return strategies[bug.category] || strategies.other;
    }

    /**
     * Estimate fix time in hours
     */
    private estimateFixTime(bug: Bug): number {
        let baseTime = 2; // Base 2 hours for simple fix

        // Adjust based on severity
        if (bug.severity === 'critical') baseTime += 2;
        if (bug.severity === 'high') baseTime += 1;

        // Adjust based on category
        if (bug.category === 'security') baseTime += 3; // Security fixes need extra care
        if (bug.category === 'data') baseTime += 2; // Data migrations are complex
        if (bug.category === 'integration') baseTime += 2; // External dependencies

        // Adjust based on reproducibility
        if (!bug.reproducible) baseTime += 4; // Hard to fix if can't reproduce

        return baseTime;
    }

    /**
     * Determine fix priority
     */
    private determinePriority(bug: Bug): BugFix['priority'] {
        if (bug.severity === 'critical') return 'immediate';
        if (bug.severity === 'high' && bug.category === 'security') return 'immediate';

        const now = new Date();
        const timeUntilSLA = bug.slaDeadline.getTime() - now.getTime();
        const hoursUntilSLA = timeUntilSLA / (1000 * 60 * 60);

        if (hoursUntilSLA < 4) return 'immediate'; // Less than 4 hours until SLA
        if (hoursUntilSLA < 12) return 'urgent'; // Less than 12 hours

        return 'normal';
    }

    /**
     * Identify affected files based on bug category
     */
    private identifyAffectedFiles(bug: Bug): string[] {
        const files: string[] = [];

        if (bug.category === 'ui') {
            files.push('src/components/**/*.tsx');
            files.push('src/pages/**/*.tsx');
        }

        if (bug.category === 'api') {
            files.push('src/app/api/**/*.ts');
            files.push('src/lib/api/**/*.ts');
        }

        if (bug.category === 'data') {
            files.push('prisma/schema.prisma');
            files.push('src/lib/db/**/*.ts');
        }

        if (bug.category === 'integration') {
            files.push('src/lib/integrations/**/*.ts');
        }

        if (bug.category === 'performance') {
            files.push('src/lib/query-optimizer.ts');
            files.push('src/lib/cache/**/*.ts');
        }

        return files;
    }

    /**
     * Generate daily bug fix report
     */
    generateDailyReport(): string {
        const criticalBugs = this.getCriticalBugs();
        const overdueBugs = this.getOverdueBugs();

        const lines: string[] = [];

        lines.push('# Daily Bug Fix Report');
        lines.push('');
        lines.push(`**Date**: ${new Date().toISOString().split('T')[0]}`);
        lines.push('');

        lines.push('## Critical & High Severity Bugs');
        lines.push(`**Total**: ${criticalBugs.length}`);
        lines.push('');

        if (criticalBugs.length > 0) {
            for (const bug of criticalBugs) {
                const timeUntilSLA = bug.slaDeadline.getTime() - Date.now();
                const hoursUntilSLA = Math.floor(timeUntilSLA / (1000 * 60 * 60));

                lines.push(`### [${bug.severity.toUpperCase()}] ${bug.title}`);
                lines.push(`- **ID**: ${bug.id}`);
                lines.push(`- **Status**: ${bug.status}`);
                lines.push(`- **Category**: ${bug.category}`);
                lines.push(`- **SLA**: ${hoursUntilSLA}h remaining`);
                lines.push(`- **Reporter**: ${bug.reportedBy}`);
                if (bug.assignedTo) {
                    lines.push(`- **Assigned**: ${bug.assignedTo}`);
                }
                lines.push('');
            }
        } else {
            lines.push('✅ No critical or high severity bugs pending');
            lines.push('');
        }

        lines.push('## Overdue Bugs (SLA Breached)');
        lines.push(`**Total**: ${overdueBugs.length}`);
        lines.push('');

        if (overdueBugs.length > 0) {
            for (const bug of overdueBugs) {
                const overdueTime = Date.now() - bug.slaDeadline.getTime();
                const overdueHours = Math.floor(overdueTime / (1000 * 60 * 60));

                lines.push(`### 🚨 [${bug.severity.toUpperCase()}] ${bug.title}`);
                lines.push(`- **ID**: ${bug.id}`);
                lines.push(`- **Overdue by**: ${overdueHours}h`);
                lines.push(`- **Status**: ${bug.status}`);
                lines.push(`- **Assigned**: ${bug.assignedTo || 'Unassigned'}`);
                lines.push('');
            }
        } else {
            lines.push('✅ All bugs are within SLA');
            lines.push('');
        }

        lines.push('## Action Items');
        if (overdueBugs.length > 0) {
            lines.push('1. Prioritize overdue bugs immediately');
            lines.push('2. Assign unassigned bugs to team members');
            lines.push('3. Review SLA deadlines for critical bugs');
        } else if (criticalBugs.length > 0) {
            lines.push('1. Monitor critical bugs approaching SLA deadline');
            lines.push('2. Ensure all critical bugs are assigned');
            lines.push('3. Schedule daily check-ins for critical issues');
        } else {
            lines.push('1. Continue monitoring for new bug reports');
            lines.push('2. Review medium/low priority bugs');
            lines.push('3. Update bug prevention strategies');
        }

        return lines.join('\n');
    }
}

/**
 * Sample critical bugs for Week 14 beta testing
 */
export const SAMPLE_CRITICAL_BUGS: Bug[] = [
    {
        id: 'BUG-001',
        title: 'Login page crashes on submit',
        description: 'When submitting login form, the page crashes and shows white screen. Happens consistently on Chrome.',
        severity: 'critical',
        status: 'new',
        category: 'ui',
        reportedBy: 'beta-user-4',
        reproducible: true,
        stepsToReproduce: [
            'Navigate to /login',
            'Enter valid email and password',
            'Click "Login" button',
            'Page crashes and shows white screen',
        ],
        expectedBehavior: 'User should be redirected to dashboard after successful login',
        actualBehavior: 'Page crashes, white screen, console shows TypeError',
        environment: {
            browser: 'Chrome 119',
            os: 'macOS 14',
            version: '1.0.0-beta',
        },
        attachments: ['screenshot.png', 'console-error.log'],
        createdAt: new Date('2025-11-16T10:00:00Z'),
        updatedAt: new Date('2025-11-16T10:00:00Z'),
        slaDeadline: new Date('2025-11-16T12:00:00Z'), // 2 hours for critical
        tags: ['beta', 'login', 'crash'],
    },
    {
        id: 'BUG-002',
        title: 'API returns 500 error intermittently',
        description: 'GET /api/test-runs returns 500 error about 1 out of 10 requests. No clear pattern.',
        severity: 'high',
        status: 'triaged',
        category: 'api',
        reportedBy: 'beta-user-7',
        assignedTo: 'dev-john',
        reproducible: false,
        stepsToReproduce: [
            'Make multiple GET requests to /api/test-runs',
            'About 10% of requests fail with 500 error',
            'Error message: "Cannot read property \'id\' of undefined"',
        ],
        expectedBehavior: 'API should return 200 with test runs list',
        actualBehavior: 'Intermittent 500 errors, inconsistent behavior',
        environment: {
            browser: 'N/A (API)',
            os: 'N/A',
            version: '1.0.0-beta',
        },
        attachments: ['api-error-logs.txt'],
        createdAt: new Date('2025-11-16T11:00:00Z'),
        updatedAt: new Date('2025-11-16T11:30:00Z'),
        slaDeadline: new Date('2025-11-16T19:00:00Z'), // 8 hours for high
        tags: ['beta', 'api', 'intermittent'],
    },
    {
        id: 'BUG-003',
        title: 'Dashboard loading extremely slow with 100+ test runs',
        description: 'Dashboard takes 5-10 seconds to load when user has more than 100 test runs.',
        severity: 'high',
        status: 'in-progress',
        category: 'performance',
        reportedBy: 'beta-user-10',
        assignedTo: 'dev-sarah',
        reproducible: true,
        stepsToReproduce: [
            'Create account with 100+ test runs',
            'Navigate to /dashboard',
            'Observe loading time (5-10 seconds)',
        ],
        expectedBehavior: 'Dashboard should load in <1 second',
        actualBehavior: 'Dashboard takes 5-10 seconds to load',
        environment: {
            browser: 'Chrome 119',
            os: 'Windows 11',
            version: '1.0.0-beta',
        },
        attachments: ['performance-trace.json'],
        createdAt: new Date('2025-11-16T09:00:00Z'),
        updatedAt: new Date('2025-11-16T14:00:00Z'),
        slaDeadline: new Date('2025-11-16T17:00:00Z'), // 8 hours for high
        tags: ['beta', 'performance', 'dashboard'],
    },
];
