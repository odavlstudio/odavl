// ODAVL-WAVE-X6-INJECT: Language Switcher Component - Unified UI for 10 Locales
// @odavl-governance: GLOBALIZATION-SAFE mode active
'use client';

import { useLocale } from 'next-intl';
import { supportedLocales, getLocaleConfig } from './locales.config';

interface LanguageSwitcherProps {
  className?: string;
  showFlags?: boolean;
}

export function LanguageSwitcher({ className = '', showFlags = true }: LanguageSwitcherProps) {
  const currentLocale = useLocale();
  const currentConfig = getLocaleConfig(currentLocale);

  const handleLocaleChange = (newLocale: string) => {
    const url = new URL(window.location.href);
    const pathSegments = url.pathname.split('/');
    pathSegments[1] = newLocale; // Replace first segment (current locale)
    window.location.href = url.origin + pathSegments.join('/');
  };

  return (
    <div className={`relative inline-block ${className}`}>
      <select
        value={currentLocale}
        onChange={(e) => handleLocaleChange(e.target.value)}
        className="bg-white border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        dir={currentConfig.dir}
      >
        {supportedLocales.map((locale) => (
          <option key={locale.code} value={locale.code}>
            {showFlags && locale.flag} {locale.nativeName}
          </option>
        ))}
      </select>
    </div>
  );
}

export default LanguageSwitcher;