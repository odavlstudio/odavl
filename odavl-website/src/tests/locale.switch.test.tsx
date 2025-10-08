// ODAVL-WAVE-X8-INJECT: Locale Switch Tests - i18n Language Switching
// @odavl-governance: TESTING-SAFE mode active

export interface LocaleTestConfig {
  supportedLocales: string[];
  defaultLocale: string;
  rtlLocales: string[];
}

export class LocaleSwitchTester {
  private config: LocaleTestConfig = {
    supportedLocales: ['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'ja', 'ko', 'ar'],
    defaultLocale: 'en',
    rtlLocales: ['ar'],
  };

  testLocaleSupport(locale: string): boolean {
    return this.config.supportedLocales.includes(locale);
  }

  testRTLSupport(locale: string): boolean {
    return this.config.rtlLocales.includes(locale);
  }

  testLocaleSwitch(fromLocale: string, toLocale: string): {
    success: boolean;
    redirectPath: string;
    isRTL: boolean;
  } {
    if (!this.testLocaleSupport(toLocale)) {
      return {
        success: false,
        redirectPath: `/${this.config.defaultLocale}`,
        isRTL: false,
      };
    }

    return {
      success: true,
      redirectPath: `/${toLocale}`,
      isRTL: this.testRTLSupport(toLocale),
    };
  }

  simulateLanguageDetection(): string {
    const browserLanguages = ['en-US', 'en', 'es-ES', 'fr-FR'];
    
    for (const lang of browserLanguages) {
      const cleanLocale = lang.split('-')[0];
      if (this.testLocaleSupport(cleanLocale)) {
        return cleanLocale;
      }
    }
    
    return this.config.defaultLocale;
  }
}