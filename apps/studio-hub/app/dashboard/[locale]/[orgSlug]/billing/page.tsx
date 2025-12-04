'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { PLAN_LIMITS } from '../../../../../../../packages/types/src/multi-tenant';

interface Subscription {
  plan: string;
  status: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
}

interface Invoice {
  id: string;
  number: string;
  status: string;
  amountPaid: number;
  currency: string;
  created: string;
  invoicePdf?: string;
}

export default function BillingPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const orgSlug = params?.orgSlug as string;

  const [organization, setOrganization] = useState<any>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);

  useEffect(() => {
    fetchOrganization();
  }, [orgSlug]);

  useEffect(() => {
    if (organization) {
      fetchSubscription();
      fetchInvoices();
    }
  }, [organization]);

  useEffect(() => {
    // Handle successful checkout
    const sessionId = searchParams?.get('session_id');
    if (sessionId) {
      // Refresh subscription after successful checkout
      setTimeout(() => {
        fetchSubscription();
      }, 2000);
    }
  }, [searchParams]);

  const fetchOrganization = async () => {
    try {
      const response = await fetch('/api/v1/organizations');
      const data = await response.json();
      const org = data.data.find((o: any) => o.slug === orgSlug);
      setOrganization(org);
    } catch (error) {
      console.error('Failed to fetch organization:', error);
    }
  };

  const fetchSubscription = async () => {
    if (!organization) return;

    try {
      setLoading(true);
      const response = await fetch(
        `/api/v1/organizations/${organization.id}/billing/subscription`
      );
      const data = await response.json();

      if (data.success) {
        setSubscription(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchInvoices = async () => {
    if (!organization) return;

    try {
      const response = await fetch(
        `/api/v1/organizations/${organization.id}/billing/invoices?limit=10`
      );
      const data = await response.json();

      if (data.success) {
        setInvoices(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch invoices:', error);
    }
  };

  const handleUpgrade = async (plan: string) => {
    if (!organization) return;

    try {
      setUpgrading(true);
      const response = await fetch(
        `/api/v1/organizations/${organization.id}/billing/checkout`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ plan }),
        }
      );

      const data = await response.json();

      if (data.success && data.data.url) {
        // Redirect to Stripe checkout
        window.location.href = data.data.url;
      }
    } catch (error) {
      console.error('Failed to create checkout:', error);
      alert('Failed to start upgrade process');
    } finally {
      setUpgrading(false);
    }
  };

  const handleManageBilling = async () => {
    if (!organization) return;

    try {
      const response = await fetch(
        `/api/v1/organizations/${organization.id}/billing/portal`,
        { method: 'POST' }
      );

      const data = await response.json();

      if (data.success && data.data.url) {
        window.location.href = data.data.url;
      }
    } catch (error) {
      console.error('Failed to open billing portal:', error);
      alert('Failed to open billing portal');
    }
  };

  const handleCancelSubscription = async () => {
    if (!organization || !confirm('Are you sure you want to cancel your subscription?')) {
      return;
    }

    try {
      const response = await fetch(
        `/api/v1/organizations/${organization.id}/billing/subscription`,
        { method: 'DELETE' }
      );

      const data = await response.json();

      if (data.success) {
        alert('Subscription will be canceled at the end of the billing period');
        fetchSubscription();
      }
    } catch (error) {
      console.error('Failed to cancel subscription:', error);
      alert('Failed to cancel subscription');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading billing information...</p>
        </div>
      </div>
    );
  }

  const currentPlan = organization?.plan || 'FREE';
  const planLimits = PLAN_LIMITS[currentPlan as keyof typeof PLAN_LIMITS];

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Billing & Subscription</h1>

        {/* Current Plan */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Current Plan</h2>
          <div className="flex justify-between items-center">
            <div>
              <p className="text-3xl font-bold text-blue-600">{currentPlan}</p>
              {subscription && (
                <div className="mt-2 text-sm text-gray-600">
                  <p>Status: <span className="font-medium">{subscription.status}</span></p>
                  <p>Renews: {new Date(subscription.currentPeriodEnd).toLocaleDateString()}</p>
                  {subscription.cancelAtPeriodEnd && (
                    <p className="text-red-600 font-medium">
                      Will cancel at period end
                    </p>
                  )}
                </div>
              )}
              <div className="mt-4 space-y-1 text-sm">
                <p>• {planLimits.maxMembers === -1 ? 'Unlimited' : planLimits.maxMembers} team members</p>
                <p>• {planLimits.maxProjects === -1 ? 'Unlimited' : planLimits.maxProjects} projects</p>
                <p>• {planLimits.maxApiCalls === -1 ? 'Unlimited' : planLimits.maxApiCalls.toLocaleString()} API calls/month</p>
                <p>• {planLimits.maxStorage === -1 ? 'Unlimited' : `${(planLimits.maxStorage / (1024 * 1024 * 1024))}GB`} storage</p>
              </div>
            </div>
            <div className="space-x-4">
              {organization?.stripeCustomerId && (
                <button
                  onClick={handleManageBilling}
                  className="px-6 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg"
                >
                  Manage Billing
                </button>
              )}
              {subscription && !subscription.cancelAtPeriodEnd && (
                <button
                  onClick={handleCancelSubscription}
                  className="px-6 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg"
                >
                  Cancel Subscription
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Available Plans */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-6">Available Plans</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Starter Plan */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-xl font-bold mb-2">Starter</h3>
              <p className="text-3xl font-bold text-blue-600 mb-4">
                $49<span className="text-lg text-gray-600">/month</span>
              </p>
              <ul className="space-y-2 mb-6 text-sm">
                <li>✓ 5 team members</li>
                <li>✓ 20 projects</li>
                <li>✓ 50,000 API calls/month</li>
                <li>✓ 10GB storage</li>
                <li>✓ Cloud storage</li>
                <li>✓ Email notifications</li>
                <li>✓ Priority support</li>
              </ul>
              <button
                onClick={() => handleUpgrade('STARTER')}
                disabled={currentPlan === 'STARTER' || upgrading}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {currentPlan === 'STARTER' ? 'Current Plan' : 'Upgrade'}
              </button>
            </div>

            {/* Professional Plan */}
            <div className="bg-white rounded-lg shadow-lg p-6 border-2 border-blue-600">
              <div className="bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full inline-block mb-2">
                MOST POPULAR
              </div>
              <h3 className="text-xl font-bold mb-2">Professional</h3>
              <p className="text-3xl font-bold text-blue-600 mb-4">
                $149<span className="text-lg text-gray-600">/month</span>
              </p>
              <ul className="space-y-2 mb-6 text-sm">
                <li>✓ 25 team members</li>
                <li>✓ 100 projects</li>
                <li>✓ 500,000 API calls/month</li>
                <li>✓ 100GB storage</li>
                <li>✓ Advanced analysis</li>
                <li>✓ Webhooks</li>
                <li>✓ SSO</li>
                <li>✓ Custom branding</li>
              </ul>
              <button
                onClick={() => handleUpgrade('PROFESSIONAL')}
                disabled={currentPlan === 'PROFESSIONAL' || upgrading}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {currentPlan === 'PROFESSIONAL' ? 'Current Plan' : 'Upgrade'}
              </button>
            </div>

            {/* Enterprise Plan */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-xl font-bold mb-2">Enterprise</h3>
              <p className="text-3xl font-bold text-blue-600 mb-4">Custom</p>
              <ul className="space-y-2 mb-6 text-sm">
                <li>✓ Unlimited team members</li>
                <li>✓ Unlimited projects</li>
                <li>✓ Unlimited API calls</li>
                <li>✓ Unlimited storage</li>
                <li>✓ All features</li>
                <li>✓ Dedicated support</li>
                <li>✓ SLA</li>
                <li>✓ On-premise option</li>
              </ul>
              <button
                onClick={() => window.location.href = 'mailto:sales@odavl.studio'}
                className="w-full px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg"
              >
                Contact Sales
              </button>
            </div>
          </div>
        </div>

        {/* Invoices */}
        {invoices.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Invoice History</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Invoice
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {invoices.map((invoice) => (
                    <tr key={invoice.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {invoice.number}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(invoice.created).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          invoice.status === 'paid'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {invoice.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ${(invoice.amountPaid / 100).toFixed(2)} {invoice.currency.toUpperCase()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {invoice.invoicePdf && (
                          <a
                            href={invoice.invoicePdf}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800"
                          >
                            Download PDF
                          </a>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
