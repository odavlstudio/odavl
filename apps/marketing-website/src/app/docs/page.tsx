/**
 * Documentation Hub
 * Central hub for all ODAVL documentation
 */

import Link from 'next/link';
import { Metadata } from 'next';
import { docsMetadata } from '@/components/seo/Metadata';

export const metadata: Metadata = docsMetadata;

export default function DocsPage() {
  return (
    <div className="docs-hub">
      <h1>ODAVL Documentation</h1>

      <section className="docs-section">
        <h2>Getting Started</h2>
        <ul>
          <li><Link href="/docs/quickstart">5-Minute Quickstart</Link></li>
          <li><Link href="/docs/installation">Installation Guide</Link></li>
          <li><Link href="/docs/cli">CLI Reference</Link></li>
        </ul>
      </section>

      <section className="docs-section">
        <h2>Products</h2>
        <ul>
          <li><Link href="/docs/insight">ODAVL Insight</Link></li>
          <li><Link href="/docs/guardian">ODAVL Guardian</Link></li>
          <li><Link href="/docs/autopilot">ODAVL Autopilot</Link></li>
        </ul>
      </section>

      <section className="docs-section">
        <h2>Public API</h2>
        <ul>
          <li><Link href="/docs/api/authentication">Authentication</Link></li>
          <li><Link href="/docs/api/endpoints">API Endpoints</Link></li>
          <li><Link href="/docs/api/rate-limits">Rate Limits</Link></li>
        </ul>
      </section>

      <section className="docs-section">
        <h2>Advanced</h2>
        <ul>
          <li><Link href="/docs/recipes">Custom Recipes</Link></li>
          <li><Link href="/docs/guardian-testing">Writing Guardian Tests</Link></li>
          <li><Link href="/docs/billing">Billing & Usage</Link></li>
        </ul>
      </section>
    </div>
  );
}
