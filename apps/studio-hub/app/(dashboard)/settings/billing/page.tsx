import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlanSelector } from '@/components/billing/plan-selector';
import { UsageMetrics } from '@/components/billing/usage-metrics';
import { BillingHistory } from '@/components/billing/billing-history';
import { CheckCircle, XCircle } from 'lucide-react';

// Disable static generation - requires session context
export const dynamic = 'force-dynamic';

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; canceled?: string; session_id?: string }>;
}) {
  const session = await getServerSession(authOptions);
  const params = await searchParams;
  if (!session?.user) {
    redirect('/auth/signin');
  }

  const org = await prisma.organization.findUnique({
    where: { id: session.user.orgId! },
    select: {
      plan: true,
      stripeCustomerId: true,
      stripeSubscriptionId: true,
      // subscriptionStatus and currentPeriodEnd removed - not in Organization schema
    },
  });

  if (!org) {
    redirect('/dashboard');
  }

  const plans = [
    {
      name: 'FREE',
      price: '$0',
      interval: 'forever',
      features: [
        '1,000 API calls/month',
        '2 projects',
        '3 team members',
        '50 Insight scans',
        '10 Autopilot runs',
        '20 Guardian tests',
        'Community support',
      ],
      current: org.plan === 'FREE',
    },
    {
      name: 'PRO',
      price: '$49',
      interval: 'per month',
      features: [
        '50,000 API calls/month',
        '10 projects',
        '10 team members',
        '1,000 Insight scans',
        '500 Autopilot runs',
        '500 Guardian tests',
        'Priority support',
        'Advanced analytics',
      ],
      current: org.plan === 'PRO',
    },
    {
      name: 'ENTERPRISE',
      price: 'Custom',
      interval: 'contact sales',
      features: [
        'Unlimited API calls',
        'Unlimited projects',
        'Unlimited team members',
        'Unlimited scans',
        'Dedicated support',
        'SLA guarantee',
        'Custom integrations',
        'White-label options',
      ],
      current: org.plan === 'ENTERPRISE',
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Billing & Subscription</h1>
        <p className="text-gray-600 mt-2">Manage your subscription and usage</p>
      </div>

      {params.success && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-6 w-6 text-green-600" />
              <div>
                <p className="font-semibold text-green-900">Subscription activated!</p>
                <p className="text-sm text-green-700">Your plan has been upgraded successfully.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {params.canceled && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <XCircle className="h-6 w-6 text-yellow-600" />
              <div>
                <p className="font-semibold text-yellow-900">Checkout canceled</p>
                <p className="text-sm text-yellow-700">You can upgrade anytime.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Current Plan: {org.plan}</CardTitle>
          <CardDescription>
            {/* subscriptionStatus and currentPeriodEnd removed from Organization schema */}
            {org.stripeSubscriptionId && (
              <span className="text-green-600">Active subscription</span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <UsageMetrics orgId={session.user.orgId!} plan={org.plan} />
        </CardContent>
      </Card>

      <div>
        <h2 className="text-2xl font-bold mb-4">Available Plans</h2>
        <div className="grid grid-cols-3 gap-6">
          {plans.map((plan) => (
            <PlanSelector
              key={plan.name}
              name={plan.name}
              price={plan.price}
              interval={plan.interval}
              features={plan.features}
              current={plan.current}
              hasSubscription={!!org.stripeSubscriptionId}
            />
          ))}
        </div>
      </div>

      {org.stripeCustomerId && (
        <BillingHistory customerId={org.stripeCustomerId} />
      )}
    </div>
  );
}

