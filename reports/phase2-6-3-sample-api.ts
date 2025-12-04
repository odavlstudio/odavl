import { NextRequest, NextResponse } from 'next/server';

/**
 * API Route: /api/insight/overview
 * All detected issues across 7 languages
 */
export async function GET(request: NextRequest) {
  try {
    // Fetch data from database or external source
    const data = await fetchOverviewData();

    return NextResponse.json({
      success: true,
      data,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in overview API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Fetch data for Overview Dashboard
 */
async function fetchOverviewData() {
  // Mock data for now
  return {
    view: 'overview',
    name: 'Overview Dashboard',
    features: [
      "Multi-language issue summary",
      "Detection statistics by language",
      "Recent detections timeline",
      "Quick action buttons"
],
    languages: ["typescript","python","java","go","rust","csharp","php"],
    metrics: {
      totalIssues: Math.floor(Math.random() * 1000),
      criticalIssues: Math.floor(Math.random() * 50),
      resolvedToday: Math.floor(Math.random() * 100)
    }
  };
}