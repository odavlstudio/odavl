import { getRequestConfig } from 'next-intl/server';
import { notFound } from 'next/navigation';

// Supported locales
export const locales = ['en', 'ar', 'es', 'fr', 'de', 'ja', 'zh', 'pt', 'ru', 'hi'] as const;
export type Locale = (typeof locales)[number];

export default getRequestConfig(async ({ locale }: { locale?: string }) => {
  // Validate that the incoming `locale` parameter is valid
  if (!locale || !locales.includes(locale as Locale)) {
    notFound();
  }

  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default,
  };
});
