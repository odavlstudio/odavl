import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

export const RTLSupport: React.FC = () => {
  const { i18n } = useTranslation();
  
  useEffect(() => {
    const isRTL = i18n.dir() === 'rtl';
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);
  
  return null;
};

export default RTLSupport;
