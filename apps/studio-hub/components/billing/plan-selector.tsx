'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { logger } from '@/lib/logger';
import { http } from '@/lib/utils/fetch';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface PlanSelectorProps {
  name: string;
  price: string;
  interval: string;
  features: string[];
  current: boolean;
  hasSubscription: boolean;
}

export function PlanSelector({
  name,
  price,
  interval,
  features,
  current,
  hasSubscription,
}: PlanSelectorProps) {
  const [loading, setLoading] = useState(false);

  async function handleUpgrade() {
    if (name === 'ENTERPRISE') {
      window.location.href = 'mailto:sales@odavl.studio?subject=Enterprise Plan Inquiry';
      return;
    }

    if (name === 'FREE') {
      // Would need to implement downgrade/cancel flow
      return;
    }

    setLoading(true);

    try {
      const response = await http.post('/api/stripe/checkout', { plan: name }, {
        headers: { 'Content-Type': 'application/json' },
      });

      const { url, error } = await response.json();

      if (error) {
        alert(error);
        return;
      }

      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      logger.error('Upgrade error', error as Error);
      alert('Failed to start checkout');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className={current ? 'border-blue-500 border-2' : ''}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{name}</span>
          {current && (
            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
              Current Plan
            </span>
          )}
        </CardTitle>
        <div className="mt-4">
          <span className="text-4xl font-bold">{price}</span>
          <span className="text-gray-600 ml-2">/ {interval}</span>
        </div>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3 mb-6">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start gap-2">
              <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <span className="text-sm">{feature}</span>
            </li>
          ))}
        </ul>

        <Button
          onClick={handleUpgrade}
          disabled={current || loading}
          className="w-full"
          variant={current ? 'outline' : 'default'}
        >
          {loading
            ? 'Processing...'
            : current
            ? 'Current Plan'
            : name === 'ENTERPRISE'
            ? 'Contact Sales'
            : hasSubscription
            ? 'Change Plan'
            : 'Upgrade'}
        </Button>
      </CardContent>
    </Card>
  );
}
