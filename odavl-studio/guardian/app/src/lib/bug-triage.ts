/**
 * Bug Triage System
 * 
 * Week 13: Beta Testing - Bug Tracking & Prioritization
 * 
 * Manages bug reports, severity classification, and SLA response times.
 */

export type BugSeverity = 'critical' | 'high' | 'medium' | 'low';
export type BugStatus = 'new' | 'triaged' | 'in-progress' | 'resolved' | 'wont-fix';
export type BugCategory = 'ui' | 'api' | 'performance' | 'security' | 'data' | 'integration' | 'other';

export interface Bug {
    id: string;
    title: string;
    description: string;
    severity: BugSeverity;
    status: BugStatus;
    category: BugCategory;
    reportedBy: string;
    assignedTo?: string;
    reproducible: boolean;
    stepsToReproduce?: string[];
    expectedBehavior?: string;
    actualBehavior?: string;
    environment: {
        browser?: string;
        os?: string;
        version?: string;
    };
    attachments?: string[];
    createdAt: Date;
    updatedAt: Date;
    resolvedAt?: Date;
    slaDeadline: Date;
}

/**
 * SLA response times based on severity
 */
const SLA_RESPONSE_TIMES: Record<BugSeverity, number> = {
    critical: 2 * 60 * 60 * 1000, // 2 hours
    high: 8 * 60 * 60 * 1000, // 8 hours
    medium: 24 * 60 * 60 * 1000, // 24 hours
    low: 72 * 60 * 60 * 1000, // 72 hours
};

/**
 * Calculate SLA deadline based on severity
 */
export function calculateSlaDeadline(severity: BugSeverity, createdAt: Date = new Date()): Date {
    const deadline = new Date(createdAt);
    deadline.setTime(deadline.getTime() + SLA_RESPONSE_TIMES[severity]);
    return deadline;
}

/**
 * Check if bug is overdue
 */
export function isBugOverdue(bug: Bug): boolean {
    if (bug.status === 'resolved' || bug.status === 'wont-fix') {
        return false;
    }

    return new Date() > bug.slaDeadline;
}

/**
 * Get time remaining until SLA deadline
 */
export function getTimeUntilDeadline(bug: Bug): {
    overdue: boolean;
    hours: number;
    minutes: number;
    formatted: string;
} {
    const now = new Date();
    const diff = bug.slaDeadline.getTime() - now.getTime();
    const overdue = diff < 0;
    const absDiff = Math.abs(diff);

    const hours = Math.floor(absDiff / (60 * 60 * 1000));
    const minutes = Math.floor((absDiff % (60 * 60 * 1000)) / (60 * 1000));

    let formatted: string;
    if (overdue) {
        formatted = `Overdue by ${hours}h ${minutes}m`;
    } else if (hours > 24) {
        const days = Math.floor(hours / 24);
        formatted = `${days}d ${hours % 24}h remaining`;
    } else {
        formatted = `${hours}h ${minutes}m remaining`;
    }

    return { overdue, hours, minutes, formatted };
}

/**
 * Auto-classify bug severity based on description
 */
export function autoClassifySeverity(bug: Partial<Bug>): BugSeverity {
    const text = `${bug.title} ${bug.description}`.toLowerCase();

    // Critical keywords
    const criticalKeywords = [
        'crash', 'data loss', 'security', 'breach', 'exploit', 'unauthorized',
        'production down', 'complete failure', 'cannot use', 'broken authentication',
    ];

    // High keywords
    const highKeywords = [
        'major', 'severe', 'important', 'blocking', 'prevents', 'stops',
        'cannot complete', 'error', 'failure', 'not working',
    ];

    // Medium keywords
    const mediumKeywords = [
        'issue', 'problem', 'incorrect', 'wrong', 'unexpected', 'inconsistent',
        'slow', 'delay', 'minor bug',
    ];

    if (criticalKeywords.some(keyword => text.includes(keyword))) {
        return 'critical';
    }

    if (highKeywords.some(keyword => text.includes(keyword))) {
        return 'high';
    }

    if (mediumKeywords.some(keyword => text.includes(keyword))) {
        return 'medium';
    }

    return 'low';
}

/**
 * Auto-categorize bug based on description
 */
export function autoCategorizeBug(bug: Partial<Bug>): BugCategory {
    const text = `${bug.title} ${bug.description}`.toLowerCase();

    const categoryKeywords: Record<BugCategory, string[]> = {
        ui: ['ui', 'interface', 'button', 'layout', 'display', 'styling', 'design', 'visual'],
        api: ['api', 'endpoint', 'request', 'response', 'http', 'rest', 'graphql'],
        performance: ['slow', 'performance', 'lag', 'timeout', 'speed', 'loading'],
        security: ['security', 'auth', 'permission', 'access', 'vulnerability', 'xss', 'csrf'],
        data: ['data', 'database', 'query', 'record', 'missing', 'corrupt'],
        integration: ['integration', 'third-party', 'external', 'webhook', 'sync'],
        other: [],
    };

    for (const [category, keywords] of Object.entries(categoryKeywords)) {
        if (keywords.some(keyword => text.includes(keyword))) {
            return category as BugCategory;
        }
    }

    return 'other';
}

/**
 * Create bug report
 */
export function createBug(data: Omit<Bug, 'id' | 'createdAt' | 'updatedAt' | 'slaDeadline'>): Bug {
    const now = new Date();
    const autoSeverity = data.severity || autoClassifySeverity(data);
    const autoCategory = data.category || autoCategorizeBug(data);

    return {
        ...data,
        id: `bug_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        severity: autoSeverity,
        category: autoCategory,
        status: data.status || 'new',
        createdAt: now,
        updatedAt: now,
        slaDeadline: calculateSlaDeadline(autoSeverity, now),
    };
}

/**
 * Triage bugs by priority
 */
export function triageBugs(bugs: Bug[]): {
    overdue: Bug[];
    critical: Bug[];
    high: Bug[];
    medium: Bug[];
    low: Bug[];
} {
    const overdue = bugs.filter(isBugOverdue);
    const critical = bugs.filter(b => b.severity === 'critical' && !isBugOverdue(b));
    const high = bugs.filter(b => b.severity === 'high' && !isBugOverdue(b));
    const medium = bugs.filter(b => b.severity === 'medium' && !isBugOverdue(b));
    const low = bugs.filter(b => b.severity === 'low' && !isBugOverdue(b));

    return { overdue, critical, high, medium, low };
}

/**
 * Get bug statistics
 */
export function getBugStats(bugs: Bug[]): {
    total: number;
    byStatus: Record<BugStatus, number>;
    bySeverity: Record<BugSeverity, number>;
    byCategory: Record<BugCategory, number>;
    overdue: number;
    avgResolutionTime: number;
} {
    const byStatus: Record<BugStatus, number> = {
        new: 0,
        triaged: 0,
        'in-progress': 0,
        resolved: 0,
        'wont-fix': 0,
    };

    const bySeverity: Record<BugSeverity, number> = {
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
    };

    const byCategory: Record<BugCategory, number> = {
        ui: 0,
        api: 0,
        performance: 0,
        security: 0,
        data: 0,
        integration: 0,
        other: 0,
    };

    let totalResolutionTime = 0;
    let resolvedCount = 0;
    let overdue = 0;

    bugs.forEach(bug => {
        byStatus[bug.status]++;
        bySeverity[bug.severity]++;
        byCategory[bug.category]++;

        if (isBugOverdue(bug)) {
            overdue++;
        }

        if (bug.status === 'resolved' && bug.resolvedAt) {
            const resolutionTime = bug.resolvedAt.getTime() - bug.createdAt.getTime();
            totalResolutionTime += resolutionTime;
            resolvedCount++;
        }
    });

    const avgResolutionTime = resolvedCount > 0
        ? totalResolutionTime / resolvedCount
        : 0;

    return {
        total: bugs.length,
        byStatus,
        bySeverity,
        byCategory,
        overdue,
        avgResolutionTime: Math.floor(avgResolutionTime / (60 * 60 * 1000)), // Convert to hours
    };
}

/**
 * Format bug for display
 */
export function formatBug(bug: Bug): string {
    const timeRemaining = getTimeUntilDeadline(bug);
    const severityEmoji = {
        critical: '🔴',
        high: '🟠',
        medium: '🟡',
        low: '🟢',
    };

    return `
${severityEmoji[bug.severity]} [${bug.severity.toUpperCase()}] ${bug.title}
Status: ${bug.status}
Category: ${bug.category}
SLA: ${timeRemaining.formatted}
Reported: ${bug.createdAt.toISOString()}
${bug.assignedTo ? `Assigned to: ${bug.assignedTo}` : 'Unassigned'}
  `.trim();
}

/**
 * Sample bugs for testing
 */
export const SAMPLE_BUGS: Bug[] = [
    createBug({
        title: 'Login page crashes on submit',
        description: 'When clicking submit button, the entire page crashes with TypeError',
        severity: 'critical',
        status: 'new',
        category: 'ui',
        reportedBy: 'user_123',
        reproducible: true,
        stepsToReproduce: [
            'Navigate to /login',
            'Enter valid credentials',
            'Click submit button',
            'Page crashes',
        ],
        environment: {
            browser: 'Chrome 120',
            os: 'Windows 11',
            version: '1.0.0',
        },
    }),

    createBug({
        title: 'API returns 500 error for /test-runs endpoint',
        description: 'GET /api/test-runs returns Internal Server Error intermittently',
        severity: 'high',
        status: 'triaged',
        category: 'api',
        reportedBy: 'user_456',
        assignedTo: 'dev_789',
        reproducible: false,
        environment: {
            version: '1.0.0',
        },
    }),

    createBug({
        title: 'Dashboard loading slowly',
        description: 'Dashboard takes 5+ seconds to load with 100+ test runs',
        severity: 'medium',
        status: 'in-progress',
        category: 'performance',
        reportedBy: 'user_789',
        assignedTo: 'dev_123',
        reproducible: true,
        environment: {
            browser: 'Firefox 121',
            os: 'macOS',
            version: '1.0.0',
        },
    }),
];
