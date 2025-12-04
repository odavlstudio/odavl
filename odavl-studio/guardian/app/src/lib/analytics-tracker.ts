/**
 * Advanced Analytics Tracker - Week 14
 * Privacy-first user behavior tracking, conversion funnels, engagement metrics
 */

export interface UserEvent {
    eventName: string;
    timestamp: Date;
    userId?: string;
    sessionId: string;
    properties: Record<string, unknown>;
    page: string;
    referrer?: string;
    userAgent: string;
}

export interface ConversionFunnel {
    name: string;
    steps: FunnelStep[];
    conversionRate: number;
    dropoffRate: number;
    avgTimeToConvert: number; // Milliseconds
    totalUsers: number;
    convertedUsers: number;
}

export interface FunnelStep {
    name: string;
    eventName: string;
    order: number;
    users: number;
    conversionFromPrevious: number; // Percentage
    avgTimeFromPrevious: number; // Milliseconds
    dropoffUsers: number;
}

export interface EngagementMetrics {
    userId?: string;
    sessionId: string;
    sessionDuration: number; // Milliseconds
    pageViews: number;
    interactions: number;
    scrollDepth: number; // Percentage
    bounceRate: boolean; // True if <30s and 1 page
    returnVisitor: boolean;
    engagementScore: number; // 0-100
}

export interface UserJourney {
    userId?: string;
    sessionId: string;
    events: UserEvent[];
    startTime: Date;
    endTime: Date;
    duration: number;
    pages: string[];
    actions: string[];
    outcome: 'converted' | 'bounced' | 'ongoing' | 'churned';
}

export interface AnalyticsSnapshot {
    timestamp: Date;
    activeUsers: number;
    totalSessions: number;
    avgSessionDuration: number;
    bounceRate: number;
    topPages: Array<{ page: string; views: number }>;
    topEvents: Array<{ event: string; count: number }>;
    conversionRate: number;
    engagementScore: number;
}

/**
 * Privacy-first analytics tracker
 * - No cookies without consent
 * - Anonymized by default
 * - GDPR/CCPA compliant
 * - Client-side only (no third-party)
 */
export class AnalyticsTracker {
    private events: UserEvent[] = [];
    private sessionId: string;
    private sessionStart: Date;
    private consentGiven: boolean = false;

    constructor() {
        this.sessionId = this.generateSessionId();
        this.sessionStart = new Date();
        this.checkConsent();
        this.initializeTracking();
    }

    /**
     * Track custom event
     */
    trackEvent(eventName: string, properties: Record<string, unknown> = {}): void {
        if (!this.consentGiven && !this.isEssentialEvent(eventName)) {
            return; // Don't track non-essential events without consent
        }

        const event: UserEvent = {
            eventName,
            timestamp: new Date(),
            sessionId: this.sessionId,
            properties,
            page: window.location.pathname,
            referrer: document.referrer || undefined,
            userAgent: navigator.userAgent,
        };

        this.events.push(event);
        this.persistEvent(event);

        // Debug mode
        if (process.env.NODE_ENV === 'development') {
            console.log('[Analytics]', eventName, properties);
        }
    }

    /**
     * Track page view
     */
    trackPageView(page?: string): void {
        this.trackEvent('page_view', {
            page: page || window.location.pathname,
            title: document.title,
            timestamp: new Date().toISOString(),
        });
    }

    /**
     * Track button click
     */
    trackClick(element: string, properties: Record<string, unknown> = {}): void {
        this.trackEvent('click', {
            element,
            ...properties,
        });
    }

    /**
     * Track form submission
     */
    trackFormSubmit(formName: string, properties: Record<string, unknown> = {}): void {
        this.trackEvent('form_submit', {
            form: formName,
            ...properties,
        });
    }

    /**
     * Track conversion (e.g., signup, purchase)
     */
    trackConversion(conversionType: string, value?: number, properties: Record<string, unknown> = {}): void {
        this.trackEvent('conversion', {
            type: conversionType,
            value,
            ...properties,
        });
    }

    /**
     * Track error
     */
    trackError(error: Error, context: Record<string, unknown> = {}): void {
        this.trackEvent('error', {
            message: error.message,
            stack: error.stack,
            ...context,
        });
    }

    /**
     * Track user engagement
     */
    trackEngagement(action: string, properties: Record<string, unknown> = {}): void {
        this.trackEvent('engagement', {
            action,
            ...properties,
        });
    }

    /**
     * Get engagement metrics for current session
     */
    getEngagementMetrics(): EngagementMetrics {
        const sessionDuration = Date.now() - this.sessionStart.getTime();
        const pageViews = this.events.filter(e => e.eventName === 'page_view').length;
        const interactions = this.events.filter(e =>
            ['click', 'form_submit', 'engagement'].includes(e.eventName)
        ).length;

        const scrollDepth = this.getMaxScrollDepth();
        const bounceRate = sessionDuration < 30000 && pageViews === 1;
        const returnVisitor = this.isReturnVisitor();

        // Calculate engagement score (0-100)
        let engagementScore = 0;
        engagementScore += Math.min(sessionDuration / 1000 / 60 * 10, 30); // Up to 30 points for time (3 min = max)
        engagementScore += Math.min(pageViews * 5, 20); // Up to 20 points for page views (4 pages = max)
        engagementScore += Math.min(interactions * 3, 30); // Up to 30 points for interactions (10 = max)
        engagementScore += scrollDepth * 0.2; // Up to 20 points for scroll depth

        return {
            sessionId: this.sessionId,
            sessionDuration,
            pageViews,
            interactions,
            scrollDepth,
            bounceRate,
            returnVisitor,
            engagementScore: Math.round(engagementScore),
        };
    }

    /**
     * Analyze conversion funnel
     */
    analyzeConversionFunnel(funnelName: string, steps: string[]): ConversionFunnel {
        const funnelSteps: FunnelStep[] = [];
        let previousUsers = 0;

        for (let i = 0; i < steps.length; i++) {
            const eventName = steps[i];
            const stepEvents = this.events.filter(e => e.eventName === eventName);
            const users = new Set(stepEvents.map(e => e.sessionId)).size;

            const conversionFromPrevious = i === 0 ? 100 : previousUsers > 0 ? (users / previousUsers) * 100 : 0;
            const dropoffUsers = i === 0 ? 0 : previousUsers - users;

            // Calculate average time from previous step
            let avgTimeFromPrevious = 0;
            if (i > 0) {
                const prevEventName = steps[i - 1];
                const timeDiffs: number[] = [];

                for (const event of stepEvents) {
                    const prevEvent = this.events
                        .filter(e => e.eventName === prevEventName && e.sessionId === event.sessionId)
                        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0];

                    if (prevEvent) {
                        timeDiffs.push(event.timestamp.getTime() - prevEvent.timestamp.getTime());
                    }
                }

                avgTimeFromPrevious = timeDiffs.length > 0
                    ? timeDiffs.reduce((sum, t) => sum + t, 0) / timeDiffs.length
                    : 0;
            }

            funnelSteps.push({
                name: eventName,
                eventName,
                order: i + 1,
                users,
                conversionFromPrevious,
                avgTimeFromPrevious,
                dropoffUsers,
            });

            previousUsers = users;
        }

        const totalUsers = funnelSteps[0]?.users || 0;
        const convertedUsers = funnelSteps[funnelSteps.length - 1]?.users || 0;
        const conversionRate = totalUsers > 0 ? (convertedUsers / totalUsers) * 100 : 0;
        const dropoffRate = 100 - conversionRate;

        // Calculate average time to convert
        const avgTimeToConvert = funnelSteps.reduce((sum, step) => sum + step.avgTimeFromPrevious, 0);

        return {
            name: funnelName,
            steps: funnelSteps,
            conversionRate,
            dropoffRate,
            totalUsers,
            convertedUsers,
            avgTimeToConvert,
        };
    }

    /**
     * Get user journey for current session
     */
    getUserJourney(): UserJourney {
        const sessionEvents = this.events.filter(e => e.sessionId === this.sessionId);

        const startTime = sessionEvents.length > 0 ? sessionEvents[0].timestamp : this.sessionStart;
        const endTime = sessionEvents.length > 0
            ? sessionEvents[sessionEvents.length - 1].timestamp
            : new Date();

        const pages = [...new Set(sessionEvents.map(e => e.page))];
        const actions = sessionEvents.map(e => e.eventName);

        // Determine outcome
        let outcome: UserJourney['outcome'] = 'ongoing';
        if (sessionEvents.some(e => e.eventName === 'conversion')) {
            outcome = 'converted';
        } else if (this.getEngagementMetrics().bounceRate) {
            outcome = 'bounced';
        } else if (Date.now() - endTime.getTime() > 30 * 60 * 1000) {
            outcome = 'churned'; // No activity for 30 minutes
        }

        return {
            sessionId: this.sessionId,
            events: sessionEvents,
            startTime,
            endTime,
            duration: endTime.getTime() - startTime.getTime(),
            pages,
            actions,
            outcome,
        };
    }

    /**
     * Get analytics snapshot
     */
    getAnalyticsSnapshot(): AnalyticsSnapshot {
        const activeSessions = new Set(this.events.map(e => e.sessionId)).size;
        const totalSessions = activeSessions;

        // Calculate average session duration
        const sessionDurations: number[] = [];
        const sessions = this.groupEventsBySession();
        for (const sessionEvents of sessions.values()) {
            if (sessionEvents.length > 0) {
                const first = sessionEvents[0].timestamp.getTime();
                const last = sessionEvents[sessionEvents.length - 1].timestamp.getTime();
                sessionDurations.push(last - first);
            }
        }
        const avgSessionDuration = sessionDurations.length > 0
            ? sessionDurations.reduce((sum, d) => sum + d, 0) / sessionDurations.length
            : 0;

        // Calculate bounce rate
        let bouncedSessions = 0;
        for (const sessionEvents of sessions.values()) {
            const pageViews = sessionEvents.filter(e => e.eventName === 'page_view').length;
            const duration = sessionEvents.length > 1
                ? sessionEvents[sessionEvents.length - 1].timestamp.getTime() - sessionEvents[0].timestamp.getTime()
                : 0;
            if (pageViews === 1 && duration < 30000) {
                bouncedSessions++;
            }
        }
        const bounceRate = totalSessions > 0 ? (bouncedSessions / totalSessions) * 100 : 0;

        // Top pages
        const pageViews: Record<string, number> = {};
        for (const event of this.events.filter(e => e.eventName === 'page_view')) {
            pageViews[event.page] = (pageViews[event.page] || 0) + 1;
        }
        const topPages = Object.entries(pageViews)
            .map(([page, views]) => ({ page, views }))
            .sort((a, b) => b.views - a.views)
            .slice(0, 10);

        // Top events
        const eventCounts: Record<string, number> = {};
        for (const event of this.events) {
            eventCounts[event.eventName] = (eventCounts[event.eventName] || 0) + 1;
        }
        const topEvents = Object.entries(eventCounts)
            .map(([event, count]) => ({ event, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);

        // Conversion rate
        const conversions = this.events.filter(e => e.eventName === 'conversion').length;
        const conversionRate = totalSessions > 0 ? (conversions / totalSessions) * 100 : 0;

        // Engagement score
        const engagementScore = this.getEngagementMetrics().engagementScore;

        return {
            timestamp: new Date(),
            activeUsers: activeSessions,
            totalSessions,
            avgSessionDuration,
            bounceRate,
            topPages,
            topEvents,
            conversionRate,
            engagementScore,
        };
    }

    /**
     * Set user consent
     */
    setConsent(granted: boolean): void {
        this.consentGiven = granted;
        localStorage.setItem('analytics_consent', granted ? 'true' : 'false');

        if (!granted) {
            // Clear all non-essential data
            this.clearNonEssentialData();
        }
    }

    /**
     * Check if user has given consent
     */
    private checkConsent(): void {
        const consent = localStorage.getItem('analytics_consent');
        this.consentGiven = consent === 'true';
    }

    /**
     * Check if event is essential (can track without consent)
     */
    private isEssentialEvent(eventName: string): boolean {
        // Essential events: errors, security events
        return eventName === 'error' || eventName === 'security';
    }

    /**
     * Generate session ID
     */
    private generateSessionId(): string {
        const timestamp = Date.now().toString(36);
        const randomStr = Math.random().toString(36).substring(2, 15);
        return `${timestamp}-${randomStr}`;
    }

    /**
     * Initialize tracking (scroll depth, visibility)
     */
    private initializeTracking(): void {
        // Track scroll depth
        let maxScrollDepth = 0;
        window.addEventListener('scroll', () => {
            const scrollDepth = this.calculateScrollDepth();
            if (scrollDepth > maxScrollDepth) {
                maxScrollDepth = scrollDepth;
            }
        });

        // Track visibility changes
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.trackEvent('page_hidden', {});
            } else {
                this.trackEvent('page_visible', {});
            }
        });

        // Track page unload
        window.addEventListener('beforeunload', () => {
            this.trackEvent('session_end', {
                duration: Date.now() - this.sessionStart.getTime(),
            });
        });
    }

    /**
     * Calculate scroll depth percentage
     */
    private calculateScrollDepth(): number {
        const windowHeight = window.innerHeight;
        const documentHeight = document.documentElement.scrollHeight;
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const scrollDepth = (scrollTop / (documentHeight - windowHeight)) * 100;
        return Math.min(Math.round(scrollDepth), 100);
    }

    /**
     * Get maximum scroll depth
     */
    private getMaxScrollDepth(): number {
        // Simplified: return current scroll depth
        return this.calculateScrollDepth();
    }

    /**
     * Check if user is a return visitor
     */
    private isReturnVisitor(): boolean {
        const lastVisit = localStorage.getItem('last_visit');
        if (!lastVisit) {
            localStorage.setItem('last_visit', new Date().toISOString());
            return false;
        }
        return true;
    }

    /**
     * Group events by session
     */
    private groupEventsBySession(): Map<string, UserEvent[]> {
        const sessions = new Map<string, UserEvent[]>();

        for (const event of this.events) {
            const sessionEvents = sessions.get(event.sessionId) || [];
            sessionEvents.push(event);
            sessions.set(event.sessionId, sessionEvents);
        }

        return sessions;
    }

    /**
     * Persist event to localStorage
     */
    private persistEvent(event: UserEvent): void {
        try {
            const stored = localStorage.getItem('analytics_events');
            const events = stored ? JSON.parse(stored) : [];
            events.push(event);

            // Keep only last 1000 events
            if (events.length > 1000) {
                events.shift();
            }

            localStorage.setItem('analytics_events', JSON.stringify(events));
        } catch {
            // Storage quota exceeded or unavailable
        }
    }

    /**
     * Clear non-essential data
     */
    private clearNonEssentialData(): void {
        this.events = this.events.filter(e => this.isEssentialEvent(e.eventName));
        localStorage.removeItem('analytics_events');
    }
}

// Export singleton instance
export const analytics = new AnalyticsTracker();
