// i18n Configuration
export const i18nConfig = {
  defaultLocale: 'en',
  locales: ["en","ar","zh","es","fr","de","ja","pt","ru","ko"],
  fallbackLocale: 'en',
  
  // RTL languages
  rtlLocales: ['ar'],
  
  // Date/time formats per locale
  dateFormats: {
    en: 'MM/DD/YYYY',
    ar: 'DD/MM/YYYY',
    zh: 'YYYY年MM月DD日',
    es: 'DD/MM/YYYY',
    fr: 'DD/MM/YYYY',
    de: 'DD.MM.YYYY',
    ja: 'YYYY年MM月DD日',
    pt: 'DD/MM/YYYY',
    ru: 'DD.MM.YYYY',
    ko: 'YYYY.MM.DD'
  },
  
  // Number formats
  numberFormats: {
    en: { decimal: '.', thousands: ',' },
    ar: { decimal: '٫', thousands: '٬' },
    zh: { decimal: '.', thousands: ',' },
    es: { decimal: ',', thousands: '.' },
    fr: { decimal: ',', thousands: ' ' },
    de: { decimal: ',', thousands: '.' },
    ja: { decimal: '.', thousands: ',' },
    pt: { decimal: ',', thousands: '.' },
    ru: { decimal: ',', thousands: ' ' },
    ko: { decimal: '.', thousands: ',' }
  }
};
