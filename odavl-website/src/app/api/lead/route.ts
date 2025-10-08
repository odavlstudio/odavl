import { NextRequest, NextResponse } from 'next/server';
import { rateLimit, getRateLimitHeaders } from '@/lib/rateLimit';

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
  const rateLimitResult = rateLimit(ip);

  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Try again later.' },
      { 
        status: 429,
        headers: getRateLimitHeaders(rateLimitResult.remaining, rateLimitResult.resetTime)
      }
    );
  }

  // Mock lead capture logic
  const body = await request.json();
  console.log('Lead captured:', body);

  return NextResponse.json(
    { message: 'Lead captured successfully' },
    { 
      status: 200,
      headers: getRateLimitHeaders(rateLimitResult.remaining, rateLimitResult.resetTime)
    }
  );
}

export async function GET() {
  return NextResponse.json({ message: 'Lead API endpoint active' });
}