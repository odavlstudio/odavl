// Enable static export for all supported locales and slugs
export function generateStaticParams() {
  const locales = ['en', 'fr', 'de', 'es', 'it', 'pt', 'ja', 'zh', 'ru'];
  const slugs = ['quickstart', 'governance'];
  const params = [];
  for (const locale of locales) {
    for (const slug of slugs) {
      params.push({ locale, slug });
    }
  }
  return params;
}
import { DocLayout } from '@/components/docs/DocLayout';
import { DocSidebar } from '@/components/docs/DocSidebar';
import { DocBreadcrumbs } from '@/components/docs/DocBreadcrumbs';
import { notFound } from 'next/navigation';

const docItems = [
  { title: 'Quick Start', href: '/docs2/quickstart' },
  { title: 'Governance', href: '/docs2/governance' },
];

const docRoutes: Record<string, { title: string; component: () => Promise<React.ComponentType> }> = {
  quickstart: {
    title: 'Quick Start',
    component: () => import('@/content/docs/quickstart.mdx').then(m => m.default),
  },
  governance: {
    title: 'Governance & Safety',
    component: () => import('@/content/docs/governance.mdx').then(m => m.default),
  },
};

export default async function DocsPage({ params }: { readonly params: Promise<{ readonly slug: string }> }) {
  const { slug } = await params;

  const docRoute = docRoutes[slug];
  if (!docRoute) notFound();

  const Component = await docRoute.component();

  const breadcrumbs = [
    { title: 'Home', href: '/' },
    { title: 'Documentation', href: '/docs2' },
    { title: docRoute.title },
  ];

  return (
    <DocLayout
      sidebar={<DocSidebar items={docItems} />}
      breadcrumbs={<DocBreadcrumbs items={breadcrumbs} />}
    >
      <Component />
    </DocLayout>
  );
}
