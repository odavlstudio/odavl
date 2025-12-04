import { NextRequest, NextResponse } from 'next/server';

// Edge function to get user geolocation data
export const runtime = 'edge';

// Type for Vercel edge runtime geo property
type RequestWithGeo = NextRequest & {
  geo?: {
    ip?: string;
    country?: string;
    city?: string;
    region?: string;
    latitude?: string;
    longitude?: string;
  };
};

export async function GET(request: NextRequest) {
  const reqWithGeo = request as RequestWithGeo;
  const geo = reqWithGeo.geo;

  const locationData = {
    ip: geo?.ip || 'unknown',
    country: geo?.country || 'unknown',
    city: geo?.city || 'unknown',
    region: geo?.region || 'unknown',
    latitude: geo?.latitude || null,
    longitude: geo?.longitude || null,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  };

  return NextResponse.json(locationData, {
    headers: {
      'Cache-Control': 'private, max-age=3600', // Cache for 1 hour per user
      'Vary': 'Accept-Encoding',
    },
  });
}
