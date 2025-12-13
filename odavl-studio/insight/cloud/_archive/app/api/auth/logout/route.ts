import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get('accessToken')?.value;
    const refreshToken = req.cookies.get('refreshToken')?.value;

    if (!token || !refreshToken) {
      return NextResponse.json(
        { error: 'No tokens provided' },
        { status: 401 }
      );
    }

    // Delete session
    await prisma.session.deleteMany({
      where: {
        OR: [
          { token },
          { refreshToken },
        ],
      },
    });

    // Clear cookies
    const response = NextResponse.json({ message: 'Logged out successfully' });
    response.cookies.delete('accessToken');
    response.cookies.delete('refreshToken');

    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
