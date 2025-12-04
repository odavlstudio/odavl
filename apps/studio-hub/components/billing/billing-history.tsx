'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDistanceToNow } from 'date-fns';
import { http } from '@/lib/utils/fetch';

interface Invoice {
  id: string;
  amount: number;
  status: string;
  created: number;
  invoicePdf: string;
}

export function BillingHistory({ customerId }: { customerId: string }) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    http.get(`/api/stripe/invoices?customerId=${customerId}`)
      .then((res) => res.json())
      .then((data) => {
        setInvoices(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Failed to fetch billing history:', error);
        setLoading(false);
      });
  }, [customerId]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Billing History</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="py-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
          </div>
        ) : invoices.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No invoices yet</p>
        ) : (
          <div className="space-y-4">
            {invoices.map((invoice) => (
              <div key={invoice.id} className="flex justify-between items-center border-b pb-4">
                <div>
                  <p className="font-medium">
                    ${(invoice.amount / 100).toFixed(2)}
                  </p>
                  <p className="text-sm text-gray-600">
                    {formatDistanceToNow(new Date(invoice.created * 1000), { addSuffix: true })}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <span
                    className={`text-xs px-2 py-1 rounded ${
                      invoice.status === 'paid'
                        ? 'bg-green-100 text-green-800'
                        : invoice.status === 'open'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {invoice.status}
                  </span>
                  {invoice.invoicePdf && (
                    <a
                      href={invoice.invoicePdf}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline"
                    >
                      Download
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
