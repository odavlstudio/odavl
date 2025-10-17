// Enable static export for all supported locales
export function generateStaticParams() {
  return [
    { locale: 'en' },
    { locale: 'fr' },
    { locale: 'de' },
    { locale: 'es' },
    { locale: 'it' },
    { locale: 'pt' },
    { locale: 'ja' },
    { locale: 'zh' },
    { locale: 'ru' },
  ];
}
import { redirect } from 'next/navigation';

export default function DocsIndex() {
  redirect('/docs/quickstart');
}
