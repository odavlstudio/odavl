import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import Stripe from 'stripe';
import { logger } from '@/lib/logger';
import {
  withErrorHandler,
  createSuccessResponse,
  ApiErrors,
} from '@/lib/api';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

export const GET = withErrorHandler(async (req: Request) => {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return ApiErrors.unauthorized('Authentication required');
  }

  const { searchParams } = new URL(req.url);
  const customerId = searchParams.get('customerId');

  if (!customerId) {
    return ApiErrors.badRequest('Customer ID required');
  }

  const invoices = await stripe.invoices.list({
    customer: customerId,
    limit: 12,
  });

  const invoiceData = invoices.data.map((invoice) => ({
    id: invoice.id,
    amount: invoice.amount_paid,
    status: invoice.status,
    created: invoice.created,
    invoicePdf: invoice.invoice_pdf,
  }));

  logger.info('Invoices fetched', { customerId, count: invoiceData.length });
  return createSuccessResponse({ invoices: invoiceData, count: invoiceData.length });
}, 'GET /api/stripe/invoices');

