/**
 * Beta Feedback Analyzer - Week 14
 * Analyzes beta user feedback and categorizes by theme
 */

export interface Feedback {
    id: string;
    type: 'bug' | 'feature' | 'feedback' | 'praise';
    message: string;
    rating?: number; // 1-5 stars
    userId?: string;
    sessionId: string;
    url: string;
    userAgent: string;
    timestamp: Date;
    category?: string;
    sentiment?: 'positive' | 'negative' | 'neutral';
    priority?: 'high' | 'medium' | 'low';
    tags?: string[];
}

export interface FeedbackTheme {
    name: string;
    count: number;
    feedbackIds: string[];
    sentiment: 'positive' | 'negative' | 'neutral';
    examples: string[];
    actionItems: string[];
    priority: 'high' | 'medium' | 'low';
}

export interface FeedbackAnalysis {
    totalFeedback: number;
    byType: Record<Feedback['type'], number>;
    bySentiment: Record<'positive' | 'negative' | 'neutral', number>;
    avgRating: number;
    themes: FeedbackTheme[];
    topIssues: string[];
    topRequests: string[];
    urgentItems: Feedback[];
    insightsSummary: string;
}

/**
 * Analyzes beta user feedback and identifies patterns
 */
export class FeedbackAnalyzer {
    private feedback: Feedback[] = [];

    /**
     * Add feedback to analyzer
     */
    addFeedback(feedback: Feedback): void {
        this.feedback.push(feedback);
    }

    /**
     * Load feedback from array
     */
    loadFeedback(feedbackList: Feedback[]): void {
        this.feedback = feedbackList;
    }

    /**
     * Analyze all feedback and generate report
     */
    analyze(): FeedbackAnalysis {
        const totalFeedback = this.feedback.length;

        // Count by type
        const byType: Record<Feedback['type'], number> = {
            bug: 0,
            feature: 0,
            feedback: 0,
            praise: 0,
        };

        for (const fb of this.feedback) {
            byType[fb.type]++;
        }

        // Analyze sentiment
        const feedbackWithSentiment = this.feedback.map(fb => ({
            ...fb,
            sentiment: fb.sentiment || this.detectSentiment(fb.message),
        }));

        const bySentiment = {
            positive: feedbackWithSentiment.filter(fb => fb.sentiment === 'positive').length,
            negative: feedbackWithSentiment.filter(fb => fb.sentiment === 'negative').length,
            neutral: feedbackWithSentiment.filter(fb => fb.sentiment === 'neutral').length,
        };

        // Calculate average rating
        const ratings = this.feedback.filter(fb => fb.rating !== undefined).map(fb => fb.rating!);
        const avgRating = ratings.length > 0 ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length : 0;

        // Extract themes
        const themes = this.extractThemes(feedbackWithSentiment as (Feedback & { sentiment: 'positive' | 'negative' | 'neutral' })[]);

        // Top issues and requests
        const topIssues = this.extractTopIssues();
        const topRequests = this.extractTopRequests();

        // Urgent items (high priority + negative sentiment)
        const urgentItems = feedbackWithSentiment.filter(
            fb => fb.priority === 'high' || (fb.sentiment === 'negative' && fb.type === 'bug')
        ) as Feedback[];

        const result: FeedbackAnalysis = {
            totalFeedback,
            byType,
            bySentiment,
            avgRating,
            themes,
            topIssues,
            topRequests,
            urgentItems,
            insightsSummary: '', // Placeholder
        };

        // Generate insights summary after creating result object
        result.insightsSummary = this.generateInsightsSummary(result);

        return result;
    }

    /**
     * Detect sentiment from message text
     */
    private detectSentiment(message: string): 'positive' | 'negative' | 'neutral' {
        const lowerMessage = message.toLowerCase();

        // Positive keywords
        const positiveKeywords = [
            'love', 'great', 'excellent', 'amazing', 'awesome', 'fantastic',
            'wonderful', 'perfect', 'helpful', 'easy', 'fast', 'smooth',
            'best', 'beautiful', 'clean', 'intuitive', 'powerful',
        ];

        // Negative keywords
        const negativeKeywords = [
            'bug', 'error', 'crash', 'broken', 'issue', 'problem',
            'slow', 'confusing', 'difficult', 'frustrating', 'bad',
            'terrible', 'awful', 'hate', 'worst', 'useless', 'annoying',
            'not working', 'doesnt work', 'failed', 'fails',
        ];

        let positiveScore = 0;
        let negativeScore = 0;

        for (const keyword of positiveKeywords) {
            if (lowerMessage.includes(keyword)) positiveScore++;
        }

        for (const keyword of negativeKeywords) {
            if (lowerMessage.includes(keyword)) negativeScore++;
        }

        if (positiveScore > negativeScore + 1) return 'positive';
        if (negativeScore > positiveScore + 1) return 'negative';
        return 'neutral';
    }

    /**
     * Extract common themes from feedback
     */
    private extractThemes(feedback: (Feedback & { sentiment: 'positive' | 'negative' | 'neutral' })[]): FeedbackTheme[] {
        const themeMap = new Map<string, {
            feedbackIds: string[];
            sentiments: ('positive' | 'negative' | 'neutral')[];
            examples: string[];
        }>();

        // Predefined themes to look for
        const themes = [
            { name: 'Performance', keywords: ['slow', 'fast', 'performance', 'speed', 'lag', 'loading'] },
            { name: 'UI/UX', keywords: ['design', 'interface', 'ui', 'ux', 'layout', 'navigation', 'confusing', 'intuitive'] },
            { name: 'Reliability', keywords: ['crash', 'error', 'bug', 'stable', 'reliable', 'broken', 'working'] },
            { name: 'Features', keywords: ['feature', 'functionality', 'missing', 'add', 'support', 'need'] },
            { name: 'Documentation', keywords: ['documentation', 'docs', 'help', 'guide', 'tutorial', 'examples'] },
            { name: 'Integration', keywords: ['integration', 'api', 'connect', 'import', 'export', 'sync'] },
            { name: 'Onboarding', keywords: ['onboarding', 'setup', 'getting started', 'first time', 'sign up'] },
            { name: 'Monitoring', keywords: ['monitor', 'dashboard', 'metrics', 'alerts', 'notifications'] },
            { name: 'Testing', keywords: ['test', 'testing', 'runner', 'playwright', 'cypress', 'jest'] },
        ];

        // Categorize feedback by themes
        for (const fb of feedback) {
            const lowerMessage = fb.message.toLowerCase();

            for (const theme of themes) {
                const matches = theme.keywords.some(keyword => lowerMessage.includes(keyword));

                if (matches) {
                    const existing = themeMap.get(theme.name) || {
                        feedbackIds: [],
                        sentiments: [],
                        examples: [],
                    };

                    existing.feedbackIds.push(fb.id);
                    existing.sentiments.push(fb.sentiment);
                    if (existing.examples.length < 3) {
                        existing.examples.push(fb.message.substring(0, 100));
                    }

                    themeMap.set(theme.name, existing);
                }
            }
        }

        // Convert to FeedbackTheme array
        const result: FeedbackTheme[] = [];

        for (const [name, data] of themeMap.entries()) {
            const positiveCount = data.sentiments.filter(s => s === 'positive').length;
            const negativeCount = data.sentiments.filter(s => s === 'negative').length;

            let sentiment: 'positive' | 'negative' | 'neutral';
            if (positiveCount > negativeCount + 1) sentiment = 'positive';
            else if (negativeCount > positiveCount + 1) sentiment = 'negative';
            else sentiment = 'neutral';

            // Determine priority based on count and sentiment
            let priority: 'high' | 'medium' | 'low';
            if (data.feedbackIds.length > 10 && sentiment === 'negative') priority = 'high';
            else if (data.feedbackIds.length > 5) priority = 'medium';
            else priority = 'low';

            // Generate action items
            const actionItems = this.generateActionItems(name, sentiment, data.feedbackIds.length);

            result.push({
                name,
                count: data.feedbackIds.length,
                feedbackIds: data.feedbackIds,
                sentiment,
                examples: data.examples,
                actionItems,
                priority,
            });
        }

        // Sort by count descending
        return result.sort((a, b) => b.count - a.count);
    }

    /**
     * Generate action items for a theme
     */
    private generateActionItems(theme: string, sentiment: 'positive' | 'negative' | 'neutral', count: number): string[] {
        const actions: string[] = [];

        if (theme === 'Performance' && sentiment === 'negative') {
            actions.push('Profile and optimize slow operations');
            actions.push('Implement caching for frequently accessed data');
            actions.push('Review database query performance');
        }

        if (theme === 'UI/UX' && sentiment === 'negative') {
            actions.push('Conduct user testing session');
            actions.push('Simplify navigation flow');
            actions.push('Add tooltips for complex features');
        }

        if (theme === 'Reliability' && sentiment === 'negative') {
            actions.push('Prioritize bug fixes');
            actions.push('Add error handling and recovery');
            actions.push('Increase test coverage');
        }

        if (theme === 'Features' && count > 5) {
            actions.push('Evaluate feature requests by impact');
            actions.push('Create roadmap for top requests');
            actions.push('Communicate planned features to users');
        }

        if (theme === 'Documentation' && sentiment === 'negative') {
            actions.push('Expand documentation with more examples');
            actions.push('Create video tutorials');
            actions.push('Add interactive onboarding');
        }

        if (theme === 'Integration' && count > 3) {
            actions.push('Prioritize integration requests');
            actions.push('Improve API documentation');
            actions.push('Add integration examples');
        }

        if (theme === 'Onboarding' && sentiment === 'negative') {
            actions.push('Simplify onboarding flow');
            actions.push('Add sample data for new users');
            actions.push('Create getting started checklist');
        }

        if (theme === 'Monitoring' && sentiment === 'positive') {
            actions.push('Highlight monitoring features in marketing');
            actions.push('Create case studies');
        }

        if (actions.length === 0) {
            actions.push(`Review ${theme.toLowerCase()} feedback in detail`);
            actions.push(`Prioritize ${theme.toLowerCase()} improvements in next sprint`);
        }

        return actions;
    }

    /**
     * Extract top issues from bug reports
     */
    private extractTopIssues(): string[] {
        const bugs = this.feedback.filter(fb => fb.type === 'bug');
        const issueMap = new Map<string, number>();

        for (const bug of bugs) {
            const issue = this.extractIssueKeywords(bug.message);
            issueMap.set(issue, (issueMap.get(issue) || 0) + 1);
        }

        return Array.from(issueMap.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([issue, count]) => `${issue} (${count} reports)`);
    }

    /**
     * Extract top feature requests
     */
    private extractTopRequests(): string[] {
        const features = this.feedback.filter(fb => fb.type === 'feature');
        const requestMap = new Map<string, number>();

        for (const feature of features) {
            const request = this.extractRequestKeywords(feature.message);
            requestMap.set(request, (requestMap.get(request) || 0) + 1);
        }

        return Array.from(requestMap.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([request, count]) => `${request} (${count} requests)`);
    }

    /**
     * Extract issue keywords from bug message
     */
    private extractIssueKeywords(message: string): string {
        const lowerMessage = message.toLowerCase();

        const issuePatterns = [
            { pattern: /dashboard.*not.*load/i, issue: 'Dashboard not loading' },
            { pattern: /test.*not.*run/i, issue: 'Tests not running' },
            { pattern: /login.*fail|crash/i, issue: 'Login failure' },
            { pattern: /slow.*performance/i, issue: 'Slow performance' },
            { pattern: /api.*error|timeout/i, issue: 'API errors' },
            { pattern: /ui.*broken|bug/i, issue: 'UI issues' },
            { pattern: /monitor.*not.*work/i, issue: 'Monitor not working' },
        ];

        for (const { pattern, issue } of issuePatterns) {
            if (pattern.test(message)) return issue;
        }

        return 'Other issue';
    }

    /**
     * Extract request keywords from feature message
     */
    private extractRequestKeywords(message: string): string {
        const lowerMessage = message.toLowerCase();

        const requestPatterns = [
            { pattern: /jest.*integration/i, request: 'Jest integration' },
            { pattern: /slack.*integration|notification/i, request: 'Slack integration' },
            { pattern: /dark.*mode/i, request: 'Dark mode' },
            { pattern: /export.*csv|excel/i, request: 'Export to CSV' },
            { pattern: /mobile.*app/i, request: 'Mobile app' },
            { pattern: /api.*webhook/i, request: 'Webhooks' },
            { pattern: /parallel.*test/i, request: 'Parallel testing' },
        ];

        for (const { pattern, request } of requestPatterns) {
            if (pattern.test(message)) return request;
        }

        return 'Other feature';
    }

    /**
     * Generate insights summary
     */
    private generateInsightsSummary(analysis: FeedbackAnalysis): string {
        const { totalFeedback, byType, bySentiment, avgRating, themes, urgentItems } = analysis;

        const lines: string[] = [];

        lines.push(`## Beta Feedback Summary (${totalFeedback} total)`);
        lines.push('');
        lines.push('### Overview');
        lines.push(`- Bug Reports: ${byType.bug}`);
        lines.push(`- Feature Requests: ${byType.feature}`);
        lines.push(`- General Feedback: ${byType.feedback}`);
        lines.push(`- Praise: ${byType.praise}`);
        lines.push('');

        lines.push('### Sentiment Analysis');
        const sentimentPercent = (count: number) => ((count / totalFeedback) * 100).toFixed(1);
        lines.push(`- Positive: ${bySentiment.positive} (${sentimentPercent(bySentiment.positive)}%)`);
        lines.push(`- Negative: ${bySentiment.negative} (${sentimentPercent(bySentiment.negative)}%)`);
        lines.push(`- Neutral: ${bySentiment.neutral} (${sentimentPercent(bySentiment.neutral)}%)`);
        lines.push(`- Average Rating: ${avgRating.toFixed(2)}/5.0`);
        lines.push('');

        lines.push('### Top Themes');
        for (const theme of themes.slice(0, 5)) {
            lines.push(`- **${theme.name}** (${theme.count} mentions, ${theme.sentiment}, ${theme.priority} priority)`);
        }
        lines.push('');

        lines.push('### Urgent Items');
        if (urgentItems.length > 0) {
            lines.push(`${urgentItems.length} urgent items require immediate attention:`);
            for (const item of urgentItems.slice(0, 5)) {
                lines.push(`- [${item.type.toUpperCase()}] ${item.message.substring(0, 80)}...`);
            }
        } else {
            lines.push('No urgent items at this time.');
        }
        lines.push('');

        lines.push('### Recommended Actions');
        const highPriorityThemes = themes.filter(t => t.priority === 'high');
        if (highPriorityThemes.length > 0) {
            for (const theme of highPriorityThemes) {
                lines.push(`**${theme.name}:**`);
                for (const action of theme.actionItems) {
                    lines.push(`  - ${action}`);
                }
            }
        } else {
            lines.push('Continue monitoring feedback and addressing issues as they arise.');
        }

        return lines.join('\n');
    }
}

/**
 * Generate sample feedback for testing
 */
export function generateSampleFeedback(): Feedback[] {
    return [
        {
            id: '1',
            type: 'bug',
            message: 'Dashboard is not loading test runs correctly. The list shows duplicate entries and some runs are missing.',
            userId: 'user-1',
            sessionId: 'session-1',
            url: '/dashboard',
            userAgent: 'Mozilla/5.0',
            timestamp: new Date('2025-11-16T10:00:00Z'),
        },
        {
            id: '2',
            type: 'feature',
            message: 'Please add support for Jest test runner integration. Our team uses Jest and would love to use Guardian.',
            userId: 'user-2',
            sessionId: 'session-2',
            url: '/feedback',
            userAgent: 'Mozilla/5.0',
            timestamp: new Date('2025-11-16T11:00:00Z'),
        },
        {
            id: '3',
            type: 'praise',
            message: 'Guardian is amazing! The monitoring dashboard is exactly what we needed. Love the real-time updates!',
            rating: 5,
            userId: 'user-3',
            sessionId: 'session-3',
            url: '/monitoring',
            userAgent: 'Mozilla/5.0',
            timestamp: new Date('2025-11-16T12:00:00Z'),
        },
        {
            id: '4',
            type: 'bug',
            message: 'Login page crashes when I submit the form. Getting a white screen.',
            userId: 'user-4',
            sessionId: 'session-4',
            url: '/login',
            userAgent: 'Mozilla/5.0',
            timestamp: new Date('2025-11-16T13:00:00Z'),
        },
        {
            id: '5',
            type: 'feedback',
            message: 'The UI is clean and intuitive. However, the onboarding flow could be simpler. Took me a while to figure out how to set up my first test.',
            rating: 4,
            userId: 'user-5',
            sessionId: 'session-5',
            url: '/onboarding',
            userAgent: 'Mozilla/5.0',
            timestamp: new Date('2025-11-16T14:00:00Z'),
        },
        {
            id: '6',
            type: 'feature',
            message: 'Add Slack integration for test notifications. Would be great to get alerts in our #engineering channel.',
            userId: 'user-6',
            sessionId: 'session-6',
            url: '/settings',
            userAgent: 'Mozilla/5.0',
            timestamp: new Date('2025-11-16T15:00:00Z'),
        },
        {
            id: '7',
            type: 'bug',
            message: 'API endpoint returns 500 error intermittently. Happens about 1 out of 10 requests.',
            userId: 'user-7',
            sessionId: 'session-7',
            url: '/api/test-runs',
            userAgent: 'Mozilla/5.0',
            timestamp: new Date('2025-11-16T16:00:00Z'),
        },
        {
            id: '8',
            type: 'feedback',
            message: 'Performance monitoring is excellent. The real-time metrics are very helpful for debugging production issues.',
            rating: 5,
            userId: 'user-8',
            sessionId: 'session-8',
            url: '/monitoring/performance',
            userAgent: 'Mozilla/5.0',
            timestamp: new Date('2025-11-16T17:00:00Z'),
        },
        {
            id: '9',
            type: 'feature',
            message: 'Export test results to CSV for reporting. Need to share results with non-technical stakeholders.',
            userId: 'user-9',
            sessionId: 'session-9',
            url: '/test-runs',
            userAgent: 'Mozilla/5.0',
            timestamp: new Date('2025-11-16T18:00:00Z'),
        },
        {
            id: '10',
            type: 'bug',
            message: 'Dashboard loading is slow when I have 100+ test runs. Takes 5-10 seconds.',
            userId: 'user-10',
            sessionId: 'session-10',
            url: '/dashboard',
            userAgent: 'Mozilla/5.0',
            timestamp: new Date('2025-11-16T19:00:00Z'),
        },
    ];
}
