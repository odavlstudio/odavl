import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const metric = JSON.parse(body);
    
    // In production, you would send this to your analytics service
    // For now, we'll just log it (visible in Vercel logs)
    console.log('Web Vitals:', {
      name: metric.name,
      value: metric.value,
      rating: metric.rating,
      id: metric.id,
      url: request.url
    });
    
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Web Vitals Error:', error);
    return NextResponse.json({ error: 'Invalid metric data' }, { status: 400 });
  }
}