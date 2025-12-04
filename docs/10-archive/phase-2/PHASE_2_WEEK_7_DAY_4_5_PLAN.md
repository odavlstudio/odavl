# Phase 2 Week 7 Days 4-5 - Email Service & Verification

**Date:** November 23, 2025  
**Objective:** Build email verification and password reset system  
**Estimated Time:** 8-10 hours (2 days)  
**Status:** IN PROGRESS 🔨

---

## 🎯 Mission

Implement complete email verification and password reset functionality using Nodemailer with Gmail SMTP.

---

## 📋 Prerequisites

✅ Day 1 Complete - Auth package with email methods  
✅ Day 2 Complete - Auth API routes working  
✅ Database schema has emailVerificationToken, passwordResetToken  
✅ AuthService has verifyEmail() and resetPassword() methods  

---

## 🔧 Task Breakdown

### Task 1: Email Service Package (3 hours)

**Objective:** Create @odavl-studio/email package with Nodemailer

#### Step 1.1: Create Package Structure (15 min)
```bash
mkdir -p packages/email/src
cd packages/email
```

#### Step 1.2: Setup package.json (15 min)
```json
{
  "name": "@odavl-studio/email",
  "version": "1.0.0",
  "type": "module",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "require": "./dist/index.cjs",
      "types": "./dist/index.d.ts"
    }
  },
  "scripts": {
    "build": "tsup src/index.ts --format esm,cjs --dts",
    "dev": "tsup src/index.ts --format esm,cjs --dts --watch"
  },
  "dependencies": {
    "nodemailer": "^6.9.7"
  },
  "devDependencies": {
    "@types/nodemailer": "^6.4.14",
    "tsup": "^8.0.1",
    "typescript": "^5.3.3"
  }
}
```

#### Step 1.3: Create Email Service (1.5 hours)
```typescript
// packages/email/src/index.ts

import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

export interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
  from: {
    name: string;
    email: string;
  };
}

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export class EmailService {
  private transporter: Transporter;
  private from: { name: string; email: string };

  constructor(config: EmailConfig) {
    this.transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: config.auth,
    });
    this.from = config.from;
  }

  async sendEmail(options: SendEmailOptions): Promise<void> {
    await this.transporter.sendMail({
      from: `"${this.from.name}" <${this.from.email}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || this.stripHtml(options.html),
    });
  }

  async sendVerificationEmail(
    to: string,
    name: string,
    token: string,
    baseUrl: string
  ): Promise<void> {
    const verifyUrl = `${baseUrl}/api/auth/verify-email?token=${token}`;
    
    await this.sendEmail({
      to,
      subject: 'Verify your ODAVL account',
      html: this.getVerificationEmailTemplate(name, verifyUrl),
    });
  }

  async sendPasswordResetEmail(
    to: string,
    name: string,
    token: string,
    baseUrl: string
  ): Promise<void> {
    const resetUrl = `${baseUrl}/reset-password?token=${token}`;
    
    await this.sendEmail({
      to,
      subject: 'Reset your ODAVL password',
      html: this.getPasswordResetTemplate(name, resetUrl),
    });
  }

  async sendWelcomeEmail(to: string, name: string): Promise<void> {
    await this.sendEmail({
      to,
      subject: 'Welcome to ODAVL!',
      html: this.getWelcomeTemplate(name),
    });
  }

  private getVerificationEmailTemplate(name: string, verifyUrl: string): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #4F46E5; color: white; padding: 20px; text-align: center; }
            .content { padding: 30px; background: #f9fafb; }
            .button { 
              display: inline-block; 
              padding: 12px 30px; 
              background: #4F46E5; 
              color: white; 
              text-decoration: none; 
              border-radius: 5px;
              margin: 20px 0;
            }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>ODAVL Studio</h1>
            </div>
            <div class="content">
              <h2>Hi ${name}! 👋</h2>
              <p>Thanks for signing up for ODAVL Studio. Please verify your email address to get started.</p>
              <p>
                <a href="${verifyUrl}" class="button">Verify Email Address</a>
              </p>
              <p>Or copy this link: <br/><code>${verifyUrl}</code></p>
              <p>This link will expire in 24 hours.</p>
              <p>If you didn't create this account, you can safely ignore this email.</p>
            </div>
            <div class="footer">
              <p>&copy; 2025 ODAVL Studio. All rights reserved.</p>
              <p>Autonomous Code Quality Platform</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  private getPasswordResetTemplate(name: string, resetUrl: string): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #4F46E5; color: white; padding: 20px; text-align: center; }
            .content { padding: 30px; background: #f9fafb; }
            .button { 
              display: inline-block; 
              padding: 12px 30px; 
              background: #DC2626; 
              color: white; 
              text-decoration: none; 
              border-radius: 5px;
              margin: 20px 0;
            }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>ODAVL Studio</h1>
            </div>
            <div class="content">
              <h2>Hi ${name}! 🔐</h2>
              <p>We received a request to reset your password. Click the button below to create a new password:</p>
              <p>
                <a href="${resetUrl}" class="button">Reset Password</a>
              </p>
              <p>Or copy this link: <br/><code>${resetUrl}</code></p>
              <p>This link will expire in 1 hour.</p>
              <p><strong>If you didn't request this, ignore this email.</strong> Your password will remain unchanged.</p>
            </div>
            <div class="footer">
              <p>&copy; 2025 ODAVL Studio. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  private getWelcomeTemplate(name: string): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #4F46E5; color: white; padding: 20px; text-align: center; }
            .content { padding: 30px; background: #f9fafb; }
            .feature { 
              padding: 15px; 
              margin: 10px 0; 
              background: white; 
              border-left: 4px solid #4F46E5;
            }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Welcome to ODAVL Studio!</h1>
            </div>
            <div class="content">
              <h2>Hi ${name}!</h2>
              <p>Your account is now active. Here's what you can do:</p>
              
              <div class="feature">
                <h3>🔍 ODAVL Insight</h3>
                <p>Detect code issues with 12 specialized detectors</p>
              </div>
              
              <div class="feature">
                <h3>🤖 ODAVL Autopilot</h3>
                <p>Self-healing code infrastructure with O-D-A-V-L cycle</p>
              </div>
              
              <div class="feature">
                <h3>🛡️ ODAVL Guardian</h3>
                <p>Pre-deploy testing and quality monitoring</p>
              </div>
              
              <p><strong>Get Started:</strong></p>
              <ul>
                <li>Install the VS Code extension</li>
                <li>Run your first analysis</li>
                <li>Check the dashboard for insights</li>
              </ul>
            </div>
            <div class="footer">
              <p>&copy; 2025 ODAVL Studio. All rights reserved.</p>
              <p>Need help? Contact support@odavl.com</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  private stripHtml(html: string): string {
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      return true;
    } catch (error) {
      console.error('Email service connection failed:', error);
      return false;
    }
  }
}

// Export type for use in other packages
export type { Transporter };
```

#### Step 1.4: Build Package (15 min)
```bash
cd packages/email
pnpm install
pnpm build
```

---

### Task 2: API Routes for Email Operations (2 hours)

**Objective:** Add email verification and password reset endpoints

#### Step 2.1: Verify Email Endpoint (45 min)
```typescript
// odavl-studio/insight/cloud/app/api/auth/verify-email/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@odavl-studio/auth';
import { createPrismaAdapter } from '@/lib/auth-adapter';
import { EmailService } from '@odavl-studio/email';
import { prisma } from '@/lib/prisma';

const authService = new AuthService(createPrismaAdapter(prisma));
const emailService = new EmailService({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASSWORD || '',
  },
  from: {
    name: 'ODAVL Studio',
    email: process.env.SMTP_FROM || 'noreply@odavl.com',
  },
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: 'Verification token is required' },
        { status: 400 }
      );
    }

    // Verify email with AuthService
    const result = await authService.verifyEmail(token);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    // Send welcome email
    const user = result.user;
    if (user) {
      await emailService.sendWelcomeEmail(user.email, user.name || 'User');
    }

    // Redirect to success page
    return NextResponse.redirect(new URL('/auth/verified', request.url));
  } catch (error) {
    console.error('Email verification error:', error);
    return NextResponse.json(
      { error: 'Failed to verify email' },
      { status: 500 }
    );
  }
}
```

#### Step 2.2: Request Password Reset Endpoint (45 min)
```typescript
// odavl-studio/insight/cloud/app/api/auth/request-password-reset/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@odavl-studio/auth';
import { createPrismaAdapter } from '@/lib/auth-adapter';
import { EmailService } from '@odavl-studio/email';
import { prisma } from '@/lib/prisma';

const authService = new AuthService(createPrismaAdapter(prisma));
const emailService = new EmailService({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASSWORD || '',
  },
  from: {
    name: 'ODAVL Studio',
    email: process.env.SMTP_FROM || 'noreply@odavl.com',
  },
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Generate reset token
    const result = await authService.requestPasswordReset(email);

    if (!result.success) {
      // Don't reveal if user exists (security)
      return NextResponse.json({
        message: 'If email exists, reset link will be sent',
      });
    }

    // Send reset email
    const user = result.user;
    const token = result.token;
    if (user && token) {
      await emailService.sendPasswordResetEmail(
        user.email,
        user.name || 'User',
        token,
        process.env.NEXTAUTH_URL || 'http://localhost:3001'
      );
    }

    return NextResponse.json({
      message: 'Password reset email sent',
    });
  } catch (error) {
    console.error('Password reset request error:', error);
    return NextResponse.json(
      { error: 'Failed to request password reset' },
      { status: 500 }
    );
  }
}
```

#### Step 2.3: Reset Password Endpoint (30 min)
```typescript
// odavl-studio/insight/cloud/app/api/auth/reset-password/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@odavl-studio/auth';
import { createPrismaAdapter } from '@/lib/auth-adapter';
import { prisma } from '@/lib/prisma';

const authService = new AuthService(createPrismaAdapter(prisma));

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, newPassword } = body;

    if (!token || !newPassword) {
      return NextResponse.json(
        { error: 'Token and new password are required' },
        { status: 400 }
      );
    }

    // Validate password strength
    const validation = authService.validatePassword(newPassword);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.errors.join(', ') },
        { status: 400 }
      );
    }

    // Reset password with AuthService
    const result = await authService.resetPassword(token, newPassword);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      message: 'Password reset successful',
    });
  } catch (error) {
    console.error('Password reset error:', error);
    return NextResponse.json(
      { error: 'Failed to reset password' },
      { status: 500 }
    );
  }
}
```

---

### Task 3: Update Registration to Send Verification Email (1 hour)

```typescript
// Update: odavl-studio/insight/cloud/app/api/auth/register/route.ts

import { EmailService } from '@odavl-studio/email';

const emailService = new EmailService({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASSWORD || '',
  },
  from: {
    name: 'ODAVL Studio',
    email: process.env.SMTP_FROM || 'noreply@odavl.com',
  },
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name } = body;

    // ... existing validation ...

    // Register user
    const result = await authService.register(email, password, name);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    // Send verification email
    const user = result.user;
    const token = result.verificationToken; // Add this to register response
    if (user && token) {
      await emailService.sendVerificationEmail(
        user.email,
        user.name || 'User',
        token,
        process.env.NEXTAUTH_URL || 'http://localhost:3001'
      );
    }

    return NextResponse.json({
      message: 'Registration successful. Check your email to verify.',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    // ... error handling ...
  }
}
```

---

### Task 4: Frontend Pages (2-3 hours)

#### Step 4.1: Email Verified Page (30 min)
```typescript
// odavl-studio/insight/cloud/app/auth/verified/page.tsx

export default function EmailVerifiedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="text-green-500 text-6xl mb-4">✅</div>
        <h1 className="text-3xl font-bold mb-4">Email Verified!</h1>
        <p className="text-gray-600 mb-6">
          Your email has been successfully verified. You can now sign in to your account.
        </p>
        <a
          href="/auth/login"
          className="inline-block px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          Go to Login
        </a>
      </div>
    </div>
  );
}
```

#### Step 4.2: Password Reset Request Page (45 min)
```typescript
// odavl-studio/insight/cloud/app/auth/forgot-password/page.tsx

'use client';

import { useState } from 'react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/auth/request-password-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        setSubmitted(true);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="text-blue-500 text-6xl mb-4">📧</div>
          <h1 className="text-3xl font-bold mb-4">Check Your Email</h1>
          <p className="text-gray-600">
            If an account exists with {email}, you will receive a password reset link.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold mb-6 text-center">Forgot Password</h1>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>
      </div>
    </div>
  );
}
```

#### Step 4.3: Reset Password Page (45 min)
```typescript
// odavl-studio/insight/cloud/app/reset-password/page.tsx

'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: password }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
      } else {
        setError(data.error || 'Failed to reset password');
      }
    } catch (error) {
      setError('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="text-green-500 text-6xl mb-4">✅</div>
          <h1 className="text-3xl font-bold mb-4">Password Reset!</h1>
          <p className="text-gray-600 mb-6">
            Your password has been successfully reset.
          </p>
          <a
            href="/auth/login"
            className="inline-block px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Go to Login
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold mb-6 text-center">Reset Password</h1>
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">New Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg"
              minLength={8}
              required
            />
            <p className="text-sm text-gray-500 mt-1">
              Min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char
            </p>
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>
      </div>
    </div>
  );
}
```

---

## ✅ Success Criteria

### Must Have:
- ✅ Email service package built and working
- ✅ Email verification endpoint functional
- ✅ Password reset flow complete (request + reset)
- ✅ Beautiful email templates (HTML + text fallback)
- ✅ Frontend pages for all email operations
- ✅ Registration sends verification email
- ✅ All endpoints tested locally

### Nice to Have:
- 📧 Email preview in development mode
- 🎨 Branded email templates with ODAVL logo
- 📊 Email delivery tracking
- 🔐 Rate limiting on email endpoints

---

## 🧪 Testing Plan

### Manual Tests:
1. Register new user → receive verification email
2. Click verification link → email verified
3. Login with verified account → success
4. Request password reset → receive email
5. Click reset link → reset password
6. Login with new password → success

### Automated Tests:
```bash
# Test email service
cd packages/email
pnpm test

# Test API endpoints
cd odavl-studio/insight/cloud
pnpm test:api
```

---

## 📦 Deliverables

### Code Files:
- `packages/email/` - Complete email service package
- `app/api/auth/verify-email/route.ts` - Verification endpoint
- `app/api/auth/request-password-reset/route.ts` - Reset request
- `app/api/auth/reset-password/route.ts` - Reset endpoint
- `app/auth/verified/page.tsx` - Success page
- `app/auth/forgot-password/page.tsx` - Request page
- `app/reset-password/page.tsx` - Reset page

### Documentation:
- Email service API documentation
- Email template customization guide
- SMTP configuration guide
- Testing checklist

---

## 💰 Cost

- Gmail SMTP: FREE (500 emails/day limit)
- SendGrid (optional): $15/month (40K emails)
- Mailgun (optional): $15/month (1K emails)

**Total:** $0 for development (Gmail sufficient)

---

## ⏱️ Timeline

### Day 4 (4-5 hours):
- Hour 1: Create email service package
- Hour 2: Build email templates
- Hour 3: Create API endpoints
- Hour 4: Update registration flow

### Day 5 (4-5 hours):
- Hour 1: Create frontend pages
- Hour 2: Test email verification flow
- Hour 3: Test password reset flow
- Hour 4: Documentation and cleanup

**Total:** 8-10 hours

---

## 🚀 Next Steps

After Days 4-5 complete:
- ✅ Email verification working
- ✅ Password reset functional
- ✅ Beautiful email templates
- → **Week 8:** API Security & Rate Limiting
- → **Week 9:** Monitoring & Error Tracking
- → **Week 10:** Performance Optimization

---

**Status:** Ready to implement! 🔨  
**Priority:** HIGH - Core authentication feature  
**Complexity:** MEDIUM - 2 days of focused work
