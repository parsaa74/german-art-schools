import { useRouter } from 'next/router';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/utils/i18n';

const LanguageSwitcher = () => {
  const router = useRouter();
  const { locale } = useTranslation();
  
  const toggleLanguage = () => {
    const newLocale = locale === 'en' ? 'de' : 'en';
    router.push(router.pathname, router.asPath, { locale: newLocale });
  };

  return (
    <Button 
      variant="outline" 
      size="sm" 
      onClick={toggleLanguage}
      className="fixed top-4 right-4 z-50"
    >
      {locale === 'en' ? 'DE' : 'EN'}
    </Button>
  );
};

export default LanguageSwitcher;