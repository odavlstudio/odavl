/**
 * ODAVL Pricing Terms & Conditions
 * Legal terms specific to billing and subscription management
 */

import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pricing Terms - ODAVL Studio',
  description: 'Terms and conditions for ODAVL Studio pricing plans and billing.',
};

export default function PricingTermsPage() {
  return (
    <div className="min-h-screen pt-20 pb-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="prose prose-invert max-w-none">
          <h1>ODAVL Studio Pricing Terms</h1>
          
          <p className="text-yellow-400 font-semibold">
            ⚠️ TODO: Legal review required before production deployment
          </p>

          <h2>Trial Terms</h2>
          <ul>
            <li><strong>Duration</strong>: 14 days from account activation</li>
            <li><strong>Features</strong>: Full access to Pro plan features</li>
            <li><strong>Cancellation</strong>: No charges if cancelled before trial end</li>
            <li><strong>Auto-conversion</strong>: Converts to paid subscription unless cancelled</li>
          </ul>

          <h2>Billing Terms</h2>
          <ul>
            <li><strong>Billing Cycle</strong>: Monthly recurring subscription</li>
            <li><strong>Payment</strong>: Charged in advance via credit card</li>
            <li><strong>Currency</strong>: USD (United States Dollars)</li>
            <li><strong>Taxes</strong>: Applicable taxes added at checkout</li>
          </ul>

          <h2>Refund Policy</h2>
          <ul>
            <li><strong>Refund Period</strong>: 30 days from payment date</li>
            <li><strong>Pro-rated</strong>: Partial refunds for annual subscriptions</li>
            <li><strong>Process</strong>: Contact support@odavl.studio for refund requests</li>
          </ul>

          <h2>Plan Changes</h2>
          <ul>
            <li><strong>Upgrades</strong>: Effective immediately with pro-rated billing</li>
            <li><strong>Downgrades</strong>: Effective at next billing cycle</li>
            <li><strong>Cancellation</strong>: Service continues until end of billing period</li>
          </ul>

          <h2>Enterprise Terms</h2>
          <ul>
            <li><strong>Custom Pricing</strong>: Negotiated based on requirements</li>
            <li><strong>Minimum Term</strong>: 12-month commitment typically required</li>
            <li><strong>SLA</strong>: 99.9% uptime guarantee with service credits</li>
            <li><strong>DPA</strong>: Data Processing Agreement available upon request</li>
          </ul>

          <div className="bg-slate-800 p-6 rounded-lg mt-8">
            <h3>Contact Information</h3>
            <p>Questions about pricing or billing?</p>
            <ul className="list-none pl-0">
              <li>📧 Billing Support: <a href="mailto:billing@odavl.studio">billing@odavl.studio</a></li>
              <li>📧 Enterprise Sales: <a href="mailto:enterprise@odavl.studio">enterprise@odavl.studio</a></li>
              <li>📞 Phone: +1 (555) 123-ODAVL</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}