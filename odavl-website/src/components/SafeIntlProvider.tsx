'use client';

import { NextIntlClientProvider, IntlError, IntlErrorCode } from 'next-intl';
import { ReactNode } from 'react';

type SafeIntlProviderProps = {
  children: ReactNode;
  messages: Record<string, unknown>;
  locale: string;
};

export default function SafeIntlProvider({ 
  children, 
  messages, 
  locale 
}: SafeIntlProviderProps) {
  return (
    <NextIntlClientProvider 
      messages={messages}
      locale={locale}
      timeZone="UTC"
      onError={(error: IntlError) => {
        if (error.code === IntlErrorCode.MISSING_MESSAGE) {
          if (process.env.NODE_ENV !== 'production') {
            console.warn('🌐 MISSING_MESSAGE:', error.message);
          }
          // Return key instead of crashing - error handler will prevent crash
        } else {
          console.error('🚨 i18n Error:', error);
        }
      }}
    >
      {children}
    </NextIntlClientProvider>
  );
}