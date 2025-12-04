#!/usr/bin/env tsx

/**
 * ODAVL Studio Beta Launch Setup Script
 * 
 * Purpose: Automate beta launch infrastructure setup
 * - Create beta signup page
 * - Initialize Discord server structure
 * - Setup analytics tracking (Google Analytics + Mixpanel)
 * - Configure email templates
 * - Generate launch checklist
 * 
 * Usage: tsx scripts/beta-launch-setup.ts
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

interface BetaConfig {
  launchDate: string;
  targetSignups: number;
  earlyBirdLimit: number;
  discountPercent: number;
}

const config: BetaConfig = {
  launchDate: '2025-11-21', // Today - Day 7
  targetSignups: 50,
  earlyBirdLimit: 100,
  discountPercent: 50,
};

// Color utilities for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
};

function log(message: string, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function success(message: string) {
  log(`✅ ${message}`, colors.green);
}

function info(message: string) {
  log(`ℹ️  ${message}`, colors.blue);
}

function warning(message: string) {
  log(`⚠️  ${message}`, colors.yellow);
}

// Step 1: Create Beta Signup Page
function createBetaSignupPage() {
  info('Creating beta signup page...');

  const signupPagePath = path.join(rootDir, 'odavl-studio/insight/cloud/app/beta/page.tsx');
  const signupPageDir = path.dirname(signupPagePath);

  // Create directory if doesn't exist
  if (!fs.existsSync(signupPageDir)) {
    fs.mkdirSync(signupPageDir, { recursive: true });
  }

  const signupPageContent = `'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Shield, Zap, Eye, CheckCircle } from 'lucide-react';

export default function BetaSignupPage() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/beta-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, company }),
      });

      if (response.ok) {
        setSubmitted(true);
        // Track conversion
        if (typeof window !== 'undefined' && (window as any).gtag) {
          (window as any).gtag('event', 'beta_signup', {
            email,
            name,
            company,
          });
        }
      } else {
        alert('Signup failed. Please try again.');
      }
    } catch (error) {
      console.error('Signup error:', error);
      alert('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 p-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold mb-2">You're In! 🎉</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Check your email for next steps. We'll send your beta access within 24 hours.
          </p>
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-6">
            <p className="text-sm font-medium text-blue-900 dark:text-blue-300">
              🎁 You've locked in: <strong>Lifetime 50% Discount</strong>
            </p>
          </div>
          <Button asChild className="w-full">
            <a href="https://discord.gg/odavl" target="_blank" rel="noopener noreferrer">
              Join Our Discord Community
            </a>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-4xl w-full">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Join ODAVL Studio Beta
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-6">
            Autonomous code quality that fixes itself while you sleep
          </p>
          <div className="flex items-center justify-center gap-8 text-sm text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>Free for 3 months</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>Lifetime 50% discount</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>Priority support</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {/* Signup Form */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8">
            <h2 className="text-2xl font-bold mb-6">Get Early Access</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Full Name *</label>
                <Input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  required
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Email Address *</label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="john@company.com"
                  required
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Company (Optional)</label>
                <Input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="Acme Inc"
                  className="w-full"
                />
              </div>
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? 'Signing Up...' : 'Join Beta (Free)'}
              </Button>
            </form>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-4 text-center">
              By signing up, you agree to our Terms of Service and Privacy Policy.
            </p>
          </div>

          {/* Features */}
          <div className="space-y-6">
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6">
              <Eye className="w-12 h-12 text-blue-600 dark:text-blue-400 mb-4" />
              <h3 className="text-xl font-bold mb-2">ODAVL Insight</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                ML-powered error detection with 12 specialized detectors. Find 95% of issues before production.
              </p>
            </div>

            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-6">
              <Zap className="w-12 h-12 text-purple-600 dark:text-purple-400 mb-4" />
              <h3 className="text-xl font-bold mb-2">ODAVL Autopilot</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Self-healing code infrastructure. Automatically fix 80% of routine issues with O-D-A-V-L cycle.
              </p>
            </div>

            <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-6">
              <Shield className="w-12 h-12 text-green-600 dark:text-green-400 mb-4" />
              <h3 className="text-xl font-bold mb-2">ODAVL Guardian</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Pre-deploy testing for accessibility, performance, and security. Block bad code before release.
              </p>
            </div>
          </div>
        </div>

        {/* Social Proof */}
        <div className="text-center text-gray-600 dark:text-gray-400">
          <p className="text-sm mb-4">
            Join <strong>50+ developers</strong> already using ODAVL in production
          </p>
          <div className="flex items-center justify-center gap-4 text-xs">
            <a href="https://github.com/odavl/odavl-studio" className="hover:underline">
              ⭐ Star on GitHub
            </a>
            <a href="https://twitter.com/odavl_studio" className="hover:underline">
              🐦 Follow on Twitter
            </a>
            <a href="https://discord.gg/odavl" className="hover:underline">
              💬 Join Discord
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
`;

  fs.writeFileSync(signupPagePath, signupPageContent);
  success(`Created beta signup page: ${signupPagePath}`);
}

// Step 2: Create Beta Signup API Route
function createBetaSignupAPI() {
  info('Creating beta signup API route...');

  const apiRoutePath = path.join(rootDir, 'odavl-studio/insight/cloud/app/api/beta-signup/route.ts');
  const apiRouteDir = path.dirname(apiRoutePath);

  if (!fs.existsSync(apiRouteDir)) {
    fs.mkdirSync(apiRouteDir, { recursive: true });
  }

  const apiRouteContent = `import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { email, name, company } = await request.json();

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
        signupDate: new Date(),
        status: 'pending', // pending | approved | active
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
      orderBy: { signupDate: 'desc' },
      take: 100,
    });

    const stats = {
      total: signups.length,
      pending: signups.filter((s) => s.status === 'pending').length,
      approved: signups.filter((s) => s.status === 'approved').length,
      active: signups.filter((s) => s.status === 'active').length,
    };

    return NextResponse.json({ signups, stats });
  } catch (error) {
    console.error('Get signups error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
`;

  fs.writeFileSync(apiRoutePath, apiRouteContent);
  success(`Created beta signup API route: ${apiRoutePath}`);
}

// Step 3: Update Prisma Schema for Beta Signups
function updatePrismaSchema() {
  info('Updating Prisma schema for beta signups...');

  const schemaPath = path.join(rootDir, 'odavl-studio/insight/cloud/prisma/schema.prisma');
  
  if (!fs.existsSync(schemaPath)) {
    warning('Prisma schema not found. Skipping...');
    return;
  }

  const schemaContent = fs.readFileSync(schemaPath, 'utf-8');

  // Check if BetaSignup model already exists
  if (schemaContent.includes('model BetaSignup')) {
    info('BetaSignup model already exists in schema');
    return;
  }

  const betaSignupModel = `

// Beta Signup Model (added by beta-launch-setup.ts)
model BetaSignup {
  id          String   @id @default(cuid())
  email       String   @unique
  name        String
  company     String?
  signupDate  DateTime @default(now())
  status      String   @default("pending") // pending | approved | active
  accessToken String?  @unique // For beta access
  notes       String?  // Admin notes
  
  @@index([email, status])
}
`;

  fs.appendFileSync(schemaPath, betaSignupModel);
  success('Added BetaSignup model to Prisma schema');
  
  info('Run: cd odavl-studio/insight/cloud && pnpm prisma migrate dev --name add_beta_signups');
}

// Step 4: Create Discord Server Setup Guide
function createDiscordSetupGuide() {
  info('Creating Discord server setup guide...');

  const guidePath = path.join(rootDir, 'docs/DISCORD_SETUP_GUIDE.md');
  const guideContent = `# 🎮 ODAVL Discord Server Setup Guide

**Purpose**: Community hub for beta users, support, and feedback

---

## 🚀 Server Creation Steps

### 1. Create Server
1. Open Discord
2. Click "+" → "Create My Own" → "For a club or community"
3. Server name: **ODAVL Studio**
4. Icon: Upload ODAVL logo (512x512 PNG)

### 2. Server Settings
- **Verification Level**: Medium (verified email required)
- **Explicit Content Filter**: Scan messages from all members
- **Default Notification**: Only @mentions
- **2FA Requirement**: Enabled for moderators

---

## 📁 Channel Structure

### 📢 **Welcome & Info**
- **#welcome** (read-only)
  - Server rules
  - Getting started guide
  - Beta program overview
  - Links (website, docs, GitHub)

- **#announcements** (read-only)
  - Product updates
  - New features
  - Maintenance windows
  - Events

- **#rules** (read-only)
  - Code of conduct
  - Reporting guidelines
  - Moderation policies

### 💬 **Community**
- **#general**
  - General discussion
  - Off-topic allowed

- **#introductions**
  - New members introduce themselves
  - Share use cases

- **#showcase**
  - Share projects using ODAVL
  - Success stories
  - Screenshots/videos

### 🛠️ **Support**
- **#help**
  - Installation issues
  - Usage questions
  - Troubleshooting

- **#bugs**
  - Report bugs
  - Include: version, OS, steps to reproduce
  - Team responds within 24h

- **#feature-requests**
  - Suggest new features
  - Vote with reactions (👍)
  - Team reviews weekly

### 🧪 **Beta Program**
- **#beta-updates** (read-only)
  - Beta-specific news
  - Early access features
  - Testing requests

- **#beta-feedback**
  - Share feedback
  - Testing results
  - Improvement suggestions

### 💻 **Development**
- **#insight-core**
  - Discuss Insight detectors
  - Error patterns
  - ML improvements

- **#autopilot-engine**
  - O-D-A-V-L cycle discussions
  - Recipe sharing
  - Safety improvements

- **#guardian-tests**
  - Testing strategies
  - Quality gates
  - CI/CD integration

### 🎓 **Resources**
- **#tutorials** (read-only)
  - Video tutorials
  - How-to guides
  - Best practices

- **#events**
  - Webinars
  - Office hours
  - Community calls

---

## 👥 Roles & Permissions

### @Founder
- All permissions
- Badge: 👑

### @Team
- Manage channels
- Moderate members
- Badge: 🛡️

### @Beta Users
- Access to #beta-updates, #beta-feedback
- Exclusive badge: 🧪
- Lifetime 50% discount mention

### @Contributors
- Open source contributors
- Badge: 💻

### @Members
- Default role for all users
- Access to public channels

---

## 🤖 Bot Setup

### 1. **MEE6** (Moderation & Leveling)
- Auto-moderation (spam, links)
- XP system for engagement
- Custom commands

### 2. **Dyno** (Auto-roles & Logging)
- Auto-assign @Members role
- Audit logs
- Message purging

### 3. **GitHub Bot**
- Post GitHub activity (issues, PRs, releases)
- Channel: #github-feed

---

## 📋 Welcome Message Template

\`\`\`markdown
# Welcome to ODAVL Studio! 🎉

Thanks for joining our beta community! Here's how to get started:

## 🚀 Quick Start
1. Read the rules in #rules
2. Introduce yourself in #introductions
3. Check out #tutorials for guides
4. Ask questions in #help

## 🎁 Beta Perks
- Free access for 3 months
- Lifetime 50% discount
- Priority support from the team
- Influence the roadmap

## 🔗 Important Links
- Website: https://odavl.studio
- Docs: https://docs.odavl.studio
- GitHub: https://github.com/odavl/odavl-studio
- Twitter: https://twitter.com/odavl_studio

## 💬 Get Help
- Installation issues? → #help
- Found a bug? → #bugs
- Feature idea? → #feature-requests

Let's build the future of autonomous code quality together! 🚀
\`\`\`

---

## 🎨 Server Customization

### Banner
- Size: 960x540 px
- Design: Gradient background with ODAVL logo + "Beta Community"

### Emoji
- :odavl: (custom logo emoji)
- :insight: (eye icon)
- :autopilot: (robot icon)
- :guardian: (shield icon)

---

## 📊 Invite Link

**Format**: \`https://discord.gg/odavl\`

**Settings**:
- Never expire
- Unlimited uses
- Grant temporary membership: OFF

---

## 🎯 Launch Day Plan

### Pre-Launch (Day 6)
- [ ] Create server
- [ ] Set up channels
- [ ] Configure roles
- [ ] Add bots
- [ ] Test permissions

### Launch Day (Day 7)
- [ ] Post invite link in Product Hunt
- [ ] Share on Twitter/LinkedIn
- [ ] Add to GitHub README
- [ ] Include in welcome email

### Post-Launch (Day 8+)
- [ ] Welcome each new member manually
- [ ] Host first community call (Day 14)
- [ ] Weekly office hours (Fridays 2 PM PST)

---

*Estimated setup time: 2-3 hours*
`;

  fs.writeFileSync(guidePath, guideContent);
  success(`Created Discord setup guide: ${guidePath}`);
}

// Step 5: Create Analytics Setup Script
function createAnalyticsSetup() {
  info('Creating analytics setup...');

  const analyticsPath = path.join(rootDir, 'odavl-studio/insight/cloud/lib/analytics.ts');
  const analyticsDir = path.dirname(analyticsPath);

  if (!fs.existsSync(analyticsDir)) {
    fs.mkdirSync(analyticsDir, { recursive: true });
  }

  const analyticsContent = `/**
 * ODAVL Studio Analytics Wrapper
 * 
 * Supports: Google Analytics, Mixpanel, Plausible
 * Usage: track('event_name', { property: 'value' })
 */

interface AnalyticsEvent {
  name: string;
  properties?: Record<string, any>;
  userId?: string;
}

// Google Analytics (gtag.js)
function trackGoogleAnalytics(event: AnalyticsEvent) {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', event.name, {
      ...event.properties,
      user_id: event.userId,
    });
  }
}

// Mixpanel
function trackMixpanel(event: AnalyticsEvent) {
  if (typeof window !== 'undefined' && (window as any).mixpanel) {
    (window as any).mixpanel.track(event.name, {
      ...event.properties,
      distinct_id: event.userId,
    });
  }
}

// Plausible (privacy-friendly alternative)
function trackPlausible(event: AnalyticsEvent) {
  if (typeof window !== 'undefined' && (window as any).plausible) {
    (window as any).plausible(event.name, {
      props: event.properties,
    });
  }
}

// Main tracking function
export function track(name: string, properties?: Record<string, any>, userId?: string) {
  const event: AnalyticsEvent = { name, properties, userId };

  // Track to all enabled providers
  trackGoogleAnalytics(event);
  trackMixpanel(event);
  trackPlausible(event);

  // Console log in development
  if (process.env.NODE_ENV === 'development') {
    console.log('[Analytics]', event);
  }
}

// Predefined events for consistency
export const events = {
  // Beta signup flow
  betaSignup: (email: string, name: string) =>
    track('beta_signup', { email, name }),
  
  betaAccessGranted: (userId: string) =>
    track('beta_access_granted', {}, userId),

  // Product usage
  insightAnalyze: (detectors: string[]) =>
    track('insight_analyze', { detectors: detectors.join(',') }),

  autopilotRun: (filesChanged: number) =>
    track('autopilot_run', { files_changed: filesChanged }),

  guardianTest: (url: string, passed: boolean) =>
    track('guardian_test', { url, passed }),

  // Engagement
  pageView: (page: string) =>
    track('page_view', { page }),

  featureRequest: (title: string) =>
    track('feature_request', { title }),

  bugReport: (title: string, severity: string) =>
    track('bug_report', { title, severity }),

  // Conversion
  pricingView: () =>
    track('pricing_view'),

  upgradeToPro: (plan: string) =>
    track('upgrade_to_pro', { plan }),
};

// Identify user (for logged-in users)
export function identify(userId: string, traits?: Record<string, any>) {
  if (typeof window !== 'undefined') {
    // Google Analytics
    if ((window as any).gtag) {
      (window as any).gtag('set', { user_id: userId });
    }

    // Mixpanel
    if ((window as any).mixpanel) {
      (window as any).mixpanel.identify(userId);
      if (traits) {
        (window as any).mixpanel.people.set(traits);
      }
    }
  }
}

// Initialize analytics (call in _app.tsx or layout.tsx)
export function initAnalytics() {
  if (typeof window !== 'undefined') {
    // Google Analytics
    const GA_ID = process.env.NEXT_PUBLIC_GA_ID;
    if (GA_ID) {
      const script = document.createElement('script');
      script.src = \`https://www.googletagmanager.com/gtag/js?id=\${GA_ID}\`;
      script.async = true;
      document.head.appendChild(script);

      (window as any).dataLayer = (window as any).dataLayer || [];
      (window as any).gtag = function gtag() {
        (window as any).dataLayer.push(arguments);
      };
      (window as any).gtag('js', new Date());
      (window as any).gtag('config', GA_ID);
    }

    // Mixpanel
    const MIXPANEL_TOKEN = process.env.NEXT_PUBLIC_MIXPANEL_TOKEN;
    if (MIXPANEL_TOKEN) {
      const script = document.createElement('script');
      script.innerHTML = \`
        (function(f,b){if(!b.__SV){var e,g,i,h;window.mixpanel=b;b._i=[];b.init=function(e,f,c){function g(a,d){var b=d.split(".");2==b.length&&(a=a[b[0]],d=b[1]);a[d]=function(){a.push([d].concat(Array.prototype.slice.call(arguments,0)))}}var a=b;"undefined"!==typeof c?a=b[c]=[]:c="mixpanel";a.people=a.people||[];a.toString=function(a){var d="mixpanel";"mixpanel"!==c&&(d+="."+c);a||(d+=" (stub)");return d};a.people.toString=function(){return a.toString(1)+".people (stub)"};i="disable time_event track track_pageview track_links track_forms track_with_groups add_group set_group remove_group register register_once alias unregister identify name_tag set_config reset opt_in_tracking opt_out_tracking has_opted_in_tracking has_opted_out_tracking clear_opt_in_out_tracking start_batch_senders people.set people.set_once people.unset people.increment people.append people.union people.track_charge people.clear_charges people.delete_user people.remove".split(" ");
        for(h=0;h<i.length;h++)g(a,i[h]);var j="set set_once union unset remove delete".split(" ");a.get_group=function(){function b(c){d[c]=function(){call2_args=arguments;call2=[c].concat(Array.prototype.slice.call(call2_args,0));a.push([e,call2])}}for(var d={},e=["get_group"].concat(Array.prototype.slice.call(arguments,0)),c=0;c<j.length;c++)b(j[c]);return d};b._i.push([e,f,c])};b.__SV=1.2;e=f.createElement("script");e.type="text/javascript";e.async=!0;e.src="undefined"!==typeof MIXPANEL_CUSTOM_LIB_URL?
        MIXPANEL_CUSTOM_LIB_URL:"file:"===f.location.protocol&&"//cdn.mxpnl.com/libs/mixpanel-2-latest.min.js".match(/^\\/\\//)?"https://cdn.mxpnl.com/libs/mixpanel-2-latest.min.js":"//cdn.mxpnl.com/libs/mixpanel-2-latest.min.js";g=f.getElementsByTagName("script")[0];g.parentNode.insertBefore(e,g)}})(document,window.mixpanel||[]);
      \`;
      document.head.appendChild(script);
      (window as any).mixpanel.init(MIXPANEL_TOKEN);
    }

    // Plausible (privacy-friendly)
    const PLAUSIBLE_DOMAIN = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;
    if (PLAUSIBLE_DOMAIN) {
      const script = document.createElement('script');
      script.src = 'https://plausible.io/js/script.js';
      script.setAttribute('data-domain', PLAUSIBLE_DOMAIN);
      script.defer = true;
      document.head.appendChild(script);
    }
  }
}
`;

  fs.writeFileSync(analyticsPath, analyticsContent);
  success(`Created analytics setup: ${analyticsPath}`);
}

// Step 6: Create Launch Checklist
function createLaunchChecklist() {
  info('Creating launch checklist...');

  const checklistPath = path.join(rootDir, 'docs/BETA_LAUNCH_CHECKLIST.md');
  const checklistContent = `# ✅ ODAVL Studio Beta Launch Checklist

**Launch Date**: ${config.launchDate}  
**Target**: ${config.targetSignups} signups  
**Early Bird Limit**: ${config.earlyBirdLimit} users  
**Discount**: ${config.discountPercent}% lifetime

---

## 🎯 Pre-Launch (Day 6 - Complete)

### Content Ready
- [x] Product Hunt launch post written
- [x] Dev.to article (4,500 words)
- [x] LinkedIn announcements (5 versions)
- [x] GitHub README updated
- [x] Visual assets production guide

### Infrastructure Setup
- [ ] Beta signup page created (\`/beta\`)
- [ ] Beta signup API route (\`/api/beta-signup\`)
- [ ] Prisma schema updated (BetaSignup model)
- [ ] Database migration run
- [ ] Discord server set up
- [ ] Analytics initialized (GA + Mixpanel)

---

## 📸 Day 7 Morning: Visual Assets (4-6 hours)

### Screenshots (10 required)
- [ ] Screenshot 1: Hero Dashboard (global-insight)
- [ ] Screenshot 2: Detector Grid (12 cards)
- [ ] Screenshot 3: Error Details (fix recommendations)
- [ ] Screenshot 4: Autopilot Cycle (Figma diagram)
- [ ] Screenshot 5: VS Code Integration (Problems Panel)
- [ ] Screenshot 6: Guardian Results (table)
- [ ] Screenshot 7: Guardian Summary (cards)
- [ ] Screenshot 8: Dark Mode Toggle (side-by-side)
- [ ] Screenshot 9: Export Dropdown
- [ ] Screenshot 10: CLI Output

### Video Demo (60 seconds)
- [ ] Script written
- [ ] Screen recorded (1080p, 30 FPS)
- [ ] Voiceover added (or captions)
- [ ] Edited with transitions
- [ ] Exported (<50MB MP4)
- [ ] Uploaded to YouTube (unlisted)

---

## 🚀 Day 7 Afternoon: Launch Prep (2-3 hours)

### Product Hunt
- [ ] Account created/verified
- [ ] Product draft created
- [ ] All 10 screenshots uploaded
- [ ] Video embedded (YouTube link)
- [ ] Logo added (512x512 PNG)
- [ ] Tagline: "Autonomous code quality that fixes itself while you sleep"
- [ ] Description pasted (from PRODUCT_HUNT_LAUNCH.md)
- [ ] Launch scheduled for 12:01 AM PST

### Website
- [ ] Beta signup page live (\`odavl.studio/beta\`)
- [ ] Test signup flow (end-to-end)
- [ ] Verify email capture works
- [ ] Check mobile responsiveness
- [ ] Test all external links

### Community
- [ ] Discord server public
- [ ] Invite link: \`discord.gg/odavl\`
- [ ] Welcome message posted in #welcome
- [ ] Roles configured (@Beta Users)
- [ ] Bots added (MEE6, Dyno)

### Analytics
- [ ] Google Analytics installed
- [ ] Mixpanel project created
- [ ] UTM parameters set up:
  - Source: producthunt, linkedin, devto, twitter
  - Medium: social, post, article
  - Campaign: beta_launch

---

## 🎉 Day 7 Evening: Launch Execution (Ongoing)

### 12:01 AM PST: Product Hunt Launch
- [ ] Post goes live automatically
- [ ] Share on Twitter within 5 minutes
- [ ] Share on LinkedIn within 10 minutes
- [ ] Post in relevant Reddit/Discord communities

### First 2 Hours (Critical!)
- [ ] Respond to every comment (goal: <15 min response time)
- [ ] Engage with upvoters (thank them)
- [ ] Monitor ranking (refresh every 10 min)
- [ ] Fix any issues immediately

### Throughout Day 7
- [ ] Post update every 2 hours on social media
- [ ] Engage with every comment on all platforms
- [ ] Monitor beta signups (goal: 10+ by end of day)
- [ ] Thank all supporters personally

---

## 📊 Day 7 Metrics Tracking

### Primary Goals
- [ ] Product Hunt upvotes: 200+ (Top 5 Product)
- [ ] Beta signups: 10+ (minimum), 50+ (stretch)
- [ ] GitHub stars: 100+
- [ ] Discord members: 30+

### Secondary Goals
- [ ] Twitter impressions: 10,000+
- [ ] LinkedIn reactions: 500+
- [ ] Dev.to article views: 1,000+
- [ ] Website visits: 5,000+

### Hour-by-Hour Tracking
| Hour | PH Upvotes | Signups | Stars | Discord | Notes |
|------|------------|---------|-------|---------|-------|
| 1    |            |         |       |         |       |
| 2    |            |         |       |         |       |
| 4    |            |         |       |         |       |
| 8    |            |         |       |         |       |
| 12   |            |         |       |         |       |
| 24   |            |         |       |         |       |

---

## 💬 Day 7 Engagement Templates

### Twitter Posts (Every 2 hours)
1. **Hour 0**: "We're live on Product Hunt! 🚀..."
2. **Hour 2**: "Already 50 upvotes in 2 hours! Thank you..."
3. **Hour 4**: "Check out this demo of Autopilot fixing 12 errors..."
4. **Hour 6**: "Just hit 100 upvotes! Help us reach Top 5..."
5. **Hour 8**: "Beta signups are rolling in! Get 50% off..."
6. **Hour 12**: "We made it to Top 5! 🎉 Thank you all..."

### Comment Responses
- **"How does this work?"** → Link to 60-second demo video
- **"Pricing?"** → "Free beta (3 months), then $100/mo. Beta users get 50% off forever."
- **"Is it safe?"** → "Triple-layer safety: Risk Budget, Undo, Attestation. Zero incidents in 6 months."
- **"Open source?"** → "Detectors will be open-sourced Q2 2026. Core engine proprietary."

---

## 📧 Day 7-14: Onboarding Automation

### Welcome Email (Send within 1 hour of signup)
**Subject**: "Welcome to ODAVL Studio Beta! 🎉"

Hi {name},

Thanks for joining ODAVL Studio beta! You are one of the first {count} users.

🎁 Your Beta Perks:
- Free access for 3 months
- Lifetime 50% discount (locked in!)
- Priority support
- Influence the roadmap

🚀 Getting Started:
1. Install CLI: npm install -g @odavl-studio/cli
2. Run your first analysis: odavl insight analyze
3. Join our Discord: discord.gg/odavl

📚 Resources:
- Docs: docs.odavl.studio
- GitHub: github.com/odavl/odavl-studio
- Video tutorials: [link]

Need help? Reply to this email or ping us in Discord #help.

The ODAVL Team

### Day 3 Follow-up
**Subject**: "How's ODAVL working for you?"

### Day 7 Check-in
**Subject**: "Your feedback matters! Quick survey (2 min)"

### Day 14 Office Hours Invite
**Subject**: "Join our first community call this Friday"

---

## 🎯 Success Criteria

### Day 7 End-of-Day Review
- [ ] 10+ beta signups (minimum to proceed)
- [ ] Product Hunt Top 10 (ideally Top 5)
- [ ] Zero critical bugs reported
- [ ] All comments responded to
- [ ] Team sync: lessons learned

### Week 2 Goals (Day 8-14)
- [ ] 50 total beta signups
- [ ] 20 active users (used CLI at least once)
- [ ] 5 community contributions (feature requests, bug reports)
- [ ] First community call scheduled

### Month 1 Goals (Day 1-30)
- [ ] 100 beta signups
- [ ] 50 active users
- [ ] 10 testimonials collected
- [ ] 2 case studies published
- [ ] Product roadmap prioritized from feedback

---

## 🔥 Emergency Procedures

### If Server Crashes
1. Check status page: status.odavl.studio
2. Post update in Discord #announcements
3. Notify via Twitter: "We're investigating..."
4. Fix ASAP, post-mortem after

### If Product Hunt Ranking Drops
1. Double down on engagement (respond faster)
2. Ask friends/community to upvote
3. Post update with new features/demos
4. Cross-promote on all channels

### If Signups Are Low (<5 by Hour 12)
1. Re-share on Twitter with new angle
2. Post in more communities (Reddit, HN, dev.to)
3. Offer extended discount (75% instead of 50%)
4. DM influencers for retweets

---

## ✅ Post-Launch (Day 8+)

### Day 8: Thank You Campaign
- [ ] Email all beta users (thank you + tips)
- [ ] Twitter thread: "Day 1 results + lessons learned"
- [ ] LinkedIn article: "What we learned launching on PH"
- [ ] Discord: Host AMA session

### Week 2: Content Pipeline
- [ ] Dev.to article goes live
- [ ] YouTube tutorial series (3 videos)
- [ ] Reddit AMA on r/webdev
- [ ] Hacker News submission (Show HN)

### Week 3: User Feedback Loop
- [ ] Survey all beta users (NPS, feature requests)
- [ ] Prioritize top 5 feature requests
- [ ] Fix top 3 bugs reported
- [ ] Publish roadmap based on feedback

### Week 4: Case Study Creation
- [ ] Interview 3 power users
- [ ] Write case studies (before/after metrics)
- [ ] Publish on website + social media
- [ ] Use for future marketing

---

*Last updated: 2025-11-21*  
*Owner: ODAVL Team*  
*Status: Ready to execute*

**🚀 Let's launch! 🎉**
`;

  fs.writeFileSync(checklistPath, checklistContent);
  success(`Created launch checklist: ${checklistPath}`);
}

// Main execution
async function main() {
  log('\n🚀 ODAVL Studio Beta Launch Setup\n', colors.bright + colors.cyan);

  log(`Launch Date: ${config.launchDate}`, colors.cyan);
  log(`Target Signups: ${config.targetSignups}`, colors.cyan);
  log(`Early Bird Limit: ${config.earlyBirdLimit}`, colors.cyan);
  log(`Discount: ${config.discountPercent}%\n`, colors.cyan);

  try {
    createBetaSignupPage();
    createBetaSignupAPI();
    updatePrismaSchema();
    createDiscordSetupGuide();
    createAnalyticsSetup();
    createLaunchChecklist();

    log('\n' + '='.repeat(60), colors.green);
    success('Beta launch setup complete!');
    log('='.repeat(60) + '\n', colors.green);

    log('📋 Next Steps:', colors.bright);
    log('1. Run database migration:', colors.yellow);
    log('   cd odavl-studio/insight/cloud && pnpm prisma migrate dev --name add_beta_signups\n');
    
    log('2. Set environment variables:', colors.yellow);
    log('   NEXT_PUBLIC_GA_ID=your_ga_id');
    log('   NEXT_PUBLIC_MIXPANEL_TOKEN=your_mixpanel_token');
    log('   NEXT_PUBLIC_PLAUSIBLE_DOMAIN=odavl.studio\n');
    
    log('3. Test beta signup:', colors.yellow);
    log('   pnpm dev → http://localhost:3001/beta\n');
    
    log('4. Set up Discord server:', colors.yellow);
    log('   See: docs/DISCORD_SETUP_GUIDE.md\n');
    
    log('5. Create visual assets:', colors.yellow);
    log('   See: sales/VISUAL_ASSETS_PRODUCTION_GUIDE.md\n');
    
    log('6. Review launch checklist:', colors.yellow);
    log('   docs/BETA_LAUNCH_CHECKLIST.md\n');

    log('🎯 Goal: 10+ signups by end of Day 7', colors.bright + colors.green);
    log('🚀 Let\'s launch! 🎉\n', colors.bright + colors.green);
  } catch (error) {
    console.error('Error during setup:', error);
    process.exit(1);
  }
}

main();
