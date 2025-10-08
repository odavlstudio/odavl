'use client';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Globe } from 'lucide-react';

const locales = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦', rtl: true },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹' },
  { code: 'pt', name: 'Português', flag: '🇵🇹' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
  { code: 'ja', name: '日本語', flag: '🇯🇵' },
  { code: 'zh', name: '中文', flag: '🇨🇳' }
];

export default function LocaleSwitcher() {

  const handleLocaleChange = (newLocale: string) => {
    const currentPath = window.location.pathname;
    const segments = currentPath.split('/').filter(Boolean);
    const currentLocale = segments[0];
    
    // Check if current first segment is a locale
    const supportedLocales = ['en', 'de', 'ar', 'fr', 'es', 'it', 'pt', 'ru', 'ja', 'zh'];
    let newPath: string;
    
    if (supportedLocales.includes(currentLocale)) {
      // Replace current locale with new locale
      segments[0] = newLocale;
      newPath = '/' + segments.join('/');
    } else {
      // No locale in path, add new locale
      newPath = `/${newLocale}${currentPath}`;
    }
    
    window.location.href = newPath;
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2 text-white/80 hover:text-white">
          <Globe className="h-4 w-4" />
          <span className="sr-only">Switch language</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {locales.map((locale) => (
          <DropdownMenuItem
            key={locale.code}
            onClick={() => handleLocaleChange(locale.code)}
            className={`gap-2 ${locale.rtl ? 'text-right' : ''}`}
          >
            <span>{locale.flag}</span>
            <span>{locale.name}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}