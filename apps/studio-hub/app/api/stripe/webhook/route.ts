import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { withErrorHandler, createSuccessResponse } from '@/lib/api';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export const POST = withErrorHandler(async (req: Request) => {
  const body = await req.text();
  const signature = (await headers()).get('stripe-signature')!;

  const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const { userId, orgId, plan } = session.metadata!;

        // Update organization plan (validate against Prisma Plan enum)
        const validPlan = ['FREE', 'PRO', 'ENTERPRISE'].includes(plan) ? plan : 'FREE';
        await prisma.organization.update({
          where: { id: orgId },
          data: {
            plan: validPlan as 'FREE' | 'PRO' | 'ENTERPRISE',
            stripeCustomerId: session.customer as string,
            stripeSubscriptionId: session.subscription as string,
          },
        });

        logger.success(`Subscription activated for org ${orgId}: ${plan}`);
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const org = await prisma.organization.findFirst({
          where: { stripeSubscriptionId: subscription.id },
        });

        if (org) {
          // Update subscription - plan already updated
          logger.success(`Subscription updated for org ${org.id}`);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const org = await prisma.organization.findFirst({
          where: { stripeSubscriptionId: subscription.id },
        });

        if (org) {
          // Downgrade to FREE plan
          await prisma.organization.update({
            where: { id: org.id },
            data: {
              plan: 'FREE',
              stripeSubscriptionId: null,
            },
          });

          logger.success(`Subscription canceled for org ${org.id}, downgraded to FREE`);
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        logger.success(`Payment succeeded for invoice ${invoice.id}`);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const org = await prisma.organization.findFirst({
          where: { stripeCustomerId: invoice.customer as string },
        });

        if (org) {
          // Payment failed - could downgrade to FREE or log for manual review
          logger.warn(`Payment failed for org ${org.id}`);
        }
        break;
      }

      default:
        logger.debug(`Unhandled event type: ${event.type}`);
    }

    logger.info('Webhook processed successfully', { eventType: event.type, eventId: event.id });
    return createSuccessResponse({ received: true, eventType: event.type });
}, 'POST /api/stripe/webhook');
