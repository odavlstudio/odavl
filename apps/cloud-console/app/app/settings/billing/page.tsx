/**
 * Billing Settings Page
 * Displays subscription, usage, and payment information
 */

'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

interface BillingInfo {
  tier: string;
  status: string;
  testRunsUsed: number;
  testRunsQuota: number;
  stripeCustomerId?: string;
}

export default function BillingPage() {
  const { data: session } = useSession();
  const [billing, setBilling] = useState<BillingInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBilling();
  }, []);

  const fetchBilling = async () => {
    const res = await fetch('/api/billing/info');
    if (res.ok) {
      setBilling(await res.json());
    }
    setLoading(false);
  };

  const handleUpgrade = async (tier: string) => {
    const res = await fetch('/api/billing/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tier, organizationId: 'current' }),
    });

    if (res.ok) {
      const { url } = await res.json();
      window.location.href = url;
    }
  };

  const handleManageBilling = async () => {
    const res = await fetch('/api/billing/portal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ organizationId: 'current' }),
    });

    if (res.ok) {
      const { url } = await res.json();
      window.location.href = url;
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!billing) return <div>Error loading billing info</div>;

  return (
    <div className="billing-page">
      <h1>Billing & Subscription</h1>

      <section className="current-plan">
        <h2>Current Plan: {billing.tier.toUpperCase()}</h2>
        <p>Status: {billing.status}</p>
        <p>Usage: {billing.testRunsUsed} / {billing.testRunsQuota} test runs</p>
      </section>

      <section className="upgrade-options">
        <h2>Upgrade Your Plan</h2>
        {billing.tier === 'free' && (
          <>
            <button onClick={() => handleUpgrade('pro')}>
              Upgrade to PRO ($49/month)
            </button>
            <button onClick={() => handleUpgrade('enterprise')}>
              Contact for ENTERPRISE
            </button>
          </>
        )}
        {billing.tier === 'pro' && (
          <button onClick={() => handleUpgrade('enterprise')}>
            Contact for ENTERPRISE
          </button>
        )}
      </section>

      {billing.stripeCustomerId && (
        <section className="manage-billing">
          <button onClick={handleManageBilling}>
            Manage Billing & Invoices
          </button>
        </section>
      )}
    </div>
  );
}
