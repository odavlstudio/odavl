import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { email, name, company, useCase } = await request.json();

    // Validation
    if (!email || !name) {
      return NextResponse.json({ error: 'Email and name are required' }, { status: 400 });
    }

    // Check if already signed up
    const existing = await prisma.betaSignup.findUnique({
      where: { email },
    });

    if (existing) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
    }

    // Create beta signup
    const signup = await prisma.betaSignup.create({
      data: {
        email,
        name,
        company: company || null,
        useCase: useCase || null,
      },
    });

    // TODO: Send welcome email (integrate with SendGrid/Mailgun)
    // await sendWelcomeEmail(email, name);

    // TODO: Notify team in Slack/Discord
    // await notifyTeam({ email, name, company });

    return NextResponse.json({
      success: true,
      message: 'Thank you for signing up! Check your email for next steps.',
      signupId: signup.id,
    });
  } catch (error) {
    console.error('Beta signup error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    // Admin endpoint to view signups (add auth later)
    const signups = await prisma.betaSignup.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    const stats = {
      total: signups.length,
    };

    return NextResponse.json({ signups, stats });
  } catch (error) {
    console.error('Get signups error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
