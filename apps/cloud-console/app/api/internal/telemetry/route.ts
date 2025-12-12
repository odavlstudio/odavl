/**
 * ODAVL Insight Telemetry API
 * Internal admin-only endpoint for telemetry ingestion and metrics queries
 * 
 * POST /api/internal/telemetry - Ingest telemetry events
 * GET  /api/internal/telemetry?metric=<name>&days=<n> - Query aggregated metrics
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

/**
 * GET /api/internal/telemetry?metric=<name>&days=<n>
 * Query aggregated metrics for internal admin dashboard
 */
export async function GET(req: NextRequest) {
  try {
    // Check authentication and admin role
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // TODO: Check if user is admin (for now, allow all authenticated users)
    // const isAdmin = (session.user as any).role === 'admin';
    // if (!isAdmin) {
    //   return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    // }
    
    const { searchParams } = new URL(req.url);
    const metric = searchParams.get('metric');
    const days = parseInt(searchParams.get('days') || '30');
    const planId = searchParams.get('planId') || undefined;
    const source = searchParams.get('source') || undefined;
    
    if (!metric) {
      return NextResponse.json({ error: 'Metric parameter required' }, { status: 400 });
    }
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    // Query based on metric type
    if (metric === 'active_users') {
      // Count unique users per day
      const results = await prisma.$queryRaw<Array<{ date: Date; count: bigint }>>`
        SELECT 
          DATE("timestamp") as date,
          COUNT(DISTINCT "userId") as count
        FROM "telemetry_events"
        WHERE "timestamp" >= ${startDate}
          ${planId ? prisma.$queryRaw`AND "planId" = ${planId}` : prisma.$queryRaw``}
          ${source ? prisma.$queryRaw`AND "source" = ${source}` : prisma.$queryRaw``}
        GROUP BY DATE("timestamp")
        ORDER BY date
      `;
      
      return NextResponse.json({ 
        metric, 
        data: results.map(r => ({ 
          date: r.date.toISOString().split('T')[0], 
          count: Number(r.count) 
        })) 
      });
    }
    
    if (metric === 'total_analyses') {
      // Count analysis completed events
      const results = await prisma.$queryRaw<Array<{ date: Date; count: bigint; mode: string }>>`
        SELECT 
          DATE("timestamp") as date,
          "properties"->>'mode' as mode,
          COUNT(*) as count
        FROM "telemetry_events"
        WHERE "timestamp" >= ${startDate}
          AND "type" IN ('insight.analysis_completed', 'insight.cloud_analysis_completed')
          ${planId ? prisma.$queryRaw`AND "planId" = ${planId}` : prisma.$queryRaw``}
          ${source ? prisma.$queryRaw`AND "source" = ${source}` : prisma.$queryRaw``}
        GROUP BY DATE("timestamp"), "properties"->>'mode'
        ORDER BY date
      `;
      
      return NextResponse.json({ 
        metric, 
        data: results.map(r => ({ 
          date: r.date.toISOString().split('T')[0], 
          mode: r.mode,
          count: Number(r.count) 
        })) 
      });
    }
    
    if (metric === 'issues_found') {
      // Sum issues found over time
      const results = await prisma.$queryRaw<Array<{ date: Date; totalIssues: number; criticalCount: number }>>`
        SELECT 
          DATE("timestamp") as date,
          SUM(CAST("properties"->>'issuesFound' AS INTEGER)) as "totalIssues",
          SUM(CAST("properties"->>'criticalCount' AS INTEGER)) as "criticalCount"
        FROM "telemetry_events"
        WHERE "timestamp" >= ${startDate}
          AND "type" IN ('insight.analysis_completed', 'insight.cloud_analysis_completed')
          ${planId ? prisma.$queryRaw`AND "planId" = ${planId}` : prisma.$queryRaw``}
          ${source ? prisma.$queryRaw`AND "source" = ${source}` : prisma.$queryRaw``}
        GROUP BY DATE("timestamp")
        ORDER BY date
      `;
      
      return NextResponse.json({ 
        metric, 
        data: results.map(r => ({ 
          date: r.date.toISOString().split('T')[0], 
          totalIssues: Number(r.totalIssues || 0),
          criticalCount: Number(r.criticalCount || 0)
        })) 
      });
    }
    
    if (metric === 'conversion_funnel') {
      // Calculate conversion funnel: signup → trial → limit → upgrade → paid
      const funnel = await prisma.$queryRaw<Array<{ step: string; count: bigint }>>`
        SELECT 
          'signups' as step,
          COUNT(DISTINCT "userId") as count
        FROM "telemetry_events"
        WHERE "type" = 'insight.user_signed_up'
          AND "timestamp" >= ${startDate}
        
        UNION ALL
        
        SELECT 
          'trials' as step,
          COUNT(DISTINCT "userId") as count
        FROM "telemetry_events"
        WHERE "type" = 'insight.trial_started'
          AND "timestamp" >= ${startDate}
        
        UNION ALL
        
        SELECT 
          'limits_hit' as step,
          COUNT(DISTINCT "userId") as count
        FROM "telemetry_events"
        WHERE "type" = 'insight.limit_hit'
          AND "timestamp" >= ${startDate}
        
        UNION ALL
        
        SELECT 
          'upgrade_prompts' as step,
          COUNT(DISTINCT "userId") as count
        FROM "telemetry_events"
        WHERE "type" = 'insight.upgrade_prompt_shown'
          AND "timestamp" >= ${startDate}
        
        UNION ALL
        
        SELECT 
          'upgrades' as step,
          COUNT(DISTINCT "userId") as count
        FROM "telemetry_events"
        WHERE "type" = 'insight.plan_upgraded'
          AND "timestamp" >= ${startDate}
      `;
      
      return NextResponse.json({ 
        metric, 
        data: funnel.map(f => ({ 
          step: f.step, 
          count: Number(f.count) 
        })) 
      });
    }
    
    if (metric === 'top_detectors') {
      // Most used detectors
      const results = await prisma.$queryRaw<Array<{ detector: string; count: bigint }>>`
        SELECT 
          jsonb_array_elements_text("properties"->'detectors') as detector,
          COUNT(*) as count
        FROM "telemetry_events"
        WHERE "timestamp" >= ${startDate}
          AND "type" IN ('insight.analysis_started', 'insight.cloud_analysis_started')
          ${planId ? prisma.$queryRaw`AND "planId" = ${planId}` : prisma.$queryRaw``}
        GROUP BY detector
        ORDER BY count DESC
        LIMIT 10
      `;
      
      return NextResponse.json({ 
        metric, 
        data: results.map(r => ({ 
          detector: r.detector, 
          count: Number(r.count) 
        })) 
      });
    }
    
    if (metric === 'avg_duration') {
      // Average analysis duration over time
      const results = await prisma.$queryRaw<Array<{ date: Date; avgDuration: number }>>`
        SELECT 
          DATE("timestamp") as date,
          AVG(CAST("properties"->>'durationMs' AS INTEGER)) as "avgDuration"
        FROM "telemetry_events"
        WHERE "timestamp" >= ${startDate}
          AND "type" IN ('insight.analysis_completed', 'insight.cloud_analysis_completed')
          ${planId ? prisma.$queryRaw`AND "planId" = ${planId}` : prisma.$queryRaw``}
          ${source ? prisma.$queryRaw`AND "source" = ${source}` : prisma.$queryRaw``}
        GROUP BY DATE("timestamp")
        ORDER BY date
      `;
      
      return NextResponse.json({ 
        metric, 
        data: results.map(r => ({ 
          date: r.date.toISOString().split('T')[0], 
          avgDuration: Math.round(Number(r.avgDuration || 0))
        })) 
      });
    }
    
    return NextResponse.json({ error: 'Unknown metric' }, { status: 400 });
    
  } catch (error) {
    console.error('[Telemetry API] Query error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

/**
 * POST /api/internal/telemetry
 * Ingest telemetry events from clients (CLI, Extension, Cloud)
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { events } = body;
    
    if (!Array.isArray(events)) {
      return NextResponse.json({ error: 'Invalid payload: events must be an array' }, { status: 400 });
    }
    
    if (events.length === 0) {
      return NextResponse.json({ success: true, count: 0 });
    }
    
    // Validate and sanitize events
    const validEvents = events.filter((event: any) => {
      return (
        event.type &&
        typeof event.type === 'string' &&
        event.userId &&
        event.planId &&
        event.source &&
        event.timestamp &&
        event.properties &&
        typeof event.properties === 'object'
      );
    });
    
    if (validEvents.length === 0) {
      return NextResponse.json({ error: 'No valid events in batch' }, { status: 400 });
    }
    
    // Store events in database
    await prisma.telemetryEvent.createMany({
      data: validEvents.map((event: any) => ({
        type: event.type,
        userId: event.userId,
        sessionId: event.sessionId,
        planId: event.planId,
        isTrial: event.isTrial || false,
        source: event.source,
        properties: event.properties,
        timestamp: new Date(event.timestamp),
      })),
      skipDuplicates: true, // Idempotent ingestion
    });
    
    return NextResponse.json({ 
      success: true, 
      count: validEvents.length,
      skipped: events.length - validEvents.length,
    });
    
  } catch (error) {
    console.error('[Telemetry API] Ingestion error:', error);
    return NextResponse.json({ 
      error: 'Failed to ingest events',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
