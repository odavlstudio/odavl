// ODAVL-WAVE-X6-INJECT: Locales Configuration - Master List of 10 Languages
// @odavl-governance: GLOBALIZATION-SAFE mode active

export interface LocaleConfig {
  code: string;
  name: string;
  nativeName: string;
  dir: 'ltr' | 'rtl';
  flag: string;
  region: string;
  dateFormat: string;
  numberFormat: string;
}

export const supportedLocales: LocaleConfig[] = [
  { code: 'en', name: 'English', nativeName: 'English', dir: 'ltr', flag: '🇺🇸', region: 'US', dateFormat: 'MM/dd/yyyy', numberFormat: '1,234.56' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', dir: 'ltr', flag: '🇩🇪', region: 'DE', dateFormat: 'dd.MM.yyyy', numberFormat: '1.234,56' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', dir: 'rtl', flag: '🇸🇦', region: 'SA', dateFormat: 'dd/MM/yyyy', numberFormat: '1,234.56' },
  { code: 'fr', name: 'French', nativeName: 'Français', dir: 'ltr', flag: '🇫🇷', region: 'FR', dateFormat: 'dd/MM/yyyy', numberFormat: '1 234,56' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', dir: 'ltr', flag: '🇪🇸', region: 'ES', dateFormat: 'dd/MM/yyyy', numberFormat: '1.234,56' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', dir: 'ltr', flag: '🇮🇹', region: 'IT', dateFormat: 'dd/MM/yyyy', numberFormat: '1.234,56' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', dir: 'ltr', flag: '🇵🇹', region: 'PT', dateFormat: 'dd/MM/yyyy', numberFormat: '1.234,56' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', dir: 'ltr', flag: '🇷🇺', region: 'RU', dateFormat: 'dd.MM.yyyy', numberFormat: '1 234,56' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', dir: 'ltr', flag: '🇯🇵', region: 'JP', dateFormat: 'yyyy/MM/dd', numberFormat: '1,234.56' },
  { code: 'zh', name: 'Chinese', nativeName: '中文', dir: 'ltr', flag: '🇨🇳', region: 'CN', dateFormat: 'yyyy/MM/dd', numberFormat: '1,234.56' }
];

export const defaultLocale = 'en';
export const localeMap = new Map(supportedLocales.map(l => [l.code, l]));

export function getLocaleConfig(code: string): LocaleConfig {
  return localeMap.get(code) || localeMap.get(defaultLocale)!;
}