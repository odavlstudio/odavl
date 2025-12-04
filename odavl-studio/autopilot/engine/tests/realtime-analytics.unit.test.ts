import { describe, it, expect, vi } from 'vitest'
// Try both possible file names for compatibility
import { ODAvlRealtimeAnalyticsEngine } from '../src/realtimeAnalytics.ts'


describe('ODAvlRealtimeAnalyticsEngine', () => {
    const config = {
        port: 0, // use 0 to avoid port conflicts
        maxConnections: 2,
        heartbeatInterval: 100,
        dataRetentionPeriod: 1,
        alertThresholds: {
            qualityScoreMin: 50,
            eslintWarningsMax: 2,
            typeErrorsMax: 0,
            buildFailureRate: 0.1
        },
        aggregationIntervals: {
            realtime: 1,
            shortTerm: 1,
            longTerm: 1
        }
    }

    it('should instantiate and start/stop without error', async () => {
        const engine = new ODAvlRealtimeAnalyticsEngine(config)
        await engine.start()
        await engine.stop()
        expect(engine).toBeInstanceOf(ODAvlRealtimeAnalyticsEngine)
    })

    it('should publish quality update and trigger alert if below threshold', async () => {
        const engine = new ODAvlRealtimeAnalyticsEngine(config)
        await engine.start()
        const spy = vi.spyOn(engine, 'publishAlert')
        engine.publishQualityUpdate({
            projectId: 'p1',
            metrics: {
                eslintWarnings: 5,
                typeErrors: 0,
                codeComplexity: 1,
                testCoverage: 10,
                duplication: 1
            },
            affectedFiles: ['a.ts'],
            timestamp: new Date().toISOString()
        })
        expect(spy).toHaveBeenCalled()
        await engine.stop()
    })

    it('should publish prediction results to the correct room', async () => {
        const engine = new ODAvlRealtimeAnalyticsEngine(config)
        await engine.start()
        const spy = vi.spyOn(engine as any, 'broadcastToRoom')
        engine.publishPrediction('p2', { result: 1 }, { risk: 2 }, { rec: 3 })
        expect(spy).toHaveBeenCalledWith('project:p2', expect.any(Object))
        await engine.stop()
    })

    it('should publish team metrics to the correct team room', async () => {
        const engine = new ODAvlRealtimeAnalyticsEngine(config)
        await engine.start()
        const spy = vi.spyOn(engine as any, 'broadcastToRoom')
        engine.publishTeamMetrics('team1', { velocity: 10 })
        expect(spy).toHaveBeenCalledWith('team:team1', expect.any(Object))
        await engine.stop()
    })

    it('should publish dashboard data to all clients with dashboardData subscription', async () => {
        const engine = new ODAvlRealtimeAnalyticsEngine(config)
        await engine.start()
        const spy = vi.spyOn(engine as any, 'broadcast')
        engine.publishDashboardData({
            overview: { totalProjects: 1, activeAlerts: 0, qualityScore: 100, trendsDirection: 'up' },
            realtimeMetrics: { eslintWarnings: 0, typeErrors: 0, buildSuccess: 1, deploymentFrequency: 1 },
            teamPerformance: { velocity: 1, qualityTrend: 1, collaborationScore: 1, burnoutRisk: 0 },
            lastUpdated: new Date().toISOString()
        })
        expect(spy).toHaveBeenCalled()
        await engine.stop()
    })

    it('should get analytics stats with correct structure', async () => {
        const engine = new ODAvlRealtimeAnalyticsEngine(config)
        await engine.start()
        const stats = engine.getAnalyticsStats()
        expect(stats).toHaveProperty('connectedClients')
        expect(stats).toHaveProperty('activeRooms')
        expect(stats).toHaveProperty('totalMessages')
        expect(stats).toHaveProperty('uptime')
        expect(stats).toHaveProperty('bufferSize')
        await engine.stop()
    })

    it('should aggregate data points and cleanup old data', async () => {
        const engine = new ODAvlRealtimeAnalyticsEngine(config)
        await engine.start()
        // Add data to buffer
        engine['updateDataBuffer']('test-metric', { eslintWarnings: 1, typeErrors: 0, codeComplexity: 1, testCoverage: 90, duplication: 1 })
        // Aggregate
        engine['performDataAggregation']()
        // Should emit data-aggregated event
        let eventEmitted = false
        engine.on('data-aggregated', () => { eventEmitted = true })
        engine['performDataAggregation']()
        expect(eventEmitted).toBe(true)
        // Cleanup
        engine['cleanupOldData']()
        expect(Array.isArray(engine['dataBuffer'].get('test-metric'))).toBe(true)
        await engine.stop()
    })

    it('should handle alert conditions for quality score and eslint warnings', async () => {
        const engine = new ODAvlRealtimeAnalyticsEngine(config)
        await engine.start()
        const spy = vi.spyOn(engine, 'publishAlert')
        // Quality score below threshold
        engine['checkAlertConditions']({
            projectId: 'p3',
            metrics: { eslintWarnings: 0, typeErrors: 0, codeComplexity: 1, testCoverage: 10, duplication: 1 },
            affectedFiles: ['b.ts'],
            timestamp: new Date().toISOString()
        })
        // ESLint warnings above threshold
        engine['checkAlertConditions']({
            projectId: 'p4',
            metrics: { eslintWarnings: 10, typeErrors: 0, codeComplexity: 1, testCoverage: 90, duplication: 1 },
            affectedFiles: ['c.ts'],
            timestamp: new Date().toISOString()
        })
        expect(spy).toHaveBeenCalled()
        await engine.stop()
    })
})

describe('ODAvlRealtimeAnalyticsEngine (private/utility methods)', () => {
    const config = {
        port: 0,
        maxConnections: 2,
        heartbeatInterval: 100,
        dataRetentionPeriod: 1,
        alertThresholds: {
            qualityScoreMin: 50,
            eslintWarningsMax: 2,
            typeErrorsMax: 0,
            buildFailureRate: 0.1
        },
        aggregationIntervals: {
            realtime: 1,
            shortTerm: 1,
            longTerm: 1
        }
    }

    it('should calculate quality score correctly', () => {
        const engine = new ODAvlRealtimeAnalyticsEngine(config)
        const metrics = { eslintWarnings: 2, typeErrors: 1, codeComplexity: 10, testCoverage: 80, duplication: 2 }
        const score = engine['calculateQualityScore'](metrics)
        expect(typeof score).toBe('number')
        expect(score).toBeLessThanOrEqual(100)
    })

    it('should generate IDs and units', () => {
        const engine = new ODAvlRealtimeAnalyticsEngine(config)
        expect(engine['generateClientId']()).toMatch(/^client_/)
        expect(engine['generateSessionId']()).toMatch(/^session_/)
        expect(engine['generateAlertId']()).toMatch(/^alert_/)
        expect(engine['getMetricUnit']('quality-score')).toBe('score')
        expect(engine['getMetricUnit']('unknown-metric')).toBe('unknown')
    })

    it('should handle sendMessage errors and disconnect', () => {
        const engine = new ODAvlRealtimeAnalyticsEngine(config)
        // Add a fake client with a socket that throws and has close()
        const badSocket = { readyState: 1, send: () => { throw new Error('fail') }, close: () => { } }
        engine['clients'].set('bad', {
            id: 'bad',
            socket: badSocket,
            subscriptions: { qualityUpdates: true, alerts: true, predictions: true, teamMetrics: false, dashboardData: true, rooms: [] },
            rooms: new Set(),
            lastHeartbeat: new Date(),
            metadata: { sessionStart: new Date() }
        })
        // Should not throw, but disconnect
        engine['sendMessage']('bad', { type: 'heartbeat', timestamp: '', data: {} })
        expect(engine['clients'].has('bad')).toBe(false)
    })

    it('should handle leaveRoom and handleClientDisconnect', () => {
        const engine = new ODAvlRealtimeAnalyticsEngine(config)
        engine['rooms'].set('room1', new Set(['c1']))
        engine['clients'].set('c1', {
            id: 'c1',
            socket: { readyState: 1, send: () => { }, close: () => { } },
            subscriptions: { qualityUpdates: true, alerts: true, predictions: true, teamMetrics: false, dashboardData: true, rooms: [] },
            rooms: new Set(['room1']),
            lastHeartbeat: new Date(),
            metadata: { sessionStart: new Date() }
        })
        engine['leaveRoom']('c1', 'room1')
        expect(engine['rooms'].get('room1')).toBeUndefined()
        engine['handleClientDisconnect']('c1')
        expect(engine['clients'].has('c1')).toBe(false)
    })

    it('should update data buffer and store alert', () => {
        const engine = new ODAvlRealtimeAnalyticsEngine(config)
        engine['updateDataBuffer']('metric1', { eslintWarnings: 1, typeErrors: 0, codeComplexity: 1, testCoverage: 90, duplication: 1 })
        expect(engine['dataBuffer'].has('metric1')).toBe(true)
        const alert = {
            id: 'a', severity: 'high' as const, category: 'c', title: 't', description: 'd', projectId: 'p',
            affectedComponents: [], recommendations: [], autoResolvable: false, estimatedImpact: { developmentTime: 1, riskLevel: 1, affectedUsers: 1 }, timestamp: ''
        }
        engine['storeAlert'](alert)
        expect(engine['alertHistory'].has('p')).toBe(true)
    })

    it('should aggregate data points', () => {
        const engine = new ODAvlRealtimeAnalyticsEngine(config)
        const arr = [{ value: 1 }, { value: 2 }, { value: 3 }]
        const result = engine['aggregateDataPoints'](arr)
        expect(result).toHaveProperty('value', 2)
    })

    it('should get buffer size', () => {
        const engine = new ODAvlRealtimeAnalyticsEngine(config)
        engine['dataBuffer'].set('m', [{}, {}])
        expect(engine['getBufferSize']()).toBe(2)
    })

    it('should return 0 for getTotalMessageCount and getUptime', () => {
        const engine = new ODAvlRealtimeAnalyticsEngine(config)
        expect(engine['getTotalMessageCount']()).toBe(0)
        expect(engine['getUptime']()).toBe(0)
    })
})
