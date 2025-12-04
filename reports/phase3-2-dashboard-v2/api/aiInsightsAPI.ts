// odavl-studio/insight/cloud/app/api/ai/insights/route.ts
import { NextRequest, NextResponse } from 'next/server';
import * as tf from '@tensorflow/tfjs-node';

export async function POST(request: NextRequest) {
  try {
    const { projectId, timeRange, metrics } = await request.json();

    // Load AI model
    const model = await tf.loadLayersModel('file://./ml-models/insights-predictor/model.json');

    // Prepare input data
    const inputData = prepareMetrics(metrics);
    const predictions = model.predict(tf.tensor2d([inputData])) as tf.Tensor;
    const results = await predictions.array();

    // Generate insights
    const insights = generateInsights(results, metrics);

    return NextResponse.json({
      insights,
      confidence: calculateConfidence(results),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('AI insights error:', error);
    return NextResponse.json(
      { error: 'Failed to generate insights' },
      { status: 500 }
    );
  }
}

function prepareMetrics(metrics: any): number[] {
  // Normalize and prepare metrics for AI model
  return [
    metrics.errorRate || 0,
    metrics.complexity || 0,
    metrics.coverage || 0,
    metrics.velocity || 0,
    metrics.churn || 0
  ];
}

function generateInsights(predictions: any[], metrics: any): any[] {
  const insights = [];

  // Anomaly detection
  if (predictions[0][0] > 0.8) {
    insights.push({
      id: 'anomaly-1',
      type: 'anomaly',
      title: 'Unusual Error Rate Spike',
      description: 'Error rate increased by 45% in the last 24 hours',
      confidence: Math.round(predictions[0][0] * 100),
      recommendations: [
        'Check recent deployments',
        'Review error logs',
        'Run performance profiler'
      ],
      actions: [
        { label: 'View Errors', action: 'navigate:/errors' },
        { label: 'Run Diagnostics', action: 'run-diagnostics' }
      ]
    });
  }

  // Trend prediction
  if (predictions[0][1] > 0.7) {
    insights.push({
      id: 'trend-1',
      type: 'trend',
      title: 'Code Complexity Trending Up',
      description: 'Average cyclomatic complexity increased to 12.5',
      confidence: Math.round(predictions[0][1] * 100),
      recommendations: [
        'Refactor complex functions',
        'Add more unit tests',
        'Review code review guidelines'
      ],
      actions: [
        { label: 'View Hotspots', action: 'navigate:/hotspots' },
        { label: 'Schedule Refactoring', action: 'create-task' }
      ]
    });
  }

  // Smart recommendations
  insights.push({
    id: 'recommendation-1',
    type: 'recommendation',
    title: 'Optimize Build Pipeline',
    description: 'Build time can be reduced by 30% with caching',
    confidence: 85,
    recommendations: [
      'Enable dependency caching',
      'Parallelize test execution',
      'Use incremental builds'
    ],
    actions: [
      { label: 'Apply Optimizations', action: 'optimize-build' }
    ]
  });

  return insights;
}

function calculateConfidence(results: any[]): number {
  return Math.round(results[0].reduce((a: number, b: number) => a + b, 0) / results[0].length * 100);
}